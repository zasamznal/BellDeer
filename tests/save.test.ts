// Save / load and determinism (GDD §7 "Сохранения", "Консистентность").
// The contract: serialize → JSON → new World(json) continues exactly like the
// original under the same inputs, in every phase, including all RNG streams.
import { describe, expect, it } from 'vitest';
import { canReroll, pickCard, reroll } from '../src/sim/draft';
import { Rng } from '../src/sim/rng';
import { CONTENT_VERSION, GEN_VERSION } from '../src/sim/rules';
import {
  World,
  dayWorld,
  emptyInput,
  findOpen,
  hyp,
  nightWorld,
  nonFinite,
  place,
  setDeer,
  skipToDawn,
  snapshot,
  tick,
  type Input,
  type SimEvent,
} from './helpers';

const reload = (w: World): World => new World(JSON.parse(JSON.stringify(w.serialize())));

/**
 * A deterministic stream of "player" inputs that wanders around, sprints,
 * chops, feeds, sets traps, toggles the light and so on. It does not look at
 * the world, so two worlds can be fed the very same sequence.
 */
function script(seed: number, n: number): Input[] {
  const r = new Rng(seed);
  const out: Input[] = [];
  let yaw = r.range(-3, 3);
  let mz = 1;
  let mx = 0;
  let sprint = false;
  let chop = 0;
  let hold = 0;
  for (let k = 0; k < n; k++) {
    yaw += r.range(-0.12, 0.12);
    if (r.next() < 0.03) yaw += r.range(-2, 2);
    if (r.next() < 0.05) mz = r.pick([1, 1, 1, 0, -1]);
    if (r.next() < 0.05) mx = r.pick([0, 0, 1, -1]);
    if (r.next() < 0.04) sprint = !sprint;
    if (chop > 0) chop--;
    else if (r.next() < 0.01) chop = 75;
    if (hold > 0) hold--;
    else if (r.next() < 0.01) hold = 30;
    out.push({
      ...emptyInput(),
      yaw,
      pitch: -0.2,
      mx,
      mz,
      sprint,
      chop: chop > 0,
      trapHold: hold > 0,
      interact: r.next() < 0.08,
      eat: r.next() < 0.004,
      light: r.next() < 0.006,
      torch: r.next() < 0.002,
      flare: r.next() < 0.002,
      pulse: r.next() < 0.01,
      craft: r.next() < 0.03 ? (r.pick([1, 2, 3]) as 1 | 2 | 3) : 0,
    });
  }
  return out;
}

/** Feed the same inputs to both worlds and require identical state and events at every check. */
function expectLockstep(a: World, b: World, inputs: Input[], every = 30): void {
  expect(snapshot(b)).toBe(snapshot(a));
  for (let k = 0; k < inputs.length; k++) {
    a.step({ ...inputs[k] });
    b.step({ ...inputs[k] });
    const ea = a.drainEvents();
    const eb = b.drainEvents();
    if (ea.length || eb.length) expect(eb).toEqual(ea);
    if (k % every === every - 1 || k === inputs.length - 1) {
      const sa = snapshot(a);
      const sb = snapshot(b);
      if (sa !== sb) expect(JSON.parse(sb), `diverged at tick ${k + 1}`).toEqual(JSON.parse(sa));
    }
  }
}

function stock(w: World): World {
  const pl = w.state.player;
  pl.logs = 4;
  pl.scrap = 8;
  pl.berries = 2;
  pl.traps = 1;
  pl.flares = 2;
  return w;
}

describe('save contents', () => {
  it('carries everything the GDD lists and bumps the revision on every write', () => {
    const w = stock(nightWorld(77));
    w.state.cards = ['C01', 'R03'];
    w.refreshMods();
    for (const i of script(1, 300)) w.step(i);
    const a = w.serialize();
    const b = w.serialize();
    expect(b.revision).toBe(a.revision + 1);
    expect(b.runId).toBe(a.runId);
    expect(a.seed).toBe(77);
    expect(a.genVersion).toBe(GEN_VERSION);
    expect(a.contentVersion).toBe(CONTENT_VERSION);
    for (const key of [
      'phase',
      'night',
      't',
      'player',
      'fuel',
      'bright',
      'deer',
      'snagLogs',
      'scrapLeft',
      'berryLeft',
      'traps',
      'caches',
      'cards',
      'hand',
      'supplyRest',
      'rerollChapter',
      'reviveUsed',
      'stats',
      'rng',
    ])
      expect(a, key).toHaveProperty(key);
    expect(Object.keys(a.rng).sort()).toEqual(['cards', 'loot', 'threat']);
    for (const key of ['x', 'z', 'hp', 'stamina', 'battery', 'logs', 'scrap', 'berries', 'traps', 'flares', 'tags']) expect(a.player).toHaveProperty(key);
    // The snapshot is detached from the live state.
    w.state.player.hp = 1;
    expect(a.player.hp).not.toBe(1);
    // JSON-safe: no NaN / Infinity anywhere in the live state (they would be saved as null).
    expect(nonFinite(w.state)).toEqual([]);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });

  it('two revisions of a busy mid-night save stay far below 128 KB', () => {
    const w = stock(nightWorld(77));
    for (const i of script(2, 900)) w.step(i);
    const bytes = new TextEncoder().encode(JSON.stringify(w.serialize())).length;
    expect(bytes * 2).toBeLessThan(128 * 1024);
  });

  it('the forest is rebuilt identically from the saved seed', () => {
    const w = dayWorld(123);
    const c = reload(w);
    expect(c.forest.obstacles).toEqual(w.forest.obstacles);
    expect(c.forest.snags).toEqual(w.forest.snags);
    expect(c.forest.posts).toEqual(w.forest.posts);
    expect(c.forest.spawn).toEqual(w.forest.spawn);
    expect(Array.from(c.forest.nav.blocked)).toEqual(Array.from(w.forest.nav.blocked));
  });

  it('RNG stream positions are restored', () => {
    const w = stock(nightWorld(77));
    for (const i of script(3, 600)) w.step(i);
    const c = reload(w);
    expect(c.rngLoot.state).toBe(w.rngLoot.state);
    expect(c.rngThreat.state).toBe(w.rngThreat.state);
    expect(c.rngCards.state).toBe(w.rngCards.state);
    expect(c.rngThreat.next()).toBe(w.rngThreat.next());
    expect(c.mods).toEqual(w.mods);
  });
});

describe('save → load → continue is identical to never saving', () => {
  it('by day, in the middle of chopping and walking', () => {
    const a = stock(World.start({ seed: 77 }));
    const pre = script(10, 200);
    pre[0].chop = true; // first action starts the clock
    for (const i of pre) a.step(i);
    a.drainEvents();
    expect(a.state.phase).toBe('day');
    const b = reload(a);
    // The rest of the day and well into the night.
    expectLockstep(a, b, script(11, 2400));
    expect(a.state.phase).toBe('night');
  });

  it('at night with an active hunt', () => {
    const a = stock(nightWorld(77));
    const s = a.state;
    s.t = 25; // first cache is open
    const p = findOpen(a, 4.5, 15, 28);
    place(a, p);
    s.player.hp = 100;
    s.traps.push({ id: 1, x: p.x * 0.8, z: p.z * 0.8, arm: 0 });
    setDeer(a, 'hunt', { x: p.x + (p.x / hyp(p)) * 9, z: p.z + (p.z / hyp(p)) * 9 }, { threat: 60, lastKnown: { ...p } });
    for (let k = 0; k < 20; k++) tick(a);
    expect(s.deer.mode).toBe('hunt');
    expect(s.caches.some((c) => c.status === 'open')).toBe(true);
    const b = reload(a);
    expect(b.state.deer).toEqual(s.deer);
    expectLockstep(a, b, script(12, 1200), 10);
  });

  it('in the middle of a swing windup', () => {
    const a = nightWorld(77);
    const s = a.state;
    s.t = 40;
    const p = findOpen(a, 4.5, 15, 28);
    place(a, p);
    setDeer(a, 'hunt', { x: p.x + (p.x / hyp(p)) * 1.5, z: p.z + (p.z / hyp(p)) * 1.5 }, { threat: 60, lastKnown: { ...p } });
    for (let k = 0; k < 8; k++) tick(a);
    expect(s.deer.mode).toBe('swing');
    const b = reload(a);
    const still = Array.from({ length: 300 }, () => emptyInput());
    expectLockstep(a, b, still, 1);
    expect(a.state.player.hp).toBeLessThan(100); // the swing in flight landed in both
  });

  it('at every 3 s of a whole risky night (all Deer modes, caches, traps)', () => {
    for (const night of [1, 30, 75]) {
      const a = stock(nightWorld(77, night));
      a.state.cards = ['E02', 'R03', 'C05'];
      a.refreshMods();
      a.state.player.hp = 100;
      const inputs = script(100 + night, 2700);
      const modes = new Set<string>();
      const clones: { from: number; w: World }[] = [];
      for (let k = 0; k < inputs.length && a.state.phase === 'night'; k++) {
        if (k % 90 === 0) clones.push({ from: k, w: reload(a) });
        // Keep the wanderer alive so that the whole night is covered.
        if (a.state.player.hp <= 40) for (const c of [a, ...clones.map((c) => c.w)]) c.state.player.hp = 100;
        a.step({ ...inputs[k] });
        a.drainEvents();
        modes.add(a.state.deer.mode);
        for (const c of clones) {
          if (k - c.from >= 150) continue;
          c.w.step({ ...inputs[k] });
          c.w.drainEvents();
          const sa = snapshot(a).replace(/"revision":\d+/, '');
          const sc = snapshot(c.w).replace(/"revision":\d+/, '');
          if (sa !== sc) expect(JSON.parse(sc), `night ${night}: clone from tick ${c.from} diverged at ${k}`).toEqual(JSON.parse(sa));
        }
      }
      expect(clones.length).toBeGreaterThan(20);
      expect(modes.size).toBeGreaterThanOrEqual(4);
    }
  }, 60000);

  it('in the draft: the same hand, the same reroll, the same next day', () => {
    const a = stock(dayWorld(77));
    skipToDawn(a);
    a.state.stats.nightsSurvived = 2; // reroll unlocked
    a.state.night = 2;
    a.drainEvents();
    expect(a.state.phase).toBe('draft');
    const b = reload(a);
    expect(b.state.hand).toEqual(a.state.hand);
    expect(canReroll(a) && canReroll(b)).toBe(true);
    expect(reroll(a)).toBe(true);
    expect(reroll(b)).toBe(true);
    expect(b.state.hand).toEqual(a.state.hand);

    // A second reload after the reroll shows the rerolled hand, not a third one.
    const c = reload(a);
    expect(c.state.hand).toEqual(a.state.hand);
    expect(canReroll(c)).toBe(false);

    for (const w of [a, b, c]) {
      expect(pickCard(w, 0)).not.toBe('invalid');
      if (w.state.pendingCard) throw new Error('unexpected replace prompt');
      w.beginDay();
      w.drainEvents();
    }
    expect(snapshot(b).replace(/"revision":\d+/, '')).toBe(snapshot(a).replace(/"revision":\d+/, ''));
    const inputs = script(13, 4600); // a full day and night
    const rev = (w: World) => (w.state.revision = 0);
    [a, b, c].forEach(rev);
    expectLockstep(a, b, inputs, 60);
    // The third copy went through the same script on its own.
    for (const i of inputs) c.step({ ...i });
    c.drainEvents();
    expect(snapshot(c)).toBe(snapshot(a));
  });

  it('a reload in the draft deals the same next hands as the original would', () => {
    const a = dayWorld(78);
    skipToDawn(a);
    const b = reload(a);
    for (let n = 0; n < 5; n++) {
      for (const w of [a, b]) {
        pickCard(w, 1);
        if (w.state.pendingCard) throw new Error('unexpected replace prompt');
        w.beginDay();
        skipToDawn(w);
      }
      expect(b.state.hand).toEqual(a.state.hand);
      expect(b.state.cards).toEqual(a.state.cards);
      expect(b.state.snagLogs).toEqual(a.state.snagLogs);
    }
  });
});

describe('determinism', () => {
  it('same seed + same inputs → identical worlds for a full day and night', () => {
    const inputs = script(42, 4520);
    inputs[0].mz = 1;
    const a = stock(World.start({ seed: 2024 }));
    const b = stock(World.start({ seed: 2024 }));
    const log: SimEvent[] = [];
    const phases = new Set<string>();
    for (let k = 0; k < inputs.length; k++) {
      for (const w of [a, b]) if (w.state.player.hp <= 40) w.state.player.hp = 100;
      a.step({ ...inputs[k] });
      b.step({ ...inputs[k] });
      const ea = a.drainEvents();
      expect(b.drainEvents()).toEqual(ea);
      log.push(...ea);
      phases.add(a.state.phase);
      if (k % 150 === 149) expect(snapshot(b)).toBe(snapshot(a));
    }
    expect(snapshot(b)).toBe(snapshot(a));
    expect([...phases].sort()).toEqual(['day', 'draft', 'night']);
    expect(b.state.hand).toEqual(a.state.hand);
    // The script really did things.
    const kinds = new Set(log.map((e) => e.type));
    for (const t of ['nightStart', 'cacheOpen', 'deerCue', 'dawn'] as const) expect(kinds.has(t), t).toBe(true);
  });

  it('a different seed gives a different forest and a different night', () => {
    const a = World.start({ seed: 1 });
    const b = World.start({ seed: 2 });
    expect(a.forest.trees).not.toEqual(b.forest.trees);
    expect(a.state.rng).not.toEqual(b.state.rng);
  });

  it('the result does not depend on wall-clock time or on how events are drained', () => {
    const inputs = script(43, 1500);
    inputs[0].mz = 1;
    const a = World.start({ seed: 5 });
    const b = World.start({ seed: 5 });
    for (let k = 0; k < inputs.length; k++) {
      a.step({ ...inputs[k] });
      b.step({ ...inputs[k] });
      if (k % 7 === 0) a.drainEvents(); // b never drains
    }
    expect(snapshot(b)).toBe(snapshot(a));
  });
});
