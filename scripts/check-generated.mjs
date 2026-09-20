#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { buildRegistry } from "./build-registry.mjs";
import { generateDocs } from "./generate-docs.mjs";
import { generateBitInventory } from "./generate-inventory.mjs";
import { generateSkillRefs } from "./generate-skill-refs.mjs";
import { projectRoot } from "./lib/bits.mjs";

export const GENERATED_PATHS = [
  "src/catalog/inventory.generated.ts",
  "src/catalog/inventory.generated.json",
  "skills/hyperbits/references/bits.md",
  "skills/hyperbits/references/helpers.md",
  "registry.json",
  "docs/public/registry.json",
  "docs/public/blocks",
  "docs/src/lib/bits.generated.ts",
  "docs/src/content/docs/bits",
  "docs/public/bits",
];

export const regenerateAll = async () => {
  await generateBitInventory();
  await generateSkillRefs();
  await buildRegistry();
  await generateDocs();
};

const hashPath = (relativePath, hash) => {
  const absolute = path.join(projectRoot, relativePath);
  const stats = statSync(absolute, { throwIfNoEntry: false });
  if (!stats) {
    hash.update(`missing:${relativePath}\n`);
    return;
  }
  if (stats.isDirectory()) {
    const entries = readdirSync(absolute, { withFileTypes: true }).sort(
      (left, right) => left.name.localeCompare(right.name),
    );
    for (const entry of entries) {
      hashPath(path.join(relativePath, entry.name), hash);
    }
    return;
  }
  hash.update(relativePath);
  hash.update("\0");
  hash.update(readFileSync(absolute));
  hash.update("\n");
};

export const generatedSnapshot = () => {
  const hash = createHash("sha256");
  for (const relativePath of GENERATED_PATHS) {
    hashPath(relativePath, hash);
  }
  return hash.digest("hex");
};

export const generatedDiff = () => {
  const diff = spawnSync("git", ["diff", "--stat", "--", ...GENERATED_PATHS], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (diff.status !== 0 && diff.status !== 1) {
    throw new Error(diff.stderr || "git diff failed");
  }
  return (diff.stdout || "").trim();
};

const main = async () => {
  await regenerateAll();
  const stat = generatedDiff();
  if (stat) {
    console.error("Generated files are stale:\n" + stat);
    process.exit(1);
  }
  console.log("Generated files are up to date.");
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
