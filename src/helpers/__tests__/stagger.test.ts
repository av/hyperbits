import { describe, it, expect, beforeEach, afterEach } from "vitest";
import gsap from "gsap";
import { stagger, calculateStaggerIndex, resolveTargets } from "../stagger";

const opacityAt = (element: Element): number =>
  Number.parseFloat((element as HTMLElement).style.opacity || "1");

describe("calculateStaggerIndex", () => {
  it("returns the index for forward", () => {
    expect(calculateStaggerIndex(0, 3, "forward")).toBe(0);
    expect(calculateStaggerIndex(2, 3, "forward")).toBe(2);
  });

  it("reverses indices", () => {
    expect(calculateStaggerIndex(0, 3, "reverse")).toBe(2);
    expect(calculateStaggerIndex(2, 3, "reverse")).toBe(0);
  });

  it("measures distance from center", () => {
    expect(calculateStaggerIndex(1, 3, "center")).toBe(0);
    expect(calculateStaggerIndex(0, 3, "center")).toBe(1);
    expect(calculateStaggerIndex(2, 3, "center")).toBe(1);
  });

  it("is deterministic for random", () => {
    const first = [0, 1, 2].map((index) =>
      calculateStaggerIndex(index, 3, "random"),
    );
    const second = [0, 1, 2].map((index) =>
      calculateStaggerIndex(index, 3, "random"),
    );
    expect(first).toEqual(second);
  });
});

describe("stagger", () => {
  let root: HTMLDivElement;
  let children: HTMLDivElement[];

  beforeEach(() => {
    root = document.createElement("div");
    children = [0, 1, 2].map((index) => {
      const child = document.createElement("div");
      child.dataset.testid = `child${index + 1}`;
      child.className = "item";
      root.append(child);
      return child;
    });
    document.body.append(root);
  });

  afterEach(() => {
    root.remove();
  });

  it("returns a paused timeline", () => {
    const timeline = stagger(children, { opacity: [0, 1], duration: 0.5 });
    expect(timeline.paused()).toBe(true);
  });

  it("can start at an absolute time on an existing timeline", () => {
    const existing = gsap.timeline({ paused: true });
    existing.to({}, { duration: 2 });
    stagger(
      children,
      { opacity: [0, 1], duration: 0.4, at: 0 },
      existing,
    );
    existing.seek(0);
    expect(opacityAt(children[0])).toBeCloseTo(0, 2);
    existing.seek(0.4);
    expect(opacityAt(children[0])).toBeCloseTo(1, 2);
  });

  it("appends to an existing timeline", () => {
    const existing = gsap.timeline({ paused: true });
    existing.to({}, { duration: 1 });
    const returned = stagger(
      children,
      { opacity: [0, 1], duration: 0.5 },
      existing,
    );
    expect(returned).toBe(existing);
    expect(existing.duration()).toBeGreaterThan(1);
    expect(existing.getChildren().length).toBeGreaterThan(1);
  });

  it("accepts a CSS selector", () => {
    const timeline = stagger(".item", { opacity: [0, 1], duration: 0.4 });
    timeline.seek(0);
    expect(opacityAt(children[0])).toBeCloseTo(0, 2);
    timeline.seek(0.4);
    expect(opacityAt(children[0])).toBeCloseTo(1, 2);
  });

  it("interpolates opacity from 0 to 1", () => {
    const timeline = stagger(children[0], {
      opacity: [0, 1],
      duration: 0.5,
    });
    timeline.seek(0);
    expect(opacityAt(children[0])).toBeCloseTo(0, 2);
    timeline.seek(0.25);
    expect(opacityAt(children[0])).toBeCloseTo(0.5, 2);
    timeline.seek(0.5);
    expect(opacityAt(children[0])).toBeCloseTo(1, 2);
  });

  it("staggers forward so earlier elements lead", () => {
    const timeline = stagger(children, {
      opacity: [0, 1],
      duration: 0.5,
      stagger: 0.2,
      staggerDirection: "forward",
    });
    timeline.seek(0.25);
    expect(opacityAt(children[0])).toBeGreaterThan(opacityAt(children[1]));
    expect(opacityAt(children[1])).toBeGreaterThan(opacityAt(children[2]));
  });

  it("staggers reverse so later elements lead", () => {
    const timeline = stagger(children, {
      opacity: [0, 1],
      duration: 0.5,
      stagger: 0.2,
      staggerDirection: "reverse",
    });
    timeline.seek(0.25);
    expect(opacityAt(children[2])).toBeGreaterThan(opacityAt(children[1]));
    expect(opacityAt(children[1])).toBeGreaterThan(opacityAt(children[0]));
  });

  it("staggers from the center", () => {
    const timeline = stagger(children, {
      opacity: [0, 1],
      duration: 0.5,
      stagger: 0.2,
      staggerDirection: "center",
    });
    timeline.seek(0.25);
    expect(opacityAt(children[1])).toBeGreaterThanOrEqual(
      opacityAt(children[0]),
    );
    expect(opacityAt(children[1])).toBeGreaterThanOrEqual(
      opacityAt(children[2]),
    );
  });

  it("is deterministic for random stagger", () => {
    const first = stagger(children, {
      opacity: [0, 1],
      duration: 0.5,
      stagger: 0.2,
      staggerDirection: "random",
    });
    first.seek(0.3);
    const opacities = children.map(opacityAt);

    children.forEach((child) => {
      gsap.set(child, { clearProps: "all" });
    });

    const second = stagger(children, {
      opacity: [0, 1],
      duration: 0.5,
      stagger: 0.2,
      staggerDirection: "random",
    });
    second.seek(0.3);
    expect(children.map(opacityAt)).toEqual(opacities);
  });

  it("applies x, y, rotate, and scale", () => {
    const timeline = stagger(children[0], {
      x: [100, 0],
      y: [50, 0],
      rotate: [90, 0],
      scale: [0.5, 1],
      duration: 0.5,
    });
    timeline.seek(0);
    const start = gsap.getProperty(children[0], "x");
    expect(Number(start)).toBeCloseTo(100, 1);
    timeline.seek(0.5);
    expect(Number(gsap.getProperty(children[0], "x"))).toBeCloseTo(0, 1);
    expect(Number(gsap.getProperty(children[0], "y"))).toBeCloseTo(0, 1);
    expect(Number(gsap.getProperty(children[0], "rotation"))).toBeCloseTo(0, 1);
    expect(Number(gsap.getProperty(children[0], "scale"))).toBeCloseTo(1, 1);
  });

  it("merges from/to objects", () => {
    const timeline = stagger(children[0], {
      from: { opacity: 0, x: 40 },
      to: { opacity: 1, x: 0 },
      duration: 0.4,
    });
    timeline.seek(0);
    expect(opacityAt(children[0])).toBeCloseTo(0, 2);
    expect(Number(gsap.getProperty(children[0], "x"))).toBeCloseTo(40, 1);
    timeline.seek(0.4);
    expect(opacityAt(children[0])).toBeCloseTo(1, 2);
    expect(Number(gsap.getProperty(children[0], "x"))).toBeCloseTo(0, 1);
  });

  it("extends duration when hold is set", () => {
    const withoutHold = stagger(children[0], {
      opacity: [0, 1],
      duration: 0.4,
    });
    const withHold = stagger(children[1], {
      opacity: [0, 1],
      duration: 0.4,
      hold: 0.3,
    });
    expect(withHold.duration()).toBeCloseTo(withoutHold.duration() + 0.3, 5);
  });

  it("accepts a GSAP ease name", () => {
    const timeline = stagger(children[0], {
      opacity: [0, 1],
      duration: 0.5,
      ease: "power2.out",
    });
    timeline.seek(0.25);
    const mid = opacityAt(children[0]);
    expect(mid).toBeGreaterThan(0.5);
    expect(mid).toBeLessThan(1);
  });

  it("resolveTargets unwraps a NodeList", () => {
    const found = resolveTargets(root.querySelectorAll(".item"));
    expect(found).toHaveLength(3);
  });

  it("returns a paused empty timeline for no targets", () => {
    const timeline = stagger([], { opacity: [0, 1], duration: 0.4 });
    expect(timeline.paused()).toBe(true);
    expect(timeline.duration()).toBe(0);
  });
});
