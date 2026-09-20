#!/usr/bin/env node

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HYPERBITS_UNPKG_IIFE =
  "https://unpkg.com/hyperbits/dist/hyperbits.iife.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const bitsRoot = path.join(projectRoot, "bits");
const rootRegistryPath = path.join(projectRoot, "registry.json");
const docsPublicRoot = path.join(projectRoot, "docs", "public");
const docsRegistryPath = path.join(docsPublicRoot, "registry.json");

export const ITEM_TYPE_DIRS = {
  "hyperframes:example": "examples",
  "hyperframes:block": "blocks",
  "hyperframes:component": "components",
};

const TYPE_DIR_NAMES = Object.values(ITEM_TYPE_DIRS);

const normalizePath = (value) => value.split(path.sep).join("/");

const prepareInstalledHtml = (html) =>
  html.replaceAll('src="hyperbits.iife.js"', `src="${HYPERBITS_UNPKG_IIFE}"`);

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

const assertSafeRelative = (value, label) => {
  const normalized = normalizePath(value);
  if (
    normalized.length === 0 ||
    normalized.startsWith("/") ||
    normalized.includes("\\") ||
    normalized.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`Unsafe ${label}: ${value}`);
  }
  return normalized;
};

const writeItemTree = async (bitDir, registryItem) => {
  const typeDir = ITEM_TYPE_DIRS[registryItem.type];
  if (!typeDir) {
    throw new Error(
      `Unknown registryItem.type "${registryItem.type}" for ${registryItem.name}`,
    );
  }

  const itemDir = path.join(docsPublicRoot, typeDir, registryItem.name);
  await mkdir(itemDir, { recursive: true });

  const files = Array.isArray(registryItem.files) ? registryItem.files : [];
  if (files.length === 0) {
    throw new Error(`registryItem.files is empty for ${registryItem.name}`);
  }

  for (const file of files) {
    const relativeSource = assertSafeRelative(file.path, "file.path");
    const sourcePath = path.join(bitDir, relativeSource);
    const destinationPath = path.join(itemDir, relativeSource);
    await mkdir(path.dirname(destinationPath), { recursive: true });

    let contents = await readFile(sourcePath);
    if (relativeSource.endsWith(".html") || relativeSource.endsWith(".htm")) {
      contents = Buffer.from(prepareInstalledHtml(contents.toString("utf8")));
    }
    await writeFile(destinationPath, contents);
  }

  const itemManifest = {
    ...registryItem,
  };
  await writeFile(
    path.join(itemDir, "registry-item.json"),
    `${JSON.stringify(itemManifest, null, 2)}\n`,
  );

  return {
    typeDir,
    itemDir: normalizePath(path.relative(docsPublicRoot, itemDir)),
  };
};

const pruneStaleItemDirs = async (keep) => {
  for (const typeDir of TYPE_DIR_NAMES) {
    const typeRoot = path.join(docsPublicRoot, typeDir);
    let entries;
    try {
      entries = await readdir(typeRoot, { withFileTypes: true });
    } catch (error) {
      if (error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const key = `${typeDir}/${entry.name}`;
      if (!keep.has(key)) {
        await rm(path.join(typeRoot, entry.name), {
          recursive: true,
          force: true,
        });
      }
    }
  }
};

export const buildRegistry = async () => {
  const bitFiles = await listBitJsonFiles(bitsRoot);
  const items = [];
  const keep = new Set();

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

    const bitDir = path.dirname(bitJsonPath);
    const written = await writeItemTree(bitDir, registryItem);
    keep.add(`${written.typeDir}/${registryItem.name}`);

    items.push({
      name: registryItem.name,
      type: registryItem.type,
    });
  }

  await pruneStaleItemDirs(keep);

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
