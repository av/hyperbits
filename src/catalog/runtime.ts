import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { HYPERBITS_UNPKG_IIFE } from "./bit-schema";
import type { BitCatalogEntry, BitCatalogResolution } from "./contracts";
import { DEFAULT_ADD_DIR } from "./contracts";
import { sharedBitInventory } from "./inventory.generated";
import {
  findBits,
  formatBitSuggestions,
  getBitCatalogSummaries,
  getBitCatalogTags,
  getDocsBitCatalogData,
  listBitCatalog,
  resolveBitCatalogIdentifier,
  suggestBitIdentifiers,
} from "./shared";

const packageRoot = (() => {
  const metaUrl = import.meta.url;
  if (typeof metaUrl === "string" && metaUrl.startsWith("file:")) {
    return fileURLToPath(new URL("../../", metaUrl));
  }
  return path.resolve(process.cwd());
})();

const assertSafeSourcePath = (sourcePath: string): string => {
  const absolutePath = path.resolve(packageRoot, sourcePath);
  const relativePath = path.relative(packageRoot, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(
      `Bit source path resolves outside the package: ${sourcePath}`,
    );
  }

  return absolutePath;
};

const readBitSource = (sourcePath: string): string =>
  fs.readFileSync(assertSafeSourcePath(sourcePath), "utf8");

export const helperScriptTag = (): string =>
  `<script src="${HYPERBITS_UNPKG_IIFE}"></script>`;

export const compositionSrcSnippet = (
  bitId: string,
  into = DEFAULT_ADD_DIR,
): string => {
  const directory = into.replaceAll("\\", "/").replace(/\/+$/, "");
  const src =
    directory.length === 0 ? `${bitId}.html` : `${directory}/${bitId}.html`;
  return `<div data-composition-src="${src}"></div>`;
};

export const fetchBit = async (
  identifier: string,
): Promise<BitCatalogEntry | null> => {
  const resolution = resolveBitCatalogIdentifier(identifier);

  if (!resolution.entry) {
    return null;
  }

  const inventoryEntry = sharedBitInventory.find(
    (entry) => entry.id === resolution.entry?.id,
  );
  let sourceCode = inventoryEntry?.sourceCode ?? "";

  try {
    sourceCode = readBitSource(resolution.entry.sourcePath);
  } catch {
    if (!sourceCode) {
      throw new Error(
        `Bit source is missing for ${resolution.entry.sourcePath}`,
      );
    }
  }

  return {
    ...resolution.entry,
    sourceCode,
    embedSnippet: compositionSrcSnippet(resolution.entry.id),
    helperScriptTag: helperScriptTag(),
  };
};

export {
  findBits,
  formatBitSuggestions,
  getBitCatalogSummaries,
  getBitCatalogTags,
  getDocsBitCatalogData,
  listBitCatalog,
  resolveBitCatalogIdentifier,
  suggestBitIdentifiers,
};

export type { BitCatalogResolution };
