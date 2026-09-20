// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  fetchBit,
  findBits,
  listBitCatalog,
  resolveBitCatalogIdentifier,
} from "../runtime";
import { sharedBitInventory } from "../inventory.generated";

describe("published runtime catalog", () => {
  it("finds fade in deterministically from the published registry and source files", () => {
    const results = findBits({ query: "fade in", limit: 1 });

    expect(results).toEqual([
      expect.objectContaining({
        id: "fade-in",
        exportName: "FadeIn",
        name: "Fade In",
        sourcePath: "bits/text-animations/fade-in/index.html",
        helpers: expect.arrayContaining(["viewport"]),
      }),
    ]);
  });

  it("supports 3d card-oriented discovery through runtime-safe data", () => {
    const ids = findBits({ query: "3d cards", limit: 3 }).map(
      (entry) => entry.id,
    );

    expect(ids).toContain("carousel");
  });

  it("includes the StepTimingContext bit in the shared runtime inventory", () => {
    expect(listBitCatalog()).toContainEqual(
      expect.objectContaining({
        id: "step-timing-context",
        exportName: "StepTimingContext",
        sourcePath: "bits/scenes-3d/step-timing-context/index.html",
      }),
    );
  });

  it("resolves identifiers by id and exact name", () => {
    expect(resolveBitCatalogIdentifier("fade-in")).toMatchObject({
      reason: "id",
      entry: expect.objectContaining({ id: "fade-in" }),
    });

    expect(resolveBitCatalogIdentifier("Fade In")).toMatchObject({
      reason: "name",
      entry: expect.objectContaining({ id: "fade-in" }),
    });
  });

  it("fetches published HTML, helpers, and the embed snippet for a bit", async () => {
    const bit = await fetchBit("fade-in");

    expect(bit).toMatchObject({
      id: "fade-in",
      exportName: "FadeIn",
      name: "Fade In",
      helpers: expect.arrayContaining(["viewport"]),
      embedSnippet:
        '<div data-composition-src="compositions/fade-in.html"></div>',
      helperScriptTag:
        '<script src="https://unpkg.com/hyperbits/dist/hyperbits.iife.js"></script>',
    });
    expect(bit?.sourceCode).toContain('data-composition-id="fade-in"');
    expect(bit?.sourceCode).toContain("window.__timelines");
  });

  it("lists a non-empty catalog from the published runtime surface", () => {
    expect(listBitCatalog()).toHaveLength(sharedBitInventory.length);
    expect(sharedBitInventory.length).toBeGreaterThan(0);
    expect(sharedBitInventory[0]?.sourceCode).toContain("data-composition-id");
  });
});
