# transform3d-showcase

Category: scenes-3d. Fidelity 1 -> 5 (1-5, judged against the remotion-bits original rendered side by side).

Was: four panels with a spinning cube each.
Now: the six original steps (including the rotateZ(Math.PI / 8) degree quirk and the 0.5 scale relative step), blur enter/exit, the five-keyframe matrix tween of the outline cube, three orbiting satellites and four nested rotating boxes. Needed the quaternion multiply fix in the scene helper.
