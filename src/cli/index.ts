#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  compositionSrcSnippet,
  fetchBit,
  findBits,
  formatBitSuggestions,
  helperScriptTag,
  resolveBitCatalogIdentifier,
  suggestBitIdentifiers,
} from "../catalog/runtime";
import type { BitCatalogEntry, BitCatalogSummary } from "../catalog/contracts";
import { DEFAULT_ADD_DIR } from "../catalog/contracts";
import { HYPERBITS_UNPKG_IIFE } from "../catalog/bit-schema";
import { startHyperbitsMcpServer } from "../mcp/index";

type Writable = {
  write: (value: string) => void;
};

interface CliIo {
  stdout: Writable;
  stderr: Writable;
}

type CliErrorDetails = {
  matches?: string[];
  suggestions?: string[];
};

class CliError extends Error {
  public readonly exitCode: number;
  public readonly code: string;
  public readonly details?: CliErrorDetails;

  constructor(
    message: string,
    exitCode: number,
    code: string,
    details?: CliErrorDetails,
  ) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
    this.code = code;
    this.details = details;
  }
}

const EXIT_SUCCESS = 0;
const EXIT_INVALID_INPUT = 2;
const EXIT_NOT_FOUND = 3;

export const usage = `Usage:
  hyperbits find [query] [--query <text>] [--tag <tag>] [--tags <tag1,tag2>] [--limit <number>] [--json]
  hyperbits fetch <id-or-name> [--id <id-or-name>] [--json]
  hyperbits add <name> [--into <dir>] [--json]
  hyperbits mcp

Commands:
  find   Search the published hyperbits catalog.
  fetch  Retrieve one published bit record, including HTML source.
  add    Write a bit HTML file into a HyperFrames project.
  mcp    Start the hyperbits MCP server on stdio.

Options:
  --query, -q   Text query for find.
  --tag, -t     Filter by tag. Repeatable. Comma-separated values are accepted.
  --tags        Alias for --tag.
  --limit, -l   Maximum number of find results.
  --id, -i      Bit id or exact display name to fetch.
  --into        Destination directory for add. Defaults to compositions/.
  --json, -j    Emit deterministic JSON output.
  --help, -h    Show usage.
`;

const dedupeStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      deduped.push(value);
    }
  }

  return deduped;
};

const collectTags = (values: Array<string | undefined>): string[] =>
  dedupeStrings(
    values
      .flatMap((value) => (value ?? "").split(","))
      .map((value) => value.trim())
      .filter(Boolean),
  );

const parseLimit = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new CliError(
      "The --limit value must be a positive integer.",
      EXIT_INVALID_INPUT,
      "invalid-limit",
    );
  }

  return limit;
};

const serializeSummary = (entry: BitCatalogSummary) => ({
  id: entry.id,
  exportName: entry.exportName,
  name: entry.name,
  description: entry.description,
  tags: [...entry.tags],
  duration: entry.duration,
  width: entry.width,
  height: entry.height,
  sourcePath: entry.sourcePath,
  componentNames: [...entry.componentNames],
  registryDependencies: [...entry.registryDependencies],
  helpers: [...entry.helpers],
});

const serializeEntry = (entry: BitCatalogEntry) => ({
  ...serializeSummary(entry),
  sourceCode: entry.sourceCode,
  embedSnippet: entry.embedSnippet,
  helperScriptTag: entry.helperScriptTag,
});

const stringifyJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

const COMMANDS = ["find", "fetch", "add", "mcp"] as const;

const notFoundError = (identifier: string): CliError => {
  const suggestions = suggestBitIdentifiers(identifier);
  return new CliError(
    `No bit found for "${identifier}".${formatBitSuggestions(suggestions)}`,
    EXIT_NOT_FOUND,
    "not-found",
    suggestions.length > 0 ? { suggestions } : undefined,
  );
};

const commandDistance = (left: string, right: string): number => {
  if (left === right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);
  for (let i = 0; i < left.length; i++) {
    current[0] = i + 1;
    for (let j = 0; j < right.length; j++) {
      const cost = left[i] === right[j] ? 0 : 1;
      current[j + 1] = Math.min(
        current[j] + 1,
        previous[j + 1] + 1,
        previous[j] + cost,
      );
    }
    for (let j = 0; j <= right.length; j++) {
      previous[j] = current[j];
    }
  }
  return previous[right.length];
};

const closestCommand = (value: string): string | undefined => {
  const normalized = value.trim().toLowerCase();
  const ranked = COMMANDS.map((command) => {
    const prefix =
      command.startsWith(normalized) || normalized.startsWith(command);
    return {
      command,
      distance: prefix ? 0 : commandDistance(normalized, command),
    };
  })
    .filter((entry) => entry.distance <= 2)
    .sort((left, right) => left.distance - right.distance);
  return ranked[0]?.command;
};

const formatTags = (tags: string[]): string =>
  tags.length > 0 ? tags.join(", ") : "none";

const formatDimensions = (entry: BitCatalogSummary): string => {
  if (entry.width === undefined || entry.height === undefined) {
    return "auto";
  }

  return `${entry.width}x${entry.height}`;
};

const formatSummaryBlock = (
  entry: BitCatalogSummary,
  index?: number,
): string => {
  const header = index === undefined ? entry.id : `${index + 1}. ${entry.id}`;

  return [
    header,
    `   Name: ${entry.name}`,
    `   Export: ${entry.exportName}`,
    `   Description: ${entry.description}`,
    `   Tags: ${formatTags(entry.tags)}`,
    `   Duration: ${entry.duration}`,
    `   Dimensions: ${formatDimensions(entry)}`,
    `   Source: ${entry.sourcePath}`,
    `   Helpers: ${formatTags(entry.helpers)}`,
    `   Components: ${formatTags(entry.componentNames)}`,
    `   Registry dependencies: ${formatTags(entry.registryDependencies)}`,
  ].join("\n");
};

const formatEntryBlock = (entry: BitCatalogEntry): string =>
  [
    formatSummaryBlock(entry),
    `   Embed: ${entry.embedSnippet}`,
    `   Helper script: ${entry.helperScriptTag}`,
    "   Source code:",
    entry.sourceCode,
  ].join("\n");

const writeJsonError = (io: CliIo, error: CliError): void => {
  io.stdout.write(
    stringifyJson({
      error: {
        code: error.code,
        message: error.message,
        ...error.details,
      },
    }),
  );
};

const writeHumanError = (io: CliIo, error: CliError): void => {
  io.stderr.write(`${error.message}\n`);
};

const toCliParseError = (error: unknown): CliError => {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError(error.message, EXIT_INVALID_INPUT, "invalid-arguments");
  }

  return new CliError(
    "Invalid command arguments.",
    EXIT_INVALID_INPUT,
    "invalid-arguments",
  );
};

const parseFindArguments = (args: string[]) => {
  let parsed;

  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        query: { type: "string", short: "q" },
        tag: { type: "string", short: "t", multiple: true },
        tags: { type: "string", multiple: true },
        limit: { type: "string", short: "l" },
        json: { type: "boolean", short: "j" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (error) {
    throw toCliParseError(error);
  }

  const positionalQuery = parsed.positionals.join(" ").trim();
  const query = parsed.values.query ?? (positionalQuery || undefined);

  return {
    json: parsed.values.json ?? false,
    help: parsed.values.help ?? false,
    query,
    tags: collectTags([
      ...(parsed.values.tag ?? []),
      ...(parsed.values.tags ?? []),
    ]),
    limit: parseLimit(parsed.values.limit),
  };
};

const parseFetchArguments = (args: string[]) => {
  let parsed;

  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        id: { type: "string", short: "i" },
        json: { type: "boolean", short: "j" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (error) {
    throw toCliParseError(error);
  }

  const positionalIdentifier = parsed.positionals.join(" ").trim();
  const identifier = (parsed.values.id ?? positionalIdentifier).trim();

  if (!parsed.values.help && !identifier) {
    throw new CliError(
      "The fetch command requires a bit id or exact display name.",
      EXIT_INVALID_INPUT,
      "missing-identifier",
    );
  }

  if (parsed.values.id && positionalIdentifier) {
    throw new CliError(
      "Provide the fetch identifier either positionally or with --id, not both.",
      EXIT_INVALID_INPUT,
      "conflicting-identifier",
    );
  }

  return {
    json: parsed.values.json ?? false,
    help: parsed.values.help ?? false,
    identifier,
  };
};

const parseAddArguments = (args: string[]) => {
  let parsed;

  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        into: { type: "string" },
        json: { type: "boolean", short: "j" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (error) {
    throw toCliParseError(error);
  }

  const identifier = parsed.positionals.join(" ").trim();

  if (!parsed.values.help && !identifier) {
    throw new CliError(
      "The add command requires a bit id or exact display name.",
      EXIT_INVALID_INPUT,
      "missing-identifier",
    );
  }

  return {
    json: parsed.values.json ?? false,
    help: parsed.values.help ?? false,
    identifier,
    into: parsed.values.into ?? DEFAULT_ADD_DIR,
  };
};

const prepareInstalledHtml = (html: string): string =>
  html.replaceAll('src="hyperbits.iife.js"', `src="${HYPERBITS_UNPKG_IIFE}"`);

const runFindCommand = async (args: string[], io: CliIo): Promise<number> => {
  const options = parseFindArguments(args);

  if (options.help) {
    io.stdout.write(usage);
    return EXIT_SUCCESS;
  }

  const results = findBits({
    query: options.query,
    tags: options.tags,
    limit: options.limit,
  });

  if (options.json) {
    io.stdout.write(
      stringifyJson({
        results: results.map((entry) => serializeSummary(entry)),
      }),
    );
    return EXIT_SUCCESS;
  }

  if (results.length === 0) {
    io.stdout.write("No bits found.\n");
    return EXIT_SUCCESS;
  }

  io.stdout.write(
    `${results.map((entry, index) => formatSummaryBlock(entry, index)).join("\n\n")}\n`,
  );
  return EXIT_SUCCESS;
};

const runFetchCommand = async (args: string[], io: CliIo): Promise<number> => {
  const options = parseFetchArguments(args);

  if (options.help) {
    io.stdout.write(usage);
    return EXIT_SUCCESS;
  }

  const resolution = resolveBitCatalogIdentifier(options.identifier);

  if (!resolution.entry) {
    if (resolution.reason === "ambiguous-name") {
      throw new CliError(
        `The identifier "${options.identifier}" matches multiple bits. Use one of: ${(resolution.matches ?? []).join(", ")}`,
        EXIT_INVALID_INPUT,
        "ambiguous-name",
        { matches: resolution.matches ?? [] },
      );
    }

    throw notFoundError(options.identifier);
  }

  const bit = await fetchBit(options.identifier);

  if (!bit) {
    throw notFoundError(options.identifier);
  }

  if (options.json) {
    io.stdout.write(stringifyJson({ bit: serializeEntry(bit) }));
    return EXIT_SUCCESS;
  }

  io.stdout.write(`${formatEntryBlock(bit)}\n`);
  return EXIT_SUCCESS;
};

const runAddCommand = async (args: string[], io: CliIo): Promise<number> => {
  const options = parseAddArguments(args);

  if (options.help) {
    io.stdout.write(usage);
    return EXIT_SUCCESS;
  }

  const resolution = resolveBitCatalogIdentifier(options.identifier);

  if (!resolution.entry) {
    if (resolution.reason === "ambiguous-name") {
      throw new CliError(
        `The identifier "${options.identifier}" matches multiple bits. Use one of: ${(resolution.matches ?? []).join(", ")}`,
        EXIT_INVALID_INPUT,
        "ambiguous-name",
        { matches: resolution.matches ?? [] },
      );
    }

    throw notFoundError(options.identifier);
  }

  const bit = await fetchBit(options.identifier);

  if (!bit) {
    throw notFoundError(options.identifier);
  }

  const into = options.into.replace(/\/+$/, "") || DEFAULT_ADD_DIR;
  const outputPath = path.join(into, `${bit.id}.html`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, prepareInstalledHtml(bit.sourceCode), "utf8");

  const embedSnippet = compositionSrcSnippet(bit.id, into);
  const scriptTag = helperScriptTag();

  if (options.json) {
    io.stdout.write(
      stringifyJson({
        added: {
          id: bit.id,
          name: bit.name,
          path: outputPath.split(path.sep).join("/"),
          embedSnippet,
          helperScriptTag: scriptTag,
        },
      }),
    );
    return EXIT_SUCCESS;
  }

  io.stdout.write(
    [
      `Wrote ${outputPath.split(path.sep).join("/")}`,
      "",
      "Embed with:",
      embedSnippet,
      "",
      "Helper script:",
      scriptTag,
      "",
    ].join("\n"),
  );
  return EXIT_SUCCESS;
};

const runMcpCommand = async (args: string[], io: CliIo): Promise<number> => {
  if (args.includes("--help") || args.includes("-h")) {
    io.stdout.write(usage);
    return EXIT_SUCCESS;
  }

  await startHyperbitsMcpServer();
  return EXIT_SUCCESS;
};

export const runHyperbitsCli = async (
  args: string[],
  io: CliIo = process,
): Promise<number> => {
  const [command, ...rest] = args;

  if (
    !command ||
    command === "--help" ||
    command === "-h" ||
    command === "help"
  ) {
    io.stdout.write(usage);
    return command ? EXIT_SUCCESS : EXIT_INVALID_INPUT;
  }

  try {
    if (command === "find") {
      return await runFindCommand(rest, io);
    }

    if (command === "fetch") {
      return await runFetchCommand(rest, io);
    }

    if (command === "add") {
      return await runAddCommand(rest, io);
    }

    if (command === "mcp") {
      return await runMcpCommand(rest, io);
    }

    const suggestion = closestCommand(command);
    throw new CliError(
      `Unknown command "${command}". Expected find, fetch, add, or mcp.${
        suggestion ? ` Did you mean: ${suggestion}?` : ""
      }`,
      EXIT_INVALID_INPUT,
      "unknown-command",
      suggestion ? { suggestions: [suggestion] } : undefined,
    );
  } catch (error) {
    if (error instanceof CliError) {
      const jsonRequested = rest.includes("--json") || rest.includes("-j");

      if (jsonRequested) {
        writeJsonError(io, error);
      } else {
        writeHumanError(io, error);
      }

      return error.exitCode;
    }

    throw error;
  }
};

const isCliEntry = (): boolean => {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(entry);
  } catch {
    return false;
  }
};

if (isCliEntry()) {
  const exitCode = await runHyperbitsCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
