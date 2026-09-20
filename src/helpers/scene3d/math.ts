export class Vec3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(other: Vec3): this {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;
    return this;
  }

  add(other: Vec3): this {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
  }

  sub(other: Vec3): this {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  lerp(other: Vec3, alpha: number): this {
    this.x += (other.x - this.x) * alpha;
    this.y += (other.y - this.y) * alpha;
    this.z += (other.z - this.z) * alpha;
    return this;
  }

  applyQuaternion(quat: Quat): this {
    const ix = quat.w * this.x + quat.y * this.z - quat.z * this.y;
    const iy = quat.w * this.y + quat.z * this.x - quat.x * this.z;
    const iz = quat.w * this.z + quat.x * this.y - quat.y * this.x;
    const iw = -quat.x * this.x - quat.y * this.y - quat.z * this.z;

    this.x = ix * quat.w + iw * -quat.x + iy * -quat.z - iz * -quat.y;
    this.y = iy * quat.w + iw * -quat.y + iz * -quat.x - ix * -quat.z;
    this.z = iz * quat.w + iw * -quat.z + ix * -quat.y - iy * -quat.x;
    return this;
  }

  applyMatrix4(matrix: Mat4): this {
    const elements = matrix.elements;
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const w =
      1 / (elements[3] * x + elements[7] * y + elements[11] * z + elements[15]);
    this.x =
      (elements[0] * x + elements[4] * y + elements[8] * z + elements[12]) * w;
    this.y =
      (elements[1] * x + elements[5] * y + elements[9] * z + elements[13]) * w;
    this.z =
      (elements[2] * x + elements[6] * y + elements[10] * z + elements[14]) * w;
    return this;
  }
}

export class Quat {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1,
  ) {}

  clone(): Quat {
    return new Quat(this.x, this.y, this.z, this.w);
  }

  copy(other: Quat): this {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;
    this.w = other.w;
    return this;
  }

  setFromAxisAngle(axis: Vec3, angle: number): this {
    const half = angle / 2;
    const sine = Math.sin(half);
    this.x = axis.x * sine;
    this.y = axis.y * sine;
    this.z = axis.z * sine;
    this.w = Math.cos(half);
    return this;
  }

  setFromEuler(x: number, y: number, z: number, order: string = "XYZ"): this {
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);
    const upper = order.toUpperCase();

    if (upper === "XYZ") {
      this.x = s1 * c2 * c3 + c1 * s2 * s3;
      this.y = c1 * s2 * c3 - s1 * c2 * s3;
      this.z = c1 * c2 * s3 + s1 * s2 * c3;
      this.w = c1 * c2 * c3 - s1 * s2 * s3;
    } else if (upper === "YXZ") {
      this.x = s1 * c2 * c3 + c1 * s2 * s3;
      this.y = c1 * s2 * c3 - s1 * c2 * s3;
      this.z = c1 * c2 * s3 - s1 * s2 * c3;
      this.w = c1 * c2 * c3 + s1 * s2 * s3;
    } else if (upper === "ZXY") {
      this.x = s1 * c2 * c3 - c1 * s2 * s3;
      this.y = c1 * s2 * c3 + s1 * c2 * s3;
      this.z = c1 * c2 * s3 + s1 * s2 * c3;
      this.w = c1 * c2 * c3 - s1 * s2 * s3;
    } else if (upper === "ZYX") {
      this.x = s1 * c2 * c3 - c1 * s2 * s3;
      this.y = c1 * s2 * c3 + s1 * c2 * s3;
      this.z = c1 * c2 * s3 - s1 * s2 * c3;
      this.w = c1 * c2 * c3 + s1 * s2 * s3;
    } else if (upper === "YZX") {
      this.x = s1 * c2 * c3 + c1 * s2 * s3;
      this.y = c1 * s2 * c3 + s1 * c2 * s3;
      this.z = c1 * c2 * s3 - s1 * s2 * c3;
      this.w = c1 * c2 * c3 - s1 * s2 * s3;
    } else {
      this.x = s1 * c2 * c3 - c1 * s2 * s3;
      this.y = c1 * s2 * c3 + s1 * c2 * s3;
      this.z = c1 * c2 * s3 + s1 * s2 * c3;
      this.w = c1 * c2 * c3 - s1 * s2 * s3;
    }
    return this;
  }

  multiply(other: Quat): this {
    return this.multiplyQuaternions(this, other);
  }

  premultiply(other: Quat): this {
    return this.multiplyQuaternions(other, this);
  }

  multiplyQuaternions(a: Quat, b: Quat): this {
    this.x = a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y;
    this.y = a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z;
    this.z = a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x;
    this.w = a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
    return this;
  }

  invert(): this {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    return this;
  }

  slerp(end: Quat, alpha: number): this {
    let cosHalfTheta =
      this.x * end.x + this.y * end.y + this.z * end.z + this.w * end.w;
    const next = end.clone();
    if (cosHalfTheta < 0) {
      next.x *= -1;
      next.y *= -1;
      next.z *= -1;
      next.w *= -1;
      cosHalfTheta = -cosHalfTheta;
    }
    if (cosHalfTheta >= 1) return this;
    const sinHalfTheta = Math.sqrt(1 - cosHalfTheta * cosHalfTheta);
    if (Math.abs(sinHalfTheta) < 0.001) {
      this.x = 0.5 * (this.x + next.x);
      this.y = 0.5 * (this.y + next.y);
      this.z = 0.5 * (this.z + next.z);
      this.w = 0.5 * (this.w + next.w);
      return this;
    }
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - alpha) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(alpha * halfTheta) / sinHalfTheta;
    this.x = this.x * ratioA + next.x * ratioB;
    this.y = this.y * ratioA + next.y * ratioB;
    this.z = this.z * ratioA + next.z * ratioB;
    this.w = this.w * ratioA + next.w * ratioB;
    return this;
  }

  toEuler(order: string = "XYZ"): Vec3 {
    const matrix = new Mat4().compose(new Vec3(), this, new Vec3(1, 1, 1));
    return matrix.toEuler(order);
  }
}

export class Mat4 {
  elements: number[];

  constructor() {
    this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  clone(): Mat4 {
    const copy = new Mat4();
    copy.elements = this.elements.slice();
    return copy;
  }

  compose(position: Vec3, quaternion: Quat, scale: Vec3): this {
    const te = this.elements;
    const x = quaternion.x;
    const y = quaternion.y;
    const z = quaternion.z;
    const w = quaternion.w;
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;
    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    const sx = scale.x;
    const sy = scale.y;
    const sz = scale.z;

    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;
    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;
    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;
    te[12] = position.x;
    te[13] = position.y;
    te[14] = position.z;
    te[15] = 1;
    return this;
  }

  multiply(other: Mat4): this {
    const ae = this.elements;
    const be = other.elements;
    const result = Array.from({ length: 16 }, () => 0);
    for (let column = 0; column < 4; column++) {
      for (let row = 0; row < 4; row++) {
        result[column * 4 + row] =
          ae[row] * be[column * 4] +
          ae[row + 4] * be[column * 4 + 1] +
          ae[row + 8] * be[column * 4 + 2] +
          ae[row + 12] * be[column * 4 + 3];
      }
    }
    this.elements = result;
    return this;
  }

  invert(): this {
    const te = this.elements;
    const n11 = te[0];
    const n21 = te[1];
    const n31 = te[2];
    const n41 = te[3];
    const n12 = te[4];
    const n22 = te[5];
    const n32 = te[6];
    const n42 = te[7];
    const n13 = te[8];
    const n23 = te[9];
    const n33 = te[10];
    const n43 = te[11];
    const n14 = te[12];
    const n24 = te[13];
    const n34 = te[14];
    const n44 = te[15];

    const t11 =
      n23 * n34 * n42 -
      n24 * n33 * n42 +
      n24 * n32 * n43 -
      n22 * n34 * n43 -
      n23 * n32 * n44 +
      n22 * n33 * n44;
    const t12 =
      n14 * n33 * n42 -
      n13 * n34 * n42 -
      n14 * n32 * n43 +
      n12 * n34 * n43 +
      n13 * n32 * n44 -
      n12 * n33 * n44;
    const t13 =
      n13 * n24 * n42 -
      n14 * n23 * n42 +
      n14 * n22 * n43 -
      n12 * n24 * n43 -
      n13 * n22 * n44 +
      n12 * n23 * n44;
    const t14 =
      n14 * n23 * n32 -
      n13 * n24 * n32 -
      n14 * n22 * n33 +
      n12 * n24 * n33 +
      n13 * n22 * n34 -
      n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
    if (det === 0) return this;
    const invDet = 1 / det;

    te[0] = t11 * invDet;
    te[1] =
      (n24 * n33 * n41 -
        n23 * n34 * n41 -
        n24 * n31 * n43 +
        n21 * n34 * n43 +
        n23 * n31 * n44 -
        n21 * n33 * n44) *
      invDet;
    te[2] =
      (n22 * n34 * n41 -
        n24 * n32 * n41 +
        n24 * n31 * n42 -
        n21 * n34 * n42 -
        n22 * n31 * n44 +
        n21 * n32 * n44) *
      invDet;
    te[3] =
      (n23 * n32 * n41 -
        n22 * n33 * n41 -
        n23 * n31 * n42 +
        n21 * n33 * n42 +
        n22 * n31 * n43 -
        n21 * n32 * n43) *
      invDet;
    te[4] = t12 * invDet;
    te[5] =
      (n13 * n34 * n41 -
        n14 * n33 * n41 +
        n14 * n31 * n43 -
        n11 * n34 * n43 -
        n13 * n31 * n44 +
        n11 * n33 * n44) *
      invDet;
    te[6] =
      (n14 * n32 * n41 -
        n12 * n34 * n41 -
        n14 * n31 * n42 +
        n11 * n34 * n42 +
        n12 * n31 * n44 -
        n11 * n32 * n44) *
      invDet;
    te[7] =
      (n12 * n33 * n41 -
        n13 * n32 * n41 +
        n13 * n31 * n42 -
        n11 * n33 * n42 -
        n12 * n31 * n43 +
        n11 * n32 * n43) *
      invDet;
    te[8] = t13 * invDet;
    te[9] =
      (n14 * n23 * n41 -
        n13 * n24 * n41 -
        n14 * n21 * n43 +
        n11 * n24 * n43 +
        n13 * n21 * n44 -
        n11 * n23 * n44) *
      invDet;
    te[10] =
      (n12 * n24 * n41 -
        n14 * n22 * n41 +
        n14 * n21 * n42 -
        n11 * n24 * n42 -
        n12 * n21 * n44 +
        n11 * n22 * n44) *
      invDet;
    te[11] =
      (n13 * n22 * n41 -
        n12 * n23 * n41 -
        n13 * n21 * n42 +
        n11 * n23 * n42 +
        n12 * n21 * n43 -
        n11 * n22 * n43) *
      invDet;
    te[12] = t14 * invDet;
    te[13] =
      (n13 * n24 * n31 -
        n14 * n23 * n31 +
        n14 * n21 * n33 -
        n11 * n24 * n33 -
        n13 * n21 * n34 +
        n11 * n23 * n34) *
      invDet;
    te[14] =
      (n14 * n22 * n31 -
        n12 * n24 * n31 -
        n14 * n21 * n32 +
        n11 * n24 * n32 +
        n12 * n21 * n34 -
        n11 * n22 * n34) *
      invDet;
    te[15] =
      (n12 * n23 * n31 -
        n13 * n22 * n31 +
        n13 * n21 * n32 -
        n11 * n23 * n32 -
        n12 * n21 * n33 +
        n11 * n22 * n33) *
      invDet;
    return this;
  }

  decompose(): { position: Vec3; rotation: Quat; scale: Vec3 } {
    const te = this.elements;
    const position = new Vec3(te[12], te[13], te[14]);
    const sx = Math.hypot(te[0], te[1], te[2]);
    const sy = Math.hypot(te[4], te[5], te[6]);
    const sz = Math.hypot(te[8], te[9], te[10]);
    const scale = new Vec3(sx, sy, sz);
    const invX = sx === 0 ? 0 : 1 / sx;
    const invY = sy === 0 ? 0 : 1 / sy;
    const invZ = sz === 0 ? 0 : 1 / sz;
    const m11 = te[0] * invX;
    const m21 = te[1] * invX;
    const m31 = te[2] * invX;
    const m12 = te[4] * invY;
    const m22 = te[5] * invY;
    const m32 = te[6] * invY;
    const m13 = te[8] * invZ;
    const m23 = te[9] * invZ;
    const m33 = te[10] * invZ;
    const rotation = quaternionFromRotation(
      m11,
      m21,
      m31,
      m12,
      m22,
      m32,
      m13,
      m23,
      m33,
    );
    return { position, rotation, scale };
  }

  toEuler(order: string = "XYZ"): Vec3 {
    const te = this.elements;
    const m11 = te[0];
    const m12 = te[4];
    const m13 = te[8];
    const m22 = te[5];
    const m23 = te[9];
    const m32 = te[6];
    const m33 = te[10];
    const euler = new Vec3();
    const upper = order.toUpperCase();
    if (upper === "XYZ") {
      euler.y = Math.asin(clamp(m13, -1, 1));
      if (Math.abs(m13) < 0.9999999) {
        euler.x = Math.atan2(-m23, m33);
        euler.z = Math.atan2(-m12, m11);
      } else {
        euler.x = Math.atan2(m32, m22);
        euler.z = 0;
      }
    } else {
      euler.y = Math.asin(clamp(m13, -1, 1));
      euler.x = Math.atan2(-m23, m33);
      euler.z = Math.atan2(-m12, m11);
    }
    return euler;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function quaternionFromRotation(
  m11: number,
  m21: number,
  m31: number,
  m12: number,
  m22: number,
  m32: number,
  m13: number,
  m23: number,
  m33: number,
): Quat {
  const trace = m11 + m22 + m33;
  const quat = new Quat();
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    quat.w = 0.25 / s;
    quat.x = (m32 - m23) * s;
    quat.y = (m13 - m31) * s;
    quat.z = (m21 - m12) * s;
  } else if (m11 > m22 && m11 > m33) {
    const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
    quat.w = (m32 - m23) / s;
    quat.x = 0.25 * s;
    quat.y = (m12 + m21) / s;
    quat.z = (m13 + m31) / s;
  } else if (m22 > m33) {
    const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
    quat.w = (m13 - m31) / s;
    quat.x = (m12 + m21) / s;
    quat.y = 0.25 * s;
    quat.z = (m23 + m32) / s;
  } else {
    const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
    quat.w = (m21 - m12) / s;
    quat.x = (m13 + m31) / s;
    quat.y = (m23 + m32) / s;
    quat.z = 0.25 * s;
  }
  return quat;
}

export const Vector3 = Vec3;
export const Quaternion = Quat;
export const Matrix4 = Mat4;
