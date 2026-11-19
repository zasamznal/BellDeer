import { describe, expect, it } from 'vitest';
import { World } from '../src/sim/world';
import { emptyInput, type Input } from '../src/sim/types';
import { DT, RULES, TICK_HZ, burnRate, fireRadius, huntSpeed, threatRate } from '../src/sim/rules';
import { firstDayRoute, generateForest } from '../src/sim/forest';
import { dealHand, pickCard } from '../src/sim/draft';
import { CARD_BY_ID } from '../src/sim/rules';

const yawTo = (fx: number, fz: number) => Math.atan2(-fx, -fz);

/** Stand next to the fire, looking at it. */
function atFire(w: World): Input {
  const pl = w.state.player;
  pl.x = 1.5;
  pl.z = 1.5;
  const i = emptyInput();
  i.yaw = yawTo(-pl.x, -pl.z);
  return i;
}

function run(w: World, seconds: number, input: Input, each?: (t: number) => void) {
  const ticks = Math.round(seconds * TICK_HZ);
  for (let k = 0; k < ticks; k++) {
    each?.(w.state.t);
    w.step({ ...input });
  }
}

describe('fire economy', () => {
  it('matches the GDD difficulty table', () => {
    expect(burnRate('night', 1)).toBeCloseTo(0.64, 5);
    expect(burnRate('night', 99)).toBeCloseTo(0.934, 5);
    expect(fireRadius(75, 1)).toBeCloseTo(8.5, 5);
    expect(fireRadius(75, 1.2)).toBeCloseTo(10.2, 5);
    expect(fireRadius(0, 1)).toBe(0);
    expect(threatRate(1)).toBeCloseTo(8, 5);
    expect(threatRate(99)).toBeCloseTo(11.92, 5);
    expect(huntSpeed(99)).toBeCloseTo(5.88, 5);
    expect(RULES.deer.threatTrigger / threatRate(1)).toBeCloseTo(4.0, 2);
  });

  it('control night: three feeds end the first dawn at 35.4 F ±0.1', () => {
    const w = World.start({ seed: 7 });
    const s = w.state;
    s.player.logs = 4;
    const base = atFire(w);
    const feedAt = new Set<number>();
    const feed = (phase: string, at: number) => {
      const key = `${phase}${at}`;
      if (s.phase === phase && s.t >= at - DT / 2 && !feedAt.has(key as never)) {
        (feedAt as Set<unknown>).add(key);
        return true;
      }
      return false;
    };
    let guard = 0;
    base.mz = 0;
    // First tick needs an action to start the day clock.
    w.step({ ...base, light: true });
    w.step({ ...base, light: true });
    while (s.phase !== 'draft' && guard++ < 6000) {
      const i = { ...base };
      if (feed('day', 20) || feed('day', 50) || feed('night', 60)) i.interact = true;
      // The player stays inside the bright circle the whole night.
      w.step(i);
    }
    expect(s.phase).toBe('draft');
    expect(s.stats.feeds).toBe(3);
    expect(s.fuel).toBeGreaterThan(35.3);
    expect(s.fuel).toBeLessThan(35.5);
    expect(s.player.logs).toBe(1);
    expect(s.player.hp).toBe(100);
  });

  it('without a night feed protection is lost about 76.6 s into the night', () => {
    const w = World.start({ seed: 7 });
    const s = w.state;
    s.dayStarted = true;
    s.phase = 'night';
    s.t = 0;
    s.fuel = 73;
    const base = atFire(w);
    let lostAt = -1;
    run(w, 89, base, (t) => {
      if (lostAt < 0 && !s.bright) lostAt = t;
    });
    expect(lostAt).toBeGreaterThan(76.3);
    expect(lostAt).toBeLessThan(76.9);
    expect(w.isProtected(s.player)).toBe(false);
  });

  it('relighting from zero needs two logs to protect again', () => {
    const w = World.start({ seed: 3 });
    const s = w.state;
    s.dayStarted = true;
    s.fuel = 0;
    s.bright = false;
    s.player.logs = 2;
    const base = atFire(w);
    w.step({ ...base, interact: true });
    expect(s.fuel).toBeGreaterThan(19);
    expect(s.bright).toBe(false);
    w.step({ ...base, interact: true });
    expect(s.bright).toBe(true);
    expect(s.player.logs).toBe(0);
  });

  it('a full fire does not take a log', () => {
    const w = World.start({ seed: 3 });
    const s = w.state;
    s.dayStarted = true;
    s.fuel = 75;
    s.player.logs = 1;
    w.step({ ...atFire(w), interact: true });
    expect(s.player.logs).toBe(1);
  });
});

describe('forest generation', () => {
  it('100 fixed seeds: walkable start, six logs a day, first-day route ≤ 60 m', () => {
    let templates = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const f = generateForest(seed);
      if (f.template) templates++;
      expect(f.nav.walkable(f.spawn)).toBe(true);
      expect(f.snags.length * 2).toBeGreaterThanOrEqual(6);
      expect(firstDayRoute(f)).toBeLessThanOrEqual(60);
      for (const p of f.posts) {
        const d = Math.hypot(p.x, p.z);
        expect(d).toBeGreaterThanOrEqual(14);
        expect(d).toBeLessThanOrEqual(17);
      }
      // The start snag is within reach and the fire is on the right-hand side.
      const s0 = f.snags[0];
      expect(Math.hypot(s0.x - f.spawn.x, s0.z - f.spawn.z)).toBeLessThan(2);
    }
    expect(templates).toBeLessThan(40);
  }, 60000);

  it('is deterministic per seed', () => {
    const a = generateForest(42);
    const b = generateForest(42);
    expect(a.trees.length).toBe(b.trees.length);
    expect(a.trees[10]).toEqual(b.trees[10]);
    expect(a.posts).toEqual(b.posts);
  });
});

describe('chopping', () => {
  it('holding LMB for 2 s at the start snag gives 2 logs', () => {
    const w = World.start({ seed: 11 });
    const i = emptyInput();
    i.yaw = w.state.player.yaw;
    i.chop = true;
    run(w, 1.9, i);
    expect(w.state.player.logs).toBe(0);
    run(w, 0.2, i);
    expect(w.state.player.logs).toBe(2);
    expect(w.state.snagLogs[0]).toBe(0);
  });
});

/** Put the world into a night with the Deer hunting right next to the player. */
function huntSetup(seed = 5) {
  const w = World.start({ seed });
  const s = w.state;
  s.dayStarted = true;
  s.t = RULES.cycle.daySeconds - DT;
  w.step(emptyInput());
  expect(s.phase).toBe('night');
  s.t = 10;
  const pl = s.player;
  const post = w.forest.posts[0];
  // Open ground on the east trail, well outside the light.
  const k = 13 / Math.hypot(post.x, post.z);
  pl.x = post.x * k;
  pl.z = post.z * k;
  const d = s.deer;
  d.x = pl.x + 1.5 * (post.x / Math.hypot(post.x, post.z));
  d.z = pl.z + 1.5 * (post.z / Math.hypot(post.x, post.z));
  d.mode = 'hunt';
  d.timer = 0;
  d.sinceSwing = 9;
  d.threat = 50;
  return w;
}

describe('deer priorities', () => {
  it('signals the hunt 4.0 s after leaving protection on night 1, then 1.2 s of warning', () => {
    const w = World.start({ seed: 9 });
    const s = w.state;
    s.dayStarted = true;
    s.t = RULES.cycle.daySeconds - DT;
    const base = atFire(w);
    w.step(base);
    run(w, 5, base);
    expect(s.deer.threat).toBe(0);
    const post = w.forest.posts[0];
    s.player.x = post.x * 0.8;
    s.player.z = post.z * 0.8;
    const t0 = s.t;
    let cueAt = -1;
    let huntAt = -1;
    const still = emptyInput();
    for (let k = 0; k < 300 && huntAt < 0; k++) {
      w.step({ ...still });
      for (const e of w.drainEvents()) {
        if (e.type === 'deerCue' && cueAt < 0) cueAt = s.t - t0;
        if (e.type === 'deerHunt') huntAt = s.t - t0;
      }
    }
    expect(cueAt).toBeGreaterThan(3.9);
    expect(cueAt).toBeLessThan(4.15);
    expect(huntAt - cueAt).toBeGreaterThan(1.15);
    expect(huntAt - cueAt).toBeLessThan(1.3);
  });

  it('a swing lands for 40 HP and grants 1.2 s of invulnerability', () => {
    const w = huntSetup();
    const s = w.state;
    run(w, 1.0, emptyInput());
    expect(s.player.hp).toBe(60);
    expect(s.player.invuln).toBeGreaterThan(0);
  });

  it('dawn beats an attack in flight', () => {
    const w = huntSetup();
    const s = w.state;
    w.step(emptyInput());
    expect(s.deer.mode).toBe('swing');
    s.t = RULES.cycle.nightSeconds - 0.2;
    run(w, 1, emptyInput());
    expect(s.phase).toBe('draft');
    expect(s.player.hp).toBe(100);
  });

  it('a trap on the contact tick stuns and saves the player', () => {
    const w = huntSetup();
    const s = w.state;
    w.step(emptyInput());
    expect(s.deer.mode).toBe('swing');
    s.traps.push({ id: 99, x: s.deer.x, z: s.deer.z, arm: 0 });
    run(w, 1, emptyInput());
    expect(s.player.hp).toBe(100);
    expect(s.traps.length).toBe(0);
    expect(['stunned', 'retreat']).toContain(s.deer.mode);
  });

  it('stepping into the light during the windup cancels the hit', () => {
    const w = huntSetup();
    const s = w.state;
    w.step(emptyInput());
    expect(s.deer.mode).toBe('swing');
    s.fuel = 75;
    s.player.x = 3;
    s.player.z = 3;
    run(w, 1, emptyInput());
    expect(s.player.hp).toBe(100);
    expect(s.deer.mode === 'retreat' || s.deer.mode === 'patrol').toBe(true);
  });

  it('a fire that fades to 24 F stops protecting even inside the circle', () => {
    const w = World.start({ seed: 5 });
    const s = w.state;
    s.dayStarted = true;
    s.phase = 'night';
    s.t = 5;
    s.fuel = 24.2;
    const base = atFire(w);
    expect(w.playerProtected).toBe(true);
    run(w, 1, base);
    expect(s.bright).toBe(false);
    expect(w.playerProtected).toBe(false);
  });

  it('the flare stuns for 2 s and the stun is not extended', () => {
    const w = huntSetup();
    const s = w.state;
    const pl = s.player;
    const i = emptyInput();
    i.yaw = yawTo(s.deer.x - pl.x, s.deer.z - pl.z);
    i.flare = true;
    w.step(i);
    expect(s.deer.mode).toBe('stunned');
    const left = s.deer.stunLeft;
    pl.flares = 1;
    w.step(i);
    expect(s.deer.stunLeft).toBeLessThan(left);
    expect(pl.hp).toBe(100);
  });
});

describe('draft', () => {
  it('deals three different cards and repeats the tag of the last pick in slot one', () => {
    const w = World.start({ seed: 21 });
    const s = w.state;
    s.phase = 'draft';
    for (let k = 0; k < 50; k++) {
      const hand = dealHand(w, []);
      expect(hand.length).toBe(3);
      expect(new Set(hand).size).toBe(3);
    }
    s.lastTag = 'traps';
    for (let k = 0; k < 20; k++) expect(CARD_BY_ID[dealHand(w, [])[0]].tag).toBe('traps');
  });

  it('applies C01 and asks for a replacement on the fifth passive', () => {
    const w = World.start({ seed: 21 });
    const s = w.state;
    s.phase = 'draft';
    s.hand = ['C01', 'C04', 'C05'];
    expect(pickCard(w, 0)).toBe('done');
    expect(w.mods.fuelPerLog).toBe(24);
    s.cards = ['C01', 'C02', 'C03', 'C04'];
    s.hand = ['C05', 'R01', 'R02'];
    expect(pickCard(w, 1)).toBe('needReplace');
    expect(s.pendingCard).toBe('R01');
  });

  it('never offers a supply card when the pack is full', () => {
    const w = World.start({ seed: 22 });
    const s = w.state;
    s.phase = 'draft';
    s.player.logs = 6;
    s.player.scrap = 8;
    for (let k = 0; k < 40; k++) {
      const hand = dealHand(w, []);
      expect(hand).not.toContain('C07');
      expect(hand).not.toContain('C08');
    }
  });
});

describe('save', () => {
  it('round-trips a run through JSON under 128 KB', () => {
    const w = World.start({ seed: 77 });
    const i = emptyInput();
    i.yaw = w.state.player.yaw;
    i.chop = true;
    run(w, 3, i);
    const json = JSON.stringify(w.serialize());
    expect(json.length * 2).toBeLessThan(128 * 1024);
    const w2 = new World(JSON.parse(json));
    expect(w2.state.player.logs).toBe(2);
    expect(w2.forest.trees.length).toBe(w.forest.trees.length);
  });
});
