// Static prop geometry: trees, rocks, snags, posts, fire pit, bench, tools.

import * as THREE from 'three';
import { Builder, M, rnd, rr, srand } from './geo';

export const PALETTE = {
  needle: '#495442',
  needleDark: '#36413a',
  trunk: '#6b3d2d',
  chip: '#d7b887',
  rock: '#666a78',
  moss: '#59664d',
  bark: '#5b4a40',
  post: '#5a4233',
  tin: '#b9c6cf',
  rust: '#7d4a33',
  steel: '#7c8792',
  berry: '#c23b34',
  leaf: '#8a3f2c',
  ember: '#bf532f',
  flame: '#ffc56f',
};

/** Unit-height fir (scale by tree height). Three silhouettes share one material. */
export function treeGeometry(variant: number): THREE.BufferGeometry {
  srand(900 + variant * 17);
  const b = new Builder();
  const trunk = new THREE.CylinderGeometry(0.01, 0.042, 1, 6, 1);
  b.add(trunk, M(0, 0.5, 0), PALETTE.trunk, 0.16);
  const tiers = [6, 7, 5][variant];
  const start = [0.34, 0.3, 0.44][variant];
  const spread = [0.15, 0.185, 0.13][variant];
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const y = start + (0.9 - start) * t;
    const rad = (spread - (spread - 0.035) * t) * rr(0.88, 1.12);
    const h = 0.2 - 0.07 * t;
    // Open cones: no flat black underside when seen from the ground.
    const cone = new THREE.ConeGeometry(rad, h, 7, 1, true);
    b.add(cone, M(rr(-0.008, 0.008), y + h * 0.5, rr(-0.008, 0.008), rr(-0.07, 0.07), rnd() * 6.28, rr(-0.07, 0.07)), i % 2 ? PALETTE.needle : PALETTE.needleDark, 0.18);
  }
  b.add(new THREE.ConeGeometry(0.03, 0.12, 5, 1, true), M(0, 1.0, 0), PALETTE.needle, 0.1);
  // A few dead stubs under the canopy.
  for (let i = 0; i < 3; i++) {
    const a = rnd() * 6.28;
    const len = rr(0.04, 0.08);
    b.add(new THREE.CylinderGeometry(0.002, 0.007, len, 4, 1), M(Math.sin(a) * 0.03, rr(0.16, start), Math.cos(a) * 0.03, 1.3, a, 0).multiply(M(0, len / 2, 0)), '#3d2a22', 0.1);
  }
  return b.build();
}

export function rockGeometry(variant: number): THREE.BufferGeometry {
  srand(300 + variant * 31);
  const g = new THREE.IcosahedronGeometry(1, variant === 0 ? 0 : 1).toNonIndexed();
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  // Deform by direction so shared corners stay welded.
  const bump = (x: number, y: number, z: number) => 0.78 + 0.34 * Math.abs(Math.sin(x * 3.1 + variant) * Math.cos(z * 2.7 + y * 1.9));
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = bump(x, y, z);
    p.setXYZ(i, x * k, Math.max(-0.25, y * k * 0.95) + 0.25, z * k);
  }
  const b = new Builder();
  b.add(g, new THREE.Matrix4(), PALETTE.rock, 0.14);
  b.tint(0, (_x, y, _z, c) => {
    if (y > 0.75) c.lerp(new THREE.Color(PALETTE.moss), 0.55);
  });
  return b.build();
}

/** Dead pine with a pale notch on its +Z side and broken branch stubs. */
export function snagGeometry(seed: number): THREE.BufferGeometry {
  srand(700 + seed * 13);
  const b = new Builder();
  const lean = rr(-0.06, 0.06);
  b.add(new THREE.CylinderGeometry(0.13, 0.3, 5.6, 6, 3), M(0, 2.8, 0, lean, rnd() * 6, lean * 0.5), PALETTE.bark, 0.2);
  // Splintered pale top.
  for (let i = 0; i < 4; i++) b.box(0.05, rr(0.3, 0.6), 0.05, M(rr(-0.07, 0.07), 5.7, rr(-0.07, 0.07), rr(-0.2, 0.2), 0, rr(-0.2, 0.2)), PALETTE.chip, 0.1);
  for (let i = 0; i < 6; i++) {
    const a = rnd() * 6.28;
    const y = rr(2.2, 5);
    const len = rr(0.5, 1.1);
    const g = new THREE.CylinderGeometry(0.012, 0.05, len, 4, 1);
    b.add(g, M(Math.sin(a) * 0.2, y, Math.cos(a) * 0.2, 1.15, a, 0).multiply(M(0, len / 2, 0)), PALETTE.bark, 0.2);
  }
  // Fresh V-cut: the target for the axe.
  b.box(0.3, 0.11, 0.16, M(0, 1.3, 0.185, 0.6, 0, 0), PALETTE.chip, 0.05);
  b.box(0.3, 0.11, 0.16, M(0, 1.14, 0.185, -0.6, 0, 0), PALETTE.chip, 0.05);
  b.box(0.26, 0.05, 0.1, M(0, 1.22, 0.2), '#b9945f', 0.05);
  for (let i = 0; i < 5; i++) b.box(0.1, 0.02, 0.06, M(rr(-0.5, 0.5), 0.02, rr(0.35, 0.9), 0, rnd() * 3, 0), PALETTE.chip, 0.1);
  return b.build();
}

export function stumpGeometry(): THREE.BufferGeometry {
  srand(55);
  const b = new Builder();
  b.add(new THREE.CylinderGeometry(0.26, 0.32, 0.5, 6, 1), M(0, 0.25, 0), PALETTE.bark, 0.2);
  b.add(new THREE.CylinderGeometry(0.25, 0.25, 0.03, 6, 1), M(0, 0.51, 0), PALETTE.chip, 0.08);
  for (let i = 0; i < 3; i++) b.box(0.05, rr(0.15, 0.35), 0.04, M(rr(-0.15, 0.15), 0.6, rr(-0.15, 0.15), rr(-0.3, 0.3), 0, rr(-0.3, 0.3)), PALETTE.chip, 0.1);
  for (let i = 0; i < 7; i++) b.box(0.12, 0.025, 0.07, M(rr(-0.8, 0.8), 0.02, rr(-0.8, 0.8), 0, rnd() * 3, 0), PALETTE.chip, 0.1);
  return b.build();
}

export function postGeometry(): THREE.BufferGeometry {
  srand(81);
  const b = new Builder();
  b.box(0.17, 1.75, 0.17, M(0, 0.875, 0, 0, 0.2, 0.02), PALETTE.post, 0.18);
  b.box(0.8, 0.14, 0.15, M(0.12, 1.6, 0, 0, 0, 0.03), PALETTE.post, 0.18);
  b.box(0.3, 0.08, 0.1, M(0.2, 1.42, 0, 0, 0, 0.75), '#4a3529', 0.1);
  b.box(0.015, 0.2, 0.015, M(0.38, 1.44, 0), '#22252b', 0);
  return b.build();
}

export function tagGeometry(): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(0.15, 0.22, 0.012);
  g.translate(0, -0.11, 0);
  return g;
}

export function benchGeometry(): THREE.BufferGeometry {
  srand(21);
  const b = new Builder();
  b.box(1.15, 0.08, 0.5, M(0, 0.78, 0), '#7a5a3c', 0.12);
  for (const [x, z] of [
    [-0.48, -0.18],
    [0.48, -0.18],
    [-0.48, 0.18],
    [0.48, 0.18],
  ])
    b.box(0.08, 0.76, 0.08, M(x, 0.38, z, 0, 0, x > 0 ? -0.06 : 0.06), '#5d4330', 0.12);
  b.box(1, 0.05, 0.06, M(0, 0.3, -0.18), '#5d4330', 0.1);
  b.box(0.22, 0.12, 0.16, M(0.25, 0.88, 0.02, 0, 0.4, 0), PALETTE.steel, 0.1);
  b.box(0.3, 0.05, 0.05, M(-0.2, 0.85, 0.08, 0, -0.5, 0), PALETTE.rust, 0.1);
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 6), M(-0.3, 0.14, 0.35, 0, 0, 1.57), PALETTE.trunk, 0.1);
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 6), M(-0.3, 0.14, 0.5, 0, 0.2, 1.57), PALETTE.trunk, 0.1);
  return b.build();
}

export function firePitGeometry(): THREE.BufferGeometry {
  srand(33);
  const b = new Builder();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.283;
    const g = new THREE.DodecahedronGeometry(rr(0.14, 0.2), 0);
    b.add(g, M(Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62, rnd(), rnd() * 6, rnd(), 1, 0.75, 1), '#5a5560', 0.14);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.283 + 0.3;
    b.box(0.12, 0.7, 0.12, M(Math.cos(a) * 0.2, 0.3, Math.sin(a) * 0.2, 0, -a, 0).multiply(M(0, 0, 0, 0, 0, 0.72)), '#4a2e1f', 0.2);
  }
  b.box(0.13, 0.13, 0.8, M(0, 0.08, 0, 0, 0.6, 0), '#3d2519', 0.2);
  return b.build();
}

export function scrapGeometry(seed: number): THREE.BufferGeometry {
  srand(600 + seed);
  const b = new Builder();
  for (let i = 0; i < 9; i++)
    b.box(rr(0.12, 0.42), rr(0.03, 0.09), rr(0.08, 0.2), M(rr(-0.3, 0.3), rr(0.03, 0.26), rr(-0.3, 0.3), rr(-0.4, 0.4), rnd() * 6, rr(-0.4, 0.4)), i % 3 ? PALETTE.rust : PALETTE.steel, 0.2);
  b.add(new THREE.TorusGeometry(0.16, 0.025, 4, 7), M(0.1, 0.2, 0.05, 1.2, 0, 0.4), PALETTE.steel, 0.15);
  return b.build();
}

export function bushGeometry(seed: number): THREE.BufferGeometry {
  srand(500 + seed);
  const b = new Builder();
  for (let i = 0; i < 7; i++) {
    const a = rnd() * 6.28;
    const r = rr(0.05, 0.35);
    b.add(new THREE.OctahedronGeometry(rr(0.2, 0.32), 0), M(Math.cos(a) * r, rr(0.25, 0.6), Math.sin(a) * r, rnd(), rnd() * 6, rnd(), 1, 0.7, 1), i % 2 ? PALETTE.leaf : '#6d3527', 0.2);
  }
  for (let i = 0; i < 4; i++) b.box(0.03, 0.5, 0.03, M(rr(-0.2, 0.2), 0.25, rr(-0.2, 0.2), rr(-0.3, 0.3), 0, rr(-0.3, 0.3)), '#3a2a24', 0.1);
  return b.build();
}

export function berriesGeometry(seed: number): THREE.BufferGeometry {
  srand(520 + seed);
  const b = new Builder();
  for (let i = 0; i < 9; i++) {
    const a = rnd() * 6.28;
    const r = rr(0.2, 0.42);
    b.add(new THREE.OctahedronGeometry(0.05, 0), M(Math.cos(a) * r, rr(0.35, 0.8), Math.sin(a) * r), PALETTE.berry, 0.1);
  }
  return b.build();
}

export function fernGeometry(): THREE.BufferGeometry {
  srand(71);
  const b = new Builder();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.283 + rr(-0.3, 0.3);
    const g = new THREE.BufferGeometry();
    const len = rr(0.28, 0.5);
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.07, 0, 0, 0.07, 0, 0, 0, len * 0.5, len], 3));
    b.add(g, M(0, 0.02, 0, 0, a, 0), i % 2 ? PALETTE.leaf : '#9a5a34', 0.2);
  }
  return b.build();
}

export function trapGeometry(): THREE.BufferGeometry {
  srand(91);
  const b = new Builder();
  b.add(new THREE.TorusGeometry(0.34, 0.03, 4, 10), M(0, 0.05, 0, Math.PI / 2, 0, 0), '#5c626b', 0.1);
  b.box(0.2, 0.03, 0.2, M(0, 0.04, 0, 0, 0.78, 0), '#7c8792', 0.1);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 6.283;
    b.add(new THREE.ConeGeometry(0.035, 0.14, 3), M(Math.cos(a) * 0.34, 0.12, Math.sin(a) * 0.34, 0, -a, 0.35), '#8d98a3', 0.1);
  }
  return b.build();
}

/** First-person axe with a blocky bare hand (reference 01 / concept frame). */
export function axeGeometry(): THREE.BufferGeometry {
  srand(13);
  const b = new Builder();
  b.box(0.05, 0.72, 0.06, M(0, 0.1, 0), '#a8703c', 0.1);
  b.box(0.05, 0.12, 0.062, M(0, -0.2, 0), '#7c4f2a', 0.06);
  // Iron wedge: red-painted cheek, bare steel edge.
  b.box(0.2, 0.17, 0.05, M(-0.1, 0.4, 0), '#8f3a2c', 0.1);
  b.box(0.07, 0.22, 0.045, M(-0.22, 0.4, 0, 0, 0, 0.05), '#a84a34', 0.08);
  b.box(0.035, 0.25, 0.03, M(-0.265, 0.4, 0), '#c9c2b8', 0.04);
  b.box(0.07, 0.13, 0.07, M(0.02, 0.4, 0), '#6d2c22', 0.08);
  // Fist and sleeve.
  b.box(0.1, 0.12, 0.13, M(0.005, -0.08, 0.02), '#c98b62', 0.08);
  for (let i = 0; i < 4; i++) b.box(0.07, 0.027, 0.05, M(-0.03, -0.035 - i * 0.03, 0.07), '#b97c56', 0.06);
  b.box(0.035, 0.07, 0.05, M(0.05, -0.04, 0.06, 0, 0, 0.5), '#b97c56', 0.06);
  b.box(0.12, 0.13, 0.46, M(0.03, -0.12, 0.34, -0.25, 0.1, 0), '#3c3a47', 0.1);
  return b.build();
}

export function flashlightGeometry(): THREE.BufferGeometry {
  srand(17);
  const b = new Builder();
  b.add(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 7), M(0, 0, 0, Math.PI / 2, 0, 0), '#2b2d33', 0.1);
  b.add(new THREE.CylinderGeometry(0.055, 0.04, 0.08, 7), M(0, 0, -0.14, Math.PI / 2, 0, 0), '#3a3d45', 0.1);
  b.box(0.11, 0.1, 0.12, M(0, -0.03, 0.06), '#c98b62', 0.08);
  b.box(0.12, 0.12, 0.4, M(0.01, -0.08, 0.33, -0.2, -0.1, 0), '#3c3a47', 0.1);
  return b.build();
}

export function torchGeometry(): THREE.BufferGeometry {
  srand(19);
  const b = new Builder();
  b.box(0.045, 0.5, 0.045, M(0, 0.05, 0), '#6b4a30', 0.1);
  b.box(0.08, 0.14, 0.08, M(0, 0.33, 0), '#2a1c16', 0.1);
  b.box(0.1, 0.11, 0.12, M(0, -0.12, 0.02), '#c98b62', 0.08);
  b.box(0.12, 0.12, 0.4, M(0.01, -0.17, 0.3, -0.25, -0.1, 0), '#3c3a47', 0.1);
  return b.build();
}

/** Ring of deadfall just outside the play disc: seen before it is touched. */
export function deadfallGeometry(radius: number): THREE.BufferGeometry {
  srand(4242);
  const b = new Builder();
  const n = 64;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + rr(-0.03, 0.03);
    const r = radius + rr(0.2, 1.6);
    const len = rr(3.5, 6.5);
    const g = new THREE.CylinderGeometry(0.1, 0.22, len, 5, 1);
    b.add(g, M(Math.cos(a) * r, rr(0.25, 0.9), Math.sin(a) * r, rr(1.1, 1.5), -a + rr(-0.6, 0.6), rr(-0.2, 0.2)), i % 4 ? '#4a3a33' : '#8f8674', 0.2);
    if (i % 2 === 0) {
      const g2 = new THREE.CylinderGeometry(0.03, 0.09, 2.2, 4, 1);
      b.add(g2, M(Math.cos(a) * r, 1.1, Math.sin(a) * r, rr(-0.5, 0.5), rnd() * 6, rr(-0.5, 0.5)), '#3d302b', 0.2);
    }
  }
  return b.build();
}

export function whiteSnagGeometry(): THREE.BufferGeometry {
  srand(61);
  const b = new Builder();
  const pale = '#cfc8b8';
  b.add(new THREE.CylinderGeometry(0.3, 0.45, 2.6, 6, 2), M(0, 1.3, 0, 0.05, 0, -0.04), pale, 0.1);
  for (let i = 0; i < 6; i++) b.box(0.09, rr(0.4, 1), 0.07, M(rr(-0.2, 0.2), 2.8, rr(-0.2, 0.2), rr(-0.25, 0.25), 0, rr(-0.25, 0.25)), '#e2dccd', 0.08);
  b.add(new THREE.CylinderGeometry(0.22, 0.3, 4.2, 6, 1), M(1.9, 0.3, 0.9, 0, 0.5, 1.5), pale, 0.12);
  b.add(new THREE.CylinderGeometry(0.1, 0.14, 1.6, 5, 1), M(0.8, 0.18, -0.7, 0, -0.7, 1.52), '#bdb5a3', 0.12);
  return b.build();
}
