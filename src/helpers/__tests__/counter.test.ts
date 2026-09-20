import { describe, it, expect } from "vitest";
import gsap from "gsap";
import { formatNumber, createCounter } from "../counter";

describe("formatNumber", () => {
  it("formats integers by default", () => {
    expect(formatNumber(12.6)).toBe("13");
    expect(formatNumber(0)).toBe("0");
  });

  it("keeps decimals", () => {
    expect(formatNumber(12.345, { decimals: 2 })).toBe("12.35");
  });

  it("adds thousand separators, prefix, and postfix", () => {
    expect(
      formatNumber(1234567.8, {
        decimals: 1,
        separator: ",",
        prefix: "$",
        postfix: " USD",
      }),
    ).toBe("$1,234,567.8 USD");
  });

  it("supports a custom decimal mark", () => {
    expect(
      formatNumber(1234.5, { decimals: 1, separator: ".", decimal: "," }),
    ).toBe("1.234,5");
  });

  it("preserves the sign", () => {
    expect(formatNumber(-42, { prefix: "n=" })).toBe("n=-42");
  });
});

describe("createCounter", () => {
  it("returns a GSAP-tweenable proxy and apply", () => {
    const element = document.createElement("span");
    const { proxy, apply } = createCounter(element, {
      from: 0,
      decimals: 0,
      prefix: "",
      postfix: "%",
    });
    expect(element.textContent).toBe("0%");

    const timeline = gsap.timeline({ paused: true });
    timeline.to(proxy, {
      value: 100,
      duration: 1,
      ease: "none",
      onUpdate: apply,
    });
    timeline.seek(0.5);
    apply();
    expect(element.textContent).toBe("50%");
    timeline.seek(1);
    apply();
    expect(element.textContent).toBe("100%");
  });

  it("formats with separators while tweening", () => {
    const element = document.createElement("span");
    const { proxy, apply } = createCounter(element, {
      from: 0,
      separator: ",",
      prefix: "$",
    });
    proxy.value = 1000;
    apply();
    expect(element.textContent).toBe("$1,000");
  });
});
