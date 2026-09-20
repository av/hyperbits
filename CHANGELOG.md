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
