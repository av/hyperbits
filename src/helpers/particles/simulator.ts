import type gsap from "gsap";
import type { TimeStateBinding } from "../binding";
import { random } from "../random";
import {
  type Particle,
  type SpawnerConfig,
  type BehaviorConfig,
  type SimulationConfig,
} from "./types";
import { movement } from "./behaviors";
import { bind as bindParticles, type ParticleRenderOptions } from "./canvas";

export function simulateParticles({
  frame,
  fps,
  spawners,
  behaviors,
}: SimulationConfig): Particle[] {
  const activeParticles: Particle[] = [];

  for (const spawner of spawners) {
    const spawnerStartFrame = spawner.startFrame || 0;
    const delayFrame = spawner.delayFrame || 0;
    const spawnerFrame = frame - delayFrame + spawnerStartFrame;

    const burst = spawner.burst || 0;
    const rate = spawner.rate || 0;

    const burstParticles = spawnerFrame >= 0 ? burst : 0;
    const rateParticles =
      rate > 0 ? Math.floor(Math.max(0, spawnerFrame) * rate) : 0;
    const totalBorn = burstParticles + rateParticles;

    const birthFrameFor = (particleIndex: number) => {
      if (particleIndex < burst) {
        return 0;
      }
      return (particleIndex - burst) / rate;
    };

    const variance = spawner.lifespanVariance || 0;
    const baseLifespan = spawner.lifespan || 60;
    const maxPossibleLifespan = baseLifespan + variance;

    let activeCount = 0;
    const maxLimit = spawner.max;

    for (
      let particleIndex = totalBorn - 1;
      particleIndex >= 0;
      particleIndex--
    ) {
      const birthFrame = birthFrameFor(particleIndex);
      const age = spawnerFrame - birthFrame;

      if (age > maxPossibleLifespan) {
        break;
      }

      const seed = random(`${spawner.id}-${particleIndex}`);
      const actualLifespan =
        baseLifespan + (random(`life-${seed}`) - 0.5) * 2 * variance;

      if (age >= actualLifespan) {
        continue;
      }

      if (age < 0) continue;

      const spawnerPos = spawner.position || {};
      const spawnerX = spawnerPos.x || 0;
      const spawnerY = spawnerPos.y || 0;
      const spawnerZ = spawnerPos.z || 0;

      const area = spawner.area || { width: 0, height: 0 };
      const areaWidth = area.width || 0;
      const areaHeight = area.height || 0;
      const areaDepth = area.depth || 0;

      const posX = spawnerX + (random(`x-${seed}`) - 0.5) * areaWidth;
      const posY = spawnerY + (random(`y-${seed}`) - 0.5) * areaHeight;
      const posZ = spawnerZ + (random(`z-${seed}`) - 0.5) * areaDepth;

      const velConfig = spawner.velocity || { x: 0, y: 0 };
      const varianceX = velConfig.varianceX || 0;
      const varianceY = velConfig.varianceY || 0;
      const varianceZ = velConfig.varianceZ || 0;

      const velX = velConfig.x + (random(`vx-${seed}`) - 0.5) * 2 * varianceX;
      const velY = velConfig.y + (random(`vy-${seed}`) - 0.5) * 2 * varianceY;
      const velZ =
        (velConfig.z || 0) + (random(`vz-${seed}`) - 0.5) * 2 * varianceZ;

      const particle: Particle = {
        id: `${spawner.id}-${particleIndex}`,
        index: particleIndex,
        seed,
        birthFrame,
        lifespan: actualLifespan,
        spawnerId: spawner.id,
        position: { x: posX, y: posY, z: posZ },
        velocity: { x: velX, y: velY, z: velZ },
        acceleration: { x: 0, y: 0, z: 0 },
        scale: 1,
        rotation: 0,
        opacity: 1,
      };

      const steps = Math.floor(age);

      for (let step = 0; step <= steps; step++) {
        for (const behavior of behaviors) {
          behavior.handler(particle, step, { frame: spawnerFrame, fps });
        }
        movement(particle, step, { frame: spawnerFrame, fps });
      }

      if (maxLimit !== undefined && activeCount >= maxLimit) {
        continue;
      }

      activeParticles.push(particle);
      activeCount++;
    }
  }

  return activeParticles.sort(
    (left, right) => left.birthFrame - right.birthFrame,
  );
}

export type CreateParticlesOptions = {
  spawners: SpawnerConfig[];
  behaviors?: BehaviorConfig[];
  fps?: number;
};

export type ParticleSystem = TimeStateBinding<Particle[]> & {
  fps: number;
  bind: (
    timeline: gsap.core.Timeline,
    canvas: HTMLCanvasElement,
    options?: ParticleRenderOptions,
  ) => () => void;
};

export function createParticles(
  config: CreateParticlesOptions,
): ParticleSystem {
  const fps = config.fps ?? 30;
  const behaviors = config.behaviors ?? [];

  const stateAt = (time: number) =>
    simulateParticles({
      frame: time * fps,
      fps,
      spawners: config.spawners,
      behaviors,
    });

  return {
    fps,
    stateAt,
    bind(timeline, canvas, options) {
      return bindParticles(timeline, canvas, { stateAt }, options);
    },
  };
}
