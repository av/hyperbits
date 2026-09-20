// @vitest-environment node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const tsxCliPath = path.join(
  repositoryRoot,
  "node_modules",
  "tsx",
  "dist",
  "cli.mjs",
);
const serverScriptPath = path.join(
  repositoryRoot,
  "scripts",
  "hyperbits-mcp.ts",
);

const createClient = async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [tsxCliPath, serverScriptPath],
    cwd: repositoryRoot,
    stderr: "pipe",
  });

  let stderr = "";
  const stderrStream = transport.stderr;
  if (stderrStream) {
    stderrStream.on("data", (chunk) => {
      stderr += chunk.toString();
    });
  }

  const client = new Client({
    name: "hyperbits-test-client",
    version: "1.0.0",
  });

  await client.connect(transport);

  return {
    client,
    getStderr: () => stderr,
    close: async () => {
      await client.close();
    },
  };
};

describe("hyperbits mcp server", () => {
  it("exposes exactly the two required tools", async () => {
    const session = await createClient();

    try {
      const result = await session.client.listTools();

      expect(result.tools.map((tool) => tool.name)).toEqual([
        "find_hyperbits",
        "fetch_hyperbit",
      ]);
      expect(result.tools).toHaveLength(2);
      expect(session.getStderr()).toContain(
        "hyperbits MCP server running on stdio",
      );
    } finally {
      await session.close();
    }
  });

  it("returns shared catalog discovery results from find_hyperbits", async () => {
    const session = await createClient();

    try {
      const result = await session.client.callTool({
        name: "find_hyperbits",
        arguments: {
          query: "camera presentation",
          tags: ["3d"],
          limit: 2,
        },
      });

      expect(result.isError).not.toBe(true);
      const payload = result.structuredContent as {
        results: Array<{ id: string; sourcePath: string }>;
      };
      expect(payload.results.length).toBeGreaterThan(0);
      expect(payload.results.length).toBeLessThanOrEqual(2);
      expect(payload.results[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          sourcePath: expect.stringContaining("bits/scenes-3d/"),
        }),
      );
      expect(result.content[0]).toMatchObject({
        type: "text",
      });
    } finally {
      await session.close();
    }
  });

  it("returns a full bit record from fetch_hyperbit", async () => {
    const session = await createClient();

    try {
      const result = await session.client.callTool({
        name: "fetch_hyperbit",
        arguments: {
          id: "fade-in",
        },
      });

      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toEqual({
        bit: expect.objectContaining({
          id: "fade-in",
          name: "Fade In",
          sourcePath: "bits/text-animations/fade-in/index.html",
          sourceCode: expect.stringContaining("data-composition-id"),
          embedSnippet:
            '<div data-composition-src="compositions/fade-in.html"></div>',
        }),
      });
    } finally {
      await session.close();
    }
  });

  it("rejects malformed MCP input for find_hyperbits", async () => {
    const session = await createClient();

    try {
      await expect(
        session.client.callTool({
          name: "find_hyperbits",
          arguments: {
            limit: 0,
          },
        }),
      ).rejects.toThrow("The limit field must be a positive integer.");
    } finally {
      await session.close();
    }
  });
});
