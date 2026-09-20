import { readFileSync } from "node:fs";
import path from "node:path";
import gsap from "gsap";
import { afterEach, describe, expect, it } from "vitest";
import * as hyperbits from "../index";
import {
  inspectBitHtml,
  listBitJsonFilesSync,
  projectRoot as repoRoot,
} from "../../scripts/lib/bits.mjs";

type VariableDecl = {
  id: string;
  type: string;
  default?: unknown;
};

function loadBitDocument(html: string) {
  const withoutDoctype = html.replace(/<!doctype html>/i, "");
  const inner = withoutDoctype
    .replace(/^[\s\S]*?<html\b[^>]*>/i, "")
    .replace(/<\/html>[\s\S]*$/i, "");
  document.documentElement.innerHTML = inner;
  const varsMatch = html.match(/data-composition-variables=(['"])([\s\S]*?)\1/);
  if (varsMatch) {
    document.documentElement.setAttribute(
      "data-composition-variables",
      varsMatch[2],
    );
  }
}

function runInlineScripts() {
  const scripts = Array.from(document.querySelectorAll("script")).filter(
    (script) => !script.getAttribute("src"),
  );
  for (const script of scripts) {
    const body = script.textContent ?? "";
    if (!body.trim()) continue;
    const run = new Function(body);
    run();
  }
}

function parseDecls(html: string): VariableDecl[] {
  const varsMatch = html.match(/data-composition-variables=(['"])([\s\S]*?)\1/);
  if (!varsMatch) return [];
  return JSON.parse(varsMatch[2]) as VariableDecl[];
}

describe("bit variables", () => {
  const bitFiles = listBitJsonFilesSync();

  afterEach(() => {
    document.documentElement.innerHTML = "";
    delete (window as Window & { __timelines?: unknown }).__timelines;
    delete (window as Window & { __hyperframes?: unknown }).__hyperframes;
  });

  it("inspectBitHtml rejects a root background without #bg", () => {
    const issues = inspectBitHtml(
      `<html data-composition-variables='[{"id":"color","type":"color","default":"#000"}]'>
        <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
        <style>#root { background-color: #000; }</style>
        <div id="root" data-duration="3"></div>
      </html>`,
      { duration: 3 },
    );
    expect(issues.join("\n")).toMatch(/#bg/);
    expect(issues.join("\n")).toMatch(/background/);
  });

  it("every bit registers a timeline and applies color and text knobs", () => {
    const failures: string[] = [];
    const gsapWindow = window as Window & {
      gsap?: typeof gsap;
      hyperbits?: typeof hyperbits;
      __timelines?: Record<string, unknown>;
      __hyperframes?: { getVariables: () => Record<string, unknown> };
    };
    gsapWindow.gsap = gsap;
    gsapWindow.hyperbits = hyperbits;

    for (const bitFile of bitFiles) {
      const relative = path.relative(repoRoot, bitFile);
      const manifest = JSON.parse(readFileSync(bitFile, "utf8")) as {
        name: string;
        duration: number;
      };
      const html = readFileSync(
        path.join(path.dirname(bitFile), "index.html"),
        "utf8",
      );
      const decls = parseDecls(html);
      const defaults: Record<string, unknown> = {};
      for (const entry of decls) defaults[entry.id] = entry.default;

      try {
        loadBitDocument(html);
        gsapWindow.__hyperframes = { getVariables: () => ({ ...defaults }) };
        runInlineScripts();
        if (!gsapWindow.__timelines?.[manifest.name]) {
          failures.push(`${relative}: missing window.__timelines["${manifest.name}"]`);
        }
      } catch (error) {
        failures.push(`${relative}: default run threw ${String(error)}`);
        continue;
      }

      const colorDecl = decls.find((entry) => entry.type === "color");
      const textDecl = decls.find(
        (entry) => entry.type === "string" && typeof entry.default === "string",
      );
      const overrides = { ...defaults };
      if (colorDecl) overrides[colorDecl.id] = "#ff00aa";
      if (textDecl) overrides[textDecl.id] = "ZZX_KNOB_TEXT";

      if (!colorDecl && !textDecl) continue;

      delete gsapWindow.__timelines;
      try {
        loadBitDocument(html);
        gsapWindow.__hyperframes = { getVariables: () => ({ ...overrides }) };
        runInlineScripts();
      } catch (error) {
        failures.push(`${relative}: override run threw ${String(error)}`);
        continue;
      }

      const markup = `${document.documentElement.innerHTML} ${document.body.textContent ?? ""}`;
      if (colorDecl && !markup.toLowerCase().includes("ff00aa")) {
        const canvas = document.querySelector("canvas");
        if (!canvas) {
          failures.push(
            `${relative}: color knob ${colorDecl.id} did not appear in the DOM`,
          );
        }
      }
      if (textDecl) {
        const aria = Array.from(document.querySelectorAll("[aria-label]"))
          .map((node) => node.getAttribute("aria-label") ?? "")
          .join(" ");
        const haystack = `${document.body.textContent ?? ""} ${aria}`;
        if (!haystack.includes("ZZX_KNOB_TEXT")) {
          failures.push(
            `${relative}: string knob ${textDecl.id} did not change visible text`,
          );
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
