export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function unitProgress(progress: number): number {
  return clamp(progress, 0, 1);
}

export type KeyframeSegment = {
  index: number;
  local: number;
};

export function keyframeSegment(
  progress: number,
  count: number,
): KeyframeSegment | null {
  if (count <= 0) return null;
  if (count === 1) return { index: 0, local: 0 };

  const clamped = unitProgress(progress);
  const segments = count - 1;
  const segmentProgress = clamped * segments;
  const index = Math.min(Math.floor(segmentProgress), segments - 1);
  return {
    index,
    local: segmentProgress - index,
  };
}

export function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}
