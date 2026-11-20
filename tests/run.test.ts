// Run flow: death and the last chance, dawn bookkeeping, node replenishment,
// the night counter and the single victory after night 99 (GDD §2, §3, §6, §7).
import { describe, expect, it } from 'vitest';
import { pickCard, skipCard } from '../src/sim/draft';
import {
  DT,
  RULES,
  World,
  atFire,
  count,
  dayWorld,
  emptyInput,
  findOpen,
  has,
  hideDeer,
  hyp,
  nightWorld,
  place,
  run,
  runUntil,
  setDeer,
  skipPhase,
  skipToDawn,
  tick,
  type SimEvent,
} from './helpers';

/** Night 1, the player caught in the open by a hunting Deer and killed (three hits). */
function killed(seed = 5, scrap = 0, startT = 30) {
  const w = nightWorld(seed);
  const s = w.state;
  s.t = startT;
  const p = findOpen(w, 4.5, 15, 28);
  place(w, p);
  s.player.scrap = scrap;
  setDeer(w, 'hunt', { x: p.x + (p.x / hyp(p)) * 1.5, z: p.z + (p.z / hyp(p)) * 1.5 }, { threat: 50, lastKnown: { ...p } });
  const ev: SimEvent[] = [];
  const took = runUntil(w, 12, (_, e) => {
    ev.push(...e);
    return s.phase !== 'night';
  });
  expect(took).toBeGreaterThan(0);
  return { w, s, ev, p };
}

describe('death and the last chance', () => {
  it('0 HP opens the last-chance screen and freezes the simulation', () => {
    const { w, s, ev } = killed();
    expect(s.player.hp).toBe(0);
    expect(s.phase).toBe('deathOffer');
    expect(s.deathReason).toBe('deer');
    expect(count(ev, 'death')).toBe(1);
    expect(ev.filter((e) => e.type === 'hit').length).toBe(3);
    // Nothing moves while the offer is open.
    const snap = JSON.stringify(s);
    for (let k = 0; k < 60; k++) w.step({ ...emptyInput(), mz: 1 });
    expect(JSON.stringify(s)).toBe(snap);
    expect(w.drainEvents()).toEqual([]);
    // The night was not survived.
    expect(s.night).toBe(1);
    expect(s.stats.nightsSurvived).toBe(0);
  });

  it('without 4 scrap there is no revive; ending the run is always available', () => {
    const { w, s } = killed(5, 3);
    expect(w.canRevive).toBe(false);
    expect(w.revive()).toBe(false);
    expect(s.phase).toBe('deathOffer');
    expect(s.player.scrap).toBe(3);
    w.endRun();
    expect(s.phase).toBe('end');
    expect(w.revive()).toBe(false);
    for (let k = 0; k < 30; k++) w.step(emptyInput());
    expect(s.phase).toBe('end');
  });

  it('revive: 4 scrap → back at the fire with 50 HP, F = max(F, 42), 4 s shield, Deer retreats, clock kept', () => {
    const { w, s } = killed(5, 6);
    s.fuel = 10;
    s.bright = false;
    const tDeath = s.t;
    const tickDeath = s.tick;
    expect(w.canRevive).toBe(true);
    w.drainEvents();
    expect(w.revive()).toBe(true);
    const ev = w.drainEvents();
    expect(has(ev, 'revived')).toBe(true);
    expect(s.phase).toBe('night');
    expect(s.player.scrap).toBe(2);
    expect(s.player.hp).toBe(50);
    expect(hyp(s.player)).toBeLessThan(2.5);
    expect(s.fuel).toBe(42);
    expect(s.bright).toBe(true);
    expect(s.player.shield).toBe(4);
    expect(s.deer.mode).toBe('retreat');
    expect(s.deer.threat).toBe(0);
    expect(s.t).toBe(tDeath);
    expect(s.tick).toBe(tickDeath);
    expect(s.reviveUsed).toBe(true);
    expect(w.playerProtected).toBe(true);

    // The night goes on from where it stopped and can be survived.
    tick(w);
    expect(s.t).toBeCloseTo(tDeath + DT, 9);
    expect(s.deer.mode).toBe('retreat');
    run(w, 2.9, emptyInput());
    expect(s.player.hp).toBe(50);
    skipPhase(w);
    expect(s.phase).toBe('draft');
    expect(s.stats.nightsSurvived).toBe(1);
  });

  it('a fire that is already above 42 keeps its fuel', () => {
    const { w, s } = killed(5, 4);
    s.fuel = 61.5;
    expect(w.revive()).toBe(true);
    expect(s.fuel).toBe(61.5);
    expect(s.player.scrap).toBe(0);
  });

  it('the 4 s shield protects anywhere, then runs out', () => {
    const { w, s, p } = killed(5, 4);
    expect(w.revive()).toBe(true);
    // Walk straight back out to where it happened.
    place(w, p);
    expect(w.isProtected(s.player)).toBe(false);
    expect(w.playerProtected).toBe(true);
    const log: SimEvent[] = [];
    const shielded = runUntil(w, 6, (_, ev) => {
      log.push(...ev);
      return !w.playerProtected;
    });
    expect(shielded).toBeGreaterThan(3.9);
    expect(shielded).toBeLessThan(4.1);
    expect(has(log, 'hit')).toBe(false);
    expect(s.player.hp).toBe(50);
    // Threat only starts to build on the tick the shield is gone.
    expect(s.deer.threat).toBeLessThanOrEqual((8 * DT) + 1e-9);
  });

  it('only once per run: the second death has no revive even with scrap', () => {
    const { w, s, p } = killed(5, 8);
    expect(w.revive()).toBe(true);
    expect(s.player.scrap).toBe(4);
    s.player.shield = 0;
    place(w, p);
    setDeer(w, 'hunt', { x: p.x + (p.x / hyp(p)) * 1.5, z: p.z + (p.z / hyp(p)) * 1.5 }, { threat: 50, lastKnown: { ...p } });
    const took = runUntil(w, 12, () => s.phase !== 'night');
    expect(took).toBeGreaterThan(0);
    expect(s.phase).toBe('deathOffer');
    expect(s.player.hp).toBe(0);
    expect(w.canRevive).toBe(false);
    expect(w.revive()).toBe(false);
    expect(s.player.scrap).toBe(4);
  });

  it('revive is not available outside the death offer', () => {
    const w = nightWorld(5);
    w.state.player.scrap = 8;
    expect(w.canRevive).toBe(false);
    expect(w.revive()).toBe(false);
    expect(w.state.player.scrap).toBe(8);
    w.endRun(); // no effect in an active phase
    expect(w.state.phase).toBe('night');
  });

  it('the death save keeps the offer: reloading does not undo the death', () => {
    const { w, s } = killed(5, 4);
    const copy = new World(JSON.parse(JSON.stringify(w.serialize())));
    expect(copy.state.phase).toBe('deathOffer');
    expect(copy.state.player.hp).toBe(0);
    expect(copy.canRevive).toBe(true);
    expect(copy.revive()).toBe(true);
    expect(copy.state.phase).toBe('night');
    expect(copy.state.t).toBe(s.t);
  });
});

describe('dawn', () => {
  it('the night counter only moves for a survived night', () => {
    const w = dayWorld(5);
    const s = w.state;
    expect(s.night).toBe(1);
    const toNight = skipPhase(w);
    expect(toNight).toContainEqual({ type: 'nightStart', n: 1 });
    expect(s.night).toBe(1);
    const toDawn = skipPhase(w);
    expect(toDawn).toContainEqual({ type: 'dawn', n: 1 });
    expect(has(toDawn, 'save')).toBe(true);
    expect(s.phase).toBe('draft');
    expect(s.night).toBe(1); // still the night just survived, until the card is confirmed
    expect(s.stats.nightsSurvived).toBe(1);
    // The clock is frozen during the draft.
    const t = s.t;
    for (let k = 0; k < 30; k++) w.step({ ...emptyInput(), mz: 1 });
    expect(s.t).toBe(t);
    skipCard(w);
    w.beginDay();
    const ev = w.drainEvents();
    expect(ev).toContainEqual({ type: 'dayStart', n: 2 });
    expect(s.phase).toBe('day');
    expect(s.night).toBe(2);
    expect(s.t).toBe(0);
    // beginDay is a no-op outside the draft.
    w.beginDay();
    expect(s.night).toBe(2);
  });

  it('a day is 60 s and a night 90 s of simulation', () => {
    const w = dayWorld(5);
    const s = w.state;
    let dayTicks = 0;
    let nightTicks = 0;
    const i = atFire(w);
    for (let k = 0; k < 5000 && s.phase !== 'draft'; k++) {
      if (s.fuel < 50) s.fuel = 70;
      const before = s.phase;
      w.step({ ...i });
      if (before === 'day' && s.phase === 'day') dayTicks++;
      else if (s.phase === 'night') nightTicks++;
    }
    expect(s.phase).toBe('draft');
    // 150 s per cycle at 30 Hz: 1799 day ticks, the dusk tick + 2699 night ticks, the dawn tick.
    expect(dayTicks + nightTicks + 1).toBe(150 * 30);
    expect(nightTicks).toBe(90 * 30);
    expect(s.stats.activeSeconds).toBeCloseTo(150, 6);
  });

  it('the Deer leaves at dawn and the caches close', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.fuel = 75;
    run(w, 30, atFire(w));
    expect(s.deer.mode).not.toBe('hidden');
    expect(s.caches.length).toBe(2);
    s.t = RULES.cycle.nightSeconds - 2 * DT;
    run(w, 0.2, atFire(w));
    expect(s.phase).toBe('draft');
    expect(s.deer.mode).toBe('hidden');
    expect(s.deer.threat).toBe(0);
    expect(s.caches).toEqual([]);
  });

  it('depleted nodes come back up to the daily minimum: 3 snags × 2, 3 piles × 2, 2 bushes × 1', () => {
    for (const seed of [1, 5, 9]) {
      const w = dayWorld(seed);
      const s = w.state;
      expect(s.snagLogs.length).toBeGreaterThanOrEqual(3);
      expect(s.scrapLeft.length).toBeGreaterThanOrEqual(3);
      expect(s.berryLeft.length).toBeGreaterThanOrEqual(2);
      s.snagLogs.fill(0);
      s.scrapLeft.fill(0);
      s.berryLeft.fill(0);
      skipToDawn(w);
      expect(s.snagLogs.filter((v) => v === 2).length).toBe(3);
      expect(s.snagLogs.reduce((a, b) => a + b, 0)).toBe(6);
      expect(s.scrapLeft.filter((v) => v === 2).length).toBe(3);
      expect(s.scrapLeft.reduce((a, b) => a + b, 0)).toBe(6);
      expect(s.berryLeft.filter((v) => v === 1).length).toBe(2);
      expect(s.berryLeft.reduce((a, b) => a + b, 0)).toBe(2);
    }
  });

  it('which depleted nodes come back is an even draw', () => {
    const w = dayWorld(5);
    const s = w.state;
    const hits = s.snagLogs.map(() => 0);
    const N = 300;
    for (let k = 0; k < N; k++) {
      s.snagLogs.fill(0);
      skipToDawn(w);
      s.snagLogs.forEach((v, i) => (hits[i] += v === 2 ? 1 : 0));
      s.night = 1;
      skipCard(w);
      w.beginDay();
    }
    // 3 of 6 every dawn → each snag about half of the time.
    for (const h of hits) {
      expect(h / N).toBeGreaterThan(0.38);
      expect(h / N).toBeLessThan(0.62);
    }
  });

  it('intact nodes stay as they are; only the shortfall is refilled', () => {
    const w = dayWorld(5);
    const s = w.state;
    // Nothing touched: nothing changes.
    const before = JSON.stringify([s.snagLogs, s.scrapLeft, s.berryLeft]);
    skipToDawn(w);
    expect(JSON.stringify([s.snagLogs, s.scrapLeft, s.berryLeft])).toBe(before);
    skipCard(w);
    w.beginDay();

    // Two intact snags, one half-chopped, three empty → exactly one more becomes intact.
    s.snagLogs = [2, 2, 1, 0, 0, 0];
    s.scrapLeft = s.scrapLeft.map((_, i) => (i < 3 ? 2 : 0)); // already at the minimum
    s.berryLeft = s.berryLeft.map((_, i) => (i < 1 ? 1 : 0));
    const scrapBefore = [...s.scrapLeft];
    skipToDawn(w);
    expect(s.snagLogs[0]).toBe(2);
    expect(s.snagLogs[1]).toBe(2);
    expect(s.snagLogs.filter((v) => v === 2).length).toBe(3);
    expect(s.scrapLeft).toEqual(scrapBefore);
    expect(s.berryLeft.filter((v) => v === 1).length).toBe(2);
    expect(s.berryLeft[0]).toBe(1);
  });

  it('the guaranteed day gives at least six logs on every dawn for 12 days', () => {
    const w = dayWorld(7);
    const s = w.state;
    for (let day = 0; day < 12; day++) {
      expect(s.snagLogs.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(6);
      s.snagLogs.fill(0); // chop everything
      skipToDawn(w);
      skipCard(w);
      w.beginDay();
    }
    expect(s.night).toBe(13);
  });

  it('unfinished actions are dropped at dawn', () => {
    const w = nightWorld(5);
    hideDeer(w);
    const s = w.state;
    s.fuel = 75;
    s.player.berries = 1;
    s.t = RULES.cycle.nightSeconds - 0.3;
    tick(w, atFire(w, { eat: true }));
    run(w, 0.5, atFire(w));
    expect(s.phase).toBe('draft');
    expect(s.player.eat).toBe(0);
    expect(s.player.berries).toBe(1);
    expect(s.player.bench).toBe(false);
  });
});

describe('victory', () => {
  it('night 98 still ends in a draft', () => {
    const w = dayWorld(5, 98);
    skipToDawn(w);
    expect(w.state.phase).toBe('draft');
    expect(w.state.hand!.length).toBe(3);
    skipCard(w);
    w.beginDay();
    expect(w.state.night).toBe(99);
  });

  it('surviving night 99 is the victory: exactly once, no draft, nothing after', () => {
    const w = dayWorld(5, 99);
    const s = w.state;
    const ev = skipToDawn(w);
    expect(s.phase).toBe('victory');
    expect(count(ev, 'victory')).toBe(1);
    expect(ev).toContainEqual({ type: 'dawn', n: 99 });
    expect(has(ev, 'save')).toBe(true);
    expect(s.hand).toBeNull();
    expect(s.night).toBe(99);
    expect(s.stats.nightsSurvived).toBe(1);

    // No way to get a second victory or a hundredth night out of the sim.
    const snap = JSON.stringify(s);
    for (let k = 0; k < 120; k++) w.step({ ...emptyInput(), mz: 1, interact: true });
    w.beginDay();
    w.endRun();
    expect(pickCard(w, 0)).toBe('invalid');
    expect(skipCard(w)).toBe(false);
    expect(w.revive()).toBe(false);
    expect(JSON.stringify(s)).toBe(snap);
    expect(w.drainEvents()).toEqual([]);

    // A reload of the victory save is still a victory and stays silent.
    const copy = new World(JSON.parse(JSON.stringify(w.serialize())));
    for (let k = 0; k < 60; k++) copy.step(emptyInput());
    expect(copy.state.phase).toBe('victory');
    expect(copy.drainEvents()).toEqual([]);
  });

  it('a full night 99 at a fed fire reaches the victory with the right burn', () => {
    const w = dayWorld(5, 99);
    const s = w.state;
    s.t = RULES.cycle.daySeconds - DT;
    s.fuel = 75;
    s.player.logs = 6;
    const i = atFire(w);
    let wins = 0;
    let fed = 0;
    for (let k = 0; k < 3000 && s.phase !== 'victory'; k++) {
      const feed = s.fuel <= 55 && s.player.logs > 0;
      if (feed) fed++;
      w.step({ ...i, interact: feed });
      wins += count(w.drainEvents(), 'victory');
      expect(s.bright).toBe(true);
    }
    expect(s.phase).toBe('victory');
    expect(wins).toBe(1);
    expect(s.player.hp).toBe(100);
    // 75 + 20 × feeds − 84.06 burned.
    expect(s.fuel).toBeCloseTo(75 + 20 * fed - 84.06, 1);
    expect(fed).toBeLessThanOrEqual(4);
  });

  it('death on night 99 is not a victory', () => {
    const w = nightWorld(5, 99);
    const s = w.state;
    s.t = 80;
    const p = findOpen(w, 4.5, 15, 28);
    place(w, p);
    s.player.hp = 40;
    setDeer(w, 'hunt', { x: p.x + (p.x / hyp(p)) * 1.5, z: p.z + (p.z / hyp(p)) * 1.5 }, { threat: 50, lastKnown: { ...p } });
    const ev = run(w, 3, emptyInput());
    expect(s.phase).toBe('deathOffer');
    expect(has(ev, 'victory')).toBe(false);
  });
});
