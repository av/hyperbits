// @vitest-environment node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sharedBitInventory } from "../../src/catalog/inventory.generated";
import {
  ITEM_TYPE_DIRS,
  buildRegistry,
} from "../build-registry.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const docsPublicRoot = path.join(projectRoot, "docs", "public");

const itemDirFor = (name: string, type: string): string => {
  const typeDir = ITEM_TYPE_DIRS[type as keyof typeof ITEM_TYPE_DIRS];
  if (!typeDir) {
    throw new Error(`Unknown registry type ${type}`);
  }
  return path.join(docsPublicRoot, typeDir, name);
};

describe("build-registry item tree", () => {
  it("emits a registry-item.json and inlined files for every inventory bit", async () => {
    const registry = await buildRegistry();
    const manifest = JSON.parse(
      await readFile(path.join(docsPublicRoot, "registry.json"), "utf8"),
    ) as {
      items: Array<{ name: string; type: string }>;
    };

    expect(manifest.items).toEqual(registry.items);
    expect(manifest.items.length).toBe(sharedBitInventory.length);

    const inventoryIds = new Set(sharedBitInventory.map((entry) => entry.id));
    const manifestNames = new Set(manifest.items.map((item) => item.name));

    expect(manifestNames).toEqual(inventoryIds);

    for (const entry of sharedBitInventory) {
      const manifestItem = manifest.items.find((item) => item.name === entry.id);
      expect(manifestItem, `manifest missing ${entry.id}`).toMatchObject({
        name: entry.id,
        type: entry.registry.type,
      });

      const itemDir = itemDirFor(entry.id, entry.registry.type);
      const itemManifest = JSON.parse(
        await readFile(path.join(itemDir, "registry-item.json"), "utf8"),
      ) as {
        name: string;
        type: string;
        files: Array<{ path: string }>;
      };

      expect(itemManifest.name).toBe(entry.id);
      expect(itemManifest.type).toBe(entry.registry.type);
      expect(itemManifest.files.length).toBeGreaterThan(0);

      for (const file of itemManifest.files) {
        const listed = await readFile(path.join(itemDir, file.path), "utf8");
        expect(listed.length).toBeGreaterThan(0);
        if (file.path.endsWith(".html")) {
          expect(listed).toContain("data-composition-id");
          expect(listed).not.toContain('src="hyperbits.iife.js"');
        }
      }
    }
  });

  it("does not leave stale item directories that are absent from the manifest", async () => {
    const registry = await buildRegistry();
    const keep = new Set(
      registry.items.map((item) => {
        const typeDir = ITEM_TYPE_DIRS[item.type as keyof typeof ITEM_TYPE_DIRS];
        return `${typeDir}/${item.name}`;
      }),
    );

    for (const typeDir of Object.values(ITEM_TYPE_DIRS)) {
      const typeRoot = path.join(docsPublicRoot, typeDir);
      let entries: Array<{ name: string; isDirectory: () => boolean }>;
      try {
        entries = await readdir(typeRoot, { withFileTypes: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          continue;
        }
        throw error;
      }

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        expect(keep.has(`${typeDir}/${entry.name}`)).toBe(true);
      }
    }
  });
});
