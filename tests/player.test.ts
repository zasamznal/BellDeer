// Player movement contract (GDD §2 "Управление и действия"):
// walk 4 m/s, sprint 6.2 m/s for 16 stamina/s, regen 12/s after 1 s,
// exhaustion unlock at 20, diagonal normalised, no cost when standing still,
// the 36 m disc and trunks are solid.
import { describe, expect, it } from 'vitest';
import { DT, RULES, World, d2, dayWorld, emptyInput, findLane, hyp, place, run, tick, yawTo } from './helpers';

/** A world with the player at the start of a straight obstacle-free lane, facing along it. */
function onLane(seed = 5, len = 8) {
  const w = dayWorld(seed);
  const lane = findLane(w, len, 0.6);
  place(w, lane.a);
  return { w, lane };
}

function travelled(w: World, from: { x: number; z: number }) {
  return d2(w.state.player, from);
}

describe('walking and sprinting', () => {
  it('walks at 4 m/s', () => {
    const { w, lane } = onLane();
    run(w, 1, { ...emptyInput(), yaw: lane.yaw, mz: 1 });
    expect(travelled(w, lane.a)).toBeCloseTo(4, 3);
    // …and exactly along the facing direction.
    expect(w.state.player.x - lane.a.x).toBeCloseTo(lane.dir.x * 4, 3);
    expect(w.state.player.z - lane.a.z).toBeCloseTo(lane.dir.z * 4, 3);
    expect(w.state.player.stamina).toBe(100);
  });

  it('strafes and backs up at the same 4 m/s', () => {
    for (const [mx, mz] of [
      [1, 0],
      [-1, 0],
      [0, -1],
    ] as const) {
      const w = dayWorld(5);
      const lane = findLane(w, 5, 0.6);
      place(w, lane.a);
      // Turn the body so that the requested move direction runs along the lane.
      const moveYawOffset = Math.atan2(-mx, mz); // forward → 0, right → −90°, back → 180°
      run(w, 1, { ...emptyInput(), yaw: lane.yaw - moveYawOffset, mx, mz });
      expect(travelled(w, lane.a)).toBeCloseTo(4, 3);
      expect(d2(w.state.player, { x: lane.a.x + lane.dir.x * 4, z: lane.a.z + lane.dir.z * 4 })).toBeLessThan(1e-3);
    }
  });

  it('normalises the diagonal: W+D is still 4 m/s, Shift+W+D still 6.2 m/s', () => {
    const { w, lane } = onLane(5, 8);
    // Facing 45° left of the lane, W+D moves along the lane.
    const diagYaw = lane.yaw + Math.PI / 4;
    run(w, 1, { ...emptyInput(), yaw: diagYaw, mx: 1, mz: 1 });
    expect(travelled(w, lane.a)).toBeCloseTo(4, 3);
    expect(d2(w.state.player, { x: lane.a.x + lane.dir.x * 4, z: lane.a.z + lane.dir.z * 4 })).toBeLessThan(1e-3);

    place(w, lane.a);
    run(w, 1, { ...emptyInput(), yaw: diagYaw, mx: 1, mz: 1, sprint: true });
    expect(travelled(w, lane.a)).toBeCloseTo(6.2, 3);
  });

  it('sprints at 6.2 m/s for 16 stamina per second', () => {
    const { w, lane } = onLane();
    run(w, 1, { ...emptyInput(), yaw: lane.yaw, mz: 1, sprint: true });
    expect(travelled(w, lane.a)).toBeCloseTo(6.2, 3);
    expect(w.state.player.stamina).toBeCloseTo(84, 6);
    expect(w.state.player.sprinting).toBe(true);
  });

  it('a full bar is worth about 39 m of sprint (GDD §5, build table)', () => {
    // 100 / 16 = 6.25 s × 6.2 m/s = 38.75 m. Count ticks instead of needing a 39 m lane.
    const w = dayWorld(5);
    const lane = findLane(w, 8, 0.6);
    let sprintTicks = 0;
    for (let k = 0; k < 400 && !w.state.player.exhausted; k++) {
      place(w, lane.a);
      tick(w, { yaw: lane.yaw, mz: 1, sprint: true });
      if (w.state.player.sprinting) sprintTicks++;
    }
    expect(w.state.player.exhausted).toBe(true);
    expect(sprintTicks * DT * RULES.player.sprint).toBeGreaterThan(38.5);
    expect(sprintTicks * DT * RULES.player.sprint).toBeLessThan(39.2);
  });

  it('holding Shift while standing still costs nothing and does not block regeneration', () => {
    const w = dayWorld(5);
    run(w, 2, { ...emptyInput(), sprint: true });
    expect(w.state.player.stamina).toBe(100);
    expect(w.state.player.sprinting).toBe(false);

    w.state.player.stamina = 50;
    w.state.player.sinceSprint = 9;
    const before = { x: w.state.player.x, z: w.state.player.z };
    run(w, 1, { ...emptyInput(), sprint: true });
    expect(w.state.player.stamina).toBeCloseTo(62, 5);
    expect(travelled(w, before)).toBe(0);
  });

  it('regenerates 12/s, but only after 1 s without sprinting', () => {
    const { w, lane } = onLane();
    run(w, 1, { ...emptyInput(), yaw: lane.yaw, mz: 1, sprint: true });
    const after = w.state.player.stamina;
    // 0.9 s later nothing has come back yet, whether walking or standing.
    run(w, 0.9, { ...emptyInput(), yaw: lane.yaw });
    expect(w.state.player.stamina).toBe(after);
    // 1 s of delay + 1 s of regeneration (one tick of slack for the float clock).
    run(w, 1.1, { ...emptyInput(), yaw: lane.yaw });
    expect(w.state.player.stamina).toBeGreaterThan(after + 12 - 0.5);
    expect(w.state.player.stamina).toBeLessThan(after + 12 + 0.5);
    // Never above the cap.
    run(w, 20, emptyInput());
    expect(w.state.player.stamina).toBe(100);
  });

  it('walking does not delay regeneration, sprinting restarts the delay', () => {
    const { w, lane } = onLane();
    w.state.player.stamina = 40;
    w.state.player.sinceSprint = 9;
    run(w, 1, { ...emptyInput(), yaw: lane.yaw, mz: 1 });
    expect(w.state.player.stamina).toBeCloseTo(52, 5);
    place(w, lane.a);
    tick(w, { yaw: lane.yaw, mz: 1, sprint: true });
    const s0 = w.state.player.stamina;
    run(w, 0.5, { ...emptyInput(), yaw: lane.yaw });
    expect(w.state.player.stamina).toBe(s0);
  });

  it('exhaustion: at 0 stamina the sprint locks until 20 is back', () => {
    const { w, lane } = onLane();
    const pl = w.state.player;
    pl.stamina = 2;
    const go = { ...emptyInput(), yaw: lane.yaw, mz: 1, sprint: true };
    run(w, 0.2, go);
    expect(pl.stamina).toBe(0);
    expect(pl.exhausted).toBe(true);

    // Shift is still held: the player only walks, and the bar refills after the delay.
    let unlockedAt = -1;
    let sprintedWhileLocked = false;
    for (let k = 0; k < 150 && unlockedAt < 0; k++) {
      place(w, lane.a);
      const wasExhausted = pl.exhausted;
      const staminaBefore = pl.stamina;
      tick(w, go);
      const step = travelled(w, lane.a);
      if (wasExhausted && pl.exhausted) {
        if (pl.sprinting) sprintedWhileLocked = true;
        expect(step).toBeCloseTo(RULES.player.walk * DT, 6);
        expect(pl.stamina).toBeLessThan(20);
      }
      if (wasExhausted && !pl.exhausted) {
        unlockedAt = k;
        expect(staminaBefore).toBeLessThan(20);
        expect(pl.stamina).toBeGreaterThanOrEqual(20);
      }
    }
    expect(sprintedWhileLocked).toBe(false);
    // 1 s delay + 20 / 12 s of regeneration ≈ 2.67 s.
    expect(unlockedAt * DT).toBeGreaterThan(2.5);
    expect(unlockedAt * DT).toBeLessThan(2.85);
    // The very next tick sprints again.
    place(w, lane.a);
    tick(w, go);
    expect(pl.sprinting).toBe(true);
    expect(travelled(w, lane.a)).toBeCloseTo(RULES.player.sprint * DT, 6);
  });

  it('chopping roots the player (GDD: "рубка ведётся на месте")', () => {
    const w = World.start({ seed: 11 });
    const start = { x: w.state.player.x, z: w.state.player.z };
    run(w, 1, { ...emptyInput(), yaw: w.state.player.yaw, chop: true, mz: 1, sprint: true });
    expect(travelled(w, start)).toBe(0);
    expect(w.state.player.stamina).toBe(100);
  });
});

describe('world edge and obstacles', () => {
  it('cannot leave the 36 m disc in any direction', () => {
    const w = dayWorld(5);
    for (let a = 0; a < 360; a += 15) {
      const dir = { x: Math.cos((a * Math.PI) / 180), z: Math.sin((a * Math.PI) / 180) };
      place(w, { x: dir.x * 33.5, z: dir.z * 33.5 });
      run(w, 2, { ...emptyInput(), yaw: yawTo(dir.x, dir.z), mz: 1, sprint: true }, () => {
        expect(hyp(w.state.player)).toBeLessThanOrEqual(RULES.world.radius);
      });
      // Sliding along the rim with a diagonal does not get out either.
      run(w, 2, { ...emptyInput(), yaw: yawTo(dir.x, dir.z), mz: 1, mx: 1, sprint: true }, () => {
        expect(hyp(w.state.player)).toBeLessThanOrEqual(RULES.world.radius);
      });
      w.state.player.stamina = 100;
      w.state.player.exhausted = false;
    }
  });

  it('cannot walk through a trunk', () => {
    for (const seed of [3, 5, 8]) {
      const w = dayWorld(seed);
      const R = RULES.world.playerRadius;
      const trees = w.forest.obstacles.filter((o) => o.kind === 'tree' && hyp(o) < 30).slice(0, 12);
      expect(trees.length).toBeGreaterThan(5);
      for (const t of trees) {
        // Approach from the fire side, straight at the centre of the trunk.
        const k = (hyp(t) - 2.5) / hyp(t);
        const from = { x: t.x * k, z: t.z * k };
        place(w, from);
        const dir = { x: (t.x - from.x) / 2.5, z: (t.z - from.z) / 2.5 };
        run(w, 2, { ...emptyInput(), yaw: yawTo(dir.x, dir.z), mz: 1 }, () => {
          const pl = w.state.player;
          expect(d2(pl, t)).toBeGreaterThanOrEqual(t.r + R - 1e-6);
          // Still on the near side of the trunk.
          expect((pl.x - t.x) * dir.x + (pl.z - t.z) * dir.z).toBeLessThan(0);
        });
        // No obstacle of any kind is overlapped once the walk settles.
        for (const o of w.forest.obstacles) expect(d2(w.state.player, o)).toBeGreaterThanOrEqual(o.r + R - 0.02);
      }
    }
  });

  it('the campfire, the workbench and a boulder are solid too', () => {
    const w = dayWorld(5);
    const R = RULES.world.playerRadius;
    const solids = [
      w.forest.obstacles.find((o) => o.kind === 'fire')!,
      w.forest.obstacles.find((o) => o.kind === 'bench')!,
      w.forest.obstacles.find((o) => o.kind === 'rock')!,
      w.forest.obstacles.find((o) => o.kind === 'post')!,
    ];
    for (const o of solids) {
      for (const a of [0, 90, 180, 270]) {
        const dir = { x: Math.cos((a * Math.PI) / 180), z: Math.sin((a * Math.PI) / 180) };
        place(w, { x: o.x - dir.x * (o.r + 2), z: o.z - dir.z * (o.r + 2) });
        run(w, 1.5, { ...emptyInput(), yaw: yawTo(dir.x, dir.z), mz: 1 }, () => {
          expect(d2(w.state.player, o)).toBeGreaterThanOrEqual(o.r + R - 1e-6);
        });
      }
    }
  });
});

describe('day clock start', () => {
  it('the first day timer starts with the first movement or action, not before', () => {
    const w = World.start({ seed: 5 });
    for (let k = 0; k < 90; k++) w.step({ ...emptyInput(), yaw: 0.3, pitch: 0.1 }); // looking around is free
    expect(w.state.t).toBe(0);
    expect(w.state.tick).toBe(0);
    expect(w.state.fuel).toBe(RULES.fire.start);
    w.step({ ...emptyInput(), mz: 1 });
    expect(w.state.tick).toBe(1);
    for (let k = 0; k < 29; k++) w.step(emptyInput());
    expect(w.state.t).toBeCloseTo(1, 6);
  });

  it('starts with an axe, a full flashlight, one flare and empty counters', () => {
    const pl = World.start({ seed: 5 }).state.player;
    expect([pl.logs, pl.scrap, pl.berries, pl.traps, pl.flares, pl.tags]).toEqual([0, 0, 0, 0, 1, 0]);
    expect(pl.battery).toBe(100);
    expect(pl.hp).toBe(100);
    expect(pl.stamina).toBe(100);
    expect(World.start({ seed: 5, bonusTrap: true }).state.player.traps).toBe(1);
  });
});
