// The ten gameplay additions (IDEAS in rules.ts, logic in src/sim/ideas.ts):
// omens, bell nights, night challenges, tracks, resin pine, tin lure, ember
// blow and the run score — plus saves with and without the new fields.
import { afterEach, describe, expect, it } from 'vitest';
import { RunStore, defaultProfile, type ProgressStore } from '../src/platform/store';
import { lureDeer } from '../src/sim/deer';
import { dealHand, reroll, skipCard } from '../src/sim/draft';
import { lineOfSight } from '../src/sim/forest';
import { CHALLENGES, challengeForNight, newIdeas, omenForNight } from '../src/sim/ideas';
import { Rng } from '../src/sim/rng';
import { CARDS, CARD_BY_ID, IDEAS, burnRate, huntSpeed, omenMods, threatRate, type ChallengeKind, type Omen } from '../src/sim/rules';
import type { DeerMode, RunState } from '../src/sim/types';
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
  findOpen,
  has,
  hideDeer,
  hyp,
  lookAt,
  nightWorld,
  nonFinite,
  place,
  run,
  runUntil,
  segClear,
  setDeer,
  skipPhase,
  skipToDawn,
  snapshot,
  standAt,
  tick,
  yawTo,
  type Input,
  type SimEvent,
  type V2,
} from './helpers';

const D = RULES.deer;
const P = IDEAS.points;
const add = (p: V2, u: V2, m: number): V2 => ({ x: p.x + u.x * m, z: p.z + u.z * m });
const outward = (p: V2): V2 => ({ x: p.x / hyp(p), z: p.z / hyp(p) });
const reload = (w: World): World => new World(JSON.parse(JSON.stringify(w.serialize())));
const scoreEvents = (ev: SimEvent[], why: string) => ev.filter((e) => e.type === 'score' && e.why === why);

// Tests flip the feature switches; every test starts from the shipped values again.
const SWITCHES = { ...IDEAS };
afterEach(() => {
  Object.assign(IDEAS, SWITCHES);
});

/** First tick of night `night` with the given omen and challenge already announced. */
function nightWith(seed: number, night: number, omen: Omen, challenge: ChallengeKind = ''): World {
  const w = dayWorld(seed, night);
  const s = w.state;
  s.ideas.omen = omen;
  s.ideas.challenge = challenge;
  s.t = RULES.cycle.daySeconds - DT;
  place(w, { x: 1.5, z: 1.5 });
  w.step(emptyInput());
  if (s.phase !== 'night') throw new Error('nightWith: expected night');
  w.drainEvents();
  return w;
}

/** Next day after a survived night: dawn → skip the card → day. */
function nextDay(w: World): void {
  skipToDawn(w);
  skipCard(w);
  w.beginDay();
  w.drainEvents();
}

/** A real hit: the Deer finishes a swing at arm's length from the unprotected player. */
function hitPlayer(w: World): SimEvent[] {
  const s = w.state;
  const pl = s.player;
  const u = outward(pl);
  pl.invuln = 0;
  setDeer(w, 'swing', add(pl, u, 1.5), { timer: D.swingSeconds, swingDirX: -u.x, swingDirZ: -u.z, sinceSwing: 0 });
  const hp = pl.hp;
  const ev = tick(w, lookAt(w, s.deer));
  expect(pl.hp).toBe(hp - D.damage);
  return ev;
}

// ------------------------------------------------------------------ 2. omens

describe('omens: the roll', () => {
  it('night 1 is calm, every fifth night is a bell night, the rest follow 40 / 15 / 15 / 15 / 15', () => {
    const seen: Record<string, number> = {};
    let n = 0;
    for (let seed = 1; seed <= 200; seed++) {
      expect(omenForNight(seed, 1)).toBe('calm');
      for (let night = 2; night <= 99; night++) {
        const o = omenForNight(seed, night);
        if (night % 5 === 0) {
          expect(o).toBe('bell');
          continue;
        }
        expect(o).not.toBe('bell');
        seen[o] = (seen[o] ?? 0) + 1;
        n++;
      }
    }
    expect(seen.calm / n).toBeGreaterThan(0.37);
    expect(seen.calm / n).toBeLessThan(0.43);
    for (const o of ['fog', 'wind', 'moon', 'still']) {
      expect(seen[o] / n, o).toBeGreaterThan(0.13);
      expect(seen[o] / n, o).toBeLessThan(0.17);
    }
    expect(Object.keys(seen).sort()).toEqual(['calm', 'fog', 'moon', 'still', 'wind']);
    // The table itself: weights add up to one.
    expect(IDEAS.omen.table.reduce((a, [, p]) => a + p, 0)).toBeCloseTo(1, 9);
  });

  it('depends on the seed and the night only', () => {
    const a = Array.from({ length: 98 }, (_, i) => omenForNight(4242, i + 2));
    const b = Array.from({ length: 98 }, (_, i) => omenForNight(4242, i + 2));
    expect(b).toEqual(a);
    expect(Array.from({ length: 98 }, (_, i) => omenForNight(4243, i + 2))).not.toEqual(a);
    // Two runs of one seed reach the same dusk along different routes: same omen, same challenge.
    const w1 = dayWorld(4242, 7);
    const w2 = dayWorld(4242, 7);
    w2.rngThreat.next();
    w2.rngLoot.next();
    w2.rngCards.next();
    run(w1, 43.2, atFire(w1));
    run(w2, 43.2, { ...emptyInput(), mz: 1, sprint: true });
    expect(w1.state.ideas.omen).toBe(omenForNight(4242, 7));
    expect(w2.state.ideas.omen).toBe(w1.state.ideas.omen);
    expect(w2.state.ideas.challenge).toBe(w1.state.ideas.challenge);
  });

  it('is announced on the dusk tick (day second 43) and cleared when the next day begins', () => {
    // A night that is neither calm nor a bell night.
    const seed = 7;
    let night = 2;
    while (omenForNight(seed, night) === 'calm' || omenForNight(seed, night) === 'bell') night++;
    const w = dayWorld(seed, night);
    const s = w.state;
    s.fuel = 75;
    const before = run(w, 42.9, atFire(w));
    expect(has(before, 'dusk')).toBe(false);
    expect(s.ideas.omen).toBe('calm');
    expect(s.ideas.challenge).toBe('');
    const at = run(w, 0.2, atFire(w));
    expect(has(at, 'dusk')).toBe(true);
    expect(s.ideas.omen).toBe(omenForNight(seed, night));
    expect(s.ideas.challenge).toBe(challengeForNight(seed, night));
    expect(CHALLENGES).toContain(s.ideas.challenge);
    // It holds through the night and the dawn screen, and is gone on the next morning.
    run(w, 20, atFire(w));
    expect(s.phase).toBe('night');
    expect(s.ideas.omen).toBe(omenForNight(seed, night));
    skipPhase(w);
    expect(s.phase).toBe('draft');
    expect(s.ideas.omen).toBe(omenForNight(seed, night));
    skipCard(w);
    w.beginDay();
    expect(s.ideas.omen).toBe('calm');
    expect(s.ideas.challenge).toBe('');
  });

  it('a world placed straight into a night stays calm: no challenge, two caches, GDD numbers', () => {
    for (const night of [2, 5, 10, 37, 95]) {
      const w = nightWorld(5, night);
      const s = w.state;
      expect(s.ideas.omen).toBe('calm');
      expect(s.ideas.challenge).toBe('');
      expect(s.caches.map((c) => c.openAt)).toEqual([22, 58]);
      expect(omenMods(s.ideas.omen)).toEqual({ sight: 22, burn: 1, moveNoise: 1, chopNoise: 1, threat: 1, hunt: 0 });
    }
  });

  it('night 1 has no omen and no challenge even when the day is played tick by tick', () => {
    const w = dayWorld(9, 1);
    w.state.fuel = 75;
    const ev = run(w, 61, atFire(w));
    expect(has(ev, 'dusk')).toBe(true);
    expect(w.state.phase).toBe('night');
    expect(w.state.ideas.omen).toBe('calm');
    expect(w.state.ideas.challenge).toBe('');
  });

  it('switched off: no omens, no bell nights, no challenges', () => {
    IDEAS.omens = false;
    for (let night = 2; night <= 99; night++) expect(omenForNight(3, night)).toBe(night % 5 === 0 ? 'bell' : 'calm');
    IDEAS.bellNights = false;
    for (let night = 2; night <= 99; night++) expect(omenForNight(3, night)).toBe('calm');
    IDEAS.omens = true;
    expect(omenForNight(3, 10)).not.toBe('bell');
    IDEAS.challenges = false;
    for (let night = 1; night <= 99; night++) expect(challengeForNight(3, night)).toBe('');
  });
});

describe('omens: effects', () => {
  it('wind burns the night fire ×1.15, dead still ×0.9; the day fire is never touched', () => {
    for (const [omen, mult] of [
      ['calm', 1],
      ['fog', 1],
      ['moon', 1],
      ['wind', 1.15],
      ['still', 0.9],
      ['bell', 1],
    ] as const) {
      const w = nightWith(5, 7, omen);
      const s = w.state;
      hideDeer(w);
      s.fuel = 60;
      run(w, 10, atFire(w));
      expect(60 - s.fuel, omen).toBeCloseTo(burnRate('night', 7) * mult * 10, 6);
    }
    // By day (after the dusk announcement, before the night) the burn is the GDD 0.15 F/s.
    const w = dayWorld(5, 7);
    w.state.ideas.omen = 'wind';
    w.state.t = 45;
    w.state.fuel = 60;
    run(w, 10, atFire(w));
    expect(60 - w.state.fuel).toBeCloseTo(RULES.fire.burnDay * 10, 6);
  });

  it('fog cuts the sight of the Deer to 15 m, a clear moon stretches it to 28 m', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    // A 29.5 m line with nothing that blocks sight, its Deer end outside the light.
    let lane: { a: V2; dir: V2 } | null = null;
    search: for (let r = 12; r <= 33; r += 1)
      for (let ad = 0; ad < 360; ad += 5)
        for (let hd = 0; hd < 360; hd += 5) {
          const a = { x: Math.cos((ad * Math.PI) / 180) * r, z: Math.sin((ad * Math.PI) / 180) * r };
          const dir = { x: Math.cos((hd * Math.PI) / 180), z: Math.sin((hd * Math.PI) / 180) };
          const b = add(a, dir, 29.5);
          if (hyp(b) > 34 || !lineOfSight(w.forest.obstacles, a, b, 0.3)) continue;
          lane = { a, dir };
          break search;
        }
    expect(lane).not.toBeNull();
    const seenAt = (omen: Omen, dist: number): boolean => {
      s.ideas.omen = omen;
      setDeer(w, 'stunned', lane!.a, { stunLeft: 99 });
      place(w, add(lane!.a, lane!.dir, dist));
      tick(w);
      return s.deer.lastKnown !== null;
    };
    expect(seenAt('fog', 14.5)).toBe(true);
    expect(seenAt('fog', 15.5)).toBe(false);
    expect(seenAt('calm', 21.5)).toBe(true);
    expect(seenAt('calm', 22.5)).toBe(false);
    expect(seenAt('moon', 27.5)).toBe(true);
    expect(seenAt('moon', 28.5)).toBe(false);
    for (const o of ['wind', 'still', 'bell'] as const) {
      expect(seenAt(o, 21.5), o).toBe(true);
      expect(seenAt(o, 22.5), o).toBe(false);
    }
  });

  it('wind halves the noise of steps and running, dead still makes steps, running and chopping ×1.5', () => {
    const table: [Omen, number, number, number][] = [
      ['calm', 6, 12, 16],
      ['wind', 3, 6, 16],
      ['still', 9, 18, 24],
      ['fog', 6, 12, 16],
      ['moon', 6, 12, 16],
      ['bell', 6, 12, 16],
    ];
    for (const [omen, step, sprint, chop] of table) {
      const w = nightWith(11, 4, omen);
      const s = w.state;
      hideDeer(w);
      const pl = s.player;
      tick(w, { mz: 1 });
      expect(pl.noise, `${omen} step`).toBeCloseTo(step, 9);
      tick(w, { mz: 1, sprint: true });
      expect(pl.noise, `${omen} run`).toBeCloseTo(sprint, 9);
      tick(w, standAt(w, w.forest.snags[1], 1.2, { chop: true }));
      expect(pl.noise, `${omen} chop`).toBeCloseTo(chop, 9);
      tick(w);
      expect(pl.noise).toBe(0);
    }
    // The soft sole (3 / 6 m) stacks with the wind.
    const w = nightWith(11, 4, 'wind');
    w.state.cards = ['R07'];
    w.refreshMods();
    tick(w, { mz: 1 });
    expect(w.state.player.noise).toBeCloseTo(1.5, 9);
    // By day the omen changes nothing.
    const d = dayWorld(11, 4);
    d.state.ideas.omen = 'still';
    d.state.t = 50;
    tick(d, { mz: 1 });
    expect(d.state.player.noise).toBe(6);
  });

  it('the Deer really hears by those radii through a trunk', () => {
    // Player hidden behind the first snag, the Deer straight beyond it (no line of sight).
    const cases: [Omen, number, Partial<Input>, boolean][] = [
      ['wind', 2.6, { mx: 1 }, true],
      ['wind', 3.6, { mx: 1 }, false],
      ['wind', 5.5, { mx: 1, sprint: true }, true],
      ['wind', 6.6, { mx: 1, sprint: true }, false],
      ['still', 8.5, { mx: 1 }, true],
      ['still', 9.6, { mx: 1 }, false],
      ['still', 17.4, { mx: 1, sprint: true }, true],
      ['still', 18.8, { mx: 1, sprint: true }, false],
      ['still', 23, { chop: true }, true],
      ['still', 25, { chop: true }, false],
    ];
    for (const [omen, range, patch, heard] of cases) {
      const w = nightWith(11, 4, omen);
      const s = w.state;
      s.t = 10;
      const snag = w.forest.snags[0];
      const u = outward(snag);
      const pPos = add(snag, u, -1.2);
      place(w, pPos);
      const A = add(pPos, u, range);
      setDeer(w, 'stunned', A, { stunLeft: 99 });
      expect(lineOfSight(w.forest.obstacles, A, pPos)).toBe(false);
      tick(w, { ...emptyInput(), yaw: yawTo(u.x, u.z), ...patch });
      expect(s.deer.lastKnown !== null, `${omen} ${range} ${JSON.stringify(patch)}`).toBe(heard);
    }
  });
});

// ------------------------------------------------------------------ 3. tracks

describe('tracks by day', () => {
  it('every day has a spot 17–21 m out on free ground, the same for the same seed', () => {
    for (const seed of [1, 2, 3, 5, 8, 13, 21, 77]) {
      const w = World.start({ seed });
      const tr = w.state.ideas.tracks!;
      expect(tr).not.toBeNull();
      expect(tr.found).toBe(false);
      expect(hyp(tr)).toBeGreaterThanOrEqual(17 - 1e-9);
      expect(hyp(tr)).toBeLessThanOrEqual(21 + 1e-9);
      expect(Math.atan2(tr.z, tr.x)).toBeCloseTo(Math.atan2(Math.sin(tr.angle), Math.cos(tr.angle)), 9);
      expect(w.forest.nav.walkable(tr)).toBe(true);
      for (const o of w.forest.obstacles) expect(d2(o, tr)).toBeGreaterThanOrEqual(o.r + 1.1);
      expect(World.start({ seed }).state.ideas.tracks).toEqual(tr);
    }
  });

  it('the spot changes from day to day and the Deer steps out there at night', () => {
    const w = dayWorld(5);
    const s = w.state;
    const angles: number[] = [];
    for (let k = 0; k < 6; k++) {
      const tr = s.ideas.tracks!;
      angles.push(tr.angle);
      skipPhase(w); // day → night
      const d = s.deer;
      expect(d.mode).toBe('patrol');
      expect(hyp(d)).toBeGreaterThanOrEqual(18);
      expect(hyp(d)).toBeLessThanOrEqual(26);
      // Within the ±0.15 rad jitter of the 22 m point (3.3 m) plus the snap to a free nav cell.
      expect(d2(d, { x: Math.cos(tr.angle) * 22, z: Math.sin(tr.angle) * 22 })).toBeLessThan(22 * 0.15 + 2.5);
      nextDay(w);
    }
    expect(new Set(angles.map((a) => a.toFixed(3))).size).toBeGreaterThanOrEqual(5);
  });

  it('without a stored spot (old save, or switched off) the Deer comes from the far side of the player', () => {
    for (const off of [false, true]) {
      IDEAS.tracks = !off;
      for (const seed of [1, 2, 3, 5, 8, 13]) {
        const w = dayWorld(seed);
        if (off) expect(w.state.ideas.tracks).toBeNull();
        else w.state.ideas.tracks = null;
        skipPhase(w);
        const d = w.state.deer;
        expect(hyp(d)).toBeGreaterThanOrEqual(18);
        expect(d.x * w.state.player.x + d.z * w.state.player.z).toBeLessThan(0);
      }
    }
  });

  it('coming within 3 m by day finds them once: an event and +25', () => {
    const w = dayWorld(5);
    const s = w.state;
    const tr = s.ideas.tracks!;
    const u = outward(tr);
    place(w, add(tr, u, -3.3));
    expect(tick(w)).toEqual([]);
    expect(tr.found).toBe(false);
    place(w, add(tr, u, -2.9));
    const ev = tick(w);
    expect(ev).toContainEqual({ type: 'tracksFound', x: tr.x, z: tr.z });
    expect(ev).toContainEqual({ type: 'score', n: 25, why: 'tracks' });
    expect(tr.found).toBe(true);
    expect(s.stats.score).toBe(P.tracks);
    // Standing there longer gives nothing more.
    expect(run(w, 2)).toEqual([]);
    expect(s.stats.score).toBe(25);
    // The next day has fresh, unread tracks.
    nextDay(w);
    expect(s.ideas.tracks!.found).toBe(false);
  });

  it('they cannot be read at night', () => {
    const w = nightWorld(5);
    hideDeer(w);
    const tr = w.state.ideas.tracks!;
    place(w, tr);
    const ev = run(w, 1);
    expect(has(ev, 'tracksFound')).toBe(false);
    expect(tr.found).toBe(false);
  });
});

// ------------------------------------------------------------------ 4. resin pine

describe('resin pine', () => {
  it('one intact far pine (3–5) holds three logs each day; the pick is fixed by the seed', () => {
    const picks = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const w = World.start({ seed });
      const s = w.state;
      const i = s.ideas.resinSnag;
      picks.add(i);
      expect(i).toBeGreaterThanOrEqual(3);
      expect(i).toBeLessThanOrEqual(5);
      expect(s.snagLogs[i]).toBe(3);
      expect(s.snagLogs.filter((v) => v === 3).length).toBe(1);
      expect(s.snagLogs.filter((v) => v === 2).length).toBe(5);
      expect(World.start({ seed }).state.ideas.resinSnag).toBe(i);
    }
    expect([...picks].sort()).toEqual([3, 4, 5]);
  });

  it('gives 3 logs for the same 2 s of chopping, and +20 once', () => {
    const w = dayWorld(5);
    const s = w.state;
    const i = s.ideas.resinSnag;
    const input = standAt(w, w.forest.snags[i], 1.2, { chop: true });
    const early = run(w, 1.9, input);
    expect(has(early, 'chopDone')).toBe(false);
    const ev = run(w, 0.2, input);
    expect(ev).toContainEqual({ type: 'chopDone', node: i, logs: 3 });
    expect(ev).toContainEqual({ type: 'score', n: 20, why: 'resin' });
    expect(s.player.logs).toBe(3);
    expect(s.snagLogs[i]).toBe(0);
    expect(s.stats.score).toBe(P.resin);
    expect(s.ideas.resinScored).toBe(true);
    // An ordinary pine: two logs, no bonus.
    const j = s.snagLogs.findIndex((v, k) => v === 2 && k !== i);
    const ev2 = run(w, 2.1, standAt(w, w.forest.snags[j], 1.2, { chop: true }));
    expect(ev2).toContainEqual({ type: 'chopDone', node: j, logs: 2 });
    expect(count(ev2, 'score')).toBe(0);
    expect(s.stats.score).toBe(20);
  });

  it('keeps the pack limit and the partial pickup: 4 in the pack takes 2 and leaves 1', () => {
    const w = dayWorld(5);
    const s = w.state;
    const i = s.ideas.resinSnag;
    s.player.logs = 4;
    const input = standAt(w, w.forest.snags[i], 1.2, { chop: true });
    const ev = run(w, 2.1, input);
    expect(ev).toContainEqual({ type: 'chopDone', node: i, logs: 2 });
    expect(s.player.logs).toBe(RULES.limits.logs);
    expect(s.snagLogs[i]).toBe(1);
    expect(s.stats.score).toBe(20);
    // A full pack cannot chop at all.
    tick(w, input);
    expect(w.focus).toMatchObject({ kind: 'snag', id: i, info: 'full', usable: false });
    // The last log later: no second bonus.
    s.player.logs = 0;
    const ev2 = run(w, 2.1, input);
    expect(ev2).toContainEqual({ type: 'chopDone', node: i, logs: 1 });
    expect(s.stats.score).toBe(20);
  });

  it('the next morning picks again: far ones first, near ones only when no far pine is intact', () => {
    const w = dayWorld(5);
    const s = w.state;
    const morning = (logs: number[]) => {
      skipToDawn(w);
      skipCard(w);
      s.snagLogs = [...logs];
      w.beginDay();
      w.drainEvents();
      return s.ideas.resinSnag;
    };
    // Yesterday's untouched resin pine (3 logs) is an ordinary pine again before the new pick.
    let i = morning([2, 2, 2, 3, 2, 0]);
    expect([3, 4]).toContain(i);
    expect(s.snagLogs.filter((v) => v === 3).length).toBe(1);
    expect(s.snagLogs.reduce((a, b) => a + b, 0)).toBe(2 * 5 + 1);
    // No intact far pine → a near one.
    i = morning([2, 2, 2, 0, 1, 0]);
    expect([0, 1, 2]).toContain(i);
    expect(s.snagLogs[i]).toBe(3);
    expect(s.snagLogs[4]).toBe(1);
    // Nothing intact → no resin pine today.
    i = morning([1, 0, 0, 0, 1, 0]);
    expect(i).toBe(-1);
    expect(s.snagLogs).toEqual([1, 0, 0, 0, 1, 0]);
    expect(s.ideas.resinScored).toBe(false);
  });

  it('switched off: every pine holds two logs', () => {
    IDEAS.resinPine = false;
    const w = World.start({ seed: 5 });
    expect(w.state.ideas.resinSnag).toBe(-1);
    expect(w.state.snagLogs).toEqual([2, 2, 2, 2, 2, 2]);
  });
});

// ------------------------------------------------------------------ 5. tin lure

/** A point `len` m from `from` with a free straight line to it (any obstacle counts) that satisfies `ok`. */
function clearSpot(w: World, from: V2, len: number, ok: (p: V2) => boolean = () => true): V2 {
  for (let ad = 0; ad < 360; ad += 3) {
    const dir = { x: Math.cos((ad * Math.PI) / 180), z: Math.sin((ad * Math.PI) / 180) };
    const p = add(from, dir, len);
    if (hyp(p) > 33 || !w.forest.nav.walkable(p) || !segClear(w, from, add(from, dir, len + 0.6), 0.45) || !ok(p)) continue;
    return p;
  }
  throw new Error('clearSpot: nothing found');
}
/** Input that throws the tin so that it lands on `target` (free line, at most 14 m). */
function throwAt(w: World, target: V2): Input {
  const pl = w.state.player;
  return { ...emptyInput(), yaw: yawTo(target.x - pl.x, target.z - pl.z), pitch: -Math.atan(RULES.world.eyeHeight / d2(pl, target)), lure: true };
}
const lureEvent = (ev: SimEvent[]) => ev.find((e) => e.type === 'lure') as Extract<SimEvent, { type: 'lure' }> | undefined;

/** Night, bright full fire, the player beside it with three scrap; the Deer parked as a stalker. */
function lureWorld(seed = 5) {
  const w = nightWorld(seed);
  const s = w.state;
  s.t = 10;
  s.fuel = 75;
  s.player.scrap = 3;
  place(w, { x: 1.5, z: 1.5 });
  return { w, s, pl: s.player, d: s.deer };
}

describe('tin lure', () => {
  it('R costs 1 scrap, lands on the aim point within 14 m and waits 3 s before the next one', () => {
    const { w, s, pl } = lureWorld();
    hideDeer(w);
    const target = clearSpot(w, pl, 9);
    let ev = tick(w, throwAt(w, target));
    let e = lureEvent(ev)!;
    expect(e.pulled).toBe(false);
    expect(d2(e, target)).toBeLessThan(1e-6);
    expect(pl.scrap).toBe(2);
    // Cooldown: nothing happens, nothing is spent.
    ev = run(w, 2.9, throwAt(w, target));
    expect(lureEvent(ev)).toBeUndefined();
    expect(pl.scrap).toBe(2);
    ev = run(w, 0.2, { ...throwAt(w, target), lure: false });
    ev = tick(w, throwAt(w, target));
    expect(lureEvent(ev)).toBeDefined();
    expect(pl.scrap).toBe(1);
    // Aiming level: the throw is capped at 14 m on a free line.
    run(w, 3.1);
    const far = clearSpot(w, pl, 16);
    ev = tick(w, { ...emptyInput(), yaw: yawTo(far.x - pl.x, far.z - pl.z), pitch: 0, lure: true });
    e = lureEvent(ev)!;
    expect(d2(e, pl)).toBeCloseTo(IDEAS.lureRule.range, 6);
    expect(pl.scrap).toBe(0);
    // No scrap: refused.
    run(w, 3.1);
    ev = tick(w, throwAt(w, target));
    expect(ev).toContainEqual({ type: 'denied', why: 'lureScrap' });
    expect(lureEvent(ev)).toBeUndefined();
  });

  it('a trunk in the way stops the tin at its foot', () => {
    const { w, pl } = lureWorld();
    hideDeer(w);
    // The nearest tree with nothing else on the way to it.
    const tree = w.forest.obstacles
      .filter((o) => {
        const d = d2(o, pl);
        const toward = { x: (o.x - pl.x) / d, z: (o.z - pl.z) / d };
        return o.kind === 'tree' && d < 13 && segClear(w, pl, add(pl, toward, d - o.r - 0.5), 0.3);
      })
      .sort((a, b) => d2(a, pl) - d2(b, pl))[0];
    expect(tree).toBeDefined();
    const ev = tick(w, { ...emptyInput(), yaw: yawTo(tree.x - pl.x, tree.z - pl.z), pitch: 0, lure: true });
    const e = lureEvent(ev)!;
    expect(d2(e, pl)).toBeLessThan(d2(tree, pl) - tree.r);
    expect(d2(e, tree)).toBeLessThan(tree.r + 0.35);
  });

  it('by day it is refused and costs nothing; switched off it does nothing at all', () => {
    const w = dayWorld(5);
    w.state.player.scrap = 2;
    expect(tick(w, { lure: true })).toContainEqual({ type: 'denied', why: 'lureDay' });
    expect(w.state.player.scrap).toBe(2);
    IDEAS.lure = false;
    const n = lureWorld();
    expect(tick(n.w, { lure: true })).toEqual([]);
    expect(n.pl.scrap).toBe(3);
  });

  it('pulls a stalking Deer from the fire: it walks there at 1.5× stalk speed, looks around 2 s, resumes', () => {
    const { w, s, pl, d } = lureWorld();
    const target = clearSpot(w, pl, 12);
    // The Deer 5 m from the spot on a free line, outside the light, in plain view of the protected player.
    const from = clearSpot(w, target, 5, (p) => hyp(p) > 11.5 && segClear(w, p, target, 0.8));
    setDeer(w, 'stalk', from, { orbitTimer: 99 });
    expect(w.playerProtected).toBe(true);
    expect(lineOfSight(w.forest.obstacles, from, pl)).toBe(true);
    const ev = tick(w, throwAt(w, target));
    expect(lureEvent(ev)!.pulled).toBe(true);
    expect(d.mode).toBe('lured');
    expect(d2(d.lure!, target)).toBeLessThan(1e-9);
    expect(pl.scrap).toBe(2);
    // Speed on the straight: 3.2 × 1.5 = 4.8 m/s (the throw tick already moved it one step).
    const p0 = { x: d.x, z: d.z };
    run(w, 0.5, atFire(w));
    expect(d2(d, p0)).toBeCloseTo(D.stalkSpeed * IDEAS.lureRule.speedMult * 0.5, 1);
    // Arrival, then 2 s on the spot.
    const arrive = runUntil(w, 3, () => d.lureT > 0, atFire(w));
    expect(arrive).toBeGreaterThan(0);
    expect(d2(d, target)).toBeLessThan(1.25);
    const spot = { x: d.x, z: d.z };
    const looked = runUntil(w, 4, () => d.mode !== 'lured', atFire(w));
    expect(looked).toBeGreaterThan(IDEAS.lureRule.lookSeconds - 0.1);
    expect(looked).toBeLessThan(IDEAS.lureRule.lookSeconds + 0.1);
    expect(d2(d, spot)).toBeLessThan(0.3);
    expect(d.mode).toBe('stalk');
    expect(d.lure).toBeNull();
    expect(s.player.hp).toBe(100);
  });

  it('also pulls a Deer on patrol, and a second tin re-aims a lured one', () => {
    const { w, pl, d } = lureWorld();
    const target = clearSpot(w, pl, 12);
    setDeer(w, 'patrol', add(target, outward(target), 6));
    expect(lureEvent(tick(w, throwAt(w, target)))!.pulled).toBe(true);
    expect(d.mode).toBe('lured');
    run(w, 3.1, atFire(w));
    if (d.mode !== 'lured') setDeer(w, 'lured', { x: d.x, z: d.z }, { lure: { ...target }, lureT: 0.5 });
    const other = clearSpot(w, pl, 10, (p) => d2(p, target) > 4);
    expect(lureEvent(tick(w, throwAt(w, other)))!.pulled).toBe(true);
    expect(d.mode).toBe('lured');
    expect(d2(d.lure!, other)).toBeLessThan(1e-9);
    expect(d.lureT).toBe(0);
  });

  it('does nothing beyond 16 m from the spot (the scrap is still spent)', () => {
    const { w, pl, d } = lureWorld();
    const target = clearSpot(w, pl, 12);
    const u = outward(target);
    const far = { x: -u.x * 11, z: -u.z * 11 }; // the other side of the fire
    expect(d2(far, target)).toBeGreaterThan(IDEAS.lureRule.pullRadius);
    setDeer(w, 'stalk', far, { orbitTimer: 99 });
    expect(lureEvent(tick(w, throwAt(w, target)))!.pulled).toBe(false);
    expect(d.mode).toBe('stalk');
    expect(d.lure).toBeNull();
    expect(pl.scrap).toBe(2);
  });

  it('a Deer that perceives a player outside the light ignores it; an unseen player fools it', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    s.player.scrap = 4;
    const lane = findLane(w, 26, 1.5, 13, 34);
    place(w, lane.a);
    const target = add(lane.a, lane.dir, 12);
    expect(w.playerProtected).toBe(false);
    // 20 m away with a clear line: it sees the exposed player.
    setDeer(w, 'stalk', add(lane.a, lane.dir, 20), { orbitTimer: 99 });
    let ev = tick(w, throwAt(w, target));
    expect(lureEvent(ev)!.pulled).toBe(false);
    expect(s.deer.mode).toBe('stalk');
    // 26 m away is beyond its 22 m sight and the player stands still: the clatter works.
    run(w, 3.1, { ...emptyInput(), yaw: lane.yaw });
    setDeer(w, 'stalk', lane.b, { orbitTimer: 99 });
    ev = tick(w, throwAt(w, target));
    expect(lureEvent(ev)!.pulled).toBe(true);
    expect(s.deer.mode).toBe('lured');
    // …but a running player is heard at 12 m, however dark it is.
    run(w, 3.1, { ...emptyInput(), yaw: lane.yaw });
    setDeer(w, 'stalk', add(lane.a, lane.dir, 11), { orbitTimer: 99 });
    s.ideas.omen = 'fog'; // 15 m sight would still see; noise alone is enough either way
    ev = tick(w, { ...throwAt(w, target), mz: -1, sprint: true });
    expect(lureEvent(ev)!.pulled).toBe(false);
  });

  it('never works during a real cue, a feint, a swing, a lunge, recovery, stun or retreat', () => {
    const { w, d } = lureWorld();
    const at = { x: 12, z: 3 };
    for (const mode of ['cue', 'feint', 'swing', 'lunge', 'recover', 'stunned', 'retreat', 'hidden'] as DeerMode[]) {
      setDeer(w, mode, { x: 14, z: 5 }, { stunLeft: 2 });
      expect(lureDeer(w, at), mode).toBe(false);
      expect(d.mode).toBe(mode);
      expect(d.lure).toBeNull();
      expect(d.lastKnown).toBeNull();
    }
    // The same through the input, for the 1.2 s cue of a real hunt.
    const n = nightWorld(5);
    n.state.t = 10;
    n.state.player.scrap = 2;
    const lane = findLane(n, 26, 1.5, 13, 34);
    place(n, lane.a);
    setDeer(n, 'cue', lane.b, { threat: 60 });
    const ev = tick(n, throwAt(n, add(lane.a, lane.dir, 12)));
    expect(lureEvent(ev)!.pulled).toBe(false);
    expect(n.state.deer.mode).toBe('cue');
  });

  it('in a hunt without a sighting the spot becomes the last known point', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    s.player.scrap = 4;
    const lane = findLane(w, 26, 1.5, 13, 34);
    place(w, lane.a);
    const target = add(lane.a, lane.dir, 12);
    const old = add(lane.b, lane.dir, -0.5);
    setDeer(w, 'hunt', lane.b, { threat: 60, lastKnown: { ...old }, lostT: 2 });
    const d = s.deer;
    const ev = tick(w, throwAt(w, target));
    expect(lureEvent(ev)!.pulled).toBe(true);
    expect(d.mode).toBe('hunt');
    expect(d2(d.lastKnown!, target)).toBeLessThan(1e-9);
    expect(d.lostT).toBeLessThan(0.1);
    // It runs to the tin instead of giving up where it stood.
    const before = d2(d, target);
    run(w, 1, { ...emptyInput(), yaw: lane.yaw });
    expect(d2(d, target)).toBeLessThan(before - 4);
    // With the player in sight the hunt is not distracted.
    run(w, 2.2, { ...emptyInput(), yaw: lane.yaw });
    s.player.hp = 100;
    setDeer(w, 'hunt', add(lane.a, lane.dir, 15), { threat: 60, lastKnown: null });
    const ev2 = tick(w, throwAt(w, target));
    expect(lureEvent(ev2)!.pulled).toBe(false);
    expect(d.lastKnown).toEqual({ x: s.player.x, z: s.player.z });
  });

  it('a tin inside the bright circle is watched from the rim: the Deer never steps into the light', () => {
    const { w, s, pl, d } = lureWorld();
    const ring = w.radius + 2.8;
    const stalkAt = [0, 1, 2, 3, 4, 5].map((k) => ({ x: Math.cos(k) * ring, z: Math.sin(k) * ring })).find((p) => w.forest.nav.walkable(p) && w.forest.obstacles.every((o) => d2(o, p) > o.r + 1))!;
    setDeer(w, 'stalk', stalkAt, { orbitTimer: 99 });
    // Dropped at the player's feet, 2 m from the fire.
    const ev = tick(w, { ...emptyInput(), yaw: yawTo(-pl.x, -pl.z), pitch: -1.2, lure: true });
    const e = lureEvent(ev)!;
    expect(hyp(e)).toBeLessThan(w.radius - 2);
    expect(e.pulled).toBe(true);
    let minEdge = Infinity;
    const modes = new Set<string>();
    run(w, 9, atFire(w), () => {
      s.fuel = 75;
      modes.add(d.mode);
      minEdge = Math.min(minEdge, hyp(d) - w.radius);
    });
    expect(minEdge).toBeGreaterThanOrEqual(0.39);
    expect(modes.has('lured')).toBe(true);
    expect(d.mode).toBe('stalk'); // it looked from the rim and went back to stalking
    expect(pl.hp).toBe(100);
  });

  it('a real cue interrupts the walk to the tin', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    const lane = findLane(w, 26, 1.5, 13, 34);
    place(w, lane.a);
    setDeer(w, 'lured', lane.b, { lure: add(lane.a, lane.dir, 12), lureT: 0, threat: 31.9 });
    const ev = tick(w);
    expect(has(ev, 'deerCue')).toBe(true);
    expect(s.deer.mode).toBe('cue');
    expect(s.deer.lure).toBeNull();
  });

  it('can walk it into a trap', () => {
    const { w, s, pl, d } = lureWorld();
    const target = clearSpot(w, pl, 12);
    const from = clearSpot(w, target, 6, (p) => hyp(p) > 11.5 && segClear(w, p, target, 0.8));
    setDeer(w, 'stalk', from, { orbitTimer: 99 });
    s.traps.push({ id: 1, x: (from.x + target.x) / 2, z: (from.z + target.z) / 2, arm: 0 });
    tick(w, throwAt(w, target));
    const ev = run(w, 2, atFire(w));
    expect(has(ev, 'trapSnap')).toBe(true);
    expect(d.mode).toBe('stunned');
    expect(s.stats.score).toBe(P.trap);
  });
});

// ------------------------------------------------------------------ 6. night challenges

describe('night challenges', () => {
  it('one of five from night 2 on, none on night 1; the same for the same seed and night', () => {
    const seen: Record<string, number> = {};
    for (let seed = 1; seed <= 100; seed++) {
      expect(challengeForNight(seed, 1)).toBe('');
      for (let night = 2; night <= 99; night++) {
        const c = challengeForNight(seed, night);
        expect(CHALLENGES).toContain(c);
        expect(challengeForNight(seed, night)).toBe(c);
        seen[c] = (seen[c] ?? 0) + 1;
      }
    }
    expect(Object.keys(seen).sort()).toEqual([...CHALLENGES].sort());
    for (const c of CHALLENGES) {
      expect(seen[c] / 9800, c).toBeGreaterThan(0.17);
      expect(seen[c] / 9800, c).toBeLessThan(0.23);
    }
  });

  it('(a) two tags banked tonight', () => {
    const w = nightWith(5, 3, 'calm', 'bothTags');
    const s = w.state;
    hideDeer(w);
    s.player.tags = 1;
    let ev = tick(w, atFire(w));
    expect(has(ev, 'tagsBanked')).toBe(true);
    expect(has(ev, 'challengeDone')).toBe(false);
    expect(s.ideas.nightBanked).toBe(1);
    s.player.tags = 1;
    ev = tick(w, atFire(w));
    expect(ev).toContainEqual({ type: 'challengeDone', kind: 'bothTags' });
    expect(s.ideas.challengeDone).toBe(true);
    expect(s.stats.score).toBe(2 * P.tag);
    // Tags handed in by day do not count for the night.
    const d = dayWorld(5, 3);
    d.state.ideas.challenge = 'bothTags';
    d.state.player.tags = 2;
    tick(d, atFire(d));
    expect(d.state.ideas.challengeDone).toBe(false);
    expect(d.state.ideas.nightBanked).toBe(0);
    expect(d.state.stats.score).toBe(2 * P.tag);
  });

  it('(b) the Deer caught in a trap tonight', () => {
    const w = nightWith(5, 3, 'calm', 'trap');
    const s = w.state;
    s.t = 10;
    s.fuel = 75;
    setDeer(w, 'stalk', { x: 13, z: 0 }, { orbitTimer: 99 });
    s.traps.push({ id: 1, x: s.deer.x, z: s.deer.z, arm: 0 });
    const ev = tick(w, atFire(w));
    expect(has(ev, 'trapSnap')).toBe(true);
    expect(ev).toContainEqual({ type: 'challengeDone', kind: 'trap' });
    expect(s.ideas.nightTraps).toBe(1);
  });

  it('(c) no log on the fire before second 45', () => {
    // Kept: done on the tick the clock reaches 45.
    let w = nightWith(5, 3, 'calm', 'lateFeed');
    let s = w.state;
    hideDeer(w);
    s.fuel = 75;
    s.player.logs = 3;
    let ev = run(w, 44.9, atFire(w));
    expect(has(ev, 'challengeDone')).toBe(false);
    ev = run(w, 0.2, atFire(w));
    expect(ev).toContainEqual({ type: 'challengeDone', kind: 'lateFeed' });
    // Feeding afterwards is fine.
    s.fuel = 40;
    ev = tick(w, atFire(w, { interact: true }));
    expect(has(ev, 'feed')).toBe(true);
    expect(s.ideas.challengeDone).toBe(true);
    expect(s.ideas.challengeFailed).toBe(false);

    // Broken: one log at second 10.
    w = nightWith(5, 3, 'calm', 'lateFeed');
    s = w.state;
    hideDeer(w);
    s.fuel = 40;
    s.player.logs = 3;
    run(w, 10, atFire(w));
    ev = tick(w, atFire(w, { interact: true }));
    expect(has(ev, 'feed')).toBe(true);
    expect(ev).toContainEqual({ type: 'challengeFailed', kind: 'lateFeed' });
    ev = run(w, 40, atFire(w));
    expect(has(ev, 'challengeDone')).toBe(false);
    expect(s.ideas.challengeDone).toBe(false);
    // The ember blow is not a log: it does not break the challenge.
    w = nightWith(5, 3, 'calm', 'lateFeed');
    s = w.state;
    hideDeer(w);
    s.fuel = 24;
    s.bright = false;
    ev = run(w, 1.6, atFire(w, { blow: true }));
    expect(has(ev, 'blow')).toBe(true);
    expect(s.ideas.challengeFailed).toBe(false);
  });

  it('(d) 20 s in total outside the light without being hit', () => {
    let w = nightWith(5, 3, 'calm', 'outside');
    let s = w.state;
    hideDeer(w);
    s.fuel = 75;
    const out = findOpen(w, 4.5, 15, 28);
    // In two visits: 12 s out, 5 s home, 8 s out.
    place(w, out);
    let ev = run(w, 12);
    ev.push(...run(w, 5, atFire(w)));
    expect(s.ideas.outsideTicks).toBe(12 * 30);
    place(w, out);
    ev.push(...run(w, 7.9));
    expect(has(ev, 'challengeDone')).toBe(false);
    ev = run(w, 0.2);
    expect(ev).toContainEqual({ type: 'challengeDone', kind: 'outside' });
    // A hit after it is done does not undo it.
    hitPlayer(w);
    expect(s.ideas.challengeDone).toBe(true);
    expect(s.ideas.challengeFailed).toBe(false);

    // A hit before the 20 s are full breaks it for the night.
    w = nightWith(5, 3, 'calm', 'outside');
    s = w.state;
    s.t = 10;
    s.fuel = 75;
    place(w, out);
    hideDeer(w);
    run(w, 5);
    ev = hitPlayer(w);
    expect(ev).toContainEqual({ type: 'challengeFailed', kind: 'outside' });
    hideDeer(w);
    ev = run(w, 30);
    expect(has(ev, 'challengeDone')).toBe(false);
    expect(s.ideas.challengeDone).toBe(false);
  });

  it('(e) a tag taken and no damage all night', () => {
    const claim = (w: World): SimEvent[] => {
      const s = w.state;
      const c = s.caches[0];
      s.t = c.openAt + 1;
      c.status = 'open';
      c.revealed = true;
      const ev = tick(w, standAt(w, w.forest.posts[c.post], 1.2, { interact: true }));
      expect(has(ev, 'cacheClaim')).toBe(true);
      return ev;
    };
    // Taken clean: done.
    let w = nightWith(5, 3, 'calm', 'cleanTag');
    hideDeer(w);
    expect(claim(w)).toContainEqual({ type: 'challengeDone', kind: 'cleanTag' });
    expect(w.state.ideas.nightTaken).toBe(1);
    // …a hit later in the night still breaks it.
    let ev = hitPlayer(w);
    expect(ev).toContainEqual({ type: 'challengeFailed', kind: 'cleanTag' });
    hideDeer(w);
    skipPhase(w);
    expect(w.state.ideas.dawnFour).toBe(false);
    expect(w.state.hand!.length).toBe(3);
    // Hit first, tag afterwards: not done either.
    w = nightWith(5, 3, 'calm', 'cleanTag');
    w.state.t = 10;
    place(w, findOpen(w, 4.5, 15, 28));
    hitPlayer(w);
    hideDeer(w);
    ev = claim(w);
    expect(has(ev, 'challengeDone')).toBe(false);
    expect(w.state.ideas.challengeDone).toBe(false);
  });

  it('a night survived with the challenge done deals FOUR cards and adds 80', () => {
    for (const seed of [3, 5, 9, 31]) {
      const w = nightWith(seed, 3, 'calm', 'trap');
      const s = w.state;
      s.fuel = 75;
      setDeer(w, 'stalk', { x: 13, z: 0 }, { orbitTimer: 99 });
      s.traps.push({ id: 1, x: s.deer.x, z: s.deer.z, arm: 0 });
      tick(w, atFire(w));
      expect(s.ideas.challengeDone).toBe(true);
      const before = s.stats.score;
      const ev = skipPhase(w);
      expect(s.phase).toBe('draft');
      expect(s.ideas.dawnFour).toBe(true);
      expect(s.hand!.length).toBe(4);
      expect(new Set(s.hand).size).toBe(4);
      expect(s.stats.score - before).toBe(P.night + P.challenge);
      expect(ev).toContainEqual({ type: 'score', n: 80, why: 'challenge' });
      // The reward is for this dawn only.
      skipCard(w);
      w.beginDay();
      expect(s.ideas.dawnFour).toBe(false);
      skipToDawn(w);
      expect(s.hand!.length).toBe(3);
    }
  });

  it('not done, or no challenge at all: three cards', () => {
    for (const kind of ['', 'trap', 'bothTags', 'outside', 'cleanTag'] as ChallengeKind[]) {
      const w = nightWith(5, 3, 'calm', kind);
      const before = w.state.stats.score;
      skipPhase(w);
      expect(w.state.ideas.dawnFour, kind).toBe(false);
      expect(w.state.hand!.length, kind).toBe(3);
      expect(w.state.stats.score - before).toBe(P.night);
    }
  });

  it('a small pool gives what exists; a reroll keeps the fourth card', () => {
    const w = nightWith(5, 3, 'calm', 'trap');
    const s = w.state;
    s.ideas.challengeDone = true;
    s.stats.nightsSurvived = 2;
    s.player.scrap = 4;
    skipPhase(w);
    expect(s.hand!.length).toBe(4);
    const first = [...s.hand!];
    expect(reroll(w)).toBe(true);
    expect(s.hand!.length).toBe(4);
    for (const id of s.hand!) expect(first).not.toContain(id);
    // Only one passive and the two supply cards are left in the deck.
    const passives = CARDS.filter((c) => c.kind === 'passive').map((c) => c.id);
    s.cards = passives.slice(1);
    s.player.logs = 0;
    s.player.scrap = 0;
    expect(dealHand(w, []).sort()).toEqual(['C07', 'C08', passives[0]].sort());
    s.player.logs = RULES.limits.logs;
    s.player.scrap = RULES.limits.scrap;
    expect(dealHand(w, [])).toEqual([passives[0]]);
  });
});

// ------------------------------------------------------------------ 7. bell night

describe('bell night', () => {
  it('played from the morning, night 5 becomes a bell night with three caches', () => {
    const w = dayWorld(3, 5);
    const s = w.state;
    s.fuel = 75;
    const ev = run(w, 60.1, atFire(w));
    expect(has(ev, 'nightStart')).toBe(true);
    expect(s.ideas.omen).toBe('bell');
    expect(s.caches.length).toBe(3);
  });

  it('three caches at 22 / 40 / 58 s on the three posts; the third gives 2 scrap like the first', () => {
    for (const seed of [1, 5, 9]) {
      const w = nightWith(seed, 10, 'bell');
      const s = w.state;
      hideDeer(w);
      expect(s.caches.map((c) => c.openAt)).toEqual([22, 40, 58]);
      expect(s.caches.map((c) => c.reward)).toEqual(['scrap', 'flare', 'scrap']);
      expect(new Set(s.caches.map((c) => c.post)).size).toBe(3);
      expect(s.caches.every((c) => c.status === 'pending')).toBe(true);
      // Each opens on its second and closes 12 s later.
      s.fuel = 75;
      const opened: number[] = [];
      const closed: number[] = [];
      run(w, 71, atFire(w), () => {
        s.fuel = 75;
        for (const c of s.caches) {
          if (c.status === 'open' && !opened.includes(c.openAt)) opened.push(c.openAt), expect(s.t).toBeCloseTo(c.openAt, 1);
          if (c.status === 'closed' && !closed.includes(c.openAt)) closed.push(c.openAt), expect(s.t).toBeCloseTo(c.openAt + 12, 1);
        }
      });
      expect(opened).toEqual([22, 40, 58]);
      expect(closed).toEqual([22, 40, 58]);
    }
    // Claiming the third: +2 scrap and a tag.
    const w = nightWith(5, 10, 'bell');
    const s = w.state;
    hideDeer(w);
    const c = s.caches[2];
    s.t = c.openAt + 1;
    c.status = 'open';
    c.revealed = true;
    const ev = tick(w, standAt(w, w.forest.posts[c.post], 1.2, { interact: true }));
    expect(ev).toContainEqual({ type: 'cacheClaim', post: c.post, reward: 'scrap' });
    expect(s.player.scrap).toBe(2);
    expect(s.player.tags).toBe(1);
  });

  it('the threat grows ×1.25', () => {
    const grow = (omen: Omen): number => {
      const w = nightWith(5, 10, omen);
      const s = w.state;
      s.t = 10;
      place(w, findOpen(w, 4.5, 15, 28));
      setDeer(w, 'stalk', { x: -s.player.x, z: -s.player.z }, { orbitTimer: 99 });
      run(w, 2);
      return s.deer.threat;
    };
    expect(grow('calm')).toBeCloseTo(threatRate(10) * 2, 6);
    expect(grow('bell')).toBeCloseTo(threatRate(10) * 1.25 * 2, 6);
    expect(grow('fog')).toBeCloseTo(threatRate(10) * 2, 6);
  });

  it('the hunt is 0.3 m/s faster', () => {
    const speed = (omen: Omen): number => {
      const w = nightWith(5, 10, omen);
      const s = w.state;
      s.t = 10;
      place(w, { x: -30, z: 0 });
      setDeer(w, 'hunt', { x: -5, z: 14 }, { threat: 50, lastKnown: { x: 20, z: 14 } });
      const steps: number[] = [];
      let prev = { x: s.deer.x, z: s.deer.z };
      run(w, 1.5, emptyInput(), () => {
        steps.push(d2(s.deer, prev));
        prev = { x: s.deer.x, z: s.deer.z };
      });
      expect(s.deer.mode).toBe('hunt');
      steps.sort((a, b) => a - b);
      return steps[Math.floor(steps.length / 2)] / DT;
    };
    expect(speed('calm')).toBeCloseTo(huntSpeed(10), 4);
    expect(speed('bell')).toBeCloseTo(huntSpeed(10) + 0.3, 4);
    expect(speed('moon')).toBeCloseTo(huntSpeed(10), 4);
  });

  it('a tag banked that night makes the first dawn card rare or epic', () => {
    const rarities = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const w = nightWith(seed, 10, 'bell');
      const s = w.state;
      hideDeer(w);
      s.player.tags = 1;
      expect(has(tick(w, atFire(w)), 'tagsBanked')).toBe(true);
      skipPhase(w);
      expect(s.ideas.dawnRare).toBe(true);
      expect(s.hand!.length).toBe(3);
      const r = CARD_BY_ID[s.hand![0]].rarity;
      expect(r).not.toBe('common');
      rarities.add(r);
      // A reroll keeps the promise.
      s.stats.nightsSurvived = 2;
      s.player.scrap = 2;
      expect(reroll(w)).toBe(true);
      expect(CARD_BY_ID[s.hand![0]].rarity).not.toBe('common');
    }
    expect([...rarities].sort()).toEqual(['epic', 'rare']);
  });

  it('no banked tag, or an ordinary night: the first card is drawn as usual', () => {
    const bell = nightWith(5, 10, 'bell');
    skipPhase(bell);
    expect(bell.state.ideas.dawnRare).toBe(false);
    const calm = nightWith(5, 10, 'calm');
    calm.state.player.tags = 1;
    tick(calm, atFire(calm));
    skipPhase(calm);
    expect(calm.state.ideas.dawnRare).toBe(false);
    // Over many deals an ordinary first slot is common most of the time, a promised one never.
    const w = nightWith(5, 10, 'bell');
    skipPhase(w);
    let commons = 0;
    for (let k = 0; k < 300; k++) if (CARD_BY_ID[dealHand(w, [])[0]].rarity === 'common') commons++;
    expect(commons).toBeGreaterThan(120);
    w.state.ideas.dawnRare = true;
    for (let k = 0; k < 300; k++) {
      const hand = dealHand(w, []);
      expect(CARD_BY_ID[hand[0]].rarity).not.toBe('common');
      expect(new Set(hand).size).toBe(3);
    }
    // The tag lean of slot one still applies inside the rare / epic cards.
    w.state.lastTag = 'traps';
    for (let k = 0; k < 100; k++) {
      const c = CARD_BY_ID[dealHand(w, [])[0]];
      expect(c.tag).toBe('traps');
      expect(c.rarity).not.toBe('common');
    }
    // With every rare and epic card already in the build the slot falls back to what is left.
    w.state.lastTag = null;
    w.state.cards = CARDS.filter((c) => c.rarity !== 'common').map((c) => c.id);
    const hand = dealHand(w, []);
    expect(hand.length).toBe(3);
    expect(hand.every((id) => CARD_BY_ID[id].rarity === 'common')).toBe(true);
  });
});

// ------------------------------------------------------------------ 8. ember blow

describe('blow on the embers', () => {
  function weak(fuel = 24, seed = 5) {
    const w = nightWorld(seed);
    const s = w.state;
    hideDeer(w);
    s.t = 20;
    s.fuel = fuel;
    s.bright = false;
    s.player.logs = 0;
    return { w, s, I: s.ideas };
  }

  it('weak fire, empty pack: holding E for 1.5 s adds 8 fuel at once and the circle is bright again from 24', () => {
    const { w, s, I } = weak(24);
    tick(w, atFire(w));
    expect(w.focus).toMatchObject({ kind: 'fire', info: 'blow', usable: true });
    const f0 = s.fuel;
    let ev = run(w, 1.4, atFire(w, { blow: true }));
    expect(has(ev, 'blow')).toBe(false);
    expect(s.fuel).toBeCloseTo(f0 - burnRate('night', 1) * 1.4, 6);
    expect(I.blowHold).toBeCloseTo(1.4, 6);
    expect(s.bright).toBe(false);
    const f1 = s.fuel;
    ev = run(w, 0.1, atFire(w, { blow: true }));
    expect(ev).toContainEqual({ type: 'blow', gain: 8 });
    expect(ev).toContainEqual({ type: 'fireBright' });
    expect(s.fuel).toBeCloseTo(f1 - burnRate('night', 1) * 0.1 + IDEAS.blow.fuel, 6);
    expect(s.fuel).toBeGreaterThanOrEqual(RULES.fire.brightAt);
    expect(s.bright).toBe(true);
    expect(I.blowUsed).toBe(true);
    expect(w.playerProtected).toBe(true);
    expect(s.stats.feeds).toBe(0);
  });

  it('once per night; the next night it is there again', () => {
    const { w, s, I } = weak(24);
    run(w, 1.6, atFire(w, { blow: true }));
    expect(I.blowUsed).toBe(true);
    s.fuel = 23;
    s.bright = false;
    tick(w, atFire(w));
    expect(w.focus).toMatchObject({ kind: 'fire', info: 'noLogs', usable: false });
    const ev = run(w, 3, atFire(w, { blow: true }));
    expect(has(ev, 'blow')).toBe(false);
    expect(s.fuel).toBeLessThan(23);
    nextDay(w);
    skipPhase(w);
    expect(s.phase).toBe('night');
    expect(I.blowUsed).toBe(false);
    hideDeer(w);
    s.fuel = 24;
    s.bright = false;
    s.player.logs = 0;
    expect(has(run(w, 1.6, atFire(w, { blow: true })), 'blow')).toBe(true);
  });

  it('with a log in the pack E feeds the log as before and the blow stays unused', () => {
    const { w, s, I } = weak(24);
    s.player.logs = 1;
    tick(w, atFire(w));
    expect(w.focus).toMatchObject({ kind: 'fire', info: '+20', usable: true });
    const f0 = s.fuel;
    const ev = tick(w, atFire(w, { interact: true, blow: true }));
    expect(ev).toContainEqual({ type: 'feed', gain: 20, relit: false });
    expect(s.fuel).toBeCloseTo(f0 + 20 - burnRate('night', 1) * DT, 6);
    expect(s.player.logs).toBe(0);
    expect(I.blowUsed).toBe(false);
    expect(I.blowHold).toBe(0);
    // Holding E with logs never blows.
    s.player.logs = 2;
    s.fuel = 24;
    s.bright = false;
    expect(has(run(w, 3, atFire(w, { blow: true })), 'blow')).toBe(false);
    expect(s.player.logs).toBe(2);
  });

  it('not on a bright fire, not on a dead one, not by day, not away from the fire', () => {
    // Bright.
    let { w, s } = weak(40);
    s.bright = true;
    tick(w, atFire(w));
    expect(w.focus!.info).toBe('noLogs');
    expect(has(run(w, 2, atFire(w, { blow: true })), 'blow')).toBe(false);
    // Dead: nothing left to blow on.
    ({ w, s } = weak(0));
    tick(w, atFire(w));
    expect(w.focus!.info).toBe('noLogs');
    expect(has(run(w, 2, atFire(w, { blow: true })), 'blow')).toBe(false);
    expect(s.fuel).toBe(0);
    // Day.
    const d = dayWorld(5);
    d.state.fuel = 20;
    d.state.bright = false;
    tick(d, atFire(d));
    expect(d.focus!.info).toBe('noLogs');
    expect(has(run(d, 2, atFire(d, { blow: true })), 'blow')).toBe(false);
    // Looking away from the fire, or standing 6 m off.
    ({ w, s } = weak(24));
    place(w, { x: 1.5, z: 1.5 });
    expect(has(run(w, 2, { ...emptyInput(), yaw: yawTo(1, 1), blow: true }), 'blow')).toBe(false);
    place(w, { x: 6, z: 0 });
    expect(has(run(w, 2, lookAt(w, { x: 0, z: 0 }, { blow: true })), 'blow')).toBe(false);
    expect(s.ideas.blowUsed).toBe(false);
  });

  it('letting go resets the hold; a tap of E on the blow prompt is not a refused feed', () => {
    const { w, s, I } = weak(24);
    run(w, 1.2, atFire(w, { blow: true }));
    const ev = tick(w, atFire(w, { interact: true }));
    expect(has(ev, 'denied')).toBe(false);
    expect(I.blowHold).toBe(0);
    expect(has(run(w, 1.2, atFire(w, { blow: true })), 'blow')).toBe(false);
    expect(has(run(w, 0.4, atFire(w, { blow: true })), 'blow')).toBe(true);
    expect(s.ideas.blowUsed).toBe(true);
  });

  it('the gain never passes the 75 F cap, and the switch turns it off', () => {
    const { w, s } = weak(24);
    IDEAS.blow.fuel = 80;
    const ev = run(w, 1.6, atFire(w, { blow: true }));
    IDEAS.blow.fuel = 8;
    expect(has(ev, 'blow')).toBe(true);
    expect(s.fuel).toBeLessThanOrEqual(RULES.fire.max);
    IDEAS.emberBlow = false;
    const off = weak(24);
    tick(off.w, atFire(off.w));
    expect(off.w.focus!.info).toBe('noLogs');
    expect(has(run(off.w, 2, atFire(off.w, { blow: true })), 'blow')).toBe(false);
  });
});

// ------------------------------------------------------------------ 9. score

describe('score', () => {
  it('+1 per full second outside protection at night — not inside the light, not by day', () => {
    const w = nightWorld(5);
    const s = w.state;
    hideDeer(w);
    s.fuel = 75;
    const out = findOpen(w, 4.5, 15, 28);
    place(w, out);
    run(w, 9.9);
    expect(s.stats.score).toBe(9);
    run(w, 0.1);
    expect(s.stats.score).toBe(10);
    run(w, 20, atFire(w));
    expect(s.stats.score).toBe(10);
    // Half seconds add up across visits.
    place(w, out);
    run(w, 0.5);
    run(w, 3, atFire(w));
    place(w, out);
    run(w, 0.5);
    expect(s.stats.score).toBe(11);
    // The 4 s shield after a revive is protection too.
    s.player.shield = 4;
    run(w, 3);
    expect(s.stats.score).toBe(11);
    // By day nothing ticks, wherever the player stands.
    const d = dayWorld(5);
    place(d, findOpen(d, 4.5, 15, 28));
    run(d, 20);
    expect(d.state.stats.score).toBe(0);
  });

  it('+50 per banked tag, +100 per survived night', () => {
    const w = nightWorld(5);
    const s = w.state;
    hideDeer(w);
    s.fuel = 75;
    s.player.tags = 2;
    const ev = tick(w, atFire(w));
    expect(ev).toContainEqual({ type: 'score', n: 100, why: 'tag' });
    expect(s.stats.score).toBe(100);
    const dawn = skipPhase(w);
    expect(dawn).toContainEqual({ type: 'score', n: 100, why: 'night' });
    expect(s.stats.score).toBe(200);
    // Death is not a survived night.
    const k = nightWorld(5);
    k.state.t = 10;
    place(k, findOpen(k, 4.5, 15, 28));
    k.state.player.hp = 40;
    hitPlayer(k);
    expect(k.state.phase).toBe('deathOffer');
    expect(k.state.stats.score).toBe(0);
  });

  it('+30 for a swing that misses within 2.6 m, nothing for a far miss, nothing for a hit', () => {
    const miss = (gap: number) => {
      const w = nightWorld(5);
      const s = w.state;
      s.t = 10;
      const p = findOpen(w, 4.5, 15, 28);
      place(w, p);
      const u = outward(p);
      // The swing was aimed away from where the player now stands.
      setDeer(w, 'swing', add(p, u, gap), { timer: D.swingSeconds, swingDirX: u.x, swingDirZ: u.z, sinceSwing: 0 });
      const ev = tick(w);
      const m = ev.find((e) => e.type === 'deerMiss') as Extract<SimEvent, { type: 'deerMiss' }>;
      expect(m.dist).toBeCloseTo(gap, 6);
      expect(s.player.hp).toBe(100);
      return { score: s.stats.score, ev };
    };
    const near = miss(2.2);
    expect(near.score).toBe(P.dodge);
    expect(near.ev).toContainEqual({ type: 'score', n: 30, why: 'dodge' });
    expect(miss(2.59).score).toBe(30);
    expect(miss(2.61).score).toBe(0);
    expect(miss(4).score).toBe(0);
    const w = nightWorld(5);
    w.state.t = 10;
    place(w, findOpen(w, 4.5, 15, 28));
    const ev = hitPlayer(w);
    expect(has(ev, 'deerMiss')).toBe(false);
    expect(w.state.stats.score).toBe(0);
  });

  it('+40 for a trap catch', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    s.fuel = 75;
    setDeer(w, 'stalk', { x: 13, z: 0 }, { orbitTimer: 99 });
    s.traps.push({ id: 1, x: s.deer.x, z: s.deer.z, arm: 0 });
    const ev = tick(w, atFire(w));
    expect(ev).toContainEqual({ type: 'score', n: 40, why: 'trap' });
    expect(s.stats.score).toBe(P.trap);
  });

  it('the table of points is the owner-approved one, and the switch freezes the score at 0', () => {
    expect(IDEAS.points).toEqual({ outsideSecond: 1, tag: 50, night: 100, dodge: 30, trap: 40, tracks: 25, resin: 20, challenge: 80 });
    IDEAS.score = false;
    const w = nightWith(5, 3, 'calm', 'trap');
    const s = w.state;
    s.t = 10;
    s.fuel = 75;
    s.player.tags = 2;
    setDeer(w, 'stalk', { x: 13, z: 0 }, { orbitTimer: 99 });
    s.traps.push({ id: 1, x: s.deer.x, z: s.deer.z, arm: 0 });
    const ev = tick(w, atFire(w));
    expect(has(ev, 'trapSnap')).toBe(true);
    expect(count(ev, 'score')).toBe(0);
    place(w, findOpen(w, 4.5, 15, 28));
    hideDeer(w);
    run(w, 3);
    skipPhase(w);
    expect(s.stats.score).toBe(0);
    expect(s.hand!.length).toBe(4); // the challenge reward itself does not depend on the score
  });

  it('a whole scored night adds up', () => {
    const w = dayWorld(5, 3);
    const s = w.state;
    // Day: read the tracks, chop the resin pine.
    place(w, s.ideas.tracks!);
    tick(w);
    run(w, 2.1, standAt(w, w.forest.snags[s.ideas.resinSnag], 1.2, { chop: true }));
    expect(s.stats.score).toBe(25 + 20);
    s.ideas.challenge = 'bothTags';
    skipPhase(w);
    hideDeer(w);
    // Night: 6 s outside, two tags home.
    place(w, findOpen(w, 4.5, 15, 28));
    run(w, 6);
    s.player.tags = 2;
    tick(w, atFire(w));
    skipPhase(w);
    expect(s.stats.score).toBe(25 + 20 + 6 + 100 + 100 + 80);
    expect(scoreEvents(w.drainEvents(), 'x')).toEqual([]);
  });
});

// ------------------------------------------------------------------ saves

/** A deterministic input stream that also throws tins and holds E. */
function script(seed: number, n: number): Input[] {
  const r = new Rng(seed);
  const out: Input[] = [];
  let yaw = r.range(-3, 3);
  let mz = 1;
  let blow = 0;
  for (let k = 0; k < n; k++) {
    yaw += r.range(-0.12, 0.12);
    if (r.next() < 0.03) yaw += r.range(-2, 2);
    if (r.next() < 0.05) mz = r.pick([1, 1, 0, -1]);
    if (blow > 0) blow--;
    else if (r.next() < 0.01) blow = 60;
    out.push({
      ...emptyInput(),
      yaw,
      pitch: r.range(-0.4, 0.05),
      mz,
      sprint: r.next() < 0.3,
      chop: r.next() < 0.2,
      interact: r.next() < 0.05,
      light: r.next() < 0.006,
      flare: r.next() < 0.002,
      lure: r.next() < 0.02,
      blow: blow > 0,
    });
  }
  return out;
}

function expectLockstep(a: World, b: World, inputs: Input[]): void {
  expect(snapshot(b)).toBe(snapshot(a));
  for (let k = 0; k < inputs.length; k++) {
    a.step({ ...inputs[k] });
    b.step({ ...inputs[k] });
    expect(b.drainEvents()).toEqual(a.drainEvents());
    if (k % 30 === 29 || k === inputs.length - 1) {
      const sa = snapshot(a);
      const sb = snapshot(b);
      if (sa !== sb) expect(JSON.parse(sb), `diverged at tick ${k + 1}`).toEqual(JSON.parse(sa));
    }
  }
}

describe('saves with the new fields', () => {
  it('a fresh run carries them, as plain JSON', () => {
    const w = World.start({ seed: 77 });
    const a = w.serialize();
    expect(Object.keys(a.ideas).sort()).toEqual(Object.keys(newIdeas()).sort());
    expect(a.stats.score).toBe(0);
    expect(a.deer).toHaveProperty('lure', null);
    expect(a.deer).toHaveProperty('lureT', 0);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(nonFinite(a)).toEqual([]);
    // No new RNG stream: the rolls of a night are derived from the seed and the night number.
    expect(Object.keys(a.rng).sort()).toEqual(['cards', 'loot', 'threat']);
    expect(snapshot(reload(w))).toBe(snapshot(w));
  });

  it('mid-night round trip: omen, challenge, a lured Deer, a half-held blow, the score', () => {
    const a = nightWith(77, 10, 'bell', 'outside');
    const s = a.state;
    s.t = 12;
    s.player.scrap = 8;
    s.fuel = 23.5;
    s.bright = false;
    s.stats.score = 345;
    s.ideas.outsideTicks = 200;
    s.ideas.scoreTicks = 17;
    s.ideas.blowHold = 0.7;
    s.ideas.lureCd = 1.3;
    s.ideas.nightBanked = 1;
    setDeer(a, 'lured', { x: 14, z: 4 }, { lure: { x: 9, z: -8 }, lureT: 0 });
    const b = reload(a);
    expect(b.state.ideas).toEqual(s.ideas);
    expect(b.state.deer).toEqual(s.deer);
    expect(b.state.stats.score).toBe(345);
    expect(b.state.caches).toEqual(s.caches);
    expect(b.state.caches.length).toBe(3);
    expectLockstep(a, b, script(5, 2400));
    expect(a.state.phase === 'night' || a.state.phase === 'deathOffer' || a.state.phase === 'draft').toBe(true);
  });

  it('a save made by day continues through the dusk roll and the night start exactly like the original', () => {
    for (const night of [4, 10]) {
      const a = World.start({ seed: 123, night });
      const pre = script(7, 300);
      pre[0].chop = true;
      for (const i of pre) a.step(i);
      a.drainEvents();
      expect(a.state.phase).toBe('day');
      const b = reload(a);
      expect(b.state.ideas.tracks).toEqual(a.state.ideas.tracks);
      expect(b.state.ideas.resinSnag).toBe(a.state.ideas.resinSnag);
      expectLockstep(a, b, script(8, 2700));
      expect(a.state.phase).not.toBe('day');
      expect(a.state.ideas.omen).toBe(omenForNight(123, night));
      expect(b.state.ideas.omen).toBe(a.state.ideas.omen);
      expect(b.state.ideas.challenge).toBe(challengeForNight(123, night));
    }
  });

  it('the four-card dawn hand and its rewards survive a reload', () => {
    const a = nightWith(31, 10, 'bell', 'bothTags');
    hideDeer(a);
    a.state.player.tags = 2;
    tick(a, atFire(a));
    skipPhase(a);
    expect(a.state.hand!.length).toBe(4);
    expect(a.state.ideas.dawnRare).toBe(true);
    const b = reload(a);
    expect(b.state.hand).toEqual(a.state.hand);
    expect(b.state.ideas).toEqual(a.state.ideas);
    for (const w of [a, b]) {
      w.state.stats.nightsSurvived = 2;
      w.state.player.scrap = 2;
      expect(reroll(w)).toBe(true);
    }
    expect(b.state.hand).toEqual(a.state.hand);
    expect(b.state.hand!.length).toBe(4);
    for (const w of [a, b]) {
      skipCard(w);
      w.beginDay();
    }
    expect(snapshot(b)).toBe(snapshot(a));
  });

  /** A save as the game wrote it before the additions. */
  function oldSave(w: World): RunState {
    const raw = JSON.parse(JSON.stringify(w.serialize())) as Record<string, unknown> & { stats: Record<string, unknown>; deer: Record<string, unknown>; player: Record<string, unknown> };
    delete raw.ideas;
    delete raw.stats.score;
    delete raw.deer.lure;
    delete raw.deer.lureT;
    return raw as unknown as RunState;
  }

  it('an old day save without the new fields loads and plays on: neutral night, old entry rule', () => {
    const src = World.start({ seed: 77, night: 6 });
    const pre = script(3, 200);
    pre[0].chop = true;
    for (const i of pre) src.step(i);
    const old = oldSave(src);
    old.snagLogs = old.snagLogs.map((v) => Math.min(2, v)); // an old save never had a three-log pine
    expect(old).not.toHaveProperty('ideas');
    const w = new World(old);
    const s = w.state;
    expect(s.ideas).toEqual(newIdeas());
    expect(s.stats.score).toBe(0);
    expect(s.deer.lure).toBeNull();
    expect(s.deer.lureT).toBe(0);
    expect(s.ideas.tracks).toBeNull();
    expect(s.ideas.resinSnag).toBe(-1);
    // The rest of the day at the fire, tick by tick, into the night.
    s.fuel = 75;
    const ev = run(w, RULES.cycle.daySeconds - s.t + 0.1, atFire(w));
    expect(has(ev, 'nightStart')).toBe(true);
    // The dusk tick still announces tonight's omen; the Deer comes from the far side as it used to.
    expect(s.ideas.omen).toBe(omenForNight(77, 6));
    expect(s.deer.x * s.player.x + s.deer.z * s.player.z).toBeLessThan(0);
    run(w, 30, atFire(w), () => (s.fuel = 75));
    expect(nonFinite(s)).toEqual([]);
    skipPhase(w);
    expect(s.phase).toBe('draft');
    expect(s.stats.score).toBe(P.night + (s.ideas.dawnFour ? P.challenge : 0));
    skipCard(w);
    w.beginDay();
    // From the next morning on it is a normal run with tracks and a resin pine.
    expect(s.ideas.tracks).not.toBeNull();
    expect(s.ideas.resinSnag).toBeGreaterThanOrEqual(0);
    expect(snapshot(reload(w))).toBe(snapshot(w));
  });

  it('an old save from the middle of a night and from the dawn screen load cleanly too', () => {
    const src = nightWorld(77, 9);
    src.state.player.scrap = 5;
    for (const i of script(4, 400)) src.step(i);
    const w = new World(oldSave(src));
    const s = w.state;
    expect(s.ideas.omen).toBe('calm');
    expect(s.ideas.challenge).toBe('');
    expect(() => {
      for (const i of script(6, 900)) w.step(i);
    }).not.toThrow();
    expect(nonFinite(s)).toEqual([]);
    expect(Number.isInteger(s.stats.score)).toBe(true);

    const dawn = nightWorld(77, 9);
    skipPhase(dawn);
    const d = new World(oldSave(dawn));
    expect(d.state.phase).toBe('draft');
    expect(d.state.hand!.length).toBe(3);
    expect(d.state.ideas.dawnFour).toBe(false);
    skipCard(d);
    d.beginDay();
    expect(d.state.phase).toBe('day');
    expect(d.state.ideas.tracks).not.toBeNull();
  });

  it('a partly filled ideas object keeps what it has and gets the rest', () => {
    const src = World.start({ seed: 9 });
    const raw = JSON.parse(JSON.stringify(src.serialize()));
    raw.ideas = { omen: 'fog', challenge: 'trap' };
    const w = new World(raw);
    expect(w.state.ideas).toEqual({ ...newIdeas(), omen: 'fog', challenge: 'trap' });
  });

  it('the profile gets a best score and the hint flags by default, also when read from an old file', () => {
    expect(defaultProfile().bestScore).toBe(0);
    expect(defaultProfile().hintsSeen).toEqual([]);
    const mem = new Map<string, string>();
    const backend: ProgressStore = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
    const oldProfile = { best: 7, runs: 3, nights: 11, seenStages: [0], seals: [1], bonusTrap: true, settings: { lang: 'ru', volume: 0.5, effects: 1, shake: true, flash: true, subtitles: true, lowQuality: false } };
    const run0 = oldSave(World.start({ seed: 9 }));
    mem.set('belldeer.save.v1', JSON.stringify({ v: 1, profile: oldProfile, run: run0, prev: null }));
    const store = new RunStore(backend);
    expect(store.profile.best).toBe(7);
    expect(store.profile.bestScore).toBe(0);
    expect(store.profile.hintsSeen).toEqual([]);
    expect(store.run).not.toBeNull();
    // The old run from the file becomes a playable world.
    const w = new World(structuredClone(store.run!));
    expect(w.state.ideas).toEqual(newIdeas());
    // New values are written and read back.
    store.profile.bestScore = 1234;
    store.profile.hintsSeen.push('Lure');
    store.saveProfile();
    const again = new RunStore(backend);
    expect(again.profile.bestScore).toBe(1234);
    expect(again.profile.hintsSeen).toEqual(['Lure']);
    // Two profiles never share the hint list.
    expect(defaultProfile().hintsSeen).not.toBe(defaultProfile().hintsSeen);
  });
});
