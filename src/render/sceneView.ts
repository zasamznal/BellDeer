// WebGL view of the simulation. Reads snapshots and events only; no rules here.
// Budget (GDD §7): instanced trees and ferns, distance fog, one fuel value
// drives both the lit ground and the ember ring at the protection edge.

import * as THREE from 'three';
import { type Forest, distToPaths } from '../sim/forest';
import { RULES } from '../sim/rules';
import type { SimEvent } from '../sim/types';
import type { World } from '../sim/world';
import { DeerModel, type DeerPose } from './deerModel';
import { Builder, M, rnd, rr, srand, woodMaterial } from './geo';
import { IdeasView } from './ideasView'; // [ideas] tracks, resin pine, omen fog, bell-night tint
import * as P from './props';

interface Sky {
  top: THREE.Color;
  horizon: THREE.Color;
  fog: THREE.Color;
  near: number;
  far: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemi: number;
  sun: THREE.Color;
  sunI: number;
  rim: number;
}
const sky = (top: string, horizon: string, fog: string, near: number, far: number, hs: string, hg: string, hemi: number, sun: string, sunI: number, rim: number): Sky => ({
  top: new THREE.Color(top),
  horizon: new THREE.Color(horizon),
  fog: new THREE.Color(fog),
  near,
  far,
  hemiSky: new THREE.Color(hs),
  hemiGround: new THREE.Color(hg),
  hemi,
  sun: new THREE.Color(sun),
  sunI,
  rim,
});
const SKY = {
  // Anxious day: ash-lilac sky #86788A, fog 18–40 m.
  day: sky('#6c6079', '#96848f', '#86788a', 18, 40, '#cdbdc8', '#8d776c', 2.7, '#ffbe98', 1.5, 0.03),
  // Night: blue-black fog 10–27 m with a steel band behind silhouettes.
  night: sky('#0a1220', '#34507a', '#263a58', 10, 27, '#5f84b8', '#1a2438', 1.2, '#9dbbe2', 0.9, 0.75),
  dawn: sky('#5a5270', '#c79aa2', '#8f8094', 16, 38, '#c2acbf', '#7a6466', 2.2, '#ffc3a0', 0.9, 0.08),
};

export interface ViewSettings {
  shake: boolean;
  flash: boolean;
}

const tmpM = new THREE.Matrix4();
const tmpC = new THREE.Color();
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export class SceneView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.06, 140);
  private wood = woodMaterial();
  private woodDouble: THREE.MeshLambertMaterial;
  private world3d = new THREE.Group();
  private cur: Sky = { ...SKY.day, top: SKY.day.top.clone(), horizon: SKY.day.horizon.clone(), fog: SKY.day.fog.clone(), hemiSky: SKY.day.hemiSky.clone(), hemiGround: SKY.day.hemiGround.clone(), sun: SKY.day.sun.clone() };
  private skyMat: THREE.ShaderMaterial;
  private hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1);
  private sun = new THREE.DirectionalLight('#ffffff', 1);
  private fireLight = new THREE.PointLight('#ff9040', 0, 20, 1.7);
  private handLight = new THREE.PointLight('#8fa6c8', 0.25, 3.2, 1.6);
  private spot = new THREE.SpotLight('#d4e4ff', 0, 14, Math.PI / 10, 0.45, 1.1);
  private torchLight = new THREE.PointLight('#ff8a3a', 0, 9, 1.6);
  private flashLight = new THREE.PointLight('#ffd9c8', 0, 22, 1.4);
  private beam!: THREE.Mesh;
  private moon!: THREE.Mesh;
  private sunDisc!: THREE.Mesh;
  private flames!: THREE.InstancedMesh;
  private embers!: THREE.Points;
  private ring!: THREE.Mesh;
  private ringSparks!: THREE.Points;
  private ferns: THREE.InstancedMesh | null = null;
  private fernCount = 0;
  private snagMeshes: { trunk: THREE.Mesh; stump: THREE.Mesh }[] = [];
  private scrapMeshes: THREE.Mesh[] = [];
  private berryMeshes: THREE.Mesh[] = [];
  private tags: { mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial }[] = [];
  private trapMeshes: THREE.Mesh[] = [];
  private trapGhost!: THREE.Mesh;
  private trapGeo = P.trapGeometry();
  private deer = new DeerModel();
  private pose: DeerPose = { walk: 0, gait: 0, crouch: 0, swing: 0, stun: 0, bell: 0, hop: 0, stage: 0 };
  private deerYaw = 0;
  private bellKick = 0;
  private axe!: THREE.Mesh;
  private lightModel!: THREE.Mesh;
  private torchModel!: THREE.Group;
  private chips: { mesh: THREE.Mesh; v: THREE.Vector3; life: number }[] = [];
  private chipGeo = new THREE.TetrahedronGeometry(0.07, 0);
  private chipMat = new THREE.MeshLambertMaterial({ color: P.PALETTE.chip, flatShading: true });
  private chopKick = 0;
  private feedKick = 0;
  private shakeT = 0;
  private flashT = 0;
  private flashPos = new THREE.Vector3();
  private bob = 0;
  private time = 0;
  private scale = 1;
  private basePixelRatio = 1;
  private frameAvg = 16;
  private slowFor = 0;
  private autoQuality = true;
  lowQuality = false;
  /** Title screen: night hero shot across the fire with the Deer on the trail. */
  titleMode = false;
  settings: ViewSettings = { shake: true, flash: true };
  /** 0..1 screen flash requested by the view (hit, flare); the HUD draws it. */
  hitPulse = 0;
  /** [ideas] Extra meshes and night looks of the gameplay additions (src/render/ideasView.ts). */
  readonly ideas = new IdeasView();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.basePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.woodDouble = woodMaterial();
    this.woodDouble.side = THREE.DoubleSide;

    this.scene.fog = new THREE.Fog(SKY.day.fog, SKY.day.near, SKY.day.far);
    this.scene.add(this.hemi, this.sun, this.sun.target, this.world3d, this.camera);
    this.fireLight.position.set(0, 0.9, 0);
    this.scene.add(this.fireLight, this.flashLight);

    // Sky dome with a two-colour gradient; fog colour matches the horizon band.
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uFog: { value: new THREE.Color() } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader:
        'uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uFog; varying vec3 vDir;\n' +
        'void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 c = mix(uHorizon, uTop, pow(h, 0.55)); c = mix(uFog, c, smoothstep(0.0, 0.16, vDir.y));\n' +
        'gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(120, 20, 10), this.skyMat);
    dome.renderOrder = -10;
    dome.frustumCulled = false;
    this.scene.add(dome);
    this.moon = new THREE.Mesh(new THREE.CircleGeometry(4.2, 20), new THREE.MeshBasicMaterial({ color: '#c9d6e6', fog: false, transparent: true, depthWrite: false }));
    this.moon.position.set(48, 46, -88);
    this.moon.lookAt(0, 0, 0);
    this.moon.renderOrder = -9;
    this.sunDisc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 20), new THREE.MeshBasicMaterial({ color: '#f0a070', fog: false, transparent: true, depthWrite: false }));
    this.sunDisc.position.set(62, 20, -84);
    this.sunDisc.lookAt(0, 0, 0);
    this.sunDisc.renderOrder = -9;
    this.scene.add(this.moon, this.sunDisc);

    this.buildFire();
    this.buildViewModel();
    this.deer.root.visible = false;
    this.scene.add(this.deer.root);

    this.trapGhost = new THREE.Mesh(this.trapGeo, new THREE.MeshBasicMaterial({ color: '#9fe0a0', transparent: true, opacity: 0.55, depthWrite: false }));
    this.trapGhost.visible = false;
    this.scene.add(this.trapGhost);
    this.resize();
  }

  // ------------------------------------------------------------ build

  private buildFire(): void {
    const pit = new THREE.Mesh(P.firePitGeometry(), this.wood);
    this.scene.add(pit);
    const flameGeo = new THREE.ConeGeometry(0.17, 0.62, 4, 1);
    flameGeo.translate(0, 0.31, 0);
    this.flames = new THREE.InstancedMesh(flameGeo, new THREE.MeshBasicMaterial({ fog: false, toneMapped: false }), 8);
    this.flames.frustumCulled = false;
    this.scene.add(this.flames);

    const n = 36;
    const eg = new THREE.BufferGeometry();
    eg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    eg.setAttribute('seed', new THREE.Float32BufferAttribute(Array.from({ length: n }, () => Math.random()), 1));
    this.embers = new THREE.Points(eg, new THREE.PointsMaterial({ color: '#ffb060', size: 0.07, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    this.embers.frustumCulled = false;
    this.scene.add(this.embers);

    // Protection edge: glowing ash ring + sparks, both driven by R(F).
    const rg = new THREE.RingGeometry(0.985, 1.015, 96, 1);
    rg.rotateX(-Math.PI / 2);
    this.ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: P.PALETTE.ember, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    this.ring.position.y = 0.035;
    this.scene.add(this.ring);
    const sn = 150;
    const sg = new THREE.BufferGeometry();
    const sp = new Float32Array(sn * 3);
    for (let i = 0; i < sn; i++) {
      const a = (i / sn) * Math.PI * 2 + Math.random() * 0.03;
      const r = 1 + (Math.random() - 0.5) * 0.04;
      sp[i * 3] = Math.cos(a) * r;
      sp[i * 3 + 1] = 0.05 + Math.random() * 0.02;
      sp[i * 3 + 2] = Math.sin(a) * r;
    }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.ringSparks = new THREE.Points(sg, new THREE.PointsMaterial({ color: P.PALETTE.flame, size: 0.09, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    this.ringSparks.frustumCulled = false;
    this.scene.add(this.ringSparks);
  }

  private buildViewModel(): void {
    const cam = this.camera;
    this.axe = new THREE.Mesh(P.axeGeometry(), this.wood);
    this.axe.scale.setScalar(0.72);
    cam.add(this.axe);
    this.lightModel = new THREE.Mesh(P.flashlightGeometry(), this.wood);
    this.lightModel.scale.setScalar(0.85);
    cam.add(this.lightModel);
    this.torchModel = new THREE.Group();
    this.torchModel.add(new THREE.Mesh(P.torchGeometry(), this.wood));
    const tf = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 4), new THREE.MeshBasicMaterial({ color: '#ffb050', fog: false, toneMapped: false }));
    tf.position.y = 0.5;
    this.torchModel.add(tf);
    cam.add(this.torchModel);

    this.handLight.position.set(0.1, -0.1, 0);
    cam.add(this.handLight);
    this.spot.position.set(-0.21, -0.19, -0.72);
    this.spot.target.position.set(-0.06, -0.5, -7);
    cam.add(this.spot, this.spot.target);
    this.torchLight.position.set(-0.3, 0.2, -0.3);
    cam.add(this.torchLight);

    const bg = new THREE.ConeGeometry(1, 1, 16, 1, true);
    bg.translate(0, -0.5, 0);
    bg.rotateX(Math.PI / 2);
    const bp = bg.getAttribute('position');
    const bc = new Float32Array(bp.count * 3);
    for (let i = 0; i < bp.count; i++) bc.fill(Math.max(0, 1 + bp.getZ(i)) ** 2, i * 3, i * 3 + 3);
    bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
    this.beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: '#b9d2ff', vertexColors: true, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.beam.position.set(-0.21, -0.19, -0.72);
    this.beam.rotation.x = -0.05;
    this.beam.scale.set(1.0, 1.0, 9);
    cam.add(this.beam);
  }

  /** Build the forest for a run (called once per seed). */
  setForest(f: Forest): void {
    const g = this.world3d;
    for (const c of [...g.children]) {
      g.remove(c);
      const m = c as THREE.Mesh;
      if (m.geometry && m.geometry !== this.trapGeo) m.geometry.dispose();
    }
    this.snagMeshes = [];
    this.scrapMeshes = [];
    this.berryMeshes = [];
    this.tags = [];

    // Ground: flat facets, umber on the trails, blue-grey moss elsewhere.
    srand(f.seed + 5);
    const size = 112;
    const seg = 84;
    const plane = new THREE.PlaneGeometry(size, size, seg, seg);
    plane.rotateX(-Math.PI / 2);
    const pp = plane.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pp.count; i++) {
      const x = pp.getX(i) + rr(-0.35, 0.35);
      const z = pp.getZ(i) + rr(-0.35, 0.35);
      const d = Math.hypot(x, z);
      pp.setXYZ(i, x, d < 5 ? rr(-0.02, 0.02) : rr(-0.07, 0.07), z);
    }
    const gb = new Builder();
    gb.add(plane, new THREE.Matrix4(), '#ffffff', 0);
    const cPath = new THREE.Color('#7a5c49');
    const cCamp = new THREE.Color('#7f5d42');
    const cMoss = new THREE.Color('#4c5448');
    const cSlate = new THREE.Color('#525667');
    const tri = new THREE.Color();
    let k = 0;
    gb.tint(0, (x, _y, z, c) => {
      if (k % 3 === 0) {
        const p = { x, z };
        const d = Math.hypot(x, z);
        const dp = distToPaths(p, f.paths);
        tri.copy(rnd() < 0.5 ? cMoss : cSlate);
        if (dp < 2.1) tri.lerp(cPath, 1 - smooth(0.9, 2.1, dp));
        if (d < 7.5) tri.lerp(cCamp, 1 - smooth(5, 7.5, d));
        tri.multiplyScalar(rr(0.82, 1.12));
        if (d > 37) tri.multiplyScalar(0.8);
      }
      k++;
      c.copy(tri);
    });
    const ground = new THREE.Mesh(gb.build(), this.wood);
    g.add(ground);

    // Firs: three instanced silhouettes.
    for (let v = 0; v < 3; v++) {
      const list = f.trees.filter((t) => t.variant === v);
      const im = new THREE.InstancedMesh(P.treeGeometry(v), this.woodDouble, list.length);
      list.forEach((t, i) => {
        const wide = (t.r / 0.042 / t.h) * 0.95;
        tmpM.copy(M(t.x, -0.05, t.z, 0, t.rot, 0, t.h * wide, t.h, t.h * wide));
        im.setMatrixAt(i, tmpM);
      });
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      g.add(im);
    }
    for (let v = 0; v < 2; v++) {
      const list = f.rocks.filter((_, i) => i % 2 === v);
      const im = new THREE.InstancedMesh(P.rockGeometry(v), this.wood, list.length);
      list.forEach((r, i) => {
        tmpM.copy(M(r.x, -0.12, r.z, 0, r.rot, 0, r.r, r.h * 0.8, r.r * (0.8 + ((r.seed % 10) / 10) * 0.35)));
        im.setMatrixAt(i, tmpM);
      });
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      g.add(im);
    }

    // Ferns and red leaf clumps (density drops on low quality).
    const fernN = 620;
    const ferns = new THREE.InstancedMesh(P.fernGeometry(), this.woodDouble, fernN);
    srand(f.seed + 9); // after the geometry, which reseeds internally
    let placed = 0;
    for (let tries = 0; tries < 6000 && placed < fernN; tries++) {
      const a = rnd() * 6.283;
      const r = Math.sqrt(rr(16, 40 * 40));
      const p = { x: Math.cos(a) * r, z: Math.sin(a) * r };
      if (distToPaths(p, f.paths) < 1.1) continue;
      const s = rr(0.7, 1.7);
      tmpM.copy(M(p.x, 0, p.z, 0, rnd() * 6.283, 0, s, s, s));
      ferns.setMatrixAt(placed++, tmpM);
    }
    ferns.count = placed;
    this.fernCount = placed;
    ferns.instanceMatrix.needsUpdate = true;
    ferns.computeBoundingSphere();
    this.ferns = ferns;
    g.add(ferns);

    g.add(new THREE.Mesh(P.deadfallGeometry(RULES.world.radius + 0.4), this.wood));

    const at = <T extends THREE.Object3D>(o: T, x: number, z: number, rot = 0): T => {
      o.position.set(x, 0, z);
      o.rotation.y = rot;
      g.add(o);
      return o;
    };
    at(new THREE.Mesh(P.benchGeometry(), this.wood), f.bench.x, f.bench.z, 0.25);
    at(new THREE.Mesh(P.whiteSnagGeometry(), this.wood), f.whiteSnag.x, f.whiteSnag.z, 0.6);

    f.snags.forEach((n, i) => {
      // The notch (+Z) faces the fire; the first snag faces the spawn point.
      const tx = i === 0 ? f.spawn.x : 0;
      const tz = i === 0 ? f.spawn.z : 0;
      const rot = Math.atan2(tx - n.x, tz - n.z);
      const trunk = at(new THREE.Mesh(P.snagGeometry(i), this.wood), n.x, n.z, rot);
      const stump = at(new THREE.Mesh(P.stumpGeometry(), this.wood), n.x, n.z, rot);
      this.snagMeshes.push({ trunk, stump });
    });
    f.scrap.forEach((n, i) => this.scrapMeshes.push(at(new THREE.Mesh(P.scrapGeometry(i), this.wood), n.x, n.z, n.rot)));
    f.bushes.forEach((n, i) => {
      at(new THREE.Mesh(P.bushGeometry(i), this.wood), n.x, n.z, n.rot);
      this.berryMeshes.push(at(new THREE.Mesh(P.berriesGeometry(i), this.wood), n.x, n.z, n.rot));
    });
    const postGeo = P.postGeometry();
    const tagGeo = P.tagGeometry();
    f.posts.forEach((n) => {
      // The crossbar lies across the trail, so from camp the T is seen broadside with the tag beside it.
      const rot = Math.atan2(n.x, n.z);
      at(new THREE.Mesh(postGeo, this.wood), n.x, n.z, rot);
      const mat = new THREE.MeshLambertMaterial({ color: P.PALETTE.tin, emissive: '#000000', flatShading: true });
      const tag = new THREE.Mesh(tagGeo, mat);
      tag.position.set(n.x + Math.cos(-rot) * 0.38, 1.35, n.z + Math.sin(-rot) * 0.38);
      tag.rotation.y = rot;
      g.add(tag);
      this.tags.push({ mesh: tag, mat });
    });
  }

  // ------------------------------------------------------------ events

  onEvent(e: SimEvent, w: World): void {
    switch (e.type) {
      case 'chopHit': {
        this.chopKick = 1;
        const n = w.forest.snags[e.node];
        const pl = w.state.player;
        const dx = pl.x - n.x;
        const dz = pl.z - n.z;
        const d = Math.hypot(dx, dz) || 1;
        for (let i = 0; i < 3; i++) {
          const mesh = new THREE.Mesh(this.chipGeo, this.chipMat);
          mesh.position.set(n.x + (dx / d) * 0.34, 1.2 + Math.random() * 0.15, n.z + (dz / d) * 0.34);
          mesh.scale.setScalar(0.7 + Math.random() * 0.9);
          this.scene.add(mesh);
          this.chips.push({ mesh, v: new THREE.Vector3((dx / d) * 1.4 + (Math.random() - 0.5) * 2.4, 1.6 + Math.random() * 1.6, (dz / d) * 1.4 + (Math.random() - 0.5) * 2.4), life: 0.9 });
        }
        break;
      }
      case 'feed':
        this.feedKick = 1;
        break;
      case 'hit':
        this.shakeT = 0.45;
        this.hitPulse = 1;
        break;
      case 'flare':
        this.flashT = 0.7;
        this.flashPos.set(e.x, 1.6, e.z);
        break;
      case 'pulse':
        this.flashT = 0.25;
        this.flashPos.copy(this.camera.position);
        break;
      case 'deerStrike':
      case 'deerChime':
        this.bellKick = 1;
        break;
      case 'deerMiss':
        if (e.dist < 2.6) this.shakeT = Math.max(this.shakeT, 0.18);
        break;
    }
  }

  // ------------------------------------------------------------ frame

  resize(): void {
    const c = this.renderer.domElement;
    const w = c.clientWidth || window.innerWidth;
    const h = c.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(this.basePixelRatio * this.scale);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // 85° horizontal field of view at any aspect ratio.
    this.camera.fov = (2 * Math.atan(Math.tan((85 * Math.PI) / 360) / Math.max(this.camera.aspect, 1)) * 180) / Math.PI;
    this.camera.updateProjectionMatrix();
  }

  /** Under load drop internal resolution to 75% and thin the ferns; rules are untouched. */
  private watchFrame(dt: number): void {
    this.frameAvg = lerp(this.frameAvg, dt * 1000, 0.05);
    if (this.lowQuality) return;
    if (!this.autoQuality) return;
    this.slowFor = this.frameAvg > 21 ? this.slowFor + dt : 0;
    if (this.slowFor > 2.5) this.setLowQuality(true);
  }
  /** `manual` = the player's own choice: automatic switching stays off afterwards. */
  setLowQuality(on: boolean, manual = false): void {
    if (manual) this.autoQuality = false;
    this.slowFor = 0;
    this.lowQuality = on;
    this.scale = on ? 0.75 : 1;
    if (this.ferns) this.ferns.count = Math.floor(this.fernCount * (on ? 0.4 : 1));
    this.resize();
  }
  get frameMs(): number {
    return this.frameAvg;
  }

  update(w: World, alpha: number, dt: number, yaw: number, pitch: number): void {
    this.time += dt;
    const t = this.time;
    const s = w.state;
    const pl = s.player;
    this.watchFrame(dt);

    // --- environment
    let target = SKY.day;
    let mix = 0;
    if (s.phase === 'day') {
      target = SKY.night;
      mix = smooth(40, 60, s.t) * 0.9;
    } else if (s.phase === 'night' || s.phase === 'deathOffer' || s.phase === 'end') {
      target = SKY.night;
      mix = 1;
    } else {
      target = SKY.dawn;
      mix = 1;
    }
    const title = this.titleMode;
    if (title) {
      target = SKY.night;
      mix = 1;
    }
    const k = 1 - Math.exp(-dt * (title ? 6 : 1.6));
    const c = this.cur;
    const blend = (cur: THREE.Color, a: THREE.Color, b: THREE.Color) => cur.lerp(tmpC.copy(a).lerp(b, mix), k);
    const base = SKY.day;
    blend(c.top, base.top, target.top);
    blend(c.horizon, base.horizon, target.horizon);
    blend(c.fog, base.fog, target.fog);
    blend(c.hemiSky, base.hemiSky, target.hemiSky);
    blend(c.hemiGround, base.hemiGround, target.hemiGround);
    blend(c.sun, base.sun, target.sun);
    c.near = lerp(c.near, lerp(base.near, target.near, mix), k);
    c.far = lerp(c.far, lerp(base.far, target.far, mix), k);
    c.hemi = lerp(c.hemi, lerp(base.hemi, target.hemi, mix), k);
    c.sunI = lerp(c.sunI, lerp(base.sunI, target.sunI, mix), k);
    c.rim = lerp(c.rim, lerp(base.rim, target.rim, mix), k);
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(c.fog);
    fog.near = c.near;
    fog.far = c.far;
    this.skyMat.uniforms.uTop.value.copy(c.top);
    this.skyMat.uniforms.uHorizon.value.copy(c.horizon);
    this.skyMat.uniforms.uFog.value.copy(c.fog);
    this.hemi.color.copy(c.hemiSky);
    this.hemi.groundColor.copy(c.hemiGround);
    this.hemi.intensity = c.hemi;
    this.sun.color.copy(c.sun);
    this.sun.intensity = c.sunI;
    const night = title ? 1 : s.phase === 'day' ? smooth(46, 60, s.t) : s.phase === 'night' || s.phase === 'deathOffer' || s.phase === 'end' ? 1 : 0;
    this.sun.position.set(lerp(30, 20, night), lerp(14, 30, night), lerp(-40, -38, night));
    (this.moon.material as THREE.MeshBasicMaterial).opacity = night;
    (this.sunDisc.material as THREE.MeshBasicMaterial).opacity = (1 - night) * (s.phase === 'draft' || s.phase === 'victory' ? 0.5 : 0.9);
    this.deer.rim.value.set('#7794a8').multiplyScalar(c.rim);

    // --- fire
    const fuel = s.fuel;
    const R = w.radius;
    const f01 = fuel / RULES.fire.max;
    this.feedKick = Math.max(0, this.feedKick - dt * 1.6);
    const flicker = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 7.3) + this.feedKick * 0.35;
    const lit = fuel > 0 ? (s.bright ? 1 : 0.38) : 0;
    // One fuel value: reach of the light on the ground follows the protection radius.
    this.fireLight.distance = Math.max(4, R * 2.1 + 3);
    this.fireLight.intensity = lit * (10 + 62 * f01) * flicker * lerp(0.55, 1, night);
    this.fireLight.color.set(s.bright ? '#ff9a48' : '#d8582e');
    const flameN = this.flames.count;
    for (let i = 0; i < flameN; i++) {
      const a = (i / flameN) * 6.283;
      const core = i < 3;
      const h = fuel <= 0 ? 0.001 : (core ? 1.25 : 0.8) * (0.35 + f01 * 0.95) * (s.bright ? 1 : 0.5) * (0.82 + 0.3 * Math.sin(t * (9 + i * 1.7) + i * 2.1)) + this.feedKick * 0.4;
      const r = core ? 0.09 : 0.26;
      tmpM.copy(M(Math.cos(a + t * 0.6) * r, 0.14, Math.sin(a + t * 0.6) * r, Math.sin(t * 5 + i) * 0.12, a + t, Math.cos(t * 4 + i) * 0.12, core ? 1.1 : 0.85, h, core ? 1.1 : 0.85));
      this.flames.setMatrixAt(i, tmpM);
      this.flames.setColorAt(i, tmpC.set(core ? '#ffd27a' : i % 2 ? '#ff8a2a' : '#f0622a'));
    }
    this.flames.instanceMatrix.needsUpdate = true;
    if (this.flames.instanceColor) this.flames.instanceColor.needsUpdate = true;
    const ep = this.embers.geometry.getAttribute('position') as THREE.BufferAttribute;
    const es = this.embers.geometry.getAttribute('seed') as THREE.BufferAttribute;
    for (let i = 0; i < ep.count; i++) {
      const sd = es.getX(i);
      const life = (t * (0.28 + sd * 0.3) + sd * 7) % 1;
      const a = sd * 40 + life * 2;
      ep.setXYZ(i, Math.cos(a) * (0.15 + life * 0.5), 0.4 + life * (1.6 + f01 * 2.2), Math.sin(a) * (0.15 + life * 0.5));
    }
    ep.needsUpdate = true;
    (this.embers.material as THREE.PointsMaterial).opacity = fuel > 0 ? (s.bright ? 0.9 : 0.35) : 0;
    // Sparks vanish along the whole circle the moment the fire turns weak.
    this.ring.visible = this.ringSparks.visible = s.bright && R > 0;
    this.ring.scale.set(R, 1, R);
    this.ringSparks.scale.set(R, 1, R);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = (0.3 + 0.5 * night) * (0.75 + 0.25 * Math.sin(t * 3.1));
    (this.ringSparks.material as THREE.PointsMaterial).opacity = (0.35 + 0.65 * night) * (0.6 + 0.4 * Math.sin(t * 9.7));
    this.ringSparks.rotation.y = t * 0.02;

    // --- nodes
    this.snagMeshes.forEach((m, i) => {
      const alive = s.snagLogs[i] > 0;
      m.trunk.visible = alive;
      m.stump.visible = !alive;
      m.trunk.rotation.z = pl.chopNode === i ? Math.sin(t * 40) * 0.012 * this.chopKick : 0;
    });
    this.scrapMeshes.forEach((m, i) => (m.visible = s.scrapLeft[i] > 0));
    this.berryMeshes.forEach((m, i) => (m.visible = s.berryLeft[i] > 0));
    this.tags.forEach((tag, i) => {
      const cache = s.caches.find((cc) => cc.post === i);
      const open = cache?.status === 'open';
      const pending = cache?.status === 'pending' && s.t > cache.openAt - RULES.cache.cueLead;
      const dusk = s.phase === 'day' && s.t > 52;
      tag.mesh.rotation.z = open || pending ? Math.sin(t * 9 + i) * 0.35 : Math.sin(t * 1.3 + i) * 0.05;
      const glow = open ? (cache!.revealed ? 1.5 : 0.55 + 0.45 * Math.sin(t * 8)) : pending ? 0.5 : dusk ? 0.18 + 0.1 * Math.sin(t * 4 + i) : 0.02;
      tag.mat.emissive.set('#9fc4e8').multiplyScalar(glow);
      tag.mesh.visible = cache?.status !== 'claimed';
    });
    while (this.trapMeshes.length < s.traps.length) {
      const m = new THREE.Mesh(this.trapGeo, this.wood);
      this.scene.add(m);
      this.trapMeshes.push(m);
    }
    this.trapMeshes.forEach((m, i) => {
      const tr = s.traps[i];
      m.visible = !!tr;
      if (tr) m.position.set(tr.x, tr.arm > 0 ? 0.08 : 0, tr.z);
    });
    const ghost = w.trapGhost;
    this.trapGhost.visible = !!ghost && pl.trapHold >= 0;
    if (ghost) {
      this.trapGhost.position.set(ghost.x, 0.02, ghost.z);
      (this.trapGhost.material as THREE.MeshBasicMaterial).color.set(ghost.ok ? '#a8e6a0' : '#e07a6a');
    }

    // --- chips
    for (let i = this.chips.length - 1; i >= 0; i--) {
      const ch = this.chips[i];
      ch.life -= dt;
      ch.v.y -= 9.8 * dt;
      ch.mesh.position.addScaledVector(ch.v, dt);
      ch.mesh.rotation.x += dt * 9;
      ch.mesh.rotation.z += dt * 7;
      if (ch.mesh.position.y < 0.03) {
        ch.mesh.position.y = 0.03;
        ch.v.set(0, 0, 0);
      }
      if (ch.life <= 0) {
        this.scene.remove(ch.mesh);
        this.chips.splice(i, 1);
      }
    }

    // --- camera
    const px = lerp(w.prev.px, pl.x, alpha);
    const pz = lerp(w.prev.pz, pl.z, alpha);
    const speed = Math.hypot(pl.x - w.prev.px, pl.z - w.prev.pz) * 30;
    this.bob += dt * speed * 1.9;
    const bobY = Math.sin(this.bob) * 0.035 * Math.min(1, speed / 4);
    this.shakeT = Math.max(0, this.shakeT - dt);
    const sh = this.settings.shake ? this.shakeT * 0.16 : 0;
    const post = w.forest.posts[0];
    const postA = Math.atan2(post.z, post.x);
    if (title) {
      const a = postA + Math.PI + 0.55 + Math.sin(t * 0.11) * 0.22;
      this.camera.position.set(Math.cos(a) * 3.4, 1.75, Math.sin(a) * 3.4);
      // Aim left of the Deer so it stands in the right third, clear of the menu column.
      this.camera.lookAt(Math.cos(postA - 0.5) * 6, 1.9, Math.sin(postA - 0.5) * 6);
    } else {
      this.camera.position.set(px + (Math.random() - 0.5) * sh, RULES.world.eyeHeight + bobY + (Math.random() - 0.5) * sh, pz + (Math.random() - 0.5) * sh);
      this.camera.rotation.set(pitch, yaw, Math.sin(this.bob * 0.5) * 0.006 * Math.min(1, speed / 4) + (this.settings.shake ? this.shakeT * 0.1 * Math.sin(t * 50) : 0), 'YXZ');
    }
    this.hitPulse = Math.max(0, this.hitPulse - dt * 1.8);

    // --- view model
    this.chopKick = Math.max(0, this.chopKick - dt * 3.2);
    const chopping = pl.chop > 0;
    const sw = chopping ? Math.sin(Math.min(1, ((pl.chop % 0.5) / 0.5) * 1.15) * Math.PI) : 0;
    const sway = Math.sin(this.bob) * 0.012;
    this.axe.position.set(0.42 - sw * 0.26 + sway, -0.2 + Math.abs(Math.cos(this.bob)) * 0.012 + sw * 0.06, -0.78 - sw * 0.06);
    this.axe.rotation.set(-0.22 - sw * 0.9, 0.42 + sw * 0.3, -0.16 + sw * 0.8);
    const holdLight = pl.lightOn && !title;
    this.axe.visible = !title;
    this.lightModel.visible = holdLight;
    this.lightModel.position.set(-0.24 + sway, -0.2, -0.55);
    this.lightModel.rotation.set(0.06, -0.22, 0);
    this.torchModel.visible = pl.torch > 0 && !title;
    this.torchModel.position.set(-0.34 + sway, -0.3, -0.5);
    this.torchModel.rotation.set(0.1, 0, 0.12);
    this.torchModel.children[1].scale.setScalar(0.85 + 0.25 * Math.sin(t * 17));
    this.spot.distance = w.mods.beamRange * 1.25;
    this.spot.intensity = holdLight ? 46 * (0.5 + 0.5 * Math.min(1, pl.battery / 12)) : 0;
    this.beam.visible = holdLight && night > 0.3;
    this.torchLight.intensity = pl.torch > 0 ? 9 * (0.85 + 0.15 * Math.sin(t * 15)) : 0;
    this.handLight.intensity = 0.2 + 0.5 * night;
    this.flashT = Math.max(0, this.flashT - dt);
    this.flashLight.intensity = this.flashT > 0 ? 420 * (this.flashT / 0.7) : 0;
    this.flashLight.position.copy(this.flashPos);

    // --- deer
    const d = s.deer;
    const dv = this.deer;
    dv.root.visible = d.mode !== 'hidden' && s.phase !== 'day' && s.phase !== 'draft' && s.phase !== 'victory';
    if (title) {
      // The approved frame: the Bell-stag stands on the trail just beyond the ember ring.
      dv.root.visible = true;
      const r = Math.max(R, 4) + 2.6;
      dv.root.position.set(Math.cos(postA) * r, 0, Math.sin(postA) * r);
      dv.root.rotation.y = Math.atan2(-Math.cos(postA), -Math.sin(postA)) + Math.sin(t * 0.3) * 0.15;
      const p = this.pose;
      p.stage = 0;
      p.gait = 0;
      p.crouch = 0.12 + 0.06 * Math.sin(t * 0.7);
      p.swing = 0;
      p.stun = 0;
      p.hop = 0;
      p.bell = Math.sin(t * 1.7) * 0.12;
      dv.setStage(0);
      dv.apply(p);
    } else if (dv.root.visible) {
      const dx = lerp(w.prev.dx, d.x, alpha);
      const dz = lerp(w.prev.dz, d.z, alpha);
      const moved = Math.hypot(d.x - w.prev.dx, d.z - w.prev.dz) * 30;
      const wantYaw = Math.PI / 2 - d.heading;
      let diff = ((wantYaw - this.deerYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      this.deerYaw += diff * Math.min(1, dt * 9);
      dv.root.position.set(dx, 0, dz);
      dv.root.rotation.y = this.deerYaw;
      const p = this.pose;
      const ease = (cur: number, to: number, rate: number) => cur + (to - cur) * Math.min(1, dt * rate);
      p.stage = w.stage;
      p.walk += dt * moved * 1.55;
      p.gait = ease(p.gait, Math.min(1, moved / 4.4), 8);
      const cue = d.mode === 'cue';
      p.crouch = ease(p.crouch, cue ? 1 : d.mode === 'swing' ? 0.75 : d.mode === 'lunge' ? 0.8 : d.mode === 'hunt' ? 0.22 : d.mode === 'feint' ? 0.12 : 0, cue ? 10 : 7);
      p.swing = d.mode === 'swing' ? Math.min(1, d.timer / RULES.deer.swingSeconds) : ease(p.swing, 0, 8);
      p.stun = ease(p.stun, d.mode === 'stunned' ? 1 : 0, 7);
      // Stage 2: the feint hop — back 2 m, then return to the same edge a second later.
      const hop = d.mode === 'feint' && w.stage >= 1 ? smooth(0, 0.2, d.timer) * (1 - smooth(1, 1.2, d.timer)) * 2 : 0;
      p.hop = ease(p.hop, hop, 14);
      this.bellKick = Math.max(0, this.bellKick - dt * 2.2);
      p.bell = Math.sin(t * 16) * 0.5 * this.bellKick;
      dv.setStage(w.stage);
      dv.apply(p);
    }

    this.ideas.update(w, dt, { scene: this.scene, fog, moon: this.moon, sky: this.skyMat, hemi: this.hemi, night, title }); // [ideas]
    this.renderer.render(this.scene, this.camera);
  }

  get info(): { calls: number; triangles: number } {
    return { calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles };
  }
}
