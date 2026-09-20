// @vitest-environment node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sharedBitInventory } from "../../src/catalog/inventory.generated";
import { generateDocs } from "../generate-docs.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

describe("generate-docs", () => {
  it("writes an mdx page for every inventory bit", async () => {
    const bits = await generateDocs();
    const ids = new Set(bits.map((bit) => bit.id));

    expect(ids.size).toBe(sharedBitInventory.length);
    for (const entry of sharedBitInventory) {
      expect(ids.has(entry.id)).toBe(true);
      const mdx = await readFile(
        path.join(
          projectRoot,
          "docs",
          "src",
          "content",
          "docs",
          "bits",
          `${entry.id}.mdx`,
        ),
        "utf8",
      );
      expect(mdx).toContain(`bitName="${entry.id}"`);
      expect(mdx).toContain(entry.name);
    }
  });
});
