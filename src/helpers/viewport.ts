export type ViewportAxis = "x" | "y" | "min" | "max";

export type Viewport = {
  width: number;
  height: number;
  vw: number;
  vh: number;
  vmin: number;
  vmax: number;
  root: Element | null;
  px: (fraction: number, axis?: ViewportAxis) => number;
};

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

export function compositionRoot(from?: Element | null): Element | null {
  if (from) {
    return from.closest("[data-composition-id]");
  }
  if (typeof document === "undefined") return null;
  return document.querySelector("[data-composition-id]");
}

export function viewport(from?: Element | null): Viewport {
  const root = compositionRoot(from);
  const widthAttr = root?.getAttribute("data-width");
  const heightAttr = root?.getAttribute("data-height");
  const width = widthAttr ? Number(widthAttr) : DEFAULT_WIDTH;
  const height = heightAttr ? Number(heightAttr) : DEFAULT_HEIGHT;
  const resolvedWidth =
    Number.isFinite(width) && width > 0 ? width : DEFAULT_WIDTH;
  const resolvedHeight =
    Number.isFinite(height) && height > 0 ? height : DEFAULT_HEIGHT;
  const vw = resolvedWidth / 100;
  const vh = resolvedHeight / 100;
  const vmin = Math.min(vw, vh);
  const vmax = Math.max(vw, vh);

  const px = (fraction: number, axis: ViewportAxis = "x"): number => {
    if (axis === "y") return fraction * resolvedHeight;
    if (axis === "min")
      return fraction * Math.min(resolvedWidth, resolvedHeight);
    if (axis === "max")
      return fraction * Math.max(resolvedWidth, resolvedHeight);
    return fraction * resolvedWidth;
  };

  return {
    width: resolvedWidth,
    height: resolvedHeight,
    vw,
    vh,
    vmin,
    vmax,
    root,
    px,
  };
}
