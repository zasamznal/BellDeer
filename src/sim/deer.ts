// EncounterDirector + DeerFSM (GDD §4).
//
//   patrol → stalk ⇄ feint (false provocation, always safe)
//                 ↘ cue (two heavy strikes, 1.2 s) → hunt → swing
//   stun (trap / flare / pulse) → retreat → patrol
//
// Stage abilities inherit downwards; one special maneuver per attack.

import { type V2, dist, lineOfSight, resolveCircle } from './forest';
import { DT, RULES, huntSpeed, threatRate } from './rules';
import type { DeerState, Maneuver } from './types';
import type { World } from './world';

const D = RULES.deer;
const TAU = Math.PI * 2;

export function newDeer(): DeerState {
  return {
    mode: 'hidden',
    x: 0,
    z: -24,
    heading: 0,
    threat: 0,
    timer: 0,
    appear: 0,
    orbitDir: 1,
    orbitTimer: 7,
    patrolAngle: 0,
    lastKnown: null,
    lostT: 0,
    swingDirX: 0,
    swingDirZ: 0,
    sinceSwing: 9,
    stunLeft: 0,
    secondCue: false,
    maneuver: 'none',
    maneuverUsed: false,
    sinceManeuver: 9,
    chargeX: 0,
    chargeZ: 0,
    chargeLeft: 0,
    detour: null,
    path: [],
    repath: 0,
    goalX: 0,
    goalZ: 0,
    nearMiss: 99,
  };
}

function setMode(w: World, mode: DeerState['mode']): void {
  const d = w.state.deer;
  d.mode = mode;
  d.timer = 0;
}

function face(d: DeerState, p: V2, rate = 1): void {
  const want = Math.atan2(p.z - d.z, p.x - d.x);
  let diff = ((want - d.heading + Math.PI) % TAU) - Math.PI;
  if (diff < -Math.PI) diff += TAU;
  d.heading += diff * Math.min(1, rate);
}

/** Sight within 22 m with a clear line, or the noise the player made this tick. */
function perceives(w: World): boolean {
  const d = w.state.deer;
  const pl = w.state.player;
  const dd = dist(d, pl);
  if (dd <= pl.noise) return true;
  return dd <= D.sight && lineOfSight(w.forest.obstacles, d, pl);
}

/** Walk toward a goal on the nav grid; the Deer brakes at the edge of bright light. */
function moveToward(w: World, goal: V2, speed: number): number {
  const d = w.state.deer;
  const nav = w.forest.nav;
  let target = goal;
  if (!nav.segmentFree(d, goal)) {
    d.repath -= DT;
    const moved = Math.hypot(goal.x - d.goalX, goal.z - d.goalZ);
    if (d.repath <= 0 || moved > 1.5 || d.path.length === 0) {
      d.path = nav.findPath(d, goal) ?? [];
      d.repath = 0.25; // at most 4 searches per second
      d.goalX = goal.x;
      d.goalZ = goal.z;
    }
    while (d.path.length > 1 && dist(d, d.path[0]) < 0.6) d.path.shift();
    if (d.path.length) target = d.path[0];
  } else d.path.length = 0;
  const dx = target.x - d.x;
  const dz = target.z - d.z;
  const len = Math.hypot(dx, dz);
  if (len < 0.05) return dist(d, goal);
  const step = Math.min(len, speed * DT);
  d.x += (dx / len) * step;
  d.z += (dz / len) * step;
  face(d, target, 0.25);
  keepOut(w);
  return dist(d, goal);
}

function keepOut(w: World): void {
  const d = w.state.deer;
  resolveCircle(w.forest.obstacles, d, D.radius * 0.8, RULES.world.radius - 1);
  if (w.state.bright) {
    const edge = w.radius + 0.4;
    const r = Math.hypot(d.x, d.z);
    if (r < edge && r > 1e-3) {
      d.x *= edge / r;
      d.z *= edge / r;
    }
  }
}

function pickManeuver(w: World): Maneuver {
  const d = w.state.deer;
  if (d.sinceManeuver < D.maneuverGap) return 'none';
  const st = w.stage;
  const pool: Maneuver[] = [];
  if (st >= 2 && w.state.traps.length) pool.push('trapSense');
  if (st >= 3) pool.push('decoyChime');
  if (st >= 4) pool.push('straightCharge');
  if (st >= 5) pool.push('secondLunge');
  return pool.length ? w.rngThreat.pick(pool) : 'none';
}

function startCue(w: World, second: boolean): void {
  const s = w.state;
  const d = s.deer;
  const pl = s.player;
  setMode(w, 'cue');
  d.secondCue = second;
  const aim = perceives(w) ? pl : (d.lastKnown ?? pl);
  face(d, aim);
  if (!second) {
    d.maneuver = pickManeuver(w);
    d.maneuverUsed = false;
    d.detour = null;
    d.lostT = 0;
    // Stage 5: the charge line is fixed when the signal starts.
    const len = dist(d, aim) || 1;
    d.chargeX = (aim.x - d.x) / len;
    d.chargeZ = (aim.z - d.z) / len;
    if (d.maneuver === 'decoyChime') {
      // A single false chime 6 m to the side; the double strike still comes from the body.
      const side = w.rngThreat.sign();
      w.emit({ type: 'deerChime', x: d.x - d.chargeZ * 6 * side, z: d.z + d.chargeX * 6 * side, decoy: true });
      d.maneuverUsed = true;
      d.sinceManeuver = 0;
    }
  }
  w.emit({ type: 'deerCue', x: d.x, z: d.z, second });
  w.emit({ type: 'deerStrike', x: d.x, z: d.z });
}

function startRetreat(w: World): void {
  const d = w.state.deer;
  setMode(w, 'retreat');
  d.threat = 0;
  d.path.length = 0;
  d.detour = null;
  d.chargeLeft = 0;
  w.emit({ type: 'deerRetreat' });
}

/** Trap, flare or pulse. Returns false when the Deer cannot be stunned right now. */
export function stunDeer(w: World, seconds: number, by: string): boolean {
  const d = w.state.deer;
  if (d.mode === 'hidden' || d.mode === 'stunned' || d.mode === 'retreat') return false;
  setMode(w, 'stunned');
  d.stunLeft = seconds;
  d.threat = 0;
  d.chargeLeft = 0;
  w.emit({ type: 'deerStunned', by });
  return true;
}

export function stepDeer(w: World): void {
  const s = w.state;
  const d = s.deer;
  const pl = s.player;
  if (d.mode === 'hidden') return;
  const n = s.night;
  const prot = w.playerProtected;
  const vulnerable = !prot;
  d.timer += DT;
  d.sinceSwing += DT;
  d.sinceManeuver += DT;
  d.appear = Math.min(1, s.t / D.appearSeconds);

  // Threat: pressure of the dark. Frozen at zero while stunned or retreating.
  if (d.mode === 'stunned' || d.mode === 'retreat') d.threat = 0;
  else if (prot) d.threat = Math.max(0, d.threat - D.threatDecay * DT);
  else d.threat = Math.min(100, d.threat + threatRate(n) * (pl.torch > 0 ? 0.5 : 1) * DT);

  const sees = perceives(w);
  if (sees) {
    d.lastKnown = { x: pl.x, z: pl.z };
    d.lostT = 0;
  } else d.lostT += DT;

  const wantsHunt = d.threat >= D.threatTrigger && vulnerable;
  const ox = d.x;
  const oz = d.z;

  switch (d.mode) {
    case 'patrol': {
      // Walk an arc on the 18–26 m ring for up to 4 s.
      d.patrolAngle += (d.orbitDir * D.walk * DT) / 22;
      moveToward(w, { x: Math.cos(d.patrolAngle) * 22, z: Math.sin(d.patrolAngle) * 22 }, D.walk);
      if (wantsHunt && s.t >= D.appearSeconds) startCue(w, false);
      else if (d.timer >= D.patrolSeconds || (sees && s.t >= D.appearSeconds)) {
        setMode(w, 'stalk');
        d.orbitTimer = w.rngThreat.range(6, 10);
      }
      break;
    }
    case 'stalk': {
      // Hold 2–5 m beyond the edge of bright light, switching sides every 6–10 s.
      const ring = Math.max(w.radius, 5.5) + 3.5;
      const ang = Math.atan2(d.z, d.x) + (d.orbitDir * 1.4) / ring;
      const r = Math.hypot(d.x, d.z);
      const goal = { x: Math.cos(ang) * ring, z: Math.sin(ang) * ring };
      moveToward(w, goal, Math.abs(r - ring) > 3 ? D.stalkSpeed * 1.5 : D.stalkSpeed);
      if (pl.noise > 0 && dist(d, pl) <= pl.noise) face(d, pl, 0.1);
      d.orbitTimer -= DT;
      if (wantsHunt) startCue(w, false);
      else if (d.orbitTimer <= 0) {
        setMode(w, 'feint');
        face(d, pl);
        w.emit({ type: 'deerChime', x: d.x, z: d.z, decoy: false });
      }
      break;
    }
    case 'feint': {
      face(d, pl, 0.2);
      // A real signal may start in the middle of a false one.
      if (wantsHunt) startCue(w, false);
      else if (d.timer >= D.cueSeconds) {
        setMode(w, 'stalk');
        d.orbitDir = -d.orbitDir;
        d.orbitTimer = w.rngThreat.range(6, 10);
      }
      break;
    }
    case 'cue': {
      if (d.maneuver !== 'straightCharge' || d.secondCue) face(d, sees ? pl : (d.lastKnown ?? pl), 0.2);
      const before = d.timer - DT;
      if (before < 0.45 && d.timer >= 0.45) w.emit({ type: 'deerStrike', x: d.x, z: d.z });
      if (prot) startRetreat(w);
      else if (d.timer >= D.cueSeconds) {
        if (d.secondCue) {
          setMode(w, 'lunge');
          const len = dist(d, pl) || 1;
          d.chargeX = (pl.x - d.x) / len;
          d.chargeZ = (pl.z - d.z) / len;
          d.chargeLeft = 0.5;
        } else {
          setMode(w, 'hunt');
          s.stats.hunts++;
          w.emit({ type: 'deerHunt' });
          if (d.maneuver === 'straightCharge') {
            d.chargeLeft = D.chargeSeconds;
            d.maneuverUsed = true;
            d.sinceManeuver = 0;
          }
        }
      }
      break;
    }
    case 'hunt': {
      if (prot) {
        startRetreat(w);
        break;
      }
      if (d.chargeLeft > 0) {
        // Stage 5: straight dash on the line fixed 1.2 s earlier; no steering.
        d.chargeLeft -= DT;
        d.x += d.chargeX * D.chargeSpeed * DT;
        d.z += d.chargeZ * D.chargeSpeed * DT;
        d.heading = Math.atan2(d.chargeZ, d.chargeX);
        keepOut(w);
      } else {
        // Stage 3: once per hunt, notice an armed trap 4 m ahead and arc around it.
        if (d.maneuver === 'trapSense' && !d.maneuverUsed) {
          for (const t of s.traps) {
            if (t.arm > 0) continue;
            const td = dist(d, t);
            if (td > 4 || td < 0.9) continue;
            const cos = ((t.x - d.x) * Math.cos(d.heading) + (t.z - d.z) * Math.sin(d.heading)) / td;
            if (cos < 0.9) continue;
            d.maneuverUsed = true;
            d.sinceManeuver = 0;
            const px = -(t.z - d.z) / td;
            const pz = (t.x - d.x) / td;
            const a = { x: t.x + px * 3, z: t.z + pz * 3 };
            const b = { x: t.x - px * 3, z: t.z - pz * 3 };
            const okA = w.forest.nav.segmentFree(d, a);
            const okB = w.forest.nav.segmentFree(d, b);
            // No free arc → the Deer walks into the trap.
            if (okA || okB) d.detour = okA && (!okB || dist(a, pl) <= dist(b, pl)) ? a : b;
            break;
          }
        }
        let goal: V2;
        if (d.detour) {
          goal = d.detour;
          if (dist(d, d.detour) < 0.9) d.detour = null;
        } else if (sees) goal = pl;
        else if (d.lastKnown) goal = d.lastKnown;
        else goal = nearestPost(w);
        const left = moveToward(w, goal, huntSpeed(n));
        if (!sees && d.lostT >= D.lostSeconds && (left < 1.2 || d.lostT >= 9)) {
          startRetreat(w);
          break;
        }
      }
      if (sees && dist(d, pl) <= D.swingRange && d.sinceSwing >= D.swingGap && d.chargeLeft <= 0) startSwing(w);
      break;
    }
    case 'lunge': {
      if (prot) {
        startRetreat(w);
        break;
      }
      d.chargeLeft -= DT;
      d.x += d.chargeX * D.chargeSpeed * DT;
      d.z += d.chargeZ * D.chargeSpeed * DT;
      d.heading = Math.atan2(d.chargeZ, d.chargeX);
      keepOut(w);
      if (d.chargeLeft <= 0 || dist(d, pl) <= 1.6) startSwing(w);
      break;
    }
    case 'swing':
      // Direction is locked; the hit itself is resolved in resolveSwing after protection is known.
      break;
    case 'recover': {
      if (d.timer >= D.recoverSeconds) setMode(w, prot ? 'retreat' : 'hunt');
      break;
    }
    case 'stunned': {
      d.stunLeft -= DT;
      if (d.stunLeft <= 0) startRetreat(w);
      break;
    }
    case 'retreat': {
      // 3 s without attacks or stuns, straight out into the fog.
      const r = Math.hypot(d.x, d.z) || 1;
      const out = { x: (d.x / r) * 24, z: (d.z / r) * 24 };
      moveToward(w, out, D.stalkSpeed * 1.4);
      if (d.timer >= D.retreatSeconds) {
        setMode(w, 'patrol');
        d.patrolAngle = Math.atan2(d.z, d.x);
        d.orbitDir = w.rngThreat.sign();
        d.lastKnown = null;
      }
      break;
    }
  }

  // Footfall cue for audio and subtitles.
  const moved = Math.hypot(d.x - ox, d.z - oz);
  if (moved > 0.01) {
    const stride = d.mode === 'hunt' || d.mode === 'lunge' ? 0.36 : 0.62;
    if (Math.floor((d.timer - DT) / stride) !== Math.floor(d.timer / stride)) w.emit({ type: 'deerStep', x: d.x, z: d.z, run: stride < 0.5 });
  }
}

function nearestPost(w: World): V2 {
  const d = w.state.deer;
  const open = w.state.caches.find((c) => c.status === 'open');
  if (open) return w.forest.posts[open.post];
  return [...w.forest.posts].sort((a, b) => dist(a, d) - dist(b, d))[0];
}

function startSwing(w: World): void {
  const d = w.state.deer;
  const pl = w.state.player;
  setMode(w, 'swing');
  const len = dist(d, pl) || 1;
  d.swingDirX = (pl.x - d.x) / len;
  d.swingDirZ = (pl.z - d.z) / len;
  d.heading = Math.atan2(d.swingDirZ, d.swingDirX);
  d.sinceSwing = 0;
  w.emit({ type: 'deerSwing', x: d.x, z: d.z });
}

/** Last step of the tick: protection cancels contact, then the swing lands or misses. */
export function resolveSwing(w: World): void {
  const s = w.state;
  const d = s.deer;
  const pl = s.player;
  if (d.mode !== 'swing') return;
  if (w.playerProtected) {
    startRetreat(w);
    return;
  }
  if (d.timer < D.swingSeconds) return;
  const dx = pl.x - d.x;
  const dz = pl.z - d.z;
  const dd = Math.hypot(dx, dz);
  const cos = dd < 0.01 ? 1 : (dx * d.swingDirX + dz * d.swingDirZ) / dd;
  const inArc = cos >= Math.cos(((D.swingArcDeg / 2) * Math.PI) / 180);
  const hit = dd <= D.swingRange + 0.1 && inArc && lineOfSight(w.forest.obstacles, d, pl);
  if (hit && pl.invuln <= 0) {
    w.damagePlayer(D.damage);
    if (s.phase !== 'night') return;
    setMode(w, d.secondCue ? 'recover' : 'hunt');
    d.secondCue = false;
    return;
  }
  d.nearMiss = Math.min(d.nearMiss, dd);
  w.emit({ type: 'deerMiss', dist: dd });
  // Stage 6: once per hunt a miss is followed by a second lunge with its own 1.2 s signal.
  if (d.secondCue) {
    d.secondCue = false;
    setMode(w, 'recover');
  } else if (d.maneuver === 'secondLunge' && !d.maneuverUsed) {
    d.maneuverUsed = true;
    d.sinceManeuver = 0;
    startCue(w, true);
  } else setMode(w, 'hunt');
}
