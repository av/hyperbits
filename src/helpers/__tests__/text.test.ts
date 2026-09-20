import { describe, it, expect } from "vitest";
import {
  splitText,
  splitUnits,
  charsVisibleAt,
  applyTypewriter,
  typewriter,
} from "../text";

describe("splitUnits", () => {
  it("splits characters including spaces", () => {
    expect(splitUnits("hi ", "chars")).toEqual(["h", "i", " "]);
  });

  it("splits words while keeping whitespace", () => {
    expect(splitUnits("hello world", "words")).toEqual(["hello", " ", "world"]);
  });

  it("splits lines while keeping newline tokens", () => {
    expect(splitUnits("a\nb", "lines")).toEqual(["a", "\n", "b"]);
  });
});

describe("splitText", () => {
  it("wraps characters in spans and sets aria-label", () => {
    const element = document.createElement("p");
    element.textContent = "Hi you";
    const spans = splitText(element, "chars");
    expect(element.getAttribute("aria-label")).toBe("Hi you");
    expect(spans).toHaveLength(6);
    expect(spans.map((span) => span.textContent).join("")).toBe("Hi you");
    expect(
      spans.every((span) => span.getAttribute("aria-hidden") === "true"),
    ).toBe(true);
    expect(spans[2].style.whiteSpace).toBe("pre");
  });

  it("wraps words and preserves spaces", () => {
    const element = document.createElement("p");
    element.textContent = "one two";
    const spans = splitText(element, "words");
    expect(spans.map((span) => span.textContent)).toEqual(["one", " ", "two"]);
  });
});

describe("typewriter", () => {
  it("reveals N chars at time t", () => {
    expect(charsVisibleAt(0, { total: 10, duration: 1 })).toBe(0);
    expect(charsVisibleAt(0.5, { total: 10, duration: 1 })).toBe(5);
    expect(charsVisibleAt(1, { total: 10, duration: 1 })).toBe(10);
    expect(charsVisibleAt(0.1, { total: 10, duration: 1, delay: 0.5 })).toBe(0);
  });

  it("hides unrevealed character spans", () => {
    const element = document.createElement("p");
    element.textContent = "ABCD";
    const visible = applyTypewriter(element, 0.5, { duration: 1 });
    expect(visible).toBe(2);
    const spans = Array.from(element.querySelectorAll("span"));
    expect(spans[0].style.visibility).toBe("visible");
    expect(spans[1].style.visibility).toBe("visible");
    expect(spans[2].style.visibility).toBe("hidden");
    expect(spans[3].style.visibility).toBe("hidden");
  });

  it("typewriter() splits once and applies over time", () => {
    const element = document.createElement("p");
    element.textContent = "Hey";
    const driver = typewriter(element, { duration: 1 });
    expect(driver.spans).toHaveLength(3);
    expect(driver.apply(0)).toBe(0);
    expect(driver.apply(1)).toBe(3);
  });
});
