### Project

hyperbits is a catalog of animation bits and helpers for HyperFrames (HTML + GSAP video compositions). Read README.md for the rebuild outline and the definition of a bit. The sibling project remotion-bits is the reference for structure and tooling; do not copy its React code, port the ideas onto HyperFrames primitives.

The agent skill lives at `skills/hyperbits/SKILL.md` (references in `skills/hyperbits/references/`). Keep AGENTS.md, that skill, and `references/patterns.md` aligned. Catalog and skill bit lists are generated:

- `npm run inventory` — `scripts/generate-inventory.mjs` then `scripts/generate-skill-refs.mjs`
- `npm run skill:refs` — regenerate `skills/hyperbits/references/bits.md` and `helpers.md` only

### Task execution

Keep going until the query is completely resolved before yielding. Do not guess or make up an answer.

### Development

- `npm run typecheck` — inventory + `tsc -p tsconfig.json --noEmit`
- `npm run lint` / `npm run lint:fix` — oxlint (config: `.oxlintrc.json`)
- `npm run format` / `npm run format:check` — oxfmt (config: `.oxfmtrc.json`)
- `npm test` — vitest + jsdom
- `npm run build` — compile `src/` to `dist/`
- `npm run inventory`, `npm run skill:refs`, `npm run registry`, `npm run docs:*`

Generated output lives in `dist/`. Do not commit `dist/`, `node_modules/`, `coverage/`, or `*.tgz`. Inventory and registry generators write under `src/catalog/` and the repo root; those files are committed when they exist. Skill reference markdown under `skills/hyperbits/references/bits.md` and `helpers.md` is generated and committed.

Bits live in `bits/<category>/<name>/` (`index.html`, `bit.json`, optional `preview.png`). Categories: `text-animations`, `staggered-motion`, `background-effects`, `particles`, `scenes-3d`, `full-compositions`.

Bits load GSAP themselves from `https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js` (`HYPERBITS_GSAP_CDN`). HyperFrames does not inject it.

### Coding guidelines

- Fix problems at the root cause rather than applying surface-level patches.
- Avoid unneeded complexity. Keep changes minimal and focused.
- Do not add comments within code unless explicitly requested.
- Do not use one-letter variable names.
- Do not add copyright or license headers.
- Commit on the current branch with conventional messages (`feat:`, `chore:`, `test:`, `docs:`). Do not create branches.
- Do not create markdown files that describe the work you did.

### Adding bits

These rules match `skills/hyperbits/references/patterns.md`. Do not add a parallel set.

- Create `bits/<category>/<name>/` with `index.html`, `bit.json`, and optional `preview.png`.
- Every bit is a self-contained HTML composition with a `data-composition-id` root, `data-width` and `data-height`, timed elements using `data-start` and `data-duration`, and `class="clip"` on timed visuals.
- Never paint on the composition root. Use a full-bleed `#bg` layer as the first child (`data-start="0"`, `data-duration` equal to the bit, literal `background-color`). Keep `html, body` backgrounds for Studio preview. Animate gradients on `#bg`, not `#root`. `#root` must not declare `background` or `background-color`.
- Timelines are created with `{ paused: true }` and registered on `window.__timelines` under the composition id. Child timelines added to that root must not be paused. Motion must be seek-safe: any frame can be rendered from any time. Drive canvas, typewriter, counter, particle, and 3D helpers from `timeline.time()`.
- Use seeded randomness only (`hyperbits.random`, `randomFloat`, `pick`). Renders must be reproducible. No `Math.random()` or `Date.now()`.
- Size elements fractionally from the composition dimensions via `hyperbits.viewport(root)` (`vmin`, `vmax`, `vw`, `vh`, `px()`), not with hardcoded pixel values. Hero text is 8–12 vmin, body text 3–4 vmin, UI mocks at least 60% of the frame.
- Expose user-facing knobs through `data-composition-variables`. Read them with `window.__hyperframes.getVariables()`.
- For staged in and out motion, prefer `hyperbits.stagger(...)` over hand-written per-element tweens.
- Color, gradient, and counter helpers return `{ proxy, apply }`. Particles and scene3d use `stateAt(time)` plus `bind`.
- Theme colors are literal values in a top-level `:root` block.
- Every bit must pass `npx hyperframes lint` before it is considered done (`npm run lint:bits`).
- No emoji as visual elements. Use inline SVG.
- Bits meant for shader transitions follow the shader-compatible CSS rules: no `transparent` in gradients (use `rgba(..., 0)`), no `var()` on captured elements, explicit `background-color` on scenes.
- Embed a bit in a host composition with `data-composition-src` (and optional `data-variable-values`). `npx hyperbits add <name> --into compositions/` is the install path.
- After adding or changing a bit, run `npm run inventory` so the catalog and skill references stay in sync.

### Maintaining the skill

The skill file at `skills/hyperbits/SKILL.md` is the agent entry point (MCP first, CLI second, direct files last). Keep it synchronized when making changes:

- Adding or renaming helpers: `src/helpers/` plus `npm run skill:refs` (rewrites `references/helpers.md` from helper sources).
- Adding or changing bits: `bits/**` plus `npm run inventory` (rewrites inventory and `references/bits.md`).
- Changing authoring rules: update `references/patterns.md` and this AGENTS.md section together.
- Default discovery workflow, CLI/MCP commands, and adaptation rules live in `SKILL.md`; detailed APIs and the bit list are generated references.
