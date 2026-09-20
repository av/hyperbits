# HyperFrames authoring patterns

Rules for writing and adapting hyperbits. Keep `AGENTS.md` in sync with this file.

## Composition shape

Every bit is a self-contained HTML composition:

- Root element with `data-composition-id`, `data-width`, `data-height`, `data-start`, and `data-duration`.
- Timed visual elements also get `data-start`, a duration, and `class="clip"`.
- Default size is 1920x1080 unless the bit is intentionally square.
- Load GSAP from `HYPERBITS_GSAP_CDN` (`https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js`). HyperFrames does not inject it.
- Load helpers from the IIFE (`hyperbits.iife.js`) after GSAP.

```html
<div
  id="root"
  class="clip"
  data-composition-id="fade-in"
  data-start="0"
  data-duration="3"
  data-width="1920"
  data-height="1080"
></div>
```

## Paused timelines on `window.__timelines`

Create one root timeline per composition with `{ paused: true }` and register it under the composition id:

```js
const timeline = gsap.timeline({ paused: true });
window.__timelines = window.__timelines || {};
window.__timelines["fade-in"] = timeline;
timeline.seek(0);
```

- The runtime seeks this timeline to render any frame.
- Child timelines added to the root must **not** be paused. A paused child does not advance when the root is seeked.
- Do not use `repeat: -1`. Compute a finite repeat count from the composition duration.
- Supported GSAP methods in this project: `set`, `to`, `from`, `fromTo`, plus `eventCallback("onUpdate")` for canvas and scene helpers.

## Seek-safe motion

Any frame can be rendered from any time. Drive visuals from `timeline.time()` (seconds), not from wall clocks or incremental state.

- Prefer GSAP tweens on the paused root timeline, positioned with the third-argument absolute time: `timeline.to(el, vars, 1.5)`.
- Helpers that need a redraw hook (`typewriter`, `createCounter`, `createParticles`, `createScene3D`) must read `timeline.time()` or bind through `onUpdate`.
- `createParticles(...).stateAt(time)` and `createScene3D(...).stateAt(time)` are deterministic given a time value.
- Do not accumulate motion in `requestAnimationFrame`, `setInterval`, or `Date.now()`.

```js
const { apply } = hyperbits.typewriter(title, { duration: 2 });
timeline.eventCallback("onUpdate", () => apply(timeline.time()));
```

## Seeded randomness

Renders must be reproducible across frames and machines.

- Use `hyperbits.random(seed)`, `randomFloat(seed, min, max)`, `randomInt`, or `pick`.
- Seeds are strings or numbers. Include the particle index, grid cell, or word index in the seed.
- Never call `Math.random()`.

```js
const x = hyperbits.randomFloat(`card-x-${index}`, -view.width, view.width);
```

## Fractional sizing

Size from the composition dimensions, not hardcoded pixels.

```js
const view = hyperbits.viewport();
title.style.fontSize = `${view.vmin * 8}px`;
card.style.width = `${view.px(0.3)}px`;
card.style.height = `${view.px(0.2, "y")}px`;
```

- `view.width` / `view.height` come from `data-width` / `data-height` on the composition root.
- `vw`, `vh`, `vmin`, `vmax` are CSS-like units (dimension / 100).
- `view.px(fraction, axis?)` scales a 0–1 fraction by width (`x`, default), height (`y`), min, or max.

## `data-composition-variables`

User-facing knobs belong on the `<html>` element as a JSON array of `{id, type, label, default}`.

```html
<html lang="en" data-composition-variables='[
  {"id":"text","type":"string","label":"Text","default":"Hello World"},
  {"id":"color","type":"color","label":"Text color","default":"#f8fafc"}
]'>
```

Read them at runtime:

```js
const vars = window.__hyperframes?.getVariables
  ? window.__hyperframes.getVariables()
  : Object.fromEntries(
      JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]")
        .map((entry) => [entry.id, entry.default]),
    );
title.textContent = vars.text;
title.style.color = vars.color;
```

Overrides, lowest to highest:

1. Declared defaults
2. Host `data-variable-values` on a `data-composition-src` embed
3. CLI `--variables` on a top-level render

Do not hide knobs as magic numbers in the script if a user is expected to change them.

## Shader-compatible CSS

Bits that may be captured for shader transitions follow html2canvas limits:

- No `transparent` keyword in gradients. Use `rgba(R, G, B, 0)`.
- No `var()` on elements visible during capture. Use literal colors.
- Explicit `background-color` on scene roots (and pass the same value as `bgColor` if using shader transitions).
- No gradient backgrounds on elements thinner than 4px.
- No gradient opacity below 0.15.
- Mark uncapturable overlays with `data-no-capture`.

Theme tokens in `:root` are fine for authoring, but captured elements need the resolved literal on the element itself. Existing bits already put literal `background-color` on `html`, `body`, and `#root`.

## Embedding via `data-composition-src`

Install with the CLI, then mount as a sub-composition:

```bash
npx hyperbits add fade-in --into compositions/
```

```html
<div
  data-composition-src="compositions/fade-in.html"
  data-start="0"
  data-duration="3"
  data-variable-values='{"text":"Welcome","color":"#f8fafc"}'
></div>
```

`fetch_hyperbit` and `hyperbits add --json` include this snippet. The host composition still needs its own paused root timeline; nested bits register theirs under their own `data-composition-id`.

## Helper binding conventions

Two patterns. Do not mix them on the same helper.

**GSAP proxy `{ proxy, apply }`** — `colorProxy`, `gradientProxy`, `createCounter`. Tween a dummy object, write to the DOM in `onUpdate`:

```js
const { proxy, apply } = hyperbits.createCounter(stat, { postfix: "%" });
timeline.to(proxy, { value: 100, duration: 2, onUpdate: apply }, 0);
```

**Time state `{ stateAt, bind }`** — `createParticles`, `createScene3D`. Sample from `timeline.time()` so any seek is exact:

```js
const sim = hyperbits.createParticles({ spawners: [{ id: "burst", burst: 12 }] });
sim.bind(timeline, canvas, { color: "#fff", size: 4 });
// particles also keep the free function: hyperbits.bind(timeline, canvas, sim, options)

const scene = hyperbits.createScene3D(root, { steps: [{ id: "intro" }] });
scene.bind(timeline);
```

`stagger` is neither: it returns a GSAP timeline. `typewriter` / `applyTypewriter` take `time` directly.

## Combining bits with stagger and helpers

Adapt a fetched bit, then layer helpers instead of rewriting motion from scratch.

**Stagger split text**

```js
const view = hyperbits.viewport();
title.style.fontSize = `${view.vmin * 6}px`;
const words = hyperbits.splitText(title, "words");
const timeline = gsap.timeline({ paused: true });
hyperbits.stagger(
  words,
  { opacity: [0, 1], y: [view.vmin * 2, 0], duration: 0.4, stagger: 0.06, ease: "easeOutCubic" },
  timeline,
);
window.__timelines = window.__timelines || {};
window.__timelines["word-by-word"] = timeline;
```

**Counter plus particles**

```js
const { proxy, apply } = hyperbits.createCounter(stat, { prefix: "", postfix: "" });
timeline.fromTo(proxy, { value: 0 }, { value: 1000, duration: 2, onUpdate: apply }, 0);
const sim = hyperbits.createParticles({
  fps: 30,
  spawners: [{ id: "burst", burst: 40, rate: 0, lifespan: 45, position: { x: view.width / 2, y: view.height / 2 } }],
  behaviors: [{ id: "gravity", handler: hyperbits.createGravity({ y: 0.3 }) }],
});
hyperbits.bind(timeline, canvas, sim, { color: "#f59e0b", size: view.vmin * 0.5 });
```

**Gradient under staggered content**

```js
const { proxy, apply } = hyperbits.gradientProxy(root, [
  "linear-gradient(0deg, #051226, #1e0541)",
  "linear-gradient(180deg, #a5d4dd, #5674b1)",
]);
timeline.to(proxy, { progress: 1, duration: 3, ease: "none", onUpdate: apply }, 0);
hyperbits.stagger(".item", { opacity: [0, 1], duration: 0.5, stagger: 0.08 }, timeline);
```

When combining two full bits, embed both with `data-composition-src` and stagger their `data-start` times rather than inlining two root timelines into one file.

## Adding a new bit

1. Create `bits/<category>/<name>/` with `index.html`, `bit.json`, and optional `preview.png`.
   Categories: `text-animations`, `staggered-motion`, `background-effects`, `particles`, `scenes-3d`, `full-compositions`.
2. Follow every rule in this file.
3. Put theme colors as literals in a top-level `:root` block. No emoji as visual elements; use inline SVG.
4. List used helpers in `bit.json`.
5. Pass `npx hyperframes lint` (via `npm run lint:bits` in this repo).
6. Run `npm run inventory` so `src/catalog/inventory.generated.*` and `skills/hyperbits/references/{bits,helpers}.md` stay in sync.
