import gsap from "gsap";
import { Easing, resolveEase, type EasingFunction } from "./interpolate";

export type StaggerDirection = "forward" | "reverse" | "center" | "random";

export type StaggerProperty = number | number[];

export type StaggerTargets =
  | string
  | Element
  | Element[]
  | NodeListOf<Element>
  | HTMLCollectionOf<Element>;

export type StaggerSpec = {
  x?: StaggerProperty;
  y?: StaggerProperty;
  rotate?: StaggerProperty;
  rotation?: StaggerProperty;
  scale?: StaggerProperty;
  opacity?: StaggerProperty;
  duration?: number;
  delay?: number;
  stagger?: number;
  staggerDirection?: StaggerDirection;
  hold?: number;
  ease?: string | EasingFunction;
  from?: Record<string, number | string>;
  to?: Record<string, number | string>;
};

const PROPERTY_KEYS = [
  "x",
  "y",
  "rotate",
  "rotation",
  "scale",
  "opacity",
] as const;

type PropertyKey = (typeof PROPERTY_KEYS)[number];

export function resolveTargets(
  targets: StaggerTargets,
  root: ParentNode = document,
): Element[] {
  if (typeof targets === "string") {
    return Array.from(root.querySelectorAll(targets));
  }
  if (targets instanceof Element) {
    return [targets];
  }
  return Array.from(targets);
}

export function calculateStaggerIndex(
  actualIndex: number,
  total: number,
  direction: StaggerDirection,
): number {
  if (direction === "reverse") {
    return total - 1 - actualIndex;
  }
  if (direction === "center") {
    const mid = Math.floor(total / 2);
    return Math.abs(actualIndex - mid);
  }
  if (direction === "random") {
    const indices = Array.from({ length: total }, (_, index) => index);
    for (let index = indices.length - 1; index > 0; index--) {
      const swapWith = Math.floor(
        staggerSeed(`stagger-${index}`) * (index + 1),
      );
      const current = indices[index];
      indices[index] = indices[swapWith];
      indices[swapWith] = current;
    }
    return indices.indexOf(actualIndex);
  }
  return actualIndex;
}

function staggerSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function gsapEaseValue(
  ease?: string | EasingFunction,
): string | EasingFunction | undefined {
  if (!ease) return undefined;
  if (typeof ease === "function") return ease;
  if (ease in Easing) {
    return resolveEase(ease);
  }
  return ease;
}

function gsapPropertyName(key: PropertyKey): string {
  if (key === "rotate") return "rotation";
  return key;
}

function collectProperties(spec: StaggerSpec): {
  fromVars: Record<string, number | string>;
  toVars: Record<string, number | string>;
  keyframeProps: Record<string, number[]>;
} {
  const fromVars: Record<string, number | string> = { ...spec.from };
  const toVars: Record<string, number | string> = { ...spec.to };
  const keyframeProps: Record<string, number[]> = {};

  for (const key of PROPERTY_KEYS) {
    const value = spec[key];
    if (value === undefined) continue;
    const gsapKey = gsapPropertyName(key);
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      if (value.length === 1) {
        toVars[gsapKey] = value[0];
      } else if (value.length === 2) {
        fromVars[gsapKey] = value[0];
        toVars[gsapKey] = value[1];
      } else {
        keyframeProps[gsapKey] = value;
      }
    } else {
      toVars[gsapKey] = value;
    }
  }

  return { fromVars, toVars, keyframeProps };
}

export function stagger(
  targets: StaggerTargets,
  spec: StaggerSpec,
  existingTimeline?: gsap.core.Timeline,
): gsap.core.Timeline {
  const timeline = existingTimeline ?? gsap.timeline({ paused: true });
  const elements = resolveTargets(targets);
  const duration = spec.duration ?? 0.5;
  const appendAt = existingTimeline ? existingTimeline.duration() : 0;
  const delay = (spec.delay ?? 0) + appendAt;
  const staggerEach = spec.stagger ?? 0;
  const direction = spec.staggerDirection ?? "forward";
  const hold = spec.hold ?? 0;
  const ease = gsapEaseValue(spec.ease) ?? "none";
  const { fromVars, toVars, keyframeProps } = collectProperties(spec);
  const hasFrom = Object.keys(fromVars).length > 0;
  const hasTo = Object.keys(toVars).length > 0;
  const hasKeyframes = Object.keys(keyframeProps).length > 0;

  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];
    const staggerIndex = calculateStaggerIndex(
      index,
      elements.length,
      direction,
    );
    const startTime = delay + staggerIndex * staggerEach;

    if (hasKeyframes) {
      const tweenVars: gsap.TweenVars = {
        duration,
        ease,
        keyframes: keyframeProps,
      };
      timeline.to(element, tweenVars, startTime);
    } else if (hasFrom) {
      timeline.fromTo(
        element,
        fromVars,
        { ...toVars, duration, ease },
        startTime,
      );
    } else if (hasTo) {
      timeline.to(element, { ...toVars, duration, ease }, startTime);
    }

    if (hold > 0) {
      timeline.to(element, { duration: hold }, startTime + duration);
    }
  }

  return timeline;
}
