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

export const BIT_VARS_FN = `function bitVars() {
          if (window.__hyperframes && typeof window.__hyperframes.getVariables === "function") {
            return window.__hyperframes.getVariables();
          }
          const raw = document.documentElement.getAttribute("data-composition-variables") || "[]";
          const decls = JSON.parse(raw);
          const values = {};
          for (const entry of decls) values[entry.id] = entry.default;
          return values;
        }`;

export const REGISTER_TIMELINE_FN = `function registerTimeline(compositionId, timeline) {
          window.__timelines = window.__timelines || {};
          window.__timelines[compositionId] = timeline;
          timeline.seek(0);
        }`;

export const GSAP_SCRIPT_TAG =
  '<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>';

export const IIFE_SCRIPT_TAG =
  '<script src="hyperbits.iife.js" data-hyperbits-src="https://unpkg.com/hyperbits/dist/hyperbits.iife.js" data-hyperbits-local="../../../dist/hyperbits.iife.js"></script>';

const ROOT_OPEN = /<div\b([^>]*\sid="root"[^>]*)>/;
const BG_OPEN = /<div\b([^>]*\sid="bg"[^>]*)>/;

function attribute(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function rootRuleHasBackground(css) {
  const rules = css.match(/#root\s*\{[^}]*\}/g) ?? [];
  return rules.some((rule) => /background(?:-color)?\s*:/.test(rule));
}

export function inspectBitHtml(html, manifest) {
  const issues = [];
  const styleBlocks = [
    ...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi),
  ].map((match) => match[1]);
  const css = styleBlocks.join("\n");

  if (!html.includes(GSAP_SCRIPT_TAG)) {
    issues.push("GSAP script tag is not byte-identical");
  }
  if (!html.includes(IIFE_SCRIPT_TAG)) {
    issues.push("IIFE script tag is not byte-identical");
  }
  if (!html.includes(BIT_VARS_FN)) {
    issues.push("bitVars() boilerplate is not byte-identical");
  }
  if (!html.includes(REGISTER_TIMELINE_FN)) {
    issues.push("registerTimeline() boilerplate is not byte-identical");
  }

  const rootMatch = html.match(ROOT_OPEN);
  if (!rootMatch) {
    issues.push("missing #root element");
    return issues;
  }

  const rootDuration = attribute(rootMatch[1], "data-duration");
  const expectedDuration = String(manifest.duration);
  if (rootDuration !== expectedDuration) {
    issues.push(
      `root data-duration (${rootDuration}) must match bit.json duration (${expectedDuration})`,
    );
  }

  if (/background(?:-color)?\s*:/.test(rootMatch[1])) {
    issues.push("#root inline style must not set background");
  }
  if (rootRuleHasBackground(css)) {
    issues.push("#root CSS must not declare background; paint #bg instead");
  }

  const afterRoot = html.slice(rootMatch.index + rootMatch[0].length);
  const firstTag = afterRoot.match(/<([a-zA-Z0-9-]+)([^>]*)>/);
  if (!firstTag || attribute(firstTag[2], "id") !== "bg") {
    issues.push("#bg must be the first child of #root");
  }

  const bgMatch = html.match(BG_OPEN);
  if (!bgMatch) {
    issues.push("missing #bg layer");
  } else {
    const bgDuration = attribute(bgMatch[1], "data-duration");
    if (bgDuration !== expectedDuration) {
      issues.push(
        `#bg data-duration (${bgDuration}) must match bit.json duration (${expectedDuration})`,
      );
    }
    if (!/background-color\s*:\s*#[0-9a-fA-F]{3,8}/.test(bgMatch[1])) {
      issues.push(
        "#bg must set a literal background-color in its style attribute",
      );
    }
    if (!/\bclass="[^"]*\bclip\b/.test(bgMatch[0])) {
      issues.push("#bg must have class=\"clip\"");
    }
    if (attribute(bgMatch[1], "data-start") !== "0") {
      issues.push("#bg data-start must be 0");
    }
  }

  const varsAttr = html.match(
    /data-composition-variables=(['"])([\s\S]*?)\1/,
  );
  let decls = [];
  if (!varsAttr) {
    issues.push("missing data-composition-variables");
  } else {
    try {
      decls = JSON.parse(varsAttr[2]);
    } catch {
      issues.push("data-composition-variables is not valid JSON");
      decls = [];
    }
    if (!Array.isArray(decls) || decls.length < 1) {
      issues.push("data-composition-variables must declare at least one knob");
    } else {
      const hasColor = decls.some((entry) => entry?.type === "color");
      if (!hasColor) {
        issues.push("data-composition-variables must include a color knob");
      }
      for (const entry of decls) {
        if (!entry?.id) continue;
        const token = `vars.${entry.id}`;
        if (!html.includes(token)) {
          issues.push(`script never reads vars.${entry.id}`);
        }
      }
    }
  }

  return issues;
}
