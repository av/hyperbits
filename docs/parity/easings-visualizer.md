# easings-visualizer

Category: staggered-motion. Fidelity 2 -> 4 (1-5, judged against the remotion-bits original rendered side by side).

Was: six GSAP eases on a 70% board with 5.5vmin squares.
Now: the original nine rows (linear, quad, cubic, spring, steps(5)) on the 1080x1080 canvas with 40px squares, 216px labels, 60 frame travel and the caption.
Not reproducible as-is: the original passes cycleOffset={0} to StaggeredMotion, which pins progress to 0 so its squares never move; the port animates the travel the demo intends.
