import { describe, expect, test } from "vitest";
import { random, randomFloat, randomInt, pick } from "../random";

describe("random", () => {
  test("is deterministic for a string seed", () => {
    expect(random("seed")).toBe(random("seed"));
  });

  test("is deterministic for a numeric seed", () => {
    expect(random(42)).toBe(random(42));
  });

  test("returns a unit interval value", () => {
    const value = random("unit");
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });

  test("different seeds differ", () => {
    expect(random("a")).not.toBe(random("b"));
  });
});

describe("randomFloat", () => {
  test("returns value within range", () => {
    const value = randomFloat("seed1", 0, 10);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(10);
  });

  test("works with negative range", () => {
    const value = randomFloat("seed2", -10, -5);
    expect(value).toBeGreaterThanOrEqual(-10);
    expect(value).toBeLessThan(-5);
  });

  test("works with mixed sign range", () => {
    const value = randomFloat("seed3", -5, 5);
    expect(value).toBeGreaterThanOrEqual(-5);
    expect(value).toBeLessThan(5);
  });

  test("is deterministic", () => {
    expect(randomFloat("seed", 0, 10)).toBe(randomFloat("seed", 0, 10));
  });
});

describe("randomInt", () => {
  test("returns integers within range inclusive", () => {
    const value = randomInt("seed1", 0, 10);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(10);
  });

  test("works with negative range", () => {
    const value = randomInt("seed2", -10, -5);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(-10);
    expect(value).toBeLessThanOrEqual(-5);
  });

  test("works with mixed sign range", () => {
    const value = randomInt("seed3", -5, 5);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(-5);
    expect(value).toBeLessThanOrEqual(5);
  });
});

describe("pick", () => {
  test("returns an element from the array", () => {
    const items = ["a", "b", "c"];
    expect(items).toContain(pick("seed", items));
  });

  test("is deterministic", () => {
    const items = ["a", "b", "c", "d"];
    expect(pick("same", items)).toBe(pick("same", items));
  });

  test("throws on an empty array", () => {
    expect(() => pick("seed", [])).toThrow("non-empty array");
  });
});

describe("random invalid input", () => {
  test("throws when the seed is neither a number nor a string", () => {
    expect(() => random(null as unknown as string)).toThrow(
      "must be a number or a string",
    );
  });
});
