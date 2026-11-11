# hyperbits launch video

A 36-second HyperFrames composition that announces hyperbits using all 62 catalog bits, live and restyled to the site palette through their own variables, as tiles in one 3D scene.

## Build

From the repository root:

```bash
npm run build
cd launch
npm run sync
```

`sync` (`scripts/build.mjs`) installs every bit into `compositions/` with the local `hyperbits add`, snapshots a poster frame per bit into `public/posters/`, and writes `index.html` from `src/template.html` and `src/launch.js`. Pass `--skip-posters` to reuse existing posters.

## Preview and render

```bash
npm run preview
npm run render
```

`render` writes `out/hyperbits-launch.mp4` at 60 fps. For camera motion blur, render at 240 fps and average four subframes into each output frame:

```bash
npx --yes hyperframes@0.8.29 render --fps 240 --quality high --output out/launch-240.mp4
ffmpeg -i out/launch-240.mp4 -vf "tmix=frames=4,fps=60" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart out/hyperbits-launch.mp4
```

## Structure

- `src/launch.js` drives everything from the root timeline time: an eased look-at camera with lens changes, tile formations (grid, portal, category spotlights, logo mosaic), the inspector sweep, the terminal and the HUD. Styling follows `docs/src` (palette, Geist, cards, chips, glow).
- Each tile chains several `data-composition-src` clips of its bit, offset with `data-media-start`, so it stays live across the video. Dive and carousel tiles get one long clip timed to their close-up.
