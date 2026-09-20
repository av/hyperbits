// @vitest-environment node

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type FindResult = {
  results: Array<{
    id: string;
    exportName: string;
    sourcePath: string;
  }>;
};

type FetchResult = {
  bit: {
    id: string;
    exportName: string;
    name: string;
    sourcePath: string;
    sourceCode: string;
    helpers: string[];
    embedSnippet: string;
  };
};

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const bitsRoot = path.join(repositoryRoot, "bits");

const normalizePath = (value: string): string =>
  value.split(path.sep).join("/");

const listBitSourcePaths = (dirPath: string): string[] => {
  return readdirSync(dirPath, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return listBitSourcePaths(fullPath);
      }

      if (entry.isFile() && entry.name === "index.html") {
        return [normalizePath(path.relative(repositoryRoot, fullPath))];
      }

      return [] as string[];
    })
    .sort((left, right) => left.localeCompare(right));
};

const parseJsonOutput = (output: string): unknown => {
  const trimmedOutput = output.trim();
  const candidateIndices = Array.from(
    new Set(
      trimmedOutput
        .split("")
        .map((character, index) => ({ character, index }))
        .filter(({ character }) => character === "{" || character === "[")
        .map(({ index }) => index),
    ),
  );

  for (const candidateIndex of candidateIndices) {
    const candidate = trimmedOutput.slice(candidateIndex);

    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  throw new Error(`No JSON payload found in command output:\n${output}`);
};

const runTarballBackedCliJson = (
  tarballPath: string,
  args: string[],
): unknown => {
  const output = execFileSync(
    "npm",
    ["exec", "--yes", "--package", tarballPath, "--", "hyperbits", ...args],
    {
      cwd: path.dirname(tarballPath),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return parseJsonOutput(output);
};

describe("published package integration", () => {
  it("uses the packed CLI as the authoritative single-source-of-truth gate", () => {
    const expectedSourcePaths = listBitSourcePaths(bitsRoot);
    const packDir = mkdtempSync(path.join(tmpdir(), "hyperbits-pack-"));

    try {
      const packOutput = execFileSync(
        "npm",
        ["pack", "--json", "--pack-destination", packDir],
        {
          cwd: repositoryRoot,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      const packResult = parseJsonOutput(packOutput) as Array<{
        filename: string;
      }>;
      const tarballName = packResult[0]?.filename
        ? path.basename(packResult[0].filename)
        : readdirSync(packDir).find((name) => name.endsWith(".tgz"));

      if (!tarballName) {
        throw new Error("npm pack did not produce a tarball filename.");
      }

      const tarballPath = path.join(packDir, tarballName);
      const tarEntries = execFileSync("tar", ["-tf", tarballPath], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      })
        .trim()
        .split("\n")
        .filter(Boolean);

      expect(tarEntries).toContain("package/dist/cli/index.js");

      const packagedSourcePaths = tarEntries
        .filter(
          (entry) =>
            entry.startsWith("package/bits/") && entry.endsWith("/index.html"),
        )
        .map((entry) => entry.slice("package/".length))
        .sort((left, right) => left.localeCompare(right));

      expect(packagedSourcePaths).toEqual(expectedSourcePaths);

      const findResult = runTarballBackedCliJson(tarballPath, [
        "find",
        "text",
        "--json",
      ]) as FindResult;

      expect(findResult.results.length).toBeGreaterThan(0);
      expect(findResult.results.some((entry) => entry.id === "fade-in")).toBe(
        true,
      );

      const allBits = runTarballBackedCliJson(tarballPath, [
        "find",
        "--json",
      ]) as FindResult;

      expect(allBits.results).toHaveLength(expectedSourcePaths.length);
      expect(new Set(allBits.results.map((entry) => entry.id)).size).toBe(
        allBits.results.length,
      );

      const fetched = runTarballBackedCliJson(tarballPath, [
        "fetch",
        "fade-in",
        "--json",
      ]) as FetchResult;
      const packagedSource = readFileSync(
        path.join(repositoryRoot, "bits/text-animations/fade-in/index.html"),
        "utf8",
      );

      expect(fetched.bit).toEqual(
        expect.objectContaining({
          id: "fade-in",
          exportName: "FadeIn",
          name: "Fade In",
          sourcePath: "bits/text-animations/fade-in/index.html",
          embedSnippet:
            '<div data-composition-src="compositions/fade-in.html"></div>',
        }),
      );
      expect(fetched.bit.sourceCode).toBe(packagedSource);
      expect(fetched.bit.sourceCode).toContain("data-composition-id");
      expect(fetched.bit.helpers).toContain("viewport");
    } finally {
      rmSync(packDir, { force: true, recursive: true });
    }
  }, 180000);
});
