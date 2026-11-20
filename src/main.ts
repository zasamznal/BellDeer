// App shell: input → fixed 30 Hz simulation → interpolated render, audio, HUD.

import './ui/style.css';
import { Audio } from './audio/audio';
import { Platform, RunStore, analyticsLog, track } from './platform/store';
import { preloadModels } from './render/assets';
import { SceneView } from './render/sceneView';
import { pickCard, replaceCard, reroll, skipCard } from './sim/draft';
import { DT, RULES } from './sim/rules';
import { type Input, type SimEvent, emptyInput } from './sim/types';
import { World } from './sim/world';
import { loadFonts } from './ui/fonts';
import { type Action, Hud, type ScreenKind } from './ui/hud';
import { detectLang, getLang, setLang, t } from './ui/i18n';
import './ui/ideasStrings'; // [ideas] strings of the gameplay additions
import { IdeasUi } from './ui/ideasUi'; // [ideas] pulse, omen / challenge lines, score, hints, slow motion
import { saveResultCard } from './ui/resultCard';
import { Tutorial } from './ui/tutorial';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const NOLOCK = params.has('nolock');

class App {
  private canvas = document.getElementById('view') as HTMLCanvasElement;
  private store = new RunStore();
  private platform = new Platform();
  private audio = new Audio();
  private view = new SceneView(this.canvas);
  private hud: Hud;
  private ideas: IdeasUi; // [ideas]
  // First-run tutorial: keeper's notes and the world marker, all in src/ui/tutorial.ts.
  private tutorial = new Tutorial({ store: this.store, project: (x, y, z) => this.view.project(x, y, z), sound: () => this.audio.tutorialTick(), hush: () => this.hud.clearHint() });
  world!: World;
  private mode: 'title' | 'play' | 'pause' | 'session' = 'title';
  private chapterPanel = false;
  private confirmNew = false;
  private keys = new Set<string>();
  private edge = emptyInput();
  private yaw = 0;
  private pitch = 0;
  private lmb = false;
  private freeLook = NOLOCK;
  private releasing = false;
  private lockPromise = false;
  private acc = 0;
  private last = performance.now();
  private now = 0;
  private stepSubAt = -9;
  private moved = false;
  private birdsNoted = false;
  private frames: number[] = [];
  private lowNoted = false;

  constructor() {
    loadFonts();
    const st = this.store.profile.settings;
    const sdkLang = params.get('lang');
    setLang(st.lang ?? (sdkLang === 'ru' || sdkLang === 'en' ? sdkLang : detectLang()));
    this.audio.volume = st.volume;
    this.audio.effects = st.effects;
    this.view.settings.shake = st.shake;
    this.view.settings.flash = st.flash;
    if (st.lowQuality || params.has('low')) this.view.setLowQuality(true);

    this.hud = new Hud({
      action: (a) => this.action(a),
      card: (i) => this.chooseCard(i),
      replace: (slot) => this.chooseReplace(slot),
      volume: (kind, v) => {
        st[kind] = v;
        this.audio[kind] = v;
        this.audio.applyVolume();
        this.store.saveProfile();
      },
    });
    this.hud.showSubs = st.subtitles;
    this.ideas = new IdeasUi(this.hud, this.audio, this.view, this.store); // [ideas]

    // The title shows the real clearing: the saved run if there is one, otherwise a fresh forest.
    const saved = this.store.run;
    this.setWorld(saved ? new World(structuredClone(saved)) : World.start({ seed: this.newSeed() }));
    this.bind();
    document.getElementById('boot')?.remove();
    document.getElementById('hud')!.hidden = false;
    if (DEBUG) document.getElementById('debug')!.hidden = false;
    track('playable');
    requestAnimationFrame((ts) => this.frame(ts));
  }

  private newSeed(): number {
    const p = params.get('seed');
    return p ? Number(p) >>> 0 : (Math.random() * 0xffffffff) >>> 0;
  }

  private setWorld(w: World): void {
    this.world = w;
    this.view.setForest(w.forest);
    this.yaw = w.state.player.yaw;
    this.pitch = w.state.player.pitch;
    this.acc = 0;
    this.moved = false;
    this.birdsNoted = false;
    this.chapterPanel = false;
  }

  // ------------------------------------------------------------ input

  private bind(): void {
    const c = this.canvas;
    window.addEventListener('resize', () => this.view.resize());
    window.addEventListener('keydown', (e) => this.keyDown(e));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.lmb = false;
      this.pause();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    });
    c.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.audio.unlock();
      if (this.mode !== 'play' || !this.simActive) return;
      // The first click both captures the mouse and starts the chop.
      this.lmb = true;
      this.lock();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.lmb = false;
    });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mousemove', (e) => {
      if (this.mode !== 'play' || !this.simActive) return;
      if (document.pointerLockElement !== c && !this.freeLook) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - e.movementY * 0.0022));
    });
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === c;
      c.classList.toggle('playing', locked || (this.freeLook && this.mode === 'play'));
      if (!locked && !this.releasing && !this.freeLook && this.mode === 'play' && this.simActive) this.pause();
      this.releasing = false;
    });
    document.addEventListener('pointerlockerror', () => {
      // Browsers without the promise form give no reason; assume the lock is unavailable.
      if (!this.lockPromise) this.freeLook = true;
    });
  }

  private get simActive(): boolean {
    const p = this.world.state.phase;
    return p === 'day' || p === 'night';
  }

  private lock(): void {
    if (this.freeLook || document.pointerLockElement === this.canvas) return;
    try {
      const r = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      if (r && typeof r.catch === 'function') {
        this.lockPromise = true;
        // A sandboxed iframe without pointer-lock permission: fall back to free mouse look.
        // (NotAllowedError only means "click again", e.g. right after Esc.)
        r.catch((e: unknown) => {
          const name = (e as { name?: string })?.name;
          if (name === 'SecurityError' || name === 'NotSupportedError') this.freeLook = true;
        });
      }
    } catch {
      this.freeLook = true;
    }
  }
  private unlock(): void {
    if (document.pointerLockElement === this.canvas) {
      this.releasing = true;
      document.exitPointerLock();
    }
  }

  private keyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    const code = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(code)) e.preventDefault();
    this.audio.unlock();
    const digit = code.startsWith('Digit') ? Number(code.slice(5)) : code.startsWith('Numpad') ? Number(code.slice(6)) : NaN;
    const scr = this.hud.screen;

    if (scr === 'draft') {
      const n = this.world.state.hand?.length ?? 0;
      if (digit >= 1 && digit <= n) this.chooseCard(digit - 1);
      else if (code === 'ArrowRight' || code === 'KeyD') this.hud.setFocusCard((this.hud.focusCard + 1) % Math.max(1, n));
      else if (code === 'ArrowLeft' || code === 'KeyA') this.hud.setFocusCard((this.hud.focusCard + n - 1) % Math.max(1, n));
      else if (code === 'Enter' || code === 'Space') this.chooseCard(this.hud.focusCard);
      return;
    }
    if (scr === 'replace') {
      if (digit >= 1 && digit <= 4) this.chooseReplace(digit - 1);
      else if (code === 'Escape' || digit === 0) this.chooseReplace(-1);
      return;
    }
    if (scr === 'chapter') {
      if (code === 'Enter' || code === 'Space') this.action('nextDay');
      return;
    }
    if (scr === 'pause') {
      if (code === 'KeyP' || code === 'Enter') this.action('resume');
      return;
    }
    if (scr === 'title') {
      if (code === 'Enter') this.action(this.store.run ? 'continue' : 'play');
      return;
    }
    if (scr !== 'none') return;

    this.keys.add(code);
    switch (code) {
      case 'KeyE':
        this.edge.interact = true;
        break;
      case 'KeyB':
        this.edge.eat = true;
        break;
      case 'KeyF':
        this.edge.light = true;
        break;
      case 'KeyV':
        this.edge.pulse = true;
        break;
      case 'KeyT':
        this.edge.torch = true;
        break;
      case 'KeyG':
        this.edge.flare = true;
        break;
      case 'KeyR': // [ideas 5] tin lure
        this.edge.lure = true;
        break;
      case 'KeyP':
        this.pause();
        break;
      default:
        if (digit >= 1 && digit <= 3) this.edge.craft = digit as 1 | 2 | 3;
    }
  }

  private buildInput(): Input {
    const k = this.keys;
    const i = this.edge;
    i.mx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    i.mz = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    i.sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    i.chop = this.lmb;
    i.trapHold = k.has('KeyQ');
    i.blow = k.has('KeyE'); // [ideas 8] E held: blow on the embers
    i.yaw = this.yaw;
    i.pitch = this.pitch;
    this.edge = emptyInput();
    return i;
  }

  // ------------------------------------------------------------ flow

  private pause(): void {
    if (this.mode !== 'play' || !this.simActive) return;
    this.mode = 'pause';
    // Held movement keys survive the pause (blur clears them, since their key-up is lost).
    this.lmb = false;
    this.unlock();
    this.platform.gameplay(false);
    this.audio.suspend(true);
  }

  private startPlay(): void {
    this.mode = 'play';
    this.audio.unlock();
    this.audio.suspend(false);
    this.last = performance.now();
    if (this.simActive) {
      this.lock();
      this.platform.gameplay(true);
      this.canvas.classList.toggle('playing', this.freeLook);
      this.canvas.focus();
    }
  }

  private action(a: Action): void {
    const st = this.store.profile.settings;
    const w = this.world;
    this.audio.unlock();
    this.audio.click();
    switch (a) {
      case 'play':
      case 'new':
      case 'again': {
        if (a === 'new' && this.store.run && !this.confirmNew) {
          // A live save is about to be replaced: ask once more on the same button.
          this.confirmNew = true;
          break;
        }
        this.confirmNew = false;
        // An abandoned run still counts in the profile.
        if (this.store.run) this.finishRun('abandoned');
        const profile = this.store.profile;
        const night = Number(params.get('night')) || 1;
        this.setWorld(World.start({ seed: this.newSeed(), night, bonusTrap: profile.bonusTrap }));
        profile.bonusTrap = false;
        this.store.saveRun(this.world.serialize());
        this.startPlay();
        break;
      }
      case 'continue':
        this.confirmNew = false;
        track('run_resumed', { night: w.state.night });
        this.resumeDraftIfPicked();
        this.startPlay();
        break;
      case 'resume':
        this.startPlay();
        break;
      case 'title': {
        if (this.simActive || w.state.phase === 'draft') this.saveNow();
        this.mode = 'title';
        this.unlock();
        this.platform.gameplay(false);
        if (!this.store.run) this.setWorld(World.start({ seed: this.newSeed() }));
        break;
      }
      case 'lang':
        setLang(getLang() === 'ru' ? 'en' : 'ru');
        st.lang = getLang();
        this.hud.relabel();
        this.store.saveProfile();
        break;
      case 'shake':
        st.shake = this.view.settings.shake = !st.shake;
        this.store.saveProfile();
        break;
      case 'flash':
        st.flash = this.view.settings.flash = !st.flash;
        this.store.saveProfile();
        break;
      case 'subs':
        st.subtitles = this.hud.showSubs = !st.subtitles;
        this.store.saveProfile();
        break;
      case 'low':
        st.lowQuality = !this.view.lowQuality;
        this.view.setLowQuality(st.lowQuality, true);
        this.store.saveProfile();
        break;
      case 'tutorial': // settings row: off hides the tutorial at once, on arms it for the next new run
        this.tutorial.toggle();
        break;
      case 'skip':
        if (skipCard(w)) this.afterPick('skip');
        break;
      case 'reroll':
        if (reroll(w)) this.saveNow();
        break;
      case 'nextDay':
        this.chapterPanel = false;
        w.beginDay();
        this.handleEvents();
        this.startPlay();
        break;
      case 'endSession':
        this.saveNow();
        this.mode = 'session';
        break;
      case 'revive':
        if (w.revive()) {
          this.handleEvents();
          this.yaw = Math.atan2(w.state.player.x, w.state.player.z);
          this.pitch = 0;
          this.startPlay();
        }
        break;
      case 'endRun':
        w.endRun();
        this.finishRun('deer');
        break;
      case 'saveFrame': {
        // One PNG on request (GDD §6): 1080×1920 card with the night, the cause and the build.
        const s = w.state;
        const victory = s.phase === 'victory';
        const data = {
          headline: victory ? t('victory') : t('runOver', { n: s.night }),
          subline: t('survivedNights', { n: s.stats.nightsSurvived }),
          cause: victory ? t('victoryText') : t('cause'),
          tagsLine: `${t('tagsOut', { n: s.stats.tagsBanked })} · ${t('scoreLine', { n: s.stats.score })}`, // [ideas 9] score on the card
          buildLabel: t('build'),
          build: s.cards.map((id) => t(id)),
          footer: t('title'),
          night: s.night,
          stage: w.stage,
          victory,
        };
        const go = () => saveResultCard(data, `99-nights-night-${s.night}.png`);
        // Wait for the HUD font so the card does not fall back to a system monospace.
        if (document.fonts?.load) void document.fonts.load("400 96px 'BD Mono'", data.headline).then(go, go);
        else go();
        break;
      }
    }
  }

  private saveNow(): void {
    this.store.saveRun(this.world.serialize());
  }

  /** A run saved after the card was confirmed resumes past the draft, never with a second pick. */
  private resumeDraftIfPicked(): void {
    const s = this.world.state;
    if (s.phase === 'draft' && s.hand && s.hand.length === 0 && !s.pendingCard) {
      if (s.stats.nightsSurvived % 3 === 0) this.chapterPanel = true;
      else {
        this.world.beginDay();
        this.handleEvents();
      }
    }
  }

  private chooseCard(i: number): void {
    const id = this.world.state.hand?.[i] ?? '';
    const r = pickCard(this.world, i);
    if (r === 'invalid') return;
    this.audio.cardPick();
    if (r === 'done') this.afterPick(id);
  }
  private chooseReplace(slot: number): void {
    const id = this.world.state.pendingCard;
    if (replaceCard(this.world, slot)) this.afterPick(slot >= 0 ? (id ?? '') : 'keep');
  }
  private afterPick(id: string): void {
    const w = this.world;
    const s = w.state;
    track('draft_picked', { id, night: s.night });
    s.hand = [];
    if (s.stats.nightsSurvived % 3 === 0) {
      // Chapter boundary: "Continue" and "End session" side by side.
      this.chapterPanel = true;
      this.saveNow();
    } else {
      w.beginDay();
      this.handleEvents();
      this.startPlay();
    }
  }

  private finishRun(reason: string): void {
    const s = this.world.state;
    const p = this.store.profile;
    p.best = Math.max(p.best, reason === 'victory' ? 99 : s.night);
    p.bestScore = Math.max(p.bestScore, s.stats.score); // [ideas 9]
    p.runs++;
    p.nights += s.stats.nightsSurvived;
    for (const seal of s.stats.seals) if (!p.seals.includes(seal)) p.seals.push(seal);
    const stage = this.world.stage;
    for (let i = 0; i <= stage; i++) if (!p.seenStages.includes(i)) p.seenStages.push(i);
    // A full chapter earns the start trap for the next run without any ad.
    if (s.stats.nightsSurvived >= 3) p.bonusTrap = true;
    this.store.clearRun();
    this.platform.gameplay(false);
    track('run_ended', { reason, night: s.night, nights: s.stats.nightsSurvived });
  }

  // ------------------------------------------------------------ events

  private handleEvents(): void {
    const w = this.world;
    const hud = this.hud;
    const a = this.audio;
    const now = this.now;
    for (const e of w.drainEvents()) {
      this.view.onEvent(e, w);
      this.ideas.onEvent(e, w, now); // [ideas]
      this.tutorial.onEvent(e); // tutorial steps tick off from the same events
      switch (e.type) {
        case 'chopHit':
          a.chop();
          break;
        case 'chopDone':
          a.timber();
          hud.toast(t('tLogs', { n: e.logs }));
          if (w.state.stats.logsChopped === e.logs) track('first_chop', { t: w.state.t });
          if (!w.state.fedOnce && !this.tutorial.active) hud.setHint(t('hintFire'), now, 7); // tutorial replaces this hint
          break;
        case 'feed':
          a.feed();
          hud.clearHint();
          if (w.state.stats.feeds === 1) track('first_feed', { t: w.state.t });
          break;
        case 'pickup':
          a.pickup();
          if (e.n > 0) hud.toast(t(e.kind === 'scrap' ? 'tScrap' : 'tBerry', { n: e.n }));
          break;
        case 'eat':
          a.eat();
          break;
        case 'light':
          a.click(e.on);
          break;
        case 'torch':
          a.torch();
          break;
        case 'trapPlaced':
          a.trapSet();
          hud.toast(t('tTrap'));
          break;
        case 'trapSnap':
          a.trapSnap(e.x, e.z);
          hud.subtitle(t('sTrap', { d: hud.dirWord(w, e.x, e.z) }), now, true);
          break;
        case 'flare':
          a.flare(e.x, e.z);
          break;
        case 'pulse':
          a.click(true);
          break;
        case 'craft':
          a.pickup();
          hud.toast(t(e.recipe === 1 ? 'tTrapReady' : e.recipe === 2 ? 'tFlare' : 'tBattery'));
          break;
        case 'bench':
          a.click(e.open);
          break;
        case 'cacheCue': {
          const p = w.forest.posts[e.post];
          a.tin(p.x, p.z);
          hud.subtitle(t('sTin', { d: hud.dirWord(w, p.x, p.z) }), now);
          break;
        }
        case 'cacheOpen': {
          const p = w.forest.posts[e.post];
          a.tin(p.x, p.z);
          if (!w.state.player.lightOn && w.state.stats.cachesClaimed === 0 && !this.tutorial.active) hud.setHint(t('hintLight'), now, 5); // tutorial replaces this hint
          break;
        }
        case 'cacheRevealed':
          a.bank();
          break;
        case 'cacheClaim':
          a.pickup();
          hud.toast(e.reward === 'scrap' ? t('tScrap', { n: 2 }) : t('tFlare'));
          hud.toast(t('tTag'));
          track('cache_claim', { night: w.state.night });
          break;
        case 'cacheClosed':
          hud.toast(t('tCacheGone'));
          break;
        case 'tagsBanked':
          a.bank();
          hud.toast(t('tBank', { n: e.n }));
          if (e.seal) hud.toast(t('tSeal', { n: e.seal }));
          break;
        case 'fireWeak':
          hud.subtitle(t('sFireWeak'), now, true);
          break;
        case 'fireBright':
          hud.subtitle(t('sFireBright'), now);
          break;
        case 'ember':
          hud.toast(t('tEmber'));
          break;
        case 'nightStart':
          track('night_start', { n: e.n });
          if (e.n === 1 && !this.tutorial.active) hud.setHint(t('hintNight'), now, 8); // tutorial replaces this hint
          break;
        case 'duskStep':
          a.deerStep(e.x, e.z, false);
          a.deerStep(e.x, e.z, false);
          hud.subtitle(t('sSteps', { d: hud.dirWord(w, e.x, e.z) }), now, false, 'steps');
          break;
        case 'dawn':
          a.dawn();
          track('night_survived', { n: e.n });
          this.unlock();
          this.platform.gameplay(false);
          this.keys.clear();
          this.lmb = false;
          break;
        case 'dayStart':
          this.birdsNoted = false;
          break;
        case 'deerChime':
          a.chime(e.x, e.z);
          hud.subtitle(t('sChime', { d: hud.dirWord(w, e.x, e.z) }), now);
          break;
        case 'deerCue':
          hud.subtitle(t('sDouble', { d: hud.dirWord(w, e.x, e.z) }), now, true);
          break;
        case 'deerStrike':
          a.strike(e.x, e.z);
          break;
        case 'deerHunt':
          track('hunt_started', { night: w.state.night });
          break;
        case 'deerSwing':
          a.swing(e.x, e.z);
          break;
        case 'deerStunned':
          a.stunned();
          hud.subtitle(t('sStunned'), now);
          break;
        case 'deerRetreat':
          hud.subtitle(t('sRetreat'), now);
          break;
        case 'deerStep': {
          a.deerStep(e.x, e.z, e.run);
          const pl = w.state.player;
          const d = Math.hypot(e.x - pl.x, e.z - pl.z);
          if (d < 20 && now - this.stepSubAt > 3) {
            this.stepSubAt = now;
            hud.subtitle(t(e.run ? 'sRun' : 'sSteps', { d: hud.dirWord(w, e.x, e.z) }), now, e.run, 'steps');
          }
          break;
        }
        case 'hit':
          a.hit();
          break;
        case 'death':
          a.death();
          this.unlock();
          this.platform.gameplay(false);
          this.keys.clear();
          this.lmb = false;
          break;
        case 'revived':
          hud.toast(t('tRevived'));
          break;
        case 'victory':
          this.finishRun('victory');
          break;
        case 'denied': {
          const key = { battery: 'dBattery', logs: 'dLogs', berries: 'dBerries', flares: 'dFlares', pulse: 'dPulse', craft: 'dCraft' }[e.why];
          if (key) {
            a.deny();
            hud.toast(t(key));
          }
          break;
        }
        case 'save':
          if (w.state.phase !== 'victory') this.saveNow();
          break;
      }
    }
  }

  // ------------------------------------------------------------ frame

  private frame(ts: number): void {
    requestAnimationFrame((x) => this.frame(x));
    const dt = Math.min(0.1, Math.max(0, (ts - this.last) / 1000));
    this.last = ts;
    this.now += dt;
    const w = this.world;
    const s = w.state;

    if (this.mode === 'play' && this.simActive) {
      this.acc += dt * this.ideas.timeScale(dt); // [ideas 10] near-miss slow motion; the fixed steps themselves are unchanged
      let guard = 0;
      while (this.acc >= DT && guard++ < 5) {
        w.step(this.buildInput());
        this.acc -= DT;
        this.handleEvents();
        if (!this.simActive) {
          this.acc = 0;
          break;
        }
      }
      if (guard >= 5) this.acc = 0;
      this.tips();
    }

    const alpha = this.simActive && this.mode === 'play' ? this.acc / DT : 1;
    const pl = s.player;
    this.audio.listener = { x: pl.x, z: pl.z, yaw: this.yaw };
    const speed = Math.hypot(pl.x - w.prev.px, pl.z - w.prev.pz) * 30;
    this.audio.ambient(dt, {
      fuel: s.fuel,
      bright: s.bright,
      fireDist: Math.hypot(pl.x, pl.z),
      night: s.phase === 'night' ? 1 : 0,
      birds: s.phase === 'day' && s.t < 52,
      stamina: pl.stamina,
      speed: this.mode === 'play' && this.simActive ? speed : 0,
      sprint: pl.sprinting,
      active: this.mode !== 'pause',
    });
    this.view.titleMode = this.mode === 'title' || this.mode === 'session';
    this.view.update(w, alpha, dt, this.yaw, this.pitch);
    // Playing without the mouse captured (lock refused right after Esc): say how to get it back.
    if (this.mode === 'play' && this.simActive && !this.freeLook && document.pointerLockElement !== this.canvas) this.hud.setHint(t('clickToPlay'), this.now, 0.3);
    if (this.view.lowQuality && !this.lowNoted && !this.store.profile.settings.lowQuality && !params.has('low')) {
      this.lowNoted = true;
      this.hud.toast(t('tLow'));
    }

    let screen: ScreenKind = 'none';
    if (this.mode === 'title') screen = 'title';
    else if (this.mode === 'session') screen = 'session';
    else if (this.mode === 'pause') screen = 'pause';
    else if (s.phase === 'draft') screen = s.pendingCard ? 'replace' : this.chapterPanel ? 'chapter' : 'draft';
    else if (s.phase === 'deathOffer') screen = 'death';
    else if (s.phase === 'end') screen = 'end';
    else if (s.phase === 'victory') screen = 'victory';
    this.hud.show(screen, w, this.store.profile, this.store.run, this.view.lowQuality, this.confirmNew);
    this.hud.update(w, this.now, this.view.hitPulse, this.view.settings.flash);
    this.ideas.frame(w, dt, this.now, this.mode === 'play' && this.simActive, this.tutorial.active); // [ideas]
    document.getElementById('hud')!.classList.toggle('menu', screen !== 'none');
    this.tutorial.frame(w, screen, dt); // tutorial: note card, world marker, the line on the first draft screen

    if (DEBUG) this.debug(dt);
  }

  /** First-minute guidance (GDD §2): one hint at a time, gone for good once followed. */
  private tips(): void {
    const s = this.world.state;
    const pl = s.player;
    if (!this.moved && (this.keys.has('KeyW') || this.keys.has('KeyA') || this.keys.has('KeyS') || this.keys.has('KeyD'))) {
      this.moved = true;
      this.hud.clearHint();
    }
    if (s.night === 1 && s.phase === 'day' && !this.moved && s.dayStarted && s.t > 3 && s.t < 3.1 && !this.tutorial.active) this.hud.setHint(t('hintMove'), this.now, 6); // tutorial replaces this hint
    if (s.phase === 'day' && s.t >= 52 && !this.birdsNoted) {
      this.birdsNoted = true;
      this.hud.subtitle(t('sBirds'), this.now);
    }
    void pl;
  }

  private debug(dt: number): void {
    this.frames.push(dt * 1000);
    if (this.frames.length > 240) this.frames.shift();
    const sorted = [...this.frames].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] || 16;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 16;
    const s = this.world.state;
    const info = this.view.info;
    document.getElementById('debug')!.textContent =
      `fps ${(1000 / med).toFixed(0)}  med ${med.toFixed(1)} ms  p95 ${p95.toFixed(1)} ms\n` +
      `calls ${info.calls}  tris ${info.triangles}  low ${this.view.lowQuality}\n` +
      `${s.phase} n${s.night} t${s.t.toFixed(1)}  F ${s.fuel.toFixed(1)} R ${this.world.radius.toFixed(1)} ${s.bright ? 'bright' : 'weak'}\n` +
      `deer ${s.deer.mode} A ${s.deer.threat.toFixed(0)} d ${Math.hypot(s.deer.x - s.player.x, s.deer.z - s.player.z).toFixed(1)} stage ${this.world.stage}\n` +
      `seed ${s.seed} ${this.world.forest.template ? 'template' : 'jitter'}  events ${analyticsLog.length}`;
  }

  /** Test hook: drive the game without a pointer lock (used by the headless check). */
  api = {
    start: () => this.action(this.store.run ? 'continue' : 'play'),
    newRun: () => this.action('new'),
    look: (yaw: number, pitch: number) => {
      this.yaw = yaw;
      this.pitch = pitch;
    },
    key: (code: string, down: boolean) => {
      if (down) this.keyDown(new KeyboardEvent('keydown', { code }));
      else this.keys.delete(code);
    },
    mouse: (down: boolean) => (this.lmb = down),
    act: (a: Action) => this.action(a),
    card: (i: number) => this.chooseCard(i),
    state: () => this.world.state,
    world: () => this.world,
    screen: () => this.hud.screen,
    info: () => ({ ...this.view.info, frameMs: this.view.frameMs, low: this.view.lowQuality }),
    events: () => analyticsLog,
    freeLook: () => {
      this.freeLook = true;
    },
  };
}

// Models are small (about 1.3 MB together); wait for them so the first frame is the final look.
void preloadModels().then(() => {
  const app = new App();
  (window as unknown as { __bd: App['api'] }).__bd = app.api;
});
void RULES;
