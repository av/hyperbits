// @vitest-environment node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

import { HELPER_NAMES } from "../../src/catalog/bit-schema";
import { projectRoot } from "../lib/bits.mjs";

type ExportEntry = {
  types?: string;
  import?: string;
  default?: string;
};

const packageJson = JSON.parse(
  readFileSync(path.join(projectRoot, "package.json"), "utf8"),
) as {
  engines?: { node?: string };
  peerDependencies?: { gsap?: string };
  exports?: Record<string, ExportEntry | string>;
  files?: string[];
};

describe("package.json exports and engines", () => {
  it("maps subpaths onto dist files and every helper name", () => {
    const exportsMap = packageJson.exports ?? {};
    const required = [
      ".",
      "./helpers",
      ...HELPER_NAMES.map((name) => `./helpers/${name}`),
      "./catalog",
      "./package.json",
    ];

    for (const key of required) {
      expect(exportsMap).toHaveProperty(key);
    }

    for (const [key, value] of Object.entries(exportsMap)) {
      if (key === "./package.json") {
        expect(value).toBe("./package.json");
        continue;
      }
      if (key.includes("*")) {
        continue;
      }
      const entry = value as ExportEntry;
      expect(entry.types).toMatch(/^\.\/dist\//);
      expect(entry.import).toMatch(/^\.\/dist\//);
      expect(entry.default).toBe(entry.import);
      expect(entry.types).toBe(entry.import?.replace(/\.js$/, ".d.ts"));

      const importPath = path.join(projectRoot, entry.import ?? "");
      const typesPath = path.join(projectRoot, entry.types ?? "");
      if (existsSync(path.join(projectRoot, "dist"))) {
        expect(existsSync(importPath), importPath).toBe(true);
        expect(existsSync(typesPath), typesPath).toBe(true);
      }
    }
  });

  it("imports the helpers barrel from dist when present", async () => {
    const helpersPath = path.join(projectRoot, "dist/helpers/index.js");
    if (!existsSync(helpersPath)) {
      return;
    }
    const helpers = await import(pathToFileURL(helpersPath).href);
    expect(typeof helpers.interpolate).toBe("function");
    expect(typeof helpers.stagger).toBe("function");
    expect(typeof helpers.viewport).toBe("function");
    expect(helpers.interpolate(5, [0, 10], [0, 100])).toBe(50);
  });

  it("requires Node 22+ and GSAP 3.14 as a peer", () => {
    expect(packageJson.engines?.node).toBe(">=22");
    expect(packageJson.peerDependencies?.gsap).toBe("^3.14.2");
  });

  it("packs dist, bits, skills, and registry — not src, docs, or scripts", () => {
    const files = packageJson.files ?? [];
    expect(files.some((entry) => entry.startsWith("dist"))).toBe(true);
    expect(files.some((entry) => entry.startsWith("bits"))).toBe(true);
    expect(files).toContain("skills");
    expect(files).toContain("registry.json");
    expect(files).not.toContain("src");
    expect(files).not.toContain("docs");
    expect(files).not.toContain("scripts");
  });
});
