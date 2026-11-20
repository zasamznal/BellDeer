// The first-run tutorial as a pure reducer: no DOM, no clock of its own, no
// access to the world. Once per frame `nextStep(flow, facts)` gets a snapshot
// of the run plus the simulation events since the previous call and answers
// which single line belongs on screen. Steps tick off whenever their action
// happens, shown or not, so the order the player picks never breaks the script.

import type { Phase, SimEvent } from '../sim/types';

export type StepId =
  | 'chop' // (a) the start snag
  | 'feed' // (b) first log into the fire
  | 'stock' // (c) a second snag
  | 'scrap' // (d) first scrap pile
  | 'bench' // (e) craft a trap at the workbench
  | 'trap' // (e) set it with Q
  | 'dusk' // (f) be inside the ring when night falls
  | 'ring' // (g) what the ring does
  | 'beam' // (h) flashlight on the ringing tag
  | 'take' // (i) open the cache
  | 'carry' // (j) tag back to the fire
  | 'closed' // the cache shut before it was taken
  | 'hunt' // (k) two strikes: back into the ring
  | 'weak' // (l) the fire went weak
  | 'draft' // (m) the first dawn
  | 'farewell'; // last line, day 2

/** One frame of what the tutorial is allowed to know. */
export interface Facts {
  /** Seconds of play since the previous call (0 while a screen is open). */
  dt: number;
  phase: Phase;
  /** RunState.night: 1 during the first day and night, 2 from the second day on. */
  night: number;
  /** Seconds into the phase. */
  t: number;
  logs: number;
  scrap: number;
  /** Ready traps in the pack. */
  traps: number;
  /** Forest tags carried, not yet handed in. */
  tags: number;
  /** World.playerProtected. */
  protected: boolean;
  bright: boolean;
  /** The player has left the spawn point. */
  moved: boolean;
  /** The line the player can read right now (null while it is hidden or animating). */
  visible: StepId | null;
  events: readonly SimEvent[];
}

export interface Flow {
  /** The line that belongs on screen. */
  current: StepId | null;
  /** Steps that will never be shown (again): acted on / read, or their moment has passed. */
  done: Partial<Record<StepId, 'done' | 'skip'>>;
  /** Seconds each line has been readable. */
  seen: Partial<Record<StepId, number>>;
  /** Seconds of play since the tutorial started. */
  clock: number;
  chops: number;
  /** `clock` at the first chop, −1 before it. */
  chopAt: number;
  moved: boolean;
  /** Post of the cache being taught, −1 when none is ringing. */
  post: number;
  revealed: boolean;
  /** A cache shut before the player took one. */
  cacheLost: boolean;
  /** Two strikes were heard outside the ring. */
  hunted: boolean;
  weak: boolean;
  /** The first dawn's card is picked: the tutorial counts as finished. */
  complete: boolean;
  /** Nothing left to say in this run. */
  over: boolean;
}

export interface Completed {
  id: StepId;
  /** 'act': the player did it. 'read': a timed line ran its course. */
  kind: 'act' | 'read';
  /** False when the action came before its line was ever shown. */
  shown: boolean;
}

export interface Outcome {
  flow: Flow;
  completed: Completed[];
  /** Step (b) should add the W A S D key row. */
  wasd: boolean;
  /** True on the one call in which the tutorial became complete. */
  finished: boolean;
}

/** Script timing, in seconds of the day clock unless noted. */
export const TUT = {
  duskAt: 45,
  scrapUntil: 40,
  trapUntil: 50,
  trapScrap: 2,
  /** Seconds after the first chop without a single step before W A S D is shown. */
  wasdAfter: 6,
  ringSeconds: 8,
  closedSeconds: 5,
  farewellAt: 2,
  farewellSeconds: 6,
  /** A timed line that was interrupted after this long counts as read. */
  readEnough: 3,
} as const;

interface Ctx {
  f: Facts;
  s: Flow;
  /** Line that was current before this call. */
  was: StepId | null;
  day1: boolean;
  night1: boolean;
  /** The first night is behind (dawn, death screen of a finished run, or a later day). */
  past: boolean;
  has(type: SimEvent['type']): boolean;
}

interface Step {
  id: StepId;
  /** Pre-empts whatever is showing; the interrupted line resumes afterwards. */
  urgent?: boolean;
  /** A timed line: counts as read after this many visible seconds. */
  seconds?: number;
  /** May be on screen now. */
  when(c: Ctx): boolean;
  /** The player did it (checked whether or not the line is showing). */
  done?(c: Ctx): boolean;
  /** Its moment has passed. */
  skip?(c: Ctx): boolean;
}

const earlyDay = (c: Ctx) => c.day1 && c.f.t < TUT.duskAt;
/** The trap pair may outlast second 45 only if one of its lines is already up. */
const trapWindow = (c: Ctx) => c.day1 && (c.f.t < TUT.duskAt || c.was === 'bench' || c.was === 'trap');
const trapLate = (c: Ctx) => !c.day1 || c.f.t >= TUT.trapUntil;

/** Urgent steps first (most pressing on top), then the script in priority order. */
const STEPS: Step[] = [
  {
    id: 'weak',
    urgent: true,
    when: (c) => c.s.weak && !c.past,
    done: (c) => c.s.weak && c.f.bright,
    skip: (c) => c.past,
  },
  {
    id: 'hunt',
    urgent: true,
    when: (c) => c.s.hunted && c.night1,
    done: (c) => c.s.hunted && c.f.protected,
    skip: (c) => c.past,
  },
  {
    id: 'draft',
    when: (c) => c.f.phase === 'draft' && c.f.night === 1,
    done: (c) => c.f.phase === 'day' && c.f.night >= 2,
    skip: (c) => c.f.phase === 'end' || c.f.phase === 'victory',
  },
  {
    id: 'farewell',
    seconds: TUT.farewellSeconds,
    when: (c) => c.s.complete && c.f.phase === 'day' && c.f.night === 2 && c.f.t >= TUT.farewellAt,
    skip: (c) => c.s.complete && (c.f.phase !== 'day' || c.f.night > 2 || c.f.t >= 40),
  },
  {
    id: 'beam',
    when: (c) => c.night1 && c.s.post >= 0 && !c.s.revealed,
    done: (c) => c.has('cacheRevealed'),
    skip: (c) => c.past,
  },
  {
    id: 'take',
    when: (c) => c.night1 && c.s.post >= 0 && c.s.revealed,
    done: (c) => c.has('cacheClaim'),
    skip: (c) => c.past,
  },
  {
    id: 'carry',
    when: (c) => c.night1 && c.f.tags > 0,
    done: (c) => c.has('tagsBanked'),
    skip: (c) => c.past,
  },
  {
    id: 'closed',
    seconds: TUT.closedSeconds,
    when: (c) => c.night1 && c.s.cacheLost,
    // Once the next tag rings the note is stale.
    skip: (c) => c.past || (c.s.cacheLost && c.s.post >= 0),
  },
  {
    id: 'chop',
    when: earlyDay,
    done: (c) => c.s.chops >= 1,
    skip: (c) => !c.day1,
  },
  {
    id: 'feed',
    when: (c) => c.day1 && c.f.logs > 0,
    done: (c) => c.has('feed'),
    skip: (c) => !c.day1,
  },
  {
    id: 'stock',
    when: (c) => earlyDay(c) && c.s.chops >= 1,
    done: (c) => c.s.chops >= 2,
    skip: (c) => !c.day1,
  },
  {
    id: 'scrap',
    when: (c) => c.day1 && c.f.t < TUT.scrapUntil,
    done: (c) => c.day1 && (c.f.scrap > 0 || c.f.events.some((e) => e.type === 'pickup' && e.kind === 'scrap' && e.n > 0)),
    skip: (c) => !c.day1 || c.f.t >= TUT.scrapUntil,
  },
  {
    id: 'bench',
    when: (c) => trapWindow(c) && c.f.scrap >= TUT.trapScrap && c.f.traps === 0,
    done: (c) => c.day1 && (c.f.traps > 0 || c.has('trapPlaced') || c.f.events.some((e) => e.type === 'craft' && e.recipe === 1)),
    skip: trapLate,
  },
  {
    id: 'trap',
    when: (c) => trapWindow(c) && c.f.traps > 0,
    done: (c) => c.day1 && c.has('trapPlaced'),
    skip: trapLate,
  },
  {
    id: 'dusk',
    when: (c) => (c.day1 && c.f.t >= TUT.duskAt) || c.night1,
    done: (c) => c.night1 && c.f.protected,
    skip: (c) => c.past,
  },
  {
    id: 'ring',
    seconds: TUT.ringSeconds,
    when: (c) => c.night1,
    skip: (c) => c.past,
  },
];

export const isUrgent = (id: StepId | null): boolean => !!id && !!STEPS.find((s) => s.id === id)?.urgent;

/**
 * A fresh script. `known` lists steps the run has already been through (a run
 * saved during its first day and continued later).
 */
export function startFlow(known: readonly StepId[] = [], chops = 0, moved = false): Flow {
  const done: Flow['done'] = {};
  for (const id of known) done[id] = 'done';
  if (chops >= 1) done.chop = 'done';
  if (chops >= 2) done.stock = 'done';
  return {
    current: null,
    done,
    seen: {},
    clock: 0,
    chops,
    chopAt: chops > 0 ? 0 : -1,
    moved,
    post: -1,
    revealed: false,
    cacheLost: false,
    hunted: false,
    weak: false,
    complete: false,
    over: false,
  };
}

export function nextStep(prev: Flow, f: Facts): Outcome {
  const s: Flow = { ...prev, done: { ...prev.done }, seen: { ...prev.seen } };
  const out: Outcome = { flow: s, completed: [], wasd: false, finished: false };
  if (s.over) return out;

  // 1. Time and memory.
  s.clock += f.dt;
  if (f.visible) s.seen[f.visible] = (s.seen[f.visible] ?? 0) + f.dt;
  if (f.moved) s.moved = true;
  const active = f.phase === 'day' || f.phase === 'night';
  if (active && !f.bright) s.weak = true;
  for (const e of f.events) {
    switch (e.type) {
      case 'chopDone':
        s.chops++;
        if (s.chopAt < 0) s.chopAt = s.clock;
        break;
      case 'cacheCue':
      case 'cacheOpen':
        if (s.post !== e.post) s.revealed = false;
        s.post = e.post;
        break;
      case 'cacheRevealed':
        s.post = e.post;
        s.revealed = true;
        break;
      case 'cacheClaim':
        s.post = -1;
        s.revealed = false;
        break;
      case 'cacheClosed':
        if (s.post === e.post) {
          s.post = -1;
          s.revealed = false;
          if (!s.done.take) s.cacheLost = true;
        }
        break;
      case 'deerCue':
        if (!e.second && !f.protected) s.hunted = true;
        break;
      case 'fireWeak':
        s.weak = true;
        break;
    }
  }

  const c: Ctx = {
    f,
    s,
    was: prev.current,
    day1: f.phase === 'day' && f.night === 1,
    night1: f.phase === 'night' && f.night === 1,
    past: f.night > 1 || f.phase === 'draft' || f.phase === 'end' || f.phase === 'victory',
    has: (type) => f.events.some((e) => e.type === type),
  };
  const seen = (id: StepId) => s.seen[id] ?? 0;
  /** The line has been in front of the player, however briefly. */
  const met = (id: StepId) => s.seen[id] !== undefined;

  // 2. Tick off everything the player has done or outlived, on screen or not.
  for (const st of STEPS) {
    if (s.done[st.id]) continue;
    if (st.done?.(c)) {
      s.done[st.id] = 'done';
      out.completed.push({ id: st.id, kind: 'act', shown: met(st.id) });
    } else if (st.seconds !== undefined && seen(st.id) >= st.seconds) {
      s.done[st.id] = 'done';
      out.completed.push({ id: st.id, kind: 'read', shown: true });
    } else if (st.skip?.(c)) s.done[st.id] = 'skip';
  }
  if (s.done.draft === 'done' && !s.complete) {
    s.complete = true;
    out.finished = true;
  }

  // 3. One line: an urgent one if any, otherwise the first open step of the script.
  const open = (st: Step) => !s.done[st.id] && st.when(c);
  s.current = (STEPS.find((st) => st.urgent && open(st)) ?? STEPS.find((st) => !st.urgent && open(st)))?.id ?? null;

  // A timed note that was cut off after a fair look is not brought back.
  for (const st of STEPS) {
    if (st.seconds === undefined || s.done[st.id] || s.current === st.id || seen(st.id) < TUT.readEnough) continue;
    s.done[st.id] = 'done';
    out.completed.push({ id: st.id, kind: 'read', shown: true });
  }

  if (s.done.farewell || f.phase === 'end' || f.phase === 'victory') {
    s.over = true;
    s.current = null;
  }
  out.wasd = s.current === 'feed' && !s.moved && s.chopAt >= 0 && s.clock - s.chopAt >= TUT.wasdAfter;
  return out;
}
