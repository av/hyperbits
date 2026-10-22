### Unreleased

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
