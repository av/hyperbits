# Parity with remotion-bits

Every bit was rendered next to its remotion-bits original at the same size and frame rate, compared at 0/25/50/75/100% and as a side-by-side clip, then fixed until the motion and finish match. Scores are 1 (a different animation) to 5 (indistinguishable in motion, timing and finish; typeface differences from the reference render's fallback fonts are ignored). One note per bit lives next to this file.

Method and tooling: the originals were rendered with `npx remotion render` through a harness that wraps each docs example the way the docs playground does (Flexoki palette, Geist Sans, 5vw/700 base type); the ports with `npx hyperframes render --format png-sequence`. Comparison sheets and clips live outside the repo under `/tmp/hyperbits-qa/<bit>/cmp/`.

Shared fixes that came out of the pass: the scene helper now double-eases camera transforms like remotion's Scene3D, quaternion multiplication no longer corrupts chained rotations, the particle canvas renderer gained soft, square and diamond shapes, per-particle shape/offset, glow falloff stops, corner radius, alpha colours and degrees for rotation, and bits load Geist from the fontsource CDN with inline @font-face rules.

| Category | Bit | Before | After |
| --- | --- | --- | --- |
| text-animations | [fade-in](fade-in.md) | 3 | 5 |
| text-animations | [blur-slide-word](blur-slide-word.md) | 3 | 5 |
| text-animations | [char-by-char](char-by-char.md) | 4 | 5 |
| text-animations | [word-by-word](word-by-word.md) | 3 | 5 |
| text-animations | [glitch-in](glitch-in.md) | 1 | 5 |
| text-animations | [glitch-cycle](glitch-cycle.md) | 1 | 5 |
| text-animations | [matrix-rain](matrix-rain.md) | 2 | 5 |
| text-animations | [bar-chart](bar-chart.md) | 2 | 5 |
| text-animations | [basic-counter](basic-counter.md) | 1 | 5 |
| text-animations | [counter-confetti](counter-confetti.md) | 2 | 5 |
| text-animations | [stat-rings](stat-rings.md) | 3 | 5 |
| text-animations | [basic-code-block](basic-code-block.md) | 2 | 5 |
| text-animations | [typing-code-block](typing-code-block.md) | 2 | 5 |
| text-animations | [basic-typewriter](basic-typewriter.md) | 3 | 5 |
| text-animations | [multi-text-typewriter](multi-text-typewriter.md) | 3 | 5 |
| text-animations | [variable-speed-typewriter](variable-speed-typewriter.md) | 3 | 5 |
| text-animations | [cli-simulation](cli-simulation.md) | 2 | 5 |
| staggered-motion | [staggered-fade-in](staggered-fade-in.md) | 3 | 5 |
| staggered-motion | [slide-from-left](slide-from-left.md) | 3 | 5 |
| staggered-motion | [card-stack](card-stack.md) | 2 | 5 |
| staggered-motion | [chat-conversation](chat-conversation.md) | 1 | 5 |
| staggered-motion | [easings-visualizer](easings-visualizer.md) | 2 | 4 |
| staggered-motion | [grid-stagger](grid-stagger.md) | 3 | 5 |
| staggered-motion | [list-reveal](list-reveal.md) | 3 | 4 |
| staggered-motion | [lower-third](lower-third.md) | 2 | 4 |
| staggered-motion | [fracture-reassemble](fracture-reassemble.md) | 1 | 5 |
| staggered-motion | [mosaic-reframe](mosaic-reframe.md) | 1 | 5 |
| background-effects | [linear-gradient](linear-gradient.md) | 5 | 5 |
| background-effects | [radial-gradient](radial-gradient.md) | 3 | 5 |
| background-effects | [conic-gradient](conic-gradient.md) | 5 | 5 |
| particles | [fireflies](fireflies.md) | 2 | 5 |
| particles | [particles-fountain](particles-fountain.md) | 1 | 5 |
| particles | [particles-grid](particles-grid.md) | 1 | 5 |
| particles | [particles-snow](particles-snow.md) | 3 | 5 |
| particles | [scrolling-columns](scrolling-columns.md) | 1 | 5 |
| scenes-3d | [3d-basic](3d-basic.md) | 2 | 5 |
| scenes-3d | [3d-elements](3d-elements.md) | 1 | 5 |
| scenes-3d | [carousel](carousel.md) | 1 | 5 |
| scenes-3d | [cube-navigation](cube-navigation.md) | 2 | 5 |
| scenes-3d | [cursor-flyover](cursor-flyover.md) | 1 | 4 |
| scenes-3d | [flying-through-words](flying-through-words.md) | 1 | 5 |
| scenes-3d | [ken-burns](ken-burns.md) | 1 | 4 |
| scenes-3d | [step-timing-context](step-timing-context.md) | 1 | 4 |
| scenes-3d | [terminal-3d](terminal-3d.md) | 2 | 4 |
| scenes-3d | [transform3d-showcase](transform3d-showcase.md) | 1 | 5 |
| full-compositions | [feature-showcase](feature-showcase.md) | 1 | 5 |

46 bits. Average before 2.1, after 4.8.
