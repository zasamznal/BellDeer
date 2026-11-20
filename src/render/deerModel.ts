// The Bell-stag (reference 04): a 2.7 m biped of charred boards with an open
// rectangular chest, a single hanging bronze bell, an eyeless wedge head and
// branching antlers. One skeleton of rigid parts, animated procedurally.
//
// Draw calls: one mesh per bone, 14 in total. Stage parts are appended to the
// end of their bone's geometry in stage order and revealed with the draw range,
// so later silhouettes cost no extra meshes.

import * as THREE from 'three';
import { Builder, M, rr, srand } from './geo';

const WOOD = '#3a2d2b';
const WOOD_LIGHT = '#57402f';
const WOOD_EDGE = '#6a4a33';
const CHAR = '#241d1f';
const BONE = '#d9d2c4';
const BRONZE = '#c98a3a';
const BRONZE_LIGHT = '#e0a850';
const BRONZE_DARK = '#7c4f22';

export interface DeerPose {
  walk: number; // gait phase, radians
  gait: number; // 0 standing … 1 running
  crouch: number; // 0..1 windup: shoulders down, chest forward
  swing: number; // 0..1 arms sweeping through
  stun: number; // 0..1 head dropped
  bell: number; // extra bell swing, radians
  hop: number; // feint hop-back offset, metres
  stage: number; // 0..5 silhouette stage
}

type V3 = readonly [number, number, number];

// Skeleton measurements, metres.
const HIP_Y = 1.5;
const HIP_X = 0.2;
const THIGH = 0.68; // hip → knee
const SOLE = 0.82; // knee → underside of the foot
// Contact points of the rigid foot in shin space (y, z): heel, ball, and the slightly upturned toe tips.
const HEEL_Z = -0.11;
const BALL_Z = 0.24;
const TOE_Z = 0.4;
const TOE_UP = 0.045;
const SCRAPE_Y = -0.74; // tip of the stage-2 front strut, in shin space
const SCRAPE_Z = 0.63;
const WAIST_Y = 1.56;
const SHOULDER_Y = 0.8; // above the waist

const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _v = new THREE.Vector3();

/** A box standing on y = 0 whose top face is scaled to tw × td: boards, shards, tines, claws. */
function taperGeo(w: number, h: number, d: number, tw: number, td: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const top = p.getY(i) > 0;
    p.setXYZ(i, p.getX(i) * (top ? tw / w : 1), p.getY(i) + h / 2, p.getZ(i) * (top ? td / d : 1));
  }
  return g;
}

/** A tapered board from point a to point b; its width axis is turned toward `hint`. */
function seg(b: Builder, a: V3, e: V3, w0: number, d0: number, w1: number, d1: number, color: string, hint: V3 = [1, 0, 0], jitter = 0.2): void {
  _y.set(e[0] - a[0], e[1] - a[1], e[2] - a[2]);
  const len = _y.length();
  _y.divideScalar(len);
  _x.set(hint[0], hint[1], hint[2]);
  _x.addScaledVector(_y, -_x.dot(_y));
  if (_x.lengthSq() < 1e-6) _x.set(0, 0, 1).addScaledVector(_y, -_y.z);
  _x.normalize();
  _z.crossVectors(_x, _y);
  const m = new THREE.Matrix4().makeBasis(_x, _y, _z).setPosition(a[0], a[1], a[2]);
  b.add(taperGeo(w0, len, d0, w1, d1), m, color, jitter, true);
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

interface Staged {
  geo: THREE.BufferGeometry;
  base: number;
  cuts: [stage: number, end: number][];
}

export class DeerModel {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private torso = new THREE.Group();
  private head = new THREE.Group();
  private bell = new THREE.Group();
  private legs: { thigh: THREE.Group; shin: THREE.Group }[] = [];
  private shoulders: THREE.Group[] = [];
  private arms: { upper: THREE.Group; fore: THREE.Group }[] = [];
  private staged: Staged[] = [];
  /** Cold rim light colour, fed to the wood shader as a uniform. */
  readonly rim = { value: new THREE.Color('#000000') };
  readonly material: THREE.MeshLambertMaterial;
  readonly bellMaterial: THREE.MeshLambertMaterial;

  constructor() {
    srand(404);
    // Cold rim on faces turned away from the camera keeps the silhouette readable on fog.
    this.material = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uRim = this.rim;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
        .replace(
          '#include <opaque_fragment>',
          'float rimF = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.5);\noutgoingLight += uRim * rimF;\n#include <opaque_fragment>',
        );
    };
    // Bronze lives in vertex colours so the bell keeps its facets; a little emissive holds it in the dark.
    this.bellMaterial = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#5a3410', vertexColors: true, flatShading: true });

    /** One mesh per bone. `stages` lists [stage, builder callback] parts appended in stage order. */
    const mesh = (b: Builder, parent: THREE.Object3D, mat: THREE.Material = this.material, stages: [number, (b: Builder) => void][] = []) => {
      const base = b.count;
      const cuts: [number, number][] = [];
      for (const [stage, fn] of stages) {
        fn(b);
        cuts.push([stage, b.count]);
      }
      const geo = b.build();
      if (cuts.length) this.staged.push({ geo, base, cuts });
      const m = new THREE.Mesh(geo, mat);
      parent.add(m);
      return m;
    };
    const plank = (b: Builder, w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, c = WOOD) =>
      b.box(w, h, d, M(x, y, z, rx, ry, rz), c, 0.22);
    const wood = (i: number) => (i % 3 === 0 ? CHAR : i % 3 === 1 ? WOOD : WOOD_LIGHT);

    this.root.add(this.body);

    // ---------------------------------------------------------------- hips
    // Pelvis block, belt and the ragged two-tier skirt of pointed shards.
    const hips = new Builder();
    plank(hips, 0.42, 0.2, 0.24, 0, HIP_Y, 0, 0, 0, 0, CHAR);
    plank(hips, 0.52, 0.07, 0.3, 0, 1.6, 0, 0, 0.04, 0.02, WOOD);
    const skirt = (n: number, y: number, rx: number, rz: number, lenA: number, lenB: number, flare: number, turn: number, pick: (i: number) => string) => {
      for (let i = 0; i < n; i++) {
        const a = ((i + turn) / n) * Math.PI * 2 + rr(-0.08, 0.08);
        const sx = Math.sin(a);
        const cz = Math.cos(a);
        const len = rr(lenA, lenB) * (1 + 0.22 * Math.abs(cz));
        const out = flare * rr(0.7, 1.2);
        const skew = rr(-0.05, 0.05);
        seg(
          hips,
          [sx * rx, y, cz * rz],
          [sx * (rx + out) + cz * skew, y - len, cz * (rz + out) - sx * skew],
          rr(0.15, 0.2),
          0.035,
          rr(0.02, 0.07),
          0.02,
          pick(i),
          [cz, 0, -sx],
          0.22,
        );
      }
    };
    const skirtFrom = hips.count;
    skirt(9, 1.6, 0.25, 0.15, 0.4, 0.52, 0.07, 0.5, (i) => (i % 2 ? CHAR : WOOD));
    skirt(10, 1.63, 0.28, 0.17, 0.22, 0.34, 0.1, 0, (i) => wood(i + 1));
    // Charred tips: the shards darken toward their points.
    hips.tint(skirtFrom, (_px, py, _pz, c) => c.multiplyScalar(0.62 + 0.38 * smooth(1.0, 1.5, py)));
    mesh(hips, this.body);

    // ---------------------------------------------------------------- legs
    // Tall plank thighs, wider shin boards, long two-toed feet (rigid with the shin).
    for (const side of [-1, 1]) {
      const thigh = new THREE.Group();
      thigh.position.set(side * HIP_X, HIP_Y, 0);
      thigh.rotation.order = 'YXZ'; // yaw the whole leg plane outward first, then pitch
      const shin = new THREE.Group();
      shin.position.set(0, -THIGH, 0);

      const tb = new Builder();
      plank(tb, 0.15, 0.62, 0.14, 0, -0.35, 0, 0, 0, 0, WOOD);
      plank(tb, 0.045, 0.44, 0.15, side * 0.08, -0.3, 0, 0, 0, side * 0.02, WOOD_LIGHT);
      plank(tb, 0.17, 0.13, 0.16, 0, -0.03, 0, 0, 0, 0, CHAR);
      mesh(tb, thigh, this.material, [[4, (b) => b.box(0.2, 0.1, 0.19, M(0, -0.02, 0.005), BONE, 0.04)]]);

      const sb = new Builder();
      plank(sb, 0.185, 0.6, 0.15, 0, -0.37, 0, 0, 0, 0, WOOD);
      plank(sb, 0.15, 0.15, 0.06, 0, -0.03, 0.075, 0.12, 0, 0, CHAR); // knee cap
      plank(sb, 0.08, 0.42, 0.04, -side * 0.02, -0.4, -0.085, 0, 0, 0.03, WOOD_LIGHT); // splint
      plank(sb, 0.2, 0.17, 0.24, 0, -SOLE + 0.085, 0.01, 0, 0, 0, CHAR); // heel block
      seg(sb, [0, -SOLE + 0.055, 0.1], [0, -SOLE + 0.0425, BALL_Z + 0.03], 0.19, 0.11, 0.17, 0.085, WOOD);
      for (const t of [-1, 1])
        seg(sb, [t * 0.045, -SOLE + 0.04, BALL_Z], [t * 0.085, -SOLE + TOE_UP + 0.02, TOE_Z], 0.075, 0.08, 0.035, 0.04, CHAR, [1, 0, 0]);
      const stages: [number, (b: Builder) => void][] = [];
      if (side === 1)
        // Stage 2: a long front leg strut from the knee; its claw drags when the foot pushes off.
        stages.push([
          2,
          (b) => {
            seg(b, [0.04, -0.06, 0.1], [0.075, -0.6, 0.47], 0.075, 0.06, 0.06, 0.05, WOOD_LIGHT);
            seg(b, [0.075, -0.6, 0.47], [0.08, SCRAPE_Y, SCRAPE_Z], 0.06, 0.05, 0.02, 0.02, WOOD_EDGE);
            seg(b, [0.06, -0.36, 0.3], [0.05, -0.4, 0.07], 0.05, 0.04, 0.04, 0.04, CHAR);
          },
        ]);
      // Stage 4: white joints — the legs fold almost to the ground on them.
      stages.push([
        4,
        (b) => {
          b.box(0.21, 0.12, 0.19, M(0, 0.0, 0.01), BONE, 0.04);
          b.box(0.22, 0.07, 0.21, M(0, -SOLE + 0.19, 0.01), BONE, 0.04);
        },
      ]);
      mesh(sb, shin, this.material, stages);

      thigh.add(shin);
      this.body.add(thigh);
      this.legs.push({ thigh, shin });
    }

    // ---------------------------------------------------------------- torso
    // An open rectangular frame with an arch — the bell must show through from both sides.
    this.torso.position.set(0, WAIST_Y, 0);
    this.body.add(this.torso);
    const tb = new Builder();
    plank(tb, 0.64, 0.09, 0.22, 0, 0.085, 0, 0, 0, 0.015, CHAR); // sill
    plank(tb, 0.09, 0.58, 0.2, -0.265, 0.39, 0, 0, 0, 0.02, WOOD); // posts
    plank(tb, 0.09, 0.58, 0.2, 0.265, 0.39, 0, 0, 0, -0.02, WOOD);
    plank(tb, 0.65, 0.1, 0.22, 0, 0.67, 0, 0, 0, -0.01, WOOD); // lintel
    for (const side of [-1, 1]) {
      // arch: two short boards per corner under the lintel
      plank(tb, 0.16, 0.065, 0.19, side * 0.178, 0.545, 0, 0, 0, side * -0.95, CHAR);
      plank(tb, 0.14, 0.06, 0.19, side * 0.082, 0.612, 0, 0, 0, side * -0.3, CHAR);
      // facing boards nailed over the posts, front and back
      plank(tb, 0.12, 0.48, 0.03, side * 0.277, 0.38, 0.105, 0, 0, side * -0.03, WOOD_LIGHT);
      plank(tb, 0.11, 0.42, 0.03, side * 0.277, 0.35, -0.105, 0, 0, side * 0.04, WOOD_LIGHT);
    }
    plank(tb, 0.64, 0.1, 0.24, 0, 0.765, 0, 0, 0, 0, CHAR); // yoke under the shoulders
    plank(tb, 0.2, 0.1, 0.2, 0, 0.85, 0.01, 0, 0, 0, WOOD); // neck root
    plank(tb, 0.045, 0.06, 0.045, 0, 0.595, 0, 0, 0, 0, CHAR); // bell hook
    mesh(tb, this.torso);

    // ---------------------------------------------------------------- bell
    // One bronze handbell on its own hanger so it can swing and ring.
    this.bell.position.set(0, 0.585, 0);
    this.torso.add(this.bell);
    const bb = new Builder();
    const BS = 1.12;
    const bm = (y: number) => M(0, y * BS, 0, 0, 0, 0, BS);
    bb.box(0.035, 0.07, 0.035, bm(-0.04), BRONZE_DARK, 0.1);
    bb.add(new THREE.CylinderGeometry(0.028, 0.062, 0.05, 8), bm(-0.095), BRONZE_LIGHT, 0.12);
    bb.add(new THREE.CylinderGeometry(0.062, 0.088, 0.12, 8, 1, true), bm(-0.18), BRONZE, 0.14);
    bb.add(new THREE.CylinderGeometry(0.088, 0.118, 0.055, 8), bm(-0.2675), BRONZE_LIGHT, 0.12);
    bb.box(0.04, 0.06, 0.04, bm(-0.32), BRONZE_DARK, 0.1);
    mesh(bb, this.bell, this.bellMaterial, [
      [
        3,
        // Stage 3: a second clapper hangs from the cracked chest beside the bell.
        (b) => {
          b.box(0.034, 0.3, 0.034, M(0.158, -0.15, 0, 0, 0, 0.05), BRONZE_DARK, 0.1);
          b.add(taperGeo(0.085, 0.14, 0.085, 0.04, 0.04), M(0.15, -0.43, 0), BRONZE_LIGHT, 0.12, true);
        },
      ],
    ]);

    // ---------------------------------------------------------------- shoulders
    // Broken-board pauldrons layered like shingles, with a scapula blade behind each:
    // the whole shoulder is its own bone so it can drop before a lunge.
    for (const side of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(side * 0.17, SHOULDER_Y, 0);
      const pb = new Builder();
      // Two tiers of boards fan out from an apex by the neck: long ragged ones below, short ones on top.
      // Boards toward the front and back hang steeper, so the pauldron shows a face from every side.
      const fan = (n: number, from: number, to: number, y0: number, slope: number, lenA: number, lenB: number, tier: number) => {
        for (let k = 0; k < n; k++) {
          const phi = from + ((to - from) * k) / (n - 1) + rr(-0.06, 0.06);
          const sp = Math.abs(Math.sin(phi));
          const len = rr(lenA, lenB) * (1 - 0.42 * sp);
          const sl = slope + rr(-0.05, 0.05) + sp * 0.42;
          const dx = Math.cos(phi) * Math.cos(sl);
          const dz = Math.sin(phi) * Math.cos(sl);
          const r0 = 0.04 + tier * 0.02;
          const x0 = -0.07 + Math.cos(phi) * r0;
          const z0 = Math.sin(phi) * (r0 + 0.05);
          seg(
            pb,
            [side * x0, y0, z0],
            [side * (x0 + dx * len), y0 - Math.sin(sl) * len, z0 + dz * len],
            0.17,
            0.04,
            rr(0.1, 0.2),
            0.03,
            wood(k + tier * 2 + (side > 0 ? 1 : 0)),
            [-Math.sin(phi) * side, 0, Math.cos(phi)],
            0.22,
          );
        }
      };
      fan(6, -1.45, 1.45, 0.08, 0.46, 0.46, 0.56, 0);
      fan(5, -1.2, 1.2, 0.125, 0.38, 0.26, 0.34, 1);
      // Scapula: a wide blade pointing down the back, with a pale spine so it catches the rim light.
      seg(pb, [side * 0.12, -0.06, -0.17], [side * 0.07, -0.52, -0.16], 0.25, 0.05, 0.06, 0.035, WOOD);
      seg(pb, [side * 0.2, -0.07, -0.2], [side * 0.08, -0.5, -0.185], 0.05, 0.035, 0.025, 0.02, WOOD_EDGE);
      seg(pb, [side * 0.01, -0.09, -0.195], [side * 0.24, -0.05, -0.2], 0.05, 0.03, 0.04, 0.03, WOOD_LIGHT);
      mesh(pb, sh);
      this.torso.add(sh);
      this.shoulders.push(sh);

      // Arms: long plank arms ending in clawed hands near the knee.
      const upper = new THREE.Group();
      upper.position.set(side * 0.27, -0.12, 0);
      const fore = new THREE.Group();
      fore.position.set(0, -0.52, 0);
      const ub = new Builder();
      plank(ub, 0.12, 0.5, 0.11, 0, -0.27, 0, 0, 0, 0, WOOD);
      plank(ub, 0.14, 0.11, 0.13, 0, -0.02, 0, 0, 0, 0, CHAR);
      plank(ub, 0.04, 0.34, 0.12, side * 0.07, -0.28, 0, 0, 0, side * 0.03, WOOD_LIGHT);
      mesh(ub, upper);
      const fb = new Builder();
      plank(fb, 0.13, 0.44, 0.11, 0, -0.27, 0, 0, 0, 0, WOOD);
      plank(fb, 0.1, 0.1, 0.1, 0, -0.01, 0, 0, 0, 0, CHAR);
      plank(fb, 0.14, 0.12, 0.07, 0, -0.55, 0, 0, 0, 0, CHAR); // palm
      for (let f = -1; f <= 1; f++) {
        const x = f * 0.048;
        seg(fb, [x, -0.6, 0], [x * 2.1, -0.79, 0.02], 0.042, 0.045, 0.036, 0.036, CHAR);
        seg(fb, [x * 2.1, -0.79, 0.02], [x * 2.7 - side * 0.02, -0.97, 0.075], 0.036, 0.036, 0.012, 0.012, WOOD);
      }
      seg(fb, [-side * 0.06, -0.54, 0.02], [-side * 0.14, -0.72, 0.08], 0.042, 0.04, 0.012, 0.012, CHAR); // thumb
      mesh(fb, fore);
      upper.add(fore);
      sh.add(upper);
      this.arms.push({ upper, fore });
    }

    // ---------------------------------------------------------------- head
    // Forward-leaning neck, a long narrow eyeless wedge, and the antlers — all one bone.
    this.head.position.set(0, 0.84, 0.03);
    this.torso.add(this.head);
    const hb = new Builder();
    seg(hb, [0, -0.03, 0], [0, 0.17, 0.16], 0.12, 0.13, 0.11, 0.12, CHAR);
    seg(hb, [0, 0.235, 0.13], [0, 0.1, 0.25], 0.17, 0.15, 0.23, 0.19, WOOD); // cranium
    seg(hb, [0, 0.1, 0.25], [0, -0.17, 0.45], 0.23, 0.19, 0.055, 0.045, WOOD); // snout wedge
    seg(hb, [0, 0.165, 0.33], [0, -0.15, 0.48], 0.16, 0.025, 0.045, 0.02, WOOD_LIGHT); // nasal board
    seg(hb, [0, 0.03, 0.2], [0, -0.14, 0.4], 0.12, 0.03, 0.04, 0.02, CHAR); // jaw slat
    for (const side of [-1, 1]) seg(hb, [side * 0.075, 0.2, 0.15], [side * 0.11, 0.3, 0.12], 0.08, 0.07, 0.06, 0.05, CHAR); // pedicles
    // Antlers: every beam and tine is listed once and mirrored, so the fork count holds at every angle.
    // They sweep back as they rise; each tine also leans forward or back so the rack has depth in profile.
    const lean = (y: number) => 0.12 - 0.36 * (y - 0.27);
    const tine = (b: Builder, side: number, x0: number, y0: number, x1: number, y1: number, t0: number, t1: number, c = WOOD, dz0 = 0, dz1 = 0) =>
      seg(b, [side * x0, y0, lean(y0) + dz0], [side * x1, y1, lean(y1) + dz1], t0, t0, t1, t1, c, [1, 0, 0], 0.2);
    for (const side of [-1, 1]) {
      tine(hb, side, 0.09, 0.27, 0.22, 0.37, 0.12, 0.105); // main beam
      tine(hb, side, 0.22, 0.37, 0.37, 0.5, 0.105, 0.09, WOOD, 0, -0.04);
      tine(hb, side, 0.37, 0.5, 0.48, 0.68, 0.09, 0.075, WOOD, -0.04, -0.02);
      tine(hb, side, 0.48, 0.68, 0.5, 0.9, 0.075, 0.034, WOOD, -0.02, -0.1);
      tine(hb, side, 0.15, 0.31, 0.13, 0.56, 0.08, 0.032, WOOD, 0.02, 0.26); // brow tine, forward
      tine(hb, side, 0.22, 0.37, 0.25, 0.73, 0.085, 0.032, WOOD, 0, -0.14);
      tine(hb, side, 0.37, 0.5, 0.37, 0.88, 0.08, 0.032, WOOD, -0.04, 0.16);
      tine(hb, side, 0.48, 0.68, 0.6, 0.84, 0.072, 0.032, WOOD, -0.02, 0.06);
      tine(hb, side, 0.495, 0.8, 0.42, 0.95, 0.06, 0.03, WOOD, -0.07, 0.05);
    }
    mesh(hb, this.head, this.material, [
      [
        1,
        // Stage 1: a short fork grows under the left antler.
        (b) => {
          tine(b, -1, 0.17, 0.33, 0.35, 0.27, 0.075, 0.06, WOOD_LIGHT, 0.02, 0.06);
          tine(b, -1, 0.35, 0.27, 0.48, 0.36, 0.06, 0.026, WOOD_LIGHT, 0.06, 0.1);
          tine(b, -1, 0.35, 0.27, 0.45, 0.13, 0.06, 0.026, WOOD_LIGHT, 0.06, 0.08);
        },
      ],
      [
        5,
        // Stage 5: the forked crown folds into two arcs that close over the head.
        (b) => {
          for (const side of [-1, 1]) {
            tine(b, side, 0.5, 0.9, 0.46, 1.08, 0.065, 0.06, WOOD, -0.1, 0);
            tine(b, side, 0.46, 1.08, 0.34, 1.22, 0.06, 0.055);
            tine(b, side, 0.34, 1.22, 0.18, 1.28, 0.055, 0.05);
            tine(b, side, 0.18, 1.28, 0.05, 1.2, 0.05, 0.022);
            tine(b, side, 0.18, 1.28, 0.13, 1.44, 0.05, 0.022);
            tine(b, side, 0.46, 1.08, 0.59, 1.2, 0.05, 0.022);
          }
        },
      ],
    ]);

    this.setStage(0);
    this.apply({ walk: 0, gait: 0, crouch: 0, swing: 0, stun: 0, bell: 0, hop: 0, stage: 0 });
  }

  setStage(stage: number): void {
    for (const s of this.staged) {
      let count = s.base;
      for (const [at, end] of s.cuts) if (stage >= at) count = end;
      s.geo.setDrawRange(0, count);
    }
  }

  /** Swap the procedural boards for the generated, rigid-skinned model (same pose input). */
  adoptRig(rig: { root: THREE.Object3D; apply(p: DeerPose): void }): void {
    this.rig = rig;
    this.body.visible = false;
    this.root.add(rig.root);
  }
  private rig: { root: THREE.Object3D; apply(p: DeerPose): void } | null = null;

  apply(p: DeerPose): void {
    if (this.rig) {
      this.rig.apply(p);
      return;
    }
    const s = Math.sin(p.walk);
    const c = Math.cos(p.walk);
    const g = p.gait;
    const cr = p.crouch;
    const st = p.stun;
    // The gait phase advances per metre travelled, so the stride is long even at a stalk.
    const stride = Math.min(1, g * 2.5);
    const fold = p.stage >= 4 ? 1.28 : 1;
    // Swing: arms rear back and out, then rake forward through the target.
    const raise = smooth(0, 0.4, p.swing) * (1 - smooth(0.42, 0.75, p.swing));
    const strike = smooth(0.42, 0.85, p.swing);
    // Feint hop: 0 → 2 m back → 0; the arc peaks mid-way.
    const hopArc = Math.min(1, Math.max(0, p.hop * (2 - p.hop)));

    const body = this.body;
    body.rotation.x = 0.07 * g + 0.05 * cr;
    body.rotation.y = strike * 0.25 - raise * 0.2;
    body.position.set(0, 0, -p.hop - 0.17 * cr * fold + strike * 0.22);

    const torso = this.torso;
    torso.rotation.x = 0.07 + cr * 0.68 + g * 0.14 + st * 0.5 - raise * 0.3 + strike * 0.25 - hopArc * 0.12;
    torso.rotation.z = s * 0.05 * stride + st * 0.08;
    torso.rotation.y = strike * 0.45 - raise * 0.35 - s * 0.06 * stride;
    const pitch = body.rotation.x + torso.rotation.x;

    this.head.rotation.x = -0.02 - cr * 0.72 - g * 0.1 + st * 1.0 + c * 0.03 * g + raise * 0.2;
    this.head.rotation.z = st * 0.28;
    this.head.rotation.y = -torso.rotation.y * 0.6;

    this.legs.forEach((leg, i) => {
      const side = i === 0 ? -1 : 1;
      const ph = i === 0 ? s : -s; // +1 = this leg fully forward
      const lift = Math.max(0, i === 0 ? c : -c); // swinging forward
      // From stage 2 the right leg carries the long strut: that shin stays steeper, so the strut is
      // planted ahead of the foot in a crouch and only rakes the ground as the leg pushes off.
      const strut = i === 1 && p.stage >= 2;
      const push = ph < 0 ? Math.pow(-ph, 0.6) * (strut ? 0.3 : 0.75) : 0; // trailing: knee gives, heel rises
      const tuck = lift * 1.15; // swinging through: shin folded, toes clear
      const squat = cr * 1.15 * fold;
      const tiptoe = cr * cr * (strut ? 0.25 : 0.55) * fold; // deep in the crouch it rocks onto its toes
      leg.thigh.rotation.x = -(ph * 0.46 + lift * 0.5) * stride - squat - st * 0.3 - hopArc * 0.45;
      leg.thigh.rotation.y = side * (cr * 0.5 + st * 0.12);
      leg.thigh.rotation.z = side * 0.055;
      leg.shin.rotation.x = (tuck + push) * stride + squat + tiptoe + st * 0.55 + hopArc * 0.9;
    });

    const shPitch = cr * 0.5 + st * 0.15;
    this.shoulders.forEach((sh, i) => {
      const side = i === 0 ? -1 : 1;
      sh.position.y = SHOULDER_Y - cr * 0.09 - st * 0.04 + raise * 0.04;
      sh.rotation.x = shPitch;
      sh.rotation.z = -side * (cr * 0.4 + st * 0.2 - raise * 0.15);
    });

    // How far the shoulder frame is tipped forward; arms partly hang against it.
    const tip = pitch + shPitch;
    this.arms.forEach((arm, i) => {
      const side = i === 0 ? -1 : 1;
      const ph = i === 0 ? -s : s; // opposite to the same-side leg
      const lead = i === 0 ? 1 : 0.8;
      arm.upper.rotation.x =
        -tip * (0.55 + 0.25 * cr + 0.35 * st) + ph * 0.42 * stride + cr * 0.1 + raise * 0.8 * lead - strike * 1.45 * lead;
      arm.upper.rotation.z = side * (0.13 + cr * 1.25 + raise * 0.75 - strike * 1.55 - st * 0.06);
      arm.fore.rotation.x = -0.18 - cr * 0.55 - Math.max(0, ph) * 0.35 * stride - raise * 0.6 + strike * 0.15 + st * 0.1;
      arm.fore.rotation.z = -side * (0.04 + cr * 0.55 - strike * 0.35);
    });

    this.bell.rotation.x = -pitch * 0.9 + Math.sin(p.walk * 2) * 0.14 * g + p.bell;
    this.bell.rotation.z = p.bell * 0.6 + s * 0.08 * g;

    // Plant the feet: lift the body until the lowest heel, ball or toe rests on y = 0.
    body.updateMatrix();
    let low = Infinity;
    for (const leg of this.legs) {
      leg.thigh.updateMatrix();
      leg.shin.updateMatrix();
      _m.multiplyMatrices(body.matrix, leg.thigh.matrix).multiply(leg.shin.matrix);
      low = Math.min(
        low,
        _v.set(0, -SOLE, HEEL_Z).applyMatrix4(_m).y,
        _v.set(0, -SOLE, BALL_Z).applyMatrix4(_m).y,
        _v.set(0, -SOLE + TOE_UP, TOE_Z).applyMatrix4(_m).y,
      );
    }
    body.position.y = -low + hopArc * 0.22;
  }
}
