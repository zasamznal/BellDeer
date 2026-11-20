// [ideas] View side of the gameplay additions. SceneView owns one IdeasView and
// calls `update` right before it renders; everything drawn here is built from
// the simulation state, so nothing needs to be told when a run is loaded.
//
//   2  night omens  — the end of the night fog moves (thick fog 20 m, clear moon 34 m)
//   3  tracks       — claw / hoof marks on the ground and a pale gash on the nearest trunk
//   4  resin pine   — amber streaks on today's three-log pine, with a slow glint
//   5  tin lure     — the tin lies where it landed for a few seconds
//   7  bell night   — rust-amber tint of fog, sky band and moon

import * as THREE from 'three';
import type { Forest } from '../sim/forest';
import { IDEAS } from '../sim/rules';
import type { IdeasState, SimEvent } from '../sim/types';
import type { World } from '../sim/world';
import { Builder, M, rnd, rr, srand } from './geo';

/** What SceneView hands over each frame (its own objects; values are re-set by it every frame). */
export interface IdeasEnv {
  scene: THREE.Scene;
  fog: THREE.Fog;
  moon: THREE.Mesh;
  sky: THREE.ShaderMaterial;
  hemi: THREE.HemisphereLight;
  /** 0 by day … 1 at night, as SceneView blends it. */
  night: number;
  title: boolean;
}

const NIGHT_FOG_FAR = 27; // SKY.night.far in sceneView.ts
const RUST = new THREE.Color('#7d4a1e');
const RUST_BAND = new THREE.Color('#b5672a');
const RUST_TOP = new THREE.Color('#1e1008');
const RUST_LIGHT = new THREE.Color('#c08a5a');
const RUST_MOON = new THREE.Color('#e9903a');
const MOON = new THREE.Color('#c9d6e6');
const MOON_CLEAR = new THREE.Color('#f2f6ff');
const ease = (cur: number, to: number, dt: number, rate: number) => cur + (to - cur) * (1 - Math.exp(-dt * rate));

export class IdeasView {
  private group = new THREE.Group();
  private attached = false;
  private time = 0;

  private tracks: THREE.Mesh;
  private tracksKey = '';
  private resin: THREE.Mesh;
  private resinMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: '#c9781c', emissiveIntensity: 0.5 });
  private glint: THREE.Points;
  private resinKey = '';
  private tin: THREE.Mesh;
  private tinT = 0;

  private farShift = 0;
  private bell = 0;
  private clear = 0;
  private thick = 0;

  constructor() {
    const flat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    this.tracks = new THREE.Mesh(new THREE.BufferGeometry(), flat);
    this.resin = new THREE.Mesh(new THREE.BufferGeometry(), this.resinMat);
    this.glint = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({ color: '#ffe0a0', size: 6, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    const can = new THREE.CylinderGeometry(0.065, 0.065, 0.16, 8);
    can.rotateZ(Math.PI / 2);
    this.tin = new THREE.Mesh(can, new THREE.MeshLambertMaterial({ color: '#c3d0d9', emissive: '#4a5c6c', flatShading: true }));
    for (const o of [this.tracks, this.resin, this.glint, this.tin]) {
      o.visible = false;
      this.group.add(o);
    }
  }

  onEvent(e: SimEvent): void {
    if (e.type === 'lure') {
      this.tin.position.set(e.x, 0.075, e.z);
      this.tin.rotation.y = Math.random() * 6.283;
      this.tinT = 7;
    }
  }

  update(w: World, dt: number, env: IdeasEnv): void {
    if (!this.attached) {
      env.scene.add(this.group);
      this.attached = true;
    }
    this.time += dt;
    const t = this.time;
    const s = w.state;
    const I: IdeasState | undefined = s.ideas;
    if (!I) return;

    // --- 3. tracks (rebuilt when the day's spot changes)
    const tr = IDEAS.tracks ? I.tracks : null;
    const tKey = tr ? `${w.forest.seed}|${s.night}|${tr.x.toFixed(2)}|${tr.z.toFixed(2)}` : '';
    if (tKey !== this.tracksKey) {
      this.tracksKey = tKey;
      this.tracks.geometry.dispose();
      this.tracks.geometry = tr ? buildTracks(w.forest, tr, s.night) : new THREE.BufferGeometry();
    }
    this.tracks.visible = !!tr && !env.title;

    // --- 4. resin pine
    const ri = IDEAS.resinPine ? I.resinSnag : -1;
    const snag = ri >= 0 ? w.forest.snags[ri] : undefined;
    const rKey = snag ? `${w.forest.seed}|${s.night}|${ri}` : '';
    if (rKey !== this.resinKey) {
      this.resinKey = rKey;
      this.resin.geometry.dispose();
      this.glint.geometry.dispose();
      if (snag) {
        const built = buildResin(w.forest.seed + ri * 31 + s.night);
        this.resin.geometry = built.mesh;
        this.glint.geometry = built.glints;
        // Same placement as the trunk in SceneView.setForest: +Z looks at the fire (snag 0 at the spawn).
        const tx = ri === 0 ? w.forest.spawn.x : 0;
        const tz = ri === 0 ? w.forest.spawn.z : 0;
        const rot = Math.atan2(tx - snag.x, tz - snag.z);
        for (const o of [this.resin, this.glint]) {
          o.position.set(snag.x, 0, snag.z);
          o.rotation.y = rot;
        }
      } else {
        this.resin.geometry = new THREE.BufferGeometry();
        this.glint.geometry = new THREE.BufferGeometry();
      }
    }
    const standing = !!snag && s.snagLogs[ri] > 0 && !env.title;
    this.resin.visible = standing;
    this.glint.visible = standing;
    if (standing) {
      // The streaks "catch the light": a slow shimmer by day, a faint glow at night.
      const day = 1 - env.night;
      this.resinMat.emissiveIntensity = (0.3 + 0.28 * (0.5 + 0.5 * Math.sin(t * 2.1))) * (0.3 + 0.7 * day);
      (this.glint.material as THREE.PointsMaterial).opacity = Math.max(0, Math.sin(t * 1.6)) ** 3 * (0.15 + 0.85 * day);
    }

    // --- 5. the thrown tin
    if (this.tinT > 0) {
      this.tinT -= dt;
      const age = 7 - this.tinT;
      this.tin.visible = this.tinT > 0;
      this.tin.position.y = 0.075 + Math.abs(Math.sin(age * 11)) * 0.28 * Math.max(0, 1 - age / 0.7);
      this.tin.rotation.x = Math.max(0, 1 - age / 0.7) * age * 14;
    } else this.tin.visible = false;

    // --- 2 + 7. omen look. Before the dusk tick the omen is 'calm', so the change fades in with the night.
    const omen = env.title ? 'calm' : I.omen;
    const O = IDEAS.omen;
    const wantFar = omen === 'fog' ? O.fogViewFar - NIGHT_FOG_FAR : omen === 'moon' ? O.moonViewFar - NIGHT_FOG_FAR : 0;
    this.farShift = ease(this.farShift, wantFar * env.night, dt, 1.4);
    this.bell = ease(this.bell, omen === 'bell' ? env.night : 0, dt, 1.4);
    this.clear = ease(this.clear, omen === 'moon' ? env.night : 0, dt, 1.4);
    this.thick = ease(this.thick, omen === 'fog' ? env.night : 0, dt, 1.4);
    env.fog.far = Math.max(env.fog.near + 4, env.fog.far + this.farShift);

    const moonMat = env.moon.material as THREE.MeshBasicMaterial;
    moonMat.color.copy(MOON).lerp(MOON_CLEAR, this.clear).lerp(RUST_MOON, this.bell);
    moonMat.opacity *= 1 - 0.7 * this.thick;
    env.moon.scale.setScalar(1 + 0.18 * this.clear + 0.1 * this.bell);
    if (this.bell > 0.002) {
      const k = this.bell;
      env.fog.color.lerp(RUST, 0.64 * k);
      const u = env.sky.uniforms;
      (u.uFog.value as THREE.Color).lerp(RUST, 0.64 * k);
      (u.uHorizon.value as THREE.Color).lerp(RUST_BAND, 0.62 * k);
      (u.uTop.value as THREE.Color).lerp(RUST_TOP, 0.7 * k);
      env.hemi.color.lerp(RUST_LIGHT, 0.45 * k);
    }
  }
}

// ------------------------------------------------------------ geometry

/** 4–6 scraped marks in a line toward the fire and three pale slashes on the nearest trunk. One draw call. */
function buildTracks(f: Forest, tr: { angle: number; x: number; z: number }, night: number): THREE.BufferGeometry {
  srand((f.seed * 31 + night * 977 + 5) >>> 0);
  const b = new Builder();
  const dx = -Math.cos(tr.angle); // toward the fire: the way it will walk tonight
  const dz = -Math.sin(tr.angle);
  const heading = Math.atan2(dx, dz);
  const n = 4 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const along = (i - (n - 1) / 2) * 1.15 + rr(-0.15, 0.15);
    const side = (i % 2 ? 1 : -1) * 0.32 + rr(-0.08, 0.08);
    const x = tr.x + dx * along - dz * side;
    const z = tr.z + dz * along + dx * side;
    const yaw = heading + rr(-0.22, 0.22);
    const at = (lx: number, y: number, lz: number, ry = 0, sx = 1, sy = 1, sz = 1) =>
      M(x + Math.cos(yaw) * lx + Math.sin(yaw) * lz, y, z - Math.sin(yaw) * lx + Math.cos(yaw) * lz, 0, yaw + ry, 0, sx, sy, sz);
    // Churned earth: a low dark slab that stays above the uneven ground.
    b.add(new THREE.CylinderGeometry(0.4, 0.5, 0.06, 7), at(0, 0.058, 0, rr(0, 1), rr(0.85, 1.1), 1, rr(1.4, 1.7)), '#2c2524', 0.14);
    // Three claw furrows dragged back from the print, pale where the soil and roots are torn open.
    for (let c = -1; c <= 1; c++) {
      const len = rr(0.5, 0.78);
      b.box(0.05, 0.024, len, at(c * 0.12, 0.098, -0.12 - len * 0.2, c * 0.13 + rr(-0.04, 0.04)), c === 0 ? '#c4a57a' : '#aa8c66', 0.1);
    }
    // The cloven print at the head of the scrape.
    for (const sgn of [-1, 1]) b.box(0.085, 0.03, 0.2, at(sgn * 0.062, 0.1, 0.42, sgn * 0.2), '#100e12', 0.08);
    for (let c = 0; c < 3; c++) {
      const a = rr(0, 6.283);
      b.add(new THREE.TetrahedronGeometry(rr(0.06, 0.11), 0), at(Math.cos(a) * 0.5, 0.07, Math.sin(a) * 0.72, rr(0, 3)), '#3b302c', 0.15);
    }
  }

  // The gash: on the nearest trunk, turned toward the fire and the marks so it is met on the way there.
  let tree = null as Forest['trees'][number] | null;
  let best = 7;
  for (const t of f.trees) {
    const d = Math.hypot(t.x - tr.x, t.z - tr.z);
    if (d < best) {
      best = d;
      tree = t;
    }
  }
  if (tree) {
    const r0 = Math.hypot(tree.x, tree.z) || 1;
    const sd = best || 1;
    const fx = (-tree.x / r0) * 0.6 + ((tr.x - tree.x) / sd) * 0.4;
    const fz = (-tree.z / r0) * 0.6 + ((tr.z - tree.z) / sd) * 0.4;
    const face = Math.atan2(fx, fz);
    const R = tree.r * 0.72; // trunk radius at chest height (the fir tapers from 0.95 r at the foot)
    const base = new THREE.Matrix4().makeTranslation(tree.x, 0, tree.z).multiply(new THREE.Matrix4().makeRotationY(face));
    for (let c = -1; c <= 1; c++) {
      const h = rr(0.75, 0.95);
      const m = base.clone().multiply(M(c * 0.095, 1.55 + c * 0.07, R, 0, 0, 0.3));
      b.box(0.06, h, 0.07, m, c === 0 ? '#e2c592' : '#d2b27f', 0.07);
      // Splinters hanging at the lower end of each slash.
      b.add(new THREE.TetrahedronGeometry(0.05, 0), base.clone().multiply(M(c * 0.095 + 0.14, 1.55 + c * 0.07 - h * 0.5, R + 0.02, 0.4, 0, 0.3)), '#c9a573', 0.1);
    }
  }
  return b.build();
}

/** Amber runs and drips on a dead pine (origin at its foot, +Z toward the fire) plus a few glint points. */
function buildResin(seed: number): { mesh: THREE.BufferGeometry; glints: THREE.BufferGeometry } {
  srand((seed * 131 + 17) >>> 0);
  const b = new Builder();
  const radius = (y: number) => 0.3 - 0.036 * y; // the trunk of props.snagGeometry
  const glints: number[] = [];
  const run = (a: number, y0: number, len: number, wide: number, col: string) => {
    const y = y0 + len / 2;
    const r = radius(y) + 0.004;
    b.box(wide, len, 0.055, M(Math.sin(a) * r, y, Math.cos(a) * r, -0.036, a, rr(-0.05, 0.05)), col, 0.1);
    // A bead where the run stops.
    const rb = radius(y0) + 0.03;
    b.add(new THREE.OctahedronGeometry(wide * 0.62, 0), M(Math.sin(a) * rb, y0 - 0.02, Math.cos(a) * rb, 0, a, 0, 1, 1.5, 1), '#ffd27a', 0.06);
    glints.push(Math.sin(a) * (rb + 0.05), y0 + len * rr(0.1, 0.9), Math.cos(a) * (rb + 0.05));
  };
  // The big bleed above the notch, on the side of the fire, and runs right round the trunk.
  run(rr(-0.15, 0.15), 1.62, 1.05, 0.2, '#f0a93c');
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = 0.7 + (i / (n - 1)) * (6.283 - 1.4) + rr(-0.2, 0.2);
    run(a, rr(0.55, 1.7), rr(0.7, 1.4), rr(0.09, 0.14), i % 2 ? '#e9a23b' : '#d98a2a');
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(glints, 3));
  return { mesh: b.build(), glints: g };
}
