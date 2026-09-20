import { randomFloat } from "../random";
import { Vec3, Quat, Mat4 } from "./math";

export type TransformOptions = {
  position?: Vec3;
  rotation?: Quat;
  scale?: Vec3 | number;
  id?: number;
};

export class Transform3D {
  private static idCounter = 0;
  id: number;
  position: Vec3;
  rotation: Quat;
  scale: Vec3;
  private matrix: Mat4;
  private matrixDirty = true;

  constructor(options: TransformOptions = {}) {
    this.id = options.id ?? Transform3D.idCounter++;
    this.position = options.position?.clone() ?? new Vec3(0, 0, 0);
    this.rotation = options.rotation?.clone() ?? new Quat(0, 0, 0, 1);
    if (typeof options.scale === "number") {
      this.scale = new Vec3(options.scale, options.scale, options.scale);
    } else {
      this.scale = options.scale?.clone() ?? new Vec3(1, 1, 1);
    }
    this.matrix = new Mat4();
  }

  static fromMatrix(matrix: Mat4, id?: number): Transform3D {
    const { position, rotation, scale } = matrix.decompose();
    return new Transform3D({ position, rotation, scale, id });
  }

  static fromEuler(
    x: number,
    y: number,
    z: number,
    position?: Vec3,
    scale?: Vec3 | number,
    order: string = "XYZ",
  ): Transform3D {
    const rotation = new Quat().setFromEuler(x, y, z, order);
    return new Transform3D({
      position: position ?? new Vec3(0, 0, 0),
      rotation,
      scale:
        typeof scale === "number"
          ? new Vec3(scale, scale, scale)
          : (scale ?? new Vec3(1, 1, 1)),
    });
  }

  static identity(): Transform3D {
    return new Transform3D();
  }

  clone(): Transform3D {
    return new Transform3D({
      id: this.id,
      position: this.position.clone(),
      rotation: this.rotation.clone(),
      scale: this.scale.clone(),
    });
  }

  translate(x: number | Vec3, y: number = 0, z: number = 0): Transform3D {
    const next = this.clone();
    if (typeof x === "number") {
      next.position.set(
        next.position.x + x,
        next.position.y + y,
        next.position.z + z,
      );
    } else {
      next.position.add(x);
    }
    next.matrixDirty = true;
    return next;
  }

  rotate(quaternion: Quat): Transform3D {
    const next = this.clone();
    next.rotation.multiply(quaternion);
    next.matrixDirty = true;
    return next;
  }

  rotateX(angle: number | string): Transform3D {
    const radians = parseAngle(angle);
    const quat = new Quat().setFromAxisAngle(new Vec3(1, 0, 0), radians);
    return this.rotate(quat);
  }

  rotateY(angle: number | string): Transform3D {
    const radians = parseAngle(angle);
    const quat = new Quat().setFromAxisAngle(new Vec3(0, 1, 0), radians);
    return this.rotate(quat);
  }

  rotateZ(angle: number | string): Transform3D {
    const radians = parseAngle(angle);
    const quat = new Quat().setFromAxisAngle(new Vec3(0, 0, 1), radians);
    return this.rotate(quat);
  }

  scaleBy(sx: number, sy?: number, sz?: number): Transform3D {
    const scaleY = sy ?? sx;
    const scaleZ = sz ?? sx;
    const next = this.clone();
    next.scale.set(
      next.scale.x * sx,
      next.scale.y * scaleY,
      next.scale.z * scaleZ,
    );
    next.matrixDirty = true;
    return next;
  }

  multiply(other: Transform3D): Transform3D {
    const matrix = this.toMatrix4().multiply(other.toMatrix4());
    return Transform3D.fromMatrix(matrix, this.id);
  }

  inverse(): Transform3D {
    const invMatrix = this.toMatrix4().clone().invert();
    return Transform3D.fromMatrix(invMatrix, this.id);
  }

  apply(point: Vec3): Vec3 {
    return point.clone().applyMatrix4(this.toMatrix4());
  }

  lerp(target: Transform3D, alpha: number): Transform3D {
    const position = this.position.clone().lerp(target.position, alpha);
    const rotation = this.rotation.clone().slerp(target.rotation, alpha);
    const scale = this.scale.clone().lerp(target.scale, alpha);
    return new Transform3D({ id: this.id, position, rotation, scale });
  }

  randomTranslate(
    x: [number, number],
    y?: [number, number],
    z?: [number, number],
    seed?: number | string,
  ): Transform3D {
    const actualSeed = seed ?? `transform-3d-${this.id}`;
    const next = this.clone();
    next.position.x += randomFloat(`${actualSeed}-x`, x[0], x[1]);
    if (y) {
      next.position.y += randomFloat(`${actualSeed}-y`, y[0], y[1]);
    }
    if (z) {
      next.position.z += randomFloat(`${actualSeed}-z`, z[0], z[1]);
    }
    next.matrixDirty = true;
    return next;
  }

  randomRotateX(angle: [number, number], seed?: number | string): Transform3D {
    const actualSeed = seed ?? `transform-3d-${this.id}`;
    const degrees = randomFloat(`${actualSeed}-rx`, angle[0], angle[1]);
    return this.rotateX(degrees);
  }

  randomRotateY(angle: [number, number], seed?: number | string): Transform3D {
    const actualSeed = seed ?? `transform-3d-${this.id}`;
    const degrees = randomFloat(`${actualSeed}-ry`, angle[0], angle[1]);
    return this.rotateY(degrees);
  }

  randomRotateZ(angle: [number, number], seed?: number | string): Transform3D {
    const actualSeed = seed ?? `transform-3d-${this.id}`;
    const degrees = randomFloat(`${actualSeed}-rz`, angle[0], angle[1]);
    return this.rotateZ(degrees);
  }

  toMatrix4(): Mat4 {
    if (this.matrixDirty) {
      this.matrix.compose(this.position, this.rotation, this.scale);
      this.matrixDirty = false;
    }
    return this.matrix.clone();
  }

  toCSSMatrix3D(): string {
    const elements = this.toMatrix4().elements.map((value) =>
      Math.abs(value) < 1.0e-6 ? 0 : value,
    );
    return `matrix3d(${elements.join(",")})`;
  }

  decompose(): { position: Vec3; rotation: Quat; scale: Vec3 } {
    return {
      position: this.position.clone(),
      rotation: this.rotation.clone(),
      scale: this.scale.clone(),
    };
  }

  toEuler(order: string = "XYZ"): Vec3 {
    return this.rotation.toEuler(order);
  }
}

function parseAngle(angle: number | string): number {
  if (!angle) return 0;
  if (typeof angle === "number") {
    return (angle * Math.PI) / 180;
  }
  const trimmed = angle.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(deg|rad)$/i);
  if (!match) {
    throw new Error(`Invalid angle format: ${angle}`);
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "rad") return value;
  return (value * Math.PI) / 180;
}

export function interpolateTransform(
  from: Transform3D,
  to: Transform3D,
  progress: number,
): Transform3D {
  return from.lerp(to, progress);
}

export function transformToCSS(transform: Transform3D): string {
  return transform.toCSSMatrix3D();
}
