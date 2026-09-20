import type { TimeStateBinding, TimelineBind } from "../binding";
import { chainTimelineUpdate } from "../binding";
import { resolveEase, type EasingFunction } from "../interpolate";
import { lerp } from "../math";
import { Vec3 } from "./math";
import { Transform3D, transformToCSS } from "./transform";

export type CameraState = {
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
};

export type SceneStep = {
  id?: string;
  duration?: number;
  x?: number;
  y?: number;
  z?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  rotateOrder?: string;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  element?: HTMLElement;
};

export type SceneElement = {
  x?: number;
  y?: number;
  z?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  rotateOrder?: string;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  fixed?: boolean;
  centered?: boolean;
  element: HTMLElement;
};

export type Scene3DConfig = {
  perspective?: number;
  steps: SceneStep[];
  elements?: SceneElement[];
  transitionDuration?: number;
  easing?: string | EasingFunction;
  stepDuration?: number;
  width?: number;
  height?: number;
};

export type ResolvedStep = SceneStep & {
  id: string;
  index: number;
  enterTime: number;
  exitTime: number;
};

export type Scene3DState = {
  activeStepIndex: number;
  activeStepId: string | undefined;
  transitionProgress: number;
  camera: CameraState;
  cameraTransform: Transform3D;
  steps: ResolvedStep[];
};

const DEG = Math.PI / 180;

function stepToTransform(step: SceneStep): Transform3D {
  const rotateX = (step.rotateX ?? 0) * DEG;
  const rotateY = (step.rotateY ?? 0) * DEG;
  const rotateZ = (step.rotateZ ?? 0) * DEG;
  const scale = step.scale ?? 1;
  return Transform3D.fromEuler(
    rotateX,
    rotateY,
    rotateZ,
    new Vec3(step.x ?? 0, step.y ?? 0, step.z ?? 0),
    new Vec3(
      scale * (step.scaleX ?? 1),
      scale * (step.scaleY ?? 1),
      scale * (step.scaleZ ?? 1),
    ),
    (step.rotateOrder ?? "xyz").toUpperCase(),
  );
}

function stepToCamera(step: SceneStep): CameraState {
  return {
    x: step.x ?? 0,
    y: step.y ?? 0,
    z: step.z ?? 0,
    rotateX: step.rotateX ?? 0,
    rotateY: step.rotateY ?? 0,
    rotateZ: step.rotateZ ?? 0,
    scale: step.scale ?? 1,
    scaleX: step.scaleX ?? 1,
    scaleY: step.scaleY ?? 1,
    scaleZ: step.scaleZ ?? 1,
  };
}

function lerpCamera(
  from: CameraState,
  to: CameraState,
  progress: number,
): CameraState {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
    z: lerp(from.z, to.z, progress),
    rotateX: lerp(from.rotateX, to.rotateX, progress),
    rotateY: lerp(from.rotateY, to.rotateY, progress),
    rotateZ: lerp(from.rotateZ, to.rotateZ, progress),
    scale: lerp(from.scale, to.scale, progress),
    scaleX: lerp(from.scaleX, to.scaleX, progress),
    scaleY: lerp(from.scaleY, to.scaleY, progress),
    scaleZ: lerp(from.scaleZ, to.scaleZ, progress),
  };
}

export function resolveSteps(config: Scene3DConfig): ResolvedStep[] {
  const defaultDuration = config.stepDuration ?? 2;
  let current = 0;
  return config.steps.map((step, index) => {
    const duration = step.duration ?? defaultDuration;
    const resolved: ResolvedStep = {
      ...step,
      id: step.id ?? `step-${index}`,
      index,
      enterTime: current,
      exitTime: current + duration,
    };
    current += duration;
    return resolved;
  });
}

export function sceneStateAt(
  time: number,
  config: Scene3DConfig,
): Scene3DState {
  const steps = resolveSteps(config);
  const identityCamera: CameraState = {
    x: 0,
    y: 0,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  };

  if (steps.length === 0) {
    return {
      activeStepIndex: 0,
      activeStepId: undefined,
      transitionProgress: 0,
      camera: identityCamera,
      cameraTransform: Transform3D.identity(),
      steps,
    };
  }

  let currentIndex = steps.findIndex(
    (step) => time >= step.enterTime && time < step.exitTime,
  );
  if (currentIndex < 0) {
    currentIndex =
      time >= steps[steps.length - 1].exitTime ? steps.length - 1 : 0;
  }

  const current = steps[currentIndex];
  const previous = currentIndex > 0 ? steps[currentIndex - 1] : null;
  const transitionDuration = config.transitionDuration ?? 0.5;
  const transitionStart = current.enterTime;
  const transitionEnd = transitionStart + transitionDuration;

  let progress: number;
  if (time < transitionStart) progress = 0;
  else if (time >= transitionEnd) progress = 1;
  else progress = (time - transitionStart) / transitionDuration;

  const easingFn = resolveEase(config.easing ?? "easeInOutCubic");
  const eased = easingFn ? easingFn(progress) : progress;

  const targetCamera = stepToCamera(current);
  const targetForward = stepToTransform(current);

  let camera: CameraState;
  let cameraTransform: Transform3D;

  if (previous && progress < 1) {
    const fromForward = stepToTransform(previous);
    const currentForward = fromForward.lerp(targetForward, eased);
    cameraTransform = currentForward.inverse();
    camera = lerpCamera(stepToCamera(previous), targetCamera, eased);
  } else {
    camera = targetCamera;
    cameraTransform = targetForward.inverse();
  }

  return {
    activeStepIndex: currentIndex,
    activeStepId: current.id,
    transitionProgress: eased,
    camera,
    cameraTransform,
    steps,
  };
}

function applyElementTransform(
  element: HTMLElement,
  spec: SceneStep | SceneElement,
  camera: CameraState,
): void {
  const local = stepToTransform(spec);
  let transform = local;
  if ("fixed" in spec && spec.fixed) {
    const cameraTransform = Transform3D.fromEuler(
      camera.rotateX * DEG,
      camera.rotateY * DEG,
      camera.rotateZ * DEG,
      new Vec3(camera.x, camera.y, camera.z),
      new Vec3(
        camera.scale * camera.scaleX,
        camera.scale * camera.scaleY,
        camera.scale * camera.scaleZ,
      ),
    );
    transform = cameraTransform.multiply(local);
  }
  let css = transformToCSS(transform);
  if ("centered" in spec && spec.centered) {
    css = `translate(-50%, -50%) ${css}`;
  }
  element.style.position = "absolute";
  element.style.transformStyle = "preserve-3d";
  element.style.transform = css;
}

export function applyScene3D(
  root: HTMLElement,
  state: Scene3DState,
  config: Scene3DConfig,
): void {
  const canvas = root.querySelector<HTMLElement>("[data-scene3d-canvas]");
  if (canvas) {
    canvas.style.transform = transformToCSS(state.cameraTransform);
  }

  for (const step of state.steps) {
    if (!step.element) continue;
    step.element.dataset.stepId = step.id;
    step.element.dataset.stepActive = String(
      step.index === state.activeStepIndex,
    );
    applyElementTransform(step.element, step, state.camera);
    step.element.style.transform = `translate(-50%, -50%) ${transformToCSS(stepToTransform(step))}`;
  }

  for (const item of config.elements ?? []) {
    applyElementTransform(item.element, item, state.camera);
    item.element.dataset.element3dFixed = String(Boolean(item.fixed));
  }
}

export type Scene3DHandle = TimeStateBinding<Scene3DState> & {
  canvas: HTMLElement;
  world: HTMLElement;
  apply: (state: Scene3DState) => void;
  bind: TimelineBind;
};

export function createScene3D(
  root: HTMLElement,
  config: Scene3DConfig,
): Scene3DHandle {
  root.dataset.scene3d = "";
  root.style.position = "relative";
  root.style.width = "100%";
  root.style.height = "100%";
  root.style.overflow = "hidden";
  root.style.perspective = `${config.perspective ?? 1000}px`;

  const canvas = document.createElement("div");
  canvas.dataset.scene3dCanvas = "";
  canvas.style.position = "absolute";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.transformStyle = "preserve-3d";
  canvas.style.transformOrigin = "center center";

  const world = document.createElement("div");
  world.dataset.scene3dWorld = "";
  world.style.position = "absolute";
  world.style.left = "50%";
  world.style.top = "50%";
  world.style.transformStyle = "preserve-3d";

  canvas.append(world);
  root.append(canvas);

  for (const step of config.steps) {
    if (step.element) world.append(step.element);
  }
  for (const item of config.elements ?? []) {
    world.append(item.element);
  }

  const stateAt = (time: number) => sceneStateAt(time, config);
  const apply = (state: Scene3DState) => applyScene3D(root, state, config);

  apply(stateAt(0));

  const bind: TimelineBind = (timeline) =>
    chainTimelineUpdate(timeline, () => {
      apply(stateAt(timeline.time()));
    });

  return { canvas, world, stateAt, apply, bind };
}
