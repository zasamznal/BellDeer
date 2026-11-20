// [ideas] Simulation side of the ten additions (switches and numbers: IDEAS in
// rules.ts). World and the Deer call in here at a handful of points; everything
// these rules remember lives in `state.ideas`, `state.stats.score` and the two
// lure fields of the Deer, so a save carries all of it.
//
// Rolls of a night (omen, challenge, entry point, resin pine) come from a
// stream seeded by (seed, night, purpose). It has no position to save, an old
// save needs nothing to continue, and nothing the player does shifts the rolls
// of later nights or the loot / threat / card streams.
//
// The omen and the challenge are put into the state on the dusk tick (day
// second 43), when they are announced. A world that is placed straight into a
// night therefore stays 'calm' with no challenge and no bell night.

import { type V2, dist, rayObstacles } from './forest';
import { lureDeer } from './deer';
import { Rng, hashSeed } from './rng';
import { DT, IDEAS, RULES, TICK_HZ, type ChallengeKind, type Omen } from './rules';
import type { IdeasState, Input, RunState } from './types';
import type { World } from './world';

const TAU = Math.PI * 2;
const P = IDEAS.points;

export const CHALLENGES: readonly Exclude<ChallengeKind, ''>[] = ['bothTags', 'trap', 'lateFeed', 'outside', 'cleanTag'];

export function newIdeas(): IdeasState {
  return {
    omen: 'calm',
    challenge: '',
    challengeDone: false,
    challengeFailed: false,
    nightBanked: 0,
    nightTaken: 0,
    nightHits: 0,
    nightTraps: 0,
    outsideTicks: 0,
    scoreTicks: 0,
    tracks: null,
    resinSnag: -1,
    resinScored: false,
    blowUsed: false,
    blowHold: 0,
    lureCd: 0,
    dawnFour: false,
    dawnRare: false,
  };
}

/** Give a state loaded from an older save the fields it lacks. Complete states are left untouched. */
export function adoptIdeas(s: RunState): void {
  const loose = s as unknown as { ideas?: Record<string, unknown>; stats: { score?: number }; deer: { lure?: V2 | null; lureT?: number } };
  if (!loose.ideas || typeof loose.ideas !== 'object') loose.ideas = {};
  const def = newIdeas() as unknown as Record<string, unknown>;
  for (const k in def) if (loose.ideas[k] === undefined) loose.ideas[k] = def[k];
  if (typeof loose.stats.score !== 'number') loose.stats.score = 0;
  if (loose.deer.lure === undefined) loose.deer.lure = null;
  if (typeof loose.deer.lureT !== 'number') loose.deer.lureT = 0;
}

function nightRng(seed: number, night: number, purpose: string): Rng {
  return new Rng(hashSeed(seed, `ideas/${purpose}/${night}`));
}

// ------------------------------------------------------------ rolls

/** 2 + 7. Night 1 is calm, every fifth night is a bell night, the rest roll the table. */
export function omenForNight(seed: number, night: number): Omen {
  if (night < IDEAS.omen.firstNight) return 'calm';
  if (IDEAS.bellNights && night % IDEAS.bell.every === 0) return 'bell';
  if (!IDEAS.omens) return 'calm';
  let roll = nightRng(seed, night, 'omen').next();
  for (const [omen, p] of IDEAS.omen.table) {
    roll -= p;
    if (roll < 0) return omen;
  }
  return 'calm';
}

/** 6. One of the five challenges from night 2 on. */
export function challengeForNight(seed: number, night: number): ChallengeKind {
  if (!IDEAS.challenges || night < IDEAS.challenge.firstNight) return '';
  return nightRng(seed, night, 'challenge').pick(CHALLENGES);
}

/** 3. A walkable spot 17–21 m out with nothing on it, preferably beside a tree that can carry the gash. */
function rollTracks(w: World): IdeasState['tracks'] {
  const s = w.state;
  const f = w.forest;
  const T = IDEAS.tracksRule;
  const rng = nightRng(s.seed, s.night, 'tracks');
  const nodes: V2[] = [...f.snags, ...f.scrap, ...f.bushes, ...f.posts, f.whiteSnag, f.boulder];
  let first: IdeasState['tracks'] = null;
  let open: IdeasState['tracks'] = null;
  for (let k = 0; k < 60; k++) {
    const angle = rng.range(0, TAU);
    const r = rng.range(T.minR, T.maxR);
    const p = { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
    const spot = { angle, x: p.x, z: p.z, found: false };
    first ??= spot;
    if (!f.nav.walkable(p)) continue;
    if (f.obstacles.some((o) => dist(o, p) < o.r + 1.1)) continue;
    if (nodes.some((n) => dist(n, p) < 3.2)) continue;
    open ??= spot;
    if (f.trees.some((t) => dist(t, p) < 4.5)) return spot;
  }
  return open ?? first;
}

/** 4. One intact dead pine holds three logs today; the far ones (3–5) come first. */
function rollResin(w: World): void {
  const s = w.state;
  const I = s.ideas;
  // Yesterday's resin pine is an ordinary one again.
  for (let i = 0; i < s.snagLogs.length; i++) if (s.snagLogs[i] > 2) s.snagLogs[i] = 2;
  I.resinSnag = -1;
  I.resinScored = false;
  if (!IDEAS.resinPine) return;
  const intact: number[] = [];
  s.snagLogs.forEach((v, i) => {
    if (v >= 2) intact.push(i);
  });
  const far = intact.filter((i) => i >= 3);
  const pool = far.length ? far : intact;
  if (!pool.length) return;
  I.resinSnag = nightRng(s.seed, s.night, 'resin').pick(pool);
  s.snagLogs[I.resinSnag] = IDEAS.resin.logs;
}

// ------------------------------------------------------------ phases

/** Start of a day (run start and World.beginDay): tonight's entry point and today's resin pine. */
export function beginDayIdeas(w: World): void {
  const I = w.state.ideas;
  I.omen = 'calm';
  I.challenge = '';
  I.challengeDone = false;
  I.challengeFailed = false;
  I.dawnFour = false;
  I.dawnRare = false;
  resetNight(I);
  I.tracks = IDEAS.tracks ? rollTracks(w) : null;
  rollResin(w);
}

function resetNight(I: IdeasState): void {
  I.nightBanked = 0;
  I.nightTaken = 0;
  I.nightHits = 0;
  I.nightTraps = 0;
  I.outsideTicks = 0;
  I.blowUsed = false;
  I.blowHold = 0;
  I.lureCd = 0;
}

/** Day second 43: tonight's omen and challenge are fixed and announced. */
export function duskIdeas(w: World): void {
  const s = w.state;
  const I = s.ideas;
  I.omen = omenForNight(s.seed, s.night);
  I.challenge = challengeForNight(s.seed, s.night);
  I.challengeDone = false;
  I.challengeFailed = false;
}

export function beginNightIdeas(w: World): void {
  resetNight(w.state.ideas);
}

/** 3. Direction the Deer comes from tonight; null keeps the old rule (opposite the player). */
export function entryAngle(w: World): number | null {
  const tr = w.state.ideas.tracks;
  return IDEAS.tracks && tr ? tr.angle : null;
}

/** 7. A bell night opens a cache on each of the three posts. */
export function nightCacheTimes(w: World): readonly number[] {
  return w.state.ideas.omen === 'bell' ? IDEAS.bell.cacheTimes : RULES.cache.times;
}

/** Dawn, before the hand is dealt: night and challenge points, and the rewards of the draft. */
export function dawnIdeas(w: World): void {
  const I = w.state.ideas;
  addScore(w, P.night, 'night');
  const won = challengeWon(I);
  if (won) addScore(w, P.challenge, 'challenge');
  I.dawnFour = won;
  I.dawnRare = I.omen === 'bell' && I.nightBanked >= 1;
}

export function challengeWon(I: IdeasState): boolean {
  return I.challenge !== '' && I.challengeDone && !I.challengeFailed;
}

// ------------------------------------------------------------ per tick

function addScore(w: World, n: number, why: string): void {
  if (!IDEAS.score || n <= 0) return;
  w.state.stats.score += n;
  w.emit({ type: 'score', n, why });
}
function done(w: World): void {
  const I = w.state.ideas;
  if (I.challengeDone || I.challengeFailed) return;
  I.challengeDone = true;
  w.emit({ type: 'challengeDone', kind: I.challenge });
}
function fail(w: World): void {
  const I = w.state.ideas;
  if (I.challengeFailed) return;
  I.challengeFailed = true;
  w.emit({ type: 'challengeFailed', kind: I.challenge });
}

/**
 * End of World.step. Reads the events this tick produced (from `mark` on), so
 * score and challenges follow exactly what the rest of the game was told.
 */
export function afterStepIdeas(w: World, mark: number): void {
  const s = w.state;
  const I = s.ideas;
  const C = IDEAS.challenge;
  const night = s.phase === 'night' || s.phase === 'deathOffer'; // the tick of a fatal hit still counts
  for (let k = mark; k < w.events.length; k++) {
    const e = w.events[k];
    switch (e.type) {
      case 'feed':
        if (night && I.challenge === 'lateFeed' && !I.challengeDone && s.t < C.lateFeedSecond) fail(w);
        break;
      case 'hit':
        I.nightHits++;
        if (I.challenge === 'cleanTag' || (I.challenge === 'outside' && !I.challengeDone)) fail(w);
        break;
      case 'trapSnap':
        I.nightTraps++;
        addScore(w, P.trap, 'trap');
        if (I.challenge === 'trap') done(w);
        break;
      case 'tagsBanked':
        addScore(w, P.tag * e.n, 'tag');
        if (night) {
          I.nightBanked += e.n;
          if (I.challenge === 'bothTags' && I.nightBanked >= 2) done(w);
        }
        break;
      case 'cacheClaim':
        I.nightTaken++;
        if (I.challenge === 'cleanTag') done(w);
        break;
      case 'deerMiss':
        if (e.dist < IDEAS.nearMiss) addScore(w, P.dodge, 'dodge');
        break;
      case 'chopDone':
        if (e.node === I.resinSnag && !I.resinScored && e.logs > 0) {
          I.resinScored = true;
          addScore(w, P.resin, 'resin');
        }
        break;
    }
  }

  if (s.phase === 'night') {
    I.lureCd = Math.max(0, I.lureCd - DT);
    if (!w.playerProtected) {
      I.outsideTicks++;
      if (IDEAS.score) {
        I.scoreTicks++;
        if (I.scoreTicks >= TICK_HZ) {
          I.scoreTicks -= TICK_HZ;
          s.stats.score += P.outsideSecond; // no event: this one ticks every second
        }
      }
      if (I.challenge === 'outside' && I.outsideTicks >= C.outsideSeconds * TICK_HZ) done(w);
    }
    if (I.challenge === 'lateFeed' && s.t >= C.lateFeedSecond) done(w);
  } else if (s.phase === 'day') {
    // 3. Reading the tracks: within 3 m, once a day.
    const tr = I.tracks;
    if (IDEAS.tracks && tr && !tr.found && dist(s.player, tr) <= IDEAS.tracksRule.findRadius) {
      tr.found = true;
      addScore(w, P.tracks, 'tracks');
      w.emit({ type: 'tracksFound', x: tr.x, z: tr.z });
    }
  }
}

// ------------------------------------------------------------ 5. tin lure

/** Where a throw along the aim ray lands: the same ray rules as the flare in World.stepPlayer. */
function aimPoint(w: World, range: number): V2 {
  const s = w.state;
  const pl = s.player;
  const fw = { x: -Math.sin(pl.yaw), z: -Math.cos(pl.yaw) };
  const cp = Math.cos(pl.pitch);
  let reach = range;
  if (pl.pitch < -0.02) reach = Math.min(reach, RULES.world.eyeHeight / Math.tan(-pl.pitch));
  const wall = rayObstacles(w.forest.obstacles, pl, fw, reach / Math.max(cp, 0.2));
  if (wall < reach) reach = Math.max(0.5, wall - 0.3); // it drops at the foot of the trunk
  const dd = s.deer;
  if (dd.mode !== 'hidden') {
    const t = (dd.x - pl.x) * fw.x + (dd.z - pl.z) * fw.z;
    const off = Math.hypot(pl.x + fw.x * t - dd.x, pl.z + fw.z * t - dd.z);
    if (t > 0 && t < reach && off < 0.7) reach = Math.max(0.5, t - 0.6);
  }
  const at = { x: pl.x + fw.x * reach, z: pl.z + fw.z * reach };
  const r = Math.hypot(at.x, at.z);
  const max = RULES.world.radius - 1;
  if (r > max) {
    at.x *= max / r;
    at.z *= max / r;
  }
  return at;
}

/** R: one scrap, one tin, at most every 3 s. Only at night — by day there is nobody to fool. */
export function throwLure(w: World): void {
  const s = w.state;
  const pl = s.player;
  const I = s.ideas;
  const L = IDEAS.lureRule;
  if (!IDEAS.lure || pl.bench) return;
  if (s.phase !== 'night') {
    w.emit({ type: 'denied', why: 'lureDay' });
    return;
  }
  if (I.lureCd > 0) return;
  if (pl.scrap < L.cost) {
    w.emit({ type: 'denied', why: 'lureScrap' });
    return;
  }
  pl.scrap -= L.cost;
  I.lureCd = L.cooldown;
  const at = aimPoint(w, L.range);
  w.emit({ type: 'lure', x: at.x, z: at.z, pulled: lureDeer(w, at) });
}

// ------------------------------------------------------------ 8. blow on the embers

/** Weak but living fire, an empty pack, once a night. */
export function canBlow(w: World): boolean {
  const s = w.state;
  return IDEAS.emberBlow && s.phase === 'night' && !s.bright && s.fuel > 0 && s.player.logs === 0 && !s.ideas.blowUsed;
}

/** The fire prompt turns into "blow on the embers" (called at the end of World.updateFocus). */
export function blowFocus(w: World): void {
  const f = w.focus;
  if (f && f.kind === 'fire' && canBlow(w)) {
    f.info = 'blow';
    f.usable = true;
  }
}

/** E held on the embers for 1.5 s. Returns the fuel to add this tick. */
export function stepBlow(w: World, input: Input): number {
  const I = w.state.ideas;
  const f = w.focus;
  if (input.blow && f && f.kind === 'fire' && f.info === 'blow' && !w.state.player.bench) {
    I.blowHold += DT;
    if (I.blowHold >= IDEAS.blow.holdSeconds) {
      I.blowHold = 0;
      I.blowUsed = true;
      const gain = Math.min(IDEAS.blow.fuel, RULES.fire.max - w.state.fuel);
      w.emit({ type: 'blow', gain });
      return gain;
    }
  } else I.blowHold = 0;
  return 0;
}
