import { describe, it, expect, afterEach } from "vitest";
import { viewport, compositionRoot } from "../viewport";

describe("viewport", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("defaults to 1920x1080 when no composition root exists", () => {
    const view = viewport();
    expect(view.width).toBe(1920);
    expect(view.height).toBe(1080);
    expect(view.vw).toBe(19.2);
    expect(view.vh).toBe(10.8);
    expect(view.vmin).toBe(10.8);
    expect(view.vmax).toBe(19.2);
  });

  it("reads data-width and data-height from the nearest composition root", () => {
    const root = document.createElement("div");
    root.setAttribute("data-composition-id", "scene");
    root.setAttribute("data-width", "1080");
    root.setAttribute("data-height", "1920");
    const child = document.createElement("span");
    root.append(child);
    document.body.append(root);

    const view = viewport(child);
    expect(view.width).toBe(1080);
    expect(view.height).toBe(1920);
    expect(view.vw).toBe(10.8);
    expect(view.vh).toBe(19.2);
    expect(view.vmin).toBe(10.8);
    expect(view.vmax).toBe(19.2);
    expect(view.root).toBe(root);
    expect(compositionRoot(child)).toBe(root);
  });

  it("converts fractions to pixels on each axis", () => {
    const root = document.createElement("div");
    root.setAttribute("data-composition-id", "root");
    root.setAttribute("data-width", "2000");
    root.setAttribute("data-height", "1000");
    document.body.append(root);

    const view = viewport(root);
    expect(view.px(0.5)).toBe(1000);
    expect(view.px(0.5, "x")).toBe(1000);
    expect(view.px(0.5, "y")).toBe(500);
    expect(view.px(0.5, "min")).toBe(500);
    expect(view.px(0.5, "max")).toBe(1000);
  });
});
