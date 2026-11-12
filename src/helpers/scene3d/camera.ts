import type { TimeStateBinding, TimelineBind } from "../binding";
import { chainTimelineUpdate } from "../binding";
import { resolveEase, type EasingFunction } from "../interpolate";
import { clamp, lerp } from "../math";
import { Quat, Vec3 } from "./math";

export type CameraVector =
  | [number, number, number]
  | { x: number; y: number; z: number };

export type CameraKey = {
  time: number;
  position: CameraVector;
  target?: CameraVector;
  roll?: number;
  lens?: number;
  ease?: string | EasingFunction;
};

export type CameraConfig = {
  keys: CameraKey[];
  lens?: number;
  ease?: string | EasingFunction;
};

export type LookAtCameraState = {
  time: number;
  segment: number;
  progress: number;
  position: [number, number, number];
  target: [number, number, number];
  forward: [number, number, number];
  orientation: [number, number, number, number];
  roll: number;
  lens: number;
};

export type CameraCSS = {
  perspective: string;
  transform: string;
};

export type CameraProjection = {
  x: number;
  y: number;
  depth: number;
  scale: number;
};

export type CameraHandle = TimeStateBinding<LookAtCameraState> & {
  stage: HTMLElement;
  world: HTMLElement;
  apply: (state: LookAtCameraState) => void;
  bind: TimelineBind;
};

type ResolvedCameraKey = {
  time: number;
  position: Vec3;
  target: Vec3;
  roll: number;
  lens: number;
  ease: EasingFunction;
  orientation: Quat;
};

const DEG = Math.PI / 180;
const DEFAULT_LENS = 1000;
const DEFAULT_EASE = "power2.inOut";

function toVec3(value: CameraVector): Vec3 {
  if (Array.isArray(value)) return new Vec3(value[0], value[1], value[2]);
  return new Vec3(value.x, value.y, value.z);
}

function toTuple(value: Vec3): [number, number, number] {
  return [value.x, value.y, value.z];
}

export function lookAtOrientation(
  position: CameraVector,
  target: CameraVector,
  roll: number = 0,
): [number, number, number, number] {
  const quat = lookAtQuat(toVec3(position), toVec3(target), roll);
  return [quat.x, quat.y, quat.z, quat.w];
}

function lookAtQuat(position: Vec3, target: Vec3, roll: number): Quat {
  const forward = target.clone().sub(position);
  const length = Math.hypot(forward.x, forward.y, forward.z);
  const pitch = length > 0 ? Math.asin(clamp(forward.y / length, -1, 1)) : 0;
  const yaw = length > 0 ? Math.atan2(-forward.x, -forward.z) : 0;
  return new Quat()
    .setFromAxisAngle(new Vec3(0, 1, 0), yaw)
    .multiply(new Quat().setFromAxisAngle(new Vec3(1, 0, 0), pitch))
    .multiply(new Quat().setFromAxisAngle(new Vec3(0, 0, 1), roll * DEG));
}

function resolveCameraKeys(config: CameraConfig): ResolvedCameraKey[] {
  const defaultEase =
    resolveEase(config.ease ?? DEFAULT_EASE) ??
    ((progress: number) => progress);
  const sorted = config.keys
    .map((key, index) => ({ key, index }))
    .sort(
      (left, right) =>
        left.key.time - right.key.time || left.index - right.index,
    )
    .map((entry) => entry.key);
  const resolved: ResolvedCameraKey[] = [];
  for (const key of sorted) {
    const previous = resolved[resolved.length - 1];
    const position = toVec3(key.position);
    const target = key.target
      ? toVec3(key.target)
      : (previous?.target.clone() ?? position.clone().add(new Vec3(0, 0, -1)));
    const roll = key.roll ?? previous?.roll ?? 0;
    const lens = key.lens ?? previous?.lens ?? config.lens ?? DEFAULT_LENS;
    resolved.push({
      time: key.time,
      position,
      target,
      roll,
      lens,
      ease: key.ease ? (resolveEase(key.ease) ?? defaultEase) : defaultEase,
      orientation: lookAtQuat(position, target, roll),
    });
  }
  return resolved;
}

function forwardOf(orientation: Quat): Vec3 {
  return new Vec3(0, 0, -1).applyQuaternion(orientation);
}

function stateFromKeys(
  time: number,
  keys: ResolvedCameraKey[],
): LookAtCameraState {
  if (keys.length === 0) {
    return {
      time,
      segment: 0,
      progress: 0,
      position: [0, 0, 0],
      target: [0, 0, -1],
      forward: [0, 0, -1],
      orientation: [0, 0, 0, 1],
      roll: 0,
      lens: DEFAULT_LENS,
    };
  }
  let index = 0;
  while (index < keys.length - 2 && time >= keys[index + 1].time) index += 1;
  const from = keys[index];
  const to = keys[Math.min(index + 1, keys.length - 1)];
  const span = to.time - from.time;
  const linear =
    span > 0 ? clamp((time - from.time) / span, 0, 1) : time >= to.time ? 1 : 0;
  const progress = linear <= 0 ? 0 : linear >= 1 ? 1 : from.ease(linear);
  const orientation = from.orientation.clone().slerp(to.orientation, progress);
  return {
    time,
    segment: index,
    progress,
    position: toTuple(from.position.clone().lerp(to.position, progress)),
    target: toTuple(from.target.clone().lerp(to.target, progress)),
    forward: toTuple(forwardOf(orientation)),
    orientation: [orientation.x, orientation.y, orientation.z, orientation.w],
    roll: lerp(from.roll, to.roll, progress),
    lens: lerp(from.lens, to.lens, progress),
  };
}

export function cameraStateAt(
  time: number,
  config: CameraConfig,
): LookAtCameraState {
  return stateFromKeys(time, resolveCameraKeys(config));
}

function rotationRows(
  orientation: [number, number, number, number],
): number[][] {
  const [x, y, z, w] = orientation;
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

function toCameraSpace(
  state: LookAtCameraState,
  point: CameraVector,
): [number, number, number] {
  const rows = rotationRows(state.orientation);
  const world = toVec3(point);
  const relative = [
    world.x - state.position[0],
    world.y - state.position[1],
    world.z - state.position[2],
  ];
  return [0, 1, 2].map(
    (column) =>
      rows[0][column] * relative[0] +
      rows[1][column] * relative[1] +
      rows[2][column] * relative[2],
  ) as [number, number, number];
}

const formatNumber = (value: number): string => {
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(rounded === 0 ? 0 : rounded);
};

export function cameraToCSS(state: LookAtCameraState): CameraCSS {
  const rows = rotationRows(state.orientation);
  const translation = toCameraSpace(state, [0, 0, 0]);
  const values = [
    rows[0][0],
    rows[0][1],
    rows[0][2],
    0,
    rows[1][0],
    rows[1][1],
    rows[1][2],
    0,
    rows[2][0],
    rows[2][1],
    rows[2][2],
    0,
    translation[0],
    translation[1],
    translation[2] + state.lens,
    1,
  ];
  return {
    perspective: `${formatNumber(state.lens)}px`,
    transform: `matrix3d(${values.map(formatNumber).join(",")})`,
  };
}

export function cameraProject(
  state: LookAtCameraState,
  point: CameraVector,
): CameraProjection {
  const local = toCameraSpace(state, point);
  const depth = -local[2];
  const scale = depth > 0 ? state.lens / depth : 0;
  return { x: local[0] * scale, y: local[1] * scale, depth, scale };
}

export function applyCamera(
  stage: HTMLElement,
  world: HTMLElement,
  state: LookAtCameraState,
): void {
  const css = cameraToCSS(state);
  stage.style.perspective = css.perspective;
  world.style.transform = css.transform;
}

export function createCamera(
  stage: HTMLElement,
  world: HTMLElement,
  config: CameraConfig,
): CameraHandle {
  stage.style.perspectiveOrigin = "50% 50%";
  world.style.position = "absolute";
  world.style.left = "50%";
  world.style.top = "50%";
  world.style.width = "0";
  world.style.height = "0";
  world.style.transformStyle = "preserve-3d";
  world.style.transformOrigin = "0 0 0";

  const keys = resolveCameraKeys(config);
  const stateAt = (time: number) => stateFromKeys(time, keys);
  const apply = (state: LookAtCameraState) => applyCamera(stage, world, state);

  apply(stateAt(0));

  const bind: TimelineBind = (timeline) =>
    chainTimelineUpdate(timeline, () => {
      apply(stateAt(timeline.time()));
    });

  return { stage, world, stateAt, apply, bind };
}
