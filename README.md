# hyperbits

![Gallery](./docs/public/gallery.gif)

[![GitHub Packages](https://img.shields.io/badge/github%20packages-%40av%2Fhyperbits-ec8b49?style=flat-square)](https://github.com/av/hyperbits/pkgs/npm/hyperbits)
[![License](https://img.shields.io/github/license/av/hyperbits?style=flat-square&color=%23ec8b49)](https://github.com/av/hyperbits/blob/master/LICENSE)

Ready-made animation bits for [HyperFrames](https://github.com/heygen-com/hyperframes) video compositions, with a discoverable catalog, a CLI, and an MCP server. The sibling of [remotion-bits](https://github.com/av/remotion-bits), rebuilt for HTML + GSAP compositions instead of React.

> [!NOTE]
> This project is not affiliated with or endorsed by HeyGen or the HyperFrames team.

## Status

0.2.0: helpers, 92 bits including 16 seamless motion loops, CLI, MCP server, docs site, demo reel and agent skill.

## Single-step usage

The package is published to GitHub Packages as `@av/hyperbits`; the CLI it installs is `hyperbits`. GitHub Packages needs a token even for public packages, so set up npm once:

```bash
gh auth refresh -h github.com -s read:packages
npm config set @av:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken "$(gh auth token)"
```

Without the `gh` CLI, create a classic token with the `read:packages` scope at https://github.com/settings/tokens/new?scopes=read:packages and use it in place of `$(gh auth token)`.

Then use `npx @av/hyperbits ...`. Locally, after `npm pack`:

```bash
npm exec --package ./av-hyperbits-*.tgz -- hyperbits find "fade in"
```

### CLI

```bash
npx @av/hyperbits find 3d cards
npx @av/hyperbits fetch fade-in --json
npx @av/hyperbits add fade-in --into compositions/
npx @av/hyperbits add fade-in glitch-in --into compositions/ --set background=#0b1020 --set color=#e8ecff
```

Or install the bin globally:

```bash
npm i -g @av/hyperbits
hyperbits find 3d cards
hyperbits add fade-in --into compositions/
```

`add` writes one or more bits into a HyperFrames project (default `compositions/`), copies the helper bundle `hyperbits.iife.js` next to them, and prints a `data-composition-src` snippet for each.

Every bit declares its knobs in `data-composition-variables`. `fetch` lists them (id, type, default, label) before the source, `find --json` and `fetch --json` return them as `variables`, and `add` prints a ready-to-edit override after each snippet:

```html
<div data-composition-src="compositions/fade-in.html" data-variable-values='{"text":"Hello World","color":"#fcc192","background":"#100f0f"}'></div>
```

`--set id=value` (repeatable) bakes new defaults into the installed copies instead. Values are validated against the variable type (colors must be CSS colors), literal copies of the old default in the bit's CSS and markup are rewritten too, and bits that do not declare an id are reported as skipped. An unknown bit or invalid value exits non-zero and writes nothing.

Host CSS is global inside a HyperFrames composition: a host rule for `#root`, `#bg`, `#stage` or `#title` also styles every embedded bit. Use prefixed ids or classes for host elements. See [Host CSS](https://hyperbits.dev/docs/getting-started#host-css).

Every bit works at 16:9, 9:16 and 1:1. `--size` writes the bit at your composition's size; the default is the bit's native size:

```bash
npx @av/hyperbits add fade-in --into compositions/ --size 9:16    # 1080x1920
npx @av/hyperbits add carousel --into compositions/ --size 1:1    # 1080x1080
npx @av/hyperbits add card-stack --into compositions/ --size 16:9 # 1920x1080
npx @av/hyperbits add dot-globe --into compositions/ --size 1080x1350
```

MCP `fetch_hyperbit` accepts the same value as an optional `size` argument.

### MCP

```bash
npx @av/hyperbits mcp
```

Minimal MCP client config:

```json
{
  "command": "npx",
  "args": ["-y", "@av/hyperbits", "mcp"]
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

- `find_hyperbits`: results carry `variableIds`, the knobs each bit exposes
- `fetch_hyperbit`: returns the bit with `variables` (`id`, `type`, `label`, `default`), source and embed snippet

### Add into a HyperFrames project

From a HyperFrames project directory:

```bash
npx @av/hyperbits add fade-in --into compositions/
```

Embed the written file:

```html
<div data-composition-src="compositions/fade-in.html"></div>
```

`npx hyperframes add <bit>` works when the project's `hyperframes.json` sets `registry` to the docs site origin. Per-item files live under `docs/public/blocks/`:

```json
{
  "registry": "https://hyperbits.dev"
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
npm install @av/hyperbits
```

```js
import { interpolate, stagger, viewport } from "@av/hyperbits/helpers";
```

HTML compositions load the IIFE instead. `hyperbits add` copies it next to each bit; it is also at `node_modules/@av/hyperbits/dist/hyperbits.iife.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script src="./hyperbits.iife.js"></script>
```

## Gallery

The [demo project](./demo) sequences one bit per catalog category into a 31-second reel. The rendered file lives at `demo/out/gallery.mp4` and is gitignored. `docs/public/gallery.gif` is the animated README preview; generate it from the reel when you have an FFmpeg with libx264.

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

Each helper is deterministic given a time value so HyperFrames frame-by-frame rendering stays exact. ESM import from `@av/hyperbits/helpers` or `@av/hyperbits/helpers/<name>`. Bits load the IIFE global `hyperbits`.

- `interpolate`: easing map, non-monotonic ranges, GSAP ease-name compatibility
- `stagger`: GSAP timeline from a keyframe spec (`x`/`y`/`rotate`/`scale`/`opacity`, `duration`, `delay`, `stagger`, `hold`)
- `color` / `gradient`: Oklch interpolation via culori, applied through a GSAP `{ proxy, apply }` binding
- `random`: seeded generator (`random`, `randomFloat`, `pick`); renders stay reproducible
- `particles`: deterministic simulator (`stateAt` + `bind`) with spawners and behaviors, bound to a canvas
- `viewport`: composition-relative `vw`/`vh`/`vmin`/`vmax`/`px()` from `data-width`/`data-height`
- `text`: split into chars, words, and lines; typewriter driver
- `counter`: numeric tween (`{ proxy, apply }`) with formatting, prefix, and postfix
- `code`: Prism-highlighted code with line reveal and focus
- `scene3d`: CSS 3D scene (`stateAt` + `bind`) with steps, camera moves, and `Transform3D`; `createCamera` is a keyed look-at camera with lens, roll and quaternion slerp

Reference pages live on the [docs site](https://hyperbits.dev/docs/getting-started).

## Bits

93 bits in 7 categories. Each is a self-contained HTML composition with `bit.json` metadata.

| Category | Count | Bits |
| --- | ---: | --- |
| Text Animations | 27 | `bar-chart`, `basic-code-block`, `basic-counter`, `basic-typewriter`, `blur-slide-word`, `char-by-char`, `cli-simulation`, `counter-confetti`, `crt-boot`, `dither-type`, `extruded-type`, `fade-in`, `glitch-cycle`, `glitch-in`, `led-marquee`, `matrix-rain`, `mosaic-resolve`, `multi-text-typewriter`, `odometer-roll`, `pixel-sort`, `riso-print`, `slit-scan`, `split-flap`, `stat-rings`, `typing-code-block`, `variable-speed-typewriter`, `word-by-word` |
| Staggered Motion | 12 | `card-stack`, `chat-conversation`, `easings-visualizer`, `fracture-reassemble`, `grid-stagger`, `list-reveal`, `lower-third`, `mosaic-reframe`, `paper-fold`, `receipt-print`, `slide-from-left`, `staggered-fade-in` |
| Background Effects | 9 | `circuit-traces`, `conic-gradient`, `hard-light`, `lava-dither`, `linear-gradient`, `moire-field`, `op-art-lens`, `radial-gradient`, `rule-cascade` |
| Motion Loops | 16 | `bauhaus-tiles`, `contour-drift`, `dot-ripple`, `dot-tunnel`, `floating-shapes`, `gyro-rings`, `halftone-sweep`, `horizon-grid`, `phyllotaxis-bloom`, `pinwheel-grid`, `pixel-rain`, `ray-burst`, `speed-streaks`, `truchet-weave`, `wave-stack`, `zoom-polygons` |
| Particles | 9 | `fireflies`, `flow-field`, `particles-fountain`, `particles-grid`, `particles-snow`, `radar-sweep`, `scrolling-columns`, `strange-attractor`, `vector-scope` |
| 3D Scenes | 18 | `3d-basic`, `3d-elements`, `ascii-torus`, `camera-flight`, `carousel`, `cube-navigation`, `cursor-flyover`, `dither-orb`, `dot-globe`, `exploded-stack`, `flying-through-words`, `isometric-city`, `ken-burns`, `step-timing-context`, `terminal-3d`, `transform3d-showcase`, `voxel-type`, `wire-solids` |
| Full Compositions | 2 | `blueprint-draw`, `feature-showcase` |

Browse them in the [catalog](https://hyperbits.dev/docs/bits-catalog).

### Motion loops

Seamless 12-second motion graphics backgrounds in four families: depth, lines, dots and shapes. Frame 12s equals frame 0, so they loop with no seam, and each one is restyled with three palette tokens: `background`, `foreground` and `accent`.

```bash
npx @av/hyperbits find --tag loop --tag dots
npx @av/hyperbits add halftone-sweep --into compositions/
```

```html
<div
  data-composition-id="backdrop"
  data-composition-src="compositions/halftone-sweep.html"
  data-start="0"
  data-duration="12"
  data-variable-values='{"background":"#0b1020","foreground":"#e8ecff","accent":"#5b7cfa"}'
></div>
```

The gallery and the rules for designing new loops are on the [Motion Loops page](https://hyperbits.dev/docs/motion-loops). The set was inspired by the looks in [Scenario's motion backgrounds teaser](https://x.com/emmanuel_2m/status/2112203052488769629). That library is not public, so these loops are original code written for hyperbits.

## Docs

Documentation, playground, and the HyperFrames registry:

https://hyperbits.dev

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
| `npm run check:sizes` | Retarget every bit to 16:9, 9:16 and 1:1, snapshot it, and write contact sheets to `.check-sizes/` |
| `npm test` | vitest (excludes the packed-package gate) |
| `npm run test:package` | Packs the tarball and runs the published CLI through it |
| `npm run docs:dev` / `docs:build` | Docs site |
| `npm run demo:preview` / `demo:render` | Demo gallery reel |
| `scripts/release.sh <version>` | Bump, commit, tag and push; GitHub Actions checks and publishes |

Repo-local CLI after `npm run build`:

```bash
node dist/cli/index.js find "hero intro" --tag text --json
node dist/cli/index.js fetch fade-in --json
node dist/cli/index.js add fade-in --into compositions/
node dist/cli/index.js mcp
```

Release: bump and push a tag, nothing else runs locally.

```bash
scripts/release.sh 0.3.0      # or patch / minor / major
```

The script bumps `package.json`, `package-lock.json` and `src/version.ts`, renames `### Unreleased` in `CHANGELOG.md` to the new version, commits, tags `v<version>` and pushes. The tag starts [`.github/workflows/release.yml`](./.github/workflows/release.yml), which runs the full check set (build, typecheck, lint, tests, packed-package test, generated files, docs build), publishes `@av/hyperbits` to GitHub Packages with the repository's own `GITHUB_TOKEN`, and creates the GitHub release with that version's CHANGELOG notes.

- Package page: https://github.com/av/hyperbits/pkgs/npm/hyperbits
- Dry run: run the Release workflow by hand (`gh workflow run release.yml -f dry_run=true`) to get every check and an `npm publish --dry-run` without publishing.
- Re-run for an existing tag: `gh workflow run release.yml -f tag=v0.2.0 -f dry_run=false`.

CI (`.github/workflows/ci.yml`) runs the same checks on every push to `master` and on pull requests.

## What a bit is here

In remotion-bits a bit is a self-contained React component rendered by the Remotion player. In HyperFrames the unit of composition is an HTML document with a `data-composition-id` root, `data-start`/`data-duration` timed elements, and a paused GSAP timeline registered on `window.__timelines`. So in hyperbits:

- **A bit** is one self-contained HTML sub-composition file. It can be embedded into any project with `<div data-composition-src="...">` or copied in as a starting point. It carries its own CSS and GSAP timeline and depends only on GSAP from CDN plus optional hyperbits helpers.
- **A component** is a reusable helper, in plain JS, that bits build on: stagger sequencing, easing and interpolation, color and gradient interpolation, particle simulation, responsive sizing, typewriter and counter drivers. Shipped as ES modules and as a single IIFE for `<script>` use in a plain HTML file.
- **A composition variable** contract (`data-composition-variables`) makes bits parametric the HyperFrames way, replacing Remotion's props.

HyperFrames already ships a registry of installable "blocks" via `npx hyperframes add`. hyperbits is positioned as a third-party catalog in the same spirit: motion-first, smaller, agent-searchable, and installable through the same registry-item format where the CLI allows external sources.
