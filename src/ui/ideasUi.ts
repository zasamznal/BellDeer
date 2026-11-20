// [ideas] Presentation of the gameplay additions outside the 3D scene: the
// threat pulse, the omen word and challenge line under the phase label, the
// dusk announcement, the score, one-time hints, near-miss slow motion, and the
// extra lines on the dawn / result / title screens. The app shell (main.ts)
// owns one IdeasUi and calls it from its event loop and its frame; hud.ts calls
// the two small functions at the bottom. All elements are created here.

import './ideas.css';
import type { Audio } from '../audio/audio';
import type { Profile, RunStore } from '../platform/store';
import type { SceneView } from '../render/sceneView';
import { canBlow, challengeWon } from '../sim/ideas';
import { IDEAS, RULES, TICK_HZ } from '../sim/rules';
import type { SimEvent } from '../sim/types';
import type { World } from '../sim/world';
import type { Hud, ScreenKind } from './hud';
import { t } from './i18n';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function make(tag: string, id: string, parent: HTMLElement, before: Element | null = null): HTMLElement {
  const el = document.createElement(tag);
  el.id = id;
  parent.insertBefore(el, before);
  return el;
}

/** True once tonight's omen and challenge have been announced (dusk tick) and until the night is over. */
function nightKnown(w: World): boolean {
  const s = w.state;
  return s.phase === 'night' || s.phase === 'deathOffer' || (s.phase === 'day' && s.t >= 43);
}

function inView(w: World, p: { x: number; z: number }, maxDist: number, minCos: number): boolean {
  const pl = w.state.player;
  const dx = p.x - pl.x;
  const dz = p.z - pl.z;
  const d = Math.hypot(dx, dz);
  if (d > maxDist) return false;
  return d < 0.5 || (dx * -Math.sin(pl.yaw) + dz * -Math.cos(pl.yaw)) / d >= minCos;
}

export class IdeasUi {
  private scoreEl: HTMLElement;
  private scoreLabel: HTMLElement;
  private scoreVal: HTMLElement;
  private scorePop: HTMLElement;
  private omenEl: HTMLElement;
  private chEl: HTMLElement;
  private banner: HTMLElement;
  private pulse: HTMLElement;
  private cold: HTMLElement;
  private phaseEl = document.getElementById('phase')!;
  private hintEl = document.getElementById('hint')!;
  private cache: Record<string, string> = {};
  private bannerUntil = 0;
  private level = 0;
  // Near-miss slow motion (real time).
  private clock = 0;
  private scale = 1;
  private slowLeft = 0;
  private slowAt = -99;

  constructor(
    private hud: Hud,
    private audio: Audio,
    private view: SceneView,
    private store: RunStore,
  ) {
    const root = document.getElementById('hud')!;
    const top = document.getElementById('top')!;
    const overlays = document.getElementById('vignette');
    this.scoreEl = make('div', 'ideasScore', root, overlays);
    this.scoreEl.innerHTML = '<span id="ideasScorePop"></span><em></em><b></b>';
    this.scorePop = this.scoreEl.querySelector('span')!;
    this.scoreLabel = this.scoreEl.querySelector('em')!;
    this.scoreVal = this.scoreEl.querySelector('b')!;
    this.banner = make('div', 'ideasBanner', root, overlays);
    // The two washes go under every HUD element, so the fuel bar and the counters stay readable through them.
    this.cold = make('div', 'ideasCold', root, root.firstElementChild);
    this.pulse = make('div', 'ideasPulse', root, root.firstElementChild);
    this.omenEl = make('div', 'ideasOmen', top);
    this.chEl = make('div', 'ideasChallenge', top, document.getElementById('timer'));
    this.omenEl.hidden = this.chEl.hidden = true;
  }

  private set(el: HTMLElement, key: string, value: string, html = false): boolean {
    if (this.cache[key] === value) return false;
    this.cache[key] = value;
    if (html) el.innerHTML = value;
    else el.textContent = value;
    return true;
  }

  private fade(el: HTMLElement, key: string, opacity: number): void {
    const v = opacity.toFixed(3);
    if (this.cache[key] === v) return;
    this.cache[key] = v;
    el.style.opacity = v;
  }

  // ------------------------------------------------------------ 10. slow motion

  /** Factor for the fixed-step accumulator: 35 % for 0.6 s of real time after a near miss, then back to 1. */
  timeScale(dt: number): number {
    const S = IDEAS.slow;
    this.clock += dt;
    if (this.slowLeft > 0) {
      this.slowLeft -= dt;
      this.scale = S.scale;
    } else if (this.scale < 1) this.scale = Math.min(1, this.scale + (dt * (1 - S.scale)) / S.easeSeconds);
    return this.scale;
  }
  private nearMiss(): void {
    const S = IDEAS.slow;
    if (!IDEAS.slowMo || this.clock - this.slowAt < S.cooldown) return;
    this.slowAt = this.clock;
    this.slowLeft = S.seconds;
    this.audio.whoosh();
  }

  // ------------------------------------------------------------ events

  onEvent(e: SimEvent, w: World, now: number): void {
    const hud = this.hud;
    const a = this.audio;
    const s = w.state;
    const I = s.ideas;
    switch (e.type) {
      case 'dusk':
        this.announce(w, now, 7);
        break;
      case 'nightStart': {
        this.announce(w, now, 5.5);
        if (I.omen === 'bell') {
          a.tolls();
          hud.subtitle(t('sBellTolls'), now, true, 'bell');
        }
        const tr = I.tracks;
        if (IDEAS.tracks && tr && tr.found) hud.subtitle(t('sTracksRemind', { d: hud.dirWord(w, Math.cos(tr.angle) * 22, Math.sin(tr.angle) * 22) }), now, false, 'tracks');
        break;
      }
      case 'tracksFound':
        a.pickup();
        hud.toast(t('tTracks'));
        break;
      case 'lure':
        a.clatter(e.x, e.z);
        this.view.ideas.onEvent(e);
        hud.subtitle(t('sLure', { d: hud.dirWord(w, e.x, e.z) }), now, false, 'lure');
        if (e.pulled) hud.subtitle(t('sLurePulled'), now, false, 'lurePulled');
        break;
      case 'blow':
        a.blow();
        hud.toast(t('tBlow', { n: Math.round(e.gain) }));
        break;
      case 'challengeDone':
        a.bank();
        hud.toast(t('tChDone'));
        break;
      case 'challengeFailed':
        hud.toast(t('tChFailed'));
        break;
      case 'score':
        if (e.why === 'resin') hud.toast(t('tResin'));
        if (e.why !== 'night' && e.why !== 'challenge') {
          this.scorePop.textContent = `+${e.n} ${t('why_' + e.why)}`;
          this.scorePop.classList.remove('on');
          void this.scorePop.offsetWidth; // restart the animation
          this.scorePop.classList.add('on');
        }
        break;
      case 'deerMiss':
        if (e.dist < IDEAS.nearMiss) this.nearMiss();
        break;
      case 'denied':
        if (e.why === 'lureScrap' || e.why === 'lureDay') {
          a.deny();
          hud.toast(t(e.why === 'lureScrap' ? 'dLureScrap' : 'dLureDay'));
        }
        break;
    }
  }

  /** Two lines for a few seconds: what tonight's omen does, and the challenge with its reward. */
  private announce(w: World, now: number, seconds: number): void {
    const s = w.state;
    const I = s.ideas;
    if (s.night < IDEAS.omen.firstNight && I.omen === 'calm' && !I.challenge) return;
    if (!IDEAS.omens && !IDEAS.bellNights && !I.challenge) return;
    let html = '';
    if (IDEAS.omens || IDEAS.bellNights) html += `<div class="${I.omen}"><em>${t('omenLabel')}</em>${t('omenText_' + I.omen)}</div>`;
    if (I.challenge) html += `<div><em>${t('chLabel')}</em><b>${t('ch_' + I.challenge)}</b><small>${t('chReward')}</small></div>`;
    this.set(this.banner, 'banner', html, true);
    this.bannerUntil = now + seconds;
  }

  // ------------------------------------------------------------ frame

  frame(w: World, dt: number, now: number, playing: boolean, quiet = false): void {
    const s = w.state;
    const I = s.ideas;
    const night = s.phase === 'night';

    // 1. Threat pulse: only at night, outside protection, while the meter is running.
    let level = 0;
    if (IDEAS.threatPulse && playing && night && !w.playerProtected && s.deer.mode !== 'hidden') level = clamp01(s.deer.threat / RULES.deer.threatTrigger);
    const beat = this.audio.heart(dt, level);
    this.level = level >= this.level ? level : Math.max(level, this.level - dt * 4);
    // With the brightness pulse switched off the edges stay evenly dark instead of throbbing.
    const edge = this.level * (this.view.settings.flash ? 0.16 + 0.66 * beat : 0.42);
    this.fade(this.pulse, 'pulse', edge);
    this.fade(this.cold, 'cold', ((1 - this.scale) / (1 - IDEAS.slow.scale)) * 0.95);

    // 9. Score.
    this.scoreEl.hidden = !IDEAS.score;
    this.set(this.scoreLabel, 'heat', t('heat'));
    this.set(this.scoreVal, 'score', String(s.stats.score));

    // 2 + 7. Omen word to the right of the phase label, from the dusk announcement to dawn.
    const known = nightKnown(w);
    const showOmen = known && s.night >= IDEAS.omen.firstNight && (IDEAS.omens || IDEAS.bellNights);
    this.omenEl.hidden = !showOmen;
    if (showOmen) {
      this.set(this.omenEl, 'omen', t('omen_' + I.omen));
      if (this.cache.omenCls !== I.omen) this.omenEl.className = this.cache.omenCls = I.omen;
      const key = `${this.phaseEl.textContent}|${window.innerWidth}|${document.fonts?.status ?? ''}`;
      if (this.cache.omenAt !== key) {
        this.cache.omenAt = key;
        this.omenEl.style.marginLeft = `${this.phaseEl.offsetWidth / 2}px`;
      }
    }

    // 6. Challenge line under the track, with its progress and a tick box.
    const showCh = known && I.challenge !== '';
    this.chEl.hidden = !showCh;
    if (showCh) {
      const C = IDEAS.challenge;
      let prog = '';
      if (I.challenge === 'bothTags') prog = `${Math.min(2, I.nightBanked)}/2`;
      else if (I.challenge === 'outside') prog = `${Math.min(C.outsideSeconds, Math.floor(I.outsideTicks / TICK_HZ))}/${C.outsideSeconds}`;
      else if (I.challenge === 'lateFeed' && night) prog = `${Math.min(C.lateFeedSecond, Math.floor(s.t))}/${C.lateFeedSecond}`;
      const state = I.challengeFailed ? 'failed' : I.challengeDone ? 'done' : '';
      this.set(this.chEl, 'ch', `<i class="ideas-box"></i><span>${t('ch_' + I.challenge)}</span>${prog && !state ? `<small>${prog}</small>` : ''}`, true);
      if (this.cache.chCls !== state) this.chEl.className = this.cache.chCls = state;
    }

    const bannerOn = now < this.bannerUntil && (s.phase === 'day' || night);
    if (this.cache.bannerOn !== String(bannerOn)) {
      this.cache.bannerOn = String(bannerOn);
      this.banner.classList.toggle('on', bannerOn);
    }

    if (playing && !quiet) this.hints(w, now, bannerOn);
  }

  /** One-time discoverability: each hint is shown once ever, and never over another hint. */
  private hints(w: World, now: number, bannerOn: boolean): void {
    const s = w.state;
    const I = s.ideas;
    const seen = this.store.profile.hintsSeen;
    const show = (id: string, seconds: number, urgent = false) => {
      if (seen.includes(id)) return;
      if (!urgent && (bannerOn || this.hintEl.classList.contains('on'))) return;
      this.hud.setHint(t('hint' + id), now, seconds);
      seen.push(id);
      this.store.saveProfile();
    };
    if (IDEAS.emberBlow && canBlow(w)) show('Blow', 7, true);
    if (s.phase === 'night') {
      if (IDEAS.lure && s.t > 7 && s.player.scrap >= IDEAS.lureRule.cost) show('Lure', 8);
    } else if (s.phase === 'day' && s.dayStarted && s.t > 6 && s.t < 50) {
      const snag = I.resinSnag >= 0 ? w.forest.snags[I.resinSnag] : undefined;
      if (IDEAS.resinPine && snag && s.snagLogs[I.resinSnag] > 0 && inView(w, snag, 20, 0.9)) show('Resin', 7);
      const tr = I.tracks;
      if (IDEAS.tracks && tr && !tr.found && inView(w, tr, 13, 0.82)) show('Tracks', 7);
    }
  }
}

// ------------------------------------------------------------ hooks for hud.ts

interface Prompt {
  key: string;
  text: string;
  off: boolean;
  prog: number;
}

/** 8. The fire prompt of the ember blow: "E  hold · blow on the embers +8" with the hold bar. */
export function ideasPrompt(w: World, p: Prompt): Prompt {
  const f = w.focus;
  if (!f || f.kind !== 'fire' || f.info !== 'blow' || w.state.player.bench) return p;
  return { key: 'E', text: `${t('hChop')} · ${t('hBlow')}`, off: false, prog: w.state.ideas.blowHold / IDEAS.blow.holdSeconds };
}

/** Extra lines on the screens the HUD has just built: score, dawn rewards, four-card layout, controls. */
export function decorateScreen(kind: ScreenKind, el: HTMLElement, w: World | null, profile: Profile): void {
  const box = el.querySelector('.box');
  if (!box) return;
  const line = (cls: string, html: string, before: Element | null) => {
    const p = document.createElement('p');
    p.className = cls;
    p.innerHTML = html;
    box.insertBefore(p, before);
  };
  if (kind === 'title' || kind === 'pause') {
    const controls = box.querySelector('.controls');
    if (controls) {
      if (IDEAS.lure) controls.insertAdjacentHTML('beforeend', `<span>${t('ctlLure')}</span>`);
      if (IDEAS.emberBlow) controls.insertAdjacentHTML('beforeend', `<span>${t('ctlBlow')}</span>`);
    }
    if (kind === 'title' && IDEAS.score && profile.bestScore > 0) {
      // Next to the best night when that line is there, so the title column does not grow.
      const fine = box.querySelector('p.fine');
      if (fine) fine.insertAdjacentText('beforeend', ` · ${t('scoreBest', { n: profile.bestScore })}`);
      else line('fine', t('scoreBest', { n: profile.bestScore }), null);
    }
    return;
  }
  const s = w?.state;
  if (!s) return;
  const I = s.ideas;
  const score = IDEAS.score ? `<b>${t('scoreLine', { n: s.stats.score })}</b>` : '';
  if (kind === 'draft') {
    const cards = box.querySelector('.cards');
    cards?.classList.toggle('four', (s.hand?.length ?? 0) >= 4);
    let html = score;
    if (I.challenge) html += challengeWon(I) ? `<span class="won">${t('dawnFour')}</span>` : `<span class="won failed">${t('dawnMissed')}: ${t('ch_' + I.challenge)}</span>`;
    if (I.dawnRare) html += `<span class="won">${t('dawnRare')}</span>`;
    if (html) line('ideas-dawn', html, cards);
  } else if (kind === 'chapter') {
    if (score) line('ideas-dawn', score, box.querySelector('.chips') ?? box.querySelector('.btns'));
  } else if (kind === 'end' || kind === 'victory') {
    if (!IDEAS.score) return;
    const best = profile.bestScore;
    const isNew = s.stats.score > 0 && s.stats.score >= best;
    line('ideas-score', `${t('scoreLine', { n: s.stats.score })}<small class="${isNew ? 'new' : ''}">${isNew ? t('scoreNew') : t('scoreBest', { n: best })}</small>`, box.querySelector('.chips') ?? box.querySelector('.btns'));
  }
}
