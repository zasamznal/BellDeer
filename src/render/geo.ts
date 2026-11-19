// Geometry builder for the "painted wood" look: flat facets, colour in vertex
// attributes, a little per-face value jitter instead of textures.

import * as THREE from 'three';

let seed = 1234567;
export function srand(s: number): void {
  seed = s >>> 0 || 1;
}
export function rnd(): number {
  seed ^= seed << 13;
  seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  seed >>>= 0;
  return seed / 4294967296;
}
export const rr = (a: number, b: number) => a + (b - a) * rnd();

const tmpColor = new THREE.Color();

export class Builder {
  private pos: number[] = [];
  private col: number[] = [];

  /** Add a geometry with a transform; faces get the colour with ±jitter in value. */
  add(geo: THREE.BufferGeometry, m: THREE.Matrix4, color: THREE.ColorRepresentation, jitter = 0.08, quad = false): this {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.getAttribute('position');
    const v = new THREE.Vector3();
    tmpColor.set(color);
    const per = quad ? 6 : 3;
    let k = 1;
    for (let i = 0; i < p.count; i++) {
      if (i % per === 0) k = 1 + (rnd() * 2 - 1) * jitter;
      v.fromBufferAttribute(p, i).applyMatrix4(m);
      this.pos.push(v.x, v.y, v.z);
      this.col.push(tmpColor.r * k, tmpColor.g * k, tmpColor.b * k);
    }
    if (g !== geo) g.dispose();
    geo.dispose();
    return this;
  }

  box(w: number, h: number, d: number, m: THREE.Matrix4, color: THREE.ColorRepresentation, jitter = 0.1): this {
    return this.add(new THREE.BoxGeometry(w, h, d), m, color, jitter, true);
  }

  /** Recolour vertices added since `from` with a function of position. */
  tint(from: number, fn: (x: number, y: number, z: number, c: THREE.Color) => void): this {
    for (let i = from; i < this.pos.length / 3; i++) {
      tmpColor.setRGB(this.col[i * 3], this.col[i * 3 + 1], this.col[i * 3 + 2]);
      fn(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2], tmpColor);
      this.col[i * 3] = tmpColor.r;
      this.col[i * 3 + 1] = tmpColor.g;
      this.col[i * 3 + 2] = tmpColor.b;
    }
    return this;
  }
  get count(): number {
    return this.pos.length / 3;
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

/** Compose a matrix from position, Euler rotation (XYZ) and scale. */
export function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx): THREE.Matrix4 {
  _p.set(x, y, z);
  _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ'));
  _s.set(sx, sy, sz);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

export function woodMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
}
