### v0.3.0

- Variables: every bit's `data-composition-variables` are catalog metadata. `hyperbits fetch` prints them before the source, `find --json` and `fetch --json` return `variables`, `find_hyperbits` returns `variableIds`, `fetch_hyperbit` returns `variables`, and registry items, `references/bits.md` and the per-bit doc pages list them
- CLI: `hyperbits add` takes several bits, prints a ready-to-edit `data-variable-values` example per bit, and `--set id=value` bakes validated defaults into the installed copies, including the literal copies of the old default in their CSS and markup. Bits that do not declare an id are reported as skipped; an unknown bit or invalid value exits non-zero and writes nothing
- Docs: host CSS reaches into embedded bits through their generic ids (`#root`, `#bg`, `#stage`, `#title`); the getting-started page and `references/patterns.md` give the rules for host authors
- Sizes: every bit works at 16:9, 9:16 and 1:1. `hyperbits add --size <9:16|1:1|16:9|WIDTHxHEIGHT>` and the `size` argument of `fetch_hyperbit` retarget a bit to the host's size, and bits lay themselves out for portrait and square instead of squeezing a landscape frame. `npm run check:sizes` snapshots every bit at each size into contact sheets
- Fix: `lava-dither`, `op-art-lens`, `radar-sweep`, `vector-scope`, `voxel-type`, `dither-type` and `pixel-sort` called an undefined `smoothstep` and rendered blank in v0.2.7
- Camera: `createCamera` in `scene3d` is a seek-safe look-at camera with keyed position, target, roll and lens, per-segment easing and quaternion slerp, plus pure `cameraStateAt`, `cameraToCSS`, `cameraProject` and `lookAtOrientation` for custom renderers. New `camera-flight` bit shows it off. `Quat.slerp` now interpolates nearly identical rotations instead of snapping to the midpoint
- Launch: `launch/` is the source of the launch video, one HyperFrames composition with every catalog bit live in a CSS 3D scene

### v0.2.7

- Bits: 30 new scenes and components in the hyperbits.dev palette (near-black field, warm paper ink, orange accent), each built on a technique the catalog did not cover yet. Dithering and pixel work: `dither-orb`, `dither-type`, `lava-dither`, `mosaic-resolve`, `pixel-sort`, `led-marquee`. Isometric and line-art 3D: `isometric-city`, `exploded-stack`, `voxel-type`, `wire-solids`, `blueprint-draw`. Text-mode, print and retro hardware: `ascii-torus`, `crt-boot`, `split-flap`, `riso-print`, `receipt-print`, `odometer-roll`, `vector-scope`, `radar-sweep`. Generative and optical: `strange-attractor`, `flow-field`, `moire-field`, `op-art-lens`, `rule-cascade`, `circuit-traces`, `hard-light`, `dot-globe`. Typography in 3D and time: `extruded-type`, `slit-scan`, `paper-fold`

### v0.2.6

- Validation: pin HyperFrames lint/check to the same published 0.8.29 version as the demo. Newer unpinned CLI releases scan the bundled helper runtime as composition code and reject every bit. No lint rules are disabled.

- Text: character splitting and all three typewriter bits reveal whole Unicode graphemes, keeping combining accents, flags and joined characters intact when typing, deleting and seeking.

- Demo: use the published HyperFrames 0.8.29 CLI so the documented preview, check, lint and render commands install successfully.

### v0.2.5

- Unpublished: release validation failed before package publication. Changes ship in v0.2.6.

### v0.2.4

- Skill: `references/helpers.md` shows the local `./hyperbits.iife.js` that `hyperbits add` and `hyperframes add` write, plus the hyperbits.dev copy, instead of the unpkg URL that does not serve

### v0.2.3

- Registry: `npx hyperframes add <bit>` from the hyperbits.dev registry now installs `hyperbits.iife.js` next to the bit and points the bit at it, so registry-installed bits animate. Previously the registry rewrote the helper to unpkg, which only serves npmjs.com
- Metadata and docs: `bit.json` `iifeCdn` and the exported `HYPERBITS_HELPER_URL` (was `HYPERBITS_UNPKG_IIFE`) point at `https://hyperbits.dev/vendor/hyperbits.iife.js`; getting-started no longer shows the unpkg script tag

### v0.2.2

- CLI: `hyperbits add` and `fetch` now print only the local helper tag (`<script src="./hyperbits.iife.js">`); the npmjs CDN advice is gone. Bits no longer carry the dead unpkg `data-hyperbits-src` attribute

### v0.2.1

- CLI: `hyperbits add` copies the helper bundle (`hyperbits.iife.js`) next to the bit and points the bit at it, so added bits animate without any CDN. Previously they loaded the bundle from unpkg, which only serves npmjs.com
- Docs: copy buttons on the landing page and in the bit playground copy on click, Enter and Space, show a Copied state, and fall back to a selection copy on non-secure origins
- Package: published to GitHub Packages as `@av/hyperbits` (the CLI is still `hyperbits`); install docs show the one-time npm setup GitHub Packages needs
- CI: GitHub Actions CI on every push and pull request; tag-driven release workflow that runs the full checks, publishes `@av/hyperbits` to GitHub Packages and creates the GitHub release. `scripts/release.sh` now only bumps, tags and pushes

### v0.2.0

- 16 Motion Loops bits in a new `motion-loops` category: seamless 12-second loops in four families (depth, lines, dots, shapes), each restyled with `background`, `foreground` and `accent` palette tokens and shipped with a `preview.png`. Fifteen are calm backgrounds for text and UI; Bauhaus Poster is a standalone composition.
- Agent skill: a Motion loops section in `SKILL.md` and `references/motion-loops.md` covering picking, restyling, the seam rules and the background rules for designing new loops
- Docs: Motion Loops page with a family-filtered live gallery and design rules; catalog cards show `preview.png` posters before the live player mounts

### v0.1.0

Initial release of hyperbits, a catalog of animation bits and helpers for HyperFrames HTML + GSAP compositions.

- Helpers: `interpolate`, `stagger`, `color`, `gradient`, `random`, `particles`, `viewport`, `text`, `counter`, `code`, `scene3d`. Shipped as ESM subpath exports and as `dist/hyperbits.iife.js`.
- 46 bits across 6 categories:
  - Text Animations: 17
  - Staggered Motion: 10
  - Background Effects: 3
  - Particles: 5
  - 3D Scenes: 10
  - Full Compositions: 1
- CLI: `hyperbits find`, `hyperbits fetch`, `hyperbits add`, `hyperbits mcp`
- MCP server on stdio with `find_hyperbits` and `fetch_hyperbit`
- Docs site (Astro Starlight) with catalog, playground, helper reference, CLI and MCP pages, and a HyperFrames registry at the docs origin
- Agent skill at `skills/hyperbits/SKILL.md` with generated helper and bit references
- Demo HyperFrames project that sequences one bit per category into a gallery reel
