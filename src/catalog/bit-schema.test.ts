import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BIT_CATEGORIES,
  HYPERBITS_UNPKG_IIFE,
  validateBitManifest,
} from "./bit-schema";
import {
  CATEGORY_ORDER,
  HYPERBITS_UNPKG_IIFE as SCRIPT_UNPKG_IIFE,
  listBitJsonFilesSync,
  projectRoot as repoRoot,
} from "../../scripts/lib/bits.mjs";

describe("bit manifests", () => {
  const bitFiles = listBitJsonFilesSync();

  it("finds one bit.json per remotion-bits example category folder", () => {
    expect(BIT_CATEGORIES).toEqual(CATEGORY_ORDER);
    expect(HYPERBITS_UNPKG_IIFE).toBe(SCRIPT_UNPKG_IIFE);
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
