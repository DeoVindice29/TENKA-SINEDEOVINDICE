import { selectOrderedEntries } from "@/lib/orderedEntries";
import {
  tableFor,
  TIER_LEVELS,
  type KotobaRow,
  type SectionTitleRow,
} from "@/lib/contentTypes";
import { fetchSectionTitles, subChapterLabel } from "@/lib/sectionTitles";
import type { Bilingual, KotobaEntry } from "@/data/types";
import { entryText, kotobaSectionId } from "@/data/kotobaSearch";
import { registerQuizView } from "@/lib/quizModes";

/**
 * Kotoba dari Supabase per level JLPT (kotoba_entries_n5 ... _n1) untuk layar
 * Lessons. Data bawaan (src/data/kotobaN5.ts) TIDAK disentuh — layar cuma
 * memilih mau pakai sumber yang mana lewat ContentSourceSwitch.
 */

export type KotobaLevel = (typeof TIER_LEVELS)[number];
export const KOTOBA_LEVELS = TIER_LEVELS;

type Lang = "en" | "id";

// ---------- bentuk data yang dipakai layar ----------

export type KotobaSubGroupView = {
  /** kunci unik, dipakai sebagai "tierKey" di id section & chip: sb-N4-1-2 */
  key: string;
  sectionId: string;
  subTier: number;
  title: Bilingual;
  desc: Bilingual;
  items: KotobaEntry[];
};

export type KotobaChapterView = {
  id: string;
  chapter: number;
  sample: string;
  title: Bilingual;
  desc: Bilingual;
  subGroups: KotobaSubGroupView[];
};

export type KotobaLevelView = {
  kind: "kotoba";
  level: KotobaLevel;
  /** Category (organize_sources.id) asal data ini */
  sourceId: number;
  /** mode kuis "All Mixed" untuk view ini (terdaftar di SCRIPTS lewat lib/quizModes.ts) */
  allKey: string;
  chapters: KotobaChapterView[];
  total: number;
  /** key sub chapter -> id grup accordion yang memuatnya (buat jumpToSection) */
  groupOfKey: Record<string, string>;
};

// ---------- konversi baris -> entry ----------

function toKotobaEntry(row: KotobaRow): KotobaEntry {
  return [
    row.kana,
    row.romaji,
    { en: row.meaning_en, id: row.meaning_id },
    row.example,
    row.segments ?? [],
    { en: row.example_translation_en, id: row.example_translation_id },
    row.kanji_word,
    row.kanji_example,
    row.usage_en || row.usage_id
      ? { en: row.usage_en ?? "", id: row.usage_id ?? "" }
      : "",
  ];
}

function subTierTitle(
  titles: SectionTitleRow[],
  chapter: number,
  subTier: number,
): Bilingual {
  const match = titles.find(
    (r) => r.chapter === chapter && r.sub_tier === subTier,
  );
  return {
    en: subChapterLabel(chapter, subTier, match?.title_en),
    id: subChapterLabel(chapter, subTier, match?.title_id),
  };
}

// Nama Chapter disimpan dengan sub_tier = 0 (lihat lib/sectionTitles.ts).
function chapterTitle(titles: SectionTitleRow[], chapter: number): Bilingual {
  const match = titles.find((r) => r.chapter === chapter && r.sub_tier === 0);
  return {
    en: match?.title_en || `Chapter ${chapter}`,
    id: match?.title_id || `Bab ${chapter}`,
  };
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

export function buildKotobaView(
  level: KotobaLevel,
  sourceId: number,
  rows: KotobaRow[],
  titles: SectionTitleRow[],
): KotobaLevelView {
  // chapter -> sub_tier -> rows (urutan rows sudah chapter, sub_tier, id)
  const chapterMap = new Map<number, Map<number, KotobaRow[]>>();
  rows.forEach((row) => {
    if (!chapterMap.has(row.chapter)) chapterMap.set(row.chapter, new Map());
    const subMap = chapterMap.get(row.chapter)!;
    if (!subMap.has(row.sub_tier)) subMap.set(row.sub_tier, []);
    subMap.get(row.sub_tier)!.push(row);
  });

  const groupOfKey: Record<string, string> = {};

  const chapters: KotobaChapterView[] = Array.from(chapterMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([chapter, subMap]) => {
      const groupId = `sb-${level}-kotoba-ch-${chapter}`;
      const subEntries = Array.from(subMap.entries()).sort(
        (a, b) => a[0] - b[0],
      );

      const subGroups: KotobaSubGroupView[] = subEntries.map(
        ([subTier, subRows]) => {
          // sourceId ikut di key: dipakai juga sebagai id mode kuis di SCRIPTS,
          // jadi dua Category di level yang sama tidak boleh bentrok.
          const key = `sb-kotoba-${level}-${sourceId}-${chapter}-${subTier}`;
          groupOfKey[key] = groupId;
          const n = subRows.length;
          return {
            key,
            sectionId: kotobaSectionId(key),
            subTier,
            title: subTierTitle(titles, chapter, subTier),
            desc: {
              en: `${n} ${level} vocabulary ${plural(n, "word")}.`,
              id: `${n} kata kosakata ${level}.`,
            },
            items: subRows.map(toKotobaEntry),
          };
        },
      );

      const total = subGroups.reduce((sum, sg) => sum + sg.items.length, 0);
      const subCount = subGroups.length;
      // contoh kata di header accordion: satu kata dari tiap sub chapter (maks 3)
      const sample = subEntries
        .slice(0, 3)
        .map(([, subRows]) => subRows[0]?.kana ?? "")
        .filter(Boolean)
        .join(" ");

      return {
        id: groupId,
        chapter,
        sample,
        title: chapterTitle(titles, chapter),
        desc: {
          en: `${total} ${level} vocabulary ${plural(total, "word")} across ${subCount} sub chapter${subCount === 1 ? "" : "s"}.`,
          id: `${total} kata kosakata ${level} dalam ${subCount} sub chapter.`,
        },
        subGroups,
      };
    });

  return {
    kind: "kotoba",
    level,
    sourceId,
    allKey: `sb-kotoba-${level}-${sourceId}-all`,
    chapters,
    total: rows.length,
    groupOfKey,
  };
}

// ---------- fetch (dengan paginasi + cache) ----------

const PAGE_SIZE = 1000;

// Supabase membatasi jumlah baris per request (default 1000), sedangkan
// kotoba N5-N1 bisa lebih banyak dari itu — jadi ambil per halaman sampai
// habis. Offset maju sebanyak baris yang benar-benar diterima, supaya tetap
// benar walau batas server lebih kecil dari PAGE_SIZE.
async function fetchAllRows(
  table: string,
  sourceId: number,
): Promise<{ rows: KotobaRow[]; error: string | null }> {
  const rows: KotobaRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await selectOrderedEntries(table, sourceId, {
      from,
      to: from + PAGE_SIZE - 1,
    });
    if (error) return { rows: [], error: error.message };
    if (!data || data.length === 0) break;
    rows.push(...(data as KotobaRow[]));
    from += data.length;
  }
  return { rows, error: null };
}

// Satu view = satu (level, Category). Kuncinya "N5:12" (level:source_id).
const viewCache = new Map<string, KotobaLevelView>();
const inflight = new Map<string, Promise<LoadResult>>();
const viewKey = (level: KotobaLevel, sourceId: number) => `${level}:${sourceId}`;

export type LoadResult =
  | { view: KotobaLevelView; error: null }
  | { view: null; error: string };

export function getCachedKotobaView(
  level: KotobaLevel,
  sourceId: number,
): KotobaLevelView | null {
  return viewCache.get(viewKey(level, sourceId)) ?? null;
}

export function loadKotobaView(
  level: KotobaLevel,
  sourceId: number,
): Promise<LoadResult> {
  const key = viewKey(level, sourceId);
  const cached = viewCache.get(key);
  if (cached) return Promise.resolve({ view: cached, error: null });

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async (): Promise<LoadResult> => {
    try {
      const [rowsRes, titles] = await Promise.all([
        fetchAllRows(tableFor("kotoba", level), sourceId),
        fetchSectionTitles("kotoba", level, sourceId),
      ]);
      if (rowsRes.error) return { view: null, error: rowsRes.error };
      const view = buildKotobaView(level, sourceId, rowsRes.rows, titles);
      // daftarkan ke SCRIPTS supaya Home bisa memakainya untuk kuis
      registerQuizView(view);
      viewCache.set(key, view);
      return { view, error: null };
    } catch (e) {
      return {
        view: null,
        error: e instanceof Error ? e.message : String(e),
      };
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

// ---------- pencarian di level data ----------

const textCache = new WeakMap<KotobaSubGroupView, Partial<Record<Lang, string[]>>>();

function textsOf(sg: KotobaSubGroupView, lang: Lang): string[] {
  let byLang = textCache.get(sg);
  if (!byLang) {
    byLang = {};
    textCache.set(sg, byLang);
  }
  const hit = byLang[lang];
  if (hit) return hit;
  const built = sg.items.map((item) => entryText(item, lang));
  byLang[lang] = built;
  return built;
}

export type KotobaViewSearch = {
  total: number;
  /** key sub chapter -> jumlah kartu cocok */
  perKey: Record<string, number>;
  /** id grup accordion yang punya minimal satu kartu cocok (kosong kalau tanpa query) */
  groupIds: string[];
};

export function searchKotobaView(
  view: KotobaLevelView,
  query: string,
  lang: Lang,
): KotobaViewSearch {
  const q = query.trim().toLowerCase();
  const perKey: Record<string, number> = {};
  const groupIds: string[] = [];
  let total = 0;

  view.chapters.forEach((ch) => {
    let chapterHit = false;
    ch.subGroups.forEach((sg) => {
      const texts = textsOf(sg, lang);
      const n = q
        ? texts.reduce((acc, text) => acc + (text.includes(q) ? 1 : 0), 0)
        : texts.length;
      perKey[sg.key] = n;
      total += n;
      if (q && n > 0) chapterHit = true;
    });
    if (chapterHit) groupIds.push(ch.id);
  });

  return { total, perKey, groupIds };
}
