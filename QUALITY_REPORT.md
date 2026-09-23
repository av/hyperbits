# Quality report, 2026-09-21

Review of hyperbits 0.1.0 before publication. Every bit was rendered through `npx hyperframes render` (PNG sequence, 2 fps) and inspected frame by frame; the code, scripts, docs and skill were reviewed against actual behaviour. Publishing waits for the next owner review.

## What was wrong

### Rendering defects that made bits unusable

- **Backgrounds vanished in real renders.** Every bit painted its background on the composition root (`#root`, the `data-composition-id` element). The HyperFrames renderer does not paint the root's own background, so standalone renders were fully transparent and the demo reel was black behind every scene. The three gradient bits animated the root background and therefore rendered nothing at all. Tests and `hyperframes lint` did not catch this because they never rendered.
- **Content far too small for 1920x1080.** Hero text in most text bits was about 40 px tall. UI mocks (cli-simulation, chat-conversation, easings-visualizer) sat in a corner at a fraction of the frame. staggered-fade-in was five 60 px squares.
- **White on transparent.** With no background layer, near-white text was invisible in standalone renders.

### Per-bit breakage seen in frames

- basic-counter rendered the literal placeholder `width: 0px` and counted non-monotonically.
- basic-code-block collapsed the whole snippet onto one line; no line reveal was visible.
- basic-typewriter drew the caret at a fixed position far to the right of the typed text.
- counter-confetti never showed any confetti.
- cli-simulation and terminal-3d concatenated output strings without separators.
- flying-through-words overlapped words and froze after two seconds of a ten-second bit; step-timing-context overlapped its copy and clipped at the frame edge; ken-burns showed an offset, clipped panel.
- cube-navigation showed a flat 150 px square most of the time; 3d-basic and 3d-elements had tiny labels and little motion.
- fireflies were one-pixel dots; particles-fountain was two seconds long with no visible arc; scrolling-columns had white gaps.
- feature-showcase was 38 seconds of mostly empty frames with one small title.

### Code and docs defects

- Helper math (`clamp`, `lerp`, hashing, keyframe segments, Oklch mixing, timeline update chaining) was duplicated across seven helper modules.
- Binding conventions (`{ proxy, apply }` versus `stateAt`/`bind`) were inconsistent and undocumented; `stagger` typed its keyframes as loose records; dead aliases and unused exports remained.
- `pick([])` returned `undefined`; `createDrag` skipped the z axis; the helpers barrel could not be imported under Node ESM because Prism subpath imports lacked `.js`.
- The CLI printed an unhelpful error for unknown bit names and commands; MCP tool descriptions were inaccurate.
- The bit-walking logic was copied into four generator scripts; nothing failed when generated inventory, registry, docs or skill references went stale.
- README and docs pages documented removed aliases, led with hand-rolled examples, and did not describe the binding conventions or the close-match errors.
- No test asserted that the package `exports` map matched `dist/`.

## What changed

### Bits (all 46)

- Every bit now has a full-bleed `#bg` layer as the first child of the root; the root carries no background. Gradient bits animate `#bg`. The rule is documented in AGENTS.md, the skill patterns reference and the getting-started page, and enforced by the bit lint script and schema test.
- Type and layout are sized from `viewport()` fractions: hero text 8 to 12 vmin, body 3 to 4 vmin, UI mocks at 60 to 70 percent of the frame. 3D bits use a separate `#scene` layer so the camera does not fight the background.
- Each per-bit defect above was fixed; the 3D scenes, particle bits and feature-showcase were rebuilt (feature-showcase is now six scenes, one per helper, with continuous motion).
- Boilerplate (`bitVars`, `registerTimeline`, GSAP and IIFE tags) is byte-identical across bits and tested. `bit.json` durations must match the root duration. A jsdom test overrides a colour and a string knob per bit and asserts the DOM changes, so every declared variable is live.
- `npx hyperframes check` (layout, motion, contrast) passes on all 46 bits after fixing eight contrast and static-motion cases.
- A second full-tree render review found five leftovers, all fixed and re-rendered: flying-through-words words now fly in separate lanes (with a test that projects their boxes at 20 sample times and asserts no intersections), carousel back faces no longer show mirrored text, cli-simulation keeps its prompt on one line, typing-code-block's panel fits its code, and transform3d-showcase animates a 28 vmin cube instead of a 12 vmin outline.

### Helpers

- Shared `math.ts`; shared Oklch mix; shared timeline update chaining; explicit `GsapProxyBinding` / `TimeStateBinding` / `TimelineBind` types; `createParticles` returns `bind`.
- typewriter hides unread glyphs so the caret sits after the last character; particles gained `delayFrame`, glow, rect shape and per-particle colour; the code helper emits one div per line, which HyperFrames capture renders correctly; `stagger` accepts an absolute `at` position.
- Fixes: `pick([])` throws, drag applies on all axes, Prism imports resolve under Node ESM, dead aliases removed.

### Catalog, CLI, MCP, scripts, docs

- Close-match suggestions for unknown bits and commands; typed CLI error details; accurate MCP descriptions; tests for every command path.
- One shared bit walker in `scripts/lib/bits.mjs`; `npm run check:generated` fails when any generated file is stale and is part of the release script.
- README, helper pages, CLI and MCP pages, SKILL.md and patterns.md rewritten against the real APIs; every README snippet was run.
- Package exports test added.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` (oxlint + `hyperframes lint` on 46 bits) | 0 errors |
| `npm test` | 285 tests pass |
| `npm run check:generated` | up to date |
| `npm run docs:build` | 123 pages |
| `npx hyperframes render` of all 46 bits, contact sheets inspected | no blank or unreadable frames |
| demo reel rendered and inspected | every scene shows its bit with a background |

## Parity pass, 2026-09-21

The owner review after this report judged most bits to be lower-fidelity versions of their remotion-bits originals: flatter motion, wrong timings and eases, a different palette and type, and several bits that were different animations altogether (glitch, counters, particles, all of the 3D scenes and the showcase). A second pass rendered every original with Remotion and every port with HyperFrames at the same size and frame rate, compared them at five points and as side-by-side clips, and rewrote the ports until they match in motion feel and finish.

Results, method and the per-bit before/after fidelity scores are in [docs/parity/README.md](./docs/parity/README.md), with one note per bit in `docs/parity/<bit>.md`.

Helper fixes that came out of it:

- `sceneStateAt` now eases the camera transform twice, as remotion's Scene3D does, so 3D moves accelerate the same way.
- Quaternion multiplication read its own partially written components; chained `rotateX/Y/Z` produced non-unit rotations. Fixed and covered by a test.
- The particle canvas renderer draws the sprite variants of the originals: soft glow, square and diamond shapes, per-particle shape and offset, glow falloff stops, corner radius, alpha colours, and rotation in degrees.
- Bits declare Geist Sans/Mono with inline `@font-face` rules from the fontsource CDN (the linter rejects `<link>`-only fonts) so type matches the docs site.
- Bits that use `hyperbits.stagger` after other tweens pass `at: 0`; the helper otherwise appends at the end of the timeline.

`src/catalog/parity-timing.test.ts` pins the timings that the fixes depend on (linear 30 frame fade, 5 frame box stagger, step fades, double-eased camera, hold keyframes, typewriter cadence, glitch settle).

## Known limits

- Rendering to MP4 on this host still needs an FFmpeg with libx264; the PNG-sequence path was used for verification.
- Visual review was done on 2 fps contact sheets, so sub-second motion quality was judged from the helper tests and spot checks rather than full-rate playback.
