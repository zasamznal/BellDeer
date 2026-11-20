// Inventory, fire, workbench, field traps, portable light and night caches
// (GDD §2 "Управление и действия", §3 "Огонь, ресурсы и сложность").
import { describe, expect, it } from 'vitest';
import { burnRate, fireRadius } from '../src/sim/rules';
import {
  DT,
  RULES,
  World,
  atFire,
  count,
  d2,
  dayWorld,
  emptyInput,
  findLane,
  has,
  hideDeer,
  hyp,
  lookAt,
  nightWorld,
  place,
  run,
  runUntil,
  setDeer,
  skipPhase,
  standAt,
  tick,
  yawTo,
  type Input,
  type SimEvent,
} from './helpers';
import { skipCard } from '../src/sim/draft';

// ------------------------------------------------------------------ inventory

describe('inventory limits and partial pickup', () => {
  it('logs cap at 6; a partial chop leaves the rest on the snag', () => {
    const w = dayWorld(11);
    const s = w.state;
    s.player.logs = 5;
    const i = standAt(w, w.forest.snags[0], 1.2, { chop: true });
    const ev = run(w, 2.1, i);
    expect(s.player.logs).toBe(6);
    expect(s.snagLogs[0]).toBe(1);
    expect(ev.find((e) => e.type === 'chopDone')).toMatchObject({ logs: 1 });
    expect(s.stats.logsChopped).toBe(1);

    // Full pack: the snag is shown but cannot be used and nothing is taken.
    tick(w, i);
    expect(w.focus).toMatchObject({ kind: 'snag', usable: false, info: 'full' });
    run(w, 3, i);
    expect(s.player.logs).toBe(6);
    expect(s.snagLogs[0]).toBe(1);
  });

  it('chopping needs the snag within 2 m and an uninterrupted 2 s hold', () => {
    const w = dayWorld(11);
    const s = w.state;
    const snag = w.forest.snags[1];
    // 2 m is measured to the trunk surface (r = 0.32): 2.2 m from the centre works, 2.6 m does not.
    run(w, 3, standAt(w, snag, 2.6, { chop: true }));
    expect(s.player.logs).toBe(0);
    const i = standAt(w, snag, 2.2, { chop: true });
    run(w, 1.5, i);
    run(w, 0.1, { ...i, chop: false }); // letting go resets the progress
    run(w, 1.5, i);
    expect(s.player.logs).toBe(0);
    run(w, 0.6, i);
    expect(s.player.logs).toBe(2);
    expect(s.snagLogs[1]).toBe(0);
    // An empty snag is no longer a target.
    tick(w, i);
    expect(w.focus?.kind).not.toBe('snag');
  });

  it('scrap caps at 8; E takes 0.4 s and a partial pickup leaves the rest on the pile', () => {
    const w = dayWorld(5);
    const s = w.state;
    s.player.scrap = 7;
    const i = standAt(w, w.forest.scrap[0], 1.2);
    tick(w, { ...i, interact: true });
    run(w, 0.3, i);
    expect(s.player.scrap).toBe(7);
    const ev = run(w, 0.15, i);
    expect(s.player.scrap).toBe(8);
    expect(s.scrapLeft[0]).toBe(1);
    expect(ev.find((e) => e.type === 'pickup')).toMatchObject({ kind: 'scrap', n: 1 });

    // Full: E is refused, the pile keeps its last unit.
    const denied = tick(w, { ...i, interact: true });
    expect(has(denied, 'denied')).toBe(true);
    run(w, 1, i);
    expect(s.scrapLeft[0]).toBe(1);
    expect(s.player.scrap).toBe(8);
  });

  it('a normal pile gives 2 scrap, a bush gives 1 berry; berries cap at 3', () => {
    const w = dayWorld(5);
    const s = w.state;
    let i = standAt(w, w.forest.scrap[1], 1.2);
    tick(w, { ...i, interact: true });
    run(w, 0.5, i);
    expect(s.player.scrap).toBe(2);
    expect(s.scrapLeft[1]).toBe(0);

    i = standAt(w, w.forest.bushes[0], 1.2);
    tick(w, { ...i, interact: true });
    run(w, 0.5, i);
    expect(s.player.berries).toBe(1);
    expect(s.berryLeft[0]).toBe(0);

    s.player.berries = 3;
    i = standAt(w, w.forest.bushes[1], 1.2);
    tick(w, { ...i, interact: true });
    run(w, 0.6, i);
    expect(s.player.berries).toBe(3);
    expect(s.berryLeft[1]).toBe(1);
  });

  it('walking away during the 0.4 s pickup cancels it', () => {
    const w = dayWorld(5);
    const s = w.state;
    const node = w.forest.scrap[0];
    const i = standAt(w, node, 1.2);
    tick(w, { ...i, interact: true });
    place(w, { x: node.x * 0.5, z: node.z * 0.5 });
    run(w, 1, emptyInput());
    expect(s.player.scrap).toBe(0);
    expect(s.scrapLeft[0]).toBe(2);
  });

  it('a berry takes 0.5 s and restores 18 HP and 25 stamina up to the maximum', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.berries = 2;
    pl.hp = 50;
    pl.stamina = 40;
    pl.sinceSprint = 0; // keep natural regeneration out of the first half second
    tick(w, { eat: true });
    run(w, 0.4, emptyInput());
    expect(pl.hp).toBe(50);
    expect(pl.berries).toBe(2);
    const ev = run(w, 0.1 + DT, emptyInput());
    expect(has(ev, 'eat')).toBe(true);
    expect(pl.hp).toBe(68);
    expect(pl.stamina).toBeCloseTo(65, 6);
    expect(pl.berries).toBe(1);

    pl.hp = 95;
    pl.stamina = 90;
    tick(w, { eat: true });
    run(w, 0.6, emptyInput());
    expect(pl.hp).toBe(100);
    expect(pl.stamina).toBe(100);
    expect(pl.berries).toBe(0);

    // Nothing to eat: refused, nothing changes.
    expect(has(tick(w, { eat: true }), 'denied')).toBe(true);
    expect(pl.berries).toBe(0);
  });

  it('a berry lifts exhaustion when it brings stamina to 20', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.berries = 1;
    pl.stamina = 0;
    pl.exhausted = true;
    pl.sinceSprint = 0;
    tick(w, { eat: true });
    run(w, 0.55, emptyInput());
    expect(pl.stamina).toBeGreaterThanOrEqual(25);
    expect(pl.exhausted).toBe(false);
  });
});

// ------------------------------------------------------------------ fire

describe('fire', () => {
  it('one log gives +20 F', () => {
    const w = dayWorld(5);
    const s = w.state;
    s.fuel = 30;
    s.player.logs = 2;
    const ev = tick(w, atFire(w, { interact: true }));
    expect(s.fuel).toBeCloseTo(30 + 20 - 0.15 * DT, 9);
    expect(s.player.logs).toBe(1);
    expect(ev.find((e) => e.type === 'feed')).toMatchObject({ gain: 20, relit: false });
    expect(s.stats.feeds).toBe(1);
  });

  it('clamps at 75 and reports the actual gain; the log is still spent', () => {
    const w = dayWorld(5);
    const s = w.state;
    s.fuel = 60;
    s.player.logs = 1;
    const i = atFire(w);
    tick(w, i);
    expect(w.focus).toMatchObject({ kind: 'fire', usable: true });
    const shown = Number(w.focus!.info.replace('+', ''));
    expect(shown).toBe(15);
    const ev = tick(w, { ...i, interact: true });
    const feed = ev.find((e) => e.type === 'feed') as Extract<SimEvent, { type: 'feed' }>;
    expect(feed.gain).toBeGreaterThan(14.9);
    expect(feed.gain).toBeLessThanOrEqual(15.01);
    expect(s.fuel).toBeLessThanOrEqual(75);
    expect(s.fuel).toBeGreaterThan(74.98);
    expect(s.player.logs).toBe(0);
  });

  it('fuel never leaves 0..75', () => {
    const w = dayWorld(5);
    const s = w.state;
    s.fuel = 74.999;
    s.player.logs = 6;
    const i = atFire(w, { interact: true });
    for (let k = 0; k < 10; k++) {
      tick(w, i);
      expect(s.fuel).toBeLessThanOrEqual(75);
    }
    s.fuel = 0.001;
    s.player.logs = 0;
    run(w, 1, atFire(w));
    expect(s.fuel).toBe(0);
    expect(w.radius).toBe(0);
    expect(w.isProtected({ x: 0, z: 0 })).toBe(false);
  });

  it('E needs a log and the fire in reach (2 m from its edge)', () => {
    const w = dayWorld(5);
    const s = w.state;
    s.fuel = 40;
    expect(has(tick(w, atFire(w, { interact: true })), 'denied')).toBe(true);
    expect(s.stats.feeds).toBe(0);
    s.player.logs = 1;
    place(w, { x: 4, z: 0.2 + 3 }); // > 2 m from the stones
    tick(w, lookAt(w, { x: 0, z: 0 }, { interact: true }));
    expect(s.player.logs).toBe(1);
  });

  it('hysteresis: weak at F ≤ 24, bright again at F ≥ 30, unchanged in between', () => {
    const w = dayWorld(5);
    const s = w.state;
    const i = atFire(w);
    expect(s.bright).toBe(true);
    s.fuel = 26;
    tick(w, i);
    expect(s.bright).toBe(true); // 24–30 keeps the previous state (bright)
    s.fuel = 24 + 0.15 * DT * 1.5;
    tick(w, i);
    expect(s.bright).toBe(true); // 24.0025 is still above the threshold
    const ev = tick(w, i);
    expect(s.fuel).toBeLessThanOrEqual(24);
    expect(s.bright).toBe(false);
    expect(count(ev, 'fireWeak')).toBe(1);
    expect(w.isProtected(s.player)).toBe(false);

    s.fuel = 29.9;
    expect(has(tick(w, i), 'fireBright')).toBe(false);
    expect(s.bright).toBe(false); // 24–30 keeps the previous state (weak)
    s.fuel = 30 + 0.15 * DT; // lands exactly on 30 after this tick's burn
    const ev2 = tick(w, i);
    expect(s.bright).toBe(true);
    expect(count(ev2, 'fireBright')).toBe(1);
    expect(w.isProtected(s.player)).toBe(true);
  });

  it('radius follows (2.5 + 0.08 F) and protection is exactly "bright and d ≤ R"', () => {
    const w = dayWorld(5);
    const s = w.state;
    for (const F of [1, 24.5, 42, 60, 75]) {
      s.fuel = F;
      s.bright = true;
      expect(w.radius).toBeCloseTo(2.5 + 0.08 * F, 9);
      expect(fireRadius(F, 1)).toBeCloseTo(2.5 + 0.08 * F, 9);
      const R = w.radius;
      expect(w.isProtected({ x: R - 0.001, z: 0 })).toBe(true);
      expect(w.isProtected({ x: 0, z: -(R + 0.001) })).toBe(false);
      s.bright = false;
      expect(w.isProtected({ x: 1, z: 0 })).toBe(false);
    }
    expect(fireRadius(42, 1)).toBeCloseTo(5.86, 9);
    expect(fireRadius(75, 1)).toBeCloseTo(8.5, 9);
  });

  it('burns 0.15 F/s by day', () => {
    const w = dayWorld(5);
    run(w, 10, atFire(w));
    expect(w.state.fuel).toBeCloseTo(42 - 1.5, 6);
    // A whole day costs 9 F.
    run(w, 49.9, atFire(w));
    expect(w.state.phase).toBe('day');
    expect(w.state.fuel).toBeCloseTo(42 - 0.15 * 59.9, 4);
  });

  for (const [n, total] of [
    [1, 57.6],
    [10, 60.03],
    [50, 70.83],
    [75, 77.58],
    [99, 84.06],
  ] as const) {
    it(`night ${n} burns ${total.toFixed(2)} F over its 90 s`, () => {
      expect(burnRate('night', n) * 90).toBeCloseTo(total, 6);
      const w = dayWorld(5, n);
      const s = w.state;
      s.t = RULES.cycle.daySeconds - DT;
      s.fuel = 75;
      const i = atFire(w);
      let burned = 0;
      let nightTicks = 0;
      for (let k = 0; k < 3000 && s.phase !== 'draft' && s.phase !== 'victory'; k++) {
        if (s.fuel < 45) s.fuel += 30; // bookkeeping top-up, outside the tick
        const before = s.fuel;
        w.step({ ...i });
        if (s.phase === 'night') {
          burned += before - s.fuel;
          nightTicks++;
        }
      }
      expect(['draft', 'victory']).toContain(s.phase);
      expect(nightTicks).toBe(90 * 30);
      expect(burned).toBeCloseTo(total, 2);
      expect(s.player.hp).toBe(100);
    });
  }

  it('a full fire still loses protection during night 1 without a feed (GDD §2)', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.fuel = 75;
    let lost = -1;
    const i = atFire(w);
    for (let k = 0; k < 2690; k++) {
      w.step({ ...i });
      if (lost < 0 && !w.playerProtected) lost = s.t;
    }
    // (75 − 24) / 0.64 = 79.7 s
    expect(lost).toBeGreaterThan(79.4);
    expect(lost).toBeLessThan(80);
  });
});

// ------------------------------------------------------------------ workbench

/** Stand east of the bench, facing it, with the panel open. */
function openBench(w: World): Input {
  const b = w.forest.bench;
  place(w, { x: b.x + 1.3, z: b.z });
  const i = lookAt(w, b);
  const ev = tick(w, { ...i, interact: true });
  expect(ev).toContainEqual({ type: 'bench', open: true });
  expect(w.state.player.bench).toBe(true);
  return i;
}

describe('workbench', () => {
  it('the bench stands 2 m from the fire', () => {
    const w = dayWorld(5);
    expect(hyp(w.forest.bench)).toBeGreaterThan(1.9);
    expect(hyp(w.forest.bench)).toBeLessThan(2.1);
  });

  it('trap: 2 scrap, ready after 1 s; materials and item move in one tick', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.scrap = 5;
    const i = openBench(w);
    tick(w, { ...i, craft: 1 });
    expect(pl.craft).toBe(1);
    run(w, 0.9, i);
    expect([pl.scrap, pl.traps]).toEqual([5, 0]);
    const ev = run(w, 0.2, i);
    expect([pl.scrap, pl.traps]).toEqual([3, 1]);
    expect(ev).toContainEqual({ type: 'craft', recipe: 1 });
    expect(pl.bench).toBe(true); // the panel stays open for the next recipe
    expect(pl.craft).toBe(0);
  });

  it('flare charge: 2 scrap, 1 s', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.scrap = 2;
    const i = openBench(w);
    tick(w, { ...i, craft: 2 });
    run(w, 0.9, i);
    expect([pl.scrap, pl.flares]).toEqual([2, 1]);
    run(w, 0.2, i);
    expect([pl.scrap, pl.flares]).toEqual([0, 2]);
  });

  it('battery: 1 scrap gives +40 after 1.5 s, capped at 100', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.scrap = 2;
    pl.battery = 30;
    const i = openBench(w);
    tick(w, { ...i, craft: 3 });
    run(w, 1.4, i);
    expect([pl.scrap, pl.battery]).toEqual([2, 30]);
    run(w, 0.2, i);
    expect([pl.scrap, pl.battery]).toEqual([1, 70]);
    tick(w, { ...i, craft: 3 });
    run(w, 1.6, i);
    expect([pl.scrap, pl.battery]).toEqual([0, 100]);
  });

  it('refuses a recipe that cannot be paid for or would overflow the pack', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    const i = openBench(w);
    pl.scrap = 1;
    expect(has(tick(w, { ...i, craft: 1 }), 'denied')).toBe(true);
    expect(has(tick(w, { ...i, craft: 2 }), 'denied')).toBe(true);
    pl.scrap = 8;
    pl.traps = 2;
    pl.flares = 2;
    pl.battery = 100;
    expect(has(tick(w, { ...i, craft: 1 }), 'denied')).toBe(true);
    expect(has(tick(w, { ...i, craft: 2 }), 'denied')).toBe(true);
    expect(has(tick(w, { ...i, craft: 3 }), 'denied')).toBe(true);
    run(w, 2, i);
    expect([pl.scrap, pl.traps, pl.flares]).toEqual([8, 2, 2]);
  });

  it('world time keeps running while the panel is open', () => {
    const w = dayWorld(5);
    const i = openBench(w);
    const t0 = w.state.t;
    const f0 = w.state.fuel;
    run(w, 2, i);
    expect(w.state.t).toBeCloseTo(t0 + 2, 6);
    expect(w.state.fuel).toBeLessThan(f0);
  });

  it('walking more than 2.5 m away closes the panel and cancels the recipe without spending', () => {
    for (const recipe of [1, 2, 3] as const) {
      const w = dayWorld(5);
      const pl = w.state.player;
      pl.scrap = 4;
      pl.battery = 10;
      const b = w.forest.bench;
      const i = openBench(w);
      tick(w, { ...i, craft: recipe });
      run(w, 0.3, i);
      // Walk east, away from the bench and the fire.
      const away = { ...emptyInput(), yaw: yawTo(1, 0), mz: 1 };
      let closedAt = -1;
      let closeEvents = 0;
      for (let k = 0; k < 60; k++) {
        const wasOpen = pl.bench;
        const before = d2(pl, b);
        const ev = tick(w, away);
        closeEvents += ev.filter((e) => e.type === 'bench' && !e.open).length;
        if (wasOpen && !pl.bench) closedAt = before;
        // Within 2.5 m of the bench the panel must still be open.
        if (d2(pl, b) <= 2.5 && closedAt < 0) expect(pl.bench).toBe(true);
      }
      expect(pl.bench).toBe(false);
      expect(closeEvents).toBe(1);
      expect(closedAt).toBeGreaterThan(2.4);
      expect(closedAt).toBeLessThan(3.3);
      expect(pl.craft).toBe(0);
      expect([pl.scrap, pl.traps, pl.flares, pl.battery]).toEqual([4, 0, 1, 10]);
      // Coming back does not finish the old job.
      run(w, 2, emptyInput());
      expect([pl.scrap, pl.traps, pl.flares, pl.battery]).toEqual([4, 0, 1, 10]);
    }
  });

  // GDD §2: "Уход дальше 2,5 м … закрывает панель". The code closes at 2.5 m + the
  // 0.6 m bench radius = 3.1 m from the bench centre, i.e. it measures from the
  // bench edge like every other reach check. The test above accepts both readings.
  it.todo('GDD ambiguity: bench leave distance 2.5 m from the centre or from the edge (code: edge)');

  it('taking damage closes the panel and cancels the recipe without spending', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.scrap = 4;
    const i = openBench(w);
    tick(w, { ...i, craft: 1 });
    run(w, 0.5, i);
    w.damagePlayer(RULES.deer.damage);
    expect(pl.bench).toBe(false);
    expect(pl.craft).toBe(0);
    expect(w.drainEvents()).toContainEqual({ type: 'bench', open: false });
    run(w, 2, i);
    expect([pl.scrap, pl.traps, pl.hp]).toEqual([4, 0, 60]);
  });

  it('E closes the panel; an unfinished job is dropped', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.scrap = 4;
    const i = openBench(w);
    tick(w, { ...i, craft: 2 });
    run(w, 0.5, i);
    tick(w, { ...i, interact: true });
    expect(pl.bench).toBe(false);
    run(w, 2, i);
    expect([pl.scrap, pl.flares]).toEqual([4, 1]);
  });

  it('craft keys do nothing while the panel is closed', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.scrap = 4;
    const b = w.forest.bench;
    place(w, { x: b.x + 1.3, z: b.z });
    run(w, 2, lookAt(w, b, { craft: 1 }));
    expect([pl.scrap, pl.traps]).toEqual([4, 0]);
  });
});

// ------------------------------------------------------------------ field trap

/** Open, flat ground outside the camp with the player looking along a clear lane. */
function trapGround(seed = 5, night = false) {
  const w = night ? nightWorld(seed) : dayWorld(seed);
  const lane = findLane(w, 8, 1.6, 10, 30);
  place(w, lane.a);
  return { w, lane, hold: { ...emptyInput(), yaw: lane.yaw, trapHold: true } as Input, idle: { ...emptyInput(), yaw: lane.yaw } as Input };
}

describe('field trap (hold Q)', () => {
  it('0.8 s hold places a ready trap first, then builds from 2 scrap', () => {
    const { w, hold, idle } = trapGround();
    const s = w.state;
    const pl = s.player;
    pl.traps = 1;
    pl.scrap = 4;
    run(w, 0.7, hold);
    expect(s.traps.length).toBe(0);
    expect(w.trapGhost).toMatchObject({ ok: true });
    const ev = run(w, 0.2, hold);
    expect(s.traps.length).toBe(1);
    expect([pl.traps, pl.scrap]).toEqual([0, 4]);
    expect(count(ev, 'trapPlaced')).toBe(1);
    // In front of the player, no further than 2.5 m.
    const t = s.traps[0];
    expect(d2(t, pl)).toBeGreaterThan(0.5);
    expect(d2(t, pl)).toBeLessThanOrEqual(RULES.trap.placeRange + 1e-9);
    expect(t.arm).toBeGreaterThan(0.4); // 0.7 s minus the ticks since it was set
    expect(t.arm).toBeLessThanOrEqual(RULES.trap.armSeconds);

    // Keeping Q down does not place a second one.
    run(w, 2, hold);
    expect(s.traps.length).toBe(1);

    // Release, step aside, hold again: no ready trap left, so 2 scrap are spent.
    tick(w, idle);
    place(w, { x: pl.x + 2.5, z: pl.z + 2.5 });
    run(w, 0.9, hold);
    expect(s.traps.length).toBe(2);
    expect([pl.traps, pl.scrap]).toEqual([0, 2]);
  });

  it('releasing before 0.8 s cancels and spends nothing', () => {
    const { w, hold, idle } = trapGround();
    const s = w.state;
    s.player.scrap = 2;
    run(w, 0.7, hold);
    tick(w, idle);
    expect(w.trapGhost).toBeNull();
    expect(s.player.trapHold).toBe(0);
    // The next hold starts from zero again.
    run(w, 0.7, hold);
    expect(s.traps.length).toBe(0);
    expect(s.player.scrap).toBe(2);
    run(w, 0.15, hold);
    expect(s.traps.length).toBe(1);
    expect(s.player.scrap).toBe(0);
  });

  it('no more than 2 traps on the ground; the third hold spends nothing', () => {
    const { w, hold, idle } = trapGround();
    const s = w.state;
    const pl = s.player;
    pl.traps = 2;
    pl.scrap = 8;
    const base = { x: pl.x, z: pl.z };
    for (let k = 0; k < 3; k++) {
      // Shift along the lane so the spots do not overlap.
      const f = { x: -Math.sin(hold.yaw), z: -Math.cos(hold.yaw) };
      place(w, { x: base.x + f.x * k * 2, z: base.z + f.z * k * 2 });
      run(w, 1, hold);
      tick(w, idle);
    }
    expect(s.traps.length).toBe(2);
    expect([pl.traps, pl.scrap]).toEqual([0, 8]);
    expect(w.trapGhost).toBeNull();
    tick(w, hold);
    expect(w.trapGhost).toMatchObject({ ok: false });
  });

  it('without a ready trap or 2 scrap nothing is placed', () => {
    const { w, hold } = trapGround();
    w.state.player.scrap = 1;
    run(w, 2, hold);
    expect(w.state.traps.length).toBe(0);
    expect(w.state.player.scrap).toBe(1);
    expect(w.trapGhost).toMatchObject({ ok: false });
  });

  it('an invalid surface (inside a trunk) is rejected before anything is spent', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.scrap = 4;
    const tree = w.forest.obstacles.find((o) => o.kind === 'tree' && hyp(o) < 28)!;
    const k = (hyp(tree) - 1.2) / hyp(tree);
    place(w, { x: tree.x * k, z: tree.z * k }); // the ghost lands on the trunk centre
    run(w, 2, lookAt(w, tree, { trapHold: true }));
    expect(w.state.traps.length).toBe(0);
    expect(pl.scrap).toBe(4);
  });

  it('arms 0.7 s after placement: the Deer can stand on it unharmed until then', () => {
    const { w, lane } = trapGround(5, true);
    const s = w.state;
    place(w, { x: 1.5, z: 1.5 }); // player safe at the fire
    s.fuel = 75;
    // A Deer frozen in a false provocation right on top of a freshly set trap.
    setDeer(w, 'feint', lane.a);
    s.traps.push({ id: 1, x: lane.a.x, z: lane.a.z, arm: RULES.trap.armSeconds });
    const ev1 = run(w, 0.6, emptyInput());
    expect(has(ev1, 'trapSnap')).toBe(false);
    expect(s.traps.length).toBe(1);
    const ev2 = run(w, 0.2, emptyInput());
    expect(count(ev2, 'trapSnap')).toBe(1);
    expect(s.traps.length).toBe(0); // consumed
    expect(s.deer.mode).toBe('stunned');
  });

  it('snaps on contact, stuns for 3 s, then the Deer retreats', () => {
    const { w, lane } = trapGround(5, true);
    const s = w.state;
    place(w, { x: 1.5, z: 1.5 });
    s.fuel = 75;
    const far = { x: lane.a.x + lane.dir.x * 1.6, z: lane.a.z + lane.dir.z * 1.6 };
    setDeer(w, 'feint', far);
    s.traps.push({ id: 1, x: lane.a.x, z: lane.a.z, arm: 0 });
    // 1.6 m away: outside the contact radius.
    expect(has(run(w, 0.3, emptyInput()), 'trapSnap')).toBe(false);
    // 0.7 m away: inside the 0.8 m contact radius.
    s.deer.x = lane.a.x + lane.dir.x * 0.7;
    s.deer.z = lane.a.z + lane.dir.z * 0.7;
    const ev = tick(w);
    expect(ev).toContainEqual({ type: 'deerStunned', by: 'trap' });
    expect(count(ev, 'trapSnap')).toBe(1);
    const stunnedFor = runUntil(w, 6, () => s.deer.mode !== 'stunned');
    expect(stunnedFor).toBeGreaterThan(2.9);
    expect(stunnedFor).toBeLessThan(3.1);
    expect(s.deer.mode).toBe('retreat');
  });

  it('a trap set by day arms on the same 0.7 s clock', () => {
    const { w, hold, idle } = trapGround();
    w.state.player.traps = 1;
    run(w, 0.9, hold);
    expect(w.state.traps.length).toBe(1);
    const arm0 = w.state.traps[0].arm;
    expect(arm0).toBeGreaterThan(0.5);
    run(w, 0.8, idle);
    expect(w.state.traps[0].arm).toBeLessThanOrEqual(0);
    expect(w.state.phase).toBe('day');
  });

  // GDD §3: "Радиус контакта 0,8 м". The code triggers at 0.8 + 0.25 = 1.05 m between
  // the centres (stepTraps). If 0.8 m is meant centre-to-centre, a Deer passing
  // 0.95 m from the trap must not set it off; if it is meant from the Deer's
  // body (r = 0.55) the trap should already snap at 1.35 m. Design call needed.
  it('contact radius is exactly 0.8 m from the Deer centre', () => {
    const { w, lane } = trapGround(5, true);
    const s = w.state;
    place(w, { x: 1.5, z: 1.5 });
    s.fuel = 75;
    setDeer(w, 'feint', { x: lane.a.x + lane.dir.x * 0.95, z: lane.a.z + lane.dir.z * 0.95 });
    s.traps.push({ id: 1, x: lane.a.x, z: lane.a.z, arm: 0 });
    expect(has(run(w, 0.3, emptyInput()), 'trapSnap')).toBe(false);
  });

  it('traps and the Deer do nothing to each other by day', () => {
    const { w, hold } = trapGround();
    w.state.player.traps = 1;
    run(w, 1, hold);
    expect(w.state.traps.length).toBe(1);
    run(w, 5, emptyInput());
    expect(w.state.traps.length).toBe(1);
  });
});

// ------------------------------------------------------------------ flashlight and torch

describe('flashlight', () => {
  it('drains 1.25/s: 80 s of continuous beam, then switches itself off', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    expect(tick(w, { light: true })).toContainEqual({ type: 'light', on: true });
    expect(pl.lightOn).toBe(true);
    run(w, 10 - DT, emptyInput());
    expect(pl.battery).toBeCloseTo(87.5, 6);
    // Jump ahead: the last 1.25 units last exactly one more second.
    pl.battery = 1.25;
    const ev1 = run(w, 0.9, emptyInput());
    expect(pl.lightOn).toBe(true);
    expect(has(ev1, 'light')).toBe(false);
    const ev2 = run(w, 0.15, emptyInput());
    expect(pl.battery).toBe(0);
    expect(pl.lightOn).toBe(false);
    expect(ev2).toContainEqual({ type: 'light', on: false });
    // An empty flashlight refuses to switch on.
    expect(has(tick(w, { light: true }), 'denied')).toBe(true);
    expect(pl.lightOn).toBe(false);
  });

  it('a full battery lasts 80 s', () => {
    const w = nightWorld(5);
    hideDeer(w);
    const pl = w.state.player;
    w.state.fuel = 75;
    tick(w, atFire(w, { light: true }));
    const lasted = runUntil(w, 85, () => !pl.lightOn, atFire(w));
    expect(lasted).toBeGreaterThan(79.8);
    expect(lasted).toBeLessThan(80.2);
  });

  it('F toggles; the beam does not drain while off', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    tick(w, { light: true });
    run(w, 1, emptyInput());
    tick(w, { light: true });
    expect(pl.lightOn).toBe(false);
    const b = pl.battery;
    run(w, 5, emptyInput());
    expect(pl.battery).toBe(b);
  });

  it('dawn gives +35 battery, capped at 100', () => {
    for (const [before, after] of [
      [10, 45],
      [80, 100],
      [0, 35],
    ] as const) {
      const w = nightWorld(5);
      hideDeer(w);
      const s = w.state;
      s.fuel = 75;
      s.t = RULES.cycle.nightSeconds - 2 * DT;
      s.player.battery = before;
      run(w, 0.2, atFire(w));
      expect(s.phase).toBe('draft');
      expect(s.player.battery).toBe(after);
    }
  });
});

describe('torch', () => {
  it('T burns one log for 18 s and keeps the flashlight off meanwhile', () => {
    const w = dayWorld(5);
    const pl = w.state.player;
    pl.logs = 2;
    tick(w, { light: true });
    expect(pl.lightOn).toBe(true);
    const ev = tick(w, { torch: true });
    expect(has(ev, 'torch')).toBe(true);
    expect(pl.logs).toBe(1);
    expect(pl.lightOn).toBe(false);
    expect(pl.torch).toBeCloseTo(18, 6);
    const battery = pl.battery;

    // F is ignored while the torch burns; T does not waste a second log.
    tick(w, { light: true });
    expect(pl.lightOn).toBe(false);
    tick(w, { torch: true });
    expect(pl.logs).toBe(1);
    expect(pl.torch).toBeLessThan(18);

    run(w, 17.8, emptyInput());
    expect(pl.torch).toBeGreaterThan(0);
    expect(pl.battery).toBe(battery);
    run(w, 0.3, emptyInput());
    expect(pl.torch).toBe(0);
    // The flashlight works again afterwards.
    tick(w, { light: true });
    expect(pl.lightOn).toBe(true);
  });

  it('T without a log is refused', () => {
    const w = dayWorld(5);
    expect(has(tick(w, { torch: true }), 'denied')).toBe(true);
    expect(w.state.player.torch).toBe(0);
  });

  it('halves threat growth outside protection', () => {
    const grow = (torch: boolean) => {
      const w = nightWorld(5);
      const s = w.state;
      s.t = 10;
      s.player.logs = 1;
      place(w, findLane(w, 4, 1, 14, 30).a);
      if (torch) tick(w, { torch: true });
      else tick(w);
      const t0 = s.deer.threat;
      run(w, 2, emptyInput());
      return s.deer.threat - t0;
    };
    expect(grow(false)).toBeCloseTo(16, 4);
    expect(grow(true)).toBeCloseTo(8, 4);
  });
});

// ------------------------------------------------------------------ flare

describe('signal flare', () => {
  it('bursts at the end of the 18 m ray when nothing is in the way', () => {
    const w = dayWorld(5);
    const lane = findLane(w, 19, 0.4, 10, 34);
    place(w, lane.a);
    const ev = tick(w, { yaw: lane.yaw, flare: true });
    const f = ev.find((e) => e.type === 'flare') as Extract<SimEvent, { type: 'flare' }>;
    expect(d2(f, lane.a)).toBeCloseTo(18, 6);
    expect(f.hit).toBe(false);
    expect(w.state.player.flares).toBe(0);
    expect(has(tick(w, { yaw: lane.yaw, flare: true }), 'denied')).toBe(true);
  });

  it('bursts at the first trunk on the aim line', () => {
    const w = dayWorld(5);
    const tree = w.forest.obstacles.find((o) => o.kind === 'tree' && hyp(o) > 12 && hyp(o) < 26)!;
    const k = (hyp(tree) - 3) / hyp(tree);
    place(w, { x: tree.x * k, z: tree.z * k });
    const ev = tick(w, lookAt(w, tree, { flare: true }));
    const f = ev.find((e) => e.type === 'flare') as Extract<SimEvent, { type: 'flare' }>;
    expect(d2(f, w.state.player)).toBeLessThanOrEqual(3 - tree.r + 1e-6);
  });

  it('4 m burst radius with line of sight stuns for 2 s; no damage to anyone', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.fuel = 75;
    const lane = findLane(w, 16, 1.2, 12, 32);
    place(w, lane.a);
    const at = (m: number) => ({ x: lane.a.x + lane.dir.x * m, z: lane.a.z + lane.dir.z * m });
    // Aim at the ground 8 m ahead: eye height 1.65 m → pitch = −atan(1.65 / 8).
    const aim = { yaw: lane.yaw, pitch: -Math.atan(RULES.world.eyeHeight / 8), flare: true };

    // The Deer 4.6 m past the burst point: out of the 4 m radius.
    setDeer(w, 'stalk', at(12.6), { orbitTimer: 99 });
    s.player.flares = 1;
    let ev = tick(w, aim);
    let f = ev.find((e) => e.type === 'flare') as Extract<SimEvent, { type: 'flare' }>;
    expect(d2(f, at(8))).toBeLessThan(0.05);
    expect(f.hit).toBe(false);

    // 3.5 m from the burst: stunned for 2 s.
    setDeer(w, 'stalk', at(11.5), { orbitTimer: 99 });
    s.player.flares = 1;
    ev = tick(w, aim);
    f = ev.find((e) => e.type === 'flare') as Extract<SimEvent, { type: 'flare' }>;
    expect(f.hit).toBe(true);
    expect(ev).toContainEqual({ type: 'deerStunned', by: 'flare' });
    const stunnedFor = runUntil(w, 5, () => s.deer.mode !== 'stunned', { ...emptyInput(), yaw: lane.yaw });
    expect(stunnedFor).toBeGreaterThan(1.9);
    expect(stunnedFor).toBeLessThan(2.1);
    expect(s.player.hp).toBe(100);
  });
});

// ------------------------------------------------------------------ night caches

function cacheEvents(w: World, until: number, input: Input) {
  const log: { t: number; e: SimEvent }[] = [];
  while (w.state.phase === 'night' && w.state.t < until) {
    w.step({ ...input });
    for (const e of w.drainEvents()) log.push({ t: w.state.t, e });
  }
  return log;
}

describe('night caches', () => {
  it('cue 1 s ahead, open at 22 s and 58 s for 12 s, on two different posts', () => {
    for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) {
      const w = nightWorld(seed);
      hideDeer(w);
      w.state.fuel = 75;
      const log = cacheEvents(w, 75, atFire(w));
      const at = (type: SimEvent['type']) => log.filter((l) => l.e.type === type);
      const cues = at('cacheCue');
      const opens = at('cacheOpen');
      const closes = at('cacheClosed');
      expect(cues.map((l) => l.t)).toEqual([expect.closeTo(21, 1), expect.closeTo(57, 1)]);
      expect(opens.map((l) => l.t)).toEqual([expect.closeTo(22, 1), expect.closeTo(58, 1)]);
      expect(closes.map((l) => l.t)).toEqual([expect.closeTo(34, 1), expect.closeTo(70, 1)]);
      for (let k = 0; k < 2; k++) {
        expect(opens[k].t - cues[k].t).toBeCloseTo(1, 1);
        expect(closes[k].t - opens[k].t).toBeCloseTo(12, 1);
      }
      const posts = opens.map((l) => (l.e as Extract<SimEvent, { type: 'cacheOpen' }>).post);
      expect(posts[0]).not.toBe(posts[1]);
      for (const p of posts) {
        const r = hyp(w.forest.posts[p]);
        expect(r).toBeGreaterThanOrEqual(14);
        expect(r).toBeLessThanOrEqual(17);
      }
      // The cue names the post that then opens.
      expect((cues[0].e as Extract<SimEvent, { type: 'cacheCue' }>).post).toBe(posts[0]);
      expect((cues[1].e as Extract<SimEvent, { type: 'cacheCue' }>).post).toBe(posts[1]);
      expect(w.state.caches.map((c) => c.reward)).toEqual(['scrap', 'flare']);
    }
  });

  it('every post gets its turn: all six orders of (first, second) cache occur about equally often', () => {
    const w = dayWorld(5);
    const s = w.state;
    const seen: Record<string, number> = {};
    const N = 600;
    for (let k = 0; k < N; k++) {
      skipPhase(w); // → night: caches are rolled
      const key = s.caches.map((c) => c.post).join('>');
      seen[key] = (seen[key] ?? 0) + 1;
      skipPhase(w); // → dawn
      s.night = 1; // stay away from night 99
      skipCard(w);
      w.beginDay();
    }
    expect(Object.keys(seen).sort()).toEqual(['0>1', '0>2', '1>0', '1>2', '2>0', '2>1']);
    for (const n of Object.values(seen)) {
      expect(n / N).toBeGreaterThan(1 / 6 - 0.06);
      expect(n / N).toBeLessThan(1 / 6 + 0.06);
    }
  });

  it('with the base 8.5 m circle both posts are outside protection', () => {
    const w = nightWorld(5);
    w.state.fuel = 75;
    for (const p of w.forest.posts) expect(w.isProtected(p)).toBe(false);
  });

  it('needs 1 s of beam on the reflector before E works; first gives 2 scrap, second 1 flare, each a tag', () => {
    const w = nightWorld(5);
    hideDeer(w);
    const s = w.state;
    const pl = s.player;
    s.fuel = 75;
    cacheEvents(w, 22.1, atFire(w));
    const c0 = s.caches[0];
    expect(c0.status).toBe('open');
    const post0 = w.forest.posts[c0.post];
    const i = standAt(w, post0, 1.5);

    // Dark: E is refused.
    const dark = tick(w, { ...i, interact: true });
    expect(w.focus).toMatchObject({ kind: 'cache', usable: false, info: 'needLight' });
    expect(has(dark, 'cacheClaim')).toBe(false);
    expect(pl.tags).toBe(0);

    // Beam on the reflector: 0.9 s is not enough, 1 s is.
    tick(w, { ...i, light: true });
    const ev1 = run(w, 0.85, i);
    expect(has(ev1, 'cacheRevealed')).toBe(false);
    tick(w, { ...i, interact: true });
    expect(pl.tags).toBe(0);
    const ev2 = run(w, 0.2, i);
    expect(ev2).toContainEqual({ type: 'cacheRevealed', post: c0.post });
    expect(w.focus).toMatchObject({ kind: 'cache', usable: true, info: 'scrap' });

    const claim = tick(w, { ...i, interact: true });
    expect(claim).toContainEqual({ type: 'cacheClaim', post: c0.post, reward: 'scrap' });
    expect(pl.scrap).toBe(2);
    expect(pl.tags).toBe(1);
    expect(c0.status).toBe('claimed');
    expect(s.stats.cachesClaimed).toBe(1);
    // Claimed once only.
    tick(w, { ...i, interact: true });
    expect(pl.scrap).toBe(2);
    expect(pl.tags).toBe(1);

    // Second cache: one flare (the run starts with one).
    cacheEvents(w, 58.1, i);
    const c1 = s.caches[1];
    expect(c1.status).toBe('open');
    const j = standAt(w, w.forest.posts[c1.post], 1.5);
    run(w, 1.1, j);
    expect(c1.revealed).toBe(true);
    const claim2 = tick(w, { ...j, interact: true });
    expect(claim2).toContainEqual({ type: 'cacheClaim', post: c1.post, reward: 'flare' });
    expect(pl.flares).toBe(2);
    expect(pl.tags).toBe(2);
  });

  it('the beam must actually point at the reflector and reach it (14 m)', () => {
    const w = nightWorld(5);
    hideDeer(w);
    const s = w.state;
    s.fuel = 75;
    cacheEvents(w, 22.1, atFire(w));
    const c0 = s.caches[0];
    const post = w.forest.posts[c0.post];
    const r = hyp(post);
    // Looking 90° away.
    place(w, { x: post.x * ((r - 3) / r), z: post.z * ((r - 3) / r) });
    const look = lookAt(w, post);
    tick(w, { ...look, light: true });
    run(w, 2, { ...look, yaw: look.yaw + Math.PI / 2 });
    expect(c0.revealed).toBe(false);
    // 15 m away, looking straight at it: out of range.
    place(w, { x: post.x * ((r - 15) / r), z: post.z * ((r - 15) / r) });
    run(w, 2, lookAt(w, post));
    expect(c0.revealed).toBe(false);
    // Light off at 3 m: nothing.
    place(w, { x: post.x * ((r - 3) / r), z: post.z * ((r - 3) / r) });
    tick(w, lookAt(w, post, { light: true }));
    run(w, 2, lookAt(w, post));
    expect(c0.revealed).toBe(false);
    // Light on at 3 m: revealed, but E from 3 m is out of reach.
    tick(w, lookAt(w, post, { light: true }));
    run(w, 1.1, lookAt(w, post));
    expect(c0.revealed).toBe(true);
    tick(w, lookAt(w, post, { interact: true }));
    expect(c0.status).toBe('open');
    expect(s.player.tags).toBe(0);
  });

  // GDD §2: "конус 36° целиком". For the reflector the code widens the half-angle
  // by 4° (inBeam(post, 4) → 44° in total), so a post 20° off the beam axis still
  // counts. Looks like deliberate aim assist; pinned here as an open question.
  it('the reflector must be inside the 36° cone (18° off-axis at most)', () => {
    const w = nightWorld(5);
    hideDeer(w);
    const s = w.state;
    s.fuel = 75;
    cacheEvents(w, 22.1, atFire(w));
    const c0 = s.caches[0];
    const post = w.forest.posts[c0.post];
    const r = hyp(post);
    place(w, { x: post.x * ((r - 3) / r), z: post.z * ((r - 3) / r) });
    const look = lookAt(w, post);
    const off = { ...look, yaw: look.yaw + (20 * Math.PI) / 180 };
    tick(w, { ...off, light: true });
    run(w, 2, off);
    expect(c0.revealed).toBe(false);
  });

  // GDD §2: "Навести луч на отражатель на 1 с". The code accumulates beam time
  // (0.5 s + look away + 0.5 s reveals the tag). "For 1 s" may also mean one
  // uninterrupted second.
  it.todo('GDD ambiguity: is the 1 s on the reflector cumulative (code) or continuous?');

  it('a cache that closes can no longer be opened', () => {
    const w = nightWorld(5);
    hideDeer(w);
    const s = w.state;
    s.fuel = 75;
    cacheEvents(w, 22.1, atFire(w));
    const c0 = s.caches[0];
    const i = standAt(w, w.forest.posts[c0.post], 1.5);
    tick(w, { ...i, light: true });
    cacheEvents(w, 34.2, i);
    expect(c0.revealed).toBe(true);
    expect(c0.status).toBe('closed');
    tick(w, { ...i, interact: true });
    expect(s.player.tags).toBe(0);
    expect(s.player.scrap).toBe(0);
  });

  it('a full pack still gets the tag (the reward that does not fit is lost)', () => {
    const w = nightWorld(5);
    hideDeer(w);
    const s = w.state;
    s.fuel = 75;
    s.player.scrap = 7;
    cacheEvents(w, 22.1, atFire(w));
    const c0 = s.caches[0];
    const i = standAt(w, w.forest.posts[c0.post], 1.5);
    tick(w, { ...i, light: true });
    run(w, 1.1, i);
    tick(w, { ...i, interact: true });
    expect(s.player.scrap).toBe(8);
    expect(s.player.tags).toBe(1);
  });
});

describe('tags and seals', () => {
  it('tags are banked within 2 m of the fire, at any brightness, in day or night', () => {
    const w = dayWorld(5);
    const s = w.state;
    s.player.tags = 2;
    // 3.5 m from the centre (2.65 m from the stones): too far.
    place(w, { x: 0, z: 3.5 });
    expect(has(tick(w), 'tagsBanked')).toBe(false);
    expect(s.player.tags).toBe(2);
    // 2.2 m from the centre and a dead fire.
    s.fuel = 0;
    s.bright = false;
    place(w, { x: 0, z: 2.2 });
    const ev = tick(w);
    expect(ev).toContainEqual({ type: 'tagsBanked', n: 2, seal: 1 });
    expect(s.player.tags).toBe(0);
    expect(s.stats.tagsBanked).toBe(2);
    expect(s.stats.seals).toEqual([1]);
  });

  it('the first banked tag of a chapter gives that chapter\'s seal exactly once', () => {
    const w = dayWorld(5);
    const s = w.state;
    const bank = (night: number) => {
      s.night = night;
      s.player.tags = 1;
      place(w, { x: 0, z: 2.2 });
      return tick(w).find((e) => e.type === 'tagsBanked') as Extract<SimEvent, { type: 'tagsBanked' }>;
    };
    expect(bank(1).seal).toBe(1);
    expect(bank(2).seal).toBe(0);
    expect(bank(3).seal).toBe(0);
    expect(bank(4).seal).toBe(2);
    expect(bank(6).seal).toBe(0);
    expect(bank(7).seal).toBe(3);
    expect(bank(97).seal).toBe(33);
    expect(bank(99).seal).toBe(0);
    expect(s.stats.seals).toEqual([1, 2, 3, 33]);
    expect(s.stats.tagsBanked).toBe(8);
    expect(w.chapterOf(99)).toBe(33); // 33 forest seals for 99 nights
  });

  // GDD §2: "До рассвета третьей ночи главы бирку можно сдать в любой активной
  // фазе." The code never expires a carried tag: one picked up on night 3 and
  // banked on day 4 counts for chapter 2 and gives the chapter-2 seal.
  it.todo('GDD ambiguity: do unbanked tags expire at the dawn that ends their chapter?');
});
