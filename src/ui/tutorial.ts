// First-run tutorial: one keeper's note at a time on the left of the screen and
// an amber marker over the thing it talks about. It runs inside the real first
// day and night, never pauses the game, never opens a panel and never takes
// input. The script is the pure reducer in tutorialFlow.ts; this file owns the
// DOM, feeds the reducer once per frame and only reads the simulation.

import './tutorial.css';
import './tutorialStrings';
import { type RunStore, track } from '../platform/store';
import { RULES } from '../sim/rules';
import type { SimEvent } from '../sim/types';
import type { World } from '../sim/world';
import type { ScreenKind } from './hud';
import { getLang, t } from './i18n';
import { type Flow, type Outcome, type StepId, isUrgent, nextStep, startFlow } from './tutorialFlow';

export interface TutorialHost {
  /** Profile and settings; completion is written here. */
  store: RunStore;
  /** SceneView.project: world point → normalised screen coordinates. */
  project(x: number, y: number, z: number): { x: number; y: number; behind: boolean };
  /** Soft sound for a ticked-off step. */
  sound(): void;
  /** Drop an old centre hint left over from the previous run (Hud.clearHint). */
  hush(): void;
}

/** Card timing, seconds of play. */
const TICK_HOLD = 0.8; // the tick stays this long before the line fades
const READ_MIN = 2.2; // …but a line is never gone sooner than this after it appeared
const FADE = 0.3;
const GAP = 0.3; // fade + gap = 0.6 s before the next line slides in
const SWIFT = 0.14; // urgent lines cut in at once

const TEXT: Record<StepId, string> = {
  chop: 'tutChop',
  feed: 'tutFeed',
  stock: 'tutStock',
  scrap: 'tutScrap',
  bench: 'tutBench',
  trap: 'tutTrap',
  dusk: 'tutDusk',
  ring: 'tutRing',
  beam: 'tutBeam',
  take: 'tutTake',
  carry: 'tutCarry',
  closed: 'tutClosed',
  hunt: 'tutHunt',
  weak: 'tutWeak',
  draft: 'tutDraft',
  farewell: 'tutFarewell',
};

/** What the marker hangs over; `kind`/`id` match World.focus so the centre prompt can take over. */
interface Target {
  kind: 'snag' | 'fire' | 'scrap' | 'bench' | 'cache';
  id: number;
  x: number;
  y: number;
  z: number;
  /** The goal is the ember ring, not the fire itself: gone as soon as the player is protected. */
  ring?: boolean;
}

const div = (id: string, html = ''): HTMLDivElement => {
  const el = document.createElement('div');
  if (id) el.id = id;
  el.innerHTML = html;
  return el;
};

/**
 * Characters a row of the note is sure to hold (a 23u card in 0.95u monospace, less its padding),
 * and the same for the last row, which also carries the tick.
 */
const ROW = 36;
const ROW_TICK = 34;
/** Rough width in characters; a key cap is about two characters wider than its label. */
const span = (s: string) => s.replace(/<([^<>]+)>/g, '$1  ').length;

/**
 * A line as one row, or split in two where it reads best: after a sentence if both halves fit,
 * else after a dash, colon or comma, else as evenly as possible. Lines too long for two rows are
 * left to wrap by themselves.
 */
function rows(text: string): string[] {
  if (span(text) <= ROW_TICK) return [text];
  const words = text.split(' ');
  let best = 0;
  let bestCost = Infinity;
  for (let k = 1; k < words.length; k++) {
    const a = span(words.slice(0, k).join(' '));
    const b = span(words.slice(k).join(' '));
    if (a > ROW || b > ROW_TICK) continue;
    const end = words[k - 1];
    const cost = Math.abs(a - b) - (/[.!?…]$/.test(end) ? 100 : /[—:,;]$/.test(end) ? 20 : 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = k;
    }
  }
  return best ? [words.slice(0, best).join(' '), words.slice(best).join(' ')] : [text];
}

/**
 * Text with `<E>`-style tokens turned into key caps. A cap is an inline box, and a no-break space
 * alone does not hold a box to its neighbours, so every space-separated chunk that carries a cap
 * (and the last chunk, which carries the tick) is kept whole with `nowrap`.
 */
function caps(el: HTMLElement, text: string, tick?: HTMLElement): void {
  const chunks = text.split(' ');
  chunks.forEach((chunk, i) => {
    if (i) el.append(' ');
    const last = !!tick && i === chunks.length - 1;
    if (!chunk.includes('<') && !last) {
      el.append(chunk);
      return;
    }
    const hold = document.createElement('span');
    hold.style.whiteSpace = 'nowrap';
    chunk.split(/<([^<>]+)>/).forEach((part, k) => {
      if (k % 2 === 0) hold.append(part);
      else {
        const key = document.createElement('span');
        key.className = 'key';
        key.textContent = part;
        hold.append(key);
      }
    });
    if (last) hold.append('\u00A0', tick);
    el.append(hold);
  });
}

/**
 * Write a line into an element. With `tick` (the note card) the line is laid out in rows and the
 * tick follows the last word: its place is always reserved, so drawing it never re-wraps the text.
 */
function fill(el: HTMLElement, text: string, tick?: HTMLElement): void {
  el.textContent = '';
  const list = tick ? rows(text) : [text];
  list.forEach((row, i) => {
    let into = el;
    if (list.length > 1) {
      into = document.createElement('span');
      into.className = 'row';
      if (i) el.append(' ');
      el.append(into);
    }
    caps(into, row, i === list.length - 1 ? tick : undefined);
  });
}

export class Tutorial {
  private card = div(
    'tut',
    '<div class="line"></div>' +
      '<div class="keys"><span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span></div>',
  );
  private line = this.card.querySelector<HTMLElement>('.line')!;
  private tick = document.createElement('span');
  private mark = div('tutMark', '<i class="arrow"></i><i class="gem"></i><span class="dist"></span>');
  private dist = this.mark.querySelector<HTMLElement>('.dist')!;
  private arrow = this.mark.querySelector<HTMLElement>('.arrow')!;
  private draftLine = div('');

  private world: World | null = null;
  private flow: Flow | null = null;
  private events: SimEvent[] = [];
  /** The line in the card and where it is in its life. */
  private shown: StepId | null = null;
  private stage: 'idle' | 'on' | 'tick' | 'out' = 'idle';
  private timer = 0;
  private gap = 0;
  private written = '';
  private lang = getLang();
  private sticky = -1;
  private distText = '';

  constructor(private host: TutorialHost) {
    this.draftLine.className = 'tut-draft';
    this.tick.className = 'tick';
    this.tick.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.8 6.6l2.9 2.9L10.2 3"/></svg>';
    document.getElementById('hud')?.append(this.card, this.mark);
  }

  /** While true the old first-minute hints stay silent: the notes replace them. */
  get active(): boolean {
    return !!this.flow && !this.flow.complete && !this.flow.over;
  }

  /** Settings row: off hides the tutorial at once, on arms it again for the next new run. */
  toggle(): void {
    const p = this.host.store.profile;
    p.settings.tutorial = !p.settings.tutorial;
    if (p.settings.tutorial) p.tutorialDone = false;
    else this.drop();
    this.host.store.saveProfile();
  }

  onEvent(e: SimEvent): void {
    if (this.flow) this.events.push(e);
  }

  /** Once per rendered frame, after the scene and the HUD. */
  frame(w: World, screen: ScreenKind, dt: number): void {
    if (w !== this.world) this.attach(w);
    const prev = this.flow;
    if (!prev) return;
    const s = w.state;
    const pl = s.player;
    const inPlay = screen === 'none' && (s.phase === 'day' || s.phase === 'night');
    const play = inPlay ? dt : 0;
    const visible = prev.current === 'draft' ? (this.draftLine.isConnected ? 'draft' : null) : inPlay && this.stage === 'on' ? this.shown : null;
    const out = nextStep(prev, {
      dt: play,
      phase: s.phase,
      night: s.night,
      t: s.t,
      logs: pl.logs,
      scrap: pl.scrap,
      traps: pl.traps,
      tags: pl.tags,
      protected: w.playerProtected,
      bright: s.bright,
      moved: Math.hypot(pl.x - w.forest.spawn.x, pl.z - w.forest.spawn.z) > 0.4,
      visible,
      events: this.events,
    });
    this.events = [];
    this.flow = out.flow;
    for (const c of out.completed) track('tutorial_step', c.shown ? { id: c.id } : { id: c.id, ahead: true });
    if (out.finished) {
      // The first dawn's card is picked: remembered in the profile, and the switch turns itself off.
      const p = this.host.store.profile;
      p.tutorialDone = true;
      p.settings.tutorial = false;
      this.host.store.saveProfile();
      track('tutorial_done');
    }
    if (getLang() !== this.lang) {
      this.lang = getLang();
      this.written = this.distText = '';
      this.draftLine.remove();
    }
    this.stepCard(out, w, play);
    this.stepDraft(screen);
    this.stepMarker(w, inPlay);
  }

  // ------------------------------------------------------------ run binding

  /** A new World object means a new or continued run. */
  private attach(w: World): void {
    this.world = w;
    this.drop();
    const p = this.host.store.profile;
    const s = w.state;
    if (!p.settings.tutorial || p.tutorialDone) return;
    if (s.night !== 1 || (s.phase !== 'day' && s.phase !== 'night' && s.phase !== 'draft')) return;
    // A run saved during its first day or night picks the script up where the player left it.
    const known: StepId[] = [];
    const chops = s.choppedOnce ? Math.max(1, Math.floor(s.stats.logsChopped / 2)) : 0;
    if (s.fedOnce) known.push('feed');
    if (s.player.scrap > 0 || s.scrapLeft.some((n) => n < 2)) known.push('scrap');
    if (s.traps.length > 0) known.push('bench', 'trap');
    if (s.stats.cachesClaimed > 0) known.push('beam', 'take');
    if (s.stats.tagsBanked > 0) known.push('carry');
    this.flow = startFlow(known, chops, s.dayStarted);
    this.host.hush();
  }

  private drop(): void {
    this.flow = null;
    this.events = [];
    this.shown = null;
    this.stage = 'idle';
    this.timer = 0;
    this.written = '';
    this.card.className = '';
    this.mark.className = '';
    this.draftLine.remove();
  }

  // ------------------------------------------------------------ the note

  private stepCard(out: Outcome, w: World, dt: number): void {
    const flow = out.flow;
    const want = flow.current === 'draft' ? null : flow.current;
    const urgent = isUrgent(want);
    switch (this.stage) {
      case 'on':
        if (out.completed.some((c) => c.id === this.shown && c.kind === 'act')) {
          // Ticked off: the mark, a soft sound, and long enough on screen to have been read.
          this.stage = 'tick';
          this.timer = Math.max(TICK_HOLD, READ_MIN - (flow.seen[this.shown!] ?? 0));
          this.card.classList.add('done');
          this.card.classList.remove('wasd');
          this.host.sound();
        } else if (want !== this.shown) this.leave(urgent);
        else {
          this.write(this.shown!, w);
          this.card.classList.toggle('wasd', out.wasd);
        }
        break;
      case 'tick':
        this.timer -= dt;
        if (urgent) this.timer = Math.min(this.timer, 0.2);
        if (this.timer <= 0) this.leave(urgent);
        break;
      case 'out':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.shown = null;
          this.stage = 'idle';
          this.timer = this.gap;
        }
        break;
      case 'idle':
        this.timer -= dt;
        if (want && (this.timer <= 0 || urgent)) {
          this.shown = want;
          this.stage = 'on';
          this.sticky = -1;
          this.written = '';
          this.write(want, w);
          this.card.classList.remove('done', 'wasd');
          this.card.classList.toggle('swift', urgent);
          this.card.classList.add('on');
        }
        break;
    }
  }

  private leave(swift: boolean): void {
    this.stage = 'out';
    this.timer = swift ? SWIFT : FADE;
    this.gap = swift ? 0 : GAP;
    this.card.classList.toggle('swift', swift);
    this.card.classList.remove('on');
  }

  private write(id: StepId, w: World): void {
    const s = w.state;
    const key = id === 'dusk' && s.phase === 'night' ? 'tutDuskLate' : TEXT[id];
    if (key === this.written) return;
    this.written = key;
    fill(this.line, t(key, { n: RULES.cycle.lastNight - s.stats.nightsSurvived }), this.tick);
  }

  /** (m) One small line above the cards of the first dawn. The draft screen is rebuilt by the HUD, so it is put back whenever it is missing. */
  private stepDraft(screen: ScreenKind): void {
    if (this.flow?.current !== 'draft' || screen !== 'draft') {
      this.draftLine.remove();
      return;
    }
    if (this.draftLine.isConnected) return;
    const box = document.querySelector('#screen .box');
    if (!box) return;
    fill(this.draftLine, t('tutDraft'));
    box.insertBefore(this.draftLine, box.querySelector('.cards'));
  }

  // ------------------------------------------------------------ the marker

  private target(step: StepId, w: World): Target | null {
    const s = w.state;
    const f = w.forest;
    const fire: Target = { kind: 'fire', id: 0, x: 0, y: 1.45, z: 0 };
    switch (step) {
      case 'chop':
      case 'stock': {
        const i = step === 'chop' && s.snagLogs[0] > 0 ? 0 : this.nearest(w, f.snags, s.snagLogs);
        return i < 0 ? null : { kind: 'snag', id: i, x: f.snags[i].x, y: 2.05, z: f.snags[i].z };
      }
      case 'scrap': {
        const i = this.nearest(w, f.scrap, s.scrapLeft);
        return i < 0 ? null : { kind: 'scrap', id: i, x: f.scrap[i].x, y: 0.85, z: f.scrap[i].z };
      }
      case 'bench':
        return { kind: 'bench', id: 0, x: f.bench.x, y: 1.2, z: f.bench.z };
      case 'feed':
      case 'carry':
      case 'weak':
        return fire;
      case 'dusk':
      case 'hunt':
        return { ...fire, ring: true };
      case 'beam':
      case 'take': {
        const p = f.posts[this.flow?.post ?? -1];
        return p ? { kind: 'cache', id: p.id, x: p.x, y: 2.1, z: p.z } : null;
      }
      default:
        return null;
    }
  }

  /** Nearest node that still has something; the previous pick is kept unless another is clearly closer. */
  private nearest(w: World, nodes: readonly { x: number; z: number }[], left: readonly number[]): number {
    const p = w.state.player;
    const far = (i: number) => Math.hypot(nodes[i].x - p.x, nodes[i].z - p.z);
    let best = -1;
    for (let i = 0; i < nodes.length; i++) if (left[i] > 0 && (best < 0 || far(i) < far(best))) best = i;
    const k = this.sticky;
    if (best >= 0 && k >= 0 && k < nodes.length && left[k] > 0 && far(k) < far(best) + 2) return k;
    return (this.sticky = best);
  }

  private stepMarker(w: World, inPlay: boolean): void {
    const m = this.mark;
    const tg = inPlay && this.stage === 'on' && this.shown ? this.target(this.shown, w) : null;
    if (!tg) {
      m.classList.remove('on');
      return;
    }
    const p = w.state.player;
    const dx = tg.x - p.x;
    const dz = tg.z - p.z;
    const d = Math.hypot(dx, dz);
    // Up close and in view the centre prompt takes over.
    const facing = d < 0.05 ? 1 : (dx * -Math.sin(p.yaw) + dz * -Math.cos(p.yaw)) / d;
    const focused = w.focus?.kind === tg.kind && w.focus.id === tg.id;
    if (focused || (d < 2.5 && facing > 0.8) || (tg.ring && w.playerProtected)) {
      m.classList.remove('on');
      return;
    }

    const hud = m.parentElement!;
    const W = hud.clientWidth;
    const H = hud.clientHeight;
    const u = Math.max(11, Math.min(19, W * 0.0145)); // --u of style.css
    // The marker stays inside this box: clear of the phase label above and the fuel row below.
    const left = u * 2.4;
    const right = W - u * 2.4;
    const top = H * 0.15;
    const bottom = H * 0.8;
    const cx = W / 2;
    const cy = H / 2;
    const n = this.host.project(tg.x, tg.y, tg.z);
    let x = cx + n.x * cx;
    let y = cy - n.y * cy;
    let edge = n.behind || x < left || x > right || y < top || y > bottom;
    let ang = 0;
    if (edge) {
      // Off screen: slide along the ray from the centre to the border of the box.
      let vx = x - cx;
      let vy = y - cy;
      // Behind the camera the way round is sideways, and "behind" reads as down.
      if (n.behind) vy = Math.abs(vy) + H * 0.25;
      const k = Math.min(vx > 0 ? (right - cx) / vx : vx < 0 ? (left - cx) / vx : Infinity, vy > 0 ? (bottom - cy) / vy : vy < 0 ? (top - cy) / vy : Infinity);
      x = cx + vx * k;
      y = cy + vy * k;
      ang = Math.atan2(vy, vx);
    }
    // Never on top of the note: step aside and point at the real spot.
    const c = this.card;
    const pad = u * 1.3;
    if (this.stage !== 'idle' && x < c.offsetLeft + c.offsetWidth + pad && y > c.offsetTop - pad && y < c.offsetTop + c.offsetHeight + pad) {
      const tx = x;
      const ty = y;
      const below = c.offsetTop + c.offsetHeight + pad;
      const above = c.offsetTop - pad;
      const side = c.offsetLeft + c.offsetWidth + pad;
      if (!edge && side - x < Math.min(y - above, below - y)) x = side;
      else y = y - above < below - y && above > top ? above : below;
      if (!edge) ang = Math.atan2(ty - y, tx - x);
      edge = true;
    }
    m.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    this.arrow.style.transform = `rotate(${ang.toFixed(3)}rad) translateX(0.9em)`;
    m.classList.toggle('edge', edge);
    m.classList.toggle('flip', x > W - u * 8);
    const text = t('tutMeters', { n: Math.max(1, Math.round(d)) });
    if (text !== this.distText) this.dist.textContent = this.distText = text;
    m.classList.add('on');
  }
}
