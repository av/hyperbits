// @vitest-environment node

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runHyperbitsCli } from "../index";

const createIo = () => {
  let stdout = "";
  let stderr = "";

  return {
    io: {
      stdout: {
        write: (value: string) => {
          stdout += value;
        },
      },
      stderr: {
        write: (value: string) => {
          stderr += value;
        },
      },
    },
    getStdout: () => stdout,
    getStderr: () => stderr,
  };
};

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("hyperbits lookup cli", () => {
  it("prints deterministic JSON results for find", async () => {
    const { io, getStdout, getStderr } = createIo();

    const exitCode = await runHyperbitsCli(
      ["find", "--query", "fade in", "--limit", "1", "--json"],
      io,
    );

    expect(exitCode).toBe(0);
    expect(getStderr()).toBe("");

    expect(JSON.parse(getStdout())).toEqual({
      results: [
        expect.objectContaining({
          id: "fade-in",
          name: "Fade In",
          sourcePath: "bits/text-animations/fade-in/index.html",
        }),
      ],
    });
  });

  it("accepts repeated and comma-separated tag filters for find", async () => {
    const { io, getStdout } = createIo();

    const exitCode = await runHyperbitsCli(
      ["find", "--tag", "text", "--tag", "fade,basic", "--limit", "1"],
      io,
    );

    expect(exitCode).toBe(0);
    expect(getStdout()).toContain("1. fade-in");
    expect(getStdout()).toContain("Tags: text, fade, basic");
  });

  it("fetches a live bit by id in JSON mode", async () => {
    const { io, getStdout, getStderr } = createIo();

    const exitCode = await runHyperbitsCli(["fetch", "fade-in", "--json"], io);

    expect(exitCode).toBe(0);
    expect(getStderr()).toBe("");

    expect(JSON.parse(getStdout())).toEqual({
      bit: expect.objectContaining({
        id: "fade-in",
        name: "Fade In",
        sourcePath: "bits/text-animations/fade-in/index.html",
        sourceCode: expect.stringContaining("data-composition-id"),
        embedSnippet:
          '<div data-composition-src="compositions/fade-in.html"></div>',
        helperScriptTag: expect.stringContaining("hyperbits.iife.js"),
      }),
    });
  });

  it("fetches a live bit by exact name in human-readable mode", async () => {
    const { io, getStdout } = createIo();

    const exitCode = await runHyperbitsCli(["fetch", "Fade In"], io);

    expect(exitCode).toBe(0);
    expect(getStdout()).toContain("fade-in");
    expect(getStdout()).toContain("Source code:");
    expect(getStdout()).toContain("data-composition-id");
  });

  it("returns a structured JSON error for invalid limits", async () => {
    const { io, getStdout, getStderr } = createIo();

    const exitCode = await runHyperbitsCli(
      ["find", "--query", "fade", "--limit", "0", "--json"],
      io,
    );

    expect(exitCode).toBe(2);
    expect(getStderr()).toBe("");
    expect(JSON.parse(getStdout())).toEqual({
      error: {
        code: "invalid-limit",
        message: "The --limit value must be a positive integer.",
      },
    });
  });

  it("returns a structured JSON error for unknown bits", async () => {
    const { io, getStdout } = createIo();

    const exitCode = await runHyperbitsCli(
      ["fetch", "bit-does-not-exist", "--json"],
      io,
    );

    expect(exitCode).toBe(3);
    expect(JSON.parse(getStdout())).toEqual({
      error: {
        code: "not-found",
        message: 'No bit found for "bit-does-not-exist".',
      },
    });
  });

  it("prints usage for --help", async () => {
    const { io, getStdout, getStderr } = createIo();
    const exitCode = await runHyperbitsCli(["--help"], io);
    expect(exitCode).toBe(0);
    expect(getStderr()).toBe("");
    expect(getStdout()).toContain("hyperbits find");
    expect(getStdout()).toContain("hyperbits fetch");
    expect(getStdout()).toContain("hyperbits add");
    expect(getStdout()).toContain("hyperbits mcp");
    expect(getStdout()).toContain("--query, -q");
    expect(getStdout()).toContain("--tag, -t");
    expect(getStdout()).toContain("--limit, -l");
    expect(getStdout()).toContain("--into");
    expect(getStdout()).toContain("--json, -j");
  });

  it("prints usage for find --help", async () => {
    const { io, getStdout } = createIo();
    const exitCode = await runHyperbitsCli(["find", "--help"], io);
    expect(exitCode).toBe(0);
    expect(getStdout()).toContain("Usage:");
  });

  it("rejects an unknown command with the supported list", async () => {
    const { io, getStderr } = createIo();
    const exitCode = await runHyperbitsCli(["nope"], io);
    expect(exitCode).toBe(2);
    expect(getStderr()).toContain('Unknown command "nope"');
    expect(getStderr()).toContain("Expected find, fetch, add, or mcp");
  });

  it("suggests a close command name", async () => {
    const { io, getStderr } = createIo();
    const exitCode = await runHyperbitsCli(["fetsh"], io);
    expect(exitCode).toBe(2);
    expect(getStderr()).toContain("Did you mean: fetch?");
  });

  it("requires an identifier for fetch", async () => {
    const { io, getStderr } = createIo();
    const exitCode = await runHyperbitsCli(["fetch"], io);
    expect(exitCode).toBe(2);
    expect(getStderr()).toContain("requires a bit id or exact display name");
  });

  it("suggests close bit names when fetch misses", async () => {
    const { io, getStderr } = createIo();
    const exitCode = await runHyperbitsCli(["fetch", "fadein"], io);
    expect(exitCode).toBe(3);
    expect(getStderr()).toContain('No bit found for "fadein"');
    expect(getStderr()).toContain("Did you mean: fade-in");
  });

  it("includes suggestions in JSON not-found errors", async () => {
    const { io, getStdout } = createIo();
    const exitCode = await runHyperbitsCli(
      ["add", "fadein", "--json"],
      io,
    );
    expect(exitCode).toBe(3);
    expect(JSON.parse(getStdout())).toEqual({
      error: {
        code: "not-found",
        message: expect.stringContaining("Did you mean: fade-in"),
        suggestions: expect.arrayContaining(["fade-in"]),
      },
    });
  });

  it("writes a bit HTML file and prints JSON for add --json", async () => {
    const { io, getStdout, getStderr } = createIo();
    const destination = mkdtempSync(path.join(tmpdir(), "hyperbits-add-json-"));
    tempDirs.push(destination);

    const exitCode = await runHyperbitsCli(
      ["add", "fade-in", "--into", destination, "--json"],
      io,
    );

    expect(exitCode).toBe(0);
    expect(getStderr()).toBe("");
    expect(JSON.parse(getStdout())).toEqual({
      added: {
        id: "fade-in",
        name: "Fade In",
        path: `${destination}/fade-in.html`.split(path.sep).join("/"),
        embedSnippet: `<div data-composition-src="${destination}/fade-in.html"></div>`,
        helperScriptTag: expect.stringContaining("hyperbits.iife.js"),
      },
    });
  });

  it("writes a bit HTML file and prints the embed snippet", async () => {
    const { io, getStdout, getStderr } = createIo();
    const destination = mkdtempSync(path.join(tmpdir(), "hyperbits-add-"));
    tempDirs.push(destination);

    const exitCode = await runHyperbitsCli(
      ["add", "fade-in", "--into", destination],
      io,
    );

    expect(exitCode).toBe(0);
    expect(getStderr()).toBe("");
    expect(getStdout()).toContain(`Wrote ${destination}/fade-in.html`);
    expect(getStdout()).toContain(
      `<div data-composition-src="${destination}/fade-in.html"></div>`,
    );
    expect(getStdout()).toContain(
      '<script src="https://unpkg.com/hyperbits/dist/hyperbits.iife.js"></script>',
    );

    const written = readFileSync(
      path.join(destination, "fade-in.html"),
      "utf8",
    );
    expect(written).toContain('data-composition-id="fade-in"');
    expect(written).toContain(
      'src="https://unpkg.com/hyperbits/dist/hyperbits.iife.js"',
    );
    expect(written).not.toContain('src="hyperbits.iife.js"');
  });
});
