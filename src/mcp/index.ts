import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

import {
  fetchBit,
  findBits,
  formatBitSuggestions,
  suggestBitIdentifiers,
} from "../catalog/runtime";
import type {
  BitCatalogEntry,
  BitCatalogSummary,
  FindBitsOptions,
} from "../catalog/contracts";

type JsonObject = Record<string, unknown>;

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as { version?: string };

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `The ${fieldName} field must be a non-empty string.`,
    );
  }

  return value;
};

const assertOptionalString = (
  value: unknown,
  fieldName: string,
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      `The ${fieldName} field must be a string.`,
    );
  }

  return value;
};

const assertOptionalTags = (value: unknown): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "The tags field must be an array of strings.",
    );
  }

  return value;
};

const assertOptionalLimit = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "The limit field must be a positive integer.",
    );
  }

  return value;
};

const parseFindArguments = (value: unknown): FindBitsOptions => {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "find_hyperbits arguments must be an object.",
    );
  }

  return {
    query: assertOptionalString(value.query, "query"),
    tags: assertOptionalTags(value.tags),
    limit: assertOptionalLimit(value.limit),
  };
};

const parseFetchArguments = (value: unknown): { id: string } => {
  if (!isRecord(value)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "fetch_hyperbit arguments must be an object.",
    );
  }

  return {
    id: assertString(value.id, "id"),
  };
};

const toTextContent = (
  payload: { results: BitCatalogSummary[] } | { bit: BitCatalogEntry },
) => [
  {
    type: "text" as const,
    text: JSON.stringify(payload, null, 2),
  },
];

const createSuccessResult = (
  payload: { results: BitCatalogSummary[] } | { bit: BitCatalogEntry },
): CallToolResult => ({
  content: toTextContent(payload),
  structuredContent: payload,
});

const createErrorResult = (message: string): CallToolResult => ({
  isError: true,
  content: [
    {
      type: "text",
      text: message,
    },
  ],
});

const toolDefinitions: Tool[] = [
  {
    name: "find_hyperbits",
    title: "Find Hyperbits",
    description:
      "Search the live hyperbits catalog by visual goal, tags, and result limit.",
    annotations: {
      title: "Find Hyperbits",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: {
          type: "string",
          description: "Free-text visual goal or style query.",
        },
        tags: {
          type: "array",
          description: "Optional tag filter applied with AND semantics.",
          items: { type: "string" },
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return.",
          minimum: 1,
        },
      },
    },
  },
  {
    name: "fetch_hyperbit",
    title: "Fetch Hyperbit",
    description:
      "Fetch one live hyperbit by id or exact display name, including metadata, HTML source, helpers, and the data-composition-src embed snippet.",
    annotations: {
      title: "Fetch Hyperbit",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: {
          type: "string",
          description:
            "Bit id returned by find_hyperbits, or the exact display name.",
        },
      },
      required: ["id"],
    },
  },
];

export const createHyperbitsMcpServer = (): Server => {
  const server = new Server(
    {
      name: "hyperbits",
      version: packageJson.version ?? "0.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
      instructions:
        "Use find_hyperbits first, then fetch_hyperbit for the best one or two matches. Embed with data-composition-src and the hyperbits helper script.",
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: input } = request.params;

    if (name === "find_hyperbits") {
      return createSuccessResult({
        results: findBits(parseFindArguments(input)),
      });
    }

    if (name === "fetch_hyperbit") {
      const { id } = parseFetchArguments(input);
      const bit = await fetchBit(id);

      if (!bit) {
        const suggestions = suggestBitIdentifiers(id);
        return createErrorResult(
          `No bit found for "${id}".${formatBitSuggestions(suggestions)}`,
        );
      }

      return createSuccessResult({ bit });
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  });

  return server;
};

export const startHyperbitsMcpServer = async (): Promise<void> => {
  const server = createHyperbitsMcpServer();
  const transport = new StdioServerTransport();

  const shutdown = async () => {
    await server.close();
  };

  process.on("SIGINT", () => {
    void shutdown().finally(() => {
      process.exit(0);
    });
  });

  process.on("SIGTERM", () => {
    void shutdown().finally(() => {
      process.exit(0);
    });
  });

  await server.connect(transport);
  console.error("hyperbits MCP server running on stdio");
};

const isMcpEntry = (): boolean => {
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

if (isMcpEntry()) {
  startHyperbitsMcpServer().catch((error) => {
    console.error("Fatal error in hyperbits MCP server:", error);
    process.exit(1);
  });
}
