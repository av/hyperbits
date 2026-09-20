import { readdir, readFile, stat } from "node:fs/promises";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export const bitsRoot = path.join(projectRoot, "bits");

export const CATEGORY_ORDER = [
  "text-animations",
  "staggered-motion",
  "background-effects",
  "particles",
  "scenes-3d",
  "full-compositions",
];

export const CATEGORY_LABELS = {
  "full-compositions": "Full Compositions",
  "staggered-motion": "Staggered Motion",
  "text-animations": "Text Animations",
  "background-effects": "Background Effects",
  particles: "Particles",
  "scenes-3d": "3D Scenes",
};

export const GSAP_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js";

export const HYPERBITS_UNPKG_IIFE =
  "https://unpkg.com/hyperbits/dist/hyperbits.iife.js";

export const normalizePath = (value) => value.split(path.sep).join("/");

export const kebabToPascal = (value) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const collectBitJsonFiles = async (dirPath) => {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return collectBitJsonFiles(fullPath);
      }
      if (entry.isFile() && entry.name === "bit.json") {
        return [fullPath];
      }
      return [];
    }),
  );
  return files.flat().sort((left, right) => left.localeCompare(right));
};

export const listBitJsonFiles = async (dirPath = bitsRoot) =>
  collectBitJsonFiles(dirPath);

export const listBitJsonFilesSync = (dirPath = bitsRoot) => {
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === "bit.json") {
        files.push(fullPath);
      }
    }
  };
  walk(dirPath);
  return files.sort((left, right) => left.localeCompare(right));
};

export const listBitDirs = (dirPath = bitsRoot) =>
  listBitJsonFilesSync(dirPath).map((bitJsonPath) => path.dirname(bitJsonPath));

export const readBitManifest = async (bitJsonPath) =>
  JSON.parse(await readFile(bitJsonPath, "utf8"));

export const bitHtmlPath = (bitJsonPath) =>
  path.join(path.dirname(bitJsonPath), "index.html");

export const fileExists = async (filePath) => {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
};

export const fileExistsSync = (filePath) =>
  Boolean(statSync(filePath, { throwIfNoEntry: false })?.isFile());
