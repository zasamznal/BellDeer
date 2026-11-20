// Balance data for the prototype. Numbers come straight from the GDD tables
// (99-nights-by-the-fire-gdd.md, sections 2–5) and are the single source for
// the simulation, the HUD and the tests.

export const TICK_HZ = 30;
export const DT = 1 / TICK_HZ;
export const CONTENT_VERSION = 1;
export const GEN_VERSION = 1;

export const RULES = {
  cycle: { daySeconds: 60, nightSeconds: 90, lastNight: 99 },
  world: { radius: 36, eyeHeight: 1.65, playerRadius: 0.35 },
  player: {
    walk: 4,
    sprint: 6.2,
    sprintCost: 16,
    staminaMax: 100,
    staminaRegen: 12,
    staminaRegenDelay: 1,
    staminaUnlock: 20,
    hpMax: 100,
    reach: 2,
    chopSeconds: 2,
    pickupSeconds: 0.4,
    eatSeconds: 0.5,
    berryHp: 18,
    berryStamina: 25,
    invulnSeconds: 1.2,
  },
  limits: { logs: 6, scrap: 8, berries: 3, traps: 2, flares: 2, placedTraps: 2 },
  fire: {
    start: 42,
    max: 75,
    burnDay: 0.15,
    burnNightBase: 0.64,
    burnNightPerNight: 0.003,
    fuelPerLog: 20,
    weakAt: 24,
    brightAt: 30,
    radiusBase: 2.5,
    radiusPerFuel: 0.08,
    bankRadius: 2,
  },
  flashlight: { max: 100, drain: 1.25, range: 14, coneDeg: 36, dawnCharge: 35, revealSeconds: 1 },
  torch: { seconds: 18, light: 7 },
  trap: { cost: 2, craftSeconds: 1, placeSeconds: 0.8, placeRange: 2.5, armSeconds: 0.7, radius: 0.8, stun: 3 },
  flare: { cost: 2, craftSeconds: 1, range: 18, radius: 4, stun: 2 },
  recharge: { cost: 1, amount: 40, seconds: 1.5 },
  pulse: { cost: 20, stun: 1.3, cooldown: 20 },
  bench: { leave: 2.5 },
  cache: { times: [22, 58], openSeconds: 12, cueLead: 1 },
  deer: {
    appearSeconds: 4,
    threatBase: 8,
    threatPerNight: 0.04,
    threatDecay: 20,
    threatTrigger: 32,
    sight: 22,
    hearStep: 6,
    hearRun: 12,
    hearChop: 16,
    cueSeconds: 1.2,
    huntBase: 4.9,
    huntPerNight: 0.01,
    walk: 2.6,
    stalkSpeed: 3.2,
    swingRange: 2,
    swingSeconds: 0.65,
    swingArcDeg: 70,
    swingGap: 2.4,
    damage: 40,
    lostSeconds: 4,
    retreatSeconds: 3,
    patrolSeconds: 4,
    ringMin: 18,
    ringMax: 26,
    stalkMin: 2,
    stalkMax: 5,
    radius: 0.55,
    chargeSpeed: 8,
    chargeSeconds: 0.8,
    recoverSeconds: 3,
    maneuverGap: 6,
  },
  revive: { scrap: 4, hp: 50, fuel: 42, shield: 4 },
  reroll: { scrap: 2 },
  draft: { weights: { common: 0.6, rare: 0.3, epic: 0.1 }, slots: 4 },
} as const;

export type Tag = 'fire' | 'beam' | 'run' | 'traps' | 'supply';
export type Rarity = 'common' | 'rare' | 'epic';

export interface CardDef {
  id: string;
  rarity: Rarity;
  tag: Tag;
  kind: 'passive' | 'supply';
  /** Stat line for the card face: label key + before → after. */
  stat: string;
  from: string;
  to: string;
}

// Effects are interpreted in mods.ts by card id; the card face is rendered from this table.
export const CARDS: CardDef[] = [
  { id: 'C01', rarity: 'common', tag: 'fire', kind: 'passive', stat: 'fuel', from: '20', to: '24' },
  { id: 'C02', rarity: 'common', tag: 'fire', kind: 'passive', stat: 'chop', from: '2 s', to: '1.5 s' },
  { id: 'C03', rarity: 'common', tag: 'beam', kind: 'passive', stat: 'beamDrain', from: '1.25', to: '1' },
  { id: 'C04', rarity: 'common', tag: 'run', kind: 'passive', stat: 'sprintCost', from: '16', to: '12' },
  { id: 'C05', rarity: 'common', tag: 'traps', kind: 'passive', stat: 'trapStun', from: '3 s', to: '4 s' },
  { id: 'C06', rarity: 'common', tag: 'run', kind: 'passive', stat: 'berry', from: '18 / 25', to: '28 / 35' },
  { id: 'C07', rarity: 'common', tag: 'supply', kind: 'supply', stat: 'logsNow', from: '', to: '+2' },
  { id: 'C08', rarity: 'common', tag: 'supply', kind: 'supply', stat: 'scrapNow', from: '', to: '+2' },
  { id: 'R01', rarity: 'rare', tag: 'fire', kind: 'passive', stat: 'radius', from: '8.5 m', to: '10.2 m' },
  { id: 'R02', rarity: 'rare', tag: 'traps', kind: 'passive', stat: 'trapCost', from: '2', to: '1' },
  { id: 'R03', rarity: 'rare', tag: 'beam', kind: 'passive', stat: 'pulse', from: '', to: '1.3 s' },
  { id: 'R04', rarity: 'rare', tag: 'run', kind: 'passive', stat: 'sprint', from: '6.2', to: '7 m/s' },
  { id: 'R05', rarity: 'rare', tag: 'beam', kind: 'passive', stat: 'beamRange', from: '14 m', to: '20 m' },
  { id: 'R06', rarity: 'rare', tag: 'fire', kind: 'passive', stat: 'torch', from: '18 s', to: '27 s' },
  { id: 'R07', rarity: 'rare', tag: 'run', kind: 'passive', stat: 'noise', from: '6 / 12 m', to: '3 / 6 m' },
  { id: 'E01', rarity: 'epic', tag: 'fire', kind: 'passive', stat: 'ember', from: '', to: '+14' },
  { id: 'E02', rarity: 'epic', tag: 'traps', kind: 'passive', stat: 'autoTrap', from: '', to: '+1' },
  { id: 'E03', rarity: 'epic', tag: 'beam', kind: 'passive', stat: 'dynamo', from: '', to: '+25' },
  { id: 'E04', rarity: 'epic', tag: 'traps', kind: 'passive', stat: 'flare', from: '4 m · 2 s', to: '6 m · 2.5 s' },
];

export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

export interface StageDef {
  index: number;
  firstNight: number;
  lastNight: number;
  ability: 'direct' | 'feintHop' | 'trapSense' | 'decoyChime' | 'straightCharge' | 'secondLunge';
}

export const STAGES: StageDef[] = [
  { index: 0, firstNight: 1, lastNight: 9, ability: 'direct' },
  { index: 1, firstNight: 10, lastNight: 19, ability: 'feintHop' },
  { index: 2, firstNight: 20, lastNight: 29, ability: 'trapSense' },
  { index: 3, firstNight: 30, lastNight: 49, ability: 'decoyChime' },
  { index: 4, firstNight: 50, lastNight: 74, ability: 'straightCharge' },
  { index: 5, firstNight: 75, lastNight: 99, ability: 'secondLunge' },
];

export function stageForNight(n: number): number {
  for (let i = STAGES.length - 1; i >= 0; i--) if (n >= STAGES[i].firstNight) return i;
  return 0;
}

export function burnRate(phase: 'day' | 'night', n: number): number {
  return phase === 'day' ? RULES.fire.burnDay : RULES.fire.burnNightBase + RULES.fire.burnNightPerNight * (n - 1);
}

export function fireRadius(fuel: number, radiusMultiplier: number): number {
  if (fuel <= 0) return 0;
  return (RULES.fire.radiusBase + RULES.fire.radiusPerFuel * fuel) * radiusMultiplier;
}

export function threatRate(n: number): number {
  return RULES.deer.threatBase + RULES.deer.threatPerNight * (n - 1);
}

export function huntSpeed(n: number): number {
  return RULES.deer.huntBase + RULES.deer.huntPerNight * (n - 1);
}

// ---------------------------------------------------------------- IDEAS
// Ten owner-approved additions on top of the GDD rules. Every feature sits
// behind its own switch (the first ten fields); the numbers below them are the
// tuning of those features. The logic lives in src/sim/ideas.ts (simulation)
// and src/ui/ideasUi.ts / src/render/ideasView.ts (presentation).

export type Omen = 'calm' | 'fog' | 'wind' | 'moon' | 'still' | 'bell';
export type ChallengeKind = '' | 'bothTags' | 'trap' | 'lateFeed' | 'outside' | 'cleanTag';

export interface IdeasRules {
  /** 1. Heartbeat and edge pulse driven by the hidden threat meter (presentation only). */
  threatPulse: boolean;
  /** 2. One omen per night from night 2 on. */
  omens: boolean;
  /** 3. The Deer's entry point is decided by day and marked with tracks. */
  tracks: boolean;
  /** 4. One dead pine a day holds three logs. */
  resinPine: boolean;
  /** 5. R throws a tin that pulls a Deer that is not on the player. */
  lure: boolean;
  /** 6. One optional challenge per night; reward: a four-card dawn hand. */
  challenges: boolean;
  /** 7. Every fifth night is a bell night. */
  bellNights: boolean;
  /** 8. Hold E at a weak fire with no logs: +8 fuel once a night. */
  emberBlow: boolean;
  /** 9. Run score ("Heat"). */
  score: boolean;
  /** 10. Slow motion after a near miss (app shell only). */
  slowMo: boolean;

  omen: {
    firstNight: number;
    /** Roll table for ordinary nights, in order; the weights add up to 1. */
    table: readonly (readonly [Omen, number])[];
    fogSight: number;
    moonSight: number;
    fogViewFar: number;
    moonViewFar: number;
    windBurn: number;
    windNoise: number;
    stillBurn: number;
    stillNoise: number;
  };
  bell: { every: number; cacheTimes: readonly number[]; threatMult: number; huntBonus: number };
  tracksRule: { minR: number; maxR: number; findRadius: number; spawnJitter: number };
  resin: { logs: number };
  lureRule: { cost: number; range: number; cooldown: number; pullRadius: number; speedMult: number; lookSeconds: number; giveUpSeconds: number };
  challenge: { firstNight: number; lateFeedSecond: number; outsideSeconds: number; handSize: number };
  blow: { holdSeconds: number; fuel: number };
  points: { outsideSecond: number; tag: number; night: number; dodge: number; trap: number; tracks: number; resin: number; challenge: number };
  nearMiss: number;
  slow: { scale: number; seconds: number; easeSeconds: number; cooldown: number };
}

export const IDEAS: IdeasRules = {
  threatPulse: true,
  omens: true,
  tracks: true,
  resinPine: true,
  lure: true,
  challenges: true,
  bellNights: true,
  emberBlow: true,
  score: true,
  slowMo: true,

  omen: {
    firstNight: 2,
    table: [
      ['calm', 0.4],
      ['fog', 0.15],
      ['wind', 0.15],
      ['moon', 0.15],
      ['still', 0.15],
    ],
    fogSight: 15,
    moonSight: 28,
    fogViewFar: 20,
    moonViewFar: 34,
    windBurn: 1.15,
    windNoise: 0.5,
    stillBurn: 0.9,
    stillNoise: 1.5,
  },
  bell: { every: 5, cacheTimes: [22, 40, 58], threatMult: 1.25, huntBonus: 0.3 },
  tracksRule: { minR: 17, maxR: 21, findRadius: 3, spawnJitter: 0.3 },
  resin: { logs: 3 },
  lureRule: { cost: 1, range: 14, cooldown: 3, pullRadius: 16, speedMult: 1.5, lookSeconds: 2, giveUpSeconds: 9 },
  challenge: { firstNight: 2, lateFeedSecond: 45, outsideSeconds: 20, handSize: 4 },
  blow: { holdSeconds: 1.5, fuel: 10 },
  points: { outsideSecond: 1, tag: 50, night: 100, dodge: 30, trap: 40, tracks: 25, resin: 20, challenge: 80 },
  nearMiss: 2.6,
  slow: { scale: 0.35, seconds: 0.6, easeSeconds: 0.3, cooldown: 4 },
};

/** What tonight's omen changes in the simulation. 'calm' (and every day) is the GDD baseline. */
export interface OmenMods {
  /** Deer sight range, m. */
  sight: number;
  /** Multiplier of the night fuel burn. */
  burn: number;
  /** Multipliers of the noise radius of steps / running and of chopping. */
  moveNoise: number;
  chopNoise: number;
  /** Multiplier of the threat growth and metres per second added to the hunt speed. */
  threat: number;
  hunt: number;
}

function buildOmenMods(omen: Omen): OmenMods {
  const o = IDEAS.omen;
  const m: OmenMods = { sight: RULES.deer.sight, burn: 1, moveNoise: 1, chopNoise: 1, threat: 1, hunt: 0 };
  if (omen === 'fog') m.sight = o.fogSight;
  else if (omen === 'moon') m.sight = o.moonSight;
  else if (omen === 'wind') {
    m.burn = o.windBurn;
    m.moveNoise = o.windNoise;
  } else if (omen === 'still') {
    m.burn = o.stillBurn;
    m.moveNoise = o.stillNoise;
    m.chopNoise = o.stillNoise;
  } else if (omen === 'bell') {
    m.threat = IDEAS.bell.threatMult;
    m.hunt = IDEAS.bell.huntBonus;
  }
  return m;
}

// The simulation asks several times a tick, so the six sets are built once.
const OMEN_MODS: Record<Omen, OmenMods> = {
  calm: buildOmenMods('calm'),
  fog: buildOmenMods('fog'),
  wind: buildOmenMods('wind'),
  moon: buildOmenMods('moon'),
  still: buildOmenMods('still'),
  bell: buildOmenMods('bell'),
};

/** Modifiers of an omen; anything unknown (an old save) counts as calm. Treat the result as read-only. */
export function omenMods(omen: Omen | undefined): OmenMods {
  return (omen && OMEN_MODS[omen]) || OMEN_MODS.calm;
}
