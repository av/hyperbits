// @vitest-environment node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

const createClient = async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.join(repositoryRoot, "node_modules", "tsx", "dist", "cli.mjs"),
      path.join(repositoryRoot, "scripts", "hyperbits-mcp.ts"),
    ],
    cwd: repositoryRoot,
    stderr: "pipe",
  });
  const client = new Client({ name: "hyperbits-size-test", version: "1.0.0" });
  await client.connect(transport);
  return client;
};

describe("fetch_hyperbit size", () => {
  it("returns the bit retargeted to the requested size", async () => {
    const client = await createClient();
    try {
      const result = await client.callTool({
        name: "fetch_hyperbit",
        arguments: { id: "fade-in", size: "9:16" },
      });

      expect(result.isError).not.toBe(true);
      const { bit } = result.structuredContent as {
        bit: { width: number; height: number; sourceCode: string };
      };
      expect(bit.width).toBe(1080);
      expect(bit.height).toBe(1920);
      expect(bit.sourceCode).toContain('data-height="1920"');
      expect(bit.sourceCode).toContain('content="width=1080, height=1920"');
    } finally {
      await client.close();
    }
  });

  it("rejects an invalid size", async () => {
    const client = await createClient();
    try {
      await expect(
        client.callTool({
          name: "fetch_hyperbit",
          arguments: { id: "fade-in", size: "wide" },
        }),
      ).rejects.toThrow(/Invalid size/);
    } finally {
      await client.close();
    }
  });
});
