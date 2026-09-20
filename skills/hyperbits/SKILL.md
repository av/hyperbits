---
name: hyperbits
description: >
  Animation bits, helpers, CLI, and MCP server for HyperFrames HTML + GSAP
  compositions. Use when searching or installing hyperbits, HyperFrames bits,
  animation bits, GSAP compositions, text animations, staggered motion,
  particles, 3D scenes, gradient backgrounds, counters, typewriters, or code
  reveals. Prefer existing bits over hand-built motion.
---

# Hyperbits

Use this skill to build HyperFrames compositions from live hyperbits examples first. Fall back to helpers only when no bit is close enough.

## Default workflow

1. Start with `find_hyperbits` using the visual goal, motion style, or scene description.
2. Fetch the best one or two matches with `fetch_hyperbit`.
3. Adapt the closest bit before composing from helpers.
4. If multiple bits match, prefer the simplest one that satisfies the request.
5. If the request is multi-step, camera-driven, or presentation-like, bias toward `scenes-3d` bits.
6. When adapting a bit, keep fractional `viewport()` sizing, paused timelines on `window.__timelines`, and `data-composition-variables` knobs.

Treat the catalog bits as the primary library of working patterns. Reach for helpers only after checking whether an existing bit already gives you the composition shape, timing, and layout.

## Fallback chain

1. MCP first.
   Use `find_hyperbits` for discovery and `fetch_hyperbit` for the full HTML source.
2. CLI second.
   Use `npx hyperbits find "hero intro" --tag text --json` and `npx hyperbits fetch fade-in --json`. Install with `npx hyperbits add fade-in --into compositions/`.
3. Direct file inspection last.
   Inspect `bits/<category>/<name>/index.html` and `bit.json`, then adapt the nearest example.

If the MCP surface is available, use it before the CLI. If the CLI is available, use it before reading files directly.

## CLI and MCP setup

Use the published package when you do not want a repo-local workflow:

```bash
npx hyperbits find 3d cards
npx hyperbits fetch fade-in --json
npx hyperbits add fade-in --into compositions/
```

Start the MCP server from the published package:

```bash
npx hyperbits mcp
```

When an agent or MCP client needs a stdio command, point it at:

```json
{
  "command": "npx",
  "args": ["-y", "hyperbits", "mcp"]
}
```

```json
{
  "command": "hyperbits",
  "args": ["mcp"]
}
```

Inside this repository, after `npm run build`:

```bash
node dist/cli/index.js find "hero intro" --tag text --json
node dist/cli/index.js fetch fade-in --json
node dist/cli/index.js add fade-in --into compositions/
node dist/cli/index.js mcp
```

`add` writes the bit HTML into a HyperFrames project (default `compositions/`) and prints a `data-composition-src` snippet. `npx hyperframes add` does not take a registry URL; `hyperbits add` is the guaranteed install path.

## How to search well

- Search by the visual outcome: `flying camera through cards`, `counter with confetti`, `typewriter terminal`, `gradient background`, `staggered grid reveal`.
- Add tags when the shape is obvious: `scene-3d`, `text`, `particles`, `gradient`, `code`, `counter`.
- Fetch one strong match and one backup when the request is ambiguous.
- Prefer the example with the fewest moving parts that still satisfies the request.

## Adaptation rules

These match `references/patterns.md` and `AGENTS.md`. Do not invent a parallel set.

- Keep `viewport()` sizing. Prefer `view.vmin`, `view.vmax`, `view.vw`, `view.vh`, and `view.px()` over hardcoded pixels.
- Keep theme colors as literal values in a top-level `:root` block. Do not swap in an arbitrary palette unless the user asked for one.
- Expose user-facing knobs through `data-composition-variables`. Read them with `window.__hyperframes.getVariables()`.
- Create the root timeline with `{ paused: true }` and register it on `window.__timelines[compositionId]`. Motion must be seek-safe.
- Use seeded randomness (`hyperbits.random`, `randomFloat`, `pick`). Never `Math.random()` or `Date.now()`.
- For staged in and out motion, prefer `hyperbits.stagger(...)` over hand-rolled per-element tweens.
- For presentation flows, preserve the bit's step structure first, then change content, camera targets, and timing.
- Bits load GSAP themselves from `HYPERBITS_GSAP_CDN`. Do not assume the host injects it.
- Run `npx hyperframes lint` on the composition before considering the bit done.

## Helper quick reference

- `viewport`: composition-relative sizing. Use it in nearly every bit.
- `stagger`: shared sequencing for lists, grids, card stacks, and split text. Avoid per-child frame math when the motion is staggered transforms and opacity.
- `splitText` / `typewriter`: text reveal. Use these instead of rebuilding character spans.
- `createCounter`: numeric tween with prefix, postfix, and separators.
- `createCodeBlock` / `applyLineReveal` / `applyLineFocus`: syntax-highlighted code with line reveal and focus.
- `colorProxy` / `gradientProxy`: Oklch color and CSS-gradient interpolation driven by a GSAP proxy.
- `createParticles` / `bind`: deterministic particle simulation onto a canvas.
- `createScene3D` / `Transform3D`: camera steps and 3D placement. Use when the request is a flythrough, multi-step walkthrough, or camera-driven showcase.
- `random` / `randomFloat` / `pick`: seeded values only.

## Common decision rules

- Need the same motion on repeated children: use `stagger`.
- Need text-specific reveal: start with `splitText` or `typewriter`, then `stagger`.
- Need counting: use `createCounter`.
- Need code on screen: use `createCodeBlock`.
- Need ambient emitters: use particle helpers.
- Need scene-to-scene camera motion: use `createScene3D`.

## Example-first patterns

- Text request: find a text bit, fetch it, then swap copy, timing, and split mode.
- Counter request: find a counter example, then adapt values, labels, and particle accents.
- Code request: find a code-block or typewriter example, then adapt the sample and highlight regions.
- Background request: find a gradient or particle example, then adapt palette, density, and duration.
- Presentation request: find a `scenes-3d` example first, then adapt step positions, titles, and card content before introducing new helpers.

## Minimal operational examples

```bash
# MCP
find_hyperbits {"query":"camera flythrough product showcase","tags":["scene-3d"],"limit":2}
fetch_hyperbit {"id":"carousel"}

# CLI
npx hyperbits find "camera flythrough product showcase" --tag scene-3d --limit 2 --json
npx hyperbits fetch carousel --json
npx hyperbits add carousel --into compositions/
```

## References

- `references/helpers.md` — generated from helper sources
- `references/bits.md` — generated from the bit inventory
- `references/patterns.md` — HyperFrames authoring rules

Regenerate the first two with `npm run skill:refs` (also runs as part of `npm run inventory`).
