import { random } from "../random";
import type { ParticleBehaviorHandler } from "./types";

export const movement: ParticleBehaviorHandler = (particle) => {
  particle.velocity.x += particle.acceleration.x;
  particle.velocity.y += particle.acceleration.y;
  particle.velocity.z += particle.acceleration.z;
  particle.position.x += particle.velocity.x;
  particle.position.y += particle.velocity.y;
  particle.position.z += particle.velocity.z;
  particle.acceleration.x = 0;
  particle.acceleration.y = 0;
  particle.acceleration.z = 0;
};

export const createGravity = (force: {
  x?: number;
  y?: number;
  z?: number;
  varianceX?: number;
  varianceY?: number;
  varianceZ?: number;
}): ParticleBehaviorHandler => {
  const perParticleForce = new Map<
    string,
    { x: number; y: number; z: number }
  >();

  return (particle) => {
    if (!perParticleForce.has(particle.id)) {
      const varianceX = force.varianceX || 0;
      const varianceY = force.varianceY || 0;
      const varianceZ = force.varianceZ || 0;

      const forceX =
        (force.x || 0) +
        (random(`gravity-x-${particle.seed}`) - 0.5) * 2 * varianceX;
      const forceY =
        (force.y || 0) +
        (random(`gravity-y-${particle.seed}`) - 0.5) * 2 * varianceY;
      const forceZ =
        (force.z || 0) +
        (random(`gravity-z-${particle.seed}`) - 0.5) * 2 * varianceZ;

      perParticleForce.set(particle.id, { x: forceX, y: forceY, z: forceZ });
    }

    const particleForce = perParticleForce.get(particle.id)!;
    particle.acceleration.x += particleForce.x;
    particle.acceleration.y += particleForce.y;
    particle.acceleration.z += particleForce.z;
  };
};

export const createDrag = (
  factor: number,
  variance?: number,
): ParticleBehaviorHandler => {
  if (!variance) {
    return (particle) => {
      particle.velocity.x *= factor;
      particle.velocity.y *= factor;
    };
  }

  const perParticleDrag = new Map<string, number>();

  return (particle) => {
    if (!perParticleDrag.has(particle.id)) {
      const drag =
        factor + (random(`drag-${particle.seed}`) - 0.5) * 2 * variance;
      perParticleDrag.set(particle.id, drag);
    }

    const particleDrag = perParticleDrag.get(particle.id)!;
    particle.velocity.x *= particleDrag;
    particle.velocity.y *= particleDrag;
    particle.velocity.z *= particleDrag;
  };
};

export const createWiggle = (
  magnitude: number,
  frequency: number = 0.5,
  magnitudeVariance?: number,
): ParticleBehaviorHandler => {
  if (!magnitudeVariance) {
    return (particle, age) => {
      const noiseX = (random(`wiggle-x-${particle.seed}-${age}`) - 0.5) * 2;
      const noiseY = (random(`wiggle-y-${particle.seed}-${age}`) - 0.5) * 2;
      const noiseZ = (random(`wiggle-z-${particle.seed}-${age}`) - 0.5) * 2;

      if (random(`wiggle-freq-${particle.seed}-${age}`) < frequency) {
        particle.velocity.x += noiseX * magnitude;
        particle.velocity.y += noiseY * magnitude;
        particle.velocity.z += noiseZ * magnitude;
      }
    };
  }

  const perParticleMagnitude = new Map<string, number>();

  return (particle, age) => {
    if (!perParticleMagnitude.has(particle.id)) {
      const particleMagnitude =
        magnitude +
        (random(`wiggle-mag-${particle.seed}`) - 0.5) * 2 * magnitudeVariance;
      perParticleMagnitude.set(particle.id, particleMagnitude);
    }

    const resolvedMagnitude = perParticleMagnitude.get(particle.id)!;
    const noiseX = (random(`wiggle-x-${particle.seed}-${age}`) - 0.5) * 2;
    const noiseY = (random(`wiggle-y-${particle.seed}-${age}`) - 0.5) * 2;
    const noiseZ = (random(`wiggle-z-${particle.seed}-${age}`) - 0.5) * 2;

    if (random(`wiggle-freq-${particle.seed}-${age}`) < frequency) {
      particle.velocity.x += noiseX * resolvedMagnitude;
      particle.velocity.y += noiseY * resolvedMagnitude;
      particle.velocity.z += noiseZ * resolvedMagnitude;
    }
  };
};

export const createOpacityOverLife = (
  keyframes: number[],
  startVariance?: number,
  endVariance?: number,
): ParticleBehaviorHandler => {
  if (!startVariance && !endVariance) {
    return (particle, age) => {
      const lifeProgress = age / particle.lifespan;
      if (keyframes.length === 2) {
        particle.opacity =
          keyframes[0] + (keyframes[1] - keyframes[0]) * lifeProgress;
      }
    };
  }

  const perParticleKeyframes = new Map<string, [number, number]>();

  return (particle, age) => {
    if (!perParticleKeyframes.has(particle.id)) {
      const startVar = startVariance || 0;
      const endVar = endVariance || 0;

      const start =
        keyframes[0] +
        (random(`opacity-start-${particle.seed}`) - 0.5) * 2 * startVar;
      const end =
        keyframes[1] +
        (random(`opacity-end-${particle.seed}`) - 0.5) * 2 * endVar;

      perParticleKeyframes.set(particle.id, [
        Math.max(0, Math.min(1, start)),
        Math.max(0, Math.min(1, end)),
      ]);
    }

    const [start, end] = perParticleKeyframes.get(particle.id)!;
    const lifeProgress = age / particle.lifespan;
    if (keyframes.length === 2) {
      particle.opacity = start + (end - start) * lifeProgress;
    }
  };
};

export const createScaleOverLife = (
  start: number,
  end: number,
  startVariance?: number,
  endVariance?: number,
): ParticleBehaviorHandler => {
  if (!startVariance && !endVariance) {
    return (particle, age) => {
      const lifeProgress = age / particle.lifespan;
      particle.scale = start + (end - start) * lifeProgress;
    };
  }

  const perParticleScale = new Map<string, { start: number; end: number }>();

  return (particle, age) => {
    if (!perParticleScale.has(particle.id)) {
      const startVar = startVariance || 0;
      const endVar = endVariance || 0;

      const startScale =
        start + (random(`scale-start-${particle.seed}`) - 0.5) * 2 * startVar;
      const endScale =
        end + (random(`scale-end-${particle.seed}`) - 0.5) * 2 * endVar;

      perParticleScale.set(particle.id, { start: startScale, end: endScale });
    }

    const { start: particleStart, end: particleEnd } = perParticleScale.get(
      particle.id,
    )!;
    const lifeProgress = age / particle.lifespan;
    particle.scale =
      particleStart + (particleEnd - particleStart) * lifeProgress;
  };
};
