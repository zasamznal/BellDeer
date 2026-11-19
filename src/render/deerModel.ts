// The Bell-stag (reference 04): a 2.7 m biped of charred boards with an open
// rectangular chest, a single hanging bronze bell, an eyeless wedge head and
// branching antlers. One skeleton of rigid parts, animated procedurally.

import * as THREE from 'three';
import { Builder, M, rr, srand } from './geo';

const WOOD = '#3a2d2b';
const WOOD_LIGHT = '#57402f';
const CHAR = '#241d1f';
const BONE = '#d9d2c4';

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

export class DeerModel {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private torso = new THREE.Group();
  private head = new THREE.Group();
  private bell = new THREE.Group();
  private legs: { thigh: THREE.Group; shin: THREE.Group }[] = [];
  private arms: { upper: THREE.Group; fore: THREE.Group }[] = [];
  private stageParts: THREE.Object3D[][] = [[], [], [], [], [], []];
  private antlerBase!: THREE.Mesh;
  private antlerCrown!: THREE.Mesh;
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
    this.bellMaterial = new THREE.MeshLambertMaterial({ color: '#c08338', emissive: '#5a3410', flatShading: true });

    const mesh = (b: Builder, parent: THREE.Object3D, mat: THREE.Material = this.material) => {
      const m = new THREE.Mesh(b.build(), mat);
      parent.add(m);
      return m;
    };
    const plank = (b: Builder, w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, c = WOOD) =>
      b.box(w, h, d, M(x, y, z, rx, ry, rz), c, 0.22);

    this.root.add(this.body);

    // Hips and the ragged skirt of split boards.
    const hips = new Builder();
    plank(hips, 0.5, 0.22, 0.3, 0, 1.24, 0);
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      const len = rr(0.32, 0.62);
      hips.box(0.13, len, 0.035, M(Math.sin(a) * 0.27, 1.2 - len / 2, Math.cos(a) * 0.19, 0.16, a, rr(-0.12, 0.12)), i % 3 ? CHAR : WOOD, 0.2);
    }
    mesh(hips, this.body);

    // Legs: tall plank thighs and shins, long two-toed feet.
    for (const side of [-1, 1]) {
      const thigh = new THREE.Group();
      thigh.position.set(side * 0.2, 1.2, 0);
      const shin = new THREE.Group();
      shin.position.set(0, -0.58, 0);
      const tb = new Builder();
      plank(tb, 0.17, 0.62, 0.15, 0, -0.29, 0, 0, 0, side * 0.03);
      plank(tb, 0.06, 0.4, 0.17, side * 0.09, -0.3, 0, 0, 0, 0, WOOD_LIGHT);
      mesh(tb, thigh);
      const sb = new Builder();
      plank(sb, 0.14, 0.6, 0.13, 0, -0.3, 0);
      plank(sb, 0.2, 0.09, 0.42, 0, -0.58, 0.12, 0, 0, 0, CHAR);
      plank(sb, 0.07, 0.07, 0.2, -0.06, -0.59, 0.36, 0.1, -0.12, 0, CHAR);
      plank(sb, 0.07, 0.07, 0.2, 0.06, -0.59, 0.36, 0.1, 0.12, 0, CHAR);
      const joint = sb.count;
      sb.box(0.16, 0.08, 0.15, M(0, -0.01, 0.01), BONE, 0.05);
      const jm = mesh(sb, shin);
      void joint;
      void jm;
      thigh.add(shin);
      this.body.add(thigh);
      this.legs.push({ thigh, shin });
    }

    // Torso: an open rectangular frame — the bell must show through.
    this.torso.position.set(0, 1.32, 0);
    this.body.add(this.torso);
    const tb = new Builder();
    plank(tb, 0.12, 0.82, 0.24, -0.33, 0.44, 0, 0, 0, 0.03);
    plank(tb, 0.12, 0.82, 0.24, 0.33, 0.44, 0, 0, 0, -0.03);
    plank(tb, 0.78, 0.12, 0.26, 0, 0.06, 0, 0, 0, 0, CHAR);
    plank(tb, 0.8, 0.13, 0.26, 0, 0.86, 0);
    plank(tb, 0.2, 0.1, 0.25, -0.2, 0.76, 0, 0, 0, -0.7, WOOD_LIGHT); // arch corners
    plank(tb, 0.2, 0.1, 0.25, 0.2, 0.76, 0, 0, 0, 0.7, WOOD_LIGHT);
    // Broken-board shoulders, layered like shingles.
    for (const side of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const w = rr(0.3, 0.44);
        tb.box(w, 0.045, rr(0.3, 0.42), M(side * (0.42 + i * 0.07), 0.95 - i * 0.055, rr(-0.03, 0.03), rr(-0.1, 0.1), rr(-0.25, 0.25), side * (-0.28 - i * 0.09)), i % 2 ? CHAR : WOOD, 0.22);
      }
    // Scapula boards on the back: readable from behind before a lunge.
    plank(tb, 0.22, 0.4, 0.05, -0.2, 0.62, -0.15, -0.18, 0, 0.12, CHAR);
    plank(tb, 0.22, 0.4, 0.05, 0.2, 0.62, -0.15, -0.18, 0, -0.12, CHAR);
    mesh(tb, this.torso);

    // Bell on its own hanger so it can swing and ring.
    this.bell.position.set(0, 0.8, 0);
    this.torso.add(this.bell);
    const cord = new Builder();
    cord.box(0.025, 0.2, 0.025, M(0, -0.1, 0), CHAR, 0);
    mesh(cord, this.bell);
    const bellGeo = new THREE.CylinderGeometry(0.05, 0.15, 0.26, 7, 1, false);
    bellGeo.translate(0, -0.33, 0);
    this.bell.add(new THREE.Mesh(bellGeo, this.bellMaterial));
    const clapper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), this.bellMaterial);
    clapper.position.set(0, -0.5, 0);
    this.bell.add(clapper);

    // Stage 4: a second clapper hangs from the cracked chest.
    const second = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.3, 0.045), this.bellMaterial);
    second.position.set(0.14, -0.52, 0.02);
    second.rotation.z = 0.12;
    this.bell.add(second);
    this.stageParts[3].push(second);

    // Neck and the long, narrow, eyeless wedge head.
    this.head.position.set(0, 0.92, 0.02);
    this.torso.add(this.head);
    const hb = new Builder();
    plank(hb, 0.13, 0.3, 0.13, 0, 0.13, 0.03, 0.25);
    const snout = new THREE.CylinderGeometry(0.02, 0.15, 0.6, 4, 1);
    hb.add(snout, M(0, 0.26, 0.3, 1.95, Math.PI / 4, 0, 0.8, 1, 1.25), CHAR, 0.15);
    plank(hb, 0.2, 0.05, 0.24, 0, 0.42, 0.1, 0.4, 0, 0, WOOD);
    mesh(hb, this.head);

    // Antlers: fork counts are fixed here and mirrored, so they hold at every angle.
    const antlers = (crown: boolean) => {
      const ab = new Builder();
      for (const side of [-1, 1]) {
        const beam = (x: number, y: number, z: number, len: number, rz: number, rx: number, t = 0.05) => {
          ab.box(t, len, t, M(side * x, y, z, rx, 0, side * rz).multiply(M(0, len / 2, 0)), WOOD, 0.2);
        };
        if (!crown) {
          beam(0.07, 0.42, 0.02, 0.5, -0.75, -0.25, 0.06);
          beam(0.4, 0.78, -0.1, 0.45, -0.1, -0.1, 0.05);
          beam(0.2, 0.6, -0.03, 0.3, 0.25, 0.3, 0.04); // brow tine
          beam(0.38, 0.86, -0.1, 0.28, -0.75, 0.1, 0.04);
          beam(0.43, 1.05, -0.13, 0.3, 0.35, -0.2, 0.04);
          beam(0.44, 1.2, -0.15, 0.22, -0.5, 0, 0.035);
        } else {
          // Stage 6: the forked crown folds into two arcs.
          beam(0.5, 0.92, -0.1, 0.42, -1.25, -0.2, 0.045);
          beam(0.88, 1.06, -0.18, 0.36, -0.2, -0.3, 0.04);
          beam(0.9, 1.4, -0.28, 0.3, 0.9, -0.2, 0.035);
        }
      }
      return ab;
    };
    this.antlerBase = mesh(antlers(false), this.head);
    this.antlerCrown = mesh(antlers(true), this.head);
    this.stageParts[5].push(this.antlerCrown);
    // Stage 2: a short fork grows under the left antler.
    const fork = new Builder();
    fork.box(0.04, 0.26, 0.04, M(-0.3, 0.56, 0.02, 0.5, 0, 0.9).multiply(M(0, 0.13, 0)), WOOD_LIGHT, 0.1);
    fork.box(0.035, 0.16, 0.035, M(-0.44, 0.66, 0.1, 0.9, 0, 0.3).multiply(M(0, 0.08, 0)), WOOD_LIGHT, 0.1);
    this.stageParts[1].push(mesh(fork, this.head));

    // Arms: long plank arms that end in three wooden claws near the knee.
    for (const side of [-1, 1]) {
      const upper = new THREE.Group();
      upper.position.set(side * 0.56, 0.84, 0);
      const fore = new THREE.Group();
      fore.position.set(0, -0.64, 0);
      const ub = new Builder();
      plank(ub, 0.13, 0.66, 0.14, 0, -0.32, 0);
      mesh(ub, upper);
      const fb = new Builder();
      plank(fb, 0.11, 0.66, 0.12, 0, -0.33, 0);
      plank(fb, 0.14, 0.14, 0.1, 0, -0.7, 0, 0, 0, 0, CHAR);
      for (let c = -1; c <= 1; c++) fb.box(0.035, 0.28, 0.04, M(c * 0.05, -0.88, 0.03, 0.25, 0, c * 0.22), CHAR, 0.15);
      mesh(fb, fore);
      upper.add(fore);
      this.torso.add(upper);
      this.arms.push({ upper, fore });
    }

    // Stage 3: one long front leg that scrapes the ground.
    const scrape = new Builder();
    scrape.box(0.06, 0.5, 0.06, M(0.1, -0.84, 0.3, -0.9, 0, 0), CHAR, 0.1);
    this.stageParts[2].push(mesh(scrape, this.legs[1].shin));
    // Stage 5: white joints fold almost to the ground.
    for (const leg of this.legs) {
      const jb = new Builder();
      jb.box(0.2, 0.11, 0.19, M(0, 0.0, 0.02), BONE, 0.04);
      jb.box(0.17, 0.09, 0.17, M(0, -0.58, 0.02), BONE, 0.04);
      this.stageParts[4].push(mesh(jb, leg.shin));
    }
    this.setStage(0);
  }

  readonly rim = { value: new THREE.Color('#000000') };

  setStage(stage: number): void {
    this.stageParts.forEach((parts, i) => parts.forEach((p) => (p.visible = stage >= i)));
    this.antlerBase.visible = true;
    this.antlerCrown.visible = stage >= 5;
  }

  apply(p: DeerPose): void {
    const s = Math.sin(p.walk);
    const c = Math.cos(p.walk);
    const g = p.gait;
    const cr = p.crouch;
    const fold = p.stage >= 4 ? 1.25 : 1;
    this.body.position.set(0, -0.38 * cr * fold - Math.abs(s) * 0.05 * g - p.stun * 0.12, -p.hop);
    this.body.rotation.x = 0.08 * g;
    this.torso.rotation.x = 0.1 + cr * 0.62 + g * 0.16 + p.stun * 0.5 - p.swing * 0.25;
    this.torso.rotation.z = s * 0.05 * g;
    this.torso.rotation.y = p.swing * 0.5 * Math.sin(p.swing * Math.PI);
    this.head.rotation.x = -0.1 - cr * 0.35 + p.stun * 0.95 + c * 0.03 * g;
    this.head.rotation.z = p.stun * 0.25;
    this.legs.forEach((leg, i) => {
      const ph = i === 0 ? s : -s;
      const lift = Math.max(0, i === 0 ? c : -c);
      leg.thigh.rotation.x = -ph * 0.55 * g - cr * 0.85 * fold;
      leg.shin.rotation.x = lift * 0.9 * g + cr * 1.5 * fold;
    });
    this.arms.forEach((arm, i) => {
      const side = i === 0 ? -1 : 1;
      const ph = i === 0 ? -s : s;
      arm.upper.rotation.x = ph * 0.35 * g - cr * 0.35 + p.swing * (i === 0 ? -1.9 : -1.5) + p.stun * 0.3;
      arm.upper.rotation.z = side * (0.12 + cr * 0.55 - p.swing * 0.2);
      arm.fore.rotation.x = -0.15 - cr * 0.75 - Math.max(0, ph) * 0.3 * g - p.swing * 0.5;
    });
    this.bell.rotation.x = -this.torso.rotation.x * 0.85 + Math.sin(p.walk * 2) * 0.14 * g + p.bell;
    this.bell.rotation.z = p.bell * 0.6 + s * 0.08 * g;
  }
}
