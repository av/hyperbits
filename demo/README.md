# hyperbits demo

HyperFrames project that sequences catalog bits into a 31-second gallery reel. Use it as the manual test bed and the source of the README gallery video.

## Setup

From the repository root:

```bash
npm run build
npm run demo:sync
```

`demo:sync` copies `dist/hyperbits.iife.js` into `demo/public/` so nested bits load helpers locally instead of from unpkg.

## Preview and render

```bash
npm run demo:preview
npm run demo:render
```

Or from this directory:

```bash
npm run preview
npm run render
```

Render writes `out/gallery.mp4` (gitignored). Preview opens HyperFrames Studio. `npx hyperframes render` encodes with libx264; if the host FFmpeg lacks it, use `--docker` or encode a `--format png-sequence` with another H.264 encoder.

## Adding bits

Bits in `compositions/` were installed with the local CLI so `add` is the path a user hits:

```bash
cd demo
node ../dist/cli/index.js add <bit> --into compositions/
```

Examples:

```bash
node ../dist/cli/index.js add fade-in --into compositions/
node ../dist/cli/index.js add fireflies --into compositions/
```

`add` writes `compositions/<bit>.html` and prints a `data-composition-src` snippet. After adding, point the helper script at the local IIFE (root-relative; compositions are served from the project root):

```html
<script src="public/hyperbits.iife.js"></script>
```

Then embed it on the main timeline:

```html
<div
  class="scene clip"
  data-composition-id="scene-fade-in"
  data-composition-src="compositions/fade-in.html"
  data-start="0"
  data-duration="4"
  data-track-index="0"
></div>
```

Published installs use `npx hyperbits add <bit> --into compositions/` the same way.

## Gallery reel

31 seconds at 1920×1080, one bit per catalog category:

| Start | Duration | Bit | Category |
| --- | --- | --- | --- |
| 0s | 4s | `fade-in` | text-animations |
| 4s | 4s | `staggered-fade-in` | staggered-motion |
| 8s | 4s | `linear-gradient` | background-effects |
| 12s | 6s | `fireflies` | particles |
| 18s | 5s | `3d-basic` | scenes-3d |
| 23s | 8s | `feature-showcase` | full-compositions |

`fireflies` (10s) and `feature-showcase` (38s) are clipped by the host `data-duration`.
