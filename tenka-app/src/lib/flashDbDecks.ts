import {
  loadKotobaView,
  getCachedKotobaView,
  type KotobaLevel,
  type KotobaLevelView,
} from "@/lib/kotobaSupabase";
import {
  loadContentView,
  getCachedContentView,
  type ContentLevelView,
} from "@/lib/contentViewSupabase";
import type { KanjiEntry, KotobaEntry } from "@/data/types";

/**
 * Konten yang ditambahkan admin (tabel kotoba/kanji_entries_<level>,
 * dikelompokkan per "Organize by") sebagai deck flashcard. Satu deck = satu
 * Organize by di satu level. Flashcard hanya untuk Kotoba dan Kanji. Datanya
 * dibaca lewat loader yang sama dengan layar Lessons, jadi cache-nya dipakai
 * bareng (tidak fetch dua kali).
 */

export type FlashDbContent = "kotoba" | "kanji";

export type DbDeckRef = {
  kind: "db";
  content: FlashDbContent;
  level: KotobaLevel;
  sourceId: number;
};

export type DbCardEntry =
  | { content: "kotoba"; entry: KotobaEntry }
  | { content: "kanji"; entry: KanjiEntry };

export type DbDeckCard = { id: string; data: DbCardEntry };

export const dbDeckKey = (ref: DbDeckRef) =>
  `${ref.content}:${ref.level}:${ref.sourceId}`;

// ---------- view -> kartu ----------

type AnyView = KotobaLevelView | ContentLevelView<any>;

// id kartu stabil: pakai key sub chapter + isi utama kartu (bukan nomor urut),
// jadi jadwal belajar tidak kacau kalau admin mengurutkan ulang / menyisipkan.
function cardsFromView(ref: DbDeckRef, view: AnyView): DbDeckCard[] {
  const out: DbDeckCard[] = [];
  const seen = new Map<string, number>();
  view.chapters.forEach((ch) => {
    ch.subGroups.forEach((sg: { key: string; items: any[] }) => {
      sg.items.forEach((entry) => {
        const main = String(entry[0] ?? "");
        const base = `db:${sg.key}:${main}`;
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        out.push({
          id: n === 0 ? base : `${base}#${n}`,
          data: { content: ref.content, entry } as DbCardEntry,
        });
      });
    });
  });
  return out;
}

const cardCache = new Map<string, DbDeckCard[]>();

export function getCachedDbDeckCards(ref: DbDeckRef): DbDeckCard[] | null {
  const key = dbDeckKey(ref);
  const hit = cardCache.get(key);
  if (hit) return hit;
  const view: AnyView | null =
    ref.content === "kotoba"
      ? getCachedKotobaView(ref.level, ref.sourceId)
      : getCachedContentView(ref.content, ref.level, ref.sourceId);
  if (!view) return null;
  const cards = cardsFromView(ref, view);
  cardCache.set(key, cards);
  return cards;
}

export async function loadDbDeckCards(
  ref: DbDeckRef,
): Promise<{ cards: DbDeckCard[]; error: null } | { cards: null; error: string }> {
  const cached = getCachedDbDeckCards(ref);
  if (cached) return { cards: cached, error: null };

  const res =
    ref.content === "kotoba"
      ? await loadKotobaView(ref.level, ref.sourceId)
      : await loadContentView(ref.content, ref.level, ref.sourceId);
  if (res.error !== null) return { cards: null, error: res.error };

  const cards = cardsFromView(ref, res.view as AnyView);
  cardCache.set(dbDeckKey(ref), cards);
  return { cards, error: null };
}
