import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BIT_CATEGORIES, validateBitManifest } from "./bit-schema";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const bitsRoot = path.join(repoRoot, "bits");

function listBitJsonFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...listBitJsonFiles(full));
    } else if (entry === "bit.json") {
      files.push(full);
    }
  }
  return files.sort();
}

describe("bit manifests", () => {
  const bitFiles = listBitJsonFiles(bitsRoot);

  it("finds one bit.json per remotion-bits example category folder", () => {
    expect(BIT_CATEGORIES.length).toBe(6);
    expect(bitFiles.length).toBeGreaterThan(0);
  });

  it("validates every bit.json and its composition HTML", () => {
    expect(bitFiles.length).toBeGreaterThan(0);

    const failures: string[] = [];

    for (const bitFile of bitFiles) {
      const relative = path.relative(repoRoot, bitFile);
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(bitFile, "utf8"));
      } catch (error) {
        failures.push(`${relative}: invalid JSON (${String(error)})`);
        continue;
      }

      const issues = validateBitManifest(parsed);
      if (issues.length > 0) {
        failures.push(
          `${relative}: ${issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`,
        );
      }

      const htmlPath = path.join(path.dirname(bitFile), "index.html");
      if (!statSync(htmlPath, { throwIfNoEntry: false })?.isFile()) {
        failures.push(`${relative}: missing index.html`);
        continue;
      }

      const html = readFileSync(htmlPath, "utf8");
      if (!html.includes("data-composition-id")) {
        failures.push(`${relative}: index.html missing data-composition-id`);
      }
      if (!html.includes("data-width")) {
        failures.push(`${relative}: index.html missing data-width`);
      }
      if (!html.includes("data-height")) {
        failures.push(`${relative}: index.html missing data-height`);
      }
      if (!html.includes("window.__timelines")) {
        failures.push(
          `${relative}: index.html missing window.__timelines registration`,
        );
      }
    }

    expect(failures).toEqual([]);
  });
});
