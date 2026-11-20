// The generated Bell-stag mesh (src/assets/deer.glb) arrives as one static
// A-pose model. The creature is built of rigid boards, so it is rigged the same
// way: every vertex belongs to exactly one bone, chosen by where it sits in the
// A-pose. Joints open like the gaps between planks instead of bending.

import * as THREE from 'three';
import type { DeerPose } from './deerModel';

/** Height of the model with antlers; the skull top then sits at 2.7 m (GDD). */
const HEIGHT = 3.21;
/** The body is centred 0.15 m behind the bounding-box centre (the snout sticks out). */
const BODY_Z = -0.15;

const enum Part {
  Hips,
  Torso,
  Head,
  Bell,
  ArmL,
  ForeL,
  ArmR,
  ForeR,
  ThighL,
  ShinL,
  ThighR,
  ShinR,
}

// Joint positions in metres, measured on the scaled A-pose mesh (x mirrored for the right side).
const HIP_Y = 1.45;
const KNEE_Y = 0.93;
const WAIST_Y = 1.62;
const NECK_Y = 2.35;
const BELL_Y = 2.09;
const SHOULDER = { x: 0.42, y: 2.12 };
const ELBOW = { x: 0.57, y: 1.86 };
const LEG_X = 0.21;
const THIGH = HIP_Y - KNEE_Y;
const SHIN = KNEE_Y;
/** The A-pose holds the arms 32° out from the body. */
const ARM_OUT = 0.57;

function classify(x: number, y: number): Part {
  const ax = Math.abs(x);
  const left = x < 0;
  if (ax > 0.38 && y < 2.12) return y < ELBOW.y ? (left ? Part.ForeL : Part.ForeR) : left ? Part.ArmL : Part.ArmR;
  if (y > 2.45 || (y > 2.33 && ax < 0.17)) return Part.Head;
  if (ax < 0.16 && y > 1.75 && y < BELL_Y) return Part.Bell;
  if (y < KNEE_Y) return left ? Part.ShinL : Part.ShinR;
  if (y < 1.12 && ax > 0.03) return left ? Part.ThighL : Part.ThighR;
  if (y < WAIST_Y + 0.1) return Part.Hips;
  return Part.Torso;
}

const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export class RiggedDeer {
  readonly root = new THREE.Group();
  private body = new THREE.Bone();
  private torso = new THREE.Bone();
  private head = new THREE.Bone();
  private bell = new THREE.Bone();
  private arms: { upper: THREE.Bone; fore: THREE.Bone; side: number }[] = [];
  private legs: { thigh: THREE.Bone; shin: THREE.Bone }[] = [];

  constructor(source: THREE.Object3D, rim: { value: THREE.Color }) {
    source.updateMatrixWorld(true);
    let srcMesh: THREE.Mesh | null = null;
    source.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !srcMesh) srcMesh = o as THREE.Mesh;
    });
    if (!srcMesh) throw new Error('deer.glb has no mesh');
    const src = srcMesh as THREE.Mesh;

    // Bake the node transform, stand the model on y = 0 and scale it to its real height.
    // The compressed file stores quantised integer positions that only make sense through the
    // node transform, so rebuild them as plain floats in world space first.
    const geo = src.geometry.clone();
    const qp = geo.getAttribute('position');
    const fp = new Float32Array(qp.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < qp.count; i++) {
      v.fromBufferAttribute(qp, i).applyMatrix4(src.matrixWorld);
      fp[i * 3] = v.x;
      fp[i * 3 + 1] = v.y;
      fp[i * 3 + 2] = v.z;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    geo.deleteAttribute('normal');
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const k = HEIGHT / (box.max.y - box.min.y);
    geo.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2 - BODY_Z / k);
    geo.scale(k, k, k);

    // Rigid skinning: one bone per vertex.
    const pos = geo.getAttribute('position');
    const idx = new Uint16Array(pos.count * 4);
    const wgt = new Float32Array(pos.count * 4);
    for (let i = 0; i < pos.count; i++) {
      idx[i * 4] = classify(pos.getX(i), pos.getY(i));
      wgt[i * 4] = 1;
    }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(idx, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(wgt, 4));
    geo.computeVertexNormals();

    const srcMat = (Array.isArray(src.material) ? src.material[0] : src.material) as THREE.MeshStandardMaterial;
    const map = srcMat.map ?? null;
    if (map) map.colorSpace = THREE.SRGBColorSpace;
    // Same cold rim as the procedural model, so the silhouette still reads on fog.
    const mat = new THREE.MeshLambertMaterial({ map, color: '#d9cfc8' });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uRim = rim;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
        .replace(
          '#include <opaque_fragment>',
          'float rimF = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.5);\noutgoingLight += uRim * rimF;\n#include <opaque_fragment>',
        );
    };

    // Skeleton. Bone order must match the Part enum.
    const bone = (parent: THREE.Bone | null, x: number, y: number, z: number, px = 0, py = 0, pz = 0) => {
      const b = new THREE.Bone();
      b.position.set(x - px, y - py, z - pz);
      parent?.add(b);
      return b;
    };
    this.body.position.set(0, HIP_Y, 0);
    this.torso = bone(this.body, 0, WAIST_Y, 0, 0, HIP_Y, 0);
    this.head = bone(this.torso, 0, NECK_Y, 0.03, 0, WAIST_Y, 0);
    this.bell = bone(this.torso, 0, BELL_Y, 0, 0, WAIST_Y, 0);
    const bones: THREE.Bone[] = [this.body, this.torso, this.head, this.bell];
    for (const side of [-1, 1]) {
      const upper = bone(this.torso, side * SHOULDER.x, SHOULDER.y, 0, 0, WAIST_Y, 0);
      const fore = bone(upper, side * ELBOW.x, ELBOW.y, 0, side * SHOULDER.x, SHOULDER.y, 0);
      this.arms.push({ upper, fore, side });
      bones.push(upper, fore);
    }
    for (const side of [-1, 1]) {
      const thigh = bone(this.body, side * LEG_X, HIP_Y, 0, 0, HIP_Y, 0);
      const shin = bone(thigh, side * LEG_X, KNEE_Y, 0.02, side * LEG_X, HIP_Y, 0);
      this.legs.push({ thigh, shin });
      bones.push(thigh, shin);
    }

    const mesh = new THREE.SkinnedMesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.add(this.body);
    mesh.bind(new THREE.Skeleton(bones));
    this.root.add(mesh);
    this.apply({ walk: 0, gait: 0, crouch: 0, swing: 0, stun: 0, bell: 0, hop: 0, stage: 0 });
  }

  apply(p: DeerPose): void {
    const s = Math.sin(p.walk);
    const c = Math.cos(p.walk);
    const g = p.gait;
    const cr = p.crouch;
    const st = p.stun;
    const stride = Math.min(1, g * 2.5);
    // Swing: the arms rear back and out, then rake forward through the target.
    const raise = smooth(0, 0.4, p.swing) * (1 - smooth(0.42, 0.75, p.swing));
    const strike = smooth(0.42, 0.85, p.swing);
    const fold = p.stage >= 4 ? 1.2 : 1;

    // Legs. A negative thigh angle carries the foot forward; a positive shin angle bends the knee.
    let reach = 0;
    this.legs.forEach((leg, i) => {
      const ph = i === 0 ? s : -s;
      const lift = Math.max(0, i === 0 ? c : -c);
      const a = -ph * 0.5 * stride - cr * 0.78 * fold - st * 0.12;
      const b = lift * 0.95 * stride + cr * 1.42 * fold + st * 0.25;
      leg.thigh.rotation.set(a, 0, (i === 0 ? -1 : 1) * cr * 0.16);
      leg.shin.rotation.set(b, 0, 0);
      reach = Math.max(reach, THIGH * Math.cos(a) + SHIN * Math.cos(a + b));
    });
    // The lower foot stays on the ground whatever the legs do.
    const hop = Math.sin(Math.min(1, p.hop / 2) * Math.PI) * 0.25;
    this.body.position.set(0, reach + hop, -p.hop);
    this.body.rotation.set(0.05 * g + cr * 0.1, 0, s * 0.03 * stride);

    const pitch = 0.04 + cr * 0.6 + g * 0.14 + st * 0.5 - raise * 0.25 + strike * 0.4;
    this.torso.rotation.set(pitch, strike * 0.25 * Math.sin(p.swing * Math.PI), -s * 0.05 * stride);
    this.head.rotation.set(-cr * 0.5 + st * 0.95 - g * 0.1 + c * 0.03 * stride, 0, st * 0.22);

    this.arms.forEach((arm, i) => {
      const ph = i === 0 ? -s : s;
      // Bring the A-pose arms down to hang by the body, spread them again for the windup.
      const down = ARM_OUT - 0.1 - cr * 0.55 - raise * 0.5 + st * 0.08;
      const swingX = ph * 0.32 * stride + cr * 0.45 + raise * 1.0 - strike * 2.0 + st * 0.1;
      arm.upper.rotation.set(swingX, 0, -arm.side * down);
      arm.fore.rotation.set(-0.12 - cr * 0.55 - Math.max(0, -ph) * 0.3 * stride - strike * 0.5 + raise * 0.6, 0, arm.side * (0.12 + cr * 0.2));
    });

    // The bell hangs plumb while the chest tips, and swings when it rings.
    this.bell.rotation.set(-pitch * 0.85 + Math.sin(p.walk * 2) * 0.14 * g + p.bell, 0, p.bell * 0.6 + s * 0.07 * g);
  }
}
