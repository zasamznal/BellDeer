// The Bell Deer: perception, threat, FSM transitions, the swing and the six
// stages (GDD §4 "Олень и его шесть обликов").
import { describe, expect, it } from 'vitest';
import { lineOfSight } from '../src/sim/forest';
import { huntSpeed, stageForNight, threatRate } from '../src/sim/rules';
import { stunDeer } from '../src/sim/deer';
import { Rng } from '../src/sim/rng';
import {
  DT,
  RULES,
  World,
  atFire,
  count,
  d2,
  emptyInput,
  findLane,
  findOpen,
  has,
  hyp,
  lookAt,
  nightWorld,
  place,
  run,
  runUntil,
  segClear,
  setDeer,
  tick,
  yawTo,
  type Input,
  type SimEvent,
  type V2,
} from './helpers';

const D = RULES.deer;

/** Unit vector pointing from the fire outwards through p. */
const outward = (p: V2): V2 => ({ x: p.x / hyp(p), z: p.z / hyp(p) });
const add = (p: V2, u: V2, m: number): V2 => ({ x: p.x + u.x * m, z: p.z + u.z * m });
const perp = (u: V2): V2 => ({ x: -u.z, z: u.x });
const rot = (u: V2, deg: number): V2 => {
  const a = (deg * Math.PI) / 180;
  return { x: u.x * Math.cos(a) - u.z * Math.sin(a), z: u.x * Math.sin(a) + u.z * Math.cos(a) };
};

/**
 * Night `night`, 10 s in, the player on open ground far outside the light and
 * the Deer hunting `gap` metres further out, facing the player.
 */
function huntAt(seed = 5, night = 1, gap = 1.5) {
  const w = nightWorld(seed, night);
  const s = w.state;
  s.t = 10;
  const p = findOpen(w, 4.5, 15, 28);
  place(w, p);
  const u = outward(p);
  const dp = add(p, u, gap);
  setDeer(w, 'hunt', dp, { threat: 50, lastKnown: { ...p }, heading: Math.atan2(-u.z, -u.x), appear: 1 });
  return { w, s, p, u, d: s.deer, pl: s.player };
}

/** Player unprotected on open ground, the Deer stalking `gap` m away with enough threat to attack. */
function provoke(seed: number, night: number, gap = 8, margin = 1.5) {
  const w = nightWorld(seed, night);
  const s = w.state;
  s.t = 10;
  const lane = findLane(w, gap, margin, 12, 30);
  place(w, lane.a);
  setDeer(w, 'stalk', lane.b, { threat: 40, orbitTimer: 99, appear: 1 });
  const ev = tick(w);
  return { w, s, lane, d: s.deer, pl: s.player, ev };
}

function eventLog(w: World, seconds: number, input: Input | ((w: World) => Input) = emptyInput(), each?: (w: World) => void) {
  const log: { t: number; e: SimEvent }[] = [];
  const n = Math.round(seconds * 30);
  for (let k = 0; k < n && w.state.phase === 'night'; k++) {
    w.step({ ...(typeof input === 'function' ? input(w) : input) });
    for (const e of w.drainEvents()) log.push({ t: w.state.t, e });
    each?.(w);
  }
  return log;
}
const times = (log: { t: number; e: SimEvent }[], type: SimEvent['type']) => log.filter((l) => l.e.type === type).map((l) => l.t);

// ------------------------------------------------------------------ threat

describe('threat', () => {
  it('matches the difficulty table', () => {
    for (const [n, rate, speed] of [
      [1, 8.0, 4.9],
      [10, 8.36, 4.99],
      [20, 8.76, 5.09],
      [30, 9.16, 5.19],
      [50, 9.96, 5.39],
      [75, 10.96, 5.64],
      [99, 11.92, 5.88],
    ] as const) {
      expect(threatRate(n)).toBeCloseTo(rate, 6);
      expect(huntSpeed(n)).toBeCloseTo(speed, 6);
    }
    expect([1, 9, 10, 19, 20, 29, 30, 49, 50, 74, 75, 99].map(stageForNight)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  for (const n of [1, 10, 50, 99]) {
    it(`night ${n}: grows ${threatRate(n).toFixed(2)}/s outside protection`, () => {
      const w = nightWorld(5, n);
      const s = w.state;
      s.t = 10;
      const p = findOpen(w, 3, 15, 28);
      place(w, p);
      setDeer(w, 'stalk', add(p, outward(p), 6), { orbitTimer: 99 });
      run(w, 2, emptyInput());
      expect(s.deer.threat).toBeCloseTo(2 * threatRate(n), 4);
    });

    it(`night ${n}: the attack signal starts ${(32 / threatRate(n)).toFixed(2)} s after leaving protection`, () => {
      const w = nightWorld(5, n);
      const s = w.state;
      s.t = 10;
      const p = findOpen(w, 3, 15, 28);
      place(w, p);
      setDeer(w, 'stalk', add(p, outward(p), 6), { orbitTimer: 99 });
      const cueAt = runUntil(w, 6, (_, ev) => has(ev, 'deerCue'));
      expect(cueAt).toBeGreaterThan(32 / threatRate(n) - 0.01);
      expect(cueAt).toBeLessThan(32 / threatRate(n) + 2 * DT + 0.01);
    });
  }

  it('decays 20/s inside protection and stays within 0..100', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    s.fuel = 75;
    const i = atFire(w);
    setDeer(w, 'stalk', { x: 14, z: 0 }, { threat: 30, orbitTimer: 99 });
    run(w, 1, i);
    expect(s.deer.threat).toBeCloseTo(10, 4);
    run(w, 1, i);
    expect(s.deer.threat).toBe(0);

    const p = findOpen(w, 3, 15, 28);
    place(w, p);
    setDeer(w, 'stunned', add(p, outward(p), 6), { stunLeft: 99 });
    s.deer.threat = 99.9;
    s.deer.mode = 'recover'; // a mode that neither freezes threat nor acts on it
    s.deer.timer = -99;
    run(w, 1, emptyInput());
    expect(s.deer.threat).toBe(100);
  });

  it('no signal while the player is protected, however high the threat', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    s.fuel = 75;
    setDeer(w, 'stalk', { x: 14, z: 0 }, { threat: 100, orbitTimer: 99 });
    const ev = run(w, 3, atFire(w));
    expect(has(ev, 'deerCue')).toBe(false);
    expect(has(ev, 'deerHunt')).toBe(false);
    expect(s.deer.threat).toBeLessThan(100 - 59);
  });

  it('the signal waits for the 4 s the Deer needs to step out of the fog', () => {
    const w = nightWorld(5);
    const s = w.state;
    const p = findOpen(w, 3, 15, 28);
    place(w, p);
    s.deer.threat = 90;
    expect(s.deer.mode).toBe('patrol');
    let cueT = -1;
    for (let k = 0; k < 200 && cueT < 0; k++) {
      expect(s.deer.appear).toBeCloseTo(Math.min(1, s.t / 4), 1);
      if (has(tick(w), 'deerCue')) cueT = s.t;
    }
    expect(cueT).toBeGreaterThanOrEqual(4 - 1e-6);
    expect(cueT).toBeLessThan(4.1);
  });

  it('frozen at zero while stunned and while retreating', () => {
    const { w, s } = huntAt();
    expect(stunDeer(w, 3, 'test')).toBe(true);
    expect(s.deer.threat).toBe(0);
    const seen = new Set<string>();
    for (let k = 0; k < 190; k++) {
      tick(w);
      seen.add(s.deer.mode);
      if (s.deer.mode === 'stunned' || s.deer.mode === 'retreat') expect(s.deer.threat).toBe(0);
    }
    // 3 s of stun, 3 s of retreat, then back on patrol.
    expect(seen.has('stunned') && seen.has('retreat')).toBe(true);
    expect(['patrol', 'stalk']).toContain(s.deer.mode);
  });
});

// ------------------------------------------------------------------ perception

describe('perception', () => {
  /** A frozen Deer whose `lastKnown` shows whether it perceived the player this tick. */
  function watcher(w: World, at: V2) {
    setDeer(w, 'stunned', at, { stunLeft: 99 });
    return () => {
      w.state.deer.lastKnown = null;
      w.state.deer.stunLeft = 99;
    };
  }

  it('sees up to 22 m along a clear line', () => {
    const w = nightWorld(5);
    w.state.t = 10;
    const lane = findLane(w, 24, 0.3, 12, 34, true);
    const reset = watcher(w, lane.a);
    place(w, add(lane.a, lane.dir, 21.5));
    tick(w);
    expect(w.state.deer.lastKnown).toEqual({ x: w.state.player.x, z: w.state.player.z });
    reset();
    place(w, add(lane.a, lane.dir, 22.5));
    tick(w);
    expect(w.state.deer.lastKnown).toBeNull();
  });

  it('a trunk blocks the line of sight; stepping out from behind it does not', () => {
    const w = nightWorld(5);
    w.state.t = 10;
    let tested = 0;
    for (const t of w.forest.obstacles.filter((o) => o.kind === 'tree' && hyp(o) > 12 && hyp(o) < 28)) {
      const u = outward(t);
      const A = add(t, u, 4); // Deer
      const B = add(t, u, -4); // player, straight behind the trunk
      const C = add(B, perp(u), 3); // player, stepped aside
      if (hyp(A) > 33 || !segClear(w, A, C, 0.3, true)) continue;
      expect(lineOfSight(w.forest.obstacles, A, B)).toBe(false);
      expect(lineOfSight(w.forest.obstacles, A, C)).toBe(true);
      const reset = watcher(w, A);
      place(w, B);
      tick(w);
      expect(w.state.deer.lastKnown).toBeNull();
      reset();
      place(w, C);
      tick(w);
      expect(w.state.deer.lastKnown).toEqual({ x: C.x, z: C.z });
      if (++tested >= 5) break;
    }
    expect(tested).toBeGreaterThanOrEqual(3);
  });

  it('boulders block sight as well, small posts do not', () => {
    const w = nightWorld(5);
    const rock = w.forest.obstacles.find((o) => o.kind === 'rock' && o.sight)!;
    const u = outward(rock);
    expect(lineOfSight(w.forest.obstacles, add(rock, u, 3), add(rock, u, -3))).toBe(false);
    const post = w.forest.obstacles.find((o) => o.kind === 'post')!;
    expect(post.sight).toBe(false);
  });

  it('hears steps at 6 m, sprinting at 12 m and chopping at 16 m through a trunk', () => {
    const w = nightWorld(11);
    const s = w.state;
    s.t = 10;
    const snag = w.forest.snags[0];
    const u = outward(snag);
    const pPos = add(snag, u, -1.2); // the snag itself hides the player
    const walk = { ...emptyInput(), yaw: yawTo(u.x, u.z), mx: 1 } as Input;
    const cases: [number, Partial<Input>, boolean][] = [
      [4.5, {}, false], // silent: hidden behind the trunk
      [4.5, { mx: 1 }, true], // steps, 6 m
      [7, { mx: 1 }, false],
      [10.5, { mx: 1, sprint: true }, true], // sprint, 12 m
      [13, { mx: 1, sprint: true }, false],
      [14.5, { chop: true }, true], // chopping, 16 m
      [17, { chop: true }, false],
    ];
    for (const [range, patch, heard] of cases) {
      place(w, pPos);
      const A = add(pPos, u, range);
      setDeer(w, 'stunned', A, { stunLeft: 99 });
      expect(lineOfSight(w.forest.obstacles, A, pPos)).toBe(false);
      s.player.stamina = 100;
      s.player.exhausted = false;
      tick(w, { ...walk, mx: 0, ...patch });
      expect(s.deer.lastKnown !== null, `range ${range} ${JSON.stringify(patch)}`).toBe(heard);
    }
  });

  it('a hunt without contact runs to the last known point and ends 4 s after contact was lost', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    const lane = findLane(w, 26, 1.5, 13, 34);
    // The Deer hunts at one end; the silent player is 26 m away at the other (out of sight range).
    place(w, lane.b);
    setDeer(w, 'hunt', lane.a, { threat: 50, lastKnown: add(lane.a, lane.dir, 0.5) });
    const ended = runUntil(w, 12, (_, ev) => has(ev, 'deerRetreat'));
    expect(ended).toBeGreaterThan(4 - 1e-6);
    expect(ended).toBeLessThan(4.15);
    expect(s.deer.mode).toBe('retreat');
    expect(s.deer.threat).toBe(0);
    expect(s.player.hp).toBe(100);
  });

  it('first checks the last known point, even if that takes longer than 4 s', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    // The silent player is at the western rim; everything east of x = −6 is beyond the 22 m sight range.
    place(w, { x: -30, z: 0 });
    const target = { x: 20, z: 14 };
    setDeer(w, 'hunt', { x: -5, z: 14 }, { threat: 50, lastKnown: { ...target } });
    const d0 = d2(s.deer, target);
    expect(d0 / huntSpeed(1)).toBeGreaterThan(4.5);
    let lostFor = 0;
    const ended = runUntil(w, 12, (_, ev) => {
      lostFor = s.deer.lostT;
      return has(ev, 'deerRetreat');
    });
    expect(ended).toBeGreaterThan(d0 / huntSpeed(1) - 0.5);
    // It gave up either at the checked point or after the 9 s hard limit.
    expect(d2(s.deer, target) < 1.3 || lostFor >= 9 - DT).toBe(true);
    expect(s.player.hp).toBe(100);
  });

  it('with no last known point it heads for the nearest post', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    place(w, { x: -30, z: 0 });
    const post = w.forest.posts.find((p) => p.x > -6)!;
    const start = add(post, outward(post), 8); // 8 m further out than that post
    setDeer(w, 'hunt', start, { threat: 50, lastKnown: null });
    expect([...w.forest.posts].sort((a, b) => d2(a, start) - d2(b, start))[0]).toBe(post);
    run(w, 1, emptyInput());
    expect(s.deer.lastKnown).toBeNull();
    expect(d2(s.deer, post)).toBeLessThan(8 - 3.5);
  });
});

// ------------------------------------------------------------------ FSM

describe('patrol, stalking and provocations', () => {
  it('at dusk the Deer steps out on the 18–26 m ring, on the far side from the player', () => {
    for (const seed of [1, 2, 3, 5, 8, 13]) {
      const w = nightWorld(seed);
      const s = w.state;
      const d = s.deer;
      expect(d.mode).toBe('patrol');
      expect(hyp(d)).toBeGreaterThanOrEqual(18);
      expect(hyp(d)).toBeLessThanOrEqual(26);
      // Player at (1.5, 1.5): the Deer is in the opposite half-plane.
      expect(d.x * s.player.x + d.z * s.player.z).toBeLessThan(0);
      // Patrol lasts at most 4 s before it turns into stalking.
      s.fuel = 75;
      const left = runUntil(w, 6, () => d.mode !== 'patrol', atFire(w));
      expect(left).toBeGreaterThan(0);
      expect(left).toBeLessThanOrEqual(4 + 2 * DT);
      expect(d.mode).toBe('stalk');
    }
  });

  it('stalks 2–5 m beyond the bright edge and never steps into the bright circle', () => {
    const w = nightWorld(5);
    const s = w.state;
    const i = atFire(w);
    let settled = 0;
    let inBand = 0;
    for (let k = 0; k < 80 * 30; k++) {
      s.fuel = 60; // hold the circle at 7.3 m
      w.step({ ...i });
      const edge = hyp(s.deer) - w.radius;
      expect(edge).toBeGreaterThanOrEqual(0);
      if (s.t > 15 && (s.deer.mode === 'stalk' || s.deer.mode === 'feint')) {
        settled++;
        if (edge >= D.stalkMin - 0.25 && edge <= D.stalkMax + 0.25) inBand++;
      }
    }
    expect(settled).toBeGreaterThan(1000);
    expect(inBand / settled).toBeGreaterThan(0.9);
    expect(s.player.hp).toBe(100);
  });

  it('false provocation every 6–10 s: one chime, 1.2 s, always safe, then the side changes', () => {
    const w = nightWorld(5);
    const s = w.state;
    const i = atFire(w);
    const chimes: number[] = [];
    const dirs: number[] = [];
    let feintTicks = 0;
    for (let k = 0; k < 88 * 30; k++) {
      s.fuel = 60;
      w.step({ ...i });
      for (const e of w.drainEvents()) {
        if (e.type === 'deerChime' && !e.decoy) {
          chimes.push(s.t);
          dirs.push(s.deer.orbitDir);
        }
        expect(e.type).not.toBe('deerCue');
        expect(e.type).not.toBe('hit');
      }
      if (s.deer.mode === 'feint') feintTicks++;
    }
    expect(chimes.length).toBeGreaterThanOrEqual(6);
    for (let k = 1; k < chimes.length; k++) {
      const gap = chimes[k] - chimes[k - 1];
      // 6–10 s of stalking plus the 1.2 s of the provocation itself.
      expect(gap).toBeGreaterThanOrEqual(6 + 1.2 - 0.1);
      expect(gap).toBeLessThanOrEqual(10 + 1.2 + 0.15);
      expect(dirs[k]).toBe(-dirs[k - 1]);
    }
    expect((feintTicks * DT) / chimes.length).toBeGreaterThan(1.15);
    expect((feintTicks * DT) / chimes.length).toBeLessThan(1.3);
  });

  it('a false provocation is safe even at arm\'s length', () => {
    const { w, s, p, u } = huntAt(5, 1, 1.2);
    setDeer(w, 'feint', add(p, u, 1.2), { threat: 0 });
    const ev = run(w, 1.1, emptyInput());
    expect(has(ev, 'hit')).toBe(false);
    expect(has(ev, 'deerSwing')).toBe(false);
    expect(s.player.hp).toBe(100);
  });

  it('threat reaching 32 during a false provocation starts the full real signal at once', () => {
    const { w, s, p, u } = huntAt(5, 1, 6);
    setDeer(w, 'feint', add(p, u, 6), { threat: 31.9, timer: 0.9 });
    const log = eventLog(w, 3);
    const cue = times(log, 'deerCue');
    const hunt = times(log, 'deerHunt');
    expect(cue.length).toBe(1);
    expect(cue[0]).toBeCloseTo(10 + DT, 6);
    // The real signal is the full 1.2 s, not the remainder of the false one.
    expect(hunt[0] - cue[0]).toBeGreaterThan(1.2 - 1e-6);
    expect(hunt[0] - cue[0]).toBeLessThan(1.2 + 2 * DT);
    expect(s.stats.hunts).toBe(1);
  });

  it('real provocation: two heavy strikes over 1.2 s, contact is safe, then the hunt', () => {
    const { w, s, ev, d } = provoke(5, 1, 1.5);
    expect(d.mode).toBe('cue');
    expect(ev).toContainEqual(expect.objectContaining({ type: 'deerCue', second: false }));
    const log = eventLog(w, 1.3);
    const strikes = count(ev, 'deerStrike') + times(log, 'deerStrike').length;
    expect(strikes).toBe(2);
    expect(times(log, 'deerSwing').filter((t) => t < 10 + DT + 1.2 - 1e-6)).toEqual([]);
    const hunt = times(log, 'deerHunt');
    expect(hunt.length).toBe(1);
    expect(hunt[0] - (10 + DT)).toBeGreaterThan(1.2 - 1e-6);
    expect(hunt[0] - (10 + DT)).toBeLessThan(1.2 + 2 * DT);
    expect(s.player.hp).toBe(100);
  });

  it('stepping into protection during the real signal sends the Deer away', () => {
    const { w, s, d } = provoke(5, 1, 8);
    expect(d.mode).toBe('cue');
    run(w, 0.5, emptyInput());
    const ev = tick(w, atFire(w));
    expect(has(ev, 'deerRetreat')).toBe(true);
    expect(d.mode).toBe('retreat');
    expect(d.threat).toBe(0);
    const later = run(w, 2.5, atFire(w));
    expect(has(later, 'deerHunt')).toBe(false);
    expect(s.stats.hunts).toBe(0);
  });
});

describe('hunt', () => {
  for (const n of [1, 50, 99]) {
    it(`night ${n}: runs at ${huntSpeed(n).toFixed(2)} m/s`, () => {
      const w = nightWorld(5, n);
      const s = w.state;
      s.t = 10;
      const lane = findLane(w, 14, 1.5, 13, 32);
      place(w, lane.a);
      setDeer(w, 'hunt', lane.b, { threat: 50, lastKnown: { ...lane.a } });
      run(w, 1, emptyInput());
      expect(d2(s.deer, lane.b)).toBeCloseTo(huntSpeed(n), 3);
      // Straight at the player.
      expect(d2(s.deer, lane.a)).toBeCloseTo(14 - huntSpeed(n), 3);
    });
  }

  it('stops within 2 m and stands still for the 0.65 s windup', () => {
    const { w, s, pl, d } = huntAt(5, 1, 6);
    let swingPos: V2 | null = null;
    const startedAfter = runUntil(w, 3, (_, ev) => has(ev, 'deerSwing'));
    expect(startedAfter).toBeGreaterThan(0);
    swingPos = { x: d.x, z: d.z };
    const gap = d2(d, pl);
    expect(gap).toBeLessThanOrEqual(D.swingRange);
    expect(gap).toBeGreaterThan(D.swingRange - huntSpeed(1) * DT - 1e-6);
    const dir = { x: d.swingDirX, z: d.swingDirZ };
    expect(dir.x).toBeCloseTo((pl.x - d.x) / gap, 9);
    expect(dir.z).toBeCloseTo((pl.z - d.z) / gap, 9);

    const hitAfter = runUntil(w, 2, (_, ev) => {
      if (d.mode === 'swing') {
        expect({ x: d.x, z: d.z }).toEqual(swingPos);
        expect({ x: d.swingDirX, z: d.swingDirZ }).toEqual(dir);
      }
      return has(ev, 'hit');
    });
    expect(hitAfter).toBeGreaterThanOrEqual(D.swingSeconds);
    expect(hitAfter).toBeLessThanOrEqual(D.swingSeconds + DT + 1e-6);
    expect(s.player.hp).toBe(60);
  });

  it('the hit takes 40 HP and gives exactly 1.2 s of invulnerability', () => {
    const { w, pl } = huntAt(5, 1, 1.5);
    const hitAfter = runUntil(w, 2, (_, ev) => ev.some((e) => e.type === 'hit' && e.hp === 60));
    expect(hitAfter).toBeGreaterThan(0);
    expect(pl.hp).toBe(60);
    expect(pl.invuln).toBeCloseTo(1.2, 9);
    // Any further damage inside the window is ignored…
    w.damagePlayer(40);
    expect(pl.hp).toBe(60);
    const window = runUntil(w, 2, () => pl.invuln <= 0, () => atFire(w));
    expect(window).toBeGreaterThanOrEqual(1.2 - 1e-6);
    expect(window).toBeLessThanOrEqual(1.2 + DT + 1e-6);
    // …and counts again afterwards.
    w.damagePlayer(40);
    expect(pl.hp).toBe(20);
  });

  it('the direction is locked at the start: a side step during the windup avoids the hit', () => {
    const { w, s, pl, d } = huntAt(5, 1, 1.5);
    const first = tick(w);
    expect(has(first, 'deerSwing')).toBe(true);
    const dir = { x: d.swingDirX, z: d.swingDirZ };
    // Face the Deer and strafe.
    const strafe = lookAt(w, d, { mx: 1 });
    const log = eventLog(w, 0.8, strafe);
    expect(times(log, 'hit')).toEqual([]);
    expect(times(log, 'deerMiss').length).toBe(1);
    expect(pl.hp).toBe(100);
    expect({ x: d.swingDirX, z: d.swingDirZ }).toEqual(dir);
    expect(s.deer.nearMiss).toBeLessThan(99);
  });

  it('standing still is a hit; backing straight out of the 2 m range is a miss', () => {
    const still = huntAt(5, 1, 1.5);
    tick(still.w);
    eventLog(still.w, 0.8, lookAt(still.w, still.d));
    expect(still.pl.hp).toBe(60);

    // 1.34 m + 0.65 s × 4 m/s is well past the 2 m reach of the locked swing.
    const back = huntAt(5, 1, 1.5);
    tick(back.w);
    const log = eventLog(back.w, 0.8, lookAt(back.w, back.d, { mz: -1 }));
    expect(times(log, 'deerMiss').length).toBe(1);
    expect(back.pl.hp).toBe(100);
  });

  it('70° arc and 2 m range are checked at the end of the windup', () => {
    const outcome = (deg: number, range: number) => {
      const { w, pl, d } = huntAt(5, 1, 1.5);
      expect(has(tick(w), 'deerSwing')).toBe(true);
      const dir = rot({ x: d.swingDirX, z: d.swingDirZ }, deg);
      place(w, add(d, dir, range));
      const log = eventLog(w, 0.8);
      expect(times(log, 'hit').length + times(log, 'deerMiss').length).toBe(1);
      return pl.hp < 100;
    };
    expect(outcome(0, 1.2)).toBe(true);
    expect(outcome(30, 1.5)).toBe(true);
    expect(outcome(-34, 1.5)).toBe(true);
    expect(outcome(36, 1.5)).toBe(false);
    expect(outcome(-40, 1.5)).toBe(false);
    expect(outcome(90, 0.8)).toBe(false);
    expect(outcome(180, 1)).toBe(false);
    expect(outcome(0, 1.95)).toBe(true);
    expect(outcome(0, 2.3)).toBe(false);
  });

  // GDD §4: "проверить сектор 70°, дальность 2 м". resolveSwing() accepts
  // dd ≤ swingRange + 0.1, so a player standing 2.05 m away is still hit.
  it('the swing reaches exactly 2 m, not 2.1 m', () => {
    const { w, pl, d } = huntAt(5, 1, 1.5);
    tick(w);
    place(w, add(d, { x: d.swingDirX, z: d.swingDirZ }, 2.05));
    eventLog(w, 0.8);
    expect(pl.hp).toBe(100);
  });

  it('a trunk between the two at the end of the windup blocks the hit', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    const tree = w.forest.obstacles.find((o) => o.kind === 'tree' && hyp(o) > 14 && hyp(o) < 28 && o.r <= 0.45)!;
    const u = outward(tree);
    const dp = add(tree, u, 0.95);
    setDeer(w, 'swing', dp, { threat: 50, swingDirX: -u.x, swingDirZ: -u.z, sinceSwing: 0 });
    place(w, add(tree, u, -0.95)); // 1.9 m away, dead centre of the arc, trunk in between
    const log = eventLog(w, 0.8);
    expect(times(log, 'hit')).toEqual([]);
    expect(times(log, 'deerMiss').length).toBe(1);
    expect(s.player.hp).toBe(100);
  });

  it('at least 2.4 s between swing starts', () => {
    const { w, pl } = huntAt(5, 1, 1.5);
    pl.hp = 1000; // keep the target alive for the measurement
    const log = eventLog(w, 14);
    const swings = times(log, 'deerSwing');
    expect(swings.length).toBeGreaterThanOrEqual(5);
    for (let k = 1; k < swings.length; k++) {
      expect(swings[k] - swings[k - 1]).toBeGreaterThanOrEqual(D.swingGap - 1e-6);
      expect(swings[k] - swings[k - 1]).toBeLessThanOrEqual(D.swingGap + 2 * DT);
    }
    expect(times(log, 'hit').length).toBe(swings.length - (w.state.deer.mode === 'swing' ? 1 : 0));
  });

  it('three hits kill: 100 → 60 → 20 → 0', () => {
    const { w, s } = huntAt(5, 1, 1.5);
    const log = eventLog(w, 10);
    expect(log.filter((l) => l.e.type === 'hit').map((l) => (l.e as Extract<SimEvent, { type: 'hit' }>).hp)).toEqual([60, 20, 0]);
    expect(s.phase).toBe('deathOffer');
  });

  it('entering protection ends the hunt: 3 s of retreat with the threat reset', () => {
    const { w, s, d } = huntAt(5, 1, 6);
    run(w, 0.3, emptyInput());
    expect(d.mode).toBe('hunt');
    const ev = tick(w, atFire(w));
    expect(has(ev, 'deerRetreat')).toBe(true);
    expect(d.mode).toBe('retreat');
    expect(d.threat).toBe(0);
    const r0 = hyp(d);
    // The player leaves the light again at once: the Deer still does not attack for 3 s.
    const p = findOpen(w, 4.5, 15, 28);
    place(w, p);
    let retreatTicks = 1;
    const log = eventLog(w, 2.9, emptyInput(), () => {
      if (d.mode === 'retreat') retreatTicks++;
      expect(d.threat).toBe(0);
    });
    expect(d.mode).toBe('retreat');
    expect(times(log, 'deerSwing')).toEqual([]);
    expect(times(log, 'deerCue')).toEqual([]);
    expect(hyp(d)).toBeGreaterThan(r0);
    const rest = runUntil(w, 1, () => d.mode !== 'retreat');
    expect(rest).toBeGreaterThan(0);
    expect(2.9 + DT + rest).toBeGreaterThanOrEqual(3 - 1e-6);
    expect(2.9 + DT + rest).toBeLessThanOrEqual(3 + 3 * DT);
    expect(['patrol', 'stalk']).toContain(d.mode);
    expect(retreatTicks * DT).toBeGreaterThan(2.9);
    expect(s.player.hp).toBe(100);
  });

  // The Deer never walks into the bright circle, but while it stands still
  // (false provocation, signal, stun, windup, recovery) nothing moves it when
  // the circle grows over it: one log is +1.6 m of radius (+2.3 m with C01 + R01).
  // It then stands inside the light until its next step, where keepOut() snaps
  // it to the edge in a single tick. No damage is possible, but it reads as
  // "the Deer is in the light" and then as a teleport.
  it('a feed that grows the circle over a standing Deer moves it out in the same tick', () => {
    const w = nightWorld(5);
    const s = w.state;
    s.t = 10;
    s.fuel = 50; // R = 6.5 m
    s.player.logs = 1;
    setDeer(w, 'feint', { x: 7.5, z: 0 }); // 1 m outside the edge
    tick(w, atFire(w, { interact: true })); // R → 8.1 m
    expect(w.radius).toBeGreaterThan(8);
    expect(hyp(s.deer)).toBeGreaterThanOrEqual(w.radius);
  });

  it('goes around the bright circle to a player on the far side, never through it', () => {
    // Dead-centre and off-centre set-ups; the half circle at the rim is π × 8.9 ≈ 28 m ≈ 5.7 s.
    for (const [px, pz] of [
      [9.6, 0],
      [9.6, 1],
      [0, 9.6],
      [-9.6, 0.01],
      [6.8, 6.8],
    ]) {
      const w = nightWorld(5);
      const s = w.state;
      s.t = 10;
      s.fuel = 75;
      place(w, { x: px, z: pz });
      const k = -13 / Math.hypot(px, pz);
      setDeer(w, 'hunt', { x: px * k, z: pz * k }, { threat: 50, lastKnown: { x: px, z: pz } });
      let minEdge = Infinity;
      let swingAt = -1;
      for (let i = 0; i < 12 * 30 && swingAt < 0; i++) {
        s.fuel = 75;
        const ev = tick(w);
        if (s.bright) minEdge = Math.min(minEdge, hyp(s.deer) - w.radius);
        if (has(ev, 'deerSwing')) swingAt = (i + 1) * DT;
      }
      expect(minEdge).toBeGreaterThanOrEqual(0);
      expect(swingAt, `player at (${px}, ${pz})`).toBeGreaterThan(3.5); // no shortcut through the light
      expect(swingAt, `player at (${px}, ${pz})`).toBeLessThan(9);
      expect(s.deer.mode).toBe('swing');
    }
  });

  it('reaches an unprotected player from anywhere around the light (120 random set-ups)', () => {
    const rng = new Rng(99);
    let n = 0;
    let worstExtra = 0;
    for (const seed of [3, 7, 13]) {
      for (let k = 0; k < 40; k++) {
        const w = nightWorld(seed);
        const s = w.state;
        const fuel = [35, 50, 75][k % 3];
        s.t = 10;
        s.fuel = fuel;
        if (k % 6 >= 3) {
          s.cards = ['R01']; // the 10.2 m circle swallows the first ring of trees
          w.refreshMods();
        }
        const R = w.radius;
        const pa = rng.range(0, Math.PI * 2);
        const pr = R + rng.range(0.6, 9);
        const sep = rng.range(1.5, 4.7); // the Deer starts 86°–270° further round
        const dr = R + rng.range(1, 12);
        const p = { x: Math.cos(pa) * pr, z: Math.sin(pa) * pr };
        const dp = { x: Math.cos(pa + sep) * dr, z: Math.sin(pa + sep) * dr };
        if (!w.forest.nav.walkable(p) || !w.forest.nav.walkable(dp)) continue;
        n++;
        place(w, p);
        setDeer(w, 'hunt', dp, { threat: 50, lastKnown: { ...p } });
        // Generous route estimate: in to the rim, round it, out to the player.
        const arc = Math.min(sep, Math.PI * 2 - sep) * (R + 1.2);
        const estimate = (Math.abs(dr - R - 1) + arc + Math.abs(pr - R - 1)) / huntSpeed(1);
        let minEdge = Infinity;
        const took = runUntil(w, 20, (_, ev) => {
          s.fuel = fuel;
          if (s.bright) minEdge = Math.min(minEdge, hyp(s.deer) - w.radius);
          return has(ev, 'deerSwing');
        });
        const where = `seed ${seed} #${k} fuel ${fuel} player (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) deer (${dp.x.toFixed(1)}, ${dp.z.toFixed(1)})`;
        expect(took, where).toBeGreaterThan(0);
        expect(minEdge, where).toBeGreaterThanOrEqual(0);
        worstExtra = Math.max(worstExtra, took - estimate);
      }
    }
    expect(n).toBeGreaterThan(90);
    expect(worstExtra).toBeLessThan(3); // no long stalls at the rim
  }, 30000);
});

describe('stun and retreat', () => {
  it('a stunned Deer cannot be stunned again and the stun is not extended', () => {
    const { w, s, d } = huntAt(5, 1, 3);
    s.traps.push({ id: 1, x: d.x, z: d.z, arm: 0 });
    const ev = tick(w);
    expect(ev).toContainEqual({ type: 'deerStunned', by: 'trap' });
    expect(s.traps.length).toBe(0);
    expect(d.mode).toBe('stunned');
    run(w, 1, emptyInput());
    const left = d.stunLeft;
    // Flare, pulse and a second trap all bounce off.
    expect(stunDeer(w, 5, 'flare')).toBe(false);
    expect(stunDeer(w, 5, 'pulse')).toBe(false);
    expect(d.stunLeft).toBe(left);
    s.traps.push({ id: 2, x: d.x, z: d.z, arm: 0 });
    const more = run(w, 1, emptyInput());
    expect(has(more, 'trapSnap')).toBe(false);
    expect(s.traps.length).toBe(1); // the trap is only spent on a target it can stun
    const total = 2 + DT + runUntil(w, 5, () => d.mode !== 'stunned');
    expect(total).toBeGreaterThan(2.95);
    expect(total).toBeLessThan(3.1);
    expect(d.mode).toBe('retreat');
  });

  it('stun interrupts a swing in flight: no damage', () => {
    const { w, s, d } = huntAt(5, 1, 1.5);
    tick(w);
    expect(d.mode).toBe('swing');
    run(w, 0.5, emptyInput());
    expect(stunDeer(w, 2, 'flare')).toBe(true);
    run(w, 1, emptyInput());
    expect(s.player.hp).toBe(100);
  });

  it('a retreating Deer ignores traps and every other stun', () => {
    const { w, s, d } = huntAt(5, 1, 6);
    tick(w, atFire(w));
    expect(d.mode).toBe('retreat');
    const ev: SimEvent[] = [];
    for (let k = 0; k < 80 && d.mode === 'retreat'; k++) {
      s.traps = [{ id: 7, x: d.x, z: d.z, arm: 0 }];
      expect(stunDeer(w, 3, 'flare')).toBe(false);
      ev.push(...tick(w, atFire(w)));
      expect(s.traps.length).toBe(1);
    }
    expect(has(ev, 'trapSnap')).toBe(false);
    expect(has(ev, 'deerStunned')).toBe(false);
  });

  it('after the stun the Deer retreats for 3 s and only then patrols again', () => {
    const { w, d } = huntAt(5, 1, 3);
    expect(stunDeer(w, 3, 'trap')).toBe(true);
    const log = eventLog(w, 7);
    const retreat = times(log, 'deerRetreat');
    expect(retreat.length).toBe(1);
    expect(retreat[0] - 10).toBeGreaterThan(2.95);
    expect(retreat[0] - 10).toBeLessThan(3.1);
    expect(times(log, 'deerSwing')).toEqual([]);
    expect(['patrol', 'stalk', 'cue']).toContain(d.mode);
  });
});

// ------------------------------------------------------------------ stages

describe('stage 2 (nights 10–19): the false lunge', () => {
  it('the false provocation stays harmless and returns to stalking', () => {
    const w = nightWorld(5, 10);
    const s = w.state;
    expect(w.stage).toBe(1);
    s.t = 10;
    s.fuel = 75;
    setDeer(w, 'stalk', { x: 12.5, z: 0 }, { orbitTimer: 0.05 });
    const i = atFire(w);
    const ev = run(w, 0.2, i);
    expect(ev).toContainEqual(expect.objectContaining({ type: 'deerChime', decoy: false }));
    expect(s.deer.mode).toBe('feint');
    const more = run(w, 1.3, i);
    expect(s.deer.mode).toBe('stalk');
    expect(has(more, 'hit')).toBe(false);
    expect(has(more, 'deerCue')).toBe(false);
    expect(s.player.hp).toBe(100);
  });

  // GDD §4, stage table: "Во время ложной провокации зверь отскакивает и через 1 с
  // возвращается к прежнему краю". The simulation keeps the Deer in place for the
  // whole feint; only the renderer (sceneView.ts) offsets the model by up to 2 m.
  // Traps, sight lines and the "same edge" rule therefore never see the hop.
  it.todo('stage 2 hop-back is simulated (position leaves and returns to the same edge within ~1 s)');
});

describe('stage 3 (nights 20–29): trap sense', () => {
  function trapLane(night: number, seed = 5) {
    const w = nightWorld(seed, night);
    const s = w.state;
    s.t = 10;
    const lane = findLane(w, 12, 3.6, 13, 30);
    place(w, lane.a);
    const trap = add(lane.a, lane.dir, 6);
    s.traps.push({ id: 1, x: trap.x, z: trap.z, arm: 0 });
    setDeer(w, 'stalk', lane.b, { threat: 40, orbitTimer: 99, appear: 1 });
    tick(w); // the real signal starts and the maneuver for this attack is chosen
    return { w, s, lane, trap, d: s.deer };
  }

  it('on night 19 the Deer runs straight into a trap on its line', () => {
    const { w, s, d } = trapLane(19);
    expect(d.maneuver).toBe('none');
    const log = eventLog(w, 4);
    expect(times(log, 'trapSnap').length).toBe(1);
    expect(times(log, 'deerSwing')).toEqual([]);
    expect(s.player.hp).toBe(100);
  });

  it('from night 20 it notices one armed trap 4 m ahead and walks an arc of up to 3 m around it', () => {
    const { w, s, d, trap } = trapLane(20);
    expect(d.maneuver).toBe('trapSense');
    let minTrap = Infinity;
    let maxSide = 0;
    let noticedAt = -1;
    const log = eventLog(w, 5, emptyInput(), () => {
      minTrap = Math.min(minTrap, d2(d, trap));
      if (d.detour && noticedAt < 0) noticedAt = d2(d, trap);
      if (d.detour) maxSide = Math.max(maxSide, d2(d.detour, trap));
    });
    expect(noticedAt).toBeGreaterThan(0);
    expect(noticedAt).toBeLessThanOrEqual(4 + 1e-6);
    expect(maxSide).toBeLessThanOrEqual(3 + 1e-6);
    expect(times(log, 'trapSnap')).toEqual([]);
    expect(minTrap).toBeGreaterThan(RULES.trap.radius);
    expect(s.traps.length).toBe(1);
    // The detour only costs time: the attack still arrives.
    expect(times(log, 'deerSwing').length).toBeGreaterThanOrEqual(1);
    expect(d.maneuverUsed).toBe(true);
  });

  it('only once per hunt: the next trap on its way catches it', () => {
    const { w, s, d, lane } = trapLane(20);
    s.player.hp = 1000;
    let second = false;
    let hadDetour = false;
    const log = eventLog(w, 6, emptyInput(), () => {
      if (d.detour) hadDetour = true;
      if (hadDetour && !d.detour && !second && d.mode === 'hunt') {
        // Past the first trap: drop a second armed one on the line to the player.
        const to = { x: lane.a.x - d.x, z: lane.a.z - d.z };
        const len = Math.hypot(to.x, to.z);
        if (len > 3.5) {
          s.traps.push({ id: 2, x: d.x + (to.x / len) * 2.5, z: d.z + (to.z / len) * 2.5, arm: 0 });
          second = true;
        }
      }
    });
    expect(hadDetour).toBe(true);
    expect(second).toBe(true);
    expect(times(log, 'trapSnap').length).toBe(1);
    expect(s.traps.length).toBe(1);
  });

  it('an unarmed trap is not noticed', () => {
    const { w, s, d } = trapLane(20);
    s.traps[0].arm = 99;
    let detour = false;
    eventLog(w, 3, emptyInput(), () => {
      if (d.detour) detour = true;
    });
    expect(detour).toBe(false);
  });
});

describe('stage 4 (nights 30–49): the decoy chime', () => {
  it('once per provocation a single false chime sounds 6 m to the side; the double strike comes from the body', () => {
    const { ev, d, lane } = provoke(5, 30, 8);
    expect(d.maneuver).toBe('decoyChime');
    const chime = ev.find((e) => e.type === 'deerChime') as Extract<SimEvent, { type: 'deerChime' }>;
    expect(chime.decoy).toBe(true);
    expect(count(ev, 'deerChime')).toBe(1);
    expect(d2(chime, d)).toBeCloseTo(6, 6);
    // Perpendicular to the line Deer → player.
    const to = { x: lane.a.x - d.x, z: lane.a.z - d.z };
    expect(((chime.x - d.x) * to.x + (chime.z - d.z) * to.z) / Math.hypot(to.x, to.z)).toBeCloseTo(0, 6);
    const cue = ev.find((e) => e.type === 'deerCue') as Extract<SimEvent, { type: 'deerCue' }>;
    const strike = ev.find((e) => e.type === 'deerStrike') as Extract<SimEvent, { type: 'deerStrike' }>;
    expect(d2(cue, d)).toBe(0);
    expect(d2(strike, d)).toBe(0);
  });

  it('is not used before night 30 and never does damage by itself', () => {
    const before = provoke(5, 29, 8);
    expect(has(before.ev, 'deerChime')).toBe(false);
    const { w, s } = provoke(5, 30, 8);
    const log = eventLog(w, 1.15);
    expect(times(log, 'hit')).toEqual([]);
    expect(times(log, 'deerChime')).toEqual([]);
    expect(s.player.hp).toBe(100);
  });

  it('respects the 6 s pause between independent maneuvers', () => {
    const { w, s, d, lane } = provoke(5, 30, 8);
    expect(d.maneuver).toBe('decoyChime');
    // Back into the light (the Deer retreats), then out again 2 s later.
    run(w, 0.3, atFire(w));
    expect(d.mode).toBe('retreat');
    place(w, lane.a);
    setDeer(w, 'stalk', lane.b, { threat: 40, orbitTimer: 99, sinceManeuver: 2 });
    const ev = tick(w);
    expect(has(ev, 'deerCue')).toBe(true);
    expect(has(ev, 'deerChime')).toBe(false);
    expect(s.deer.maneuver).toBe('none');
  });
});

/** Re-roll the attack on successive seeds until the planner picks `want`. */
function provokeWith(night: number, want: string, gap = 8, withTrap = false) {
  for (let seed = 1; seed <= 40; seed++) {
    const w = nightWorld(seed, night);
    const s = w.state;
    s.t = 10;
    let lane;
    try {
      lane = findLane(w, gap + 6, 2.2, 13, 30);
    } catch {
      continue;
    }
    place(w, lane.a);
    if (withTrap) {
      const t = add(lane.a, lane.dir, gap - 3);
      s.traps.push({ id: 1, x: t.x, z: t.z, arm: 0 });
    }
    setDeer(w, 'stalk', add(lane.a, lane.dir, gap), { threat: 40, orbitTimer: 99, appear: 1 });
    const ev = tick(w);
    if (s.deer.maneuver === want) return { w, s, lane, d: s.deer, pl: s.player, ev };
  }
  throw new Error(`planner never picked ${want} on night ${night}`);
}

describe('stage 5 (nights 50–74): the straight charge', () => {
  it('is not in the pool before night 50', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const { d } = provoke(seed, 49, 8);
      expect(['decoyChime', 'none']).toContain(d.maneuver);
    }
  });

  it('course fixed at the start of the signal; 8 m/s for 0.8 s; a side step makes it miss', () => {
    const { w, s, d, pl, lane } = provokeWith(50, 'straightCharge', 8);
    const line = { x: d.chargeX, z: d.chargeZ };
    // The line points from the Deer at the player's position when the signal started.
    const gap0 = d2(d, lane.a);
    expect(line.x).toBeCloseTo((lane.a.x - d.x) / gap0, 9);
    expect(line.z).toBeCloseTo((lane.a.z - d.z) / gap0, 9);
    expect(line.x * -lane.dir.x + line.z * -lane.dir.z).toBeGreaterThan(0.999);
    const heading0 = d.heading;
    // During the 1.2 s signal the player steps 4 m across the line.
    run(w, 0.6, emptyInput());
    place(w, add(lane.a, perp(lane.dir), 2.1));
    const from = { x: d.x, z: d.z };
    const huntAfter = runUntil(w, 1, (_, ev) => has(ev, 'deerHunt'));
    expect(huntAfter).toBeGreaterThan(0);
    expect(d2(d, from)).toBe(0); // no movement during the signal
    expect(d.heading).toBeCloseTo(heading0, 6); // and no turning toward the new position
    expect({ x: d.chargeX, z: d.chargeZ }).toEqual(line);

    const dash: number[] = [];
    let swingDuringDash = false;
    const start = { x: d.x, z: d.z };
    for (let k = 0; k < 40 && d.chargeLeft > 0; k++) {
      const before = { x: d.x, z: d.z };
      const ev = tick(w);
      dash.push(d2(d, before));
      if (has(ev, 'deerSwing') || has(ev, 'hit')) swingDuringDash = true;
    }
    expect(swingDuringDash).toBe(false);
    expect(dash.length * DT).toBeGreaterThanOrEqual(0.8 - 1e-6);
    expect(dash.length * DT).toBeLessThanOrEqual(0.8 + DT + 1e-6);
    for (const step of dash) expect(step).toBeCloseTo(D.chargeSpeed * DT, 6);
    // Straight along the line fixed 1.2 s earlier.
    const moved = { x: d.x - start.x, z: d.z - start.z };
    expect(moved.x * line.z - moved.z * line.x).toBeCloseTo(0, 6);
    expect(pl.hp).toBe(100);
    expect(d.maneuverUsed).toBe(true);
  });

  it('damage still needs a normal swing with its own windup', () => {
    const { w, pl } = provokeWith(50, 'straightCharge', 8);
    const log = eventLog(w, 4);
    const hunt = times(log, 'deerHunt')[0];
    const swing = times(log, 'deerSwing')[0];
    const hit = times(log, 'hit')[0];
    expect(swing - hunt).toBeGreaterThanOrEqual(0.8 - 1e-6);
    expect(hit - swing).toBeGreaterThanOrEqual(D.swingSeconds);
    expect(pl.hp).toBe(60);
  });

  it('trap avoidance is off during the charge', () => {
    const { w, s, d } = provokeWith(50, 'straightCharge', 8, true);
    expect(d.maneuver).toBe('straightCharge');
    const log = eventLog(w, 2.5);
    expect(times(log, 'trapSnap').length).toBe(1);
    expect(s.player.hp).toBe(100);
  });

  it('a charge at a player who went back into the light stops at the edge and does no damage', () => {
    const { w, s, d } = provokeWith(50, 'straightCharge', 8);
    run(w, 1.15, emptyInput());
    s.fuel = 75;
    const i = atFire(w);
    let minEdge = Infinity;
    const log = eventLog(w, 3, i, () => {
      s.fuel = 75;
      minEdge = Math.min(minEdge, hyp(d) - w.radius);
    });
    expect(times(log, 'hit')).toEqual([]);
    expect(times(log, 'deerRetreat').length).toBeGreaterThanOrEqual(1);
    expect(minEdge).toBeGreaterThanOrEqual(0);
    expect(s.player.hp).toBe(100);
  });
});

describe('stage 6 (nights 75–99): the second lunge', () => {
  /** Dodge every swing by stepping out of the arc right after it starts. */
  function dodger(w: World) {
    const d = w.state.deer;
    return (ww: World) => {
      void ww;
      if (d.mode === 'swing' && d.timer < DT * 1.5) {
        const side = perp({ x: d.swingDirX, z: d.swingDirZ });
        place(w, add(d, side, 1.9));
      }
    };
  }

  it('is not in the pool before night 75', () => {
    for (let seed = 1; seed <= 12; seed++) expect(provoke(seed, 74, 8).d.maneuver).not.toBe('secondLunge');
  });

  it('after a miss: its own 1.2 s signal, a lunge, a swing, then 3 s of recovery; once per hunt', () => {
    const { w, s, d, pl } = provokeWith(75, 'secondLunge', 6);
    const dodge = dodger(w);
    const log = eventLog(w, 16, emptyInput(), dodge);
    expect(pl.hp).toBe(100);
    const hunts = times(log, 'deerHunt');
    expect(hunts.length).toBe(1);
    const cues = log.filter((l) => l.e.type === 'deerCue') as { t: number; e: Extract<SimEvent, { type: 'deerCue' }> }[];
    const second = cues.filter((c) => c.e.second);
    expect(second.length).toBe(1); // at most one repeat lunge per hunt
    const swings = times(log, 'deerSwing');
    const misses = times(log, 'deerMiss');
    expect(misses.length).toBeGreaterThanOrEqual(3);
    // The second signal starts on the tick of the first miss…
    expect(second[0].t).toBeCloseTo(misses[0], 6);
    // …and the second swing cannot start before that signal has run its 1.2 s.
    expect(swings[1] - second[0].t).toBeGreaterThanOrEqual(1.2 - 1e-6);
    expect(swings[1] - second[0].t).toBeLessThanOrEqual(1.2 + 0.5 + 3 * DT);
    // After the second miss the Deer recovers for 3 s before it swings again.
    expect(swings[2] - misses[1]).toBeGreaterThanOrEqual(D.recoverSeconds - 1e-6);
    expect(s.stats.hunts).toBe(1);
  });

  it('the second lunge still hits a player who stays put', () => {
    const { w, d, pl } = provokeWith(75, 'secondLunge', 6);
    let dodged = false;
    const log = eventLog(w, 8, emptyInput(), () => {
      if (!dodged && d.mode === 'swing' && d.timer < DT * 1.5) {
        place(w, add(d, perp({ x: d.swingDirX, z: d.swingDirZ }), 1.9));
        dodged = true;
      }
    });
    expect(times(log, 'deerMiss').length).toBeGreaterThanOrEqual(1);
    expect(times(log, 'hit').length).toBeGreaterThanOrEqual(1);
    expect(pl.hp).toBeLessThanOrEqual(60);
  });

  it('stepping into the light during the second signal or the lunge cancels it without damage', () => {
    for (const when of ['cue', 'lunge'] as const) {
      const { w, s, d, pl } = provokeWith(75, 'secondLunge', 6);
      const dodge = dodger(w);
      let home = false;
      const log = eventLog(
        w,
        8,
        () => (home ? atFire(w) : emptyInput()),
        () => {
          if (!home) dodge(w);
          if (!home && d.mode === when && (when === 'lunge' || (d.secondCue && d.timer > 0.4))) {
            s.fuel = 75;
            home = true;
          }
        },
      );
      expect(home, when).toBe(true);
      expect(times(log, 'hit')).toEqual([]);
      expect(times(log, 'deerRetreat').length).toBeGreaterThanOrEqual(1);
      expect(pl.hp).toBe(100);
    }
  });

  it('recovery ends in a proper retreat when the player is back in the light', () => {
    const { w, s, d, pl } = provokeWith(75, 'secondLunge', 6);
    const dodge = dodger(w);
    let home = false;
    const log = eventLog(
      w,
      12,
      () => (home ? atFire(w) : emptyInput()),
      () => {
        if (!home) dodge(w);
        if (!home && d.mode === 'recover' && d.timer > 0.5) {
          s.fuel = 75;
          home = true;
        }
      },
    );
    expect(home).toBe(true);
    const retreats = times(log, 'deerRetreat');
    expect(retreats.length).toBe(1);
    // The Deer finishes its 3 s of recovery first, then leaves.
    const misses = times(log, 'deerMiss');
    expect(retreats[0] - misses[1]).toBeGreaterThanOrEqual(D.recoverSeconds - 1e-6);
    expect(retreats[0] - misses[1]).toBeLessThanOrEqual(D.recoverSeconds + 3 * DT);
    expect(pl.hp).toBe(100);
    expect(times(log, 'hit')).toEqual([]);
  });

  // GDD §4, hunt row: "пауза между началами замахов ≥2,4 с". The second lunge
  // starts its swing as soon as the 1.2 s signal and the dash are over, i.e.
  // 0.65 + 1.2 + ≤0.5 s after the first swing started (≈1.9–2.4 s), without
  // checking `sinceSwing`. Either the rule has an exception for the repeat
  // lunge or startSwing() in the 'lunge' state must wait for the gap.
  it('the second lunge also keeps ≥2.4 s between swing starts', () => {
    const { w } = provokeWith(75, 'secondLunge', 6);
    const log = eventLog(w, 8, emptyInput(), dodger(w));
    const swings = times(log, 'deerSwing');
    expect(swings[1] - swings[0]).toBeGreaterThanOrEqual(D.swingGap - 1e-6);
  });
});

describe('protection holds on every stage', () => {
  for (const night of [1, 10, 20, 30, 50, 75, 99]) {
    it(`night ${night}: a player who stays in a fed bright circle is never hit, never hunted`, () => {
      const w = nightWorld(5, night);
      const s = w.state;
      const i = atFire(w);
      s.traps.push({ id: 1, x: 10, z: 0, arm: 0 }); // lets the trap-sense maneuver into the pool
      let hunts = 0;
      let minEdge = Infinity;
      while (s.phase === 'night') {
        if (s.fuel < 50) s.fuel = 70; // stand-in for feeding
        w.step({ ...i });
        for (const e of w.drainEvents()) {
          expect(e.type).not.toBe('hit');
          expect(e.type).not.toBe('deerSwing');
          if (e.type === 'deerHunt' || e.type === 'deerCue') hunts++;
        }
        if (s.phase === 'night') minEdge = Math.min(minEdge, hyp(s.deer) - w.radius);
      }
      expect(hunts).toBe(0);
      expect(minEdge).toBeGreaterThanOrEqual(0);
      expect(s.player.hp).toBe(100);
      expect(['draft', 'victory']).toContain(s.phase);
    });
  }
});

// The player and the Deer do not collide: resolveCircle() only knows trunks,
// rocks, the fire, the bench and posts. A player can therefore run straight
// through the 2.7 m monster during the windup and end up behind it, outside
// the arc. The GDD (§7 "Физика ограничена капсулами…") suggests a capsule for
// the Deer but never says so outright.
describe('open design questions', () => {
  it.todo('GDD ambiguity: should the Deer body block the player (today one can run through it to dodge)?');
});
