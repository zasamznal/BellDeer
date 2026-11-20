// The tutorial script is a pure reducer (src/ui/tutorialFlow.ts): these tests
// feed it frames by hand and check ordering, out-of-order completion, skipping,
// timed lines and pre-emption without a DOM or a World.
import { describe, expect, it } from 'vitest';
import type { SimEvent } from '../src/sim/types';
import { type Facts, type Flow, type Outcome, type StepId, TUT, isUrgent, nextStep, startFlow } from '../src/ui/tutorialFlow';

const day = (t: number, patch: Partial<Facts> = {}): Partial<Facts> => ({ phase: 'day', night: 1, t, ...patch });
const night = (t: number, patch: Partial<Facts> = {}): Partial<Facts> => ({ phase: 'night', night: 1, t, protected: true, ...patch });

/** Drives the reducer the way the view does: the current line is on screen unless told otherwise. */
class Rig {
  flow: Flow = startFlow();
  last!: Outcome;
  acted: StepId[] = [];
  read: StepId[] = [];
  ahead: StepId[] = [];

  step(patch: Partial<Facts> = {}, events: SimEvent[] = []): StepId | null {
    const facts: Facts = {
      dt: 1 / 60,
      phase: 'day',
      night: 1,
      t: 0,
      logs: 0,
      scrap: 0,
      traps: 0,
      tags: 0,
      protected: false,
      bright: true,
      moved: false,
      visible: this.flow.current,
      events,
      ...patch,
    };
    this.last = nextStep(this.flow, facts);
    this.flow = this.last.flow;
    for (const c of this.last.completed) {
      (c.kind === 'act' ? this.acted : this.read).push(c.id);
      if (!c.shown) this.ahead.push(c.id);
    }
    return this.flow.current;
  }
  /** Hold the same facts for `seconds` of visible play. */
  hold(seconds: number, patch: Partial<Facts> = {}): StepId | null {
    for (let k = Math.round(seconds * 60); k > 0; k--) this.step(patch);
    return this.flow.current;
  }
}

const chop = (node = 0): SimEvent => ({ type: 'chopDone', node, logs: 2 });
const feed: SimEvent = { type: 'feed', gain: 20, relit: false };
const scrapUp: SimEvent = { type: 'pickup', kind: 'scrap', n: 2 };

/** The whole first day played in script order; returns the rig at day second 30 with nothing left to say. */
function playedDay(): Rig {
  const r = new Rig();
  r.step(day(0));
  r.step(day(3, { logs: 2 }), [chop(0)]);
  r.step(day(8, { logs: 1 }), [feed]);
  r.step(day(15, { logs: 3 }), [chop(1)]);
  r.step(day(20, { logs: 3, scrap: 2 }), [scrapUp]);
  r.step(day(26, { logs: 3, scrap: 0, traps: 1 }), [{ type: 'craft', recipe: 1 }]);
  r.step(day(30, { logs: 3 }), [{ type: 'trapPlaced', x: 9, z: 0 }]);
  return r;
}

describe('tutorial script: the first day in order', () => {
  it('walks chop → feed → stock → scrap → bench → trap and ticks each one off', () => {
    const r = new Rig();
    expect(r.step(day(0))).toBe('chop');
    expect(r.step(day(3, { logs: 2 }), [chop(0)])).toBe('feed');
    expect(r.step(day(8, { logs: 1 }), [feed])).toBe('stock');
    expect(r.step(day(15, { logs: 3 }), [chop(1)])).toBe('scrap');
    expect(r.step(day(20, { logs: 3, scrap: 2 }), [scrapUp])).toBe('bench');
    expect(r.step(day(26, { logs: 3, scrap: 0, traps: 1 }), [{ type: 'craft', recipe: 1 }])).toBe('trap');
    expect(r.step(day(30, { logs: 3 }), [{ type: 'trapPlaced', x: 9, z: 0 }])).toBe(null);
    expect(r.acted).toEqual(['chop', 'feed', 'stock', 'scrap', 'bench', 'trap']);
    expect(r.ahead).toEqual([]);
    expect(r.read).toEqual([]);
  });

  it('shows the first line before the day clock has started', () => {
    const r = new Rig();
    expect(r.step({ phase: 'day', night: 1, t: 0, dt: 0 })).toBe('chop');
  });

  it('a completed line never comes back', () => {
    const r = playedDay();
    // Chopping, feeding and looting again later in the day changes nothing.
    expect(r.step(day(34, { logs: 5, scrap: 2 }), [chop(2), feed, scrapUp])).toBe(null);
    expect(r.acted.filter((id) => id === 'chop' || id === 'feed' || id === 'scrap')).toEqual(['chop', 'feed', 'scrap']);
  });

  it('does not mutate the flow it is given', () => {
    const before = startFlow();
    const copy = structuredClone(before);
    const out = nextStep(before, { dt: 0.1, phase: 'day', night: 1, t: 3, logs: 2, scrap: 0, traps: 0, tags: 0, protected: false, bright: true, moved: true, visible: 'chop', events: [chop(0)] });
    expect(before).toEqual(copy);
    expect(out.flow).not.toBe(before);
    expect(out.flow.done.chop).toBe('done');
  });
});

describe('tutorial script: the player picks another order', () => {
  it('scrap picked up before the second snag ticks off silently and is never announced', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(day(3, { logs: 2 }), [chop(0)]);
    r.step(day(8, { logs: 1 }), [feed]);
    expect(r.step(day(12, { logs: 1, scrap: 2 }), [scrapUp])).toBe('stock');
    expect(r.ahead).toEqual(['scrap']);
    // The second snag now leads straight to the workbench line.
    expect(r.step(day(18, { logs: 3, scrap: 2 }), [chop(1)])).toBe('bench');
  });

  it('two snags before the first log goes in: the stock line is skipped, the fire line stays', () => {
    const r = new Rig();
    r.step(day(0));
    expect(r.step(day(3, { logs: 2 }), [chop(0)])).toBe('feed');
    expect(r.step(day(9, { logs: 4 }), [chop(1)])).toBe('feed');
    expect(r.ahead).toEqual(['stock']);
    expect(r.step(day(14, { logs: 3 }), [feed])).toBe('scrap');
  });

  it('a snag other than the start one completes the first step too', () => {
    const r = new Rig();
    r.step(day(0));
    expect(r.step(day(6, { logs: 2, moved: true }), [chop(3)])).toBe('feed');
    expect(r.acted).toEqual(['chop']);
  });

  it('with no log in hand the fire line gives way to the next snag and returns with the logs', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(day(3, { logs: 2 }), [chop(0)]);
    // Both logs burnt as torches.
    expect(r.step(day(6, { logs: 0 }))).toBe('stock');
    expect(r.step(day(12, { logs: 2 }), [chop(1)])).toBe('feed');
    expect(r.acted).toEqual(['chop', 'stock']);
  });

  it('setting a trap straight with Q completes the workbench line as well', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(day(3, { logs: 2 }), [chop(0), chop(1)]);
    r.step(day(5, { logs: 1 }), [feed]);
    expect(r.step(day(9, { logs: 1, scrap: 2 }), [scrapUp])).toBe('bench');
    expect(r.step(day(12, { logs: 1, scrap: 0 }), [{ type: 'trapPlaced', x: 9, z: 0 }])).toBe(null);
    expect(r.acted).toContain('bench');
    expect(r.acted).toContain('trap');
    expect(r.ahead).toContain('trap');
  });

  it('a trap carried from the start skips the workbench and asks only for Q', () => {
    const r = new Rig();
    r.step(day(0, { traps: 1 }));
    r.step(day(3, { logs: 2, traps: 1 }), [chop(0), chop(1)]);
    r.step(day(5, { logs: 1, traps: 1 }), [feed]);
    expect(r.step(day(6, { logs: 1, traps: 1, scrap: 2 }), [scrapUp])).toBe('trap');
  });
});

describe('tutorial script: steps whose moment passes', () => {
  it('the scrap line disappears without a tick once the day clock passes 40 s', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(day(3, { logs: 2 }), [chop(0), chop(1)]);
    expect(r.step(day(5, { logs: 1 }), [feed])).toBe('scrap');
    expect(r.step(day(TUT.scrapUntil - 0.1, { logs: 1 }))).toBe('scrap');
    expect(r.step(day(TUT.scrapUntil, { logs: 1 }))).toBe(null);
    expect(r.flow.done.scrap).toBe('skip');
    expect(r.acted).not.toContain('scrap');
    // Picking scrap up afterwards is not reported as a tutorial step.
    r.step(day(42, { logs: 1, scrap: 2 }), [scrapUp]);
    expect(r.acted).not.toContain('scrap');
  });

  it('the workbench line needs two scrap and is not opened after second 45', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(day(3, { logs: 2 }), [chop(0), chop(1)]);
    r.step(day(5, { logs: 1 }), [feed]);
    expect(r.step(day(8, { logs: 1, scrap: 1 }))).toBe(null);
    expect(r.step(day(46, { logs: 1, scrap: 2 }))).toBe('dusk');
  });

  it('a trap line already on screen stays until second 50, then dusk takes over', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(day(3, { logs: 2 }), [chop(0), chop(1)]);
    r.step(day(5, { logs: 1 }), [feed]);
    expect(r.step(day(44, { logs: 1, scrap: 2 }))).toBe('bench');
    expect(r.step(day(46, { logs: 1, scrap: 2 }))).toBe('bench');
    expect(r.step(day(48, { logs: 1, scrap: 0, traps: 1 }), [{ type: 'craft', recipe: 1 }])).toBe('trap');
    expect(r.step(day(TUT.trapUntil, { logs: 1, traps: 1 }))).toBe('dusk');
    expect(r.flow.done.trap).toBe('skip');
  });

  it('from second 45 dusk replaces the stock-up line, but an unfed fire still comes first', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(day(3, { logs: 2 }), [chop(0)]);
    r.step(day(8, { logs: 1 }), [feed]);
    expect(r.step(day(44.9, { logs: 1 }))).toBe('stock');
    expect(r.step(day(TUT.duskAt, { logs: 1 }))).toBe('dusk');

    const q = new Rig();
    q.step(day(0));
    q.step(day(3, { logs: 2 }), [chop(0)]);
    expect(q.step(day(50, { logs: 2 }))).toBe('feed');
    expect(q.step(day(52, { logs: 1 }), [feed])).toBe('dusk');
  });

  it('a player who never chopped is still warned about the night', () => {
    const r = new Rig();
    expect(r.step(day(30))).toBe('chop');
    expect(r.step(day(46))).toBe('dusk');
  });

  it('day lines are dropped at nightfall and never reported as done', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(night(0.1));
    for (const id of ['chop', 'feed', 'stock', 'scrap', 'bench', 'trap'] as const) expect(r.flow.done[id]).toBe('skip');
    // The night's own trap (a card effect) must not tick the day step.
    r.step(night(0.2), [{ type: 'trapPlaced', x: 9, z: 0 }]);
    expect(r.acted).toEqual(['dusk']);
  });
});

describe('tutorial script: dusk and the first night', () => {
  it('dusk is done only when the night finds the player inside the ring', () => {
    const r = playedDay();
    expect(r.step(day(46, { protected: true }))).toBe('dusk');
    expect(r.step(day(59, { protected: true }))).toBe('dusk');
    expect(r.acted).not.toContain('dusk');
    expect(r.step(night(0))).toBe('ring');
    expect(r.acted).toContain('dusk');
  });

  it('caught outside at nightfall the dusk line stays up until the player is in', () => {
    const r = playedDay();
    r.step(day(50));
    expect(r.step(night(0, { protected: false }))).toBe('dusk');
    expect(r.hold(3, night(3, { protected: false }))).toBe('dusk');
    expect(r.step(night(3.1))).toBe('ring');
  });

  it('the ring note is a timed line: 8 visible seconds, and hidden time does not count', () => {
    const r = playedDay();
    r.step(night(0));
    expect(r.hold(4, night(4))).toBe('ring');
    // Four seconds behind a pause screen.
    for (let k = 0; k < 240; k++) r.step(night(4, { dt: 0, visible: null }));
    expect(r.flow.current).toBe('ring');
    expect(r.hold(3.9, night(8))).toBe('ring');
    expect(r.hold(0.2, night(8.2))).toBe(null);
    expect(r.read).toEqual(['ring']);
  });

  it('cache: beam → take → carry, each on its own event', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    expect(r.step(night(21), [{ type: 'cacheCue', post: 2 }])).toBe('beam');
    expect(r.flow.post).toBe(2);
    expect(r.step(night(22, { protected: false }), [{ type: 'cacheOpen', post: 2 }])).toBe('beam');
    expect(r.step(night(25, { protected: false }), [{ type: 'cacheRevealed', post: 2 }])).toBe('take');
    expect(r.step(night(28, { protected: false, tags: 1 }), [{ type: 'cacheClaim', post: 2, reward: 'scrap' }])).toBe('carry');
    expect(r.step(night(33, { tags: 0 }), [{ type: 'tagsBanked', n: 1, seal: 1 }])).toBe(null);
    expect(r.acted.slice(-3)).toEqual(['beam', 'take', 'carry']);
  });

  it('a ringing tag outranks the ring note, which is shown afterwards', () => {
    const r = playedDay();
    r.step(night(20.9));
    expect(r.flow.current).toBe('ring');
    expect(r.step(night(21), [{ type: 'cacheCue', post: 0 }])).toBe('beam');
    r.step(night(24), [{ type: 'cacheRevealed', post: 0 }]);
    r.step(night(26, { tags: 1 }), [{ type: 'cacheClaim', post: 0, reward: 'scrap' }]);
    expect(r.step(night(30), [{ type: 'tagsBanked', n: 1, seal: 1 }])).toBe('ring');
  });

  it('a cache that shuts untouched is mentioned once, and the next tag brings the beam line back', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    r.step(night(21), [{ type: 'cacheCue', post: 1 }]);
    expect(r.step(night(34), [{ type: 'cacheClosed', post: 1 }])).toBe('closed');
    expect(r.hold(TUT.closedSeconds + 0.1, night(39))).toBe(null);
    expect(r.read).toContain('closed');
    expect(r.step(night(57), [{ type: 'cacheCue', post: 0 }])).toBe('beam');
    expect(r.flow.post).toBe(0);
    // The second one shuts too: the note is not repeated.
    expect(r.step(night(70), [{ type: 'cacheClosed', post: 0 }])).toBe(null);
  });

  it('the closed note gives way as soon as another tag rings', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    r.step(night(21), [{ type: 'cacheCue', post: 1 }]);
    r.step(night(34), [{ type: 'cacheClosed', post: 1 }]);
    r.hold(1, night(35));
    expect(r.step(night(57), [{ type: 'cacheCue', post: 0 }])).toBe('beam');
    expect(r.flow.done.closed).toBe('skip');
  });

  it('a revealed cache that shuts: only the take line returns for the second one', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    r.step(night(21), [{ type: 'cacheCue', post: 1 }]);
    expect(r.step(night(25), [{ type: 'cacheRevealed', post: 1 }])).toBe('take');
    expect(r.step(night(34), [{ type: 'cacheClosed', post: 1 }])).toBe('closed');
    r.hold(5.1, night(39));
    expect(r.step(night(57), [{ type: 'cacheCue', post: 0 }])).toBe(null);
    expect(r.step(night(60), [{ type: 'cacheRevealed', post: 0 }])).toBe('take');
  });

  it('no closed note once a cache has been taken', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    r.step(night(21), [{ type: 'cacheCue', post: 1 }]);
    r.step(night(24), [{ type: 'cacheRevealed', post: 1 }]);
    r.step(night(26, { tags: 1 }), [{ type: 'cacheClaim', post: 1, reward: 'scrap' }]);
    r.step(night(30), [{ type: 'tagsBanked', n: 1, seal: 1 }]);
    r.step(night(57), [{ type: 'cacheCue', post: 0 }]);
    expect(r.step(night(70), [{ type: 'cacheClosed', post: 0 }])).toBe(null);
    expect(r.flow.cacheLost).toBe(false);
  });
});

describe('tutorial script: pre-emption', () => {
  const cue: SimEvent = { type: 'deerCue', x: 9, z: 0, second: false };

  it('two strikes outside the ring cut in over the cache line, which resumes afterwards', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    expect(r.step(night(21), [{ type: 'cacheCue', post: 2 }])).toBe('beam');
    expect(r.step(night(26, { protected: false }), [cue])).toBe('hunt');
    expect(isUrgent('hunt')).toBe(true);
    expect(r.hold(1, night(27, { protected: false }))).toBe('hunt');
    expect(r.step(night(28))).toBe('beam');
    expect(r.acted.slice(-1)).toEqual(['hunt']);
    // A second hunt later in the night is not announced again.
    expect(r.step(night(40, { protected: false }), [cue])).toBe('beam');
  });

  it('a cue heard from inside the ring teaches nothing', () => {
    const r = playedDay();
    r.step(night(0));
    expect(r.step(night(5), [cue])).toBe('ring');
    expect(r.flow.hunted).toBe(false);
  });

  it('the second lunge signal of late stages is not the hunt cue', () => {
    const r = playedDay();
    r.step(night(0));
    r.step(night(5, { protected: false }), [{ type: 'deerCue', x: 9, z: 0, second: true }]);
    expect(r.flow.hunted).toBe(false);
  });

  it('a weak fire outranks everything, the hunt line included, and ends on fireBright', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    r.step(night(30, { protected: false }), [cue]);
    expect(r.flow.current).toBe('hunt');
    expect(r.step(night(31, { protected: false, bright: false }), [{ type: 'fireWeak' }])).toBe('weak');
    expect(r.hold(2, night(33, { protected: false, bright: false }))).toBe('weak');
    // Fed: bright again, and standing at the fire means back in the ring as well.
    expect(r.step(night(34), [{ type: 'fireBright' }])).toBe(null);
    expect(r.acted.slice(-2).sort()).toEqual(['hunt', 'weak']);
  });

  it('a weak fire interrupts the ring note and the note is not repeated after a fair look', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(4, night(4));
    expect(r.step(night(5, { protected: false, bright: false }), [{ type: 'fireWeak' }])).toBe('weak');
    expect(r.read).toEqual(['ring']);
    expect(r.step(night(9), [{ type: 'fireBright' }])).toBe(null);
  });

  it('a note interrupted in its first seconds does come back', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(1, night(1));
    r.step(night(2, { protected: false, bright: false }), [{ type: 'fireWeak' }]);
    expect(r.step(night(6), [{ type: 'fireBright' }])).toBe('ring');
  });
});

describe('tutorial script: W A S D row', () => {
  it('appears under the fire line when nobody has moved 6 s after the first chop', () => {
    const r = new Rig();
    r.step(day(0));
    r.step(day(2, { logs: 2 }), [chop(0)]);
    r.hold(TUT.wasdAfter - 0.2, day(8, { logs: 2 }));
    expect(r.last.wasd).toBe(false);
    r.hold(0.4, day(8.4, { logs: 2 }));
    expect(r.last.wasd).toBe(true);
    // The first step removes it for good.
    r.step(day(9, { logs: 2, moved: true }));
    expect(r.last.wasd).toBe(false);
    r.hold(1, day(10, { logs: 2 }));
    expect(r.last.wasd).toBe(false);
  });

  it('never appears for a player who walked before chopping', () => {
    const r = new Rig();
    r.step(day(1, { moved: true }));
    r.step(day(9, { logs: 2 }), [chop(2)]);
    r.hold(10, day(19, { logs: 2 }));
    expect(r.flow.current).toBe('feed');
    expect(r.last.wasd).toBe(false);
  });
});

describe('tutorial script: the first dawn and the end', () => {
  function atDawn(): Rig {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    r.step({ phase: 'draft', night: 1, t: 0, dt: 0 });
    return r;
  }

  it('the draft line waits for the pick; the pick completes the tutorial exactly once', () => {
    const r = atDawn();
    expect(r.flow.current).toBe('draft');
    expect(r.last.finished).toBe(false);
    expect(r.step({ phase: 'draft', night: 1, t: 0, dt: 0 })).toBe('draft');
    r.step({ phase: 'day', night: 2, t: 0 }, [{ type: 'dayStart', n: 2 }]);
    expect(r.last.finished).toBe(true);
    expect(r.flow.complete).toBe(true);
    expect(r.acted.slice(-1)).toEqual(['draft']);
    r.step({ phase: 'day', night: 2, t: 0.1 });
    expect(r.last.finished).toBe(false);
  });

  it('the last line comes 2 s into day 2, stays 6 s, and then the script is over', () => {
    const r = atDawn();
    r.step({ phase: 'day', night: 2, t: 0 });
    expect(r.step({ phase: 'day', night: 2, t: 1.9 })).toBe(null);
    expect(r.step({ phase: 'day', night: 2, t: TUT.farewellAt })).toBe('farewell');
    expect(r.hold(TUT.farewellSeconds - 0.2, { phase: 'day', night: 2, t: 7.8 })).toBe('farewell');
    expect(r.hold(0.4, { phase: 'day', night: 2, t: 8.2 })).toBe(null);
    expect(r.flow.over).toBe(true);
    // Nothing on day 2 wakes it up again.
    expect(r.step({ phase: 'day', night: 2, t: 20, logs: 2 }, [chop(0)])).toBe(null);
    expect(r.step({ phase: 'night', night: 2, t: 21, protected: false }, [{ type: 'cacheCue', post: 0 }, { type: 'deerCue', x: 1, z: 1, second: false }])).toBe(null);
  });

  it('night lines the player never met are dropped at dawn, not reported', () => {
    const r = atDawn();
    for (const id of ['beam', 'take', 'carry', 'closed', 'hunt', 'weak'] as const) expect(r.flow.done[id]).toBe('skip');
    expect(r.acted).not.toContain('beam');
  });

  it('death ends the script without completing it', () => {
    const r = playedDay();
    r.step(night(0));
    r.step({ phase: 'deathOffer', night: 1, t: 30, dt: 0, visible: null });
    expect(r.flow.over).toBe(false);
    r.step({ phase: 'end', night: 1, t: 30, dt: 0, visible: null });
    expect(r.flow.over).toBe(true);
    expect(r.flow.complete).toBe(false);
    expect(r.flow.current).toBe(null);
  });

  it('a revive keeps the script going', () => {
    const r = playedDay();
    r.step(night(0));
    r.hold(8.1, night(8));
    r.step(night(21), [{ type: 'cacheCue', post: 2 }]);
    r.step({ phase: 'deathOffer', night: 1, t: 30, dt: 0, visible: null });
    expect(r.step(night(30))).toBe('beam');
  });
});

describe('tutorial script: continuing a saved first day', () => {
  it('known steps are not shown again', () => {
    const flow = startFlow(['feed', 'scrap'], 1, true);
    const out = nextStep(flow, { dt: 0, phase: 'day', night: 1, t: 20, logs: 1, scrap: 2, traps: 0, tags: 0, protected: true, bright: true, moved: true, visible: null, events: [] });
    expect(out.flow.current).toBe('stock');
    expect(out.completed).toEqual([]);
    // Two snags down before the save: straight on to the workbench.
    const later = nextStep(startFlow(['feed', 'scrap'], 2, true), { dt: 0, phase: 'day', night: 1, t: 20, logs: 1, scrap: 2, traps: 0, tags: 0, protected: true, bright: true, moved: true, visible: null, events: [] });
    expect(later.flow.current).toBe('bench');
  });
});
