// @vitest-environment node

import { describe, expect, it } from "vitest";

import { generatedSnapshot, regenerateAll } from "../check-generated.mjs";

describe("generated artifacts", () => {
  it("match the generators (inventory, skill refs, registry, docs bits)", async () => {
    const before = generatedSnapshot();
    await regenerateAll();
    expect(generatedSnapshot()).toBe(before);
  }, 60000);
});
