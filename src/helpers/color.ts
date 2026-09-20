import { interpolate as culoriInterpolate, formatRgb } from "culori";
import type { GsapProxyBinding } from "./binding";
import type { EasingFunction } from "./interpolate";
import { keyframeSegment } from "./math";

export function mixOklch(
  fromColor: string,
  toColor: string,
  progress: number,
  fallback = "transparent",
): string {
  try {
    const interpolator = culoriInterpolate([fromColor, toColor], "oklch");
    const result = interpolator(progress);
    return formatRgb(result) || fallback;
  } catch {
    return fallback;
  }
}

export function interpolateColorKeyframes(
  colors: string[],
  progress: number,
  easingFn?: EasingFunction,
): string {
  if (colors.length === 0) return "transparent";
  if (colors.length === 1) return colors[0];

  const segment = keyframeSegment(progress, colors.length);
  if (!segment) return "transparent";

  const easedProgress = easingFn ? easingFn(segment.local) : segment.local;
  return mixOklch(colors[segment.index], colors[segment.index + 1], easedProgress);
}

export type ColorProxyProperty = "background" | "backgroundColor" | "color";

export type ColorProxy = {
  progress: number;
};

export type ColorProxyOptions = {
  property?: ColorProxyProperty;
};

export function colorProxy(
  element: HTMLElement,
  colors: string[],
  property: ColorProxyProperty = "backgroundColor",
): GsapProxyBinding<ColorProxy> {
  const proxy: ColorProxy = { progress: 0 };
  const apply = () => {
    const value = interpolateColorKeyframes(colors, proxy.progress);
    if (property === "background") {
      element.style.background = value;
    } else if (property === "color") {
      element.style.color = value;
    } else {
      element.style.backgroundColor = value;
    }
  };
  return { proxy, apply };
}
