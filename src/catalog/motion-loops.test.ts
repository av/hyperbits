import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import gsap from "gsap";
import { afterEach, describe, expect, it } from "vitest";
import * as hyperbits from "../index";
import { projectRoot as repoRoot } from "../../scripts/lib/bits.mjs";

type Timelines = Record<string, gsap.core.Timeline>;
type VariableDecl = { id: string; type: string; default?: unknown };

const loopsDir = path.join(repoRoot, "bits", "motion-loops");
const loopNames = readdirSync(loopsDir).sort();

function recordingContext(log: string[]): CanvasRenderingContext2D {
  const format = (value: unknown): string =>
    typeof value === "number" ? value.toFixed(2) : String(value);
  const recorder = (label: string): unknown =>
    new Proxy(
      {},
      {
        get: (_target, property) => {
          if (property === Symbol.toPrimitive) return () => label;
          if (typeof property !== "string" || property === "then")
            return undefined;
          return (...args: unknown[]) => {
            log.push(`${label}.${property}(${args.map(format).join(",")})`);
            return recorder(`${label}.${property}`);
          };
        },
        set: (_target, property, value) => {
          log.push(`${label}.${String(property)}=${format(value)}`);
          return true;
        },
      },
    );
  return recorder("ctx") as CanvasRenderingContext2D;
}

function loadLoop(name: string, overrides: Record<string, unknown> = {}) {
  const html = readFileSync(path.join(loopsDir, name, "index.html"), "utf8");
  const varsMatch = html.match(/data-composition-variables=(['"])([\s\S]*?)\1/);
  const decls = JSON.parse(varsMatch?.[2] ?? "[]") as VariableDecl[];
  const values: Record<string, unknown> = {};
  for (const entry of decls) values[entry.id] = entry.default;
  Object.assign(values, overrides);
  document.documentElement.innerHTML = html
    .replace(/<!doctype html>/i, "")
    .replace(/^[\s\S]*?<html\b[^>]*>/i, "")
    .replace(/<\/html>[\s\S]*$/i, "");
  const log: string[] = [];
  HTMLCanvasElement.prototype.getContext = function () {
    return recordingContext(log);
  } as typeof HTMLCanvasElement.prototype.getContext;
  const globalWindow = window as Window & {
    gsap?: typeof gsap;
    hyperbits?: typeof hyperbits;
    __timelines?: Timelines;
    __hyperframes?: { getVariables: () => Record<string, unknown> };
  };
  globalWindow.gsap = gsap;
  globalWindow.hyperbits = hyperbits;
  globalWindow.__hyperframes = { getVariables: () => ({ ...values }) };
  for (const script of Array.from(document.querySelectorAll("script"))) {
    if (script.getAttribute("src")) continue;
    new Function(script.textContent ?? "")();
  }
  const timeline = globalWindow.__timelines?.[name];
  if (!timeline) throw new Error(`missing timeline for ${name}`);
  const frameAt = (seconds: number): string[] => {
    timeline.seek(seconds > 6 ? seconds - 1 : seconds + 1, false);
    log.length = 0;
    timeline.seek(seconds, false);
    return [...log];
  };
  return { decls, frameAt, timeline };
}

describe("motion loops", () => {
  afterEach(() => {
    document.documentElement.innerHTML = "";
    delete (window as Window & { __timelines?: Timelines }).__timelines;
    delete (window as Window & { __hyperframes?: unknown }).__hyperframes;
  });

  it("ships at least two loops in each family", () => {
    const families = ["depth", "lines", "dots", "shapes"];
    for (const family of families) {
      const members = loopNames.filter((name) => {
        const manifest = JSON.parse(
          readFileSync(path.join(loopsDir, name, "bit.json"), "utf8"),
        ) as { tags: string[] };
        return manifest.tags.includes(family);
      });
      expect(members.length, family).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(loopNames)(
    "%s lasts 12 seconds and exposes the palette tokens",
    (name) => {
      const { decls, timeline } = loadLoop(name);
      expect(timeline.duration()).toBe(12);
      const colorIds = decls
        .filter((entry) => entry.type === "color")
        .map((entry) => entry.id);
      expect(colorIds).toEqual(["background", "foreground", "accent"]);
    },
  );

  it.each(loopNames)("%s draws the same frame at 0s and 12s", (name) => {
    const { frameAt } = loadLoop(name);
    const first = frameAt(0);
    const middle = frameAt(5);
    const last = frameAt(12);
    expect(first.length).toBeGreaterThan(10);
    expect(middle).not.toEqual(first);
    expect(last).toEqual(first);
  });

  it.each(loopNames)(
    "%s repaints when the foreground or accent token changes",
    (name) => {
      const base = loadLoop(name).frameAt(3);
      const foreground = loadLoop(name, { foreground: "#123456" }).frameAt(3);
      const accent = loadLoop(name, { accent: "#fe0102" }).frameAt(3);
      expect(foreground).not.toEqual(base);
      expect(accent).not.toEqual(base);
    },
  );
});
