import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sceneStateAt } from "../helpers/scene3d";
import { projectRoot as repoRoot } from "../../scripts/lib/bits.mjs";

type Lane = { x: number; y: number };
type Box = {
  name: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const BIT_HTML = path.join(
  repoRoot,
  "bits/scenes-3d/flying-through-words/index.html",
);
const WIDTH = 1920;
const HEIGHT = 1080;
const VMIN = Math.min(WIDTH, HEIGHT) / 100;
const DURATION = 10;
const SAMPLE_COUNT = 20;
const FONT_VMIN = 8;
const DEPTH_VMIN = 40;
const CAMERA_Z_PAD_VMIN = 8;
const STEP_COUNT = 7;
const PERSPECTIVE = 900;
const TRANSITION = 1.28;
const NEAR_CLIP = 0.88;
const FAR_CLIP = 3;

function parseSlots(html: string): Lane[] {
  const block = html.match(/const slots = \[([\s\S]*?)\];/);
  if (!block) throw new Error("slots array missing from flying-through-words");
  const slots = [
    ...block[1].matchAll(/\{\s*x:\s*(-?[\d.]+),\s*y:\s*(-?[\d.]+)\s*\}/g),
  ].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
  if (slots.length === 0) throw new Error("no slot literals found");
  return slots;
}

function parseWords(html: string): string[] {
  const raw =
    html.match(/"id":"words"[\s\S]*?"default":"([^"]+)"/)?.[1] ??
    "SEEK,FRAME,MOTION,SCALE,DEPTH,LIGHT,TIME,SPACE";
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function wordSize(text: string): { width: number; height: number } {
  const font = FONT_VMIN * VMIN;
  const glyph = 0.78;
  const tracking = 0.08;
  const width =
    font * (text.length * glyph + Math.max(0, text.length - 1) * tracking);
  return { width, height: font * 1.15 };
}

function boxesOverlap(a: Box, b: Box): boolean {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

function clipToFrame(box: Box): Box | null {
  const left = Math.max(box.left, 0);
  const right = Math.min(box.right, WIDTH);
  const top = Math.max(box.top, 0);
  const bottom = Math.min(box.bottom, HEIGHT);
  if (right <= left || bottom <= top) return null;
  return { ...box, left, right, top, bottom };
}

function projectedBoxesAt(time: number, words: string[], slots: Lane[]): Box[] {
  const depth = DEPTH_VMIN * VMIN;
  const steps = Array.from({ length: STEP_COUNT }, (_, index) => ({
    id: "z" + index,
    x: 0,
    y: 0,
    z: index * depth + CAMERA_Z_PAD_VMIN * VMIN,
    duration: DURATION / STEP_COUNT,
  }));
  const state = sceneStateAt(time, {
    perspective: PERSPECTIVE,
    transitionDuration: TRANSITION,
    easing: "easeInOutCubic",
    steps,
  });
  const camZ = state.camera.z;
  const boxes: Box[] = [];
  const count = Math.min(words.length, slots.length);
  for (let index = 0; index < count; index += 1) {
    const lane = slots[index];
    const z = (index + 1) * depth;
    const zCam = z - camZ;
    if (zCam >= PERSPECTIVE * NEAR_CLIP || zCam <= -PERSPECTIVE * FAR_CLIP) {
      continue;
    }
    const scale = PERSPECTIVE / (PERSPECTIVE - zCam);
    if (!Number.isFinite(scale) || scale <= 0) continue;
    const size = wordSize(words[index]);
    const centerX = WIDTH / 2 + lane.x * VMIN * scale;
    const centerY = HEIGHT / 2 + lane.y * VMIN * scale;
    const box = clipToFrame({
      name: words[index],
      left: centerX - (size.width / 2) * scale,
      right: centerX + (size.width / 2) * scale,
      top: centerY - (size.height / 2) * scale,
      bottom: centerY + (size.height / 2) * scale,
    });
    if (box) boxes.push(box);
  }
  return boxes;
}

describe("flying-through-words lanes", () => {
  const html = readFileSync(BIT_HTML, "utf8");
  const slots = parseSlots(html);
  const words = parseWords(html);

  it("gives each depth slot a unique x/y lane", () => {
    expect(slots.length).toBeGreaterThanOrEqual(8);
    const keys = slots.map((slot) => `${slot.x},${slot.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps projected word boxes from intersecting at 20 sample times", () => {
    const overlaps: string[] = [];
    for (let sample = 0; sample < SAMPLE_COUNT; sample += 1) {
      const time = (sample / (SAMPLE_COUNT - 1)) * DURATION;
      const boxes = projectedBoxesAt(time, words, slots);
      for (let first = 0; first < boxes.length; first += 1) {
        for (let second = first + 1; second < boxes.length; second += 1) {
          if (boxesOverlap(boxes[first], boxes[second])) {
            overlaps.push(
              `t=${time.toFixed(2)}s ${boxes[first].name} ∩ ${boxes[second].name}`,
            );
          }
        }
      }
    }
    expect(overlaps).toEqual([]);
  });
});
