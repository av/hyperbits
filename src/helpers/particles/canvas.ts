import gsap from "gsap";
import { chainTimelineUpdate } from "../binding";
import type { Particle } from "./types";

export type ParticleColor = string | ((particle: Particle) => string);
export type ParticleSize = number | ((particle: Particle) => number);
export type ParticleShape = "circle" | "rect";

export type ParticleRenderOptions = {
  color?: ParticleColor;
  size?: ParticleSize;
  glow?: number;
  shape?: ParticleShape;
  clear?: boolean;
};

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
  const hex = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    const red = parseInt(hex.slice(1, 3), 16);
    const green = parseInt(hex.slice(3, 5), 16);
    const blue = parseInt(hex.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return color;
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

  const shape = options.shape ?? "circle";
  const glow = Math.max(0, options.glow ?? 0);

  for (const particle of particles) {
    const drawSize = Math.max(0, resolveSize(options.size, particle));
    if (drawSize <= 0) continue;
    const color = resolveColor(options.color, particle);
    const x = particle.position.x;
    const y = particle.position.y;
    context.save();
    context.globalAlpha = particle.opacity;
    context.translate(x, y);
    context.rotate(particle.rotation);

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
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.35, withAlpha(color, 0.55));
      gradient.addColorStop(1, withAlpha(color, 0));
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, glowRadius, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = color;
    context.beginPath();
    if (shape === "rect") {
      const width = drawSize;
      const height = drawSize * 0.6;
      context.fillRect(-width / 2, -height / 2, width, height);
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
