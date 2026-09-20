import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  absWorkingDir: root,
  entryPoints: [path.join(root, "src/index.ts")],
  bundle: true,
  format: "iife",
  globalName: "hyperbits",
  outfile: path.join(root, "dist/hyperbits.iife.js"),
  platform: "browser",
  target: "es2022",
  sourcemap: true,
  legalComments: "none",
  plugins: [
    {
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
    },
  ],
});
