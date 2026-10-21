# Motion loops

Seamless 12-second motion graphics backgrounds: flat, graphic, one canvas, restyled with three palette tokens. Use this file to pick, restyle, or design a loop. The general authoring rules in `patterns.md` still apply.

## The catalog

Bits live in `bits/motion-loops/`. Each is tagged `loop`, `background` and one family:

| Family | Bit (title) | Structural knobs |
| --- | --- | --- |
| `depth` | `horizon-grid` (Horizon Ridges): wireframe ridgelines rolling toward a striped sun | `ridges` |
| `depth` | `dot-tunnel` (Dot Helix Tube): a dotted tube seen from the side, rings spinning into helix stripes | `frames` (rings), `dots` |
| `depth` | `zoom-polygons` (Polygon Procession): hexagon panels stepping forward in a diagonal procession | `sides`, `twist` (card tilt) |
| `depth` | `gyro-rings` (Orrery Rings): tilted planetary orbits around an off-centre sun | `rings`, `seed` |
| `lines` | `speed-streaks` (Light Trails): a few long-exposure light trails tracing looping paths | `streaks`, `seed` |
| `lines` | `wave-stack` (Twisting Ribbon): one striped ribbon twisting across a dark field | `lines` (stripes) |
| `lines` | `ray-burst` (Sunburst Horizon): retro sunburst wedges above a striped half-sun | `rays` (wedges) |
| `lines` | `contour-drift` (Terraced Island): a single island of stacked contour terraces | `levels`, `seed` |
| `dots` | `halftone-sweep` (Halftone Orbs): a square halftone screen forming three orbiting orbs | `pitch` |
| `dots` | `dot-ripple` (Ripple Drum): a tilted drumhead of polar dot rings struck off-centre | `wavelength` |
| `dots` | `phyllotaxis-bloom` (Phyllotaxis Bloom): flower heads whose petals open in waves | `dots` (florets) |
| `dots` | `pixel-rain` (Pixel Rain): night rain falling into a pixel lake and splashing | `columns`, `seed` |
| `shapes` | `bauhaus-tiles` (Bauhaus Poster): large shapes trading places on four eased beats | `beat` (hold) |
| `shapes` | `truchet-weave` (Truchet Mandala): Truchet arcs on the rings of a round medallion | `rings`, `seed` |
| `shapes` | `floating-shapes` (Shape Mobile): a hanging mobile of balanced arms and cutouts | `sway` |
| `shapes` | `pinwheel-grid` (Pinwheel Garden): paper pinwheels on stems spinning in gusts | `pinwheels`, `seed` |

Ids are stable; titles describe the current design.

```bash
npx hyperbits find --tag loop --tag lines --json
npx hyperbits fetch contour-drift --json
```

## Restyle

Every loop declares the same palette tokens in `data-composition-variables`, in this order:

- `background`: the field colour, painted on `#bg`
- `foreground`: ink for the main marks or a highlight
- `accent`: the brand colour that carries the motion

Pass brand colours on the embed with `data-variable-values`, or on `hyperframes render` with `--variables`. Do not edit the drawing code to recolour a loop. Dark, light and saturated fields all work. Most loops default to a dark field; `ray-burst`, `phyllotaxis-bloom`, `bauhaus-tiles` and `floating-shapes` default to paper. Put the brand colour in `background` for a bold field, or in `accent` on a dark or paper field.

Structural knobs (see the table: for example `ridges`, `rings`, `sway`, `pinwheels`, `seed`) change density, layout or motion range. Keep them as numbers; loops round them where the seam depends on a whole count.

A loop lasts 12 seconds. For longer backgrounds, place copies back to back (`data-start` 0, 12, 24). Frame 12s equals frame 0, so the joins are invisible.

## Design a new loop

Fetch the closest loop and keep its shell: `#bg` first, one full-bleed `<canvas id="stage">`, a paused 12-second timeline that tweens `proxy.time` from 0 to 12 and calls `draw((proxy.time % loop) / loop)`. All drawing happens in `draw(phase)`, with `phase` in `[0, 1)`. Read colours once with `channels(vars.accent)` (built on `hyperbits.mixOklch`) and paint with `rgba(channels, alpha)`.

The seam rules:

1. Nothing keeps state between frames. `draw(phase)` computes the whole frame from `phase` and setup data.
2. Every periodic term completes a whole number of cycles per loop: `Math.sin(turn * (phase * 2 + offset))`, never `phase * 1.5`.
3. Anything that travels moves a whole number of pattern repeats per loop. Scroll a grid by whole rows (`(phase * rows) % 1`), wrap a stream with `(offset + phase * laps) % 1` and integer `laps`, advance a self-similar zoom by whole layers, and by an even count when layers alternate colours.
4. Rotations use the shape's symmetry: 90° per loop is a full cycle for a square, 180° for a Truchet tile or a two-colour pinwheel, 120° for a triangle, a full turn for anything asymmetric. Staggered tile turns use `whole = Math.floor(phase * beats - delay)` plus an eased fraction, with `beats` quarter turns adding up to the symmetry.
5. Things appear and disappear at zero size or zero opacity: fade to nothing at the far plane, grow from zero at the centre, decay an envelope to nothing before the wrap.
6. Identity that shifts with motion (a highlighted ring, a coloured spiral arm) must shift by a multiple of its own period, or the highlight jumps at the seam.
7. Randomness is seeded and drawn once at setup (`hyperbits.random`, `randomFloat`, `pick`), keyed by a `seed` knob.
8. Tints come from the tokens: mix the accent toward the background for a muted tone. Interpolate channels in sRGB for these mixes; Oklch hue interpolation between a chromatic and a near-neutral colour drifts toward unrelated hues.

Style rules that keep the set coherent:

- One accent per loop plus ink and field. Flat fills, crisp strokes, at most one soft glow or vignette.
- Size marks from `view.vmin`; line weights 0.1 to 0.6 vmin. Remember `view.vmin`, `view.vw` and friends are 1% units.
- Fill the frame edge to edge. Background loops sit behind type, so keep the centre calm or the motion even.
- Guard drawing with `if (!context || typeof context.stroke !== "function") return;` so the catalog tests can run the bit without a real canvas.

## Verify

1. `npm run lint:bits` and `npm test` (the `motion-loops` test checks the 12-second duration, the palette tokens, that 0s and 12s draw the same frame, and that changing the foreground or accent token repaints the frame).
2. Check the seam on real pixels. With the bit open in a browser:

```js
const timeline = window.__timelines["<bit-name>"];
const canvas = document.getElementById("stage");
const read = (seconds) => {
  timeline.seek(seconds, false);
  return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
};
const step = (from, to) => {
  const left = read(from);
  const right = read(to);
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) sum += Math.abs(left[index] - right[index]);
  return sum / left.length;
};
console.log({
  lastStep: step(12 - 2 / 30, 12 - 1 / 30),
  seamStep: step(12 - 1 / 30, 12),
  firstStep: step(0, 1 / 30),
});
```

`seamStep` must sit in line with `lastStep` and `firstStep`. A seam step several times larger means a term breaks rule 2, 3, 4 or 6.

3. Render once and watch it on repeat: `npx hyperframes render <bit-dir> --output renders/<name>.mp4`.
