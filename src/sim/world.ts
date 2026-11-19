// WorldSim / LocalAuthority. One fixed 1/30 s step owns every rule: clock,
// player actions, fire, protection, the Deer and loot. Rendering, audio and
// the HUD only read `state` and the events emitted by `step`.
//
// Tick order (GDD §4): dawn transition → player movement and feeding →
// protection → trap / flash triggers → contact cancelled inside protection →
// damage of the remaining attacks.

import { type Forest, type V2, dist, generateForest, lineOfSight, rayObstacles, resolveCircle } from './forest';
import { Rng, hashSeed } from './rng';
import { CONTENT_VERSION, DT, GEN_VERSION, RULES, burnRate, fireRadius, stageForNight } from './rules';
import { type Mods, computeMods } from './mods';
import type { CacheState, Focus, Input, RunState, SimEvent } from './types';
import { newDeer, resolveSwing, stepDeer, stunDeer } from './deer';
import { dealHand } from './draft';

const P = RULES.player;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const forwardOf = (yaw: number): V2 => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });

export interface StartOptions {
  seed: number;
  night?: number; // debug jump
  bonusTrap?: boolean;
}

export class World {
  state: RunState;
  forest: Forest;
  mods: Mods;
  events: SimEvent[] = [];
  focus: Focus | null = null;
  /** Ghost of the trap while Q is held (null = no valid spot). */
  trapGhost: (V2 & { ok: boolean }) | null = null;
  // Previous-tick poses for render interpolation.
  prev = { px: 0, pz: 0, dx: 0, dz: 0, dh: 0 };
  rngLoot: Rng;
  rngThreat: Rng;
  rngCards: Rng;

  constructor(state: RunState) {
    this.state = state;
    this.forest = generateForest(state.seed);
    this.mods = computeMods(state.cards);
    this.rngLoot = new Rng(state.rng.loot);
    this.rngThreat = new Rng(state.rng.threat);
    this.rngCards = new Rng(state.rng.cards);
    this.snapPrev();
  }

  static start(opts: StartOptions): World {
    const seed = opts.seed >>> 0;
    const forest = generateForest(seed);
    const night = clamp(Math.floor(opts.night ?? 1), 1, RULES.cycle.lastNight);
    const state: RunState = {
      runId: `${seed.toString(36)}-${Date.now().toString(36)}`,
      revision: 0,
      seed,
      genVersion: GEN_VERSION,
      contentVersion: CONTENT_VERSION,
      phase: 'day',
      night,
      t: 0,
      tick: 0,
      dayStarted: false,
      player: {
        x: forest.spawn.x,
        z: forest.spawn.z,
        yaw: forest.spawn.yaw,
        pitch: 0,
        hp: P.hpMax,
        stamina: P.staminaMax,
        exhausted: false,
        sinceSprint: 9,
        sprinting: false,
        battery: RULES.flashlight.max,
        lightOn: false,
        torch: 0,
        invuln: 0,
        shield: 0,
        pulseCd: 0,
        logs: 0,
        scrap: 0,
        berries: 0,
        traps: opts.bonusTrap ? 1 : 0,
        flares: 1,
        tags: 0,
        chop: 0,
        chopNode: -1,
        pick: 0,
        pickKind: '',
        pickNode: -1,
        eat: 0,
        trapHold: 0,
        bench: false,
        craft: 0,
        craftT: 0,
        dynamoDist: 0,
        dynamoDay: 0,
        noise: 0,
      },
      fuel: RULES.fire.start,
      bright: true,
      emberUsed: false,
      deer: newDeer(),
      snagLogs: forest.snags.map(() => 2),
      scrapLeft: forest.scrap.map(() => 2),
      berryLeft: forest.bushes.map(() => 1),
      traps: [],
      nextTrapId: 1,
      caches: [],
      cards: [],
      hand: null,
      pendingCard: null,
      lastTag: null,
      supplyRest: [],
      rerollChapter: 0,
      reviveUsed: false,
      deathReason: '',
      fedOnce: false,
      choppedOnce: false,
      stats: { nightsSurvived: 0, tagsBanked: 0, cachesClaimed: 0, hunts: 0, logsChopped: 0, feeds: 0, activeSeconds: 0, seals: [] },
      rng: { loot: hashSeed(seed, 'loot'), threat: hashSeed(seed, 'threat'), cards: hashSeed(seed, 'cards') },
    };
    return new World(state);
  }

  // ------------------------------------------------------------ queries

  get stage(): number {
    return stageForNight(this.state.night);
  }
  get radius(): number {
    return fireRadius(this.state.fuel, this.mods.radiusMult);
  }
  /** The one protection query shared by sparks, AI and damage checks. */
  isProtected(p: V2): boolean {
    return this.state.bright && Math.hypot(p.x, p.z) <= this.radius;
  }
  /** Fire protection, or the 4 s shield after a revive. */
  get playerProtected(): boolean {
    return this.state.player.shield > 0 || this.isProtected(this.state.player);
  }
  chapterOf(n: number): number {
    return Math.floor((n - 1) / 3) + 1;
  }
  emit(e: SimEvent): void {
    this.events.push(e);
  }
  drainEvents(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
  private snapPrev(): void {
    const s = this.state;
    this.prev.px = s.player.x;
    this.prev.pz = s.player.z;
    this.prev.dx = s.deer.x;
    this.prev.dz = s.deer.z;
    this.prev.dh = s.deer.heading;
  }
  syncRng(): void {
    this.state.rng = { loot: this.rngLoot.state, threat: this.rngThreat.state, cards: this.rngCards.state };
  }
  refreshMods(): void {
    this.mods = computeMods(this.state.cards);
  }

  // ------------------------------------------------------------ step

  step(input: Input): void {
    const s = this.state;
    if (s.phase !== 'day' && s.phase !== 'night') return;
    const pl = s.player;
    this.snapPrev();
    pl.yaw = input.yaw;
    pl.pitch = input.pitch;

    const acted =
      input.mx !== 0 || input.mz !== 0 || input.chop || input.interact || input.trapHold || input.eat || input.torch || input.flare || input.light;
    if (!s.dayStarted) {
      if (!acted) {
        this.updateFocus();
        return;
      }
      s.dayStarted = true;
    }
    s.tick++;
    s.t += DT;
    s.stats.activeSeconds += DT;

    // 1. Phase transitions (dawn is resolved before anything can hurt the player).
    if (s.phase === 'day' && s.t >= RULES.cycle.daySeconds) this.beginNight();
    else if (s.phase === 'night' && s.t >= RULES.cycle.nightSeconds) {
      this.beginDawn();
      return;
    }
    if (s.phase === 'day') {
      const before = s.t - DT;
      if (before < 43 && s.t >= 43) this.emit({ type: 'dusk' });
      if (before < 55 && s.t >= 55) {
        const a = Math.atan2(-pl.z, -pl.x) + 0.3;
        this.emit({ type: 'duskStep', x: Math.cos(a) * 22, z: Math.sin(a) * 22 });
      }
    }

    // 2. Player movement, actions and feeding.
    const fuelAdded = this.stepPlayer(input);

    // 3. Fire: burn and feed are applied once per tick, then brightness.
    this.stepFire(fuelAdded);

    // 4. Night systems.
    if (s.phase === 'night') {
      this.stepCaches();
      stepDeer(this);
      this.stepTraps();
      resolveSwing(this); // contact is cancelled inside protection, then damage
    }
    this.updateFocus();
  }

  // ------------------------------------------------------------ player

  private stepPlayer(input: Input): number {
    const s = this.state;
    const pl = s.player;
    const m = this.mods;
    let fuelAdded = 0;
    pl.noise = 0;
    pl.invuln = Math.max(0, pl.invuln - DT);
    pl.shield = Math.max(0, pl.shield - DT);
    pl.pulseCd = Math.max(0, pl.pulseCd - DT);

    this.updateFocus();
    const f = this.focus;

    // Chopping roots the player (GDD: "рубка ведётся на месте").
    let chopping = false;
    if (input.chop && f && f.kind === 'snag' && f.usable && !pl.bench) {
      if (pl.chopNode !== f.id) {
        pl.chopNode = f.id;
        pl.chop = 0;
      }
      chopping = true;
      const before = pl.chop;
      pl.chop += DT;
      pl.noise = RULES.deer.hearChop;
      // An audible hit roughly every 0.5 s.
      if (Math.floor(before / 0.5) !== Math.floor(pl.chop / 0.5) || before === 0) this.emit({ type: 'chopHit', node: f.id });
      if (pl.chop >= m.chopSeconds) {
        const take = Math.min(s.snagLogs[f.id], RULES.limits.logs - pl.logs);
        s.snagLogs[f.id] -= take;
        pl.logs += take;
        s.stats.logsChopped += take;
        s.choppedOnce = true;
        pl.chop = 0;
        pl.chopNode = -1;
        this.emit({ type: 'chopDone', node: f.id, logs: take });
      }
    } else {
      pl.chop = 0;
      pl.chopNode = -1;
    }

    // Movement.
    let mx = input.mx;
    let mz = input.mz;
    const len = Math.hypot(mx, mz);
    const moving = len > 0.01 && !chopping;
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    const wantSprint = input.sprint && moving && !pl.exhausted && pl.stamina > 0;
    pl.sprinting = wantSprint;
    if (wantSprint) {
      pl.stamina = Math.max(0, pl.stamina - m.sprintCost * DT);
      pl.sinceSprint = 0;
      if (pl.stamina <= 0) pl.exhausted = true;
    } else {
      pl.sinceSprint += DT;
      if (pl.sinceSprint >= P.staminaRegenDelay) pl.stamina = Math.min(P.staminaMax, pl.stamina + P.staminaRegen * DT);
      if (pl.exhausted && pl.stamina >= P.staminaUnlock) pl.exhausted = false;
    }
    if (moving) {
      const speed = wantSprint ? m.sprint : P.walk;
      const fw = forwardOf(pl.yaw);
      const rx = -fw.z;
      const rz = fw.x;
      const ox = pl.x;
      const oz = pl.z;
      pl.x += (fw.x * mz + rx * mx) * speed * DT;
      pl.z += (fw.z * mz + rz * mx) * speed * DT;
      resolveCircle(this.forest.obstacles, pl, RULES.world.playerRadius, RULES.world.radius - 0.6);
      const moved = Math.hypot(pl.x - ox, pl.z - oz);
      pl.noise = Math.max(pl.noise, wantSprint ? m.hearRun : m.hearStep);
      if (m.dynamo && s.phase === 'day' && pl.dynamoDay < 25) {
        pl.dynamoDist += moved;
        while (pl.dynamoDist >= 4 && pl.dynamoDay < 25) {
          pl.dynamoDist -= 4;
          pl.dynamoDay++;
          pl.battery = Math.min(RULES.flashlight.max, pl.battery + 1);
        }
      }
    }

    // Flashlight and torch.
    if (pl.torch > 0) {
      pl.torch = Math.max(0, pl.torch - DT);
      pl.lightOn = false;
    }
    if (input.light && pl.torch <= 0) {
      if (pl.battery > 0) {
        pl.lightOn = !pl.lightOn;
        this.emit({ type: 'light', on: pl.lightOn });
      } else this.emit({ type: 'denied', why: 'battery' });
    }
    if (pl.lightOn) {
      pl.battery = Math.max(0, pl.battery - m.beamDrain * DT);
      if (pl.battery <= 0) {
        pl.lightOn = false;
        this.emit({ type: 'light', on: false });
      }
    }
    if (input.torch && pl.torch <= 0) {
      if (pl.logs > 0) {
        pl.logs--;
        pl.torch = m.torchSeconds;
        pl.lightOn = false;
        this.emit({ type: 'torch' });
      } else this.emit({ type: 'denied', why: 'logs' });
    }
    if (input.pulse && m.pulse) {
      if (pl.lightOn && pl.pulseCd <= 0 && pl.battery >= RULES.pulse.cost) {
        pl.battery -= RULES.pulse.cost;
        pl.pulseCd = RULES.pulse.cooldown;
        const hit = this.inBeam(s.deer) && stunDeer(this, RULES.pulse.stun, 'pulse');
        this.emit({ type: 'pulse', hit });
      } else this.emit({ type: 'denied', why: 'pulse' });
    }

    // Eating.
    if (pl.eat > 0) {
      pl.eat += DT;
      if (pl.eat >= P.eatSeconds) {
        pl.eat = 0;
        pl.berries--;
        pl.hp = Math.min(P.hpMax, pl.hp + m.berryHp);
        pl.stamina = Math.min(P.staminaMax, pl.stamina + m.berryStamina);
        if (pl.stamina >= P.staminaUnlock) pl.exhausted = false;
        this.emit({ type: 'eat' });
      }
    } else if (input.eat) {
      if (pl.berries > 0) pl.eat = DT;
      else this.emit({ type: 'denied', why: 'berries' });
    }

    // Timed pickups (0.4 s); walking away cancels.
    if (pl.pick > 0) {
      const node = pl.pickKind === 'scrap' ? this.forest.scrap[pl.pickNode] : this.forest.bushes[pl.pickNode];
      if (!node || dist(pl, node) > P.reach + 0.8) pl.pick = 0;
      else {
        pl.pick += DT;
        if (pl.pick >= P.pickupSeconds) {
          pl.pick = 0;
          if (pl.pickKind === 'scrap') {
            const take = Math.min(s.scrapLeft[pl.pickNode], RULES.limits.scrap - pl.scrap);
            s.scrapLeft[pl.pickNode] -= take;
            pl.scrap += take;
            this.emit({ type: 'pickup', kind: 'scrap', n: take });
          } else {
            const take = Math.min(s.berryLeft[pl.pickNode], RULES.limits.berries - pl.berries);
            s.berryLeft[pl.pickNode] -= take;
            pl.berries += take;
            this.emit({ type: 'pickup', kind: 'berry', n: take });
          }
        }
      }
    }

    // Workbench panel: world time keeps running; leaving or damage closes it.
    if (pl.bench) {
      if (dist(pl, this.forest.bench) > RULES.bench.leave + 0.6) this.closeBench();
      else if (pl.craft) {
        pl.craftT += DT;
        const need = pl.craft === 3 ? RULES.recharge.seconds : RULES.trap.craftSeconds;
        if (pl.craftT >= need) this.finishCraft();
      } else if (input.craft) this.startCraft(input.craft);
    }

    // E: one focused target at a time.
    if (input.interact) {
      if (pl.bench) this.closeBench();
      else if (f && f.usable) {
        if (f.kind === 'fire') {
          const gain = Math.min(m.fuelPerLog, RULES.fire.max - s.fuel);
          if (pl.logs > 0 && gain > 0.01) {
            pl.logs--;
            fuelAdded += gain;
            s.fedOnce = true;
            s.stats.feeds++;
            this.emit({ type: 'feed', gain, relit: s.fuel <= 0 });
          }
        } else if (f.kind === 'scrap' || f.kind === 'bush') {
          pl.pick = DT;
          pl.pickKind = f.kind;
          pl.pickNode = f.id;
        } else if (f.kind === 'cache') this.claimCache(f.id);
        else if (f.kind === 'bench') {
          pl.bench = true;
          pl.craft = 0;
          this.emit({ type: 'bench', open: true });
        }
      } else if (f) this.emit({ type: 'denied', why: f.info });
    }

    // Q: hold 0.8 s to set a trap in front of the player.
    this.trapGhost = null;
    if (input.trapHold && !pl.bench && !chopping) {
      const fw = forwardOf(pl.yaw);
      const reach = clamp(1.2 + Math.max(0, -pl.pitch) * 2.2, 1.2, RULES.trap.placeRange);
      const spot = { x: pl.x + fw.x * reach, z: pl.z + fw.z * reach };
      const canPay = pl.traps > 0 || pl.scrap >= m.trapCost;
      const okSpot =
        this.forest.nav.walkable(spot) &&
        Math.hypot(spot.x, spot.z) > 1.6 &&
        s.traps.every((t) => dist(t, spot) > 1.2) &&
        this.forest.obstacles.every((o) => dist(o, spot) > o.r + 0.35);
      const ok = canPay && okSpot && s.traps.length < RULES.limits.placedTraps;
      this.trapGhost = { ...spot, ok };
      if (ok) {
        pl.trapHold += DT;
        if (pl.trapHold >= RULES.trap.placeSeconds) {
          if (pl.traps > 0) pl.traps--;
          else pl.scrap -= m.trapCost;
          s.traps.push({ id: s.nextTrapId++, x: spot.x, z: spot.z, arm: RULES.trap.armSeconds });
          pl.trapHold = -99; // one trap per hold
          this.emit({ type: 'trapPlaced', x: spot.x, z: spot.z });
        }
      } else if (pl.trapHold >= 0) pl.trapHold = 0;
    } else pl.trapHold = 0;

    // G: signal flare bursts at the first thing the aim ray meets, or at 18 m.
    if (input.flare) {
      if (pl.flares > 0) {
        pl.flares--;
        const fw = forwardOf(pl.yaw);
        const cp = Math.cos(pl.pitch);
        let reach: number = RULES.flare.range;
        if (pl.pitch < -0.02) reach = Math.min(reach, RULES.world.eyeHeight / Math.tan(-pl.pitch));
        reach = Math.min(reach, rayObstacles(this.forest.obstacles, pl, fw, reach / Math.max(cp, 0.2)));
        // The Deer's body also stops the flare.
        const dd = s.deer;
        if (dd.mode !== 'hidden') {
          const t = (dd.x - pl.x) * fw.x + (dd.z - pl.z) * fw.z;
          const off = Math.hypot(pl.x + fw.x * t - dd.x, pl.z + fw.z * t - dd.z);
          if (t > 0 && t < reach && off < 0.7) reach = Math.max(0.5, t - 0.6);
        }
        const at = { x: pl.x + fw.x * reach, z: pl.z + fw.z * reach };
        const inRange = dist(at, dd) <= m.flareRadius && lineOfSight(this.forest.obstacles, at, dd);
        const hit = inRange && stunDeer(this, m.flareStun, 'flare');
        this.emit({ type: 'flare', x: at.x, z: at.z, hit });
      } else this.emit({ type: 'denied', why: 'flares' });
    }

    // Bank carried tags within 2 m of the fire at any brightness.
    if (pl.tags > 0 && Math.hypot(pl.x, pl.z) <= RULES.fire.bankRadius + 0.85) {
      const ch = this.chapterOf(s.night);
      let seal = 0;
      if (!s.stats.seals.includes(ch)) {
        s.stats.seals.push(ch);
        seal = ch;
      }
      s.stats.tagsBanked += pl.tags;
      this.emit({ type: 'tagsBanked', n: pl.tags, seal });
      pl.tags = 0;
    }
    return fuelAdded;
  }

  private closeBench(): void {
    const pl = this.state.player;
    if (!pl.bench) return;
    pl.bench = false;
    pl.craft = 0;
    pl.craftT = 0;
    this.emit({ type: 'bench', open: false });
  }

  /** Recipe availability: 1 trap, 2 flare charge, 3 battery. */
  canCraft(r: number): boolean {
    const pl = this.state.player;
    if (r === 1) return pl.scrap >= this.mods.trapCost && pl.traps < RULES.limits.traps;
    if (r === 2) return pl.scrap >= RULES.flare.cost && pl.flares < RULES.limits.flares;
    if (r === 3) return pl.scrap >= RULES.recharge.cost && pl.battery < RULES.flashlight.max;
    return false;
  }
  private startCraft(r: 1 | 2 | 3): void {
    if (!this.canCraft(r)) {
      this.emit({ type: 'denied', why: 'craft' });
      return;
    }
    this.state.player.craft = r;
    this.state.player.craftT = 0;
  }
  private finishCraft(): void {
    const pl = this.state.player;
    const r = pl.craft;
    pl.craft = 0;
    pl.craftT = 0;
    if (!this.canCraft(r)) return; // validated again at the moment of the transaction
    if (r === 1) {
      pl.scrap -= this.mods.trapCost;
      pl.traps++;
    } else if (r === 2) {
      pl.scrap -= RULES.flare.cost;
      pl.flares++;
    } else {
      pl.scrap -= RULES.recharge.cost;
      pl.battery = Math.min(RULES.flashlight.max, pl.battery + RULES.recharge.amount);
    }
    this.emit({ type: 'craft', recipe: r });
  }

  /** True when a point is inside the flashlight cone, in range and visible. */
  inBeam(p: V2, pad = 0): boolean {
    const pl = this.state.player;
    if (!pl.lightOn) return false;
    const d = dist(pl, p);
    if (d > this.mods.beamRange || d < 0.01) return false;
    const fw = forwardOf(pl.yaw);
    const cos = ((p.x - pl.x) * fw.x + (p.z - pl.z) * fw.z) / d;
    const half = ((RULES.flashlight.coneDeg / 2 + pad) * Math.PI) / 180;
    return cos >= Math.cos(half) && lineOfSight(this.forest.obstacles, pl, p);
  }

  // ------------------------------------------------------------ fire

  private stepFire(fuelAdded: number): void {
    const s = this.state;
    const F = RULES.fire;
    const before = s.fuel;
    s.fuel = clamp(s.fuel - burnRate(s.phase === 'night' ? 'night' : 'day', s.night) * DT + fuelAdded, 0, F.max);
    // E01: once per night, the first fall to 24 F gives +14 before the brightness check.
    if (this.mods.ember && s.phase === 'night' && !s.emberUsed && before > F.weakAt && s.fuel <= F.weakAt) {
      s.emberUsed = true;
      s.fuel = Math.min(F.max, s.fuel + 14);
      this.emit({ type: 'ember' });
    }
    if (s.bright && s.fuel <= F.weakAt) {
      s.bright = false;
      this.emit({ type: 'fireWeak' });
    } else if (!s.bright && s.fuel >= F.brightAt) {
      s.bright = true;
      this.emit({ type: 'fireBright' });
    }
  }

  // ------------------------------------------------------------ night loot

  private stepCaches(): void {
    const s = this.state;
    const pl = s.player;
    for (const c of s.caches) {
      const post = this.forest.posts[c.post];
      const before = s.t - DT;
      if (c.status === 'pending') {
        if (before < c.openAt - RULES.cache.cueLead && s.t >= c.openAt - RULES.cache.cueLead) this.emit({ type: 'cacheCue', post: c.post });
        if (s.t >= c.openAt) {
          c.status = 'open';
          this.emit({ type: 'cacheOpen', post: c.post });
        }
      }
      if (c.status === 'open') {
        if (!c.revealed && this.inBeam(post, 4)) {
          c.reveal += DT;
          if (c.reveal >= this.mods.revealSeconds) {
            c.revealed = true;
            this.emit({ type: 'cacheRevealed', post: c.post });
          }
        }
        if (s.t >= c.openAt + RULES.cache.openSeconds) {
          c.status = 'closed';
          this.emit({ type: 'cacheClosed', post: c.post });
        }
      }
    }
    void pl;
  }

  private claimCache(postId: number): void {
    const s = this.state;
    const pl = s.player;
    const c = s.caches.find((k) => k.post === postId && k.status === 'open' && k.revealed);
    if (!c) return;
    c.status = 'claimed';
    if (c.reward === 'scrap') pl.scrap = Math.min(RULES.limits.scrap, pl.scrap + 2);
    else pl.flares = Math.min(RULES.limits.flares, pl.flares + 1);
    pl.tags++;
    s.stats.cachesClaimed++;
    this.emit({ type: 'cacheClaim', post: postId, reward: c.reward });
  }

  private stepTraps(): void {
    const s = this.state;
    const d = s.deer;
    for (let i = s.traps.length - 1; i >= 0; i--) {
      const t = s.traps[i];
      if (t.arm > 0) {
        t.arm -= DT;
        continue;
      }
      if (d.mode === 'hidden') continue;
      if (dist(t, d) <= RULES.trap.radius + 0.25 && stunDeer(this, this.mods.trapStun, 'trap')) {
        s.traps.splice(i, 1);
        this.emit({ type: 'trapSnap', x: t.x, z: t.z });
      }
    }
  }

  // ------------------------------------------------------------ focus

  /** The single interaction target under the crosshair (GDD: one prompt at a time). */
  updateFocus(): void {
    const s = this.state;
    const pl = s.player;
    const fw = forwardOf(pl.yaw);
    let best: Focus | null = null;
    let bestScore = Infinity;
    const consider = (kind: Focus['kind'], id: number, p: V2, r: number, info: string, usable: boolean, cone = 0.62) => {
      const dx = p.x - pl.x;
      const dz = p.z - pl.z;
      const d = Math.hypot(dx, dz);
      if (d - r > P.reach) return;
      const cos = d < 0.05 ? 1 : (dx * fw.x + dz * fw.z) / d;
      if (cos < cone) return;
      const score = (1 - cos) * 4 + (d - r) * 0.3;
      if (score < bestScore) {
        bestScore = score;
        best = { kind, id, x: p.x, z: p.z, info, usable };
      }
    };
    const F = this.forest;
    F.snags.forEach((n, i) => {
      if (s.snagLogs[i] <= 0) return;
      const full = pl.logs >= RULES.limits.logs;
      consider('snag', i, n, 0.32, full ? 'full' : 'chop', !full);
    });
    {
      const gain = Math.min(this.mods.fuelPerLog, RULES.fire.max - s.fuel);
      const usable = pl.logs > 0 && gain > 0.01;
      const info = gain <= 0.01 ? 'fireFull' : pl.logs <= 0 ? 'noLogs' : `+${Math.round(gain)}`;
      consider('fire', 0, { x: 0, z: 0 }, 0.85, info, usable, 0.5);
    }
    F.scrap.forEach((n, i) => {
      if (s.scrapLeft[i] <= 0) return;
      const full = pl.scrap >= RULES.limits.scrap;
      consider('scrap', i, n, 0.5, full ? 'full' : 'take', !full);
    });
    F.bushes.forEach((n, i) => {
      if (s.berryLeft[i] <= 0) return;
      const full = pl.berries >= RULES.limits.berries;
      consider('bush', i, n, 0.5, full ? 'full' : 'take', !full);
    });
    for (const c of s.caches) {
      if (c.status !== 'open') continue;
      consider('cache', c.post, F.posts[c.post], 0.2, c.revealed ? c.reward : 'needLight', c.revealed);
    }
    consider('bench', 0, F.bench, 0.6, 'bench', true);
    this.focus = best;
  }

  // ------------------------------------------------------------ phases

  private beginNight(): void {
    const s = this.state;
    s.phase = 'night';
    s.t = 0;
    s.emberUsed = false;
    // Two caches on different posts, 14–17 m from the fire.
    const order = [0, 1, 2].sort(() => this.rngLoot.next() - 0.5);
    s.caches = RULES.cache.times.map(
      (openAt, i): CacheState => ({ post: order[i], openAt, reward: i === 0 ? 'scrap' : 'flare', reveal: 0, revealed: false, status: 'pending' }),
    );
    // E02: a free trap on the nearest free marked trail point 9–12 m from the fire.
    if (this.mods.autoTrap && s.traps.length < RULES.limits.placedTraps) {
      const spot = this.forest.trailMarks
        .filter((p) => s.traps.every((t) => dist(t, p) > 1.5) && this.forest.nav.walkable(p))
        .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0];
      if (spot) {
        s.traps.push({ id: s.nextTrapId++, x: spot.x, z: spot.z, arm: 0 });
        this.emit({ type: 'trapPlaced', x: spot.x, z: spot.z });
      }
    }
    // The Deer steps out of the fog on the far side of the clearing.
    const pl = s.player;
    const d = (s.deer = { ...newDeer(), nearMiss: s.deer.nearMiss });
    const away = Math.atan2(-pl.z, -pl.x) + this.rngThreat.range(-0.5, 0.5);
    const start = this.forest.nav.center(this.forest.nav.nearestFree({ x: Math.cos(away) * 22, z: Math.sin(away) * 22 }));
    d.x = start.x;
    d.z = start.z;
    d.heading = away + Math.PI / 2;
    d.patrolAngle = Math.atan2(d.z, d.x);
    d.orbitDir = this.rngThreat.sign();
    d.mode = 'patrol';
    this.prev.dx = d.x;
    this.prev.dz = d.z;
    this.prev.dh = d.heading;
    this.emit({ type: 'nightStart', n: s.night });
  }

  private beginDawn(): void {
    const s = this.state;
    const pl = s.player;
    s.stats.nightsSurvived++;
    s.deer.mode = 'hidden';
    s.deer.threat = 0;
    s.caches = [];
    pl.bench = false;
    pl.craft = 0;
    pl.chop = 0;
    pl.pick = 0;
    pl.eat = 0;
    pl.battery = Math.min(RULES.flashlight.max, pl.battery + RULES.flashlight.dawnCharge);
    pl.dynamoDay = 0;
    this.replenish();
    this.emit({ type: 'dawn', n: s.night });
    if (s.night >= RULES.cycle.lastNight) {
      s.phase = 'victory';
      this.emit({ type: 'victory' });
    } else {
      s.phase = 'draft';
      s.hand = dealHand(this, []);
      s.pendingCard = null;
    }
    this.syncRng();
    this.emit({ type: 'save' });
  }

  /** Depleted nodes come back at dawn up to the daily minimum. */
  private replenish(): void {
    const s = this.state;
    const refill = (arr: number[], full: number, min: number) => {
      let intact = arr.filter((v) => v >= full).length;
      const order = arr.map((_, i) => i).sort(() => this.rngLoot.next() - 0.5);
      for (const i of order) {
        if (intact >= min) break;
        if (arr[i] < full) {
          arr[i] = full;
          intact++;
        }
      }
    };
    refill(s.snagLogs, 2, 3);
    refill(s.scrapLeft, 2, 3);
    refill(s.berryLeft, 1, 2);
  }

  /** Called by the draft once the card choice is confirmed (or skipped). */
  beginDay(): void {
    const s = this.state;
    if (s.phase !== 'draft') return;
    s.hand = null;
    s.pendingCard = null;
    s.night++;
    s.phase = 'day';
    s.t = 0;
    this.refreshMods();
    this.syncRng();
    this.emit({ type: 'dayStart', n: s.night });
    this.emit({ type: 'save' });
  }

  // ------------------------------------------------------------ damage, death, revive

  damagePlayer(amount: number): void {
    const s = this.state;
    const pl = s.player;
    if (pl.invuln > 0) return;
    pl.hp = Math.max(0, pl.hp - amount);
    pl.invuln = P.invulnSeconds;
    this.closeBench();
    this.emit({ type: 'hit', hp: pl.hp });
    if (pl.hp <= 0) {
      s.phase = 'deathOffer';
      s.deathReason = 'deer';
      this.emit({ type: 'death' });
      this.syncRng();
      this.emit({ type: 'save' });
    }
  }

  get canRevive(): boolean {
    const s = this.state;
    return s.phase === 'deathOffer' && !s.reviveUsed && s.player.scrap >= RULES.revive.scrap;
  }

  /** In-game last chance: 4 scrap → back at the fire, the night clock keeps its place. */
  revive(): boolean {
    const s = this.state;
    if (!this.canRevive) return false;
    const pl = s.player;
    pl.scrap -= RULES.revive.scrap;
    s.reviveUsed = true;
    pl.hp = RULES.revive.hp;
    pl.x = 1.4;
    pl.z = 1.5;
    pl.invuln = 0;
    pl.shield = RULES.revive.shield;
    s.fuel = Math.max(s.fuel, RULES.revive.fuel);
    s.bright = s.fuel >= RULES.fire.brightAt || s.bright;
    s.phase = 'night';
    const d = s.deer;
    d.mode = 'retreat';
    d.timer = 0;
    d.threat = 0;
    this.snapPrev();
    this.emit({ type: 'revived' });
    this.emit({ type: 'save' });
    return true;
  }

  endRun(): void {
    const s = this.state;
    if (s.phase === 'deathOffer') s.phase = 'end';
  }

  // ------------------------------------------------------------ save

  serialize(): RunState {
    this.syncRng();
    this.state.revision++;
    return JSON.parse(JSON.stringify(this.state)) as RunState;
  }
}
