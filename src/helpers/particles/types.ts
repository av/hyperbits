export interface ParticleVector {
  x: number;
  y: number;
  z: number;
}

export interface Particle {
  id: string;
  index: number;
  seed: number;
  birthFrame: number;
  lifespan: number;
  position: ParticleVector;
  velocity: ParticleVector;
  acceleration: ParticleVector;
  scale: number;
  rotation: number;
  opacity: number;
  spawnerId: string;
}

export interface SpawnerConfig {
  id: string;
  rate?: number;
  burst?: number;
  startFrame?: number;
  delayFrame?: number;
  max?: number;
  position?: Partial<ParticleVector>;
  area?: { width: number; height: number; depth?: number };
  velocity?: {
    x: number;
    y: number;
    z?: number;
    varianceX?: number;
    varianceY?: number;
    varianceZ?: number;
  };
  lifespan?: number;
  lifespanVariance?: number;
}

export type ParticleBehaviorHandler = (
  particle: Particle,
  time: number,
  ctx: { frame: number; fps: number },
) => void;

export interface BehaviorConfig {
  id: string;
  handler: ParticleBehaviorHandler;
}

export interface SimulationConfig {
  frame: number;
  fps: number;
  spawners: SpawnerConfig[];
  behaviors: BehaviorConfig[];
}
