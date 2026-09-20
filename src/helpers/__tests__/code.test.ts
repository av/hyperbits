import { describe, it, expect } from "vitest";
import {
  createCodeBlock,
  applyLineReveal,
  applyLineFocus,
  isLineInRange,
  codeLines,
} from "../code";

describe("isLineInRange", () => {
  it("matches a single line number (1-based)", () => {
    expect(isLineInRange(0, 1)).toBe(true);
    expect(isLineInRange(1, 1)).toBe(false);
  });

  it("matches an inclusive range", () => {
    expect(isLineInRange(1, [2, 4])).toBe(true);
    expect(isLineInRange(4, [2, 4])).toBe(false);
  });
});

describe("createCodeBlock", () => {
  it("renders a highlighted line per source line", () => {
    const container = document.createElement("div");
    createCodeBlock(container, {
      code: "const answer = 42;\nfunction add(left, right) {\n  return left + right;\n}",
      language: "javascript",
      showLineNumbers: true,
    });
    const lines = codeLines(container);
    expect(lines).toHaveLength(4);
    expect(lines[0].dataset.line).toBe("1");
    expect(container.querySelector(".hyperbits-code-gutter")?.textContent).toBe(
      "1",
    );
    expect(container.querySelector("code")?.className).toContain("javascript");
    expect(container.textContent).toContain("answer");
  });

  it("highlights typescript", () => {
    const container = document.createElement("div");
    createCodeBlock(container, {
      code: "const value: number = 1;",
      language: "typescript",
    });
    expect(container.querySelector("code")?.innerHTML.length).toBeGreaterThan(
      0,
    );
  });
});

describe("line reveal and focus", () => {
  it("reveals lines over time with stagger", () => {
    const container = document.createElement("div");
    createCodeBlock(container, {
      code: "one\ntwo\nthree",
      language: "javascript",
    });
    applyLineReveal(container, 0, { duration: 0.2, stagger: 0.2 });
    const lines = codeLines(container);
    expect(Number(lines[0].style.opacity)).toBeCloseTo(0, 2);
    applyLineReveal(container, 0.2, { duration: 0.2, stagger: 0.2 });
    expect(Number(lines[0].style.opacity)).toBeCloseTo(1, 2);
    expect(Number(lines[1].style.opacity)).toBeCloseTo(0, 2);
  });

  it("dims lines outside the focus range", () => {
    const container = document.createElement("div");
    createCodeBlock(container, { code: "a\nb\nc", language: "javascript" });
    applyLineFocus(container, [2, 2], { dimOpacity: 0.2, dimBlur: 3 });
    const lines = codeLines(container);
    expect(lines[0].style.opacity).toBe("0.2");
    expect(lines[1].style.opacity).toBe("1");
    expect(lines[1].style.filter).toBe("");
    expect(lines[2].style.filter).toContain("blur");
  });
});
