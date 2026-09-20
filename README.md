# hyperbits

![Gallery](./docs/public/gallery.gif)

[![NPM Version](https://img.shields.io/npm/v/hyperbits?style=flat-square&color=%23ec8b49)](https://www.npmjs.com/package/hyperbits)
[![License](https://img.shields.io/npm/l/hyperbits?style=flat-square&color=%23ec8b49)](https://github.com/av/hyperbits/blob/master/LICENSE)

Ready-made animation bits for [HyperFrames](https://github.com/heygen-com/hyperframes) video compositions, with a discoverable catalog, a CLI, and an MCP server. The sibling of [remotion-bits](https://github.com/av/remotion-bits), rebuilt for HTML + GSAP compositions instead of React.

> [!NOTE]
> This project is not affiliated with or endorsed by HeyGen or the HyperFrames team.

## Status

0.1.0 is ready to publish. Helpers, 46 bits, CLI, MCP, docs, demo, and skill ship in this package. Publish itself is a manual step (`npm publish`).

## Single-step usage

All published entry points use the same package name: `hyperbits`. Once published, the packed CLI is `npx hyperbits ...`. Locally, after `npm pack`:

```bash
npm exec --package ./hyperbits-*.tgz -- hyperbits find "fade in"
```

### CLI

```bash
npx hyperbits find 3d cards
npx hyperbits fetch fade-in --json
npx hyperbits add fade-in --into compositions/
```

Or install the bin globally:

```bash
npm i -g hyperbits
hyperbits find 3d cards
hyperbits add fade-in --into compositions/
```

`add` writes the bit HTML into a HyperFrames project (default `compositions/`) and prints a `data-composition-src` snippet.

### MCP

```bash
npx hyperbits mcp
```

Minimal MCP client config:

```json
{
  "command": "npx",
  "args": ["-y", "hyperbits", "mcp"]
}
```

If you installed the package globally:

```json
{
  "command": "hyperbits",
  "args": ["mcp"]
}
```

The server exposes two tools:

- `find_hyperbits`
- `fetch_hyperbit`

### Add into a HyperFrames project

From a HyperFrames project directory:

```bash
npx hyperbits add fade-in --into compositions/
```

Embed the written file:

```html
<div data-composition-src="compositions/fade-in.html"></div>
```

`npx hyperframes add <bit>` works when the project's `hyperframes.json` sets `registry` to the docs site origin. Per-item files live under `docs/public/blocks/`:

```json
{
  "registry": "https://hyperbits.pages.dev"
}
```

```bash
npx hyperframes add fade-in
```

`hyperbits add` is the guaranteed install path. `npx hyperframes add` does not take a registry URL.

### Skill

This repository ships a skill file at `skills/hyperbits/SKILL.md`. Point an agent setup that supports custom skills at the published CLI or MCP entry points above. The skill does not install anything by itself.

### Package

Install when you want to import helpers as ESM:

```bash
npm install hyperbits
```

```js
import { interpolate, stagger, viewport } from "hyperbits/helpers";
```

HTML compositions load the IIFE instead:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="https://unpkg.com/hyperbits/dist/hyperbits.iife.js"></script>
```

## Gallery

The [demo project](./demo) sequences one bit per catalog category into a 31-second reel. The rendered file lives at `demo/out/gallery.mp4` and is gitignored. `docs/public/gallery.gif` is the README still; generate it from the reel when you have an FFmpeg with libx264.

Regenerate the reel:

```bash
npm run build
npm run demo:render
```

`demo:render` needs an FFmpeg with libx264. See [demo/README.md](./demo/README.md) for the Docker / PNG-sequence fallback.

Then convert the mp4 into the committed gif, for example:

```bash
ffmpeg -i demo/out/gallery.mp4 docs/public/gallery.gif
```

## Helpers

Each helper is deterministic given a time value so HyperFrames frame-by-frame rendering stays exact. ESM import from `hyperbits/helpers` or `hyperbits/helpers/<name>`. Bits load the IIFE global `hyperbits`.

- `interpolate`: easing map, non-monotonic ranges, GSAP ease-name compatibility
- `stagger`: GSAP timeline from a keyframe spec (`x`/`y`/`rotate`/`scale`/`opacity`, `duration`, `delay`, `stagger`, `hold`)
- `color` / `gradient`: Oklch interpolation via culori, applied through a GSAP `{ proxy, apply }` binding
- `random`: seeded generator (`random`, `randomFloat`, `pick`); renders stay reproducible
- `particles`: deterministic simulator (`stateAt` + `bind`) with spawners and behaviors, bound to a canvas
- `viewport`: composition-relative `vw`/`vh`/`vmin`/`vmax`/`px()` from `data-width`/`data-height`
- `text`: split into chars, words, and lines; typewriter driver
- `counter`: numeric tween (`{ proxy, apply }`) with formatting, prefix, and postfix
- `code`: Prism-highlighted code with line reveal and focus
- `scene3d`: CSS 3D scene (`stateAt` + `bind`) with steps, camera moves, and `Transform3D`

Reference pages live on the [docs site](https://hyperbits.pages.dev/docs/getting-started).

## Bits

46 bits in 6 categories. Each is a self-contained HTML composition with `bit.json` metadata.

| Category | Count | Bits |
| --- | ---: | --- |
| Text Animations | 17 | `bar-chart`, `basic-code-block`, `basic-counter`, `basic-typewriter`, `blur-slide-word`, `char-by-char`, `cli-simulation`, `counter-confetti`, `fade-in`, `glitch-cycle`, `glitch-in`, `matrix-rain`, `multi-text-typewriter`, `stat-rings`, `typing-code-block`, `variable-speed-typewriter`, `word-by-word` |
| Staggered Motion | 10 | `card-stack`, `chat-conversation`, `easings-visualizer`, `fracture-reassemble`, `grid-stagger`, `list-reveal`, `lower-third`, `mosaic-reframe`, `slide-from-left`, `staggered-fade-in` |
| Background Effects | 3 | `conic-gradient`, `linear-gradient`, `radial-gradient` |
| Particles | 5 | `fireflies`, `particles-fountain`, `particles-grid`, `particles-snow`, `scrolling-columns` |
| 3D Scenes | 10 | `3d-basic`, `3d-elements`, `carousel`, `cube-navigation`, `cursor-flyover`, `flying-through-words`, `ken-burns`, `step-timing-context`, `terminal-3d`, `transform3d-showcase` |
| Full Compositions | 1 | `feature-showcase` |

Browse them in the [catalog](https://hyperbits.pages.dev/docs/bits-catalog).

## Docs

Documentation, playground, and the HyperFrames registry:

https://hyperbits.pages.dev

## Development

Prerequisites: Git, Node.js 22 or newer, npm.

```bash
git clone https://github.com/av/hyperbits.git
cd hyperbits
npm install
```

| Script | What it does |
| --- | --- |
| `npm run build` | Inventory, skill refs, compile `src/` to `dist/`, IIFE bundle |
| `npm run inventory` | Catalog JSON plus `skills/hyperbits/references/{bits,helpers}.md` |
| `npm run skill:refs` | Skill helper and bit references only |
| `npm run registry` | `registry.json` and `docs/public/blocks/` |
| `npm run check:generated` | Fail if inventory, skill refs, registry, or docs bit pages are stale |
| `npm run typecheck` | Inventory plus `tsc --noEmit` |
| `npm run lint` | oxlint, then `lint:bits` |
| `npm run lint:bits` | `npx hyperframes lint` on every bit |
| `npm test` | vitest (excludes the packed-package gate) |
| `npm run test:package` | Packs the tarball and runs the published CLI through it |
| `npm run docs:dev` / `docs:build` | Docs site |
| `npm run demo:preview` / `demo:render` | Demo gallery reel |
| `scripts/release.sh` | Full check set. Optional version bump. Does not publish. |

Repo-local CLI after `npm run build`:

```bash
node dist/cli/index.js find "hero intro" --tag text --json
node dist/cli/index.js fetch fade-in --json
node dist/cli/index.js add fade-in --into compositions/
node dist/cli/index.js mcp
```

Release (manual publish):

```bash
scripts/release.sh            # checks only
scripts/release.sh 0.1.1      # checks, then bump package.json and src/version.ts
npm publish --access public   # you run this
```

`npm version` also works: keep `src/version.ts` in sync with `package.json`, then publish. `prepublishOnly` runs the helpers build, inventory, registry, skill refs, and the test suite.

## What a bit is here

In remotion-bits a bit is a self-contained React component rendered by the Remotion player. In HyperFrames the unit of composition is an HTML document with a `data-composition-id` root, `data-start`/`data-duration` timed elements, and a paused GSAP timeline registered on `window.__timelines`. So in hyperbits:

- **A bit** is one self-contained HTML sub-composition file. It can be embedded into any project with `<div data-composition-src="...">` or copied in as a starting point. It carries its own CSS and GSAP timeline and depends only on GSAP from CDN plus optional hyperbits helpers.
- **A component** is a reusable helper, in plain JS, that bits build on: stagger sequencing, easing and interpolation, color and gradient interpolation, particle simulation, responsive sizing, typewriter and counter drivers. Shipped as ES modules and as a single IIFE for `<script>` use in a plain HTML file.
- **A composition variable** contract (`data-composition-variables`) makes bits parametric the HyperFrames way, replacing Remotion's props.

HyperFrames already ships a registry of installable "blocks" via `npx hyperframes add`. hyperbits is positioned as a third-party catalog in the same spirit: motion-first, smaller, agent-searchable, and installable through the same registry-item format where the CLI allows external sources.

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
