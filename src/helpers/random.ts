function mulberry32(seed: number): number {
  let state = seed + 0x6d2b79f5;
  state = Math.imul(state ^ (state >>> 15), state | 1);
  state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
  return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
}

function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

export type RandomSeed = number | string;

export function random(seed: RandomSeed): number {
  if (typeof seed === "string") {
    return mulberry32(hashCode(seed));
  }
  if (typeof seed === "number") {
    return mulberry32(seed * 10000000000);
  }
  throw new Error("random() argument must be a number or a string");
}

export const randomFloat = (
  seed: RandomSeed,
  min: number,
  max: number,
): number => {
  return random(seed) * (max - min) + min;
};

export const randomRange = randomFloat;

export const randomInt = (
  seed: RandomSeed,
  min: number,
  max: number,
): number => {
  return Math.floor(random(seed) * (max - min + 1) + min);
};

export const pick = <Item>(seed: RandomSeed, array: Item[]): Item => {
  const index = randomInt(seed, 0, array.length - 1);
  return array[index];
};

export const anyElement = pick;
