import { describe, it, expect, vi } from "vitest";
import gsap from "gsap";
import { createParticles, renderParticles, bind } from "../particles";
import type { Particle } from "../particles";

function fakeContext() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    globalAlpha: 1,
    fillStyle: "",
  };
}

describe("createParticles stateAt", () => {
  it("is deterministic for the same time", () => {
    const simulator = createParticles({
      fps: 30,
      spawners: [
        {
          id: "burst",
          burst: 8,
          position: { x: 10, y: 20 },
          velocity: { x: 1, y: 2, varianceX: 0.5, varianceY: 0.5 },
          lifespan: 60,
        },
      ],
    });

    const first = simulator.stateAt(0.5);
    const second = simulator.stateAt(0.5);
    expect(first).toHaveLength(second.length);
    expect(first.map((particle) => particle.position)).toEqual(
      second.map((particle) => particle.position),
    );
  });

  it("seeking back and forth yields the same state", () => {
    const simulator = createParticles({
      fps: 30,
      spawners: [
        {
          id: "rate",
          rate: 2,
          position: { x: 0, y: 0 },
          lifespan: 100,
        },
      ],
    });

    const atOne = simulator.stateAt(1);
    simulator.stateAt(2);
    const again = simulator.stateAt(1);
    expect(again.map((particle) => particle.id)).toEqual(
      atOne.map((particle) => particle.id),
    );
    expect(again.map((particle) => particle.position)).toEqual(
      atOne.map((particle) => particle.position),
    );
  });
});

describe("renderParticles", () => {
  it("draws an arc per particle", () => {
    const canvas = document.createElement("canvas");
    const context = fakeContext();
    canvas.getContext = vi.fn(
      () => context,
    ) as unknown as typeof canvas.getContext;

    const particles: Particle[] = [
      {
        id: "p-0",
        index: 0,
        seed: 0.1,
        birthFrame: 0,
        lifespan: 10,
        position: { x: 5, y: 6, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
        scale: 2,
        rotation: 0,
        opacity: 0.5,
        spawnerId: "s",
      },
    ];

    renderParticles(canvas, particles, { size: 4, color: "#ff0000" });
    expect(context.clearRect).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalledTimes(1);
    expect(context.fill).toHaveBeenCalledTimes(1);
  });
});

describe("bind", () => {
  it("redraws on timeline update", () => {
    const canvas = document.createElement("canvas");
    const context = fakeContext();
    canvas.getContext = vi.fn(
      () => context,
    ) as unknown as typeof canvas.getContext;

    const simulator = createParticles({
      fps: 30,
      spawners: [
        {
          id: "burst",
          burst: 3,
          position: { x: 0, y: 0 },
          lifespan: 60,
        },
      ],
    });

    const driver = { progress: 0 };
    const timeline = gsap.timeline({ paused: true });
    timeline.to(driver, { progress: 1, duration: 1, ease: "none" });
    bind(timeline, canvas, simulator);
    context.arc.mockClear();
    timeline.seek(0.5);
    timeline.eventCallback("onUpdate")?.call(timeline);
    expect(context.arc).toHaveBeenCalled();
  });
});
