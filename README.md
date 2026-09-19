# hyperbits

Ready-made animation bits for [HyperFrames](https://github.com/heygen-com/hyperframes) video compositions, with a discoverable catalog, a CLI, and an MCP server. The sibling of [remotion-bits](https://github.com/av/remotion-bits), rebuilt for HTML + GSAP compositions instead of React.

> [!NOTE]
> This project is not affiliated with or endorsed by HeyGen or the HyperFrames team.

## Status

Outline stage. Nothing below exists yet; this document is the build plan.

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
- Registry output: `registry.json` in HyperFrames registry-item format hosted from the docs site so `npx hyperframes add` can consume it if external registries are supported, with `hyperbits add` as the guaranteed path.
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

## Open questions to settle during phase 1

- Whether `npx hyperframes add` accepts third-party registry URLs, which decides how much `hyperbits add` must do itself.
- Whether helpers should also be published as `@hyperbits/*` scoped packages or stay in one package with subpath exports.
- Minimum GSAP version to pin, and whether bits load it from CDN or expect the host project to provide it.
