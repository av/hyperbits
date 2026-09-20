declare module "culori" {
  export interface Color {
    mode: string;
    [key: string]: number | string | undefined;
  }

  export type ColorInput = string | Color;

  export type InterpolationMode =
    | "rgb"
    | "hsl"
    | "hsv"
    | "hwb"
    | "lab"
    | "lch"
    | "oklab"
    | "oklch"
    | string;

  export type Interpolator = (progress: number) => Color | undefined;

  export function interpolate(
    colors: ColorInput[],
    mode?: InterpolationMode,
  ): Interpolator;

  export function formatRgb(color: Color | undefined): string | undefined;
  export function formatHex(color: Color | undefined): string | undefined;
}
