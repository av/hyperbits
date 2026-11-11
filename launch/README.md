# hyperbits launch video

A 38-second HyperFrames composition that announces hyperbits using all 62 catalog bits, live, as tiles in one 3D scene.

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

`render` writes `out/hyperbits-launch.mp4` at 60 fps. For camera motion blur, render at 120 fps and blend frame pairs:

```bash
npx --yes hyperframes@0.8.29 render --fps 120 --quality high --output out/launch-120.mp4
ffmpeg -i out/launch-120.mp4 -vf "tmix=frames=2,fps=60" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p out/hyperbits-launch.mp4
```

## Structure

- `src/launch.js` drives everything from the root timeline time: a look-at camera on monotone splines, tile formations (tunnel, curved wall, logo mosaic), the inspector sweep, the terminal and the HUD.
- Each tile chains several `data-composition-src` clips of its bit, offset with `data-media-start`, so it stays live across the video. Dive and carousel tiles get one long clip timed to their close-up.
