// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { sharedBitInventory } from "../inventory.generated";
import {
  formatSize,
  parseSize,
  readBitSize,
  retargetBitHtml,
} from "../retarget";

const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));

const sample = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=1920, height=1080" />
    <style>
      html,
      body {
        margin: 0;
        width: 1920px;
        height: 1080px;
      }
      #root { width: 100%; height: 100%; }
      .card { width: 1920px; }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="sample"
      data-start="0"
      data-width="1920"
      data-height="1080"
    >
      <div class="card" data-width="1920"></div>
    </div>
  </body>
</html>`;

describe("parseSize", () => {
  it("maps aspect aliases to canonical sizes", () => {
    expect(parseSize("9:16")).toEqual({ width: 1080, height: 1920 });
    expect(parseSize("1:1")).toEqual({ width: 1080, height: 1080 });
    expect(parseSize("16:9")).toEqual({ width: 1920, height: 1080 });
  });

  it("parses WIDTHxHEIGHT", () => {
    expect(parseSize("1080x1350")).toEqual({ width: 1080, height: 1350 });
    expect(parseSize(" 720X1280 ")).toEqual({ width: 720, height: 1280 });
  });

  it("rejects malformed and out of range sizes", () => {
    for (const value of [
      "",
      "4:3",
      "1080",
      "0x100",
      "10.5x20",
      "-1x2",
      "99999x10",
    ]) {
      expect(() => parseSize(value)).toThrow(/Invalid size/);
    }
  });

  it("formats sizes", () => {
    expect(formatSize({ width: 1080, height: 1920 })).toBe("1080x1920");
  });
});

describe("retargetBitHtml", () => {
  it("rewrites root attributes, meta viewport and stage CSS", () => {
    const html = retargetBitHtml(sample, { width: 1080, height: 1920 });

    expect(readBitSize(html)).toEqual({ width: 1080, height: 1920 });
    expect(html).toContain('content="width=1080, height=1920"');
    expect(html).toMatch(
      /body \{\s*margin: 0;\s*width: 1080px;\s*height: 1920px;/,
    );
    expect(html).not.toContain("width: 1920px;\n        height: 1080px");
  });

  it("leaves non-stage elements untouched", () => {
    const html = retargetBitHtml(sample, { width: 1080, height: 1080 });

    expect(html).toContain(".card { width: 1920px; }");
    expect(html).toContain('<div class="card" data-width="1920"></div>');
  });

  it("returns the source unchanged at the native size", () => {
    expect(retargetBitHtml(sample, { width: 1920, height: 1080 })).toBe(sample);
  });

  it("round-trips back to the native size", () => {
    const vertical = retargetBitHtml(sample, { width: 1080, height: 1920 });
    expect(retargetBitHtml(vertical, { width: 1920, height: 1080 })).toBe(
      sample,
    );
  });

  it("swaps square dimensions independently", () => {
    const square = sample.replaceAll("1920", "1080");
    const html = retargetBitHtml(square, { width: 1920, height: 1080 });

    expect(readBitSize(html)).toEqual({ width: 1920, height: 1080 });
    expect(html).toMatch(/width: 1920px;\s*height: 1080px;/);
  });

  it("throws when the HTML has no composition root", () => {
    expect(() =>
      retargetBitHtml("<div></div>", { width: 1080, height: 1920 }),
    ).toThrow(/data-width/);
  });

  it("retargets every catalog bit consistently", () => {
    for (const entry of sharedBitInventory) {
      const source = readFileSync(
        path.join(repositoryRoot, entry.sourcePath),
        "utf8",
      );
      for (const size of [
        { width: 1080, height: 1920 },
        { width: 1080, height: 1080 },
        { width: 1920, height: 1080 },
      ]) {
        const html = retargetBitHtml(source, size);
        expect(readBitSize(html), entry.id).toEqual(size);
        expect(html, entry.id).toContain(
          `content="width=${size.width}, height=${size.height}"`,
        );
        const stage = html.match(/html,\s*body\s*\{([^}]*)\}/);
        expect(stage?.[1], entry.id).toContain(`width: ${size.width}px`);
        expect(stage?.[1], entry.id).toContain(`height: ${size.height}px`);
      }
    }
  });
});
