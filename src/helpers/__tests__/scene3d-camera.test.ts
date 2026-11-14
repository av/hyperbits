import gsap from "gsap";
import { describe, expect, it } from "vitest";

import {
  cameraProject,
  cameraStateAt,
  cameraToCSS,
  createCamera,
  lookAtOrientation,
  type CameraConfig,
  type LookAtCameraState,
} from "../scene3d";

type Vector = [number, number, number];

const rotate = (
  orientation: [number, number, number, number],
  vector: Vector,
): Vector => {
  const [x, y, z, w] = orientation;
  const rows = [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
  return rows.map(
    (row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2],
  ) as Vector;
};

const normalize = (vector: Vector): Vector => {
  const length = Math.hypot(...vector);
  return vector.map((value) => value / length) as Vector;
};

const angleBetween = (left: Vector, right: Vector): number => {
  const dot = left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
  return Math.acos(Math.min(1, Math.max(-1, dot)));
};

const basis = (state: LookAtCameraState) => ({
  forward: rotate(state.orientation, [0, 0, -1]),
  right: rotate(state.orientation, [1, 0, 0]),
  up: rotate(state.orientation, [0, -1, 0]),
});

const expectVectorClose = (actual: Vector, expected: Vector, digits = 6) => {
  actual.forEach((value, index) =>
    expect(value).toBeCloseTo(expected[index], digits),
  );
};

const yawTarget = (degrees: number): Vector => {
  const radians = (degrees * Math.PI) / 180;
  return [-Math.sin(radians) * 1000, 0, -Math.cos(radians) * 1000];
};

describe("lookAtOrientation", () => {
  it("is the identity when looking down -z", () => {
    expectVectorClose(
      lookAtOrientation([0, 0, 0], [0, 0, -500]).slice(0, 3) as Vector,
      [0, 0, 0],
    );
    expect(lookAtOrientation([0, 0, 0], [0, 0, -500])[3]).toBeCloseTo(1, 10);
  });

  it("points the forward axis at the target for known vectors", () => {
    const cases: Array<[Vector, Vector]> = [
      [
        [0, 0, 0],
        [10, 0, 0],
      ],
      [
        [0, 0, 0],
        [-10, 0, 0],
      ],
      [
        [0, 0, 0],
        [0, 0, 10],
      ],
      [
        [0, 0, 1000],
        [0, 1000, 0],
      ],
      [
        [-950, -620, 3350],
        [120, 60, 0],
      ],
      [
        [300, 200, -100],
        [-400, -900, 650],
      ],
    ];
    for (const [position, target] of cases) {
      const orientation = lookAtOrientation(position, target);
      const expected = normalize([
        target[0] - position[0],
        target[1] - position[1],
        target[2] - position[2],
      ]);
      expectVectorClose(rotate(orientation, [0, 0, -1]), expected);
      expect(rotate(orientation, [1, 0, 0])[1]).toBeCloseTo(0, 10);
      expect(rotate(orientation, [0, -1, 0])[1]).toBeLessThan(0);
    }
  });

  it("matches yaw and pitch from asin and atan2", () => {
    const orientation = lookAtOrientation([0, 0, 0], [-100, 100, -100]);
    const pitch = Math.asin(100 / Math.hypot(100, 100, 100));
    const yaw = Math.atan2(100, 100);
    const forward = rotate(orientation, [0, 0, -1]);
    expect(Math.asin(forward[1])).toBeCloseTo(pitch, 10);
    expect(Math.atan2(-forward[0], -forward[2])).toBeCloseTo(yaw, 10);
  });

  it("rolls around the view axis without moving it", () => {
    const level = lookAtOrientation([0, 0, 0], [200, 50, -400]);
    const rolled = lookAtOrientation([0, 0, 0], [200, 50, -400], 30);
    expectVectorClose(rotate(rolled, [0, 0, -1]), rotate(level, [0, 0, -1]));
    expect(
      angleBetween(rotate(rolled, [1, 0, 0]), rotate(level, [1, 0, 0])),
    ).toBeCloseTo(Math.PI / 6, 8);
  });
});

describe("cameraStateAt", () => {
  const flight: CameraConfig = {
    lens: 1200,
    keys: [
      {
        time: 0,
        position: [0, 0, 600],
        target: [0, 0, 0],
        roll: -2,
        lens: 2400,
        ease: "sine.inOut",
      },
      {
        time: 1.5,
        position: [-950, -620, 3350],
        target: [120, 60, 0],
        roll: 3,
        ease: "expo.inOut",
      },
      {
        time: 3,
        position: { x: 1150, y: -40, z: 2000 },
        target: [1150, 0, 0],
        roll: 0,
        lens: 1100,
      },
      { time: 4, position: [0, 0, 1400], target: [0, 0, 300] },
    ],
  };

  it("lands exactly on each key", () => {
    const resolvedRolls = [-2, 3, 0, 0];
    const resolvedLens = [2400, 2400, 1100, 1100];
    flight.keys.forEach((key, index) => {
      const state = cameraStateAt(key.time, flight);
      const position = Array.isArray(key.position)
        ? key.position
        : [key.position.x, key.position.y, key.position.z];
      expectVectorClose(state.position, position as Vector);
      expect(state.lens).toBeCloseTo(resolvedLens[index], 10);
      expect(state.roll).toBeCloseTo(resolvedRolls[index], 10);
      const target = key.target as Vector;
      expectVectorClose(
        state.forward,
        normalize([
          target[0] - position[0],
          target[1] - position[1],
          target[2] - position[2],
        ]),
      );
    });
  });

  it("is continuous across key boundaries", () => {
    const epsilon = 1e-6;
    for (const key of flight.keys.slice(1, -1)) {
      const before = cameraStateAt(key.time - epsilon, flight);
      const at = cameraStateAt(key.time, flight);
      const after = cameraStateAt(key.time + epsilon, flight);
      for (const neighbour of [before, after]) {
        expectVectorClose(neighbour.position, at.position, 2);
        expect(neighbour.lens).toBeCloseTo(at.lens, 3);
        const left = basis(neighbour);
        const right = basis(at);
        expect(angleBetween(left.forward, right.forward)).toBeLessThan(1e-3);
        expect(angleBetween(left.up, right.up)).toBeLessThan(1e-3);
      }
    }
  });

  it("clamps before the first key and after the last", () => {
    expect(cameraStateAt(-5, flight)).toEqual({
      ...cameraStateAt(0, flight),
      time: -5,
    });
    expect(cameraStateAt(99, flight)).toEqual({
      ...cameraStateAt(4, flight),
      time: 99,
    });
  });

  it("returns identical state for the same time regardless of call order", () => {
    const times = Array.from({ length: 41 }, (_, index) => index * 0.1 + 0.013);
    const forward = times.map((time) => cameraStateAt(time, flight));
    const reversed = [...times]
      .reverse()
      .map((time) => cameraStateAt(time, flight));
    const shuffled = times
      .map((time, index) => ({ time, order: (index * 17) % times.length }))
      .sort((left, right) => left.order - right.order)
      .map(({ time }) => ({ time, state: cameraStateAt(time, flight) }));

    reversed.reverse();
    expect(reversed).toEqual(forward);
    for (const { time, state } of shuffled) {
      expect(state).toEqual(forward[times.indexOf(time)]);
    }
  });

  it("does not flip across a 180 degree turn", () => {
    const turn: CameraConfig = {
      keys: [
        { time: 0, position: [0, 0, 0], target: yawTarget(0), ease: "none" },
        { time: 1, position: [0, 0, 0], target: yawTarget(90), ease: "none" },
        { time: 2, position: [0, 0, 0], target: yawTarget(180) },
      ],
    };
    let previous = basis(cameraStateAt(0, turn));
    let travelled = 0;
    for (let step = 1; step <= 400; step += 1) {
      const current = basis(cameraStateAt(step / 200, turn));
      const delta = angleBetween(previous.forward, current.forward);
      expect(delta).toBeLessThan(0.02);
      expect(current.up[1]).toBeCloseTo(-1, 8);
      expect(current.forward[1]).toBeCloseTo(0, 8);
      travelled += delta;
      previous = current;
    }
    expect(travelled).toBeCloseTo(Math.PI, 6);
    expectVectorClose(previous.forward, [0, 0, 1]);
  });

  it("takes the short way through the yaw wrap instead of spinning", () => {
    const wrap: CameraConfig = {
      keys: [
        {
          time: 0,
          position: [0, 0, 0],
          target: yawTarget(170),
          roll: 4,
          ease: "none",
        },
        { time: 1, position: [0, 0, 0], target: yawTarget(-170), roll: -4 },
      ],
    };
    let previous = basis(cameraStateAt(0, wrap));
    let travelled = 0;
    for (let step = 1; step <= 100; step += 1) {
      const current = basis(cameraStateAt(step / 100, wrap));
      travelled += angleBetween(previous.forward, current.forward);
      expect(current.up[1]).toBeLessThan(-0.99);
      previous = current;
    }
    expect(travelled).toBeCloseTo((20 * Math.PI) / 180, 2);
  });

  it("interpolates the lens with the segment ease", () => {
    const linear: CameraConfig = {
      keys: [
        { time: 0, position: [0, 0, 0], lens: 2400, ease: "none" },
        { time: 2, position: [0, 0, 0], lens: 1200 },
      ],
    };
    expect(cameraStateAt(1, linear).lens).toBeCloseTo(1800, 10);
    expect(cameraStateAt(0.5, linear).lens).toBeCloseTo(2100, 10);

    const easedIn: CameraConfig = {
      keys: [
        { time: 0, position: [0, 0, 0], lens: 2400, ease: "power1.in" },
        { time: 2, position: [0, 0, 0], lens: 1200 },
      ],
    };
    expect(cameraStateAt(1, easedIn).lens).toBeCloseTo(2100, 6);
    expect(cameraToCSS(cameraStateAt(1, easedIn)).perspective).toBe("2100px");
  });

  it("carries omitted fields forward and falls back to the config lens", () => {
    const config: CameraConfig = {
      lens: 900,
      keys: [
        { time: 0, position: [0, 0, 500], target: [0, 0, 0], roll: 5 },
        { time: 1, position: [100, 0, 500] },
        { time: 2, position: [200, 0, 500], lens: 1500 },
      ],
    };
    const middle = cameraStateAt(1, config);
    expect(middle.lens).toBe(900);
    expect(middle.roll).toBe(5);
    expect(middle.target).toEqual([0, 0, 0]);
    expect(cameraStateAt(2, config).lens).toBe(1500);
  });

  it("cuts when two keys share a time", () => {
    const config: CameraConfig = {
      keys: [
        { time: 0, position: [0, 0, 500], target: [0, 0, 0] },
        { time: 1, position: [0, 0, 400], target: [0, 0, 0] },
        { time: 1, position: [900, 0, 400], target: [900, 0, 0] },
        { time: 2, position: [900, 0, 300], target: [900, 0, 0] },
      ],
    };
    expect(cameraStateAt(0.999999, config).position[0]).toBeCloseTo(0, 6);
    expect(cameraStateAt(1, config).position).toEqual([900, 0, 400]);
  });
});

describe("cameraToCSS and cameraProject", () => {
  it("emits perspective and a world matrix3d", () => {
    const state = cameraStateAt(0, {
      keys: [
        { time: 0, position: [100, 50, 500], target: [100, 50, 0], lens: 1200 },
      ],
    });
    expect(cameraToCSS(state)).toEqual({
      perspective: "1200px",
      transform: "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,-100,-50,700,1)",
    });
  });

  it("projects the target to the centre at lens distance with unit scale", () => {
    const state = cameraStateAt(0, {
      keys: [
        { time: 0, position: [300, -200, 900], target: [0, 0, 0], lens: 1000 },
      ],
    });
    const distance = Math.hypot(300, 200, 900);
    const target = cameraProject(state, [0, 0, 0]);
    expect(target.x).toBeCloseTo(0, 8);
    expect(target.y).toBeCloseTo(0, 8);
    expect(target.depth).toBeCloseTo(distance, 8);
    expect(target.scale).toBeCloseTo(1000 / distance, 8);
    expect(cameraProject(state, [600, -400, 1800]).scale).toBe(0);
  });

  it("puts screen right on +x and screen down on +y", () => {
    const state = cameraStateAt(0, {
      keys: [
        { time: 0, position: [0, 0, 1000], target: [0, 0, 0], lens: 1000 },
      ],
    });
    const projected = cameraProject(state, [100, 40, 0]);
    expect(projected.x).toBeCloseTo(100, 8);
    expect(projected.y).toBeCloseTo(40, 8);
  });
});

describe("createCamera", () => {
  const config: CameraConfig = {
    keys: [
      {
        time: 0,
        position: [0, 0, 2000],
        target: [0, 0, 0],
        lens: 1600,
        ease: "power3.inOut",
      },
      {
        time: 2,
        position: [600, -300, 900],
        target: [100, 0, 0],
        roll: 6,
        lens: 1000,
      },
    ],
  };

  it("styles the stage and world and applies the first frame", () => {
    const stage = document.createElement("div");
    const world = document.createElement("div");
    stage.append(world);
    const camera = createCamera(stage, world, config);
    expect(world.style.transformStyle).toBe("preserve-3d");
    expect(stage.style.perspective).toBe("1600px");
    expect(world.style.transform).toBe(
      cameraToCSS(camera.stateAt(0)).transform,
    );
  });

  it("matches cameraStateAt and stays seek-safe through bind", () => {
    const stage = document.createElement("div");
    const world = document.createElement("div");
    const camera = createCamera(stage, world, config);
    const timeline = gsap.timeline({ paused: true });
    timeline.to({ value: 0 }, { value: 1, duration: 2 }, 0);
    camera.bind(timeline);

    const seen = (time: number) => {
      timeline.seek(time, false);
      return `${stage.style.perspective}|${world.style.transform}`;
    };
    const forward = [0.25, 0.9, 1.4, 1.95].map(seen);
    const backward = [1.95, 1.4, 0.9, 0.25].map(seen).reverse();
    expect(backward).toEqual(forward);
    expect(camera.stateAt(1.4)).toEqual(cameraStateAt(1.4, config));
    expect(seen(1.4)).toBe(
      `${cameraToCSS(camera.stateAt(1.4)).perspective}|${cameraToCSS(camera.stateAt(1.4)).transform}`,
    );
  });
});
