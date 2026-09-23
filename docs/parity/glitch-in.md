# glitch-in

Category: text-animations. Fidelity 1 -> 5 (1-5, judged against the remotion-bits original rendered side by side).

Was: a left-to-right reveal with a fixed glyph set; not the original effect at all.
Now: AnimatedText's glitch model: per frame, every glyph is replaced with probability from the [1, 0, 0.05, 0] keyframes over 45 frames, using the original glyph set and random seeds, plus the linear opacity ramp.
Output is character-identical to the original at every frame.
