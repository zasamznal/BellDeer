// The dawn draft and the 19 cards (GDD §5 "Колода и сборки").
import { describe, expect, it } from 'vitest';
import { canReroll, dealHand, pickCard, replaceCard, reroll, skipCard } from '../src/sim/draft';
import { computeMods, type Mods } from '../src/sim/mods';
import { CARDS, CARD_BY_ID, type Rarity, type Tag } from '../src/sim/rules';
import { lineOfSight } from '../src/sim/forest';
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
  skipToDawn,
  standAt,
  tick,
  yawTo,
  type SimEvent,
  type V2,
} from './helpers';

function draftWorld(seed = 21): World {
  const w = World.start({ seed });
  w.state.phase = 'draft';
  return w;
}
const rarityOf = (id: string): Rarity => CARD_BY_ID[id].rarity;
const add = (p: V2, u: V2, m: number): V2 => ({ x: p.x + u.x * m, z: p.z + u.z * m });

// ------------------------------------------------------------------ the deck

describe('deck', () => {
  it('has the 19 cards of the GDD table with their rarity and tag', () => {
    const table: [string, Rarity, Tag, 'passive' | 'supply'][] = [
      ['C01', 'common', 'fire', 'passive'],
      ['C02', 'common', 'fire', 'passive'],
      ['C03', 'common', 'beam', 'passive'],
      ['C04', 'common', 'run', 'passive'],
      ['C05', 'common', 'traps', 'passive'],
      ['C06', 'common', 'run', 'passive'],
      ['C07', 'common', 'supply', 'supply'],
      ['C08', 'common', 'supply', 'supply'],
      ['R01', 'rare', 'fire', 'passive'],
      ['R02', 'rare', 'traps', 'passive'],
      ['R03', 'rare', 'beam', 'passive'],
      ['R04', 'rare', 'run', 'passive'],
      ['R05', 'rare', 'beam', 'passive'],
      ['R06', 'rare', 'fire', 'passive'],
      ['R07', 'rare', 'run', 'passive'],
      ['E01', 'epic', 'fire', 'passive'],
      ['E02', 'epic', 'traps', 'passive'],
      ['E03', 'epic', 'beam', 'passive'],
      ['E04', 'epic', 'traps', 'passive'],
    ];
    expect(CARDS.length).toBe(19);
    expect(CARDS.map((c) => [c.id, c.rarity, c.tag, c.kind])).toEqual(table);
  });
});

// ------------------------------------------------------------------ dealing

describe('dealing a hand', () => {
  it('rarity of every free slot is about 60 / 30 / 10; cards within a rarity are equally likely', () => {
    const w = draftWorld(21);
    const N = 9000;
    const bySlot = [0, 1, 2].map(() => ({ common: 0, rare: 0, epic: 0 }));
    const first: Record<string, number> = {};
    for (let k = 0; k < N; k++) {
      const hand = dealHand(w, []);
      expect(hand.length).toBe(3);
      expect(new Set(hand).size).toBe(3);
      hand.forEach((id, slot) => bySlot[slot][rarityOf(id)]++);
      first[hand[0]] = (first[hand[0]] ?? 0) + 1;
    }
    for (const slot of bySlot) {
      expect(slot.common / N).toBeGreaterThan(0.57);
      expect(slot.common / N).toBeLessThan(0.63);
      expect(slot.rare / N).toBeGreaterThan(0.27);
      expect(slot.rare / N).toBeLessThan(0.33);
      expect(slot.epic / N).toBeGreaterThan(0.08);
      expect(slot.epic / N).toBeLessThan(0.12);
    }
    // Every one of the 19 cards shows up, at its share of the rarity weight.
    const share = { common: 0.6 / 8, rare: 0.3 / 7, epic: 0.1 / 4 };
    for (const c of CARDS) {
      const p = (first[c.id] ?? 0) / N;
      expect(p, c.id).toBeGreaterThan(share[c.rarity] * 0.75);
      expect(p, c.id).toBeLessThan(share[c.rarity] * 1.25);
    }
  });

  it('an empty rarity hands its weight to the others in proportion (60:30 → 2/3 : 1/3)', () => {
    const w = draftWorld(22);
    w.state.cards = ['E01', 'E02', 'E03', 'E04'];
    const N = 6000;
    let common = 0;
    for (let k = 0; k < N; k++) {
      const hand = dealHand(w, []);
      expect(hand.every((id) => rarityOf(id) !== 'epic')).toBe(true);
      if (rarityOf(hand[0]) === 'common') common++;
    }
    expect(common / N).toBeGreaterThan(2 / 3 - 0.03);
    expect(common / N).toBeLessThan(2 / 3 + 0.03);
  });

  it('never offers an active passive', () => {
    const w = draftWorld(23);
    w.state.cards = ['C01', 'R03', 'E02', 'C06'];
    for (let k = 0; k < 500; k++) for (const id of dealHand(w, [])) expect(w.state.cards).not.toContain(id);
  });

  it('supply cards are left out when the matching counter is full', () => {
    const w = draftWorld(24);
    const seen = new Set<string>();
    w.state.player.logs = 6;
    for (let k = 0; k < 300; k++) dealHand(w, []).forEach((id) => seen.add(id));
    expect(seen.has('C07')).toBe(false);
    expect(seen.has('C08')).toBe(true);
    seen.clear();
    w.state.player.logs = 5;
    w.state.player.scrap = 8;
    for (let k = 0; k < 300; k++) dealHand(w, []).forEach((id) => seen.add(id));
    expect(seen.has('C07')).toBe(true);
    expect(seen.has('C08')).toBe(false);
  });

  it('a supply card that was taken skips exactly one dawn', () => {
    const w = draftWorld(25);
    const s = w.state;
    s.hand = ['C07', 'C01', 'R01'];
    expect(pickCard(w, 0)).toBe('done');
    expect(s.player.logs).toBe(2);
    expect(s.cards).toEqual([]); // a one-off, it takes no slot
    // Next dawn: C07 is out of the pool, C08 is not.
    const seen = new Set<string>();
    for (let k = 0; k < 300; k++) dealHand(w, []).forEach((id) => seen.add(id));
    expect(seen.has('C07')).toBe(false);
    expect(seen.has('C08')).toBe(true);
    // Whatever happens at that dawn (pick, skip), the card is back for the one after.
    s.hand = dealHand(w, []);
    expect(skipCard(w)).toBe(true);
    seen.clear();
    for (let k = 0; k < 300; k++) dealHand(w, []).forEach((id) => seen.add(id));
    expect(seen.has('C07')).toBe(true);
  });

  it('from the second pick on, slot one carries the tag of the last permanent pick, by the same weights', () => {
    const w = draftWorld(26);
    const s = w.state;
    // First dawn: no bias.
    const tags = new Set<string>();
    for (let k = 0; k < 200; k++) tags.add(CARD_BY_ID[dealHand(w, [])[0]].tag);
    expect(tags.size).toBeGreaterThan(3);

    s.hand = ['C01', 'C04', 'C05'];
    expect(pickCard(w, 0)).toBe('done');
    expect(s.lastTag).toBe('fire');
    const N = 4000;
    const r = { common: 0, rare: 0, epic: 0 };
    const others = new Set<string>();
    for (let k = 0; k < N; k++) {
      const hand = dealHand(w, []);
      expect(CARD_BY_ID[hand[0]].tag).toBe('fire');
      expect(hand[0]).not.toBe('C01');
      r[rarityOf(hand[0])]++;
      others.add(CARD_BY_ID[hand[1]].tag).add(CARD_BY_ID[hand[2]].tag);
    }
    // Fire cards left: C02 | R01, R06 | E01.
    expect(r.common / N).toBeGreaterThan(0.56);
    expect(r.common / N).toBeLessThan(0.64);
    expect(r.rare / N).toBeGreaterThan(0.26);
    expect(r.rare / N).toBeLessThan(0.34);
    expect(r.epic / N).toBeGreaterThan(0.07);
    expect(r.epic / N).toBeLessThan(0.13);
    expect(others.size).toBe(5); // the other two slots stay free

    // A supply pick does not move the tag.
    s.hand = ['C08', 'C04', 'C05'];
    pickCard(w, 0);
    expect(s.lastTag).toBe('fire');
  });

  it('falls back to a free slot when no card with that tag is left', () => {
    const w = draftWorld(27);
    const s = w.state;
    s.cards = ['C03', 'R03', 'R05', 'E03']; // every beam card is active
    s.lastTag = 'beam';
    for (let k = 0; k < 200; k++) {
      const hand = dealHand(w, []);
      expect(hand.length).toBe(3);
      expect(new Set(hand).size).toBe(3);
      expect(hand.some((id) => CARD_BY_ID[id].tag === 'beam')).toBe(false);
    }
  });

  it('the dawn after a survived night deals three cards and the same hand survives a reload', () => {
    const w = dayWorld(31);
    skipToDawn(w);
    const s = w.state;
    expect(s.phase).toBe('draft');
    expect(s.hand!.length).toBe(3);
    expect(new Set(s.hand).size).toBe(3);
    const copy = new World(JSON.parse(JSON.stringify(w.serialize())));
    expect(copy.state.hand).toEqual(s.hand);
    expect(copy.state.phase).toBe('draft');
  });
});

// ------------------------------------------------------------------ picking

describe('picking', () => {
  it('four permanent slots; the fifth passive asks which one to replace', () => {
    const w = draftWorld(28);
    const s = w.state;
    for (const id of ['C01', 'C02', 'C03', 'C04']) {
      s.hand = [id, 'C05', 'C06'];
      expect(pickCard(w, 0)).toBe('done');
    }
    expect(s.cards).toEqual(['C01', 'C02', 'C03', 'C04']);
    expect(w.mods.fuelPerLog).toBe(24);

    s.hand = ['R04', 'C05', 'C06'];
    expect(pickCard(w, 0)).toBe('needReplace');
    expect(s.pendingCard).toBe('R04');
    expect(s.cards).toEqual(['C01', 'C02', 'C03', 'C04']);
    expect(w.mods.sprint).toBe(6.2); // nothing applied yet
    // While the question is open nothing else is accepted.
    expect(pickCard(w, 1)).toBe('invalid');
    expect(skipCard(w)).toBe(false);
    expect(canReroll(w)).toBe(false);

    // Replace slot 0: C01 goes, R04 comes; one rank per card.
    expect(replaceCard(w, 0)).toBe(true);
    expect(s.cards).toEqual(['R04', 'C02', 'C03', 'C04']);
    expect(s.pendingCard).toBeNull();
    expect(w.mods.fuelPerLog).toBe(20);
    expect(w.mods.sprint).toBe(7);
    expect(s.lastTag).toBe('run');
    expect(replaceCard(w, 0)).toBe(false);
  });

  it('…or keeps the old build', () => {
    const w = draftWorld(28);
    const s = w.state;
    s.cards = ['C01', 'C02', 'C03', 'C04'];
    s.lastTag = 'run';
    w.refreshMods();
    s.hand = ['R01', 'C05', 'C06'];
    expect(pickCard(w, 0)).toBe('needReplace');
    expect(replaceCard(w, -1)).toBe(true);
    expect(s.cards).toEqual(['C01', 'C02', 'C03', 'C04']);
    expect(s.pendingCard).toBeNull();
    expect(w.mods.radiusMult).toBe(1);
    expect(s.lastTag).toBe('run');
  });

  it('a supply card is taken even with four slots full', () => {
    const w = draftWorld(28);
    const s = w.state;
    s.cards = ['C01', 'C02', 'C03', 'C04'];
    s.hand = ['C08', 'C05', 'C06'];
    expect(pickCard(w, 0)).toBe('done');
    expect(s.player.scrap).toBe(2);
    expect(s.cards.length).toBe(4);
  });

  it('skip takes nothing and the next day starts', () => {
    const w = dayWorld(29);
    skipToDawn(w);
    const s = w.state;
    const before = JSON.stringify([s.cards, s.player.logs, s.player.scrap]);
    expect(skipCard(w)).toBe(true);
    expect(JSON.stringify([s.cards, s.player.logs, s.player.scrap])).toBe(before);
    w.beginDay();
    expect(s.phase).toBe('day');
    expect(s.night).toBe(2);
    expect(s.hand).toBeNull();
  });

  it('rejects picks outside the draft or outside the hand', () => {
    const w = dayWorld(29);
    w.state.hand = ['C01', 'C02', 'C03'];
    expect(pickCard(w, 0)).toBe('invalid'); // phase is 'day'
    expect(skipCard(w)).toBe(false);
    expect(reroll(w)).toBe(false);
    w.state.phase = 'draft';
    expect(pickCard(w, 3)).toBe('invalid');
    expect(pickCard(w, -1)).toBe('invalid');
    expect(w.state.cards).toEqual([]);
  });

  // "Авторитет валидирует … однократность команды" (GDD §7). After a successful
  // pick the hand stays in the state, so a second pickCard() in the same dawn is
  // accepted by the sim; only main.ts prevents it by emptying `hand` itself.
  it('only one card can be taken per dawn', () => {
    const w = draftWorld(30);
    w.state.hand = ['C01', 'C02', 'C03'];
    expect(pickCard(w, 0)).toBe('done');
    expect(pickCard(w, 1)).toBe('invalid');
    expect(w.state.cards).toEqual(['C01']);
  });
});

// ------------------------------------------------------------------ reroll

describe('reroll', () => {
  function atDawn(nightsSurvived: number, night: number, scrap: number, seed = 33) {
    const w = draftWorld(seed);
    const s = w.state;
    s.night = night;
    s.stats.nightsSurvived = nightsSurvived;
    s.player.scrap = scrap;
    s.hand = dealHand(w, []);
    return w;
  }

  it('costs 2 scrap, needs two survived nights, and deals none of the previous hand', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const w = atDawn(2, 2, 3, seed);
      const s = w.state;
      const old = [...s.hand!];
      expect(canReroll(w)).toBe(true);
      expect(reroll(w)).toBe(true);
      expect(s.player.scrap).toBe(1);
      expect(s.hand!.length).toBe(3);
      expect(new Set(s.hand).size).toBe(3);
      for (const id of s.hand!) expect(old).not.toContain(id);
    }
  });

  it('is refused before two nights were survived or without 2 scrap', () => {
    expect(canReroll(atDawn(1, 1, 8))).toBe(false);
    expect(reroll(atDawn(1, 1, 8))).toBe(false);
    const poor = atDawn(2, 2, 1);
    const hand = [...poor.state.hand!];
    expect(reroll(poor)).toBe(false);
    expect(poor.state.hand).toEqual(hand);
    expect(poor.state.player.scrap).toBe(1);
  });

  it('once per chapter of three nights', () => {
    const w = atDawn(2, 2, 8);
    const s = w.state;
    expect(reroll(w)).toBe(true);
    expect(canReroll(w)).toBe(false);
    expect(reroll(w)).toBe(false);
    expect(s.player.scrap).toBe(6);
    // Dawn of night 3 is still chapter 1.
    s.night = 3;
    s.stats.nightsSurvived = 3;
    s.hand = dealHand(w, []);
    expect(canReroll(w)).toBe(false);
    // Dawn of night 4 opens chapter 2.
    s.night = 4;
    s.stats.nightsSurvived = 4;
    s.hand = dealHand(w, []);
    expect(reroll(w)).toBe(true);
    expect(s.player.scrap).toBe(4);
    expect(reroll(w)).toBe(false);
  });

  it('respects active passives and resting supplies', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const w = atDawn(2, 2, 8, seed);
      const s = w.state;
      s.cards = ['C01', 'R01', 'E01', 'C05'];
      s.supplyRest = ['C07'];
      s.hand = dealHand(w, []);
      expect(reroll(w)).toBe(true);
      for (const id of s.hand!) {
        expect(s.cards).not.toContain(id);
        expect(id).not.toBe('C07');
      }
    }
  });
});

// ------------------------------------------------------------------ card effects

describe('computeMods: every card changes exactly its own stat', () => {
  const base = computeMods([]);
  const expected: Record<string, Partial<Mods>> = {
    C01: { fuelPerLog: 24 },
    C02: { chopSeconds: 1.5 },
    C03: { beamDrain: 1 },
    C04: { sprintCost: 12 },
    C05: { trapStun: 4 },
    C06: { berryHp: 28, berryStamina: 35 },
    C07: {},
    C08: {},
    R01: { radiusMult: 1.2 },
    R02: { trapCost: 1 },
    R03: { pulse: true },
    R04: { sprint: 7 },
    R05: { beamRange: 20, revealSeconds: 0.5 },
    R06: { torchSeconds: 27 },
    R07: { hearStep: 3, hearRun: 6 },
    E01: { ember: true },
    E02: { autoTrap: true },
    E03: { dynamo: true },
    E04: { flareRadius: 6, flareStun: 2.5 },
  };

  it('baseline equals the GDD values without cards', () => {
    expect(base).toEqual({
      fuelPerLog: 20,
      chopSeconds: 2,
      beamDrain: 1.25,
      sprintCost: 16,
      trapStun: 3,
      berryHp: 18,
      berryStamina: 25,
      radiusMult: 1,
      trapCost: 2,
      pulse: false,
      sprint: 6.2,
      beamRange: 14,
      revealSeconds: 1,
      torchSeconds: 18,
      hearStep: 6,
      hearRun: 12,
      ember: false,
      autoTrap: false,
      dynamo: false,
      flareRadius: 4,
      flareStun: 2,
    });
  });

  for (const c of CARDS) {
    it(`${c.id}`, () => {
      expect(Object.keys(expected)).toContain(c.id);
      expect(computeMods([c.id])).toEqual({ ...base, ...expected[c.id] });
    });
  }

  it('effects of different cards stack independently', () => {
    const all = computeMods(CARDS.map((c) => c.id));
    const merged = Object.assign({}, base, ...Object.values(expected));
    expect(all).toEqual(merged);
  });
});

describe('card effects in the simulation', () => {
  const withCards = (w: World, ...ids: string[]) => {
    w.state.cards = ids;
    w.refreshMods();
    return w;
  };

  it('C01 Dry heartwood: a log gives 24 F', () => {
    const w = withCards(dayWorld(5), 'C01');
    const s = w.state;
    s.fuel = 30;
    s.player.logs = 1;
    const i = atFire(w);
    tick(w, i);
    expect(w.focus!.info).toBe('+24');
    s.fuel = 30;
    const ev = tick(w, { ...i, interact: true });
    expect(ev).toContainEqual({ type: 'feed', gain: 24, relit: false });
    expect(s.fuel).toBeCloseTo(54 - 0.15 * DT, 9);
  });

  it('C02 Whetstone: chopping takes 1.5 s', () => {
    const w = withCards(dayWorld(11), 'C02');
    const i = standAt(w, w.forest.snags[0], 1.2, { chop: true });
    run(w, 1.4, i);
    expect(w.state.player.logs).toBe(0);
    run(w, 0.15, i);
    expect(w.state.player.logs).toBe(2);
  });

  it('C03 Thrifty flashlight: the beam drains 1/s', () => {
    const w = withCards(dayWorld(5), 'C03');
    tick(w, { light: true });
    run(w, 10 - DT, emptyInput());
    expect(w.state.player.battery).toBeCloseTo(90, 6);
  });

  it('C04 Even breath: sprint costs 12/s at the same speed', () => {
    const w = withCards(dayWorld(5), 'C04');
    const lane = findLane(w, 8, 0.6);
    place(w, lane.a);
    run(w, 1, { ...emptyInput(), yaw: lane.yaw, mz: 1, sprint: true });
    expect(w.state.player.stamina).toBeCloseTo(88, 6);
    expect(d2(w.state.player, lane.a)).toBeCloseTo(6.2, 3);
  });

  it('C05 Double spring: a trap stuns for 4 s', () => {
    const w = withCards(nightWorld(5), 'C05');
    const s = w.state;
    s.t = 10;
    s.fuel = 75;
    const lane = findLane(w, 4, 1.5, 12, 30);
    setDeer(w, 'feint', lane.a);
    s.traps.push({ id: 1, x: lane.a.x, z: lane.a.z, arm: 0 });
    expect(tick(w, atFire(w))).toContainEqual({ type: 'deerStunned', by: 'trap' });
    const stunned = runUntil(w, 6, () => s.deer.mode !== 'stunned', atFire(w));
    expect(stunned).toBeGreaterThan(3.9);
    expect(stunned).toBeLessThan(4.1);
  });

  it('C06 Dried berries: 28 HP and 35 stamina', () => {
    const w = withCards(dayWorld(5), 'C06');
    const pl = w.state.player;
    pl.berries = 1;
    pl.hp = 50;
    pl.stamina = 40;
    pl.sinceSprint = 0;
    tick(w, { eat: true });
    run(w, 0.55, emptyInput());
    expect(pl.hp).toBe(78);
    expect(pl.stamina).toBeCloseTo(75, 6);
  });

  it('C07 / C08: +2 logs / +2 scrap now, up to the pack limit, one-off', () => {
    const w = draftWorld(5);
    const s = w.state;
    s.player.logs = 5;
    s.player.scrap = 3;
    s.hand = ['C07', 'C08', 'C01'];
    expect(pickCard(w, 0)).toBe('done');
    expect(s.player.logs).toBe(6);
    s.hand = ['C07', 'C08', 'C01'];
    expect(pickCard(w, 1)).toBe('done');
    expect(s.player.scrap).toBe(5);
    expect(s.cards).toEqual([]);
    expect(w.mods).toEqual(computeMods([]));
  });

  it('R01 Fire reflector: radius ×1.2, the full circle is 10.2 m', () => {
    const w = withCards(dayWorld(5), 'R01');
    w.state.fuel = 75;
    expect(w.radius).toBeCloseTo(10.2, 9);
    expect(w.isProtected({ x: 10.1, z: 0 })).toBe(true);
    expect(w.isProtected({ x: 10.3, z: 0 })).toBe(false);
    w.state.fuel = 42;
    expect(w.radius).toBeCloseTo(5.86 * 1.2, 9);
  });

  it('R02 Bent staple: a trap costs 1 scrap at the bench and in the field', () => {
    const w = withCards(dayWorld(5), 'R02');
    const pl = w.state.player;
    pl.scrap = 2;
    const b = w.forest.bench;
    place(w, { x: b.x + 1.3, z: b.z });
    const i = lookAt(w, b);
    tick(w, { ...i, interact: true });
    tick(w, { ...i, craft: 1 });
    run(w, 1.1, i);
    expect([pl.scrap, pl.traps]).toEqual([1, 1]);
    tick(w, { ...i, interact: true });

    pl.traps = 0;
    const lane = findLane(w, 8, 1.6, 10, 30);
    place(w, lane.a);
    run(w, 0.9, { ...emptyInput(), yaw: lane.yaw, trapHold: true });
    expect(w.state.traps.length).toBe(1);
    expect(pl.scrap).toBe(0);
    // The flare recipe keeps its price.
    pl.scrap = 1;
    expect(w.canCraft(2)).toBe(false);
  });

  describe('R03 Pulse lens', () => {
    function setup(card: boolean) {
      const w = nightWorld(5);
      if (card) withCards(w, 'R03');
      const s = w.state;
      s.t = 10;
      s.fuel = 75;
      const lane = findLane(w, 12, 1.2, 12, 32);
      place(w, lane.a);
      setDeer(w, 'stalk', add(lane.a, lane.dir, 8), { orbitTimer: 99 });
      return { w, s, lane, pl: s.player, look: { ...emptyInput(), yaw: lane.yaw } };
    }

    it('V with the beam on: −20 battery, the Deer in the cone is stunned for 1.3 s, 20 s cooldown', () => {
      const { w, s, pl, look } = setup(true);
      tick(w, { ...look, light: true });
      setDeer(w, 'stalk', { x: s.deer.x, z: s.deer.z }, { orbitTimer: 99 });
      const b0 = pl.battery;
      const ev = tick(w, { ...look, pulse: true });
      expect(ev).toContainEqual({ type: 'pulse', hit: true });
      expect(ev).toContainEqual({ type: 'deerStunned', by: 'pulse' });
      expect(pl.battery).toBeCloseTo(b0 - 20 - 1.25 * DT, 6);
      const stunned = runUntil(w, 3, () => s.deer.mode !== 'stunned', look);
      expect(stunned).toBeGreaterThan(1.25);
      expect(stunned).toBeLessThan(1.4);
      expect(pl.hp).toBe(100);

      // Cooldown: refused for 20 s, costs nothing.
      const b1 = pl.battery;
      expect(has(tick(w, { ...look, pulse: true }), 'denied')).toBe(true);
      expect(pl.battery).toBeCloseTo(b1 - 1.25 * DT, 6);
      pl.pulseCd = 0.05;
      run(w, 0.1, look);
      expect(count(tick(w, { ...look, pulse: true }), 'pulse')).toBe(1);
      expect(pl.pulseCd).toBeCloseTo(20, 6);
    });

    it('misses outside the 36° cone but still costs the charge', () => {
      const { w, s, pl, look } = setup(true);
      const away = { ...look, yaw: look.yaw + (25 * Math.PI) / 180 };
      tick(w, { ...away, light: true });
      setDeer(w, 'stalk', { x: s.deer.x, z: s.deer.z }, { orbitTimer: 99 });
      const b0 = pl.battery;
      expect(tick(w, { ...away, pulse: true })).toContainEqual({ type: 'pulse', hit: false });
      expect(s.deer.mode).not.toBe('stunned');
      expect(pl.battery).toBeLessThan(b0 - 20);
    });

    it('the cone is 36° in total: 17° off-axis hits, 19° does not; 14 m range', () => {
      const shot = (deg: number, range = 8) => {
        const { w, s, lane, look } = setup(true);
        const aim = { ...look, yaw: look.yaw + (deg * Math.PI) / 180 };
        tick(w, { ...aim, light: true });
        setDeer(w, 'stalk', add(lane.a, lane.dir, range), { orbitTimer: 99 });
        s.deer.orbitDir = 0; // hold still for the measurement
        const ev = tick(w, { ...aim, pulse: true });
        return (ev.find((e) => e.type === 'pulse') as Extract<SimEvent, { type: 'pulse' }>).hit;
      };
      expect(shot(0)).toBe(true);
      expect(shot(17)).toBe(true);
      expect(shot(-17)).toBe(true);
      expect(shot(19)).toBe(false);
      expect(shot(-19)).toBe(false);
      expect(shot(0, 11.5)).toBe(true);
    });

    it('needs the flashlight on and 20 battery', () => {
      const { w, pl, look } = setup(true);
      expect(has(tick(w, { ...look, pulse: true }), 'denied')).toBe(true);
      expect(pl.battery).toBe(100);
      tick(w, { ...look, light: true });
      pl.battery = 19;
      expect(has(tick(w, { ...look, pulse: true }), 'denied')).toBe(true);
      expect(pl.battery).toBeGreaterThan(18.9);
    });

    it('does nothing without the card', () => {
      const { w, s, pl, look } = setup(false);
      tick(w, { ...look, light: true });
      const ev = tick(w, { ...look, pulse: true });
      expect(has(ev, 'pulse')).toBe(false);
      expect(s.deer.mode).not.toBe('stunned');
      expect(pl.battery).toBeGreaterThan(99.9);
    });
  });

  it('R04 Running spikes: sprint 7 m/s', () => {
    const w = withCards(dayWorld(5), 'R04');
    const lane = findLane(w, 8, 0.6);
    place(w, lane.a);
    run(w, 1, { ...emptyInput(), yaw: lane.yaw, mz: 1, sprint: true });
    expect(d2(w.state.player, lane.a)).toBeCloseTo(7, 3);
    expect(w.state.player.stamina).toBeCloseTo(84, 6);
    place(w, lane.a);
    run(w, 1, { ...emptyInput(), yaw: lane.yaw, mz: 1 });
    expect(d2(w.state.player, lane.a)).toBeCloseTo(4, 3);
  });

  it('R05 Keeper optics: beam range 20 m, tag reveal 0.5 s', () => {
    const reveal = (card: boolean, range: number, seconds: number) => {
      const w = nightWorld(5);
      if (card) withCards(w, 'R05');
      hideDeer(w);
      const s = w.state;
      s.fuel = 75;
      s.t = 22 - DT;
      tick(w, atFire(w));
      const c = s.caches[0];
      expect(c.status).toBe('open');
      const post = w.forest.posts[c.post];
      // Find a spot `range` metres from the post with a clear view of it.
      let from: V2 | null = null;
      for (let a = 0; a < 360 && !from; a += 5) {
        const p = { x: post.x + Math.cos((a * Math.PI) / 180) * range, z: post.z + Math.sin((a * Math.PI) / 180) * range };
        if (hyp(p) < 34 && lineOfSight(w.forest.obstacles, p, post, 0.2)) from = p;
      }
      place(w, from!);
      tick(w, lookAt(w, post, { light: true }));
      run(w, seconds, lookAt(w, post));
      return c.revealed;
    };
    expect(reveal(false, 13, 1.1)).toBe(true);
    expect(reveal(false, 13, 0.6)).toBe(false);
    expect(reveal(false, 18, 2)).toBe(false);
    expect(reveal(true, 18, 0.55)).toBe(true);
    expect(reveal(true, 18, 0.4)).toBe(false);
    expect(reveal(true, 21, 2)).toBe(false);
  });

  it('R06 Resin wrap: the torch burns 27 s', () => {
    const w = withCards(dayWorld(5), 'R06');
    const pl = w.state.player;
    pl.logs = 1;
    tick(w, { torch: true });
    run(w, 26.8, emptyInput());
    expect(pl.torch).toBeGreaterThan(0);
    run(w, 0.3, emptyInput());
    expect(pl.torch).toBe(0);
  });

  it('R07 Soft soles: steps are heard at 3 m, sprinting at 6 m', () => {
    const heard = (card: boolean, range: number, sprint: boolean) => {
      const w = nightWorld(11);
      if (card) withCards(w, 'R07');
      const s = w.state;
      s.t = 10;
      const snag = w.forest.snags[0];
      const u = { x: snag.x / hyp(snag), z: snag.z / hyp(snag) };
      place(w, add(snag, u, -1.2));
      setDeer(w, 'stunned', add(s.player, u, range), { stunLeft: 99 });
      tick(w, { yaw: yawTo(u.x, u.z), mx: 1, sprint });
      return s.deer.lastKnown !== null;
    };
    expect(heard(false, 4.5, false)).toBe(true);
    expect(heard(true, 4.5, false)).toBe(false);
    expect(heard(true, 2.6, false)).toBe(true);
    expect(heard(false, 10.5, true)).toBe(true);
    expect(heard(true, 10.5, true)).toBe(false);
    expect(heard(true, 5.5, true)).toBe(true);
  });

  describe('E01 Ember under the ash', () => {
    it('once per night, the first fall to 24 F gives +14 before the brightness check', () => {
      const w = withCards(nightWorld(5), 'E01');
      hideDeer(w);
      const s = w.state;
      const i = atFire(w);
      s.fuel = 24.03;
      const ev = run(w, 0.2, i);
      expect(count(ev, 'ember')).toBe(1);
      expect(has(ev, 'fireWeak')).toBe(false);
      expect(s.bright).toBe(true);
      expect(s.fuel).toBeGreaterThan(37.8);
      expect(s.fuel).toBeLessThan(38.1);
      expect(w.playerProtected).toBe(true);

      // Second fall in the same night: nothing.
      s.fuel = 24.03;
      const ev2 = run(w, 0.2, i);
      expect(has(ev2, 'ember')).toBe(false);
      expect(count(ev2, 'fireWeak')).toBe(1);
      expect(s.bright).toBe(false);
      expect(s.fuel).toBeLessThan(24);
    });

    it('is armed again the next night and does not fire by day', () => {
      const w = withCards(dayWorld(5), 'E01');
      const s = w.state;
      s.fuel = 24.01;
      const day = run(w, 0.3, atFire(w));
      expect(has(day, 'ember')).toBe(false);
      expect(s.bright).toBe(false);
      for (let night = 1; night <= 2; night++) {
        if (s.phase === 'draft') {
          skipCard(w);
          w.beginDay();
        }
        skipPhase(w); // → night
        hideDeer(w);
        s.fuel = 24.03;
        s.bright = true;
        expect(count(run(w, 0.2, atFire(w)), 'ember')).toBe(1);
        skipPhase(w); // → dawn
      }
    });

    it('does nothing without the card', () => {
      const w = nightWorld(5);
      hideDeer(w);
      w.state.fuel = 24.03;
      const ev = run(w, 0.2, atFire(w));
      expect(has(ev, 'ember')).toBe(false);
      expect(w.state.bright).toBe(false);
    });
  });

  describe('E02 Self-setting trap', () => {
    const dusk = (seed: number, cards: string[], preset: { x: number; z: number }[] = []) => {
      const w = withCards(dayWorld(seed), ...cards);
      w.state.traps = preset.map((p, k) => ({ id: 100 + k, x: p.x, z: p.z, arm: 0 }));
      const ev = skipPhase(w);
      return { w, ev };
    };

    it('at dusk sets one free trap on the nearest free trail mark 9–12 m from the fire', () => {
      for (const seed of [1, 2, 3, 5, 8]) {
        const { w, ev } = dusk(seed, ['E02']);
        const s = w.state;
        expect(s.phase).toBe('night');
        expect(s.traps.length).toBe(1);
        expect(count(ev, 'trapPlaced')).toBe(1);
        const t = s.traps[0];
        expect(hyp(t)).toBeGreaterThanOrEqual(9);
        expect(hyp(t)).toBeLessThanOrEqual(12);
        const marks = w.forest.trailMarks.filter((m) => w.forest.nav.walkable(m));
        expect(Math.min(...marks.map(hyp))).toBeCloseTo(hyp(t), 9);
        expect(s.player.scrap).toBe(0);
        expect(s.player.traps).toBe(0);
      }
    });

    it('respects the limit of two placed traps and skips an occupied mark', () => {
      const first = dusk(5, ['E02']).w.state.traps[0];
      // One trap already on that very mark: the next free mark is used.
      const { w } = dusk(5, ['E02'], [{ x: first.x, z: first.z }]);
      expect(w.state.traps.length).toBe(2);
      expect(d2(w.state.traps[1], first)).toBeGreaterThan(1.5);
      expect(hyp(w.state.traps[1])).toBeGreaterThanOrEqual(9);
      expect(hyp(w.state.traps[1])).toBeLessThanOrEqual(12);
      // Two on the ground: nothing is added.
      const full = dusk(5, ['E02'], [
        { x: 20, z: 0 },
        { x: -20, z: 0 },
      ]);
      expect(full.w.state.traps.length).toBe(2);
      expect(count(full.ev, 'trapPlaced')).toBe(0);
    });

    it('does nothing without the card', () => {
      expect(dusk(5, []).w.state.traps.length).toBe(0);
    });
  });

  describe('E03 Step dynamo', () => {
    it('by day: +1 battery per 4 m actually walked, at most +25 a day, reset at dawn', () => {
      const w = withCards(dayWorld(5), 'E03');
      const pl = w.state.player;
      const lane = findLane(w, 9, 0.6);
      place(w, lane.a);
      pl.battery = 50;
      run(w, 2, { ...emptyInput(), yaw: lane.yaw, mz: 1 }); // 8 m
      expect(pl.battery).toBe(52);
      // Pushing against a trunk does not count as movement.
      const tree = w.forest.obstacles.find((o) => o.kind === 'tree' && hyp(o) < 28)!;
      const k = (hyp(tree) - (tree.r + 0.36)) / hyp(tree);
      place(w, { x: tree.x * k, z: tree.z * k });
      run(w, 0.1, lookAt(w, tree, { mz: 1 }));
      const pinned = { x: pl.x, z: pl.z };
      run(w, 3, lookAt(w, tree, { mz: 1 }));
      expect(d2(pl, pinned)).toBeLessThan(0.05);
      expect(pl.battery).toBe(52);

      // Daily cap.
      pl.dynamoDay = 24;
      place(w, lane.a);
      run(w, 2, { ...emptyInput(), yaw: lane.yaw, mz: 1 });
      expect(pl.battery).toBe(53);
      expect(pl.dynamoDay).toBe(25);

      // Not at night; a new allowance after dawn.
      skipPhase(w);
      hideDeer(w);
      place(w, lane.a);
      const b = pl.battery;
      pl.dynamoDay = 0;
      run(w, 2, { ...emptyInput(), yaw: lane.yaw, mz: 1 });
      expect(pl.battery).toBe(b);
      pl.dynamoDay = 25;
      skipPhase(w);
      expect(pl.dynamoDay).toBe(0);
    });

    it('does nothing without the card', () => {
      const w = dayWorld(5);
      const lane = findLane(w, 9, 0.6);
      place(w, lane.a);
      w.state.player.battery = 50;
      run(w, 2, { ...emptyInput(), yaw: lane.yaw, mz: 1 });
      expect(w.state.player.battery).toBe(50);
    });
  });

  it('E04 Magnesium star: flare radius 6 m, stun 2.5 s', () => {
    const fire = (card: boolean, off: number) => {
      const w = nightWorld(5);
      if (card) withCards(w, 'E04');
      const s = w.state;
      s.t = 10;
      s.fuel = 75;
      const lane = findLane(w, 16, 1.2, 12, 32);
      place(w, lane.a);
      setDeer(w, 'stalk', add(lane.a, lane.dir, 8 + off), { orbitTimer: 99 });
      const look = { ...emptyInput(), yaw: lane.yaw };
      const ev = tick(w, { ...look, pitch: -Math.atan(RULES.world.eyeHeight / 8), flare: true });
      const f = ev.find((e) => e.type === 'flare') as Extract<SimEvent, { type: 'flare' }>;
      const stunned = f.hit ? runUntil(w, 5, () => s.deer.mode !== 'stunned', look) : 0;
      return { hit: f.hit, stunned };
    };
    expect(fire(false, 5).hit).toBe(false);
    const star = fire(true, 5);
    expect(star.hit).toBe(true);
    expect(star.stunned).toBeGreaterThan(2.45);
    expect(star.stunned).toBeLessThan(2.6);
    expect(fire(true, 6.6).hit).toBe(false);
  });

  it('removing a card by replacement removes its effect and fires nothing extra', () => {
    const w = draftWorld(5);
    const s = w.state;
    s.cards = ['R01', 'C02', 'C03', 'C04'];
    w.refreshMods();
    s.fuel = 75;
    expect(w.radius).toBeCloseTo(10.2, 9);
    s.hand = ['C05', 'C06', 'R02'];
    pickCard(w, 0);
    replaceCard(w, 0);
    expect(w.radius).toBeCloseTo(8.5, 9);
    expect(w.mods.trapStun).toBe(4);
    expect(w.drainEvents()).toEqual([]);
  });
});
