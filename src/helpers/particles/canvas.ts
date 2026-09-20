import gsap from "gsap";
import type { Particle } from "./types";

export type ParticleRenderOptions = {
  color?: string;
  size?: number;
  clear?: boolean;
};

export function renderParticles(
  canvas: HTMLCanvasElement,
  particles: Particle[],
  options: ParticleRenderOptions = {},
): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  if (options.clear !== false) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  const size = options.size ?? 4;
  const color = options.color ?? "#ffffff";

  for (const particle of particles) {
    context.globalAlpha = particle.opacity;
    context.fillStyle = color;
    const drawSize = size * particle.scale;
    context.beginPath();
    context.arc(
      particle.position.x,
      particle.position.y,
      Math.max(0, drawSize / 2),
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  context.globalAlpha = 1;
}

export function bind(
  timeline: gsap.core.Timeline,
  canvas: HTMLCanvasElement,
  simulator: { stateAt: (time: number) => Particle[] },
  options?: ParticleRenderOptions,
): () => void {
  const redraw = () => {
    renderParticles(canvas, simulator.stateAt(timeline.time()), options);
  };
  const previous = timeline.eventCallback("onUpdate");
  const onUpdate = () => {
    if (typeof previous === "function") previous.call(timeline);
    redraw();
  };
  timeline.eventCallback("onUpdate", onUpdate);
  redraw();
  return () => {
    timeline.eventCallback("onUpdate", previous);
  };
}
