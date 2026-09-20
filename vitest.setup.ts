import gsap from "gsap";

(globalThis as { gsap?: typeof gsap }).gsap = gsap;
