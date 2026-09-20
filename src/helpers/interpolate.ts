import { lerp } from "./math";

export type SpringConfig = {
  mass?: number;
  stiffness?: number;
  damping?: number;
};

const springFactory = (config: SpringConfig = {}) => {
  const { mass = 1, stiffness = 100, damping = 10 } = config;
  const naturalFrequency = Math.sqrt(stiffness / mass);
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));

  return (progress: number) => {
    if (progress === 0) return 0;
    if (progress === 1) return 1;

    if (dampingRatio < 1) {
      const dampedFrequency =
        naturalFrequency * Math.sqrt(1 - dampingRatio * dampingRatio);
      return (
        1 -
        Math.exp(-dampingRatio * naturalFrequency * progress) *
          (Math.cos(dampedFrequency * progress) +
            ((dampingRatio * naturalFrequency) / dampedFrequency) *
              Math.sin(dampedFrequency * progress))
      );
    }

    return (
      1 -
      Math.exp(-naturalFrequency * progress) * (1 + naturalFrequency * progress)
    );
  };
};

export const Easing = {
  linear: (progress: number) => progress,
  easeIn: (progress: number) => progress * progress,
  easeOut: (progress: number) => progress * (2 - progress),
  easeInOut: (progress: number) =>
    progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress,
  easeInQuad: (progress: number) => progress * progress,
  easeOutQuad: (progress: number) => progress * (2 - progress),
  easeInOutQuad: (progress: number) =>
    progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress,
  easeInCubic: (progress: number) => progress * progress * progress,
  easeOutCubic: (progress: number) => {
    const inverted = progress - 1;
    return inverted * inverted * inverted + 1;
  },
  easeInOutCubic: (progress: number) =>
    progress < 0.5
      ? 4 * progress * progress * progress
      : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1,
  easeInSine: (progress: number) => 1 - Math.cos((progress * Math.PI) / 2),
  easeOutSine: (progress: number) => Math.sin((progress * Math.PI) / 2),
  easeInOutSine: (progress: number) => -(Math.cos(Math.PI * progress) - 1) / 2,
  easeInQuart: (progress: number) => progress * progress * progress * progress,
  easeOutQuart: (progress: number) => {
    const inverted = progress - 1;
    return 1 - inverted * inverted * inverted * inverted;
  },
  easeInOutQuart: (progress: number) => {
    if (progress < 0.5) {
      return 8 * progress * progress * progress * progress;
    }
    const inverted = progress - 1;
    return 1 - 8 * inverted * inverted * inverted * inverted;
  },
  spring: springFactory(),
} as const;

export type EasingName = keyof typeof Easing;
export type EasingFunction = (progress: number) => number;

export const steps = (count: number) => (progress: number) =>
  Math.floor(progress * count) / count;
export const spring = springFactory;

export type Hold = { type: "hold"; frames: number };
export const hold = (frames: number): Hold => ({ type: "hold", frames });

export type Extrapolate = "clamp" | "extend" | "identity";

export interface InterpolateOptions {
  extrapolateLeft?: Extrapolate;
  extrapolateRight?: Extrapolate;
  easing?: EasingFunction | EasingName | string;
}

const POWER_EXPONENTS: Record<string, number> = {
  none: 1,
  linear: 1,
  power1: 2,
  quad: 2,
  power2: 3,
  cubic: 3,
  power3: 4,
  quart: 4,
  power4: 5,
  quint: 5,
  strong: 5,
};

type EaseDirection = "in" | "out" | "inOut";

const powerEase = (
  exponent: number,
  direction: EaseDirection,
): EasingFunction => {
  if (exponent <= 1) {
    return Easing.linear;
  }
  if (direction === "in") {
    return (progress: number) => progress ** exponent;
  }
  if (direction === "out") {
    return (progress: number) => 1 - (1 - progress) ** exponent;
  }
  return (progress: number) => {
    if (progress < 0.5) {
      return 2 ** (exponent - 1) * progress ** exponent;
    }
    return 1 - (-2 * progress + 2) ** exponent / 2;
  };
};

const sineEase = (direction: EaseDirection): EasingFunction => {
  if (direction === "in") return Easing.easeInSine;
  if (direction === "out") return Easing.easeOutSine;
  return Easing.easeInOutSine;
};

const circEase = (direction: EaseDirection): EasingFunction => {
  if (direction === "in") {
    return (progress: number) => 1 - Math.sqrt(1 - progress * progress);
  }
  if (direction === "out") {
    return (progress: number) => {
      const inverted = progress - 1;
      return Math.sqrt(1 - inverted * inverted);
    };
  }
  return (progress: number) => {
    if (progress < 0.5) {
      return (1 - Math.sqrt(1 - (2 * progress) ** 2)) / 2;
    }
    return (Math.sqrt(1 - (-2 * progress + 2) ** 2) + 1) / 2;
  };
};

const expoEase = (direction: EaseDirection): EasingFunction => {
  if (direction === "in") {
    return (progress: number) =>
      progress === 0 ? 0 : 2 ** (10 * progress - 10);
  }
  if (direction === "out") {
    return (progress: number) =>
      progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
  }
  return (progress: number) => {
    if (progress === 0) return 0;
    if (progress === 1) return 1;
    if (progress < 0.5) return 2 ** (20 * progress - 10) / 2;
    return (2 - 2 ** (-20 * progress + 10)) / 2;
  };
};

const BACK_OVERSHOOT = 1.70158;

const backEase = (direction: EaseDirection): EasingFunction => {
  const overshoot = BACK_OVERSHOOT;
  const cubic = overshoot + 1;
  if (direction === "in") {
    return (progress: number) =>
      cubic * progress * progress * progress - overshoot * progress * progress;
  }
  if (direction === "out") {
    return (progress: number) => {
      const inverted = progress - 1;
      return (
        1 +
        cubic * inverted * inverted * inverted +
        overshoot * inverted * inverted
      );
    };
  }
  const inOutOvershoot = overshoot * 1.525;
  const inOutCubic = inOutOvershoot + 1;
  return (progress: number) => {
    if (progress < 0.5) {
      return (
        ((2 * progress) ** 2 * ((inOutCubic + 1) * 2 * progress - inOutCubic)) /
        2
      );
    }
    return (
      ((2 * progress - 2) ** 2 *
        ((inOutCubic + 1) * (progress * 2 - 2) + inOutCubic) +
        2) /
      2
    );
  };
};

const bounceOut = (progress: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (progress < 1 / d1) {
    return n1 * progress * progress;
  }
  if (progress < 2 / d1) {
    const shifted = progress - 1.5 / d1;
    return n1 * shifted * shifted + 0.75;
  }
  if (progress < 2.5 / d1) {
    const shifted = progress - 2.25 / d1;
    return n1 * shifted * shifted + 0.9375;
  }
  const shifted = progress - 2.625 / d1;
  return n1 * shifted * shifted + 0.984375;
};

const bounceEase = (direction: EaseDirection): EasingFunction => {
  if (direction === "in") {
    return (progress: number) => 1 - bounceOut(1 - progress);
  }
  if (direction === "out") {
    return bounceOut;
  }
  return (progress: number) => {
    if (progress < 0.5) {
      return (1 - bounceOut(1 - 2 * progress)) / 2;
    }
    return (1 + bounceOut(2 * progress - 1)) / 2;
  };
};

const elasticEase = (direction: EaseDirection): EasingFunction => {
  const period = 0.3;
  if (direction === "in") {
    return (progress: number) => {
      if (progress === 0 || progress === 1) return progress;
      return (
        -(2 ** (10 * progress - 10)) *
        Math.sin(((progress * 10 - 10.75) * (2 * Math.PI)) / period)
      );
    };
  }
  if (direction === "out") {
    return (progress: number) => {
      if (progress === 0 || progress === 1) return progress;
      return (
        2 ** (-10 * progress) *
          Math.sin(((progress * 10 - 0.75) * (2 * Math.PI)) / period) +
        1
      );
    };
  }
  return (progress: number) => {
    if (progress === 0 || progress === 1) return progress;
    const sign = progress < 0.5 ? -1 : 1;
    const scaled = progress < 0.5 ? 20 * progress - 10 : 20 * progress - 10;
    return (
      (sign *
        2 ** scaled *
        Math.sin(((20 * progress - 11.125) * (2 * Math.PI)) / 0.45)) /
      2
    );
  };
};

const parseEaseDirection = (suffix: string | undefined): EaseDirection => {
  if (suffix === "in") return "in";
  if (suffix === "inOut" || suffix === "inout") return "inOut";
  return "out";
};

const builtinGsapEase = (name: string): EasingFunction | null => {
  const trimmed = name.trim();
  const stepsMatch = trimmed.match(/^steps\((\d+)\)$/i);
  if (stepsMatch) {
    return steps(Number(stepsMatch[1]));
  }

  const [base, suffix] = trimmed.split(".");
  const direction = parseEaseDirection(suffix);
  const exponent = POWER_EXPONENTS[base];
  if (exponent !== undefined) {
    return powerEase(exponent, direction);
  }
  if (base === "sine") return sineEase(direction);
  if (base === "circ") return circEase(direction);
  if (base === "expo") return expoEase(direction);
  if (base === "back") return backEase(direction);
  if (base === "bounce") return bounceEase(direction);
  if (base === "elastic") return elasticEase(direction);
  return null;
};

type GsapEaseParser = {
  parseEase?: (name: string) => EasingFunction;
};

const gsapFromGlobal = (): GsapEaseParser | null => {
  const candidate = (globalThis as { gsap?: GsapEaseParser }).gsap;
  return candidate ?? null;
};

/**
 * Returns a GSAP-compatible ease function for a name like `power2.out`.
 * Uses `gsap.parseEase` when GSAP is loaded; otherwise a built-in map.
 */
export function gsapEase(name: string): EasingFunction {
  const gsapInstance = gsapFromGlobal();
  if (gsapInstance?.parseEase) {
    return gsapInstance.parseEase(name);
  }
  const mapped = builtinGsapEase(name);
  if (mapped) return mapped;
  return Easing.linear;
}

export function resolveEase(
  easing?: EasingFunction | EasingName | string,
): EasingFunction | undefined {
  if (!easing) return undefined;
  if (typeof easing === "function") return easing;
  if (easing in Easing) {
    return Easing[easing as EasingName];
  }
  return gsapEase(easing);
}

export function interpolate(
  input: number,
  inputRange: number[],
  outputRange: number[],
  options?: InterpolateOptions,
): number {
  const {
    extrapolateLeft = "extend",
    extrapolateRight = "extend",
    easing,
  } = options || {};

  if (inputRange.length !== outputRange.length) {
    throw new Error("inputRange and outputRange must have the same length");
  }

  if (inputRange.length < 2) {
    throw new Error("inputRange must have at least 2 elements");
  }

  let segmentIndex = -1;

  for (let index = 0; index < inputRange.length - 1; index++) {
    const start = inputRange[index];
    const end = inputRange[index + 1];

    if (start === end) {
      if (input === start) {
        segmentIndex = index;
        break;
      }
    } else if (start < end) {
      if (input >= start && input <= end) {
        segmentIndex = index;
        break;
      }
    } else if (input <= start && input >= end) {
      segmentIndex = index;
      break;
    }
  }

  if (segmentIndex === -1) {
    if (input < inputRange[0]) {
      if (extrapolateLeft === "clamp") {
        return outputRange[0];
      }
      if (extrapolateLeft === "identity") {
        return input;
      }
      segmentIndex = 0;
    } else if (extrapolateRight === "clamp") {
      return outputRange[outputRange.length - 1];
    } else if (extrapolateRight === "identity") {
      return input;
    } else {
      segmentIndex = inputRange.length - 2;
    }
  }

  const inputStart = inputRange[segmentIndex];
  const inputEnd = inputRange[segmentIndex + 1];
  const outputStart = outputRange[segmentIndex];
  const outputEnd = outputRange[segmentIndex + 1];

  if (inputStart === inputEnd) {
    return outputStart;
  }

  let progress = (input - inputStart) / (inputEnd - inputStart);

  const easingFn = resolveEase(easing);
  if (easingFn) {
    progress = easingFn(progress);
  }

  return lerp(outputStart, outputEnd, progress);
}

export type InterpolateValue<Value = number> =
  | Value
  | [inputRange: number[], outputRange: Value[], options?: InterpolateOptions];

export function resolveInterpolateValue<Value = number>(
  value: InterpolateValue<Value>,
  frame: number,
): Value {
  if (Array.isArray(value)) {
    const [inputRange, outputRange, options] = value as [
      number[],
      Value[],
      InterpolateOptions?,
    ];
    return interpolate(
      frame,
      inputRange,
      outputRange as number[],
      options,
    ) as unknown as Value;
  }
  return value as Value;
}

export type AnimatedValue<Value = number> = Value | (Value | Hold)[];

export function interpolateKeyframes<Value = number>(
  value: AnimatedValue<Value>,
  progress: number,
  easingFn?: EasingFunction,
  duration?: number,
): Value {
  if (!Array.isArray(value)) return value as Value;

  const rawKeyframes = value as (Value | Hold)[];
  if (rawKeyframes.length === 0) return 0 as unknown as Value;

  const isHold = (item: Value | Hold): item is Hold =>
    typeof item === "object" && item !== null && (item as Hold).type === "hold";

  const hasHolds = rawKeyframes.some(isHold);

  if (hasHolds) {
    if (typeof duration !== "number") {
      const firstValue = rawKeyframes.find((item) => !isHold(item)) as Value;
      return firstValue;
    }

    const simpleKeyframes: Value[] = [];
    const inputRange: number[] = [];
    const holds = rawKeyframes.filter(isHold);
    const totalHoldFrames = holds.reduce((sum, item) => sum + item.frames, 0);
    const valuesOnly = rawKeyframes.filter((item) => !isHold(item)) as Value[];
    const transitionsCount = Math.max(0, valuesOnly.length - 1);
    const availableFrames = Math.max(0, duration - totalHoldFrames);
    const transitionDuration =
      transitionsCount > 0 ? availableFrames / transitionsCount : 0;

    let currentFrame = 0;
    let lastValue: Value | undefined;

    for (const item of rawKeyframes) {
      if (isHold(item)) {
        if (lastValue !== undefined) {
          currentFrame += item.frames;
          inputRange.push(currentFrame / duration);
          simpleKeyframes.push(lastValue);
        }
      } else {
        if (lastValue !== undefined) {
          currentFrame += transitionDuration;
        }
        inputRange.push(currentFrame / duration);
        simpleKeyframes.push(item);
        lastValue = item;
      }
    }

    return interpolate(progress, inputRange, simpleKeyframes as number[], {
      easing: easingFn,
    }) as unknown as Value;
  }

  const keyframes = value as Value[];
  if (keyframes.length === 1) return keyframes[0];

  const inputRange = keyframes.map(
    (_item, index) => index / (keyframes.length - 1),
  );

  return interpolate(progress, inputRange, keyframes as number[], {
    easing: easingFn,
  }) as unknown as Value;
}
