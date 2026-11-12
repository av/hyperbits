// @vitest-environment node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

let client: Client;

beforeAll(async () => {
  client = new Client({ name: "hyperbits-variables-test", version: "1.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [
        path.join(repositoryRoot, "node_modules", "tsx", "dist", "cli.mjs"),
        path.join(repositoryRoot, "scripts", "hyperbits-mcp.ts"),
      ],
      cwd: repositoryRoot,
      stderr: "pipe",
    }),
  );
});

afterAll(async () => {
  await client.close();
});

describe("hyperbits mcp variables", () => {
  it("lists variable ids on find_hyperbits results", async () => {
    const result = await client.callTool({
      name: "find_hyperbits",
      arguments: { query: "fade in", limit: 1 },
    });

    const payload = result.structuredContent as {
      results: Array<Record<string, unknown>>;
    };
    expect(payload.results[0]).toMatchObject({
      id: "fade-in",
      variableIds: ["text", "color", "background"],
    });
    expect(payload.results[0]).not.toHaveProperty("variables");
  });

  it("returns full variable declarations from fetch_hyperbit", async () => {
    const result = await client.callTool({
      name: "fetch_hyperbit",
      arguments: { id: "fade-in" },
    });

    const payload = result.structuredContent as {
      bit: { variables: unknown[] };
    };
    expect(payload.bit.variables).toEqual([
      { id: "text", type: "string", label: "Text", default: "Hello World" },
      { id: "color", type: "color", label: "Text color", default: "#fcc192" },
      {
        id: "background",
        type: "color",
        label: "Background",
        default: "#100f0f",
      },
    ]);
  });

  it("tells agents how to theme bits in the tool descriptions", async () => {
    const { tools } = await client.listTools();
    const fetchTool = tools.find((tool) => tool.name === "fetch_hyperbit");
    const findTool = tools.find((tool) => tool.name === "find_hyperbits");
    expect(fetchTool?.description).toContain("data-variable-values");
    expect(findTool?.description).toContain("variableIds");
  });
});
