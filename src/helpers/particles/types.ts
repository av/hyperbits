export interface Vector3 {
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
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  scale: number;
  rotation: number;
  opacity: number;
  spawnerId: string;
}

export type SpawnerShape = "point" | "rect" | "circle";

export interface SpawnerConfig {
  id: string;
  rate?: number;
  burst?: number;
  startFrame?: number;
  max?: number;
  position?: Partial<Vector3>;
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
