// Static prop geometry: trees, rocks, snags, posts, fire pit, bench, tools.
//
// "A forest of painted wood": every prop is hand-built from flat facets. There
// are no textures — one plane gets one value, its neighbours get slightly
// different ones, and long timber faces are split into strips so that the
// jitter reads as sparse painted grain.

import * as THREE from 'three';
import { Builder, M, rnd, rr, srand } from './geo';

export const PALETTE = {
  needle: '#495442',
  needleDark: '#36413a',
  trunk: '#6d4034',
  chip: '#d7b887',
  rock: '#666a78',
  moss: '#59664d',
  bark: '#6a5242',
  post: '#5a4233',
  tin: '#b9c6cf',
  rust: '#7d4a33',
  steel: '#7c8792',
  berry: '#c23b34',
  leaf: '#8a3f2c',
  ember: '#bf532f',
  flame: '#ffc56f',
};

// ------------------------------------------------------------ facet toolkit

type V3 = [number, number, number];
type Col = THREE.ColorRepresentation;
/** One colour, or a function of (segment, side) that returns an already toned colour. */
type Paint = Col | ((seg: number, side: number) => Col);

const TAU = Math.PI * 2;
const ID = new THREE.Matrix4();

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const centroid = (p: V3[]): V3 => {
  const c: V3 = [0, 0, 0];
  for (const q of p) {
    c[0] += q[0] / p.length;
    c[1] += q[1] / p.length;
    c[2] += q[2] / p.length;
  }
  return c;
};

/** A colour with its value shifted: one brush stroke per plane. */
function tone(color: Col, jitter = 0, k = 1): THREE.Color {
  return new THREE.Color(color).multiplyScalar(k * (1 + (rnd() * 2 - 1) * jitter));
}
const blend = (a: Col, b: Col, t: number): THREE.Color => new THREE.Color(a).lerp(new THREE.Color(b), t);

/** Flat triangles in one colour. With `inside`, every triangle is wound to face away from that point. */
function tris(b: Builder, p: V3[], color: Col, m: THREE.Matrix4 = ID, inside?: V3): void {
  const out: number[] = [];
  const mirrored = m.determinant() < 0;
  for (let i = 0; i + 2 < p.length; i += 3) {
    const a = p[i];
    const q = p[i + 1];
    const c = p[i + 2];
    const n = cross(sub(q, a), sub(c, a));
    if (n[0] * n[0] + n[1] * n[1] + n[2] * n[2] < 1e-16) continue;
    let swap = mirrored;
    if (inside && n[0] * ((a[0] + q[0] + c[0]) / 3 - inside[0]) + n[1] * ((a[1] + q[1] + c[1]) / 3 - inside[1]) + n[2] * ((a[2] + q[2] + c[2]) / 3 - inside[2]) < 0) swap = !swap;
    if (swap) out.push(a[0], a[1], a[2], c[0], c[1], c[2], q[0], q[1], q[2]);
    else out.push(a[0], a[1], a[2], q[0], q[1], q[2], c[0], c[1], c[2]);
  }
  if (!out.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  b.add(g, m, color, 0);
}

/** Convex polygon as a fan: a single plane, a single value. */
function poly(b: Builder, p: V3[], color: Col, m: THREE.Matrix4 = ID, inside?: V3): void {
  const t: V3[] = [];
  for (let i = 1; i + 1 < p.length; i++) t.push(p[0], p[i], p[i + 1]);
  tris(b, t, color, m, inside);
}

function ring(n: number, r: number | ((i: number) => number), y: number, cx = 0, cz = 0, a0 = 0, sz = 1): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU;
    const k = typeof r === 'number' ? r : r(i);
    out.push([cx + Math.cos(a) * k, y, cz + Math.sin(a) * k * sz]);
  }
  return out;
}

/** Skin between rings of equal vertex count; each quad is one painted plane. */
function loft(b: Builder, rings: V3[][], paint: Paint, jitter = 0.1, m: THREE.Matrix4 = ID): void {
  for (let s = 0; s + 1 < rings.length; s++) {
    const A = rings[s];
    const B = rings[s + 1];
    const inside = mix3(centroid(A), centroid(B), 0.5);
    for (let j = 0; j < A.length; j++) {
      const k = (j + 1) % A.length;
      const col = typeof paint === 'function' ? paint(s, j) : tone(paint, jitter);
      tris(b, [A[j], B[j], A[k], A[k], B[j], B[k]], col, m, inside);
    }
  }
}

/** A faceted limb along a polyline: trunks, branches, pipes, sleeves. Returns its rings. */
function limb(b: Builder, path: V3[], radii: number[], sides: number, paint: Paint, jitter = 0.12, m: THREE.Matrix4 = ID, a0 = 0): V3[][] {
  const axis = unit(sub(path[path.length - 1], path[0]));
  const ref: V3 = Math.abs(axis[1]) > 0.8 ? [1, 0, 0] : [0, 1, 0];
  const rings = path.map((p, i) => {
    const d = unit(sub(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]));
    const u = unit(cross(ref, d));
    const v = cross(d, u);
    const out: V3[] = [];
    for (let j = 0; j < sides; j++) {
      const a = a0 + (j / sides) * TAU;
      const c = Math.cos(a) * radii[i];
      const s = Math.sin(a) * radii[i];
      out.push([p[0] + u[0] * c + v[0] * s, p[1] + u[1] * c + v[1] * s, p[2] + u[2] * c + v[2] * s]);
    }
    return out;
  });
  loft(b, rings, paint, jitter, m);
  return rings;
}

interface BeamOpt {
  /** Grain strips across the faces that span x / z. */
  gx?: number;
  gz?: number;
  /** Scale of the +Y end (taper). */
  top?: number;
  /** How far the corners wander: hand-hewn, never square. */
  skew?: number;
  /** Colour of the sawn ends. */
  end?: Col;
}

/** Hewn timber along local Y, centred on the origin. */
function beam(b: Builder, w: number, h: number, d: number, m: THREE.Matrix4, color: Col, jitter = 0.12, o: BeamOpt = {}): void {
  const sk = o.skew ?? 0.006;
  const end = (y: number, k: number): V3[] => {
    const c: V3[] = (
      [
        [-w / 2, y, -d / 2],
        [w / 2, y, -d / 2],
        [w / 2, y, d / 2],
        [-w / 2, y, d / 2],
      ] as V3[]
    ).map((p) => [p[0] * k + rr(-sk, sk), p[1] + rr(-sk, sk), p[2] * k + rr(-sk, sk)] as V3);
    const out: V3[] = [];
    for (let e = 0; e < 4; e++) {
      const n = e % 2 === 0 ? (o.gx ?? 1) : (o.gz ?? 1);
      for (let i = 0; i < n; i++) out.push(mix3(c[e], c[(e + 1) % 4], i / n));
    }
    return out;
  };
  const A = end(-h / 2, 1);
  const B = end(h / 2, o.top ?? 1);
  loft(b, [A, B], color, jitter, m);
  poly(b, A, tone(o.end ?? color, jitter), m, [0, 0, 0]);
  poly(b, B, tone(o.end ?? color, jitter), m, [0, 0, 0]);
}

/** Square block (safe under mirrored matrices, unlike Builder.box). */
const block = (b: Builder, w: number, h: number, d: number, m: THREE.Matrix4, color: Col, jitter = 0.08): void => beam(b, w, h, d, m, color, jitter, { skew: 0 });

/** A slate facet: planes that look at the sky gather moss, undersides fall into shadow. */
function slate(b: Builder, pts: V3[], inside: V3, col: Col, moss: number, m: THREE.Matrix4 = ID): void {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    nx += (p[1] - q[1]) * (p[2] + q[2]);
    ny += (p[2] - q[2]) * (p[0] + q[0]);
    nz += (p[0] - q[0]) * (p[1] + q[1]);
  }
  const c = centroid(pts);
  let up = ny / (Math.hypot(nx, ny, nz) || 1);
  if (nx * (c[0] - inside[0]) + ny * (c[1] - inside[1]) + nz * (c[2] - inside[2]) < 0) up = -up;
  const base = tone(col, 0.12, 1 + up * 0.2);
  const k = Math.max(0, Math.min(1, (up - 0.5) / 0.35)) * moss;
  if (k > 0) base.lerp(tone(PALETTE.moss, 0.12), Math.min(1, k * rr(0.8, 1.1)));
  poly(b, pts, base, m, inside);
}

interface Level {
  y: number;
  r: number;
  jit?: number;
  cx?: number;
  cz?: number;
  /** Slope of the ring plane: y += tx * x + tz * z. */
  tx?: number;
  tz?: number;
}

/** Chiselled block: stacked irregular rings that share corner angles, closed by one flat plane. */
function boulder(b: Builder, n: number, levels: Level[], col: Col, moss: number, m: THREE.Matrix4 = ID, sz = 1): void {
  const ang: number[] = [];
  for (let i = 0; i < n; i++) ang.push(((i + rr(-0.28, 0.28)) / n) * TAU);
  const rings = levels.map((L) =>
    ang.map((a) => {
      const r = L.r * (1 + rr(-1, 1) * (L.jit ?? 0.1));
      const x = (L.cx ?? 0) + Math.cos(a) * r;
      const z = (L.cz ?? 0) + Math.sin(a) * r * sz;
      return [x, L.y + (L.tx ?? 0) * x + (L.tz ?? 0) * z, z] as V3;
    }),
  );
  for (let s = 0; s + 1 < rings.length; s++) {
    const A = rings[s];
    const B = rings[s + 1];
    const inside = mix3(centroid(A), centroid(B), 0.5);
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n;
      slate(b, [A[j], B[j], B[k], A[k]], inside, col, moss, m);
    }
  }
  slate(b, rings[rings.length - 1], centroid(rings[0]), col, moss, m);
}

/** A small stone: fire ring, post footing, rubble. */
function chunk(b: Builder, x: number, z: number, r: number, h: number, col: Col, moss = 0, n = 5): void {
  boulder(
    b,
    n,
    [
      { y: -0.02, r, jit: 0.12 },
      { y: h * rr(0.5, 0.7), r: r * rr(0.82, 0.95), jit: 0.1, tx: rr(-0.2, 0.2) },
      { y: h, r: r * rr(0.42, 0.58), jit: 0.12, tx: rr(-0.25, 0.25), tz: rr(-0.25, 0.25) },
    ],
    col,
    moss,
    M(x, 0, z, 0, rnd() * TAU, 0),
    rr(0.75, 1),
  );
}

/** Splinter or thorn: a three-sided spike. */
function spike(b: Builder, from: V3, to: V3, r: number, color: Col, jitter = 0.1, m: THREE.Matrix4 = ID): void {
  limb(b, [from, to], [r, 0], 3, color, jitter, m, rnd() * TAU);
}

/** A bark plate standing a finger proud of a trunk face, pointed at both ends, with its own value. */
function flake(b: Builder, a0: V3, a1: V3, b1: V3, b0: V3, inside: V3, color: Col, lift = 0.014): void {
  const u0 = rr(0.08, 0.3);
  const u1 = rr(0.7, 0.92);
  const v0 = rr(0.03, 0.35);
  const v1 = Math.min(0.97, v0 + rr(0.35, 0.6));
  const P = (u: number, v: number): V3 => mix3(mix3(a0, a1, u), mix3(b0, b1, u), v);
  const um = (u0 + u1) / 2;
  const pts = [P(um + rr(-0.12, 0.12), v0), P(u1, v0 + 0.08), P(u1, v1 - 0.1), P(um + rr(-0.12, 0.12), v1), P(u0, v1 - 0.06), P(u0, v0 + 0.12)];
  const c = centroid(pts);
  const out = unit(sub(c, [inside[0], c[1], inside[2]]));
  poly(
    b,
    pts.map((q) => add(q, mul(out, lift))),
    color,
    ID,
    inside,
  );
}

// ------------------------------------------------------------ forest

const TREES = [
  // Classic layered spruce.
  { pts: [6, 6, 5, 5, 5, 4, 4], start: 0.3, spread: 0.215, h0: 0.14, droop: 1.0, lop: 0.08, stubs: 2, hang: 2 },
  // Heavy, drooping lower skirts.
  { pts: [7, 6, 6, 5, 5, 4], start: 0.225, spread: 0.25, h0: 0.165, droop: 1.35, lop: 0.12, stubs: 2, hang: 3 },
  // Tall and bare-legged, lopsided crown.
  { pts: [5, 5, 5, 5, 4, 4], start: 0.45, spread: 0.165, h0: 0.13, droop: 0.9, lop: 0.3, stubs: 5, hang: 0 },
];

/** Unit-height fir (scale by tree height). Three silhouettes share one material. */
export function treeGeometry(variant: number): THREE.BufferGeometry {
  const v = (((variant | 0) % 3) + 3) % 3;
  srand(900 + v * 17);
  const b = new Builder();
  const cfg = TREES[v];
  const n = 5;
  const a0 = rnd() * TAU;

  // Trunk: red-brown, a flared foot, a slight crook where the crown begins.
  const bx = rr(-0.008, 0.008);
  const bz = rr(-0.008, 0.008);
  const rings: V3[][] = [ring(n, () => 0.042 * rr(1, 1.14), 0, 0, 0, a0), ring(n, 0.034, 0.05, 0, 0, a0 + 0.12)];
  if (v === 2) rings.push(ring(n, 0.029, cfg.start * 0.52, -bx, -bz, a0 + 0.3));
  rings.push(ring(n, 0.023, cfg.start + 0.05, bx, bz, a0 + 0.45));
  rings.push(ring(n, 0, 0.92, 0, 0, a0));
  loft(b, rings, (s) => tone(PALETTE.trunk, 0.17, s === 0 ? 0.8 : 1));
  // Root buttresses: a ridge from the trunk down to a toe, one plane either side.
  for (let i = 0; i < 3; i++) {
    const a = a0 + (i / 3) * TAU + rr(-0.4, 0.4);
    const c = Math.cos(a);
    const s = Math.sin(a);
    const top: V3 = [c * 0.03, rr(0.085, 0.12), s * 0.03];
    const toe: V3 = [c * 0.072, -0.004, s * 0.072];
    tris(b, [top, toe, [c * 0.03 - s * 0.022, -0.004, s * 0.03 + c * 0.022]], tone(PALETTE.trunk, 0.12, 0.95));
    tris(b, [top, [c * 0.03 + s * 0.022, -0.004, s * 0.03 - c * 0.022], toe], tone(PALETTE.trunk, 0.12, 0.7));
  }
  // Dead stubs on the bare trunk.
  for (let i = 0; i < cfg.stubs; i++) {
    const a = rnd() * TAU;
    const y = rr(0.14, cfg.start - 0.02);
    const len = rr(0.03, 0.06);
    const c = Math.cos(a);
    const s = Math.sin(a);
    tris(b, [[c * 0.02, y - 0.006, s * 0.02], [c * 0.02, y + 0.007, s * 0.02], [c * (0.03 + len), y + len * rr(-0.25, 0.45), s * (0.03 + len)]], tone('#3d2a22', 0.15));
  }

  // Tiers: star-shaped skirts, ridge to each ragged tip, valley to each notch.
  const lopDir = rnd() * TAU;
  const tiers = cfg.pts.length;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const last = i === tiers - 1;
    const rim = cfg.start + (0.872 - cfg.start) * Math.pow(t, 0.94);
    const R = (cfg.spread * Math.pow(1 - t, 0.9) + 0.036 * t) * rr(0.94, 1.07);
    const h = last ? 1 - rim : cfg.h0 * (1 - t) + 0.125 * t;
    const k = 1 - t;
    const apex: V3 = [rr(-0.008, 0.008) * k, rim + h, rr(-0.008, 0.008) * k];
    const pts = cfg.pts[i];
    const off = rnd() * TAU;
    const tips: V3[] = [];
    const notches: V3[] = [];
    for (let j = 0; j < pts; j++) {
      const aT = off + ((j + rr(-0.2, 0.2)) / pts) * TAU;
      const aN = off + ((j + 0.5 + rr(-0.14, 0.14)) / pts) * TAU;
      const rT = R * rr(0.8, 1.16) * (1 + cfg.lop * Math.cos(aT - lopDir));
      const rN = R * rr(0.66, 0.82) * (1 + cfg.lop * Math.cos(aN - lopDir));
      tips.push([Math.cos(aT) * rT, rim - h * cfg.droop * rr(0.04, 0.4) * (last ? 0.3 : 1), Math.sin(aT) * rT]);
      notches.push([Math.cos(aN) * rN, rim + h * rr(0.1, 0.24), Math.sin(aN) * rN]);
    }
    const base = blend(PALETTE.needleDark, PALETTE.needle, Math.max(0, Math.min(1, 0.3 + 0.55 * t + rr(-0.2, 0.2))));
    const from = b.count;
    for (let j = 0; j < pts; j++) {
      const nx = tips[(j + 1) % pts];
      tris(b, [apex, tips[j], notches[j]], tone(base, 0.14, 1.07));
      tris(b, [apex, notches[j], nx], tone(base, 0.14, 0.9));
    }
    // The part tucked under the tier above sits in its shadow.
    b.tint(from, (x, _y, z, c) => {
      if (Math.hypot(x, z) < 0.012) c.multiplyScalar(0.66);
    });
    // A few boughs hang loose below the lowest skirts.
    if (i === 0)
      for (let j = 0; j < cfg.hang; j++) {
        const a = rnd() * TAU;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const y = rim - rr(0.03, 0.07);
        const r = R * rr(0.55, 0.8);
        tris(b, [[c * 0.015, y + 0.03, s * 0.015], [c * r - s * 0.022, y - 0.025, s * r + c * 0.022], [c * r * 1.12 + s * 0.02, y - 0.05, s * r * 1.12 - c * 0.02]], tone(PALETTE.needleDark, 0.14, 0.9));
      }
  }
  return b.build();
}

export function rockGeometry(variant: number): THREE.BufferGeometry {
  const v = variant ? 1 : 0;
  srand(300 + v * 31);
  const b = new Builder();
  if (v === 0) {
    // Tall chiselled block with one sloping top plane.
    boulder(
      b,
      6,
      [
        { y: 0, r: 1, jit: 0.07 },
        { y: 0.8, r: 0.9, jit: 0.08, tx: 0.08, tz: -0.06 },
        { y: 1.17, r: 0.62, jit: 0.1, cx: 0.08, cz: -0.05, tx: 0.16, tz: -0.1 },
      ],
      PALETTE.rock,
      1,
    );
  } else {
    // Low split slab with a shard lying against it.
    boulder(
      b,
      7,
      [
        { y: 0, r: 1, jit: 0.07 },
        { y: 0.52, r: 0.94, jit: 0.08, tx: -0.06, tz: 0.08 },
        { y: 0.88, r: 0.7, jit: 0.1, cx: -0.1, cz: 0.06, tx: -0.14, tz: 0.1 },
      ],
      PALETTE.rock,
      1,
      M(-0.04, 0, -0.03),
      0.92,
    );
    boulder(
      b,
      5,
      [
        { y: 0, r: 0.36, jit: 0.1 },
        { y: 0.2, r: 0.33, jit: 0.1, tx: 0.2 },
        { y: 0.36, r: 0.17, jit: 0.1, tx: 0.5 },
      ],
      PALETTE.rock,
      0.6,
      M(0.72, 0, 0.56, 0, 0.6, 0),
    );
  }
  return b.build();
}

const BARK_WORN = '#a36c46';

/** Vertical bark strips: mostly dark, some red-brown, a few where the bark has fallen off. */
function barkPaint(sides: number, dark: Col = PALETTE.bark): (seg: number, side: number) => THREE.Color {
  const strip: number[] = [];
  for (let i = 0; i < sides; i++) strip.push(rnd());
  return (_seg, side) => {
    if (rnd() < 0.3) strip[side] = rnd();
    const s = strip[side];
    return s < 0.58 ? tone(dark, 0.14) : s < 0.86 ? tone(PALETTE.trunk, 0.14, 0.9) : tone(BARK_WORN, 0.1);
  };
}

/** Dead pine with a pale notch on its +Z side and broken branch stubs. */
export function snagGeometry(seed: number): THREE.BufferGeometry {
  srand(700 + seed * 13);
  const b = new Builder();
  const n = 8;
  const lx = rr(-0.02, 0.02);
  const lz = rr(-0.02, 0.008);
  const centre = (y: number): [number, number] => {
    const k = Math.max(0, y - 1.5);
    return [lx * k * k, lz * k * k];
  };
  const radius = (y: number) => 0.3 - 0.036 * y;

  const spec: [number, number, number][] = [
    [0, 0.33, 0],
    [0.34, 0.297, 0],
    [1.04, 0.278, 0],
    [1.2, 0.272, 0],
    [1.39, 0.267, 0],
    [2.3, 0.225, 0.14],
    [3.3, 0.19, 0.3],
    [4.3, 0.155, 0.42],
    [5.05, 0.128, 0.5],
    [5.5, 0.1, 0.56],
  ];
  const rings = spec.map(([y, r, twist], s) => {
    const [cx, cz] = centre(y);
    const pts = ring(n, () => r * (s === 0 ? rr(0.96, 1.24) : s >= 2 && s <= 4 ? rr(0.98, 1.02) : rr(0.93, 1.07)), y, cx, cz, twist);
    if (s === spec.length - 1) for (const p of pts) p[1] += rr(-0.18, 0.2);
    return pts;
  });
  // The V-cut: three corners of one ring are pushed back to the kerf, deepest in the middle.
  rings[3][1][2] = rings[3][3][2] = 0.075;
  rings[3][2][2] = 0.005;
  const bark = barkPaint(n);
  loft(b, rings.slice(0, 3), bark);
  loft(b, rings.slice(4), bark);
  for (const upper of [false, true]) {
    const lo = rings[upper ? 3 : 2];
    const hi = rings[upper ? 4 : 3];
    const inside = mix3(centroid(lo), centroid(hi), 0.5);
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n;
      if (j >= 4) tris(b, [lo[j], hi[j], lo[k], lo[k], hi[j], hi[k]], bark(2, j), ID, inside);
      else if (j === 1 || j === 2) tris(b, [lo[j], hi[j], lo[k], lo[k], hi[j], hi[k]], tone(upper ? '#cfa26c' : PALETTE.chip, 0.05, upper ? 1.0 : 1.08), ID, inside);
      else {
        // Outer corner stays on the bark, inner corner is in the cut: the pale area closes to a point at the flank.
        const o = j === 0 ? j : k;
        const c = j === 0 ? k : j;
        const cheek = tone('#c9a573', 0.05, upper ? 0.8 : 0.96);
        if (upper) {
          tris(b, [lo[o], hi[o], hi[c]], bark(3, j), ID, inside);
          tris(b, [lo[o], hi[c], lo[c]], cheek, ID, inside);
        } else {
          tris(b, [lo[o], hi[o], lo[c]], bark(2, j), ID, inside);
          tris(b, [lo[c], hi[o], hi[c]], cheek, ID, inside);
        }
      }
    }
  }
  // Loose bark plates, kept off the cut.
  for (let i = 0; i < 12; i++) {
    const sgm = [0, 1, 1, 4, 4, 5, 5, 6][Math.floor(rnd() * 8)];
    const j = sgm < 2 ? 4 + Math.floor(rnd() * 4) + (rnd() < 0.3 ? 4 : 0) : Math.floor(rnd() * n);
    const A = rings[sgm];
    const B = rings[sgm + 1];
    const jj = j % n;
    const k = (jj + 1) % n;
    flake(b, A[jj], A[k], B[k], B[jj], mix3(centroid(A), centroid(B), 0.5), rnd() < 0.35 ? tone(BARK_WORN, 0.1) : tone(PALETTE.bark, 0.12, rr(0.7, 1.15)));
  }

  // Splintered pale top.
  const top = rings[rings.length - 1];
  const tc = centroid(top);
  poly(b, top, tone('#8a6f52', 0.1), ID, [tc[0], 0, tc[2]]);
  for (let i = 0; i < 5; i++) {
    const a = rnd() * TAU;
    const p: V3 = [tc[0] + Math.cos(a) * 0.05, tc[1] - 0.1, tc[2] + Math.sin(a) * 0.05];
    spike(b, p, [p[0] + rr(-0.06, 0.06), tc[1] + rr(0.3, 0.8), p[2] + rr(-0.06, 0.06)], 0.045, tone(PALETTE.chip, 0.1, 0.92), 0.08);
  }

  // Broken branches: kinked, pointed, a few snapped short.
  const limbDark = blend(PALETTE.bark, '#2e2420', 0.35);
  for (let i = 0; i < 7; i++) {
    const y = 2.35 + i * 0.42 + rr(-0.15, 0.15);
    const a = i * 2.4 + rr(-0.5, 0.5) + seed;
    const [cx, cz] = centre(y);
    const r = radius(y);
    const len = rr(0.55, 1.25) * (1 - (y - 2.3) / 6.5);
    const p0: V3 = [cx + Math.cos(a) * r * 0.55, y, cz + Math.sin(a) * r * 0.55];
    const p1 = add(p0, mul(unit([Math.cos(a), rr(0.15, 0.55), Math.sin(a)]), len * 0.55));
    const a2 = a + rr(-0.6, 0.6);
    const p2 = add(p1, mul(unit([Math.cos(a2), rr(-0.15, 0.8), Math.sin(a2)]), len * 0.5));
    if (rnd() < 0.3) {
      const rr2 = limb(b, [p0, p1], [0.062, 0.042], 4, limbDark, 0.16, ID, rnd());
      poly(b, rr2[1], tone(PALETTE.chip, 0.08, 0.8), ID, p0);
    } else {
      limb(b, [p0, p1, p2], [0.056, 0.034, 0], 4, limbDark, 0.16, ID, rnd());
      if (rnd() < 0.6) spike(b, p1, add(p1, mul(unit([Math.cos(a - 0.9), rr(0.2, 0.9), Math.sin(a - 0.9)]), len * 0.3)), 0.02, limbDark, 0.16);
    }
  }
  // Fresh chips under the cut.
  for (let i = 0; i < 6; i++) {
    const p: V3 = [rr(-0.45, 0.45), 0.02, rr(0.36, 0.95)];
    const a = rnd() * TAU;
    spike(b, p, [p[0] + Math.cos(a) * rr(0.09, 0.15), 0.035, p[2] + Math.sin(a) * rr(0.09, 0.15)], 0.04, tone(PALETTE.chip, 0.08));
  }
  return b.build();
}

export function stumpGeometry(): THREE.BufferGeometry {
  srand(55);
  const b = new Builder();
  const n = 8;
  // The felling cut slopes down toward the notch side (+Z).
  const cutY = (z: number) => 0.47 - z * 0.22;
  const top = ring(n, () => 0.285 * rr(0.96, 1.04), 0).map((p) => [p[0], cutY(p[2]), p[2]] as V3);
  const rings = [ring(n, () => 0.33 * rr(0.96, 1.24), 0), ring(n, () => 0.297 * rr(0.96, 1.04), 0.3), top];
  loft(b, rings, barkPaint(n));
  const mid: V3 = [0.02, cutY(0.03) + 0.012, 0.03];
  for (let j = 0; j < n; j++) tris(b, [mid, top[j], top[(j + 1) % n]], tone(PALETTE.chip, 0.07), ID, [0, 0, 0]);
  // The hinge: a row of torn fibres across the back of the cut.
  for (let i = 0; i < 5; i++) {
    const x = -0.17 + i * 0.085 + rr(-0.02, 0.02);
    const z = -0.12 + rr(-0.03, 0.03);
    spike(b, [x, cutY(z) - 0.03, z], [x + rr(-0.03, 0.03), cutY(z) + rr(0.1, 0.3), z + rr(-0.04, 0.02)], 0.04, tone(PALETTE.chip, 0.1, 0.94));
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * TAU;
    const d = rr(0.42, 0.9);
    const p: V3 = [Math.cos(a) * d, 0.02, Math.sin(a) * d];
    const a2 = rnd() * TAU;
    spike(b, p, [p[0] + Math.cos(a2) * rr(0.1, 0.17), 0.035, p[2] + Math.sin(a2) * rr(0.1, 0.17)], 0.045, tone(PALETTE.chip, 0.08));
  }
  return b.build();
}

/** T-shaped timber post; the tag hangs from the wire end at local (0.38, 1.35, 0). */
export function postGeometry(): THREE.BufferGeometry {
  srand(81);
  const b = new Builder();
  const iron = '#22252b';
  // Upright, tapering and a little out of true.
  beam(b, 0.175, 1.78, 0.175, M(0, 0.875, 0, 0.012, 0.2, 0.02), PALETTE.post, 0.14, { gx: 2, gz: 2, top: 0.9, skew: 0.009, end: '#7b6450' });
  // Crossbar lapped onto the front of the post, long arm toward +X.
  beam(b, 0.13, 0.84, 0.12, M(0.1, 1.565, 0.04, 0, 0, Math.PI / 2 + 0.035), PALETTE.post, 0.14, { gz: 2, skew: 0.007, end: '#806a55' });
  // Brace under the long arm, kept clear of the swinging tag.
  beam(b, 0.07, 0.34, 0.07, M(0.165, 1.37, 0.03, 0, 0, -0.62), blend(PALETTE.post, '#2e2420', 0.3), 0.12, { skew: 0.005 });
  // Iron: two bolt heads, a wire wrapped round the arm, the wire end.
  block(b, 0.034, 0.034, 0.02, M(0.03, 1.59, 0.108, 0, 0, 0.6), iron, 0.1);
  block(b, 0.03, 0.03, 0.02, M(-0.03, 1.54, 0.108, 0, 0, 0.2), iron, 0.1);
  block(b, 0.02, 0.152, 0.142, M(0.38, 1.552, 0.04, 0, 0, 0.035), iron, 0.12);
  limb(b, [[0.38, 1.49, 0.02], [0.38, 1.352, 0]], [0.008, 0.007], 3, iron, 0.1);
  // Footing stones.
  chunk(b, 0.13, 0.11, 0.12, 0.13, PALETTE.rock, 0.5);
  chunk(b, -0.15, 0.03, 0.1, 0.1, PALETTE.rock, 0.5);
  chunk(b, 0.02, -0.16, 0.11, 0.09, PALETTE.rock, 0.5);
  return b.build();
}

/** Tin plate with clipped corners, a wire ring and a stamped fir; hangs from its top edge at the origin. */
export function tagGeometry(): THREE.BufferGeometry {
  srand(83);
  const b = new Builder();
  const hw = 0.075;
  const H = 0.22;
  const c = 0.022;
  const t = 0.005;
  const outline: [number, number][] = [
    [-hw + c, 0],
    [hw - c, 0],
    [hw, -c],
    [hw, -H + c],
    [hw - c, -H],
    [-hw + c, -H],
    [-hw, -H + c],
    [-hw, -c],
  ];
  const mid: V3 = [0, -H / 2, 0];
  const front = outline.map(([x, y]) => [x, y, t] as V3);
  const back = outline.map(([x, y]) => [x, y, -t] as V3);
  loft(b, [back, front], '#ffffff', 0);
  poly(b, front, '#ffffff', ID, mid);
  poly(b, back, '#ffffff', ID, mid);
  // Stamped fir, raised on both faces; the tilted facets catch a different value.
  for (const s of [1, -1]) {
    const z0 = s * (t + 0.0005);
    const z1 = s * (t + 0.006);
    for (const [ty, by, w] of [
      [-0.062, -0.108, 0.03],
      [-0.094, -0.148, 0.04],
    ]) {
      const top: V3 = [0, ty, z0];
      const l: V3 = [-w, by, z1];
      const r: V3 = [w, by, z1];
      tris(b, [top, l, r], '#ffffff', ID, mid);
      tris(b, [l, [-w, by, z0], [w, by, z0], l, [w, by, z0], r], '#ffffff', ID, [0, by + 0.02, z0]);
    }
    block(b, 0.012, 0.03, 0.008, M(0, -0.163, s * (t + 0.002)), '#ffffff', 0);
  }
  // Wire ring through the top.
  b.add(new THREE.TorusGeometry(0.017, 0.0045, 3, 6), M(0, 0.003, 0, 0, 0, 0.5), '#ffffff', 0);
  return b.build();
}

/** Low workbench of thick planks on splayed legs, with a small anvil, a hammer and stacked billets. */
export function benchGeometry(): THREE.BufferGeometry {
  srand(21);
  const b = new Builder();
  const plank = '#7a5a3c';
  const leg = '#5d4330';
  const along = Math.PI / 2;
  // Top: three planks, each two strokes of grain.
  for (let i = 0; i < 3; i++) {
    const z = (i - 1) * 0.172;
    beam(b, 0.066, 1.15 + rr(-0.04, 0.02), 0.166, M(rr(-0.012, 0.012), 0.628 + rr(-0.004, 0.004), z, 0, rr(-0.012, 0.012), along), i === 1 ? '#86643f' : plank, 0.12, { gz: 2, skew: 0.005, end: '#9a7850' });
  }
  for (const x of [-0.45, 0.45])
    for (const z of [-0.18, 0.18]) beam(b, 0.09, 0.61, 0.09, M(x + Math.sign(x) * 0.02, 0.3, z + Math.sign(z) * 0.012, Math.sign(z) * 0.06, 0, Math.sign(x) * 0.1), leg, 0.13, { skew: 0.006, top: 0.9 });
  // Aprons under the top, rails and a stretcher near the ground.
  for (const z of [-0.2, 0.2]) beam(b, 0.075, 0.86, 0.034, M(0, 0.557, z, 0, 0, along), leg, 0.12, { skew: 0.004 });
  for (const x of [-0.46, 0.46]) beam(b, 0.05, 0.36, 0.05, M(x, 0.2, 0, along, 0, 0), leg, 0.12, { skew: 0.004 });
  beam(b, 0.05, 0.92, 0.055, M(0, 0.2, 0, 0, 0, along), blend(leg, plank, 0.4), 0.12, { skew: 0.004 });
  // Anvil block.
  block(b, 0.13, 0.035, 0.1, M(0.3, 0.678, -0.02, 0, 0.35, 0), '#4f555e', 0.1);
  beam(b, 0.21, 0.07, 0.115, M(0.3, 0.73, -0.02, 0, 0.35, 0), PALETTE.steel, 0.1, { skew: 0.004, top: 1.0 });
  beam(b, 0.07, 0.05, 0.07, M(0.42, 0.728, -0.065, 0, 0.35, 0), PALETTE.steel, 0.1, { skew: 0.003 });
  // Hammer.
  beam(b, 0.026, 0.27, 0.03, M(-0.2, 0.675, 0.07, 0, -0.5, along), '#a8703c', 0.1, { skew: 0.002 });
  block(b, 0.05, 0.05, 0.115, M(-0.31, 0.687, 0.13, 0, -0.5, 0), PALETTE.rust, 0.12);
  // Tin can of nails.
  const can = limb(b, [[-0.42, 0.662, -0.14], [-0.42, 0.76, -0.14]], [0.04, 0.043], 6, PALETTE.tin, 0.12);
  poly(b, can[1], tone('#5c626b', 0.1), ID, [-0.42, 0.6, -0.14]);
  // Split billets stacked by the front legs.
  const billet = (x: number, y: number, z: number, yaw: number) => {
    const d: V3 = [Math.cos(yaw) * 0.19, 0, Math.sin(yaw) * 0.19];
    const c: V3 = [x, y, z];
    const r = limb(b, [sub(c, d), add(c, d)], [0.072, 0.066], 6, barkPaint(6, PALETTE.trunk), 0, ID, rnd());
    poly(b, r[0], tone(PALETTE.chip, 0.08), ID, c);
    poly(b, r[1], tone(PALETTE.chip, 0.08, 0.92), ID, c);
  };
  billet(-0.22, 0.068, 0.4, 0.1);
  billet(-0.2, 0.068, 0.545, -0.12);
  billet(-0.23, 0.185, 0.47, 0.22);
  return b.build();
}

export function firePitGeometry(): THREE.BufferGeometry {
  srand(33);
  const b = new Builder();
  // Stone ring.
  const stones = 10;
  const from = b.count;
  for (let i = 0; i < stones; i++) {
    const a = (i / stones) * TAU + rr(-0.08, 0.08);
    const r = rr(0.145, 0.2);
    chunk(b, Math.cos(a) * 0.63, Math.sin(a) * 0.63, r, rr(0.14, 0.22), i % 3 === 0 ? '#77727f' : '#66616c', 0, 5);
  }
  // Soot on the faces that look at the fire.
  b.tint(from, (x, _y, z, c) => {
    const d = Math.hypot(x, z);
    if (d < 0.6) c.multiplyScalar(0.68 + 0.32 * Math.max(0, (d - 0.44) / 0.16));
  });
  // Ash bed with a few live coals.
  poly(b, ring(9, () => rr(0.47, 0.54), 0.016), tone('#3a3230', 0.05), ID, [0, -1, 0]);
  poly(b, ring(7, () => rr(0.2, 0.28), 0.024, 0.02, -0.02, 0.4), tone('#5a4c46', 0.05), ID, [0, -1, 0]);
  for (let i = 0; i < 8; i++) {
    const a = rnd() * TAU;
    const d = rr(0.06, 0.3);
    const p: V3 = [Math.cos(a) * d, 0.02, Math.sin(a) * d];
    const a2 = rnd() * TAU;
    spike(b, p, [p[0] + Math.cos(a2) * 0.11, 0.055, p[2] + Math.sin(a2) * 0.11], 0.05, tone(i % 3 === 0 ? PALETTE.flame : PALETTE.ember, 0.12));
  }
  // Charred logs leaning into a cone, pale sawn ends up.
  const char = '#33261f';
  const logWood = '#6a442c';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.3 + rr(-0.12, 0.12);
    const c = Math.cos(a);
    const s = Math.sin(a);
    const foot: V3 = [c * 0.37, 0.04, s * 0.37];
    const head: V3 = [-c * 0.07 - s * 0.05, rr(0.44, 0.54), -s * 0.07 + c * 0.05];
    const r = limb(b, [foot, mix3(foot, head, 0.55), head], [0.066, 0.06, 0.052], 5, (seg) => tone(seg === 0 ? char : logWood, 0.2), 0, ID, rnd());
    poly(b, r[2], tone('#a88660', 0.08), ID, foot);
    poly(b, r[0], tone(char, 0.1), ID, head);
  }
  // Two logs lying across the coals.
  for (const [yaw, y, len] of [
    [0.6, 0.075, 0.42],
    [2.3, 0.1, 0.36],
  ]) {
    const d: V3 = [Math.cos(yaw) * len, 0, Math.sin(yaw) * len];
    const r = limb(b, [[-d[0], y, -d[2]], [0, y + 0.01, 0], [d[0], y, d[2]]], [0.062, 0.066, 0.058], 5, (seg) => tone(seg === 0 ? char : logWood, 0.2, 0.85), 0, ID, rnd());
    poly(b, r[0], tone(char, 0.1), ID, [0, y, 0]);
    poly(b, r[2], tone('#8a6a48', 0.08), ID, [0, y, 0]);
  }
  return b.build();
}

export function scrapGeometry(seed: number): THREE.BufferGeometry {
  srand(600 + seed);
  const b = new Builder();
  const iron = '#4a4e57';
  const rust = () => (rnd() < 0.3 ? '#93593a' : PALETTE.rust);
  const yaw = rnd() * TAU;
  const R = (x: number, z: number): [number, number] => [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
  // Buckled roofing sheet: two plates meeting at a fold.
  {
    const [x, z] = R(0, 0);
    b.box(rr(0.4, 0.5), 0.016, rr(0.28, 0.34), M(x, 0.05, z, rr(-0.1, 0.1), yaw, 0.16), rust(), 0.18);
    const [x2, z2] = R(-0.27, 0.02);
    b.box(rr(0.2, 0.26), 0.016, rr(0.26, 0.32), M(x2, 0.1, z2, rr(-0.1, 0.1), yaw, -0.75), rust(), 0.18);
  }
  // A third sheet stands on edge against the heap so the pile has a silhouette.
  {
    const [x, z] = R(-0.02, -0.24);
    b.box(rr(0.3, 0.38), 0.016, rr(0.3, 0.36), M(x, 0.15, z, 1.05 + rr(-0.12, 0.12), yaw + rr(-0.2, 0.2), rr(-0.1, 0.1)), seed % 3 === 0 ? PALETTE.steel : rust(), 0.18);
  }
  // Pipe across the sheet, open dark ends.
  {
    const a = yaw + rr(0.6, 1.2);
    const [cx, cz] = R(0.05, rr(-0.06, 0.06));
    const d: V3 = [Math.cos(a) * 0.27, 0.035, Math.sin(a) * 0.27];
    const c: V3 = [cx, 0.13, cz];
    const r = limb(b, [sub(c, d), add(c, d)], [0.045, 0.045], 6, PALETTE.steel, 0.16, ID, rnd());
    poly(b, r[0], '#17181c', ID, c);
    poly(b, r[1], '#17181c', ID, c);
  }
  // Angle iron.
  {
    const [x, z] = R(0.14, -0.2);
    const a = yaw + rr(-0.4, 0.4);
    b.box(0.46, 0.014, 0.055, M(x, 0.1, z, 0.25, a, 0.22), iron, 0.16);
    b.box(0.46, 0.055, 0.014, M(x - Math.sin(a) * 0.02, 0.125, z - Math.cos(a) * 0.02, 0.25, a, 0.22), iron, 0.16);
  }
  // Wheel rim leaning on the heap.
  {
    const [x, z] = R(rr(-0.12, 0.02), 0.2);
    b.add(new THREE.TorusGeometry(0.15, 0.03, 4, 7), M(x, 0.14, z, 1.05, yaw + rr(-0.5, 0.5), 0.3), seed % 2 ? PALETTE.steel : rust(), 0.16);
  }
  // Dented can and a couple of stray plates.
  {
    const [x, z] = R(0.3, 0.14);
    const r = limb(b, [[x, 0, z], [x + 0.02, 0.14, z + 0.01]], [0.055, 0.06], 6, PALETTE.tin, 0.14, ID, rnd());
    poly(b, r[1], '#3a3d45', ID, [x, 0, z]);
  }
  for (let i = 0; i < 2 + (seed % 2); i++) {
    const a = rnd() * TAU;
    const d = rr(0.3, 0.46);
    b.box(rr(0.1, 0.18), 0.014, rr(0.07, 0.12), M(Math.cos(a) * d, 0.022, Math.sin(a) * d, rr(-0.15, 0.15), rnd() * TAU, rr(-0.15, 0.15)), i % 2 ? PALETTE.steel : rust(), 0.18);
  }
  return b.build();
}

/** Stem polylines shared by the bush and its berries so the clusters sit on the stem tips. */
function bushStems(seed: number): V3[][] {
  srand(500 + seed);
  const stems: V3[][] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rr(-0.4, 0.4);
    const reach = rr(0.18, 0.36);
    const h = rr(0.5, 0.86);
    const c = Math.cos(a);
    const s = Math.sin(a);
    stems.push([
      [c * 0.04, 0, s * 0.04],
      [c * reach * 0.42 + rr(-0.04, 0.04), h * 0.55, s * reach * 0.42 + rr(-0.04, 0.04)],
      [c * reach, h, s * reach],
    ]);
  }
  return stems;
}

/** Folded kite leaf, drawn on both faces. */
function leaf(b: Builder, p: V3, az: number, el: number, len: number, w: number, col: Col): void {
  const d: V3 = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
  const s: V3 = [-Math.sin(az), 0, Math.cos(az)];
  const midp = add(p, mul(d, len * 0.42));
  const l = add(add(midp, mul(s, w)), [0, w * 0.4, 0]);
  const r = add(sub(midp, mul(s, w)), [0, w * 0.4, 0]);
  const tip = add(p, mul(d, len));
  tip[1] -= len * 0.14;
  tris(b, [p, l, tip, p, tip, l], tone(col, 0.16, 1.06));
  tris(b, [p, tip, r, p, r, tip], tone(col, 0.16, 0.84));
}

export function bushGeometry(seed: number): THREE.BufferGeometry {
  const stems = bushStems(seed);
  const b = new Builder();
  const cols = [PALETTE.leaf, '#6d3527', PALETTE.leaf, '#9c4a2b'];
  stems.forEach((path, i) => {
    limb(b, path, [0.015, 0.011, 0.005], 3, '#3f2620', 0.15, ID, rnd());
    const az = Math.atan2(path[2][2], path[2][0]);
    // Paired leaves up the stem, alternating sides.
    for (let k = 0; k < 4; k++) {
      const f = 0.22 + k * 0.2 + rr(-0.04, 0.04);
      const p = f < 0.5 ? mix3(path[0], path[1], f * 2) : mix3(path[1], path[2], f * 2 - 1);
      const side = k % 2 ? 1 : -1;
      leaf(b, p, az + side * rr(0.7, 1.3), rr(0.15, 0.55), rr(0.19, 0.28), rr(0.055, 0.075), cols[(i + k) % 4]);
    }
    // Stems without berries end in a leaf.
    if (i % 3 === 2) leaf(b, path[2], az, 0.7, 0.25, 0.065, cols[i % 4]);
  });
  // Broad leaves spread low around the foot.
  for (let i = 0; i < 5; i++) leaf(b, [0, 0.03, 0], (i / 5) * TAU + rr(-0.3, 0.3), rr(0.12, 0.3), rr(0.26, 0.36), rr(0.08, 0.1), cols[i % 4]);
  return b.build();
}

export function berriesGeometry(seed: number): THREE.BufferGeometry {
  const stems = bushStems(seed);
  const b = new Builder();
  stems.forEach((path, i) => {
    if (i % 3 === 2) return;
    const tip = path[2];
    const n = 3 + (i % 2);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + rnd();
      const d = k === 0 ? 0 : rr(0.04, 0.062);
      b.add(new THREE.IcosahedronGeometry(rr(0.034, 0.045), 0), M(tip[0] + Math.cos(a) * d, tip[1] + (k === 0 ? 0.03 : rr(-0.035, 0.02)), tip[2] + Math.sin(a) * d, rnd(), rnd() * 3, 0), PALETTE.berry, 0.14);
    }
  });
  return b.build();
}

/** Ground clump of autumn fronds: 12 triangles, drawn double-sided and instanced. */
export function fernGeometry(): THREE.BufferGeometry {
  srand(71);
  const b = new Builder();
  const cols = [PALETTE.leaf, '#9a5a34', '#a8502c', PALETTE.leaf, '#7a3a2a'];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + rr(-0.35, 0.35);
    const len = rr(0.3, 0.52);
    const w = rr(0.055, 0.085);
    const h = rr(0.13, 0.26);
    const c = Math.cos(a);
    const s = Math.sin(a);
    const P = (f: number, side: number, y: number): V3 => [c * f * len - s * side * w, y, s * f * len + c * side * w];
    const base = P(0.03, 0, 0.01);
    const tip = P(1, 0, h * rr(0.15, 0.55));
    tris(b, [base, P(0.5, 1, h), tip], tone(cols[i], 0.16, 1.06));
    tris(b, [base, tip, P(0.56, -1, h * 0.85)], tone(cols[i], 0.16, 0.84));
  }
  // One upright sprig.
  tris(b, [[-0.02, 0, 0.01], [0.025, 0, -0.01], [0.03, 0.34, 0.04]], tone('#6d3527', 0.1));
  tris(b, [[0.012, 0.14, 0.014], [0.11, 0.3, -0.03], [0.03, 0.25, 0.03]], tone('#9c4a2b', 0.1));
  return b.build();
}

/** Open jaw trap lying on the ground: two toothed bows hinged on a base bar, a pan between them. */
export function trapGeometry(): THREE.BufferGeometry {
  srand(91);
  const b = new Builder();
  const iron = '#4f555e';
  const bright = '#8d98a3';
  const R = 0.34;
  b.box(0.76, 0.02, 0.06, M(0, 0.014, 0), iron, 0.1);
  b.box(0.05, 0.016, 0.3, M(0, 0.012, 0), iron, 0.1);
  // Hinge blocks and flat springs.
  for (const s of [1, -1]) {
    b.box(0.045, 0.06, 0.08, M(s * R, 0.036, 0), iron, 0.12);
    b.box(0.2, 0.014, 0.046, M(s * 0.22, 0.04, 0, 0, 0, s * 0.13), bright, 0.12);
  }
  // Pan.
  const p0 = ring(6, 0.085, 0.03, 0, 0, 0.3);
  const p1 = ring(6, 0.115, 0.052, 0, 0, 0.3);
  loft(b, [p0, p1], PALETTE.rust, 0.14);
  poly(b, p1, tone(PALETTE.rust, 0.1, 1.1), ID, [0, 0, 0]);
  // Jaws: each bow rises a little away from the hinge line.
  for (const s of [1, -1]) {
    const path: V3[] = [];
    const seg = 6;
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI;
      const z = Math.sin(a) * R;
      path.push([Math.cos(a) * R, 0.045 + z * 0.2, s * z]);
    }
    limb(b, path, path.map(() => 0.021), 4, bright, 0.14, ID, Math.PI / 4);
    for (let k = 0; k < seg; k++) {
      const p = mix3(path[k], path[k + 1], 0.5);
      const inward = unit([-p[0], 0, -p[2]]);
      spike(b, [p[0], p[1], p[2]], [p[0] + inward[0] * 0.035, p[1] + 0.105, p[2] + inward[2] * 0.035], 0.026, tone('#a9b3bc', 0.1));
    }
  }
  return b.build();
}

// ------------------------------------------------------------ first-person tools

/**
 * A blocky fist closed round a grip that runs along local Y (thumb side up).
 * Right hand: back of the hand on +X, knuckles behind the grip (−Z), finger
 * tips returning on −X, thumb across the near side. `arm` is the direction the
 * forearm leaves in; mirror the matrix for a left hand.
 */
function fist(b: Builder, m: THREE.Matrix4, arm: V3, g = 0.028, thumbAlong = false): void {
  const skin = '#c98b62';
  const shade = '#b67a54';
  const T = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => m.clone().multiply(M(x, y, z, rx, ry, rz));
  // Back of the hand.
  beam(b, 0.054, 0.124, 0.114, T(g + 0.022, 0, 0.004, 0, 0.08, 0), skin, 0.06, { skew: 0.004, top: 0.93 });
  // Four fingers: knuckle row behind the grip, tips coming back on the far side.
  const ys = [0.0465, 0.0155, -0.0155, -0.0455];
  const tipLen = [0.07, 0.084, 0.079, 0.062];
  ys.forEach((y, i) => {
    block(b, 2 * g + 0.036, 0.028, 0.034, T(-0.003, y, -(g + 0.015)), shade, 0.07);
    block(b, 0.034, 0.0275, tipLen[i], T(-(g + 0.017), y, -(g + 0.032) + tipLen[i] / 2, 0, i * 0.03 - 0.03, 0), skin, 0.07);
  });
  // Thumb and the heel of the hand.
  if (thumbAlong) block(b, 0.034, 0.092, 0.03, T(0.006, 0.07, g + 0.014, -0.06, 0, 0.14), skin, 0.06);
  else block(b, 2 * g + 0.04, 0.034, 0.032, T(-0.006, 0.052, g + 0.015, 0, 0, -0.3), skin, 0.06);
  block(b, 0.062, 0.086, 0.044, T(g + 0.014, -0.014, g + 0.03, 0, 0.1, 0), shade, 0.06);
  // Wrist, cuff, sleeve.
  const a = unit(arm);
  const s0: V3 = [g + 0.022, -0.022, 0.034];
  const at = (d: number): V3 => add(s0, mul(a, d));
  limb(b, [at(0.01), at(0.12)], [0.04, 0.044], 6, skin, 0.06, m, 0.3);
  const cuff = limb(b, [at(0.095), at(0.16)], [0.06, 0.063], 6, '#454254', 0.1, m, 0.3);
  poly(b, cuff[0], tone('#2c2a36', 0.08), m, at(0.2));
  const sleeve = limb(b, [at(0.16), at(0.36), at(0.66)], [0.056, 0.066, 0.078], 6, (seg) => tone(seg ? '#5e5a6c' : '#686377', 0.1), 0, m, 0.3);
  poly(b, sleeve[2], tone('#3b394a', 0.05), m, at(0.3));
}

/** First-person axe with a blocky bare hand (reference 01 / concept frame). */
export function axeGeometry(): THREE.BufferGeometry {
  srand(13);
  const b = new Builder();
  // Handle: flattened hexagon, a gentle S and a fawn-foot knob.
  const hs: [number, number, number][] = [
    [-0.272, 0.013, 0.025],
    [-0.245, 0.011, 0.03],
    [-0.19, 0.005, 0.0225],
    [0.08, -0.004, 0.021],
    [0.33, 0, 0.022],
    [0.494, 0, 0.0205],
  ];
  const handle = hs.map(([y, cx, r]) => ring(6, r, y, cx, 0, 0, 1.38));
  loft(b, handle, (s) => tone(s < 2 ? '#875634' : '#a06a42', 0.1));
  poly(b, handle[0], tone('#7c4f2a', 0.05), ID, [0, 0, 0]);
  poly(b, handle[5], tone('#b98a58', 0.05), ID, [0, 0, 0]);

  // Iron wedge: red-painted cheeks narrowing from the poll to the bit.
  const hd: [number, number, number, number][] = [
    [0.09, 0.352, 0.45, 0.033],
    [0.045, 0.343, 0.459, 0.04],
    [-0.04, 0.338, 0.463, 0.037],
    [-0.13, 0.312, 0.478, 0.025],
    [-0.212, 0.272, 0.501, 0.012],
  ];
  // Each cheek is two planes meeting on a low crease, so the flat shading splits it light over dark.
  const head = hd.map(([x, yb, yt, hz]) => {
    const ym = yb + (yt - yb) * 0.44;
    return [
      [x, yb, -hz * 0.7],
      [x, yb, hz * 0.7],
      [x, ym, hz],
      [x, yt, hz * 0.76],
      [x, yt, -hz * 0.76],
      [x, ym, -hz],
    ] as V3[];
  });
  loft(b, head, (s, j) => {
    if (j === 0) return tone('#6d2c22', 0.08);
    if (j === 3) return tone('#a84a34', 0.08);
    const upper = j === 2 || j === 4;
    return tone(s === 0 ? '#7a3026' : upper ? '#9a3f2e' : '#84352a', 0.09, s === 3 ? 1.08 : 1);
  });
  poly(b, head[0], tone('#632720', 0.06), ID, [0, 0.4, 0]);
  // Bare steel bevel with a slightly bellied edge.
  const eb: V3 = [-0.258, 0.256, 0];
  const em: V3 = [-0.274, 0.382, 0];
  const et: V3 = [-0.258, 0.515, 0];
  const core: V3 = [-0.2, 0.385, 0];
  const last = head[4];
  const steel = '#c9c2b8';
  for (const [lo, mid, hi] of [
    [last[1], last[2], last[3]],
    [last[0], last[5], last[4]],
  ]) {
    tris(b, [lo, eb, em, lo, em, mid], tone(steel, 0.05, 0.92), ID, core);
    tris(b, [mid, em, et, mid, et, hi], tone(steel, 0.05, 1.06), ID, core);
  }
  tris(b, [last[3], last[4], et], tone('#a59f97', 0.05), ID, core);
  tris(b, [last[0], last[1], eb], tone('#8d8882', 0.05), ID, core);

  fist(b, M(0.001, -0.085, 0), [-0.11, -0.675, 0.73], 0.029);
  return b.build();
}

export function flashlightGeometry(): THREE.BufferGeometry {
  srand(17);
  const b = new Builder();
  // Barrel along Z, stepped head toward −Z.
  const prof: [number, number][] = [
    [0.13, 0.027],
    [0.112, 0.036],
    [-0.06, 0.036],
    [-0.088, 0.053],
    [-0.106, 0.059],
    [-0.18, 0.059],
  ];
  const at = (z: number, r: number): V3[] => ring(8, r, 0, 0, 0, Math.PI / 8).map((p) => [p[0], p[2], z] as V3);
  const rings = prof.map(([z, r]) => at(z, r));
  const cols = ['#2e3036', '#383a42', '#3d4048', '#474a54', '#4d505a'];
  loft(b, rings, (s) => tone(cols[s], 0.12));
  poly(b, rings[0], tone('#1d1f23', 0.05), ID, [0, 0, 0]);
  const inner = at(-0.18, 0.047);
  const lens = at(-0.168, 0.047);
  loft(b, [rings[5], inner], '#5a5e68', 0.08);
  poly(b, lens, '#e6dfc0', ID, [0, 0, 0]);
  // Switch.
  block(b, 0.02, 0.012, 0.034, M(0.004, 0.04, -0.036), '#8a3a2a', 0.08);

  // Left hand from below-left: thumb lies along the top toward the switch.
  const grip = new THREE.Matrix4().makeBasis(new THREE.Vector3(-0.8, -0.6, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(-0.6, 0.8, 0)).setPosition(0, 0, 0.045);
  fist(b, grip, [0.43, -0.85, -0.3], 0.037, true);
  return b.build();
}

export function torchGeometry(): THREE.BufferGeometry {
  srand(19);
  const b = new Builder();
  // Crooked stick.
  limb(
    b,
    [
      [0.004, -0.25, 0],
      [-0.004, 0, 0.003],
      [0.003, 0.27, -0.002],
    ],
    [0.022, 0.021, 0.02],
    5,
    '#6b4a30',
    0.12,
  );
  // Rag head: charred wraps, a paler binding, a scorched crown under the flame.
  const head = [ring(6, 0.028, 0.235), ring(6, 0.05, 0.275, 0.003, 0, 0.3), ring(6, 0.053, 0.35, -0.003, 0.002, 0.55), ring(6, 0.036, 0.405, 0, 0, 0.8)];
  loft(b, head, (s) => tone(s === 0 ? '#6b5a48' : s === 1 ? '#2a1c16' : '#4a2219', 0.14));
  poly(b, head[3], tone(PALETTE.ember, 0.1, 0.8), ID, [0, 0, 0]);
  poly(b, head[0], tone('#2a1c16', 0.1), ID, [0, 1, 0]);
  // Left hand.
  fist(b, M(0, -0.12, 0, 0, 0, 0, -1, 1, 1), [0.2, -0.45, 0.87], 0.026);
  return b.build();
}

// ------------------------------------------------------------ landmarks

/** Ring of deadfall just outside the play disc: seen before it is touched. */
export function deadfallGeometry(radius: number): THREE.BufferGeometry {
  srand(4242);
  const b = new Builder();
  const n = 96;
  const dark = '#5a463b';
  const grey = '#8f8674';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rr(-0.03, 0.03);
    const r = radius + rr(0.25, 1.9);
    const len = rr(3.6, 6.6);
    const yaw = a + Math.PI / 2 + rr(-0.65, 0.65);
    const d: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
    const c: V3 = [Math.cos(a) * r, 0, Math.sin(a) * r];
    const lift = rr(0.15, 1.25);
    const butt: V3 = [c[0] - (d[0] * len) / 2, 0.14, c[2] - (d[2] * len) / 2];
    const tip: V3 = [c[0] + (d[0] * len) / 2, 0.1 + lift, c[2] + (d[2] * len) / 2];
    const pale = i % 4 === 0;
    const col = pale ? grey : dark;
    const rings = limb(b, [butt, mix3(butt, tip, 0.5), tip], [rr(0.23, 0.31), 0.19, 0.1], 5, col, 0.18, ID, rnd());
    poly(b, rings[0], tone(pale ? '#b5aa92' : '#8a7458', 0.1), ID, c);
    poly(b, rings[2], tone(col, 0.1, 0.8), ID, c);
    // Broken limbs standing off the trunk: the thing bristles.
    for (let k = 0; k < 2; k++) {
      const f = rr(0.25, 0.9);
      const p = mix3(butt, tip, f);
      const out = a + rr(-1.2, 1.2) + (k ? Math.PI : 0);
      spike(b, p, [p[0] + Math.cos(out) * rr(0.2, 0.8), p[1] + rr(0.6, 1.7), p[2] + Math.sin(out) * rr(0.2, 0.8)], 0.06, tone(col, 0.15, 0.85), 0.15);
    }
    // Every few trunks a dead spar still leans over the tangle.
    if (i % 6 === 2) {
      const lean = a + rr(-1.5, 1.5);
      const h = rr(2.6, 4.6);
      const foot: V3 = [Math.cos(a) * (r + 0.6), 0, Math.sin(a) * (r + 0.6)];
      const head: V3 = [foot[0] + Math.cos(lean) * h * 0.35, h, foot[2] + Math.sin(lean) * h * 0.35];
      limb(b, [foot, mix3(foot, head, 0.6), head], [0.17, 0.11, 0], 5, pale ? dark : '#5d4b40', 0.18, ID, rnd());
    }
  }
  return b.build();
}

/** Chalk-pale snapped trunk with its fallen top: the landmark of the west trail. */
export function whiteSnagGeometry(): THREE.BufferGeometry {
  srand(61);
  const b = new Builder();
  const pale = '#d6d0c2';
  const chalk = '#e8e3d6';
  const grey = '#b0aa9a';
  const n = 7;
  const paint = () => {
    const k = rnd();
    return k < 0.68 ? tone(pale, 0.07) : k < 0.9 ? tone(chalk, 0.05) : tone(grey, 0.08);
  };
  // Standing trunk, flared roots, leaning a touch.
  const rings = [ring(n, () => 0.44 * rr(0.95, 1.3), 0), ring(n, () => 0.4 * rr(0.95, 1.06), 0.32, 0.01), ring(n, () => 0.35 * rr(0.95, 1.05), 1.25, 0.04, -0.03, 0.2), ring(n, () => 0.31 * rr(0.94, 1.06), 2.15, 0.09, -0.05, 0.4)];
  loft(b, rings, paint);
  // Torn crown: one tall shard per face of the trunk.
  const top = rings[3];
  const tc = centroid(top);
  poly(b, top, tone('#8d8778', 0.08), ID, [tc[0], 0, tc[2]]);
  for (let j = 0; j < n; j++) {
    const p = top[j];
    const q = top[(j + 1) % n];
    const inner = mix3(mix3(p, q, 0.5), tc, 0.62);
    const apex = mix3(mix3(p, q, rr(0.2, 0.8)), tc, rr(0.05, 0.3));
    apex[1] += j % 3 === 0 ? rr(0.9, 1.35) : rr(0.3, 0.8);
    const base: V3 = [(p[0] + q[0] + inner[0]) / 3, tc[1] - 0.2, (p[2] + q[2] + inner[2]) / 3];
    tris(b, [p, q, apex], paint(), ID, base);
    tris(b, [q, inner, apex], tone(grey, 0.08), ID, base);
    tris(b, [inner, p, apex], tone(pale, 0.06, 0.92), ID, base);
  }
  // A couple of snapped branch stubs.
  for (const [y, a, len] of [
    [1.5, 2.6, 0.5],
    [1.95, 5.2, 0.38],
  ]) {
    const p0: V3 = [Math.cos(a) * 0.22, y, Math.sin(a) * 0.22];
    const p1: V3 = [Math.cos(a) * (0.3 + len), y + len * 0.5, Math.sin(a) * (0.3 + len)];
    const r = limb(b, [p0, p1], [0.075, 0.05], 4, pale, 0.08, ID, rnd());
    poly(b, r[1], tone(grey, 0.08), ID, p0);
  }

  // The fallen top: break end propped near the stump, crown end on the ground.
  const l0: V3 = [0.62, 0.52, 0.42];
  const l1: V3 = [2.1, 0.3, 1.05];
  const l2: V3 = [3.55, 0.2, 1.5];
  const log = limb(b, [l0, l1, l2], [0.3, 0.27, 0.2], n, paint, 0, ID, 0.2);
  poly(b, log[2], tone(grey, 0.08), ID, l1);
  poly(b, log[0], tone('#8d8778', 0.08), ID, l1);
  const back = unit(sub(l0, l1));
  for (let j = 0; j < n; j += 2) {
    const p = log[0][j];
    const q = log[0][(j + 1) % n];
    const tip = add(mix3(mix3(p, q, 0.5), l0, 0.2), mul(back, rr(0.35, 0.8)));
    tris(b, [p, q, tip, p, tip, l0, q, l0, tip], paint(), ID, add(l0, mul(back, 0.05)));
  }
  for (const [f, a, len] of [
    [0.35, 0.3, 0.55],
    [0.7, -0.5, 0.42],
  ]) {
    const p0 = f < 0.5 ? mix3(l0, l1, f * 2) : mix3(l1, l2, f * 2 - 1);
    const p1: V3 = [p0[0] + Math.sin(a) * 0.2, p0[1] + len, p0[2] - Math.cos(a) * len * 0.5];
    const r = limb(b, [p0, p1], [0.07, 0.045], 4, pale, 0.08, ID, rnd());
    poly(b, r[1], tone(grey, 0.08), ID, p0);
  }
  // A second, smaller length and loose shards between the two.
  const s0: V3 = [0.45, 0.16, -0.75];
  const s1: V3 = [1.95, 0.13, -1.25];
  const small = limb(b, [s0, s1], [0.15, 0.11], 6, paint, 0, ID, 0.4);
  poly(b, small[0], tone('#8d8778', 0.08), ID, s1);
  poly(b, small[1], tone(grey, 0.08), ID, s0);
  for (let i = 0; i < 6; i++) {
    const p: V3 = [rr(0.5, 1.5), 0.03, rr(-0.5, 0.9)];
    const a = rnd() * TAU;
    const len = rr(0.22, 0.5);
    spike(b, p, [p[0] + Math.cos(a) * len, 0.06, p[2] + Math.sin(a) * len], rr(0.05, 0.08), tone(chalk, 0.08));
  }
  return b.build();
}
