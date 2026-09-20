import { describe, it, expect } from "vitest";
import gsap from "gsap";
import { Transform3D, Vector3, createScene3D, sceneStateAt } from "../scene3d";

describe("Transform3D", () => {
  it("creates an identity transform by default", () => {
    const transform = new Transform3D();
    expect(transform.position.x).toBe(0);
    expect(transform.position.y).toBe(0);
    expect(transform.position.z).toBe(0);
    expect(transform.scale.x).toBe(1);
    expect(transform.scale.y).toBe(1);
    expect(transform.scale.z).toBe(1);
  });

  it("translates without mutating the original", () => {
    const transform = Transform3D.identity();
    const translated = transform.translate(10, 20, 30);
    expect(translated.position.x).toBe(10);
    expect(translated.position.y).toBe(20);
    expect(translated.position.z).toBe(30);
    expect(transform.position.x).toBe(0);
  });

  it("rotates in degrees around X", () => {
    const rotated = Transform3D.identity().rotateX(90);
    const euler = rotated.toEuler();
    expect(euler.x).toBeCloseTo(Math.PI / 2, 5);
  });

  it("scales", () => {
    const scaled = Transform3D.identity().scaleBy(2, 3, 4);
    expect(scaled.scale.x).toBe(2);
    expect(scaled.scale.y).toBe(3);
    expect(scaled.scale.z).toBe(4);
  });

  it("multiplies translations", () => {
    const first = Transform3D.identity().translate(10, 0, 0);
    const second = Transform3D.identity().translate(5, 0, 0);
    const result = first.multiply(second);
    const point = result.apply(new Vector3(0, 0, 0));
    expect(point.x).toBeCloseTo(15, 5);
  });

  it("inverts a transform", () => {
    const transform = Transform3D.fromEuler(
      Math.PI / 4,
      Math.PI / 6,
      0,
      new Vector3(10, 20, 30),
      new Vector3(2, 2, 2),
    );
    const identity = transform.multiply(transform.inverse());
    const point = identity.apply(new Vector3(0, 0, 0));
    expect(point.x).toBeCloseTo(0, 1);
    expect(point.y).toBeCloseTo(0, 1);
    expect(point.z).toBeCloseTo(0, 1);
  });

  it("interpolates position and scale", () => {
    const from = Transform3D.identity().translate(0, 0, 0);
    const to = Transform3D.identity().translate(100, 100, 100);
    const mid = from.lerp(to, 0.5);
    expect(mid.position.x).toBeCloseTo(50, 5);
    expect(mid.position.y).toBeCloseTo(50, 5);
    expect(mid.position.z).toBeCloseTo(50, 5);
  });

  it("emits a CSS matrix3d string", () => {
    const css = Transform3D.identity().translate(10, 20, 30).toCSSMatrix3D();
    expect(css).toContain("matrix3d");
    expect(css).toMatch(/matrix3d\([^)]+\)/);
  });

  it("preserves id across chainable methods", () => {
    const original = Transform3D.identity();
    const transformed = original.translate(10, 20, 30).rotateZ(45).scaleBy(2);
    expect(transformed.id).toBe(original.id);
  });

  it("randomly translates within bounds, deterministically", () => {
    const transform = Transform3D.identity();
    const first = transform.randomTranslate(
      [-10, 10],
      [-5, 5],
      [0, 20],
      "seed",
    );
    const second = transform.randomTranslate(
      [-10, 10],
      [-5, 5],
      [0, 20],
      "seed",
    );
    expect(first.position.x).toBe(second.position.x);
    expect(first.position.x).toBeGreaterThanOrEqual(-10);
    expect(first.position.x).toBeLessThanOrEqual(10);
  });
});

describe("sceneStateAt", () => {
  const steps = [
    { id: "intro", duration: 2, x: 0, y: 0, z: 0 },
    { id: "mid", duration: 2, x: 400, y: 0, z: -200, rotateY: 30 },
  ];

  it("starts on the first step", () => {
    const state = sceneStateAt(0.1, { steps, transitionDuration: 0.4 });
    expect(state.activeStepId).toBe("intro");
    expect(state.activeStepIndex).toBe(0);
  });

  it("moves the camera toward the next step during a transition", () => {
    const before = sceneStateAt(1.9, { steps, transitionDuration: 0.5 });
    const mid = sceneStateAt(2.25, { steps, transitionDuration: 0.5 });
    expect(mid.activeStepId).toBe("mid");
    expect(mid.camera.x).toBeGreaterThan(before.camera.x);
    expect(mid.camera.x).toBeLessThan(400);
    expect(mid.transitionProgress).toBeGreaterThan(0);
    expect(mid.transitionProgress).toBeLessThan(1);
  });

  it("settles on the target camera after the transition", () => {
    const state = sceneStateAt(3, { steps, transitionDuration: 0.5 });
    expect(state.activeStepId).toBe("mid");
    expect(state.camera.x).toBe(400);
    expect(state.camera.z).toBe(-200);
    expect(state.camera.rotateY).toBe(30);
    expect(state.transitionProgress).toBe(1);
  });
});

describe("createScene3D", () => {
  it("mounts a CSS 3D scene with perspective, steps, and elements", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const stepOne = document.createElement("div");
    stepOne.textContent = "Step 1";
    const stepTwo = document.createElement("div");
    stepTwo.textContent = "Step 2";
    const decoration = document.createElement("div");
    decoration.textContent = "orb";

    const scene = createScene3D(root, {
      perspective: 1200,
      steps: [
        { id: "step1", duration: 2, element: stepOne },
        { id: "step2", duration: 2, x: 500, element: stepTwo },
      ],
      elements: [{ x: -200, y: 100, element: decoration }],
    });

    expect(root.style.perspective).toBe("1200px");
    expect(root.querySelector("[data-scene3d-canvas]")).toBe(scene.canvas);
    expect(stepOne.dataset.stepId).toBe("step1");
    expect(stepOne.dataset.stepActive).toBe("true");
    expect(stepOne.style.transform).toContain("matrix3d");
    expect(decoration.dataset.element3dFixed).toBe("false");

    const later = scene.stateAt(2.1);
    scene.apply(later);
    expect(stepTwo.dataset.stepActive).toBe("true");
    expect(stepOne.dataset.stepActive).toBe("false");

    const timeline = gsap.timeline({ paused: true });
    timeline.to({ progress: 0 }, { progress: 1, duration: 4, ease: "none" });
    scene.bind(timeline);
    timeline.seek(2.5);
    timeline.eventCallback("onUpdate")?.call(timeline);
    expect(stepTwo.dataset.stepActive).toBe("true");

    root.remove();
  });
});
