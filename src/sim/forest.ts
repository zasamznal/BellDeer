// ForestGen + NavGrid. The clearing follows reference 02: campfire in the
// centre, workbench 2 m away, three diverging trails joined by a ring trail,
// landmarks (white snag, split boulder, tag posts) and resource arcs.
// Everything is circles on a plane: cheap to collide with and to ray-test.

import { Rng, hashSeed } from './rng';
import { GEN_VERSION, RULES } from './rules';

export interface V2 {
  x: number;
  z: number;
}

export interface Obstacle extends V2 {
  r: number;
  /** Blocks line of sight (trunks, big rocks). */
  sight: boolean;
  kind: 'tree' | 'rock' | 'snag' | 'fire' | 'bench' | 'post' | 'landmark';
}

export interface TreeDef extends V2 {
  r: number;
  h: number;
  variant: number;
  rot: number;
}
export interface RockDef extends V2 {
  r: number;
  h: number;
  rot: number;
  seed: number;
}
export interface NodeDef extends V2 {
  id: number;
  rot: number;
}

export interface Forest {
  seed: number;
  genVersion: number;
  template: boolean;
  trees: TreeDef[];
  rocks: RockDef[];
  snags: NodeDef[];
  scrap: NodeDef[];
  bushes: NodeDef[];
  posts: NodeDef[];
  whiteSnag: V2;
  boulder: V2;
  bench: V2;
  spawn: { x: number; z: number; yaw: number };
  paths: V2[][];
  trailMarks: V2[];
  obstacles: Obstacle[];
  nav: NavGrid;
}

const TAU = Math.PI * 2;
export const dist = (a: V2, b: V2) => Math.hypot(a.x - b.x, a.z - b.z);
const polar = (ang: number, r: number): V2 => ({ x: Math.cos(ang) * r, z: Math.sin(ang) * r });

function distToSegment(p: V2, a: V2, b: V2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2));
  return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t));
}

export function distToPaths(p: V2, paths: V2[][]): number {
  let best = Infinity;
  for (const path of paths)
    for (let i = 0; i + 1 < path.length; i++) best = Math.min(best, distToSegment(p, path[i], path[i + 1]));
  return best;
}

/** True when the segment a→b is not blocked by a sight-blocking obstacle. */
export function lineOfSight(obstacles: Obstacle[], a: V2, b: V2, pad = 0): boolean {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz;
  if (l2 < 1e-6) return true;
  for (const o of obstacles) {
    if (!o.sight) continue;
    const t = ((o.x - a.x) * dx + (o.z - a.z) * dz) / l2;
    if (t <= 0.02 || t >= 0.98) continue;
    const px = a.x + dx * t - o.x;
    const pz = a.z + dz * t - o.z;
    const r = o.r + pad;
    if (px * px + pz * pz < r * r) return false;
  }
  return true;
}

/** Distance along a ray to the first obstacle (any kind), or maxDist. */
export function rayObstacles(obstacles: Obstacle[], o: V2, dir: V2, maxDist: number): number {
  let best = maxDist;
  for (const c of obstacles) {
    const mx = o.x - c.x;
    const mz = o.z - c.z;
    const b = mx * dir.x + mz * dir.z;
    const cc = mx * mx + mz * mz - c.r * c.r;
    if (cc > 0 && b > 0) continue;
    const disc = b * b - cc;
    if (disc < 0) continue;
    const t = -b - Math.sqrt(disc);
    if (t >= 0 && t < best) best = t;
  }
  return best;
}

/** Push a circle out of all obstacles and keep it inside the play disc. */
export function resolveCircle(obstacles: Obstacle[], p: V2, radius: number, worldR: number): void {
  for (let pass = 0; pass < 2; pass++) {
    for (const o of obstacles) {
      const dx = p.x - o.x;
      const dz = p.z - o.z;
      const min = o.r + radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || 1e-4;
        p.x = o.x + (dx / d) * min;
        p.z = o.z + (dz / d) * min;
      }
    }
  }
  const d = Math.hypot(p.x, p.z);
  if (d > worldR) {
    p.x *= worldR / d;
    p.z *= worldR / d;
  }
}

// ---------------------------------------------------------------- NavGrid

export class NavGrid {
  readonly half = 38;
  readonly size = 76;
  readonly blocked: Uint8Array;
  private g: Float32Array;
  private from: Int32Array;
  private closed: Uint8Array;

  constructor(obstacles: Obstacle[], agentRadius: number, worldR: number) {
    const n = this.size * this.size;
    this.blocked = new Uint8Array(n);
    this.g = new Float32Array(n);
    this.from = new Int32Array(n);
    this.closed = new Uint8Array(n);
    for (let j = 0; j < this.size; j++)
      for (let i = 0; i < this.size; i++) {
        const x = i - this.half + 0.5;
        const z = j - this.half + 0.5;
        let b = Math.hypot(x, z) > worldR - 0.5 ? 1 : 0;
        if (!b)
          for (const o of obstacles) {
            const r = o.r + agentRadius;
            const dx = x - o.x;
            const dz = z - o.z;
            if (dx * dx + dz * dz < r * r) {
              b = 1;
              break;
            }
          }
        this.blocked[j * this.size + i] = b;
      }
  }

  cell(p: V2): number {
    const i = Math.max(0, Math.min(this.size - 1, Math.floor(p.x + this.half)));
    const j = Math.max(0, Math.min(this.size - 1, Math.floor(p.z + this.half)));
    return j * this.size + i;
  }
  center(c: number): V2 {
    return { x: (c % this.size) - this.half + 0.5, z: Math.floor(c / this.size) - this.half + 0.5 };
  }
  walkable(p: V2): boolean {
    return !this.blocked[this.cell(p)];
  }

  /** Nearest free cell to p (ring search), -1 if none within 6 m. */
  nearestFree(p: V2): number {
    const c = this.cell(p);
    if (!this.blocked[c]) return c;
    const ci = c % this.size;
    const cj = Math.floor(c / this.size);
    let best = -1;
    let bestD = Infinity;
    for (let r = 1; r <= 6 && best < 0; r++)
      for (let j = cj - r; j <= cj + r; j++)
        for (let i = ci - r; i <= ci + r; i++) {
          if (i < 0 || j < 0 || i >= this.size || j >= this.size) continue;
          const k = j * this.size + i;
          if (this.blocked[k]) continue;
          const q = this.center(k);
          const d = dist(p, q);
          if (d < bestD) {
            bestD = d;
            best = k;
          }
        }
    return best;
  }

  /**
   * A* on the 1 m grid, 8-connected without corner cutting. Returns waypoints (world) or null.
   * `avoidR` > 0 also keeps the path out of a disc of that radius around the fire (the bright circle).
   */
  findPath(a: V2, b: V2, avoidR = 0): V2[] | null {
    const start = this.nearestFree(a);
    const goal = this.nearestFree(b);
    if (start < 0 || goal < 0) return null;
    if (start === goal) return [{ x: b.x, z: b.z }];
    const S = this.size;
    this.g.fill(Infinity);
    this.closed.fill(0);
    const open: number[] = [start];
    const f: number[] = [0];
    this.g[start] = 0;
    this.from[start] = -1;
    const gi = goal % S;
    const gj = Math.floor(goal / S);
    const h = (c: number) => {
      const dx = Math.abs((c % S) - gi);
      const dz = Math.abs(Math.floor(c / S) - gj);
      return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz);
    };
    let guard = 0;
    while (open.length && guard++ < 6000) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (f[k] < f[bi]) bi = k;
      const cur = open[bi];
      open[bi] = open[open.length - 1];
      f[bi] = f[f.length - 1];
      open.pop();
      f.pop();
      if (cur === goal) break;
      if (this.closed[cur]) continue;
      this.closed[cur] = 1;
      const ci = cur % S;
      const cj = Math.floor(cur / S);
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = ci + di;
          const nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= S || nj >= S) continue;
          const nk = nj * S + ni;
          if (this.blocked[nk] || this.closed[nk]) continue;
          if (di && dj && (this.blocked[cj * S + ni] || this.blocked[nj * S + ci])) continue;
          if (avoidR > 0 && nk !== goal && Math.hypot(ni - this.half + 0.5, nj - this.half + 0.5) < avoidR) continue;
          const ng = this.g[cur] + (di && dj ? 1.4142 : 1);
          if (ng < this.g[nk]) {
            this.g[nk] = ng;
            this.from[nk] = cur;
            open.push(nk);
            f.push(ng + h(nk));
          }
        }
    }
    if (this.g[goal] === Infinity) return null;
    const cells: number[] = [];
    for (let c = goal; c !== -1 && c !== start; c = this.from[c]) cells.push(c);
    cells.reverse();
    const pts = cells.map((c) => this.center(c));
    pts[pts.length - 1] = this.walkable(b) ? { x: b.x, z: b.z } : pts[pts.length - 1];
    // String pulling: drop waypoints that a straight walkable segment can skip.
    const out: V2[] = [];
    let anchor: V2 = a;
    let i = 0;
    while (i < pts.length) {
      let far = i;
      for (let k = pts.length - 1; k > i; k--)
        if (this.segmentFree(anchor, pts[k], avoidR)) {
          far = k;
          break;
        }
      out.push(pts[far]);
      anchor = pts[far];
      i = far + 1;
    }
    return out;
  }

  segmentFree(a: V2, b: V2, avoidR = 0): boolean {
    const d = dist(a, b);
    const steps = Math.ceil(d / 0.4);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      if (this.blocked[this.cell({ x, z })]) return false;
      if (avoidR > 0 && s < steps && Math.hypot(x, z) < avoidR) return false;
    }
    return true;
  }

  pathLength(a: V2, b: V2): number {
    const p = this.findPath(a, b);
    if (!p) return Infinity;
    let len = 0;
    let prev = a;
    for (const q of p) {
      len += dist(prev, q);
      prev = q;
    }
    return len;
  }
}

// ---------------------------------------------------------------- ForestGen

interface Slot {
  ang: number;
  r: number;
}

// Template slots (angle in degrees, 0° = east/+x, 90° = south/+z; north is −z).
const T = {
  snags: [
    { ang: 158, r: 7.4 }, // start snag, already notched
    { ang: 196, r: 9.4 },
    { ang: 318, r: 8.6 },
    { ang: 62, r: 13.5 },
    { ang: 232, r: 17.5 },
    { ang: 288, r: 18.5 },
  ],
  scrap: [
    { ang: 176, r: 14.2 },
    { ang: 28, r: 19.5 },
    { ang: 262, r: 23 },
    { ang: 105, r: 21 },
  ],
  bushes: [
    { ang: 132, r: 11.5 },
    { ang: 338, r: 13.5 },
    { ang: 216, r: 21 },
  ],
  posts: [
    { ang: 12, r: 15.2 }, // east post, the one in the approved frame
    { ang: 300, r: 16.4 },
    { ang: 118, r: 15.6 },
  ],
  whiteSnag: { ang: 186, r: 11.6 },
  boulder: { ang: 268, r: 12.2 },
};
const SPOKES = [186, 268, 12, 118]; // west, north, east + a southern cross-link
const RING_R = 15.6;

function buildPaths(rng: Rng | null): V2[][] {
  const paths: V2[][] = [];
  const wob = (k: number) => (rng ? rng.range(-0.5, 0.5) : Math.sin(k * 2.1) * 0.3);
  SPOKES.forEach((deg, s) => {
    const a = (deg * Math.PI) / 180;
    const p: V2[] = [];
    const outer = s < 3 ? 27 : RING_R;
    for (let r = 4; r <= outer; r += 3) p.push(polar(a + (wob(s * 9 + r) * 0.5) / Math.max(r, 6), r));
    paths.push(p);
  });
  const ring: V2[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * TAU;
    ring.push(polar(a, RING_R + Math.sin(a * 3 + 0.7) * 1.1));
  }
  paths.push(ring);
  return paths;
}

function generate(seed: number, jitter: boolean): Forest | null {
  const rng = new Rng(hashSeed(seed, 'forest'));
  const j = (s: Slot, da = 7, dr = 1.2): V2 => {
    const a = ((s.ang + (jitter ? rng.range(-da, da) : 0)) * Math.PI) / 180;
    return polar(a, s.r + (jitter ? rng.range(-dr, dr) : 0));
  };
  const paths = buildPaths(jitter ? rng : null);
  const node = (s: Slot, id: number, da?: number, dr?: number): NodeDef => ({ ...j(s, da, dr), id, rot: rng.range(0, TAU) });

  const snags = T.snags.map((s, i) => node(s, i, i === 0 ? 3 : 7, i === 0 ? 0.4 : 1.2));
  const scrap = T.scrap.map((s, i) => node(s, i));
  const bushes = T.bushes.map((s, i) => node(s, i));
  // Posts stay inside the 14–17 m band the night caches rely on.
  const posts = T.posts.map((s, i) => {
    const p = node(s, i, 5, 0.8);
    const d = Math.hypot(p.x, p.z);
    const c = Math.max(14.2, Math.min(16.8, d)) / d;
    return { ...p, x: p.x * c, z: p.z * c };
  });
  const whiteSnag = j(T.whiteSnag, 3, 0.6);
  const boulder = j(T.boulder, 3, 0.6);
  const bench: V2 = { x: 2, z: 0.25 };

  const obstacles: Obstacle[] = [
    { x: 0, z: 0, r: 0.85, sight: false, kind: 'fire' },
    { ...bench, r: 0.6, sight: false, kind: 'bench' },
    { ...whiteSnag, r: 0.55, sight: true, kind: 'landmark' },
  ];
  // Split boulder: two halves with a walkable crack between them.
  const ba = Math.atan2(boulder.z, boulder.x) + Math.PI / 2;
  const rocks: RockDef[] = [
    { x: boulder.x + Math.cos(ba) * 1.55, z: boulder.z + Math.sin(ba) * 1.55, r: 1.15, h: 2.3, rot: ba, seed: 11 },
    { x: boulder.x - Math.cos(ba) * 1.55, z: boulder.z - Math.sin(ba) * 1.55, r: 1.15, h: 2.0, rot: ba + 2.6, seed: 12 },
  ];
  for (const s of snags) obstacles.push({ x: s.x, z: s.z, r: 0.32, sight: true, kind: 'snag' });
  for (const p of posts) obstacles.push({ x: p.x, z: p.z, r: 0.2, sight: false, kind: 'post' });

  const keepOut: { p: V2; r: number }[] = [
    { p: { x: 0, z: 0 }, r: 6.8 },
    ...snags.map((p) => ({ p, r: 2.2 })),
    ...scrap.map((p) => ({ p, r: 2 })),
    ...bushes.map((p) => ({ p, r: 1.8 })),
    ...posts.map((p) => ({ p, r: 2.6 })),
    { p: whiteSnag, r: 3.2 },
    { p: boulder, r: 3.6 },
  ];
  const free = (p: V2, pad: number) =>
    keepOut.every((k) => dist(p, k.p) > k.r + pad) && distToPaths(p, paths) > 1.7 + pad;

  // Scatter rocks, then trees (dart throwing with a minimum spacing).
  const placed: { p: V2; r: number }[] = rocks.map((r) => ({ p: r, r: r.r }));
  for (let tries = 0; tries < 400 && rocks.length < 20; tries++) {
    const p = polar(rng.range(0, TAU), rng.range(7.5, 34));
    const r = rng.range(0.7, 1.5);
    if (!free(p, r - 0.4) || placed.some((q) => dist(p, q.p) < q.r + r + 1.6)) continue;
    rocks.push({ ...p, r, h: r * rng.range(0.9, 1.5), rot: rng.range(0, TAU), seed: rng.int(1000) });
    placed.push({ p, r });
  }
  for (const r of rocks) obstacles.push({ x: r.x, z: r.z, r: r.r * 0.86, sight: r.r >= 1, kind: 'rock' });

  const trees: TreeDef[] = [];
  for (let tries = 0; tries < 5200 && trees.length < 250; tries++) {
    const rr = Math.sqrt(rng.range(7.2 * 7.2, 50 * 50));
    const p = polar(rng.range(0, TAU), rr);
    const inside = rr <= RULES.world.radius;
    if (inside && !free(p, 0)) continue;
    // Keep the three long spokes open as view corridors past the play disc.
    if (!inside && distToPaths(p, paths.slice(0, 3)) < 1.6) continue;
    const spacing = inside ? 3.3 : 2.6;
    if (placed.some((q) => dist(p, q.p) < q.r + spacing)) continue;
    const big = rng.next();
    const t: TreeDef = { ...p, r: 0.3 + big * 0.22, h: 7.5 + big * 6 + rng.range(-1, 1), variant: rng.int(3), rot: rng.range(0, TAU) };
    trees.push(t);
    placed.push({ p, r: t.r });
    if (inside) obstacles.push({ x: t.x, z: t.z, r: t.r, sight: true, kind: 'tree' });
  }

  const nav = new NavGrid(obstacles, RULES.deer.radius, RULES.world.radius - 0.5);

  // Spawn one step from the notched snag with the fire behind the right shoulder.
  const s0 = snags[0];
  const toFire = Math.atan2(-s0.z, -s0.x);
  let spawn = { x: 0, z: 0, yaw: 0 };
  for (const off of [-0.95, 0.95, -0.6, 0.6]) {
    const p = { x: s0.x + Math.cos(toFire + off) * 1.45, z: s0.z + Math.sin(toFire + off) * 1.45 };
    const fx = s0.x - p.x;
    const fz = s0.z - p.z; // facing the snag
    const cross = fx * -p.z - fz * -p.x; // >0: fire is to the right in x-east / z-south
    spawn = { ...p, yaw: Math.atan2(-fx, -fz) };
    if (cross > 0 && nav.walkable(p)) break;
  }

  // Marked trail points 9–12 m from the fire (E02 auto trap).
  const trailMarks: V2[] = [];
  for (const path of paths.slice(0, 4))
    for (const p of path) {
      const d = Math.hypot(p.x, p.z);
      if (d >= 9 && d <= 12) trailMarks.push(p);
    }

  const forest: Forest = {
    seed,
    genVersion: GEN_VERSION,
    template: !jitter,
    trees,
    rocks,
    snags,
    scrap,
    bushes,
    posts,
    whiteSnag,
    boulder,
    bench,
    spawn,
    paths,
    trailMarks,
    obstacles,
    nav,
  };
  return validate(forest) ? forest : null;
}

/** Connectivity + first-day route check from the GDD (≤ 60 m: fire → two snags → scrap → fire). */
export function validate(f: Forest): boolean {
  const fire = { x: 1.6, z: -1.2 };
  const { nav } = f;
  if (!nav.walkable(f.spawn)) return false;
  const targets = [...f.snags, ...f.scrap, ...f.bushes, ...f.posts];
  for (const t of targets) if (nav.pathLength(fire, t) > 80) return false;
  if (f.posts.some((p) => Math.hypot(p.x, p.z) < 14 || Math.hypot(p.x, p.z) > 17)) return false;
  return firstDayRoute(f) <= 60;
}

export function firstDayRoute(f: Forest): number {
  const fire = { x: 1.6, z: -1.2 };
  const { nav } = f;
  let best = Infinity;
  for (const sc of f.scrap) {
    const len =
      nav.pathLength(fire, f.snags[0]) + nav.pathLength(f.snags[0], f.snags[1]) + nav.pathLength(f.snags[1], sc) + nav.pathLength(sc, fire);
    best = Math.min(best, len);
  }
  return best;
}

export function generateForest(seed: number): Forest {
  return generate(seed, true) ?? generate(seed, false) ?? generate(1, false)!;
}
