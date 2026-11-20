// Soak runs: scripted bots play whole runs and every tick is checked against
// the invariants of the simulation (no NaN, nobody leaves the disc, fuel and
// HP in range, the Deer outside the bright circle, damage only outside
// protection and only after a full windup).
import { describe, expect, it } from 'vitest';
import { pickCard, replaceCard, skipCard } from '../src/sim/draft';
import { RULES, World, atFire, d2, hyp, lookAt, nonFinite, standAt, type Input, type SimEvent } from './helpers';

const L = RULES.limits;

interface Audit {
  ticks: number;
  hits: number;
  hunts: number;
  maxPlayerR: number;
  maxDeerR: number;
  minDeerEdge: number; // Deer distance beyond the bright edge while it is moving
  staticInsideLight: number; // ticks a standing Deer was inside a circle that grew over it
  maxStaticDepth: number; // …and how deep, metres
  events: Record<string, number>;
}

function newAudit(): Audit {
  return { ticks: 0, hits: 0, hunts: 0, maxPlayerR: 0, maxDeerR: 0, minDeerEdge: Infinity, staticInsideLight: 0, maxStaticDepth: 0, events: {} };
}

const MOVING = new Set(['patrol', 'stalk', 'hunt', 'lunge', 'retreat']);

/** One simulation tick plus the full invariant check. */
function auditedStep(w: World, input: Input, a: Audit, swingStart: { t: number }): SimEvent[] {
  const s = w.state;
  const hpBefore = s.player.hp;
  const deerBefore = { x: s.deer.x, z: s.deer.z };
  w.step(input);
  const ev = w.drainEvents();
  a.ticks++;
  const pl = s.player;
  const d = s.deer;

  // Numbers stay numbers.
  if (!Number.isFinite(pl.x + pl.z + pl.hp + pl.stamina + pl.battery + s.fuel + d.x + d.z + d.heading + d.threat + s.t)) {
    throw new Error(`non-finite state at tick ${s.tick}: ${nonFinite(s).join(', ')}`);
  }
  // Ranges.
  expect(s.fuel).toBeGreaterThanOrEqual(0);
  expect(s.fuel).toBeLessThanOrEqual(RULES.fire.max);
  expect(pl.hp).toBeGreaterThanOrEqual(0);
  expect(pl.hp).toBeLessThanOrEqual(RULES.player.hpMax);
  expect(pl.stamina).toBeGreaterThanOrEqual(0);
  expect(pl.stamina).toBeLessThanOrEqual(RULES.player.staminaMax);
  expect(pl.battery).toBeGreaterThanOrEqual(0);
  expect(pl.battery).toBeLessThanOrEqual(RULES.flashlight.max);
  expect(d.threat).toBeGreaterThanOrEqual(0);
  expect(d.threat).toBeLessThanOrEqual(100);
  if (pl.logs > L.logs || pl.scrap > L.scrap || pl.berries > L.berries || pl.traps > L.traps || pl.flares > L.flares || s.traps.length > L.placedTraps)
    throw new Error(`inventory over the limit at tick ${s.tick}: ${JSON.stringify([pl.logs, pl.scrap, pl.berries, pl.traps, pl.flares, s.traps.length])}`);
  if (pl.logs < 0 || pl.scrap < 0 || pl.berries < 0 || pl.traps < 0 || pl.flares < 0) throw new Error('negative inventory');
  // The disc.
  a.maxPlayerR = Math.max(a.maxPlayerR, hyp(pl));
  expect(hyp(pl)).toBeLessThanOrEqual(RULES.world.radius);
  if (s.phase === 'night' && d.mode !== 'hidden') {
    a.maxDeerR = Math.max(a.maxDeerR, hyp(d));
    expect(hyp(d)).toBeLessThanOrEqual(RULES.world.radius);
    if (s.bright) {
      const edge = hyp(d) - w.radius;
      const moved = d2(d, deerBefore) > 1e-9;
      if (MOVING.has(d.mode) && moved) a.minDeerEdge = Math.min(a.minDeerEdge, edge);
      else if (edge < 0) {
        a.staticInsideLight++;
        a.maxStaticDepth = Math.max(a.maxStaticDepth, -edge);
      }
    }
  }
  // Damage: only from a swing that had its full windup, only outside protection.
  for (const e of ev) {
    a.events[e.type] = (a.events[e.type] ?? 0) + 1;
    if (e.type === 'deerSwing') swingStart.t = s.stats.activeSeconds;
    if (e.type === 'deerHunt') a.hunts++;
    if (e.type === 'hit') {
      a.hits++;
      expect(w.playerProtected).toBe(false);
      expect(s.stats.activeSeconds - swingStart.t).toBeGreaterThanOrEqual(RULES.deer.swingSeconds - 1e-6);
      expect(hpBefore - pl.hp).toBe(Math.min(hpBefore, RULES.deer.damage));
      expect(s.phase === 'night' || s.phase === 'deathOffer').toBe(true);
    }
  }
  if (pl.hp < hpBefore) expect(ev.some((e) => e.type === 'hit')).toBe(true);
  return ev;
}

/** Take card 0 at dawn (replacing slot 0 when the build is full) and start the next day. */
function draftFirstCard(w: World): void {
  const s = w.state;
  expect(s.hand).not.toBeNull();
  expect(s.hand!.length).toBe(3);
  expect(new Set(s.hand).size).toBe(3);
  for (const id of s.hand!) expect(s.cards).not.toContain(id);
  const r = pickCard(w, 0);
  if (r === 'needReplace') expect(replaceCard(w, 0)).toBe(true);
  else if (r === 'invalid') expect(skipCard(w)).toBe(true);
  expect(s.cards.length).toBeLessThanOrEqual(RULES.draft.slots);
  expect(new Set(s.cards).size).toBe(s.cards.length);
  w.beginDay();
}

// ------------------------------------------------------------------ bots

/**
 * The camper: chops by day (teleporting next to a snag and holding LMB), keeps
 * the fire between 55 and 75 F without wasting logs, and never leaves the
 * bright circle at night.
 */
function camperInput(w: World): Input {
  const s = w.state;
  const pl = s.player;
  const wantFeed = s.fuel <= RULES.fire.max - w.mods.fuelPerLog && pl.logs > 0;
  if (s.phase === 'night') return atFire(w, { interact: wantFeed });
  if (wantFeed) return atFire(w, { interact: true });
  if (pl.logs < L.logs) {
    const i = s.snagLogs.findIndex((n) => n > 0);
    if (i >= 0) return standAt(w, w.forest.snags[i], 1.2, { chop: true });
  }
  return atFire(w);
}

function playRun(seed: number, fromNight: number, lastNight: number, bot: (w: World, ev: SimEvent[]) => Input) {
  const w = World.start({ seed, night: fromNight });
  const s = w.state;
  const a = newAudit();
  const swing = { t: -99 };
  let ev: SimEvent[] = [];
  let victories = 0;
  const first = bot(w, ev);
  w.step({ ...first, chop: true }); // any action starts the day clock
  for (let guard = 0; guard < 99 * 4600; guard++) {
    if (s.phase === 'draft') {
      if (s.night >= lastNight) break;
      draftFirstCard(w);
      w.drainEvents();
      continue;
    }
    if (s.phase === 'deathOffer' && w.canRevive) {
      // The in-game last chance: once per run, 4 scrap.
      const t = s.t;
      expect(s.player.hp).toBe(0);
      expect(w.revive()).toBe(true);
      expect(s.t).toBe(t);
      expect(s.player.hp).toBe(RULES.revive.hp);
      a.events.revived = (a.events.revived ?? 0) + 1;
      w.drainEvents();
      continue;
    }
    if (s.phase !== 'day' && s.phase !== 'night') break;
    ev = auditedStep(w, bot(w, ev), a, swing);
    victories += ev.filter((e) => e.type === 'victory').length;
  }
  return { w, s, a, victories };
}

describe('soak: 99 nights', () => {
  it('a camping bot plays nights 1 → 99 on a fixed seed and wins', () => {
    const t0 = Date.now();
    const { s, a, victories } = playRun(20261119, 1, 99, (w) => camperInput(w));
    const ms = Date.now() - t0;
    // 99 cycles of exactly 150 s at 30 Hz.
    expect(s.phase).toBe('victory');
    expect(victories).toBe(1);
    expect(s.night).toBe(99);
    expect(s.stats.nightsSurvived).toBe(99);
    expect(a.ticks).toBe(99 * 4500 - 1); // minus the un-audited first tick that starts the clock
    expect(s.stats.activeSeconds).toBeCloseTo(99 * 150, 3);
    expect(s.player.hp).toBe(100);
    expect(a.hits).toBe(0);
    expect(a.hunts).toBe(0);
    // A moving Deer is never inside the bright circle. A standing one (false
    // provocation) can be overtaken by the circle when a log is fed — at most by
    // the growth of one feed (24 F × 0.08 × 1.2 with C01 + R01) — see the skipped
    // test "a feed that grows the circle…" in deer.test.ts.
    expect(a.minDeerEdge).toBeGreaterThanOrEqual(0);
    expect(a.maxStaticDepth).toBeLessThanOrEqual(24 * 0.08 * 1.2 + 1e-6);
    expect(a.maxPlayerR).toBeLessThanOrEqual(36);
    expect(s.cards.length).toBe(4);
    // The fire never went weak: the guaranteed six logs a day are enough on every night.
    expect(a.events.fireWeak ?? 0).toBe(0);
    expect(a.events.nightStart).toBe(99);
    expect(a.events.dawn).toBe(99);
    // Whole run in reasonable time (≈4 h of game time).
    expect(ms).toBeLessThan(180_000);
  }, 300_000);
});

// ------------------------------------------------------------------ a bot that takes risks

/**
 * The runner: chops and collects scrap by day like the camper, but at night it
 * really walks out to every cache (flashlight on, 1 s on the reflector, E),
 * drops a trap on the way, then loiters at the post until the Deer is coming,
 * eats berries and sprints home. It gets hunted on purpose.
 *   dodger   — side-steps every windup (the GDD's "reliable answer");
 *   tank     — answers the first windup with a flare, then takes a hit before leaving;
 *   reckless — never goes home and never dodges.
 */
type Style = 'dodger' | 'tank' | 'reckless';
function makeRunner(style: Style = 'dodger') {
  let mode: 'home' | 'out' | 'bait' | 'back' = 'home';
  let post = -1;
  let trapHold = 0;
  let lightWanted = false;
  let outSince = 0;
  return (w: World, ev: SimEvent[]): Input => {
    const s = w.state;
    const pl = s.player;
    if (s.phase === 'day') {
      mode = 'home';
      const wantFeed = s.fuel <= RULES.fire.max - w.mods.fuelPerLog && pl.logs > 0;
      if (wantFeed) return atFire(w, { interact: true });
      if (pl.logs < L.logs) {
        const i = s.snagLogs.findIndex((n) => n > 0);
        if (i >= 0) return standAt(w, w.forest.snags[i], 1.2, { chop: true });
      }
      if (pl.scrap < L.scrap) {
        const i = s.scrapLeft.findIndex((n) => n > 0);
        if (i >= 0) return standAt(w, w.forest.scrap[i], 1.2, { interact: pl.pick <= 0 });
      }
      if (pl.berries < L.berries) {
        const i = s.berryLeft.findIndex((n) => n > 0);
        if (i >= 0) return standAt(w, w.forest.bushes[i], 1.2, { interact: pl.pick <= 0 });
      }
      return atFire(w);
    }
    // ---- night: no teleports from here on, except the first step home at dusk.
    for (const e of ev) {
      if (e.type === 'nightStart') {
        mode = 'home';
        atFire(w);
      }
      if (e.type === 'cacheCue' && (pl.hp > 40 || style === 'reckless')) {
        mode = 'out';
        post = e.post;
        outSince = s.t;
        trapHold = pl.traps > 0 || pl.scrap >= w.mods.trapCost ? 28 : 0;
      }
      // With the tag in the pocket it loiters at the post until the Deer is really coming.
      if ((e.type === 'cacheClaim' || e.type === 'cacheClosed') && mode === 'out') mode = 'bait';
    }
    if (style !== 'reckless') {
      if (mode === 'out' && (pl.hp <= 40 || s.t - outSince > 16)) mode = 'back';
      if (mode === 'bait' && (pl.hp <= (style === 'tank' ? 60 : 40) || s.t - outSince > 26 || s.t > 84)) mode = 'back';
    }
    const eat = pl.hp <= 60 && pl.berries > 0 && pl.eat <= 0;
    const d = s.deer;
    const wobble = Math.sin(s.tick / 7) * 0.2;

    if (mode === 'home') {
      const r = hyp(pl);
      const feed = s.fuel <= RULES.fire.max - w.mods.fuelPerLog && pl.logs > 0;
      const i = lookAt(w, { x: 0, z: 0 }, { eat, interact: feed && r < 2.6 });
      if (r > 2.4) i.mz = 1;
      if (pl.lightOn) i.light = true; // save the battery at the fire
      return i;
    }
    if (mode === 'out') {
      const target = w.forest.posts[post];
      const dist = d2(pl, target);
      const i = lookAt(w, target, { eat });
      if (!pl.lightOn && pl.battery > 5 && pl.torch <= 0 && !lightWanted) {
        i.light = true;
        lightWanted = true;
      } else lightWanted = false;
      if (trapHold > 0 && hyp(pl) > 9.5) {
        i.trapHold = true;
        trapHold--;
      }
      if (d.mode === 'swing' && style === 'dodger') return lookAt(w, d, { mx: 1, sprint: true });
      if (dist > 1.5) {
        i.mz = 1;
        i.mx = wobble;
      } else if (w.focus?.kind === 'cache' && w.focus.usable) i.interact = true;
      return i;
    }
    if (mode === 'bait') {
      if (style === 'tank' && d.mode === 'swing' && d.timer < 0.1 && pl.flares > 0) return lookAt(w, d, { flare: true });
      if (style === 'dodger' && d.mode === 'swing') return lookAt(w, d, { mx: 1, sprint: true });
      if (style === 'dodger' && (d.mode === 'hunt' || d.mode === 'lunge') && d2(d, pl) < 6) mode = 'back';
      else return lookAt(w, d.mode === 'hidden' ? { x: 0, z: 0 } : d, { eat });
    }
    // back
    if (hyp(pl) <= 2.4) {
      mode = 'home';
      return lookAt(w, { x: 0, z: 0 });
    }
    if (style === 'dodger' && d.mode === 'swing' && d2(d, pl) < 3) return lookAt(w, d, { mx: 1, sprint: true });
    return lookAt(w, { x: 0, z: 0 }, { mz: 1, mx: wobble, sprint: true, eat });
  };
}

describe('soak: every stage with a bot that leaves the light', () => {
  const total = newAudit();
  const outcomes: string[] = [];
  for (const from of [1, 10, 20, 30, 50, 75, 97]) {
    it(`nights ${from}–${from + 2}: hunted, never hurt inside protection, state stays sane`, () => {
      for (const [seed, style] of [
        [11, 'dodger'],
        [12, 'tank'],
      ] as const) {
        const { s, a, victories } = playRun(seed * 1000 + from, from, from + 2, makeRunner(style));
        // Legitimate endings only: still alive at the last dawn, the final victory, or dead at 0 HP.
        expect(['draft', 'victory', 'deathOffer']).toContain(s.phase);
        if (s.phase === 'deathOffer') {
          expect(s.player.hp).toBe(0);
          expect(a.hits).toBeGreaterThanOrEqual(3);
        } else expect(s.player.hp).toBeGreaterThan(0);
        expect(victories).toBe(s.phase === 'victory' ? 1 : 0);
        if (s.phase === 'victory') expect(s.night).toBe(99);
        expect(a.minDeerEdge).toBeGreaterThanOrEqual(0);
        if (style === 'dodger') expect(a.hits).toBe(0); // the side step always works, on every stage
        outcomes.push(`${from}/${style}:${s.phase}@${s.night} hits=${a.hits} hunts=${a.hunts}`);
        total.hits += a.hits;
        total.hunts += a.hunts;
        total.staticInsideLight += a.staticInsideLight;
        total.maxStaticDepth = Math.max(total.maxStaticDepth, a.maxStaticDepth);
        for (const [k, v] of Object.entries(a.events)) total.events[k] = (total.events[k] ?? 0) + v;
      }
    }, 60_000);
  }

  it('a reckless bot dies legitimately, gets its one revive for 4 scrap, and dies for good', () => {
    for (const from of [1, 50, 75]) {
      const { w, s, a } = playRun(13000 + from, from, from + 2, makeRunner('reckless'));
      expect(s.phase).toBe('deathOffer');
      expect(s.player.hp).toBe(0);
      expect(s.reviveUsed).toBe(true);
      expect(a.events.revived).toBe(1);
      expect(w.canRevive).toBe(false);
      // 100 → 0 takes three hits, 50 → 0 after the revive two more (berries can add a few).
      expect(a.hits).toBeGreaterThanOrEqual(5);
      expect(a.events.death).toBe(2);
      expect(a.minDeerEdge).toBeGreaterThanOrEqual(0);
      total.hits += a.hits;
      total.hunts += a.hunts;
      for (const [k, v] of Object.entries(a.events)) total.events[k] = (total.events[k] ?? 0) + v;
      outcomes.push(`${from}/reckless:${s.phase}@${s.night} hits=${a.hits} hunts=${a.hunts}`);
    }
  }, 60_000);

  it('the runner really exercised the systems', () => {
    // If this fails the bot no longer leaves the light and the suite above proves nothing.
    expect(outcomes.length).toBe(17);
    expect(total.hunts).toBeGreaterThan(20);
    expect(total.hits).toBeGreaterThan(10);
    expect(total.events.flare ?? 0).toBeGreaterThan(3);
    expect(total.events.deerStunned ?? 0).toBeGreaterThan(10);
    expect(total.events.deerMiss ?? 0).toBeGreaterThan(20);
    expect(total.events.cacheClaim ?? 0).toBeGreaterThan(10);
    expect(total.events.tagsBanked ?? 0).toBeGreaterThan(5);
    expect(total.events.deerRetreat ?? 0).toBeGreaterThan(20);
    expect(total.events.deerSwing ?? 0).toBeGreaterThan(5);
    expect(total.events.trapPlaced ?? 0).toBeGreaterThan(3);
    expect((total.events.deerChime ?? 0) + (total.events.deerCue ?? 0)).toBeGreaterThan(40);
    expect(total.maxStaticDepth).toBeLessThanOrEqual(24 * 0.08 * 1.2 + 1e-6);
  });
});

// ------------------------------------------------------------------ 100 seeds

describe('soak: 100 seeds, day 1 + night 1, doing nothing at the fire', () => {
  it('keeps every invariant; the unfed fire goes weak and the Deer comes for the player', () => {
    const endings: Record<string, number> = {};
    let earliestHit = Infinity;
    let earliestWeak = Infinity;
    for (let seed = 1; seed <= 100; seed++) {
      const w = World.start({ seed });
      const s = w.state;
      s.dayStarted = true;
      const a = newAudit();
      const swing = { t: -99 };
      for (let k = 0; k < 4600 && (s.phase === 'day' || s.phase === 'night'); k++) {
        const ev = auditedStep(w, atFire(w), a, swing);
        if (s.phase === 'night') {
          if (ev.some((e) => e.type === 'fireWeak')) earliestWeak = Math.min(earliestWeak, s.t);
          if (ev.some((e) => e.type === 'hit')) earliestHit = Math.min(earliestHit, s.t);
        }
        if (s.phase === 'day') expect(s.deer.mode).toBe('hidden');
      }
      endings[s.phase] = (endings[s.phase] ?? 0) + 1;
      expect(['deathOffer', 'draft']).toContain(s.phase);
      expect(a.minDeerEdge).toBeGreaterThanOrEqual(0);
      expect(a.staticInsideLight).toBe(0); // nobody feeds, so the circle only shrinks
      expect(nonFinite(s)).toEqual([]);
      if (s.phase === 'deathOffer') {
        expect(s.player.hp).toBe(0);
        expect(a.hits).toBe(3);
        expect(w.canRevive).toBe(false); // no scrap was collected
        expect(s.stats.nightsSurvived).toBe(0);
      } else {
        expect(s.stats.nightsSurvived).toBe(1);
        expect(s.hand!.length).toBe(3);
      }
      // Dusk fuel is 42 − 9 = 33 on every seed.
      expect(a.events.fireWeak).toBe(1);
    }
    // (33 − 24) / 0.64 ≈ 14.1 s into the night the circle stops protecting…
    expect(earliestWeak).toBeGreaterThan(13.9);
    expect(earliestWeak).toBeLessThan(14.3);
    // …and nobody can be hit before threat (4 s), the signal (1.2 s) and a windup (0.65 s) have run.
    expect(earliestHit).toBeGreaterThanOrEqual(earliestWeak + 4 + 1.2 + 0.65 - 0.1);
    // Standing at a dead fire all night is fatal on (nearly) every seed.
    expect(endings.deathOffer ?? 0).toBeGreaterThanOrEqual(95);
  }, 120_000);
});
