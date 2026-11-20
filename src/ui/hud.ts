// HTML/CSS HUD and screens. Text comes from i18n, numbers from the simulation
// and the card table; shape and hatching back up every colour signal.

import { CARD_BY_ID, RULES, STAGES } from '../sim/rules';
import type { RunState } from '../sim/types';
import type { World } from '../sim/world';
import { canReroll } from '../sim/draft';
import type { Profile } from '../platform/store';
import { CARD_ART } from './cardArt';
import { getLang, statLabel, t, val } from './i18n';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const svg = (body: string, vb = '0 0 24 24') => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
const ICON = {
  flame: svg('<path d="M12 3c1 3 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.3 1.4 1 2 1.6 2.2C10.2 8.5 11 5.5 12 3z"/><path d="M12 14.5c.8 1 1.6 1.7 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-1.2.8-1.9 1.6-2.9z"/>'),
  logs: svg('<path d="M3 15.5l11-5.5 3.5 2-11 5.5z"/><ellipse cx="18.5" cy="11" rx="2.2" ry="2.6" transform="rotate(-25 18.5 11)"/><path d="M4 10.5l9-4.5 3 1.7"/><path d="M6.5 18.5l9-4.5"/>'),
  scrap: svg('<path d="M4 17l5-9 4 3 3-6 4 12z"/><path d="M9 8l-1 9M13 11l1 6"/>'),
  berry: svg('<circle cx="8" cy="15" r="3.2"/><circle cx="15.5" cy="14" r="3.2"/><path d="M8 11.8C9 8 11 5.5 14 4M15.5 10.8C15 8 14.5 6 14 4"/>'),
  trap: svg('<path d="M3 15h18"/><path d="M4 15l2-5 2 5 2-5 2 5 2-5 2 5 2-5 2 5"/><path d="M6 18h12"/>'),
  flare: svg('<path d="M6 19l8-8"/><path d="M12 9l3 3"/><path d="M17 3v3M21 7h-3M19.5 4.5l-1.6 1.6"/>'),
  tag: svg('<path d="M8 6h8l2 3v9H6V9z"/><circle cx="12" cy="9.5" r="1"/><path d="M12 3v3"/>'),
};

export type Action =
  | 'play'
  | 'continue'
  | 'new'
  | 'resume'
  | 'title'
  | 'lang'
  | 'shake'
  | 'flash'
  | 'subs'
  | 'low'
  | 'tutorial' // settings row of the first-run tutorial (src/ui/tutorial.ts)
  | 'skip'
  | 'reroll'
  | 'nextDay'
  | 'endSession'
  | 'revive'
  | 'endRun'
  | 'again'
  | 'saveFrame';

export type ScreenKind = 'none' | 'title' | 'pause' | 'draft' | 'replace' | 'chapter' | 'session' | 'death' | 'end' | 'victory';

export interface UiHandlers {
  action(a: Action): void;
  card(i: number): void;
  replace(slot: number): void;
  volume(kind: 'volume' | 'effects', v: number): void;
}

interface Sub {
  kind: string;
  text: string;
  until: number;
  alarm: boolean;
}

export class Hud {
  private cache: Record<string, string> = {};
  private subs: Sub[] = [];
  private hint = '';
  private hintUntil = 0;
  private vitalSeen = { hp: 100, st: 100, bt: 100 };
  private vitalAt = { hp: -9, st: -9, bt: -9 };
  private screenKey = '';
  screen: ScreenKind = 'none';
  focusCard = 0;
  showSubs = true;

  constructor(private h: UiHandlers) {
    const scr = $('screen');
    scr.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-card],[data-slot]');
      if (!el) return;
      if (el.dataset.act) this.h.action(el.dataset.act as Action);
      else if (el.dataset.card) this.h.card(Number(el.dataset.card));
      else if (el.dataset.slot) this.h.replace(Number(el.dataset.slot));
    });
    scr.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement;
      if (el.dataset.vol) this.h.volume(el.dataset.vol as 'volume' | 'effects', Number(el.value));
    });
    scr.addEventListener('mousemove', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-card]');
      if (el && Number(el.dataset.card) !== this.focusCard) this.setFocusCard(Number(el.dataset.card));
    });
    const track = $('track');
    for (const st of STAGES.slice(1)) {
      const i = document.createElement('i');
      i.style.left = `${((st.firstNight - 1) / 98) * 100}%`;
      track.appendChild(i);
    }
    this.buildBottom();
  }

  private set(id: string, prop: 'text' | 'html' | 'class' | 'style', value: string): void {
    const key = id + prop;
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    const el = $(id);
    if (!el) return;
    if (prop === 'text') el.textContent = value;
    else if (prop === 'html') el.innerHTML = value;
    else if (prop === 'class') el.className = value;
    else el.setAttribute('style', value);
  }

  private buildBottom(): void {
    $('bottom').innerHTML =
      `<div class="fuel" id="fuel">${ICON.flame}<div class="bar"><i id="fuelFill"></i><span class="gain" id="fuelGain"></span>` +
      `<b style="left:${(RULES.fire.weakAt / RULES.fire.max) * 100}%"></b><b style="left:${(RULES.fire.brightAt / RULES.fire.max) * 100}%"></b></div></div>` +
      `<div class="sep"></div>` +
      (['logs', 'scrap', 'berry', 'trap', 'flare', 'tag'] as const).map((k) => `<div class="item" id="i_${k}">${ICON[k]}<span id="n_${k}">0</span></div>`).join('');
    $('vitals').innerHTML = (['hp', 'st', 'bt'] as const)
      .map((k) => `<div class="vital ${k}" id="v_${k}"><span id="vl_${k}"></span><div class="bar"><i id="vf_${k}"></i></div></div>`)
      .join('');
  }

  relabel(): void {
    this.cache = {};
    this.screenKey = '';
    // Lines already on screen were written in the previous language.
    this.subs = [];
    this.hintUntil = 0;
    document.getElementById('toasts')!.innerHTML = '';
  }

  // ------------------------------------------------------------ transient text

  /** `kind` groups lines that replace each other (e.g. steps heard from a new side). */
  subtitle(text: string, now: number, alarm = false, kind = text): void {
    if (!this.showSubs) return;
    const same = this.subs.find((x) => x.kind === kind);
    if (same) {
      same.text = text;
      same.alarm = alarm;
      same.until = now + 2.2;
      return;
    }
    this.subs.push({ text, until: now + 2.4, alarm, kind });
    if (this.subs.length > 3) this.subs.shift();
  }
  toast(text: string): void {
    const box = $('toasts');
    for (const old of Array.from(box.children)) if (old.textContent === text) old.remove();
    const el = document.createElement('div');
    el.textContent = text;
    box.appendChild(el);
    while (box.children.length > 4) box.firstElementChild!.remove();
    setTimeout(() => el.remove(), 3000);
  }
  setHint(text: string, now: number, seconds = 5): void {
    this.hint = text;
    this.hintUntil = now + seconds;
  }
  clearHint(): void {
    this.hintUntil = 0;
  }

  /** Where a world point is relative to the player's view: ahead / left / right / behind. */
  dirWord(w: World, x: number, z: number): string {
    const pl = w.state.player;
    const dx = x - pl.x;
    const dz = z - pl.z;
    const fx = -Math.sin(pl.yaw);
    const fz = -Math.cos(pl.yaw);
    const fwd = dx * fx + dz * fz;
    const right = dx * -fz + dz * fx;
    if (Math.abs(fwd) >= Math.abs(right)) return t(fwd >= 0 ? 'sAhead' : 'sBehind');
    return t(right >= 0 ? 'sRight' : 'sLeft');
  }

  // ------------------------------------------------------------ per-frame

  update(w: World, now: number, flash: number, flashOn: boolean): void {
    const s = w.state;
    const pl = s.player;
    const night = s.phase === 'night' || s.phase === 'deathOffer';
    const label = s.phase === 'draft' || s.phase === 'victory' ? t('dawn') : night ? t('night') : t('day');
    this.set('phase', 'text', `${label} ${s.night} / ${RULES.cycle.lastNight}`);
    this.set('trackPos', 'style', `left:${((s.night - 1) / 98) * 100}%`);
    const len = s.phase === 'night' ? RULES.cycle.nightSeconds : RULES.cycle.daySeconds;
    const left = len - s.t;
    const showTimer = (s.phase === 'day' || s.phase === 'night') && s.dayStarted && left <= 10;
    this.set('timer', 'text', showTimer ? String(Math.max(0, Math.ceil(left))) : '');
    this.set('timer', 'class', showTimer && s.phase === 'day' ? 'warn' : '');

    // Fuel with marks at 24 (weak) and 30 (bright again); hatching doubles the colour.
    this.set('fuelFill', 'style', `width:${(s.fuel / RULES.fire.max) * 100}%`);
    this.set('fuel', 'class', `fuel${s.bright ? '' : ' weak'}`);
    const f = w.focus;
    const gain = f && f.kind === 'fire' && f.usable ? Math.min(w.mods.fuelPerLog, RULES.fire.max - s.fuel) : 0;
    this.set('fuelGain', 'style', `left:${(s.fuel / RULES.fire.max) * 100}%;width:${(gain / RULES.fire.max) * 100}%`);
    const counts: Record<string, number> = { logs: pl.logs, scrap: pl.scrap, berry: pl.berries, trap: pl.traps, flare: pl.flares, tag: pl.tags };
    for (const k in counts) {
      this.set(`n_${k}`, 'text', String(counts[k]));
      const hide = counts[k] === 0 && k !== 'logs';
      this.set(`i_${k}`, 'class', `item${counts[k] === 0 ? ' zero' : ''}`);
      this.set(`i_${k}`, 'style', hide && (k === 'tag' || k === 'trap' || k === 'berry' || k === 'scrap') ? 'display:none' : '');
    }

    // Vitals unfold when they change.
    const vit: Record<'hp' | 'st' | 'bt', [number, string, boolean]> = {
      hp: [pl.hp, t('hp'), pl.hp <= 40],
      st: [pl.stamina, t('stamina'), pl.exhausted],
      bt: [pl.battery, t('battery'), pl.battery < 15],
    };
    for (const k of ['hp', 'st', 'bt'] as const) {
      const [v, name, low] = vit[k];
      if (Math.abs(v - this.vitalSeen[k]) > 0.01) {
        this.vitalSeen[k] = v;
        this.vitalAt[k] = now;
      }
      const on = now - this.vitalAt[k] < 3 || low || (k === 'hp' && v < 100);
      this.set(`v_${k}`, 'class', `vital ${k}${on ? ' on' : ''}${low ? ' low' : ''}`);
      this.set(`vf_${k}`, 'style', `width:${v}%`);
      this.set(`vl_${k}`, 'text', name);
    }

    // One context prompt in the centre.
    let key = '';
    let text = '';
    let off = false;
    let prog = 0;
    if (pl.bench) {
      /* the bench panel replaces the prompt */
    } else if (f) {
      off = !f.usable;
      if (f.kind === 'snag') {
        key = getLang() === 'ru' ? 'ЛКМ' : 'LMB';
        text = f.usable ? `${t('hChop')} · ${t('hChopLabel')}` : t('hFull');
        prog = pl.chop / w.mods.chopSeconds;
      } else if (f.kind === 'fire') {
        key = 'E';
        text = f.info === 'fireFull' ? t('hFireFull') : f.info === 'noLogs' ? t('hNoLogs') : `${f.info}`;
      } else if (f.kind === 'scrap' || f.kind === 'bush') {
        key = 'E';
        text = f.usable ? `${t('hTake')} · ${t(f.kind === 'scrap' ? 'hScrap' : 'hBerry')}` : t('hFull');
        prog = pl.pick / RULES.player.pickupSeconds;
      } else if (f.kind === 'cache') {
        key = f.usable ? 'E' : 'F';
        text = f.usable ? `${t('hCache')} · ${f.info === 'scrap' ? t('tScrap', { n: 2 }) : t('tFlare')}` : t('hNeedLight');
        off = false;
      } else if (f.kind === 'bench') {
        key = 'E';
        text = t('hBench');
      }
    }
    const ghost = w.trapGhost;
    if (ghost && !ghost.ok && pl.trapHold >= 0) {
      // Say why the trap cannot be set instead of failing silently.
      key = 'Q';
      off = true;
      prog = 0;
      text = s.traps.length >= RULES.limits.placedTraps ? t('hTrapLimit') : pl.traps <= 0 && pl.scrap < w.mods.trapCost ? t('hTrapNoScrap') : t('hTrapSpot');
    } else if (pl.trapHold > 0) {
      key = 'Q';
      text = t('rTrap');
      prog = pl.trapHold / RULES.trap.placeSeconds;
      off = false;
    }
    if (pl.eat > 0) prog = pl.eat / RULES.player.eatSeconds;
    const active = s.phase === 'day' || s.phase === 'night';
    $('prompt').hidden = !key || !active;
    this.set('promptKey', 'text', key);
    this.set('promptText', 'text', text);
    this.set('prompt', 'class', off ? 'off' : '');
    this.set('promptBar', 'class', prog > 0 ? 'on' : '');
    (document.querySelector('#promptBar i') as HTMLElement).style.width = `${Math.min(1, prog) * 100}%`;

    // Workbench panel.
    const bench = $('bench');
    bench.hidden = !pl.bench;
    if (pl.bench) {
      const rows: [number, string, number][] = [
        [1, t('rTrap'), w.mods.trapCost],
        [2, t('rFlare'), RULES.flare.cost],
        [3, t('rBattery'), RULES.recharge.cost],
      ];
      const need = pl.craft === 3 ? RULES.recharge.seconds : RULES.trap.craftSeconds;
      this.set(
        'bench',
        'html',
        `<h3>${t('bench')}</h3>` +
          rows
            .map(
              ([n, name, cost]) =>
                `<div class="row${w.canCraft(n) ? '' : ' off'}"><span class="key">${n}</span><span>${name}</span><span class="cost">${t('scrapCost', { n: cost })}</span>` +
                (pl.craft === n ? `<i class="prog" style="width:${Math.round((pl.craftT / need) * 20) * 5}%"></i>` : '') +
                `</div>`,
            )
            .join('') +
          `<p>${t('close')}</p>`,
      );
    }

    this.set('hint', 'text', this.hint);
    this.set('hint', 'class', now < this.hintUntil && active ? 'on' : '');
    this.subs = this.subs.filter((x) => x.until > now);
    this.set('subs', 'html', this.subs.map((x) => `<div class="${x.alarm ? 'alarm' : ''}">${x.text}</div>`).join(''));

    $('vignette').style.opacity = String(Math.min(1, (pl.hp < 100 ? (1 - pl.hp / 100) * 0.8 : 0) + flash * 0.6));
    $('flash').style.opacity = flashOn ? String(flash * 0.22) : '0';
  }

  // ------------------------------------------------------------ screens

  setFocusCard(i: number): void {
    this.focusCard = i;
    document.querySelectorAll('.card').forEach((el, k) => el.classList.toggle('focus', k === i));
  }

  private cardHtml(id: string, i: number): string {
    const c = CARD_BY_ID[id];
    const long = c.from.length + c.to.length > 11;
    const delta = c.from ? `${val(c.from)} →${long ? '<br>' : ' '}${val(c.to)}` : val(c.to);
    return (
      `<button class="card${i === this.focusCard ? ' focus' : ''}" data-card="${i}">` +
      `<i class="rar ${c.rarity}"></i><div class="name">${t(id)}</div>${CARD_ART[id] ?? ''}` +
      `<div class="stat">${statLabel(c.stat)}</div><div class="delta${long ? ' long' : ''}">${delta}</div><span class="key">${i + 1}</span></button>`
    );
  }

  private settingsHtml(p: Profile, lowQ: boolean): string {
    const s = p.settings;
    const tog = (act: Action, on: boolean) => `<button class="small" data-act="${act}">${t(on ? 'on' : 'off')}</button>`;
    return (
      `<div class="settings">` +
      `<span>${t('language')}</span><button class="small" data-act="lang">${getLang() === 'ru' ? 'Русский' : 'English'}</button>` +
      `<span>${t('volume')}</span><input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-vol="volume">` +
      `<span>${t('effects')}</span><input type="range" min="0" max="1" step="0.05" value="${s.effects}" data-vol="effects">` +
      `<span>${t('subtitles')}</span>${tog('subs', s.subtitles)}` +
      `<span>${t('shake')}</span>${tog('shake', s.shake)}` +
      `<span>${t('flash')}</span>${tog('flash', s.flash)}` +
      `<span>${t('lowQuality')}</span>${tog('low', lowQ)}` +
      `<span>${t('tutorial')}</span>${tog('tutorial', s.tutorial)}` + // label comes from src/ui/tutorialStrings.ts
      `</div>`
    );
  }

  private buildChips(s: RunState): string {
    return s.cards.length ? `<div class="chips"><em>${t('build')}</em>${s.cards.map((id) => `<span>${t(id)}</span>`).join('')}</div>` : `<p>${t('noCards')}</p>`;
  }
  private controlsHtml(): string {
    return `<div class="controls">${t('controls')
      .split(' · ')
      .map((x) => `<span>${x}</span>`)
      .join('')}</div>`;
  }

  show(kind: ScreenKind, w: World | null, profile: Profile, saved: RunState | null, lowQ: boolean, confirmNew = false): void {
    const s = w?.state;
    const key = [kind, getLang(), s?.hand?.join(','), s?.pendingCard, s?.night, s?.player.scrap, JSON.stringify(profile.settings), lowQ, saved?.revision, confirmNew].join('|');
    if (key === this.screenKey) return;
    const kindChanged = this.screen !== kind;
    this.screenKey = key;
    this.screen = kind;
    const el = $('screen');
    el.hidden = kind === 'none';
    if (kind === 'none') {
      el.innerHTML = '';
      return;
    }
    if (kindChanged) this.focusCard = 0;
    let html = '';
    let cls = '';
    if (kind === 'title') {
      cls = 'title';
      html =
        `<div class="box"><div class="eyebrow">BellDeer · prototype 0.1</div><h1>${t('title')}</h1><p>${t('tagline')}</p><div class="btns">` +
        (saved
          ? `<button class="primary" data-act="continue">${t(saved.phase === 'draft' ? 'continueDawn' : 'continueRun', { n: saved.night })}</button>` +
            `<button data-act="new">${t(confirmNew ? 'confirmNew' : 'newRun')}</button>`
          : `<button class="primary" data-act="play">${t('play')}</button>`) +
        `</div>${this.settingsHtml(profile, lowQ)}${this.controlsHtml()}` +
        (profile.best ? `<p class="fine">${t('best', { n: profile.best })}</p>` : '') +
        `</div>`;
    } else if (kind === 'pause') {
      html =
        `<div class="box"><div class="eyebrow">${t('paused')}</div><div class="btns"><button class="primary" data-act="resume">${t('resume')}</button><button data-act="title">${t('toTitle')}</button></div>` +
        `${this.settingsHtml(profile, lowQ)}${this.controlsHtml()}</div>`;
    } else if (kind === 'draft' && s?.hand) {
      cls = 'draft';
      html =
        `<div class="box"><div class="eyebrow">${t('dawn')}</div><h2>${t('chooseUpgrade')}</h2><div class="cards">${s.hand.map((id, i) => this.cardHtml(id, i)).join('')}</div>` +
        `<div class="btns"><button class="small" data-act="skip">${t('skip')}</button>` +
        (canReroll(w!) ? `<button class="small" data-act="reroll">${t('reroll')}</button>` : '') +
        `</div>${s.cards.length ? this.buildChips(s) : ''}</div>`;
    } else if (kind === 'replace' && s?.pendingCard) {
      cls = 'draft';
      html =
        `<div class="box"><div class="eyebrow">${t(s.pendingCard)}</div><p>${t('replaceWhich')}</p><div class="slots">` +
        s.cards.map((id, i) => `<button data-slot="${i}"><span class="key">${i + 1}</span> ${t(id)}</button>`).join('') +
        `</div><div class="btns"><button class="small" data-slot="-1">${t('keepBuild')}</button></div></div>`;
    } else if (kind === 'chapter' && s) {
      cls = 'draft';
      const ch = w!.chapterOf(s.night);
      html =
        `<div class="box"><div class="eyebrow">${t('dawn')}</div><h2>${t('chapterDone', { n: ch })}</h2>` +
        `<p>${s.stats.seals.includes(ch) ? t('chapterSeal', { n: ch }) : t('chapterNoSeal')}</p>${this.buildChips(s)}` +
        `<div class="btns"><button class="primary" data-act="nextDay">${t('nextDay')}</button><button data-act="endSession">${t('endSession')}</button></div></div>`;
    } else if (kind === 'session') {
      cls = 'title';
      html = `<div class="box"><h2>${t('endSession')}</h2><p>${t('sessionSaved')}</p><div class="btns"><button class="primary" data-act="title">OK</button></div></div>`;
    } else if (kind === 'death' && s) {
      cls = 'dead';
      html =
        `<div class="box"><div class="eyebrow">${t('night')} ${s.night} / 99</div><h2>${t('lastChance')}</h2><div class="btns">` +
        `<button class="primary" data-act="revive" ${w!.canRevive ? '' : 'disabled'}>${t('reviveScrap')}</button><button data-act="endRun">${t('endRun')}</button></div>` +
        (w!.canRevive ? '' : `<p class="fine">${t(s.reviveUsed ? 'reviveUsed' : 'reviveNone')}</p>`) +
        `</div>`;
    } else if (kind === 'end' && s) {
      cls = 'dead';
      html =
        `<div class="box"><h1>${t('runOver', { n: s.night })}</h1><p>${t('survivedNights', { n: s.stats.nightsSurvived })}</p><p>${t('cause')}</p>` +
        `<p>${t('tagsOut', { n: s.stats.tagsBanked })}</p>${this.buildChips(s)}<div class="btns"><button class="primary" data-act="again">${t('again')}</button><button data-act="saveFrame">${t('saveFrame')}</button><button data-act="title">${t('menu')}</button></div></div>`;
    } else if (kind === 'victory' && s) {
      cls = 'draft';
      html =
        `<div class="box"><div class="eyebrow">${t('dawn')}</div><h1>${t('victory')}</h1><p>${t('victoryText')}</p><p>${t('tagsOut', { n: s.stats.tagsBanked })}</p>` +
        `${this.buildChips(s)}<div class="btns"><button class="primary" data-act="again">${t('again')}</button><button data-act="saveFrame">${t('saveFrame')}</button></div></div>`;
    }
    el.className = cls;
    el.innerHTML = html;
  }
}
