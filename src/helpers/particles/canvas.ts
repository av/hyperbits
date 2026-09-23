import gsap from "gsap";
import { chainTimelineUpdate } from "../binding";
import type { Particle } from "./types";

export type ParticleColor = string | ((particle: Particle) => string);
export type ParticleSize = number | ((particle: Particle) => number);
export type ParticleShape = "circle" | "rect" | "square" | "diamond" | "glow";
export type ParticleShapeOption =
  | ParticleShape
  | ((particle: Particle) => ParticleShape);
export type ParticleOffset =
  | { x: number; y: number }
  | ((particle: Particle) => { x: number; y: number });

export type GlowStop = [offset: number, alpha: number];

export type ParticleRenderOptions = {
  color?: ParticleColor;
  size?: ParticleSize;
  glow?: number;
  glowStops?: GlowStop[];
  shape?: ParticleShapeOption;
  cornerRadius?: number;
  offset?: ParticleOffset;
  clear?: boolean;
};

const DEFAULT_GLOW_STOPS: GlowStop[] = [
  [0, 1],
  [0.35, 0.55],
  [1, 0],
];

function resolveColor(
  color: ParticleColor | undefined,
  particle: Particle,
): string {
  if (typeof color === "function") return color(particle);
  return color ?? "#ffffff";
}

function resolveSize(
  size: ParticleSize | undefined,
  particle: Particle,
): number {
  const base = typeof size === "function" ? size(particle) : (size ?? 4);
  return base * particle.scale;
}

function withAlpha(color: string, alpha: number): string {
  const value = color.trim();
  const hexMatch = value.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
  if (hexMatch) {
    const red = parseInt(hexMatch[1].slice(0, 2), 16);
    const green = parseInt(hexMatch[1].slice(2, 4), 16);
    const blue = parseInt(hexMatch[1].slice(4, 6), 16);
    const base = hexMatch[2] ? parseInt(hexMatch[2], 16) / 255 : 1;
    return `rgba(${red}, ${green}, ${blue}, ${alpha * base})`;
  }
  const rgbaMatch = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/,
  );
  if (rgbaMatch) {
    const base = rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1;
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha * base})`;
  }
  return color;
}

function resolveShape(
  shape: ParticleShapeOption | undefined,
  particle: Particle,
): ParticleShape {
  if (typeof shape === "function") return shape(particle);
  return shape ?? "circle";
}

function resolveOffset(
  offset: ParticleOffset | undefined,
  particle: Particle,
): { x: number; y: number } {
  if (typeof offset === "function") return offset(particle);
  return offset ?? { x: 0, y: 0 };
}

export function renderParticles(
  canvas: HTMLCanvasElement,
  particles: Particle[],
  options: ParticleRenderOptions = {},
): void {
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext("2d");
  } catch {
    return;
  }
  if (!context) return;

  if (options.clear !== false) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  const glow = Math.max(0, options.glow ?? 0);

  for (const particle of particles) {
    const drawSize = Math.max(0, resolveSize(options.size, particle));
    if (drawSize <= 0) continue;
    const shape = resolveShape(options.shape, particle);
    const color = resolveColor(options.color, particle);
    const offset = resolveOffset(options.offset, particle);
    const x = particle.position.x + offset.x;
    const y = particle.position.y + offset.y;
    context.save();
    context.globalAlpha = particle.opacity;
    context.translate(x, y);
    context.rotate((particle.rotation * Math.PI) / 180);

    if (shape === "glow") {
      if (typeof context.createRadialGradient === "function") {
        const radius = drawSize / 2;
        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
        for (const [stop, alpha] of options.glowStops ?? [
          [0, 1],
          [1, 0],
        ]) {
          gradient.addColorStop(stop, withAlpha(color, alpha));
        }
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      continue;
    }

    if (glow > 0 && typeof context.createRadialGradient === "function") {
      const glowRadius = (drawSize / 2) * (1 + glow);
      const gradient = context.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        glowRadius,
      );
      for (const [offset, alpha] of options.glowStops ?? DEFAULT_GLOW_STOPS) {
        gradient.addColorStop(offset, withAlpha(color, alpha));
      }
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, glowRadius, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = color;
    context.beginPath();
    if (shape === "rect" || shape === "square" || shape === "diamond") {
      const width = shape === "diamond" ? drawSize * 0.75 : drawSize;
      const height = shape === "rect" ? drawSize * 0.6 : width;
      if (shape === "diamond") context.rotate(Math.PI / 4);
      const radius = options.cornerRadius ?? 0;
      if (radius > 0 && typeof context.roundRect === "function") {
        context.roundRect(-width / 2, -height / 2, width, height, radius);
        context.fill();
      } else {
        context.fillRect(-width / 2, -height / 2, width, height);
      }
    } else {
      context.arc(0, 0, drawSize / 2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  context.globalAlpha = 1;
}

export type ParticleSimulator = {
  stateAt: (time: number) => Particle[];
};

export function bind(
  timeline: gsap.core.Timeline,
  canvas: HTMLCanvasElement,
  simulator: ParticleSimulator,
  options?: ParticleRenderOptions,
): () => void {
  return chainTimelineUpdate(timeline, () => {
    renderParticles(canvas, simulator.stateAt(timeline.time()), options);
  });
}
