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
