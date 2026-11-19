import type { V2 } from './forest';

export type Phase = 'day' | 'night' | 'draft' | 'deathOffer' | 'end' | 'victory';

export type DeerMode =
  | 'hidden'
  | 'patrol'
  | 'stalk'
  | 'feint' // false provocation: one chime, hoof scrape, always safe
  | 'cue' // real provocation: shoulders down, two heavy strikes
  | 'hunt'
  | 'lunge' // stage 6 second lunge dash
  | 'swing'
  | 'recover'
  | 'stunned'
  | 'retreat';

export type Maneuver = 'none' | 'trapSense' | 'decoyChime' | 'straightCharge' | 'secondLunge';

export interface DeerState {
  mode: DeerMode;
  x: number;
  z: number;
  heading: number; // radians, direction of travel/facing: (cos, sin) in x/z
  threat: number;
  timer: number; // seconds spent in the current mode
  appear: number; // 0..1 fade from the fog
  orbitDir: number;
  orbitTimer: number;
  patrolAngle: number;
  lastKnown: V2 | null;
  lostT: number;
  swingDirX: number;
  swingDirZ: number;
  sinceSwing: number;
  stunLeft: number;
  secondCue: boolean;
  maneuver: Maneuver;
  maneuverUsed: boolean;
  sinceManeuver: number;
  chargeX: number;
  chargeZ: number;
  chargeLeft: number;
  detour: V2 | null;
  path: V2[];
  repath: number;
  goalX: number;
  goalZ: number;
  nearMiss: number; // closest missed swing distance this run (for the result card)
}

export interface TrapState {
  id: number;
  x: number;
  z: number;
  arm: number; // seconds until armed (≤0 = armed)
}

export interface CacheState {
  post: number;
  openAt: number;
  reward: 'scrap' | 'flare';
  reveal: number;
  revealed: boolean;
  status: 'pending' | 'open' | 'claimed' | 'closed';
}

export interface PlayerState {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
  hp: number;
  stamina: number;
  exhausted: boolean;
  sinceSprint: number;
  sprinting: boolean;
  battery: number;
  lightOn: boolean;
  torch: number; // seconds left
  invuln: number;
  shield: number; // revive protection seconds
  pulseCd: number;
  logs: number;
  scrap: number;
  berries: number;
  traps: number;
  flares: number;
  tags: number; // carried, not yet banked
  chop: number; // progress seconds
  chopNode: number;
  pick: number;
  pickKind: '' | 'scrap' | 'bush';
  pickNode: number;
  eat: number;
  trapHold: number;
  bench: boolean;
  craft: 0 | 1 | 2 | 3;
  craftT: number;
  dynamoDist: number;
  dynamoDay: number;
  noise: number; // radius of the sound made this tick
}

export interface RunStats {
  nightsSurvived: number;
  tagsBanked: number;
  cachesClaimed: number;
  hunts: number;
  logsChopped: number;
  feeds: number;
  activeSeconds: number;
  seals: number[]; // chapter numbers with a banked seal
}

export interface RunState {
  runId: string;
  revision: number;
  seed: number;
  genVersion: number;
  contentVersion: number;
  phase: Phase;
  night: number; // upcoming (day) or current (night) night number, 1..99
  t: number; // seconds into the phase
  tick: number;
  dayStarted: boolean;
  player: PlayerState;
  fuel: number;
  bright: boolean;
  emberUsed: boolean;
  deer: DeerState;
  snagLogs: number[];
  scrapLeft: number[];
  berryLeft: number[];
  traps: TrapState[];
  nextTrapId: number;
  caches: CacheState[];
  cards: string[];
  hand: string[] | null;
  pendingCard: string | null; // passive picked while all four slots are full
  lastTag: string | null;
  supplyRest: string[]; // supply cards skipping the next dawn
  rerollChapter: number; // chapter in which the reroll was used (0 = never)
  reviveUsed: boolean;
  deathReason: string;
  fedOnce: boolean;
  choppedOnce: boolean;
  stats: RunStats;
  rng: { loot: number; threat: number; cards: number };
}

export interface Input {
  mx: number; // strafe, −1..1
  mz: number; // forward, −1..1
  sprint: boolean;
  yaw: number;
  pitch: number;
  chop: boolean; // LMB held
  trapHold: boolean; // Q held
  interact: boolean; // edge
  eat: boolean;
  light: boolean;
  pulse: boolean;
  torch: boolean;
  flare: boolean;
  craft: 0 | 1 | 2 | 3;
}

export const emptyInput = (): Input => ({
  mx: 0,
  mz: 0,
  sprint: false,
  yaw: 0,
  pitch: 0,
  chop: false,
  trapHold: false,
  interact: false,
  eat: false,
  light: false,
  pulse: false,
  torch: false,
  flare: false,
  craft: 0,
});

export type FocusKind = 'snag' | 'fire' | 'scrap' | 'bush' | 'cache' | 'bench' | 'post';
export interface Focus {
  kind: FocusKind;
  id: number;
  x: number;
  z: number;
  /** HUD hint: e.g. fuel gain for the fire, 'full' when nothing fits. */
  info: string;
  usable: boolean;
}

export type SimEvent =
  | { type: 'chopHit'; node: number }
  | { type: 'chopDone'; node: number; logs: number }
  | { type: 'feed'; gain: number; relit: boolean }
  | { type: 'pickup'; kind: 'scrap' | 'berry'; n: number }
  | { type: 'eat' }
  | { type: 'light'; on: boolean }
  | { type: 'torch' }
  | { type: 'trapPlaced'; x: number; z: number }
  | { type: 'trapSnap'; x: number; z: number }
  | { type: 'flare'; x: number; z: number; hit: boolean }
  | { type: 'pulse'; hit: boolean }
  | { type: 'craft'; recipe: number }
  | { type: 'bench'; open: boolean }
  | { type: 'cacheCue'; post: number }
  | { type: 'cacheOpen'; post: number }
  | { type: 'cacheRevealed'; post: number }
  | { type: 'cacheClaim'; post: number; reward: string }
  | { type: 'cacheClosed'; post: number }
  | { type: 'tagsBanked'; n: number; seal: number }
  | { type: 'fireWeak' }
  | { type: 'fireBright' }
  | { type: 'ember' }
  | { type: 'nightStart'; n: number }
  | { type: 'dusk' }
  | { type: 'duskStep'; x: number; z: number }
  | { type: 'dawn'; n: number }
  | { type: 'dayStart'; n: number }
  | { type: 'deerChime'; x: number; z: number; decoy: boolean }
  | { type: 'deerCue'; x: number; z: number; second: boolean }
  | { type: 'deerStrike'; x: number; z: number }
  | { type: 'deerHunt' }
  | { type: 'deerSwing'; x: number; z: number }
  | { type: 'deerMiss'; dist: number }
  | { type: 'deerStunned'; by: string }
  | { type: 'deerRetreat' }
  | { type: 'deerStep'; x: number; z: number; run: boolean }
  | { type: 'hit'; hp: number }
  | { type: 'death' }
  | { type: 'revived' }
  | { type: 'victory' }
  | { type: 'denied'; why: string }
  | { type: 'save' };
