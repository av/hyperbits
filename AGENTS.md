### Project

hyperbits is a catalog of animation bits and helpers for HyperFrames (HTML + GSAP video compositions). Read README.md for the rebuild outline and the definition of a bit. The sibling project remotion-bits is the reference for structure and tooling; do not copy its React code, port the ideas onto HyperFrames primitives.

### Task execution

Keep going until the query is completely resolved before yielding. Do not guess or make up an answer.

### Coding guidelines

- Fix problems at the root cause rather than applying surface-level patches.
- Avoid unneeded complexity. Keep changes minimal and focused.
- Do not add comments within code unless explicitly requested.
- Do not use one-letter variable names.
- Do not add copyright or license headers.
- Do not commit or create branches unless explicitly requested.
- Do not create markdown files that describe the work you did.

### HyperFrames rules

- Every bit is a self-contained HTML composition with a `data-composition-id` root, `data-width` and `data-height`, timed elements using `data-start` and `data-duration`.
- Timelines are created with `{ paused: true }` and registered on `window.__timelines` under the composition id. Motion must be seek-safe: any frame can be rendered from any time.
- Use seeded randomness only. Renders must be reproducible.
- Size elements fractionally from the composition dimensions, not with hardcoded pixel values.
- Expose user-facing knobs through `data-composition-variables`.
- Every bit must pass `npx hyperframes lint` before it is considered done.
- No emoji as visual elements. Use inline SVG.
- Bits meant for shader transitions follow the shader-compatible CSS rules: no `transparent` in gradients, no `var()` on captured elements, explicit `background-color` on scenes.
