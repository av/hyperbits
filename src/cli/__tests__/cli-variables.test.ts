// @vitest-environment node

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parseCompositionVariables } from "../../../scripts/lib/bits.mjs";
import { runHyperbitsCli } from "../index";

const run = async (args: string[]) => {
  let stdout = "";
  let stderr = "";
  const exitCode = await runHyperbitsCli(args, {
    stdout: { write: (value: string) => (stdout += value) },
    stderr: { write: (value: string) => (stderr += value) },
  });
  return { exitCode, stdout, stderr };
};

const tempDirs: string[] = [];

const tempDir = (): string => {
  const dir = mkdtempSync(path.join(tmpdir(), "hyperbits-vars-"));
  tempDirs.push(dir);
  return dir;
};

const readInstalled = (dir: string, id: string): string =>
  readFileSync(path.join(dir, `${id}.html`), "utf8");

const defaultOf = (html: string, id: string): unknown =>
  parseCompositionVariables(html).find(
    (variable: { id: string }) => variable.id === id,
  )?.default;

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("variables in find and fetch", () => {
  it("includes declared variables in find --json and fetch --json", async () => {
    const find = await run(["find", "fade in", "--limit", "1", "--json"]);
    expect(JSON.parse(find.stdout).results[0].variables).toEqual([
      { id: "text", type: "string", label: "Text", default: "Hello World" },
      { id: "color", type: "color", label: "Text color", default: "#fcc192" },
      {
        id: "background",
        type: "color",
        label: "Background",
        default: "#100f0f",
      },
    ]);

    const fetch = await run(["fetch", "fade-in", "--json"]);
    expect(JSON.parse(fetch.stdout).bit.variables).toHaveLength(3);
  });

  it("lists variable ids in human find output", async () => {
    const { stdout } = await run(["find", "fade in", "--limit", "1"]);
    expect(stdout).toContain("Variables: text, color, background");
  });

  it("prints a variables section before the source in fetch", async () => {
    const { stdout } = await run(["fetch", "fade-in"]);
    const section = stdout.indexOf("Variables (id, type, default, label):");
    expect(section).toBeGreaterThan(0);
    expect(section).toBeLessThan(stdout.indexOf("Source code:"));
    expect(stdout).toMatch(/background\s+color\s+#100f0f\s+Background/);
    expect(stdout).toMatch(/text\s+string\s+"Hello World"\s+Text/);
    expect(stdout).toContain(
      `data-variable-values='{"text":"Hello World","color":"#fcc192","background":"#100f0f"}'`,
    );
  });
});

describe("add with variables", () => {
  it("prints a data-variable-values example after the embed snippet", async () => {
    const dir = tempDir();
    const { exitCode, stdout } = await run(["add", "fade-in", "--into", dir]);

    expect(exitCode).toBe(0);
    const embed = `<div data-composition-src="${dir}/fade-in.html"></div>`;
    const example = `<div data-composition-src="${dir}/fade-in.html" data-variable-values='{"text":"Hello World","color":"#fcc192","background":"#100f0f"}'></div>`;
    expect(stdout.indexOf(example)).toBeGreaterThan(stdout.indexOf(embed));
  });

  it("writes --set values as new defaults and into literal copies", async () => {
    const dir = tempDir();
    const { exitCode, stdout } = await run([
      "add",
      "fade-in",
      "--into",
      dir,
      "--set",
      "background=#112233",
      "--set",
      "text=Launch day",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Set background=#112233");
    expect(stdout).toContain("Set text=Launch day");
    expect(stdout).toContain(`"background":"#112233"`);

    const html = readInstalled(dir, "fade-in");
    expect(defaultOf(html, "background")).toBe("#112233");
    expect(defaultOf(html, "text")).toBe("Launch day");
    expect(defaultOf(html, "color")).toBe("#fcc192");
    expect(html).not.toMatch(/#100f0f(?![0-9a-f])/i);
    expect(html).toContain("background-color:#112233");
    expect(html).toContain(">Launch day</h1>");
  });

  it("adds several bits and reports which ones skipped a --set id", async () => {
    const dir = tempDir();
    const { exitCode, stdout } = await run([
      "add",
      "fade-in",
      "staggered-fade-in",
      "--into",
      dir,
      "--set",
      "background=#000",
      "--set",
      "text=Hi",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain(`Wrote ${dir}/fade-in.html`);
    expect(stdout).toContain(`Wrote ${dir}/staggered-fade-in.html`);
    expect(stdout).toContain(
      'Skipped --set text: staggered-fade-in has no "text" variable',
    );
    expect(stdout).toContain("Embed fade-in with:");
    expect(stdout).toContain("Embed staggered-fade-in with:");
    expect(defaultOf(readInstalled(dir, "fade-in"), "background")).toBe("#000");
    expect(
      defaultOf(readInstalled(dir, "staggered-fade-in"), "background"),
    ).toBe("#000");
    expect(existsSync(path.join(dir, "hyperbits.iife.js"))).toBe(true);
  });

  it("returns an array of records for several bits in JSON mode", async () => {
    const dir = tempDir();
    const { exitCode, stdout } = await run([
      "add",
      "fade-in",
      "glitch-in",
      "ken-burns",
      "--into",
      dir,
      "--set",
      "background=#112233",
      "--set",
      "text=Hi",
      "--json",
    ]);

    expect(exitCode).toBe(0);
    const { added } = JSON.parse(stdout);
    expect(added.map((record: { id: string }) => record.id)).toEqual([
      "fade-in",
      "glitch-in",
      "ken-burns",
    ]);
    expect(added[0]).toMatchObject({
      set: { background: "#112233", text: "Hi" },
      skipped: [],
    });
    expect(added[2]).toMatchObject({
      set: { background: "#112233" },
      skipped: ["text"],
      warnings: [expect.stringContaining("shared with color")],
    });
  });

  it("accepts an unquoted display name", async () => {
    const dir = tempDir();
    const { exitCode } = await run(["add", "Fade", "In", "--into", dir]);
    expect(exitCode).toBe(0);
    expect(existsSync(path.join(dir, "fade-in.html"))).toBe(true);
  });

  it("fails on an unknown bit without writing anything", async () => {
    const dir = path.join(tempDir(), "compositions");
    const { exitCode, stderr } = await run([
      "add",
      "fade-in",
      "bit-does-not-exist",
      "--into",
      dir,
    ]);

    expect(exitCode).toBe(3);
    expect(stderr).toContain('No bit found for "bit-does-not-exist"');
    expect(existsSync(dir)).toBe(false);
  });

  it("rejects an invalid color without writing anything", async () => {
    const dir = path.join(tempDir(), "compositions");
    const { exitCode, stdout } = await run([
      "add",
      "fade-in",
      "glitch-in",
      "--into",
      dir,
      "--set",
      "background=notacolor",
      "--json",
    ]);

    expect(exitCode).toBe(2);
    expect(JSON.parse(stdout).error).toEqual({
      code: "invalid-variable-value",
      message: expect.stringContaining("not a valid CSS color for background"),
    });
    expect(existsSync(dir)).toBe(false);
  });

  it("rejects a number variable that is not a number", async () => {
    const { exitCode, stderr } = await run([
      "add",
      "dot-ripple",
      "--into",
      tempDir(),
      "--set",
      "wavelength=abc",
    ]);

    expect(exitCode).toBe(2);
    expect(stderr).toContain("not a number for wavelength");
  });

  it("rejects a variable id that no bit declares", async () => {
    const { exitCode, stderr } = await run([
      "add",
      "fade-in",
      "--into",
      tempDir(),
      "--set",
      "bakground=#000",
    ]);

    expect(exitCode).toBe(2);
    expect(stderr).toContain(
      'No bit in this add declares a variable "bakground"',
    );
    expect(stderr).toContain("text, color, background");
  });

  it("rejects a malformed --set", async () => {
    const { exitCode, stdout } = await run([
      "add",
      "fade-in",
      "--into",
      tempDir(),
      "--set",
      "background",
      "--json",
    ]);

    expect(exitCode).toBe(2);
    expect(JSON.parse(stdout).error.code).toBe("invalid-set");
  });
});
