#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const bitsRoot = path.join(projectRoot, "bits");
const rootRegistryPath = path.join(projectRoot, "registry.json");
const docsRegistryPath = path.join(
  projectRoot,
  "docs",
  "public",
  "registry.json",
);

const normalizePath = (value) => value.split(path.sep).join("/");

const listBitJsonFiles = async (dirPath) => {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return listBitJsonFiles(fullPath);
      }
      if (entry.isFile() && entry.name === "bit.json") {
        return [fullPath];
      }
      return [];
    }),
  );
  return files.flat().sort((left, right) => left.localeCompare(right));
};

export const buildRegistry = async () => {
  const bitFiles = await listBitJsonFiles(bitsRoot);
  const items = [];

  for (const bitJsonPath of bitFiles) {
    const relativePath = normalizePath(path.relative(projectRoot, bitJsonPath));
    const manifest = JSON.parse(await readFile(bitJsonPath, "utf8"));
    const registryItem = manifest.registryItem;

    if (!registryItem || typeof registryItem !== "object") {
      throw new Error(`Missing registryItem in ${relativePath}`);
    }
    if (
      typeof registryItem.name !== "string" ||
      typeof registryItem.type !== "string"
    ) {
      throw new Error(
        `registryItem.name and registryItem.type are required in ${relativePath}`,
      );
    }

    items.push({
      name: registryItem.name,
      type: registryItem.type,
    });
  }

  const registry = {
    $schema: "https://hyperframes.heygen.com/schema/registry.json",
    name: "hyperbits",
    homepage: "https://github.com/av/hyperbits",
    items,
  };

  const serialized = `${JSON.stringify(registry, null, 2)}\n`;
  await writeFile(rootRegistryPath, serialized);
  await mkdir(path.dirname(docsRegistryPath), { recursive: true });
  await writeFile(docsRegistryPath, serialized);

  return registry;
};

const main = async () => {
  const registry = await buildRegistry();
  console.log(
    `Wrote registry.json with ${registry.items.length} item(s) to registry.json and docs/public/registry.json.`,
  );
};

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
