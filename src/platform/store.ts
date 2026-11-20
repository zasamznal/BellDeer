// RunStore + PlatformAdapter. In the local prototype progress lives in browser
// storage; on CrazyGames the same interface would be backed by the Data SDK.
// Profile and the active run are written as one versioned object; the previous
// revision is kept so a damaged record can fall back to the last valid copy.

import type { RunState } from '../sim/types';
import { CONTENT_VERSION } from '../sim/rules';
import type { Lang } from '../ui/i18n';

export interface Settings {
  lang: Lang | null;
  volume: number;
  effects: number;
  shake: boolean;
  flash: boolean;
  subtitles: boolean;
  lowQuality: boolean;
}

export interface Profile {
  best: number;
  runs: number;
  nights: number;
  seenStages: number[];
  seals: number[];
  bonusTrap: boolean;
  /** [ideas 9] Best run score ("Heat"). */
  bestScore: number;
  /** [ideas] One-time hints already shown (lure, blow, resin, tracks). */
  hintsSeen: string[];
  settings: Settings;
}

interface SaveFile {
  v: number;
  profile: Profile;
  run: RunState | null;
  prev: RunState | null;
}

export interface ProgressStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEY = 'belldeer.save.v1';

export const defaultProfile = (): Profile => ({
  best: 0,
  runs: 0,
  nights: 0,
  seenStages: [],
  seals: [],
  bonusTrap: false,
  bestScore: 0,
  hintsSeen: [],
  settings: { lang: null, volume: 0.8, effects: 1, shake: true, flash: true, subtitles: true, lowQuality: false },
});

function validRun(r: unknown): r is RunState {
  const x = r as RunState | null;
  return (
    !!x &&
    typeof x.seed === 'number' &&
    typeof x.night === 'number' &&
    x.night >= 1 &&
    x.night <= 99 &&
    typeof x.fuel === 'number' &&
    !!x.player &&
    typeof x.player.hp === 'number' &&
    Array.isArray(x.cards) &&
    x.contentVersion === CONTENT_VERSION &&
    (x.phase === 'day' || x.phase === 'night' || x.phase === 'draft' || x.phase === 'deathOffer')
  );
}

function memoryStore(): ProgressStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}

export class RunStore {
  profile: Profile = defaultProfile();
  run: RunState | null = null;
  private prev: RunState | null = null;
  private backend: ProgressStore;

  constructor(backend?: ProgressStore) {
    let b = backend;
    if (!b) {
      try {
        window.localStorage.setItem('belldeer.probe', '1');
        b = window.localStorage;
      } catch {
        b = memoryStore(); // storage blocked (private mode / sandboxed iframe)
      }
    }
    this.backend = b;
    this.load();
  }

  load(): void {
    try {
      const raw = this.backend.getItem(KEY);
      if (!raw) return;
      const f = JSON.parse(raw) as SaveFile;
      if (!f || f.v !== 1) return;
      const d = defaultProfile();
      this.profile = { ...d, ...f.profile, settings: { ...d.settings, ...(f.profile?.settings ?? {}) } };
      this.run = validRun(f.run) ? f.run : validRun(f.prev) ? f.prev : null;
      this.prev = validRun(f.prev) ? f.prev : null;
    } catch {
      this.run = null;
    }
  }

  private write(): void {
    try {
      const f: SaveFile = { v: 1, profile: this.profile, run: this.run, prev: this.prev };
      this.backend.setItem(KEY, JSON.stringify(f));
    } catch {
      /* quota or blocked storage: the session keeps running from memory */
    }
  }

  saveRun(run: RunState): void {
    if (this.run && this.run.runId === run.runId) this.prev = this.run;
    else this.prev = null;
    this.run = run;
    this.write();
  }
  clearRun(): void {
    this.run = null;
    this.prev = null;
    this.write();
  }
  saveProfile(): void {
    this.write();
  }
}

// ------------------------------------------------------------ platform

interface CrazySdk {
  game?: { gameplayStart?: () => void; gameplayStop?: () => void };
}

/** Lifecycle wrapper: an event is only sent when the state actually changes. */
export class Platform {
  private playing = false;
  private get sdk(): CrazySdk | undefined {
    return (window as unknown as { CrazyGames?: { SDK?: CrazySdk } }).CrazyGames?.SDK;
  }
  /** Basic Launch: ads are off, every bonus has an in-game route. */
  readonly adsEnabled = false;
  gameplay(on: boolean): void {
    if (on === this.playing) return;
    this.playing = on;
    try {
      if (on) this.sdk?.game?.gameplayStart?.();
      else this.sdk?.game?.gameplayStop?.();
    } catch {
      /* SDK not present */
    }
  }
}

// ------------------------------------------------------------ analytics

const log: { e: string; t: number; data?: unknown }[] = [];
export function track(e: string, data?: unknown): void {
  log.push({ e, t: Math.round(performance.now()), data });
  if (log.length > 500) log.shift();
}
export const analyticsLog = log;
