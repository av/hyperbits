// @vitest-environment node

import { build, type Plugin } from "esbuild";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import * as esm from "../../index";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const iifePlugin: Plugin = {
  name: "gsap-global",
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^gsap$/ }, () => ({
      path: "gsap",
      namespace: "gsap-global",
    }));
    pluginBuild.onLoad({ filter: /.*/, namespace: "gsap-global" }, () => ({
      contents: "const gsap = globalThis.gsap;\nexport default gsap;\n",
      loader: "js",
    }));
  },
};

const iifeExportNames = (source: string): string[] => {
  const marker = "__export(index_exports, {";
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error("IIFE bundle is missing the index export map");
  }
  const bodyStart = start + marker.length;
  const end = source.indexOf("});", bodyStart);
  if (end < 0) {
    throw new Error("IIFE bundle export map is not closed");
  }
  const names = [
    ...source.slice(bodyStart, end).matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm),
  ].map((match) => match[1]);
  return names.sort();
};

describe("IIFE vs ESM barrel", () => {
  it("exposes the same named surface as the ESM package entry", async () => {
    const outfileDir = mkdtempSync(path.join(tmpdir(), "hyperbits-iife-"));
    const outfile = path.join(outfileDir, "hyperbits.iife.js");

    try {
      await build({
        absWorkingDir: repositoryRoot,
        entryPoints: [path.join(repositoryRoot, "src/index.ts")],
        bundle: true,
        format: "iife",
        globalName: "hyperbits",
        outfile,
        platform: "browser",
        target: "es2022",
        write: true,
        plugins: [iifePlugin],
      });

      const iifeNames = iifeExportNames(readFileSync(outfile, "utf8"));
      const esmNames = Object.keys(esm)
        .filter((name) => name !== "__esModule")
        .sort();

      expect(iifeNames).toEqual(esmNames);
    } finally {
      rmSync(outfileDir, { force: true, recursive: true });
    }
  }, 30000);

  it("re-exports every helper from the package root", async () => {
    const helpers = await import("../index");
    for (const name of Object.keys(helpers)) {
      expect(esm).toHaveProperty(name);
    }
  });
});
