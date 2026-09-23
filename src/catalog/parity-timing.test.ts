import { readFileSync } from "node:fs";
import path from "node:path";
import gsap from "gsap";
import { afterEach, describe, expect, it } from "vitest";
import * as hyperbits from "../index";
import { Easing, sceneStateAt } from "../helpers";
import { projectRoot as repoRoot } from "../../scripts/lib/bits.mjs";

type Timelines = Record<string, gsap.core.Timeline>;

function loadBit(relative: string): gsap.core.Timeline {
  const html = readFileSync(path.join(repoRoot, "bits", relative, "index.html"), "utf8");
  const inner = html
    .replace(/<!doctype html>/i, "")
    .replace(/^[\s\S]*?<html\b[^>]*>/i, "")
    .replace(/<\/html>[\s\S]*$/i, "");
  document.documentElement.innerHTML = inner;
  const varsMatch = html.match(/data-composition-variables=(['"])([\s\S]*?)\1/);
  if (varsMatch) {
    document.documentElement.setAttribute("data-composition-variables", varsMatch[2]);
  }
  const globalWindow = window as Window & {
    gsap?: typeof gsap;
    hyperbits?: typeof hyperbits;
    __timelines?: Timelines;
  };
  globalWindow.gsap = gsap;
  globalWindow.hyperbits = hyperbits;
  for (const script of Array.from(document.querySelectorAll("script"))) {
    if (script.getAttribute("src")) continue;
    new Function(script.textContent ?? "")();
  }
  const name = path.basename(relative);
  const timeline = globalWindow.__timelines?.[name];
  if (!timeline) throw new Error(`missing timeline for ${name}`);
  return timeline;
}

function opacityOf(element: Element | null): number {
  return Number((element as HTMLElement).style.opacity);
}

describe("parity timing", () => {
  afterEach(() => {
    document.documentElement.innerHTML = "";
    delete (window as Window & { __timelines?: Timelines }).__timelines;
  });

  it("fade-in ramps opacity linearly over 30 frames", () => {
    const timeline = loadBit("text-animations/fade-in");
    const title = document.getElementById("title");
    timeline.seek(0.5, false);
    expect(opacityOf(title)).toBeCloseTo(0.5, 2);
    timeline.seek(1, false);
    expect(opacityOf(title)).toBeCloseTo(1, 2);
  });

  it("staggered-fade-in offsets each box by 5 frames with easeOutCubic", () => {
    const timeline = loadBit("staggered-motion/staggered-fade-in");
    const boxes = document.querySelectorAll<HTMLElement>(".box");
    timeline.seek(0.5, false);
    expect(gsap.getProperty(boxes[0], "y")).toBeCloseTo(100 * (1 - Easing.easeOutCubic(0.5)), 1);
    timeline.seek(5 / 30, false);
    expect(gsap.getProperty(boxes[1], "y")).toBeCloseTo(100, 1);
    expect(opacityOf(boxes[1])).toBeCloseTo(0, 2);
  });

  it("3d-basic fades steps in and out over 30 frames around each step boundary", () => {
    const timeline = loadBit("scenes-3d/3d-basic");
    const steps = document.querySelectorAll<HTMLElement>(".step");
    const stepDuration = 50 / 30;
    timeline.seek(stepDuration + 0.5, false);
    expect(opacityOf(steps[1])).toBeCloseTo(0.5, 2);
    expect(opacityOf(steps[0])).toBeCloseTo(0.5, 2);
    timeline.seek(stepDuration + 1.2, false);
    expect(opacityOf(steps[1])).toBeCloseTo(1, 2);
    expect(opacityOf(steps[2])).toBeCloseTo(0, 2);
  });

  it("scene camera transforms are eased twice like remotion's Scene3D", () => {
    const config = {
      transitionDuration: 1,
      easing: "easeInOutCubic",
      steps: [
        { id: "a", duration: 1, x: 0 },
        { id: "b", duration: 1, x: 1000 },
      ],
    };
    const state = sceneStateAt(1.25, config);
    const single = Easing.easeInOutCubic(0.25);
    expect(state.camera.x).toBeCloseTo(1000 * single, 6);
    expect(-state.cameraTransform.position.x).toBeCloseTo(1000 * Easing.easeInOutCubic(single), 6);
  });

  it("lower-third holds the bar and exits on the original schedule", () => {
    const timeline = loadBit("staggered-motion/lower-third");
    const bar = document.getElementById("bar");
    timeline.seek(22.5 / 30, false);
    expect(Number(gsap.getProperty(bar, "scaleY"))).toBeCloseTo(1, 2);
    timeline.seek(4, false);
    expect(Number(gsap.getProperty(bar, "scaleY"))).toBeCloseTo(1, 2);
    timeline.seek(5, false);
    expect(Number(gsap.getProperty(bar, "scaleY"))).toBeCloseTo(0, 2);
  });

  it("basic-typewriter types one character per 3 frames with a 30 frame cursor blink", () => {
    const timeline = loadBit("text-animations/basic-typewriter");
    const typed = document.getElementById("typed");
    const cursor = document.getElementById("cursor");
    timeline.seek(1, false);
    expect(typed?.textContent).toBe("Ah, those ");
    timeline.seek(0.5, false);
    expect(cursor?.style.opacity).toBe("0");
    timeline.seek(4.9, false);
    expect(typed?.textContent).toBe("Ah, those sunny days!");
  });

  it("glitch-in settles on the final text after 45 frames", () => {
    const timeline = loadBit("text-animations/glitch-in");
    const title = document.getElementById("title");
    timeline.seek(0.25, false);
    expect(title?.textContent).not.toBe("SYSTEM ONLINE");
    timeline.seek(2, false);
    expect(title?.textContent).toBe("SYSTEM ONLINE");
  });
});
