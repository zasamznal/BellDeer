// DraftSystem (GDD §5): three different cards after nights 1–98.

import { CARDS, CARD_BY_ID, type CardDef, IDEAS, RULES, type Rarity } from './rules';
import type { World } from './world';

const RARITIES: Rarity[] = ['common', 'rare', 'epic'];

function available(w: World, exclude: readonly string[]): CardDef[] {
  const s = w.state;
  const pl = s.player;
  return CARDS.filter((c) => {
    if (exclude.includes(c.id)) return false;
    if (c.kind === 'passive') return !s.cards.includes(c.id);
    if (s.supplyRest.includes(c.id)) return false;
    if (c.id === 'C07') return pl.logs < RULES.limits.logs;
    if (c.id === 'C08') return pl.scrap < RULES.limits.scrap;
    return true;
  });
}

/** 60 / 30 / 10 by rarity; an empty rarity gives its weight to the others proportionally. */
function drawOne(w: World, pool: CardDef[]): CardDef | null {
  if (!pool.length) return null;
  const present = RARITIES.filter((r) => pool.some((c) => c.rarity === r));
  const total = present.reduce((a, r) => a + RULES.draft.weights[r], 0);
  let roll = w.rngCards.next() * total;
  let rarity = present[present.length - 1];
  for (const r of present) {
    roll -= RULES.draft.weights[r];
    if (roll < 0) {
      rarity = r;
      break;
    }
  }
  return w.rngCards.pick(pool.filter((c) => c.rarity === rarity));
}

export function dealHand(w: World, exclude: readonly string[]): string[] {
  const s = w.state;
  const hand: string[] = [];
  let pool = available(w, exclude);
  // [ideas 6] A completed night challenge deals four cards (as many as the pool still has).
  const size = s.ideas.dawnFour ? IDEAS.challenge.handSize : 3;
  for (let i = 0; i < size; i++) {
    // [ideas 7] After a bell night with a banked tag, slot one is rare or epic while any is left.
    const fine = i === 0 && s.ideas.dawnRare ? pool.filter((c) => c.rarity !== 'common') : [];
    const base = fine.length ? fine : pool;
    // From the second dawn on, slot one leans toward the tag of the last permanent pick.
    const tagged = i === 0 && s.lastTag ? base.filter((c) => c.tag === s.lastTag) : [];
    const card = drawOne(w, tagged.length ? tagged : base);
    if (!card) break;
    hand.push(card.id);
    pool = pool.filter((c) => c.id !== card.id);
  }
  return hand;
}

export type PickResult = 'done' | 'needReplace' | 'invalid';

/** Choose card i from the hand. A fifth passive asks which slot to replace. */
export function pickCard(w: World, index: number): PickResult {
  const s = w.state;
  if (s.phase !== 'draft' || !s.hand || s.pendingCard) return 'invalid';
  const id = s.hand[index];
  const card = id ? CARD_BY_ID[id] : undefined;
  if (!card) return 'invalid';
  s.supplyRest = [];
  if (card.kind === 'supply') {
    const pl = s.player;
    if (id === 'C07') pl.logs = Math.min(RULES.limits.logs, pl.logs + 2);
    if (id === 'C08') pl.scrap = Math.min(RULES.limits.scrap, pl.scrap + 2);
    s.supplyRest = [id];
    s.hand = []; // one choice per dawn
    return 'done';
  }
  if (s.cards.length >= RULES.draft.slots) {
    s.pendingCard = id;
    return 'needReplace';
  }
  s.cards.push(id);
  s.lastTag = card.tag;
  s.hand = [];
  w.refreshMods();
  return 'done';
}

/** Resolve a pending fifth card: slot 0–3 replaces, −1 keeps the old build. */
export function replaceCard(w: World, slot: number): boolean {
  const s = w.state;
  if (s.phase !== 'draft' || !s.pendingCard || slot >= s.cards.length) return false;
  s.hand = [];
  if (slot >= 0) {
    s.cards[slot] = s.pendingCard;
    s.lastTag = CARD_BY_ID[s.pendingCard].tag;
    w.refreshMods();
  }
  s.pendingCard = null;
  return true;
}

export function skipCard(w: World): boolean {
  const s = w.state;
  if (s.phase !== 'draft' || s.pendingCard || !s.hand?.length) return false;
  s.supplyRest = [];
  s.hand = [];
  return true;
}

export function canReroll(w: World): boolean {
  const s = w.state;
  return (
    s.phase === 'draft' &&
    !!s.hand?.length &&
    !s.pendingCard &&
    s.stats.nightsSurvived >= 2 &&
    s.rerollChapter !== w.chapterOf(s.night) &&
    s.player.scrap >= RULES.reroll.scrap
  );
}

/** One reroll per chapter for 2 scrap: a new triple without the cards of the previous hand. */
export function reroll(w: World): boolean {
  const s = w.state;
  if (!canReroll(w)) return false;
  s.player.scrap -= RULES.reroll.scrap;
  s.rerollChapter = w.chapterOf(s.night);
  s.hand = dealHand(w, s.hand ?? []);
  w.syncRng();
  return true;
}
