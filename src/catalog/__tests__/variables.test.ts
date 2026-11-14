// @vitest-environment node

import { describe, expect, it } from "vitest";

import { parseCompositionVariables } from "../../../scripts/lib/bits.mjs";
import type { BitVariable } from "../contracts";
import { sharedBitInventory } from "../inventory.generated";
import { fetchBit, findBits } from "../runtime";
import {
  applyVariableDefaults,
  coerceVariableValue,
  encodeAttributeJson,
  variableValuesAttribute,
} from "../variables";

const declarations: BitVariable[] = [
  { id: "text", type: "string", label: "Text", default: "Hello" },
  { id: "foreground", type: "color", label: "Ink", default: "#fcc192" },
  { id: "background", type: "color", label: "Background", default: "#100f0f" },
];

const sampleHtml = `<!doctype html>
<html data-composition-variables='${JSON.stringify(declarations)}'>
  <head>
    <style>
      :root { --bg: #100F0F; --fg: #fcc192; --shadow: #100f0f55; }
      html, body { background-color: #100f0f; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="sample">
      <div id="bg" style="background-color:#100f0f"></div>
      <h1 id="title">Hello</h1>
      <p>Hello there</p>
    </div>
    <script>
      const fallback = "#100f0f";
      const title = "Hello";
    </script>
  </body>
</html>`;

describe("bit variables in the catalog", () => {
  it("carries the declared variables of every bit through the inventory", () => {
    for (const entry of sharedBitInventory) {
      expect(entry.variables).toEqual(
        parseCompositionVariables(entry.sourceCode),
      );
    }
  });

  it("returns variables from findBits and fetchBit", async () => {
    const [summary] = findBits({ query: "fade in", limit: 1 });
    expect(summary.variables.map((variable) => variable.id)).toEqual([
      "text",
      "color",
      "background",
    ]);

    const bit = await fetchBit("fade-in");
    expect(bit?.variables).toContainEqual({
      id: "background",
      type: "color",
      label: "Background",
      default: "#100f0f",
    });
  });

  it("returns copies so callers cannot mutate the catalog", () => {
    const [first] = findBits({ query: "fade in", limit: 1 });
    first.variables[0].default = "mutated";
    const [second] = findBits({ query: "fade in", limit: 1 });
    expect(second.variables[0].default).toBe("Hello World");
  });
});

describe("coerceVariableValue", () => {
  const color = declarations[1];

  it("accepts CSS colors and rejects anything else", () => {
    for (const value of [
      "#000",
      "#112233",
      "rgb(1 2 3)",
      "oklch(0.7 0.1 200)",
      "rebeccapurple",
    ]) {
      expect(coerceVariableValue(color, value)).toBe(value);
    }
    for (const value of ["", "nope", "#12", "red;color:blue", "url(x)"]) {
      expect(() => coerceVariableValue(color, value)).toThrow(
        /not a valid CSS color/,
      );
    }
  });

  it("parses numbers and booleans strictly", () => {
    const number = { id: "seed", type: "number" };
    expect(coerceVariableValue(number, "12.5")).toBe(12.5);
    expect(() => coerceVariableValue(number, "")).toThrow(/not a number/);
    expect(() => coerceVariableValue(number, "ten")).toThrow(/not a number/);

    const flag = { id: "loop", type: "boolean" };
    expect(coerceVariableValue(flag, "false")).toBe(false);
    expect(() => coerceVariableValue(flag, "yes")).toThrow(/true or false/);
  });

  it("keeps strings verbatim", () => {
    expect(coerceVariableValue(declarations[0], " spaced ")).toBe(" spaced ");
  });
});

describe("applyVariableDefaults", () => {
  it("rewrites the declaration and the literal copies outside scripts", () => {
    const result = applyVariableDefaults(sampleHtml, declarations, {
      background: "#112233",
      text: "Bye",
    });

    expect(parseCompositionVariables(result.html)).toEqual([
      { ...declarations[0], default: "Bye" },
      declarations[1],
      { ...declarations[2], default: "#112233" },
    ]);
    expect(result.html).toContain("--bg: #112233;");
    expect(result.html).toContain("html, body { background-color: #112233; }");
    expect(result.html).toContain('style="background-color:#112233"');
    expect(result.html).toContain('<h1 id="title">Bye</h1>');
    expect(result.html).toContain("<p>Hello there</p>");
    expect(result.html).toContain("--shadow: #100f0f55;");
    expect(result.html).toContain('const fallback = "#100f0f";');
    expect(result.html).toContain('const title = "Hello";');
    expect(result.warnings).toEqual([]);
  });

  it("swaps two colors in one pass", () => {
    const result = applyVariableDefaults(sampleHtml, declarations, {
      background: "#fcc192",
      foreground: "#100f0f",
    });

    expect(result.html).toContain("--bg: #fcc192;");
    expect(result.html).toContain("--fg: #100f0f;");
  });

  it("leaves shared literals alone and explains why", () => {
    const shared: BitVariable[] = [
      { id: "color", type: "color", default: "#000000" },
      { id: "background", type: "color", default: "#000000" },
    ];
    const html = `<html data-composition-variables='${JSON.stringify(shared)}'><style>body { background: #000000; color: #000000; }</style></html>`;
    const result = applyVariableDefaults(html, shared, {
      background: "#ffffff",
    });

    expect(result.html).toContain(
      "body { background: #000000; color: #000000; }",
    );
    expect(parseCompositionVariables(result.html)[1].default).toBe("#ffffff");
    expect(result.warnings).toEqual([
      expect.stringContaining("shared with color"),
    ]);
  });

  it("encodes values safely for single-quoted attributes", () => {
    const result = applyVariableDefaults(sampleHtml, declarations, {
      text: "It's <b> & co",
    });

    expect(result.html).toContain(
      '<h1 id="title">It\'s &lt;b&gt; &amp; co</h1>',
    );
    expect(parseCompositionVariables(result.html)[0].default).toBe(
      "It's <b> & co",
    );
    expect(encodeAttributeJson({ text: "a'b" })).not.toContain("'");
    expect(variableValuesAttribute({ text: "a'b" })).toBe(
      `data-variable-values='{"text":"a\\u0027b"}'`,
    );
  });

  it("rejects HTML without a variables declaration", () => {
    expect(() =>
      applyVariableDefaults("<html></html>", declarations, { text: "x" }),
    ).toThrow(/data-composition-variables/);
  });
});
