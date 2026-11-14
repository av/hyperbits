# hyperbits launch video

A 36-second HyperFrames composition that announces hyperbits using every catalog bit, live and restyled to the site palette through their own variables, as tiles in one 3D scene. Bit and category counts in the video come from the catalog inventory at build time.

## Build

From the repository root:

```bash
npm run build
cd launch
npm run sync
```

`sync` (`scripts/build.mjs`) installs every bit into `compositions/` with the local `hyperbits add`, snapshots a poster frame per bit into `public/posters/`, and writes `index.html` from `src/template.html` and `src/launch.js`. It prints the tile and live clip counts. Pass `--skip-posters` to reuse existing posters, or `--refresh-posters` to regenerate all of them.

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
- `scripts/build.mjs` lays the tiles out on a 12×8 grid at a 520×310 pitch and passes the layout to `launch.js` in `LAUNCH_DATA`. Unused slots are trimmed from the corners. The opening hero (`HERO`, flow-field) takes the slot nearest the centre, then the `FEATURED` bits fill the slots the camera dwells on, from the centre out, and the `BASIC` bits take the edges and corners. Categories are scattered, so each category spotlight lifts its tiles across the whole wall. Camera keys and formations in `launch.js` are tuned to this grid; if the catalog outgrows it, the build stops and the grid and keys need refitting.
- Beats: hook on the hero close-up and pull-back (0–2.8 s), brand push through a portal (2.8–6.2 s), catalog wide shot with category spotlights (6.2–9.8 s), inspector sweep (9.8–12.3 s), four dives (`DIVES`: dither-orb, pixel-sort, op-art-lens, voxel-type; 12.3–21 s), agent terminal where `hyperbits find` and `hyperbits add` pull in `AGENT_PICK` (camera-flight), which flies out of the wall (21–28 s), logo mosaic lockup (28–36 s). The terminal lines are the real CLI output for those commands; update them if the CLI or catalog changes.
- Each tile chains `data-composition-src` clips of its bit, offset with `data-media-start`, so it stays live where it is on screen. Every clip instance is seeked on every frame, so render time follows the clip count, not the clips on screen. `windows` in `build.mjs` caps the clips per beat: tiles away from the dives and outside the agent shot get none there, the most expensive bits (`heavyBits`) get fewer, and a tile shows its poster between clips. The hero, dive and agent pick tiles get one long clip timed to their close-up. Non-16:9 bits are cover-fit into the 480×270 card.
- Posters are only generated when missing. After bits change, run `npm run sync -- --refresh-posters` so posters match the new bits.
