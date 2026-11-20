// Shared driving helpers for the simulation tests. Not a test file.
import { World, forwardOf } from '../src/sim/world';
import { emptyInput, type Input, type SimEvent } from '../src/sim/types';
import { DT, RULES, TICK_HZ } from '../src/sim/rules';
import type { V2 } from '../src/sim/forest';

export { DT, RULES, TICK_HZ, World, emptyInput, forwardOf };
export type { Input, SimEvent, V2 };

/** Yaw that makes the player face along (fx, fz). */
export const yawTo = (fx: number, fz: number) => Math.atan2(-fx, -fz);
export const hyp = (p: V2) => Math.hypot(p.x, p.z);
export const d2 = (a: V2, b: V2) => Math.hypot(a.x - b.x, a.z - b.z);
export const ticksOf = (seconds: number) => Math.round(seconds * TICK_HZ);

export function distToSeg(p: V2, a: V2, b: V2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const l2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2));
  return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t));
}

/** A world whose day clock is already running (no "first action" needed). */
export function dayWorld(seed = 5, night = 1): World {
  const w = World.start({ seed, night });
  w.state.dayStarted = true;
  return w;
}

/** A world on the first tick of night `night` (t = 0). The Deer is on patrol in the fog. */
export function nightWorld(seed = 5, night = 1): World {
  const w = dayWorld(seed, night);
  const s = w.state;
  s.t = RULES.cycle.daySeconds - DT;
  // Stand in the light for the transition so no threat is collected by accident.
  s.player.x = 1.5;
  s.player.z = 1.5;
  w.step(emptyInput());
  if (s.phase !== 'night') throw new Error('nightWorld: expected night, got ' + s.phase);
  w.drainEvents();
  return w;
}

/** Step `seconds` of simulation with a constant input; returns all events. */
export function run(w: World, seconds: number, input: Input = emptyInput(), each?: (w: World, k: number) => void): SimEvent[] {
  const out: SimEvent[] = [];
  const n = ticksOf(seconds);
  for (let k = 0; k < n; k++) {
    w.step({ ...input });
    for (const e of w.drainEvents()) out.push(e);
    each?.(w, k);
  }
  return out;
}

/** One tick with a patch over the empty input; returns the tick's events. */
export function tick(w: World, patch: Partial<Input> = {}): SimEvent[] {
  w.step({ ...emptyInput(), ...patch });
  return w.drainEvents();
}

/** Step until `pred` holds (checked after every tick). Returns elapsed seconds, or −1 on timeout. */
export function runUntil(
  w: World,
  maxSeconds: number,
  pred: (w: World, events: SimEvent[]) => boolean,
  input: Input | ((w: World) => Input) = emptyInput(),
): number {
  const n = ticksOf(maxSeconds);
  for (let k = 1; k <= n; k++) {
    w.step({ ...(typeof input === 'function' ? input(w) : input) });
    if (pred(w, w.drainEvents())) return k * DT;
  }
  return -1;
}

export const has = (ev: SimEvent[], type: SimEvent['type']) => ev.some((e) => e.type === type);
export const count = (ev: SimEvent[], type: SimEvent['type']) => ev.filter((e) => e.type === type).length;

export function place(w: World, p: V2): void {
  w.state.player.x = p.x;
  w.state.player.z = p.z;
}

/** Input that looks from the player's current position at `target`. */
export function lookAt(w: World, target: V2, patch: Partial<Input> = {}): Input {
  const pl = w.state.player;
  return { ...emptyInput(), yaw: yawTo(target.x - pl.x, target.z - pl.z), ...patch };
}

/** Teleport next to the fire, looking at it (inside the bright circle whenever it is bright). */
export function atFire(w: World, patch: Partial<Input> = {}): Input {
  place(w, { x: 1.5, z: 1.5 });
  return lookAt(w, { x: 0, z: 0 }, patch);
}

/** Teleport `gap` metres from a node, on the side facing the fire, looking at it. */
export function standAt(w: World, node: V2, gap = 1.2, patch: Partial<Input> = {}): Input {
  const r = hyp(node) || 1;
  place(w, { x: node.x - (node.x / r) * gap, z: node.z - (node.z / r) * gap });
  return lookAt(w, node, patch);
}

export function segClear(w: World, a: V2, b: V2, margin: number, sightOnly = false): boolean {
  for (const o of w.forest.obstacles) {
    if (sightOnly && !o.sight) continue;
    if (distToSeg(o, a, b) < o.r + margin) return false;
  }
  return true;
}

export interface Lane {
  a: V2;
  b: V2;
  dir: V2;
  yaw: number;
  len: number;
}

/**
 * A straight segment of `len` metres with no obstacle closer than `margin` to it
 * (measured from the obstacle surface), staying between minR and maxR from the fire.
 */
export function findLane(w: World, len: number, margin: number, minR = 9.5, maxR = 33, sightOnly = false): Lane {
  for (let r = minR; r <= maxR; r += 0.5)
    for (let ad = 0; ad < 360; ad += 4)
      for (let hd = 0; hd < 360; hd += 15) {
        const a = { x: Math.cos((ad * Math.PI) / 180) * r, z: Math.sin((ad * Math.PI) / 180) * r };
        const dir = { x: Math.cos((hd * Math.PI) / 180), z: Math.sin((hd * Math.PI) / 180) };
        const b = { x: a.x + dir.x * len, z: a.z + dir.z * len };
        if (hyp(b) > maxR || distToSeg({ x: 0, z: 0 }, a, b) < minR) continue;
        if (!segClear(w, a, b, margin, sightOnly)) continue;
        return { a, b, dir, yaw: yawTo(dir.x, dir.z), len };
      }
  throw new Error(`findLane: no lane of ${len} m with margin ${margin} for seed ${w.state.seed}`);
}

/** A point with no obstacle surface within `clear` metres, between minR and maxR from the fire. */
export function findOpen(w: World, clear: number, minR = 11, maxR = 30): V2 {
  for (let r = minR; r <= maxR; r += 0.5)
    for (let ad = 0; ad < 360; ad += 3) {
      const p = { x: Math.cos((ad * Math.PI) / 180) * r, z: Math.sin((ad * Math.PI) / 180) * r };
      if (w.forest.obstacles.every((o) => d2(o, p) >= o.r + clear)) return p;
    }
  throw new Error(`findOpen: no open ground of ${clear} m for seed ${w.state.seed}`);
}

/** Park the Deer so that it takes no part in a test (night loot, fire, etc.). */
export function hideDeer(w: World): void {
  w.state.deer.mode = 'hidden';
}

/** Put the Deer into a mode at a position, with clean timers. */
export function setDeer(w: World, mode: World['state']['deer']['mode'], p: V2, patch: Partial<World['state']['deer']> = {}): void {
  const d = w.state.deer;
  d.mode = mode;
  d.x = p.x;
  d.z = p.z;
  d.timer = 0;
  d.sinceSwing = 9;
  d.sinceManeuver = 9;
  d.maneuver = 'none';
  d.maneuverUsed = false;
  d.secondCue = false;
  d.chargeLeft = 0;
  d.detour = null;
  d.path = [];
  d.lastKnown = null;
  d.lostT = 0;
  d.threat = 0;
  d.stunLeft = 0;
  Object.assign(d, patch);
}

export function finite(...v: number[]): boolean {
  return v.every((x) => Number.isFinite(x));
}

/** Snapshot used to compare two worlds; runId holds a wall-clock stamp and is ignored. */
export function snapshot(w: World): string {
  w.syncRng();
  return JSON.stringify({ ...w.state, runId: '' });
}

/**
 * Fast-forward to the end of the current phase and take the transition tick:
 * day → night, night → draft/victory. The player waits at a full fire and the
 * Deer is parked, so nothing else happens on the way.
 */
export function skipPhase(w: World): SimEvent[] {
  const s = w.state;
  const out: SimEvent[] = [];
  if (s.phase !== 'day' && s.phase !== 'night') throw new Error('skipPhase: not in an active phase');
  s.dayStarted = true;
  const from = s.phase;
  s.fuel = Math.max(s.fuel, 60);
  s.bright = true;
  if (from === 'night') hideDeer(w);
  s.t = (from === 'day' ? RULES.cycle.daySeconds : RULES.cycle.nightSeconds) - 2 * DT;
  const i = atFire(w);
  for (let k = 0; k < 6 && s.phase === from; k++) {
    w.step({ ...i });
    out.push(...w.drainEvents());
  }
  if (s.phase === from) throw new Error('skipPhase: phase did not change');
  return out;
}

/** Day → night → dawn in two jumps; ends in 'draft' (or 'victory' after night 99). */
export function skipToDawn(w: World): SimEvent[] {
  const out: SimEvent[] = [];
  if (w.state.phase === 'day') out.push(...skipPhase(w));
  out.push(...skipPhase(w));
  return out;
}

/** Paths of all numbers in a state tree that are NaN or ±Infinity. */
export function nonFinite(obj: unknown, path = 'state'): string[] {
  if (typeof obj === 'number') return Number.isFinite(obj) ? [] : [path];
  if (obj === null || typeof obj !== 'object') return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) out.push(...nonFinite(v, `${path}.${k}`));
  return out;
}
