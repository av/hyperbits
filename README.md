# hyperbits

Ready-made animation bits for [HyperFrames](https://github.com/heygen-com/hyperframes) video compositions, with a discoverable catalog, a CLI, and an MCP server. The sibling of [remotion-bits](https://github.com/av/remotion-bits), rebuilt for HTML + GSAP compositions instead of React.

> [!NOTE]
> This project is not affiliated with or endorsed by HeyGen or the HyperFrames team.

## Status

Skeleton is in place. Toolchain, package layout, and the phase 1 decisions below exist; helpers, bits, CLI, MCP, and docs do not.

## What a bit is here

In remotion-bits a bit is a self-contained React component rendered by the Remotion player. In HyperFrames the unit of composition is an HTML document with a `data-composition-id` root, `data-start`/`data-duration` timed elements, and a paused GSAP timeline registered on `window.__timelines`. So in hyperbits:

- **A bit** is one self-contained HTML sub-composition file. It can be embedded into any project with `<div data-composition-src="...">` or copied in as a starting point. It carries its own CSS and GSAP timeline and depends only on GSAP from CDN plus optional hyperbits helpers.
- **A component** is a reusable helper, in plain JS, that bits build on: stagger sequencing, easing and interpolation, color and gradient interpolation, particle simulation, responsive sizing, typewriter and counter drivers. Shipped as ES modules and as a single IIFE for `<script>` use in a plain HTML file.
- **A composition variable** contract (`data-composition-variables`) makes bits parametric the HyperFrames way, replacing Remotion's props.

HyperFrames already ships a registry of installable "blocks" via `npx hyperframes add`. hyperbits is positioned as a third-party catalog in the same spirit: motion-first, smaller, agent-searchable, and installable through the same registry-item format where the CLI allows external sources.

## Rebuild outline

Everything remotion-bits has, mapped onto HyperFrames. Ordered by dependency, each phase is shippable on its own.

### 1. Repository skeleton

- `package.json` for the `hyperbits` npm package: ESM, `bin: hyperbits`, `exports` for helpers, Node >= 22 to match HyperFrames.
- TypeScript, vitest with jsdom, oxlint and oxfmt, same toolchain as remotion-bits.
- `AGENTS.md` with the rules for adding bits, kept in sync with a skill file.
- Directory layout:
  - `src/helpers/` runtime helpers (the "components" tier)
  - `src/catalog/` shared catalog contracts, inventory generator output, runtime search
  - `src/cli/` and `src/mcp/` the two agent-facing surfaces
  - `bits/<category>/<name>/` one folder per bit: `index.html`, `bit.json` metadata, optional `preview.png`
  - `docs/` Astro site
  - `scripts/` inventory generation, registry build, docs deploy
  - `skills/hyperbits/` skill file plus references

### 2. Helpers (port of `src/utils`, `src/hooks`, `src/components`)

Each helper is dependency-light, works as an ES module and inside the IIFE bundle, and is deterministic given a time value so HyperFrames frame-by-frame rendering stays exact.

- `interpolate` with easing map and non-monotonic ranges, plus GSAP-ease-name compatibility.
- `stagger` the StaggeredMotion equivalent: builds a GSAP timeline for a list of elements from a keyframe spec (`x/y/rotate/scale/opacity`, `duration`, `delay`, `stagger`, `hold`) so bits do not hand-write per-element tweens.
- `color` and `gradient` Oklch interpolation via culori, gradient parsing, applied through a GSAP proxy object onto `style.background`.
- `random` seeded generator, mandatory since renders must be reproducible across frames and machines.
- `particles` deterministic simulator with spawners and behaviors (gravity, drag, wiggle, scale, opacity), rendering into a Canvas 2D element driven by the timeline.
- `viewport` the `useViewportRect` equivalent: reads `data-width`/`data-height` from the composition root and exposes `vw`, `vh`, `vmin`, `vmax` so bits size fractionally.
- `text` splitting into chars, words, and lines with span wrapping, the base for AnimatedText and TypeWriter bits.
- `counter` numeric tween with formatting, prefix, and postfix.
- `code` syntax-highlighted code block with line reveal and focus, using Prism.
- `scene3d` CSS 3D scene with steps, camera moves, and elements, ported from Scene3D and transform3d. Larger and last in this phase.

### 3. Bits (port of `docs/src/bits/examples`, 46 bits)

Same categories, same names where they still make sense: Text Animations, Staggered Motion, Background Effects, Particles, 3D Scenes, Full Compositions. Each bit has:

- `index.html` self-contained, 1920x1080 default, `data-composition-variables` for the knobs a user is expected to change, theme colors as literal values in a top-level `:root` block.
- `bit.json` with `name`, `title`, `description`, `tags`, `duration`, `width`, `height`, `helpers` (which helpers it uses), and a `registryItem` block in HyperFrames' registry-item schema.
- A rule that every bit passes `npx hyperframes lint` and the layout, motion, and contrast audits in CI.

Shader-transition and canvas bits follow HyperFrames' shader-compatible CSS rules from the start.

### 4. Catalog, CLI, and MCP (port of `src/catalog`, `src/cli`, `src/mcp`)

- Inventory generator walks `bits/**/bit.json` and emits `src/catalog/inventory.generated.json` with the full HTML source inlined, same shape as remotion-bits so the search and resolution code ports almost verbatim.
- CLI: `hyperbits find`, `hyperbits fetch`, `hyperbits add <bit> [--into compositions/]`, `hyperbits mcp`. `add` writes the HTML file into a HyperFrames project and prints the `data-composition-src` snippet.
- MCP server with `find_hyperbits` and `fetch_hyperbit`, stdio transport.
- Registry output: `registry.json` in HyperFrames registry-item format hosted from the docs site. `npx hyperframes add` does not take a URL; a project can set `hyperframes.json` `registry` to that base and then `npx hyperframes add <bit>`. `hyperbits add` is the guaranteed path.
- Published-package integration test that runs the packed tarball through `npx` like remotion-bits does.

### 5. Docs site (port of `docs/`)

- Astro Starlight with the same theme setup, Tailwind, and dynamic sidebar built from bit frontmatter.
- Bit playground: iframe running the bit's HTML through the HyperFrames player global, CodeMirror in HTML mode, live re-render on edit, variable controls generated from `data-composition-variables`. Replaces the Remotion player plus sucrase pipeline.
- Catalog page with tag filtering and gallery previews, reference pages per helper, getting started, CLI and MCP pages.
- Deployed to Cloudflare Pages by `scripts/deploy-docs.sh`.

### 6. Demo project

A HyperFrames project created with `npx hyperframes init` that embeds several bits and serves as the manual test bed and the source of the README gallery video.

### 7. Skill file

`skills/hyperbits/SKILL.md` plus `references/helpers.md`, `references/bits.md`, `references/patterns.md`. Default workflow for agents: MCP first, CLI second, direct file inspection last. Includes HyperFrames-specific rules (paused timelines, `window.__timelines`, seek-safe motion, shader CSS constraints).

### 8. Release

- `prepublishOnly` builds helpers, inventory, and registry.
- Changelog, versioning, npm publish of `hyperbits`.
- README gallery, badges, and the single-step usage section mirroring remotion-bits.

## Decisions

Settled during phase 1 from HyperFrames 0.8.50 (`/tmp/hf/package`) and remotion-bits. Not guesses.

### `npx hyperframes add` and third-party registries

`hyperframes add` does **not** take a registry URL. `npx hyperframes add --help` (v0.8.50) accepts one positional `NAME` (registry item name or tag) plus `--dir`, `--clipboard` / `--no-clipboard`, `--json`, `--vars`, `--force`. There is no `--registry` flag and no URL argument.

The name is looked up in a single registry base URL (`/tmp/hf/package/dist/cli.js` `runAdd` → `resolveItemWithDependencies(opts.name, { baseUrl: config.registry })`). Names must match `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$` (`validRegistryName`); a URL cannot be an item name.

The default registry is `https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry` (`DEFAULT_REGISTRY_URL` in `cli.js`). A project can point at a different **registry base** by setting `registry` in `hyperframes.json` (`DEFAULT_PROJECT_CONFIG` in `cli.js`). That base must serve `registry.json` plus `<type-dir>/<name>/registry-item.json` (`fetchRegistryManifest` / `fetchItemManifest`). Item types live under `examples/`, `blocks/`, `components/` (`ITEM_TYPE_DIRS`). Custom bases are already handled in error text ("set by this project's hyperframes.json, not the public registry").

What `hyperbits add` must do itself:

- Copy the bit HTML (and any helper files) into the HyperFrames project and print the `data-composition-src` snippet. This is the guaranteed install path; `hyperframes add <url>` is not a thing.
- Optionally also publish a HyperFrames-format registry (`registry.json` + per-item `registry-item.json` using schema `$id` `https://hyperframes.heygen.com/schema/registry-item.json` in `cli.js`) so a user can set `"registry"` in `hyperframes.json` and then run `npx hyperframes add <bit>`. That is an extra path, not a substitute.

### GSAP pin and who loads it

HyperFrames does not inject GSAP. Templates load it themselves:

- Pinned URL used by every bundled template (`dist/templates/blank/index.html`, `from-file/index.html`, `warm-grain/*.html`): `https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js`
- Docs (`dist/docs/gsap.md`) and the lint hint (`dist/renderSetupWorker.js`) use the unpinned major `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js`
- The runtime (`dist/hyperframe-runtime.js`) reads `typeof gsap === "undefined" ? window.gsap : gsap`; it does not fetch a script
- Studio separately pins MotionPathPlugin at `gsap@3.12.5` (`dist/studio/index.js`); that is not the composition GSAP pin

**Decision:** bits load GSAP themselves from the template pin:

`https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js`

Exported as `HYPERBITS_GSAP_CDN`. Do not rely on the host or the HyperFrames player to inject it.

### Single package vs `@hyperbits/*`

**Decision:** one npm package `hyperbits` with subpath exports (`.`, `./helpers`, `./helpers/*`, `./catalog`). remotion-bits is a single published package (no `"private": true`, no scoped helper packages). Helpers are HTML-script and ESM consumers of one catalog; splitting `@hyperbits/*` would add publish and versioning cost without a consumer that needs it.

`hyperbits` is publishable the same way: `"private"` is omitted, `prepublishOnly` runs `build`.
