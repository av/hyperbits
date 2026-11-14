#!/usr/bin/env node

import { existsSync, realpathSync } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
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
import type {
  BitCatalogEntry,
  BitCatalogSummary,
  BitVariable,
} from "../catalog/contracts";
import { DEFAULT_ADD_DIR } from "../catalog/contracts";
import {
  applyVariableDefaults,
  coerceVariableValue,
  defaultVariableValues,
  variableValuesAttribute,
} from "../catalog/variables";
import { formatSize, parseSize, retargetBitHtml } from "../catalog/retarget";
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
  hyperbits add <name...> [--into <dir>] [--set <id=value>] [--size <WxH|9:16|1:1|16:9>] [--json]
  hyperbits mcp

Commands:
  find   Search the published hyperbits catalog.
  fetch  Retrieve one published bit record, including HTML source.
  add    Write one or more bit HTML files into a HyperFrames project.
  mcp    Start the hyperbits MCP server on stdio.

Options:
  --query, -q   Text query for find.
  --tag, -t     Filter by tag. Repeatable. Comma-separated values are accepted.
  --tags        Alias for --tag.
  --limit, -l   Maximum number of find results.
  --id, -i      Bit id or exact display name to fetch.
  --into        Destination directory for add. Defaults to compositions/.
  --set         New default for a bit variable in the installed copy, as id=value. Repeatable.
  --size        Retarget the bit to WIDTHxHEIGHT before writing. Aliases:
                9:16 (1080x1920), 1:1 (1080x1080), 16:9 (1920x1080).
                Defaults to the bit's native size.
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
  variables: entry.variables.map((variable) => ({ ...variable })),
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

const formatFindBlock = (entry: BitCatalogSummary, index: number): string =>
  [
    formatSummaryBlock(entry, index),
    `   Variables: ${formatTags(entry.variables.map((variable) => variable.id))}`,
  ].join("\n");

const formatVariableDefault = (variable: BitVariable): string =>
  variable.type === "string"
    ? JSON.stringify(variable.default ?? "")
    : String(variable.default);

const formatVariablesSection = (variables: BitVariable[]): string[] => {
  if (variables.length === 0) {
    return ["   Variables: none"];
  }

  const rows = variables.map((variable) => [
    variable.id,
    variable.type,
    formatVariableDefault(variable),
    variable.label ?? "",
  ]);
  const widths = [0, 1, 2].map((column) =>
    Math.max(...rows.map((row) => row[column].length)),
  );

  return [
    "   Variables (id, type, default, label):",
    ...rows.map(
      (row) =>
        `     ${row
          .map((cell, column) =>
            column < widths.length ? cell.padEnd(widths[column]) : cell,
          )
          .join("  ")
          .trimEnd()}`,
    ),
    `   Override per instance: ${variableValuesAttribute(defaultVariableValues(variables))}`,
  ];
};

const formatEntryBlock = (entry: BitCatalogEntry): string =>
  [
    formatSummaryBlock(entry),
    `   Embed: ${entry.embedSnippet}`,
    `   Helper script: ${entry.helperScriptTag}`,
    ...formatVariablesSection(entry.variables),
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

const parseSetAssignments = (values: string[]): Map<string, string> => {
  const assignments = new Map<string, string>();

  for (const value of values) {
    const separator = value.indexOf("=");
    const id = separator > 0 ? value.slice(0, separator).trim() : "";
    if (!id) {
      throw new CliError(
        `The --set value "${value}" must look like id=value, for example --set background=#000000.`,
        EXIT_INVALID_INPUT,
        "invalid-set",
      );
    }
    assignments.set(id, value.slice(separator + 1));
  }

  return assignments;
};

const parseSizeOption = (value: string | undefined) => {
  if (value === undefined) return undefined;
  try {
    return parseSize(value);
  } catch (error) {
    throw new CliError(
      error instanceof Error ? error.message : String(error),
      EXIT_INVALID_INPUT,
      "invalid-size",
    );
  }
};

const parseAddArguments = (args: string[]) => {
  let parsed;

  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        into: { type: "string" },
        set: { type: "string", multiple: true },
        size: { type: "string" },
        json: { type: "boolean", short: "j" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (error) {
    throw toCliParseError(error);
  }

  const positionals = parsed.positionals
    .map((value) => value.trim())
    .filter(Boolean);
  const joined = positionals.join(" ");
  const identifiers =
    positionals.length > 1 && resolveBitCatalogIdentifier(joined).entry
      ? [joined]
      : positionals;

  if (!parsed.values.help && identifiers.length === 0) {
    throw new CliError(
      "The add command requires a bit id or exact display name.",
      EXIT_INVALID_INPUT,
      "missing-identifier",
    );
  }

  return {
    json: parsed.values.json ?? false,
    help: parsed.values.help ?? false,
    identifiers,
    into: parsed.values.into ?? DEFAULT_ADD_DIR,
    assignments: parseSetAssignments(parsed.values.set ?? []),
    size: parseSizeOption(parsed.values.size),
  };
};

const HELPER_BUNDLE_FILE = "hyperbits.iife.js";
const LOCAL_HELPER_SRC = `./${HELPER_BUNDLE_FILE}`;
const localHelperScriptTag = helperScriptTag();

const prepareInstalledHtml = (html: string): string =>
  html.replaceAll(`src="${HELPER_BUNDLE_FILE}"`, `src="${LOCAL_HELPER_SRC}"`);

const findHelperBundle = (): string | null => {
  const candidates = [
    new URL(`../${HELPER_BUNDLE_FILE}`, import.meta.url),
    new URL(`../../dist/${HELPER_BUNDLE_FILE}`, import.meta.url),
  ];
  for (const candidate of candidates) {
    const candidatePath = fileURLToPath(candidate);
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }
  return null;
};

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
    `${results.map((entry, index) => formatFindBlock(entry, index)).join("\n\n")}\n`,
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

const resolveAddIdentifier = (identifier: string): string => {
  const resolution = resolveBitCatalogIdentifier(identifier);

  if (resolution.entry) {
    return resolution.entry.id;
  }

  if (resolution.reason === "ambiguous-name") {
    throw new CliError(
      `The identifier "${identifier}" matches multiple bits. Use one of: ${(resolution.matches ?? []).join(", ")}`,
      EXIT_INVALID_INPUT,
      "ambiguous-name",
      { matches: resolution.matches ?? [] },
    );
  }

  throw notFoundError(identifier);
};

type AddPlan = {
  bit: BitCatalogEntry;
  overrides: Record<string, unknown>;
  skipped: string[];
};

const planVariableOverrides = (
  bits: BitCatalogEntry[],
  assignments: Map<string, string>,
): AddPlan[] => {
  const plans = bits.map((bit) => ({
    bit,
    overrides: {} as Record<string, unknown>,
    skipped: [] as string[],
  }));

  for (const [id, raw] of assignments) {
    const declaring = plans.filter((plan) =>
      plan.bit.variables.some((variable) => variable.id === id),
    );

    if (declaring.length === 0) {
      const declared = dedupeStrings(
        bits.flatMap((bit) => bit.variables.map((variable) => variable.id)),
      );
      throw new CliError(
        `No bit in this add declares a variable "${id}". Declared: ${formatTags(declared)}.`,
        EXIT_INVALID_INPUT,
        "unknown-variable",
      );
    }

    for (const plan of plans) {
      const variable = plan.bit.variables.find((entry) => entry.id === id);
      if (!variable) {
        plan.skipped.push(id);
        continue;
      }
      try {
        plan.overrides[id] = coerceVariableValue(variable, raw);
      } catch (error) {
        throw new CliError(
          `Invalid --set ${id} for ${plan.bit.id}: ${error instanceof Error ? error.message : String(error)}`,
          EXIT_INVALID_INPUT,
          "invalid-variable-value",
        );
      }
    }
  }

  return plans;
};

const formatAssignment = (id: string, value: unknown): string =>
  `${id}=${typeof value === "string" ? value : JSON.stringify(value)}`;

const withVariableValues = (
  embedSnippet: string,
  variables: BitVariable[],
): string =>
  embedSnippet.replace(
    /><\/div>$/,
    () =>
      ` ${variableValuesAttribute(defaultVariableValues(variables))}></div>`,
  );

const runAddCommand = async (args: string[], io: CliIo): Promise<number> => {
  const options = parseAddArguments(args);

  if (options.help) {
    io.stdout.write(usage);
    return EXIT_SUCCESS;
  }

  const ids = dedupeStrings(options.identifiers.map(resolveAddIdentifier));
  const bits: BitCatalogEntry[] = [];
  for (const id of ids) {
    const bit = await fetchBit(id);
    if (!bit) {
      throw notFoundError(id);
    }
    bits.push(bit);
  }

  const plans = planVariableOverrides(bits, options.assignments);
  const into = options.into.replace(/\/+$/, "") || DEFAULT_ADD_DIR;
  await mkdir(into, { recursive: true });

  const results = [];
  for (const plan of plans) {
    const outputPath = path.join(into, `${plan.bit.id}.html`);
    let html = prepareInstalledHtml(
      options.size
        ? retargetBitHtml(plan.bit.sourceCode, options.size)
        : plan.bit.sourceCode,
    );
    let variables = plan.bit.variables;
    let warnings: string[] = [];
    if (Object.keys(plan.overrides).length > 0) {
      const applied = applyVariableDefaults(html, variables, plan.overrides);
      html = applied.html;
      variables = applied.variables;
      warnings = applied.warnings;
    }
    await writeFile(outputPath, html, "utf8");
    results.push({
      plan,
      variables,
      warnings,
      path: outputPath.split(path.sep).join("/"),
      embedSnippet: compositionSrcSnippet(plan.bit.id, into),
    });
  }

  const bundleSource = findHelperBundle();
  const bundlePath = path.join(into, HELPER_BUNDLE_FILE);
  if (bundleSource) {
    await copyFile(bundleSource, bundlePath);
  }

  if (options.json) {
    const records = results.map((result) => ({
      id: result.plan.bit.id,
      name: result.plan.bit.name,
      path: result.path,
      ...(options.size ? { size: formatSize(options.size) } : {}),
      embedSnippet: result.embedSnippet,
      helperScriptTag: localHelperScriptTag,
      ...(options.assignments.size > 0
        ? { set: result.plan.overrides, skipped: result.plan.skipped }
        : {}),
      ...(result.warnings.length > 0 ? { warnings: result.warnings } : {}),
    }));
    io.stdout.write(
      stringifyJson({ added: records.length === 1 ? records[0] : records }),
    );
    return EXIT_SUCCESS;
  }

  const lines: string[] = [];
  for (const result of results) {
    lines.push(
      `Wrote ${result.path}${options.size ? ` at ${formatSize(options.size)}` : ""}`,
    );
    for (const [id, value] of Object.entries(result.plan.overrides)) {
      lines.push(`  Set ${formatAssignment(id, value)}`);
    }
    for (const id of result.plan.skipped) {
      lines.push(`  Skipped --set ${id}: ${result.plan.bit.id} has no "${id}" variable`);
    }
    for (const warning of result.warnings) {
      lines.push(`  Warning: ${warning}`);
    }
  }
  lines.push(
    bundleSource
      ? `Wrote ${bundlePath.split(path.sep).join("/")} (helper bundle the ${results.length === 1 ? "bit loads" : "bits load"})`
      : `Warning: ${HELPER_BUNDLE_FILE} was not found in this install; copy it next to the bit.`,
  );

  for (const result of results) {
    lines.push(
      "",
      results.length === 1 ? "Embed with:" : `Embed ${result.plan.bit.id} with:`,
      result.embedSnippet,
    );
    if (result.variables.length > 0) {
      lines.push(
        "",
        "Override variables per instance (edit the values):",
        withVariableValues(result.embedSnippet, result.variables),
      );
    }
  }

  lines.push(
    "",
    "Helper script (already referenced by the bit):",
    localHelperScriptTag,
    "",
  );
  io.stdout.write(lines.join("\n"));
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
