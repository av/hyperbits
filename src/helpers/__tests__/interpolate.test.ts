import { describe, it, expect } from "vitest";
import {
  interpolate,
  interpolateKeyframes,
  Easing,
  resolveInterpolateValue,
  gsapEase,
  resolveEase,
  hold,
  steps,
  spring,
} from "../interpolate";

describe("interpolate", () => {
  it("should perform basic linear interpolation", () => {
    expect(interpolate(5, [0, 10], [0, 100])).toBe(50);
    expect(interpolate(0, [0, 10], [0, 100])).toBe(0);
    expect(interpolate(10, [0, 10], [0, 100])).toBe(100);
  });

  it("should handle non-monotonic input ranges", () => {
    expect(interpolate(0.5, [0, 1, 0], [-100, -200, -300])).toBe(-150);
    expect(interpolate(0.5, [1, 0], [-200, -300])).toBe(-250);
  });

  it("should handle duplicate values for hold frames", () => {
    expect(interpolate(30, [0, 30, 30, 60], [5, 5, 10, 10])).toBe(5);
    expect(interpolate(45, [0, 30, 30, 60], [5, 5, 10, 10])).toBe(10);
  });

  it("should extrapolate with extend by default", () => {
    expect(interpolate(-5, [0, 10], [0, 100])).toBe(-50);
    expect(interpolate(15, [0, 10], [0, 100])).toBe(150);
  });

  it("should clamp with extrapolate clamp option", () => {
    expect(
      interpolate(-5, [0, 10], [0, 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ).toBe(0);
    expect(
      interpolate(15, [0, 10], [0, 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ).toBe(100);
  });

  it("should return identity with extrapolate identity option", () => {
    expect(
      interpolate(-5, [0, 10], [0, 100], { extrapolateLeft: "identity" }),
    ).toBe(-5);
    expect(
      interpolate(15, [0, 10], [0, 100], { extrapolateRight: "identity" }),
    ).toBe(15);
  });

  it("should apply easing functions", () => {
    const result = interpolate(5, [0, 10], [0, 100], { easing: "easeInQuad" });
    expect(result).toBe(25);
  });

  it("should apply custom easing functions", () => {
    const customEasing = (progress: number) => progress * progress * progress;
    const result = interpolate(5, [0, 10], [0, 100], {
      easing: customEasing,
    });
    expect(result).toBe(12.5);
  });

  it("should throw error for mismatched input/output range lengths", () => {
    expect(() => interpolate(5, [0, 10], [0, 100, 200])).toThrow(
      "inputRange and outputRange must have the same length",
    );
  });

  it("should throw error for input range with less than 2 elements", () => {
    expect(() => interpolate(5, [0], [0])).toThrow(
      "inputRange must have at least 2 elements",
    );
  });

  it("should accept GSAP ease names", () => {
    const result = interpolate(5, [0, 10], [0, 100], {
      easing: "power2.out",
    });
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThan(100);
  });
});

describe("Easing", () => {
  it("should have linear easing that returns the same value", () => {
    expect(Easing.linear(0.5)).toBe(0.5);
    expect(Easing.linear(0)).toBe(0);
    expect(Easing.linear(1)).toBe(1);
  });

  it("should have easeIn that starts slow", () => {
    expect(Easing.easeIn(0.5)).toBe(0.25);
  });

  it("should have easeOut that ends slow", () => {
    expect(Easing.easeOut(0.5)).toBe(0.75);
  });

  it("should have easeInOut", () => {
    expect(Easing.easeInOut(0.25)).toBe(0.125);
    expect(Easing.easeInOut(0.75)).toBe(0.875);
  });
});

describe("gsapEase", () => {
  it("returns a GSAP-compatible ease function", () => {
    const ease = gsapEase("power2.out");
    expect(typeof ease).toBe("function");
    expect(ease(0)).toBeCloseTo(0, 5);
    expect(ease(1)).toBeCloseTo(1, 5);
    expect(ease(0.5)).toBeGreaterThan(0.5);
  });

  it("maps power1.in to a quadratic ease-in", () => {
    const ease = gsapEase("power1.in");
    expect(ease(0.5)).toBeCloseTo(0.25, 5);
  });

  it("treats a bare GSAP name as .out", () => {
    expect(gsapEase("power2")(0.5)).toBeCloseTo(gsapEase("power2.out")(0.5), 5);
  });

  it("maps none and linear to identity", () => {
    expect(gsapEase("none")(0.4)).toBeCloseTo(0.4, 5);
    expect(gsapEase("linear")(0.4)).toBeCloseTo(0.4, 5);
  });

  it("maps steps(n)", () => {
    const ease = gsapEase("steps(4)");
    expect(ease(0.1)).toBe(0);
    expect(ease(0.3)).toBe(0.25);
  });
});

describe("resolveEase", () => {
  it("returns named remotion-bits easings", () => {
    expect(resolveEase("easeInQuad")?.(0.5)).toBe(0.25);
  });

  it("returns GSAP-named easings", () => {
    expect(resolveEase("power1.in")?.(0.5)).toBeCloseTo(0.25, 5);
  });

  it("returns the function as-is", () => {
    const custom = (progress: number) => progress * 2;
    expect(resolveEase(custom)).toBe(custom);
  });
});

describe("interpolateKeyframes", () => {
  it("returns a scalar unchanged", () => {
    expect(interpolateKeyframes(12, 0.5)).toBe(12);
  });

  it("returns 0 for an empty array", () => {
    expect(interpolateKeyframes([], 0.5)).toBe(0);
  });

  it("returns the single keyframe", () => {
    expect(interpolateKeyframes([40], 0.3)).toBe(40);
  });

  it("interpolates evenly spaced keyframes at seeked times", () => {
    expect(interpolateKeyframes([0, 100], 0)).toBe(0);
    expect(interpolateKeyframes([0, 100], 0.5)).toBe(50);
    expect(interpolateKeyframes([0, 100], 1)).toBe(100);
  });

  it("holds a value when duration is missing", () => {
    expect(interpolateKeyframes([0, hold(10), 100], 0.5)).toBe(0);
  });

  it("accounts for hold frames when duration is given", () => {
    const value = interpolateKeyframes([0, hold(10), 100], 0.5, undefined, 20);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);
  });
});

describe("steps and spring", () => {
  it("steps(n) quantizes progress", () => {
    const ease = steps(4);
    expect(ease(0)).toBe(0);
    expect(ease(0.24)).toBe(0);
    expect(ease(0.25)).toBe(0.25);
    expect(ease(0.99)).toBe(0.75);
  });

  it("spring() is 0 at start and 1 at end", () => {
    const ease = spring();
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0);
  });
});

describe("resolveInterpolateValue", () => {
  it("should return static number values as-is", () => {
    expect(resolveInterpolateValue(42, 10)).toBe(42);
    expect(resolveInterpolateValue(0, 100)).toBe(0);
    expect(resolveInterpolateValue(-5, 50)).toBe(-5);
  });

  it("should interpolate array values at the given frame", () => {
    const value: [number[], number[]] = [
      [0, 10],
      [0, 100],
    ];
    expect(resolveInterpolateValue(value, 5)).toBe(50);
    expect(resolveInterpolateValue(value, 0)).toBe(0);
    expect(resolveInterpolateValue(value, 10)).toBe(100);
  });

  it("should support interpolate array with options", () => {
    const value: [
      number[],
      number[],
      { extrapolateLeft: "clamp"; extrapolateRight: "clamp" },
    ] = [
      [0, 10],
      [0, 100],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ];
    expect(resolveInterpolateValue(value, -5)).toBe(0);
    expect(resolveInterpolateValue(value, 15)).toBe(100);
  });

  it("should support easing in interpolate arrays", () => {
    const value: [number[], number[], { easing: "easeInQuad" }] = [
      [0, 10],
      [0, 100],
      { easing: "easeInQuad" },
    ];
    expect(resolveInterpolateValue(value, 5)).toBe(25);
  });

  it("should handle complex animation ranges", () => {
    const fadeInOut: [number[], number[]] = [
      [0, 20, 80, 100],
      [0, 1, 1, 0],
    ];
    expect(resolveInterpolateValue(fadeInOut, 0)).toBe(0);
    expect(resolveInterpolateValue(fadeInOut, 20)).toBe(1);
    expect(resolveInterpolateValue(fadeInOut, 50)).toBe(1);
    expect(resolveInterpolateValue(fadeInOut, 80)).toBe(1);
    expect(resolveInterpolateValue(fadeInOut, 100)).toBe(0);
  });
});
