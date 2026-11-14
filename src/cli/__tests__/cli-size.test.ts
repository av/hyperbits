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
      stdout: { write: (value: string) => void (stdout += value) },
      stderr: { write: (value: string) => void (stderr += value) },
    },
    getStdout: () => stdout,
    getStderr: () => stderr,
  };
};

const tempDirs: string[] = [];

const makeTempDir = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "hyperbits-size-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("hyperbits add --size", () => {
  it("writes the bit retargeted to a vertical alias", async () => {
    const into = path.join(makeTempDir(), "compositions");
    const { io, getStdout, getStderr } = createIo();

    const exitCode = await runHyperbitsCli(
      ["add", "fade-in", "--into", into, "--size", "9:16", "--json"],
      io,
    );

    expect(exitCode).toBe(0);
    expect(getStderr()).toBe("");
    expect(JSON.parse(getStdout()).added.size).toBe("1080x1920");
    const html = readFileSync(path.join(into, "fade-in.html"), "utf8");
    expect(html).toContain('data-width="1080"');
    expect(html).toContain('data-height="1920"');
    expect(html).toContain('content="width=1080, height=1920"');
    expect(html).toMatch(/width: 1080px;\s*height: 1920px;/);
  });

  it("accepts explicit WIDTHxHEIGHT", async () => {
    const into = makeTempDir();
    const { io, getStdout } = createIo();

    const exitCode = await runHyperbitsCli(
      ["add", "card-stack", "--into", into, "--size", "1920x1080"],
      io,
    );

    expect(exitCode).toBe(0);
    expect(getStdout()).toContain("at 1920x1080");
    const html = readFileSync(path.join(into, "card-stack.html"), "utf8");
    expect(html).toContain('data-width="1920"');
    expect(html).toContain('data-height="1080"');
  });

  it("keeps the native size when --size is omitted", async () => {
    const into = makeTempDir();
    const { io, getStdout } = createIo();

    const exitCode = await runHyperbitsCli(
      ["add", "fade-in", "--into", into, "--json"],
      io,
    );

    expect(exitCode).toBe(0);
    expect(JSON.parse(getStdout()).added.size).toBeUndefined();
    const html = readFileSync(path.join(into, "fade-in.html"), "utf8");
    expect(html).toContain('data-width="1920"');
    expect(html).toContain('data-height="1080"');
  });

  it("rejects an invalid size", async () => {
    const into = makeTempDir();
    const { io, getStdout } = createIo();

    const exitCode = await runHyperbitsCli(
      ["add", "fade-in", "--into", into, "--size", "4:3", "--json"],
      io,
    );

    expect(exitCode).toBe(2);
    expect(JSON.parse(getStdout()).error).toEqual(
      expect.objectContaining({ code: "invalid-size" }),
    );
  });
});
