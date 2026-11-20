// Authored assets (GLB models, the card icon sheet) live in src/assets and are
// bundled only when the file exists. Every caller keeps its procedural
// fallback, so the game still runs with an empty assets folder.

import * as THREE from 'three';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const glbUrls = import.meta.glob('../assets/*.glb', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const imgUrls = import.meta.glob('../assets/*.{webp,png}', { query: '?url', import: 'default', eager: true }) as Record<string, string>;

export function modelUrl(name: string): string | null {
  return glbUrls[`../assets/${name}.glb`] ?? null;
}
export function imageUrl(file: string): string | null {
  return imgUrls[`../assets/${file}`] ?? null;
}

let loader: GLTFLoader | null = null;

/** Load a bundled GLB; resolves to null when the asset is not part of the build or fails to parse. */
export function loadModel(name: string): Promise<GLTF | null> {
  const url = modelUrl(name);
  if (!url) return Promise.resolve(null);
  loader ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return new Promise((resolve) => loader!.load(url, resolve, undefined, () => resolve(null)));
}

/**
 * Generated meshes arrive with PBR materials and baked colour textures. The
 * scene is lit with cheap Lambert lights, so swap every material for a Lambert
 * one that keeps the texture and reacts to the fire, the moon and the fog.
 */
export function toLambert(root: THREE.Object3D, opts: { flat?: boolean; tint?: THREE.ColorRepresentation } = {}): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
    const map = src.map ?? null;
    if (map) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 4;
    }
    mesh.material = new THREE.MeshLambertMaterial({
      map,
      color: opts.tint ?? (map ? '#ffffff' : src.color),
      flatShading: opts.flat ?? false,
      vertexColors: !!mesh.geometry.getAttribute('color') && !map,
    });
    mesh.frustumCulled = !(mesh as THREE.SkinnedMesh).isSkinnedMesh;
  });
}

/** Scale and recentre a model so its bounding box has the given height and sits on y = 0. */
export function fitHeight(root: THREE.Object3D, height: number): void {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const k = height / (size.y || 1);
  root.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(root);
  const c = b2.getCenter(new THREE.Vector3());
  root.position.x -= c.x;
  root.position.z -= c.z;
  root.position.y -= b2.min.y;
}

export interface Fit {
  scale: number;
  position: [number, number, number];
  /** Euler angles in radians, order YXZ. */
  rotation: [number, number, number];
}

/**
 * Replace a procedural mesh with a bundled model: the host keeps its place in
 * the scene graph (and every animation applied to it), its own geometry is
 * emptied and the model rides along as a child. Without the asset nothing changes.
 */
export async function upgradeMesh(host: THREE.Mesh, name: string, fit: Fit, opts: { flat?: boolean } = {}): Promise<THREE.Object3D | null> {
  const gltf = await loadModel(name);
  if (!gltf) return null;
  const model = gltf.scene;
  toLambert(model, opts);
  model.scale.setScalar(fit.scale);
  model.position.set(...fit.position);
  model.rotation.set(fit.rotation[0], fit.rotation[1], fit.rotation[2], 'YXZ');
  host.geometry.dispose();
  host.geometry = new THREE.BufferGeometry();
  host.add(model);
  return model;
}
