import { describe, expect, it } from "vitest";
import { catalogName, HYPERBITS_GSAP_CDN, version } from "./index";

describe("hyperbits skeleton", () => {
  it("exports a version string", () => {
    expect(version).toBe("0.0.0");
  });

  it("pins the HyperFrames template GSAP CDN URL", () => {
    expect(HYPERBITS_GSAP_CDN).toBe(
      "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js",
    );
  });

  it("names the catalog", () => {
    expect(catalogName).toBe("hyperbits");
  });
});
