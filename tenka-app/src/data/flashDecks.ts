import {
  KOTOBA_N5_CHAPTERS,
  KOTOBA_TIER_KEYS,
  KOTOBA_N5_LEVEL_TEXT,
} from "./kotobaN5";
import {
  KANJI_N5_CHAPTERS,
  KANJI_TIER_KEYS,
  KANJI_LEVEL_META,
} from "./kanjiN5";

export type FlashDeckRef =
  | { kind: "kotoba"; tierKey: string }
  | { kind: "kanji"; tierKey: string }
  | { kind: "custom"; deckId: string };

export type FlashCardDescriptor = {
  id: string;
  kind: "kotoba" | "kanji" | "custom";
  tierKey?: string;
  idx: number;
  deckId?: string;
};

export function buildDeckCardDescriptors(
  ref: FlashDeckRef,
): FlashCardDescriptor[] {
  // Custom deck: baca dari localStorage
  if (ref.kind === "custom") {
    try {
      const raw = localStorage.getItem("tebakAksara_flashCustomDecks_v1");
      const decks = raw ? JSON.parse(raw) : [];
      const deck = decks.find((d: { id: string }) => d.id === ref.deckId);
      if (!deck) return [];
      return deck.cards.map((_: unknown, i: number) => ({
        id: `custom:${ref.deckId}:${i}`,
        kind: "custom" as const,
        deckId: ref.deckId,
        idx: i,
      }));
    } catch {
      return [];
    }
  }

  const tierKeys: readonly string[] =
    ref.kind === "kotoba" ? KOTOBA_TIER_KEYS : KANJI_TIER_KEYS;

  const tiers: readonly string[] =
    ref.tierKey === "all" ? tierKeys : [ref.tierKey];

  const out: FlashCardDescriptor[] = [];
  tiers.forEach((tk) => {
    const idx = tierKeys.indexOf(tk);
    if (idx < 0) return;
    const arr =
      ref.kind === "kotoba" ? KOTOBA_N5_CHAPTERS[idx] : KANJI_N5_CHAPTERS[idx];
    arr.forEach((_, i) => {
      out.push({
        id: `${ref.kind}:${tk}:${i}`,
        kind: ref.kind,
        tierKey: tk,
        idx: i,
      });
    });
  });
  return out;
}

export function getBuiltinDeckDefs() {
  const defs: { ref: FlashDeckRef; label: string; total: number }[] = [];

  KOTOBA_TIER_KEYS.forEach((tk) => {
    const idx = KOTOBA_TIER_KEYS.indexOf(tk);
    const meta = KOTOBA_N5_LEVEL_TEXT[tk as keyof typeof KOTOBA_N5_LEVEL_TEXT];
    const count = KOTOBA_N5_CHAPTERS[idx].length;
    defs.push({
      ref: { kind: "kotoba", tierKey: tk },
      label: `Kotoba — ${meta?.title?.en ?? tk}`,
      total: count,
    });
  });

  defs.push({
    ref: { kind: "kotoba", tierKey: "all" },
    label: "Kotoba — All Mixed",
    total: KOTOBA_N5_CHAPTERS.reduce((sum, c) => sum + c.length, 0),
  });

  KANJI_TIER_KEYS.forEach((tk, i) => {
    const meta = KANJI_LEVEL_META[i];
    const count = KANJI_N5_CHAPTERS[i].length;
    defs.push({
      ref: { kind: "kanji", tierKey: tk },
      label: `Kanji N5 — ${meta?.id ?? tk}`,
      total: count,
    });
  });

  defs.push({
    ref: { kind: "kanji", tierKey: "all" },
    label: "Kanji N5 — All Mixed",
    total: KANJI_N5_CHAPTERS.reduce((sum, c) => sum + c.length, 0),
  });

  return defs;
}
