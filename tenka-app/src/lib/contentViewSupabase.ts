import { selectOrderedEntries } from "@/lib/orderedEntries";
import {
  tableFor,
  type BunpoRow,
  type KanjiRow,
  type SectionTitleRow,
} from "@/lib/contentTypes";
import { fetchSectionTitles, subChapterLabel } from "@/lib/sectionTitles";
import type { Bilingual, BunpoEntry, KanjiEntry } from "@/data/types";
import type { KotobaLevel } from "@/lib/kotobaSupabase";
import { registerQuizView } from "@/lib/quizModes";

/**
 * Bunpō & Kanji dari Supabase per level JLPT + "Category" (Minna no
 * Nihongo, dst) untuk layar Lessons. Bentuknya sengaja sama dengan
 * lib/kotobaSupabase.ts (Chapter -> Sub Chapter), supaya LearnScreen bisa
 * merender ketiganya lewat accordion yang sama. Data bawaan app
 * (src/data/bunpoN5.ts, kanjiN5.ts) TIDAK disentuh.
 */

export type LessonKind = "bunpo" | "kanji";

type Lang = "en" | "id";

type EntryOf<K extends LessonKind> = K extends "bunpo" ? BunpoEntry : KanjiEntry;

export type ContentSubGroupView<E> = {
  /** kunci unik: sb-bunpo-N5-1-2 */
  key: string;
  sectionId: string;
  subTier: number;
  title: Bilingual;
  desc: Bilingual;
  items: E[];
};

export type ContentChapterView<E> = {
  id: string;
  chapter: number;
  sample: string;
  title: Bilingual;
  desc: Bilingual;
  subGroups: ContentSubGroupView<E>[];
};

export type ContentLevelView<E> = {
  kind: LessonKind;
  level: KotobaLevel;
  /** Category (organize_sources.id) asal data ini */
  sourceId: number;
  /** mode kuis "All Mixed" untuk view ini (terdaftar di SCRIPTS lewat lib/quizModes.ts) */
  allKey: string;
  chapters: ContentChapterView<E>[];
  total: number;
  /** key sub chapter -> id grup accordion yang memuatnya (buat jumpToSection) */
  groupOfKey: Record<string, string>;
};

export type BunpoLevelView = ContentLevelView<BunpoEntry>;
export type KanjiLevelView = ContentLevelView<KanjiEntry>;

/** id section stabil untuk chip navigasi & jumpToSection */
export function lessonSectionId(kind: LessonKind, key: string): string {
  return `learn-sec-${kind}-${key}`;
}

// ---------- konversi baris -> entry ----------

export function toBunpoEntry(row: BunpoRow): BunpoEntry {
  return [
    row.pattern,
    row.example,
    { en: row.meaning_en, id: row.meaning_id },
    row.segments ?? [],
    row.blank_version ?? "",
    { en: row.example_translation_en, id: row.example_translation_id },
    row.usage_note_en || row.usage_note_id
      ? { en: row.usage_note_en ?? "", id: row.usage_note_id ?? "" }
      : "",
  ];
}

export function toKanjiEntry(row: KanjiRow): KanjiEntry {
  return [
    row.kanji,
    row.reading,
    { en: row.meaning_en, id: row.meaning_id },
    row.kana,
  ];
}

// ---------- judul & deskripsi ----------

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

function countDesc(
  kind: LessonKind,
  level: KotobaLevel,
  n: number,
): Bilingual {
  if (kind === "bunpo") {
    return {
      en: `${n} ${level} grammar ${plural(n, "pattern")}.`,
      id: `${n} pola tata bahasa ${level}.`,
    };
  }
  return {
    en: `${n} ${level} kanji.`,
    id: `${n} kanji ${level}.`,
  };
}

function chapterDesc(
  kind: LessonKind,
  level: KotobaLevel,
  total: number,
  subCount: number,
): Bilingual {
  const subEn = `${subCount} sub chapter${subCount === 1 ? "" : "s"}`;
  if (kind === "bunpo") {
    return {
      en: `${total} ${level} grammar ${plural(total, "pattern")} across ${subEn}.`,
      id: `${total} pola tata bahasa ${level} dalam ${subCount} sub chapter.`,
    };
  }
  return {
    en: `${total} ${level} kanji across ${subEn}.`,
    id: `${total} kanji ${level} dalam ${subCount} sub chapter.`,
  };
}

// ---------- bangun view ----------

type Row = { chapter: number; sub_tier: number };

function buildView<R extends Row, E>(
  kind: LessonKind,
  level: KotobaLevel,
  sourceId: number,
  rows: R[],
  titles: SectionTitleRow[],
  toEntry: (row: R) => E,
  sampleOf: (row: R) => string,
): ContentLevelView<E> {
  // chapter -> sub_tier -> rows (urutan rows sudah chapter, sub_tier, sort_order, id)
  const chapterMap = new Map<number, Map<number, R[]>>();
  rows.forEach((row) => {
    if (!chapterMap.has(row.chapter)) chapterMap.set(row.chapter, new Map());
    const subMap = chapterMap.get(row.chapter)!;
    if (!subMap.has(row.sub_tier)) subMap.set(row.sub_tier, []);
    subMap.get(row.sub_tier)!.push(row);
  });

  const groupOfKey: Record<string, string> = {};

  const chapters: ContentChapterView<E>[] = Array.from(chapterMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([chapter, subMap]) => {
      const groupId = `sb-${level}-${kind}-ch-${chapter}`;
      const subEntries = Array.from(subMap.entries()).sort(
        (a, b) => a[0] - b[0],
      );

      const subGroups: ContentSubGroupView<E>[] = subEntries.map(
        ([subTier, subRows]) => {
          // sourceId ikut di key: dipakai juga sebagai id mode kuis di SCRIPTS,
          // jadi dua Category di level yang sama tidak boleh bentrok.
          const key = `sb-${kind}-${level}-${sourceId}-${chapter}-${subTier}`;
          groupOfKey[key] = groupId;
          return {
            key,
            sectionId: lessonSectionId(kind, key),
            subTier,
            title: subTierTitle(titles, chapter, subTier),
            desc: countDesc(kind, level, subRows.length),
            items: subRows.map(toEntry),
          };
        },
      );

      const total = subGroups.reduce((sum, sg) => sum + sg.items.length, 0);
      // contoh di header accordion: satu item dari tiap sub chapter (maks 3)
      const sample = subEntries
        .slice(0, 3)
        .map(([, subRows]) => (subRows[0] ? sampleOf(subRows[0]) : ""))
        .filter(Boolean)
        .join(" ");

      return {
        id: groupId,
        chapter,
        sample,
        title: chapterTitle(titles, chapter),
        desc: chapterDesc(kind, level, total, subGroups.length),
        subGroups,
      };
    });

  return {
    kind,
    level,
    sourceId,
    allKey: `sb-${kind}-${level}-${sourceId}-all`,
    chapters,
    total: rows.length,
    groupOfKey,
  };
}

// ---------- fetch (dengan paginasi + cache) ----------

const PAGE_SIZE = 1000;

// Supabase membatasi jumlah baris per request (default 1000). Ambil per
// halaman sampai habis; offset maju sebanyak baris yang benar-benar diterima.
async function fetchAllRows<R>(
  table: string,
  sourceId: number,
): Promise<{ rows: R[]; error: string | null }> {
  const rows: R[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await selectOrderedEntries(table, sourceId, {
      from,
      to: from + PAGE_SIZE - 1,
    });
    if (error) return { rows: [], error: error.message };
    if (!data || data.length === 0) break;
    rows.push(...(data as R[]));
    from += data.length;
  }
  return { rows, error: null };
}

export type LoadContentResult<E> =
  | { view: ContentLevelView<E>; error: null }
  | { view: null; error: string };

// Satu view = satu (kind, level, Category). Kuncinya "bunpo:N5:12".
const viewCache = new Map<string, ContentLevelView<any>>();
const inflight = new Map<string, Promise<LoadContentResult<any>>>();
const viewKey = (kind: LessonKind, level: KotobaLevel, sourceId: number) =>
  `${kind}:${level}:${sourceId}`;

export function getCachedContentView<K extends LessonKind>(
  kind: K,
  level: KotobaLevel,
  sourceId: number,
): ContentLevelView<EntryOf<K>> | null {
  return viewCache.get(viewKey(kind, level, sourceId)) ?? null;
}

export function loadContentView<K extends LessonKind>(
  kind: K,
  level: KotobaLevel,
  sourceId: number,
): Promise<LoadContentResult<EntryOf<K>>> {
  const key = viewKey(kind, level, sourceId);
  const cached = viewCache.get(key);
  if (cached) return Promise.resolve({ view: cached, error: null });

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async (): Promise<LoadContentResult<any>> => {
    try {
      const table = tableFor(kind, level);
      const titlesPromise = fetchSectionTitles(kind, level, sourceId);
      let view: ContentLevelView<any>;
      if (kind === "bunpo") {
        const [res, titles] = await Promise.all([
          fetchAllRows<BunpoRow>(table, sourceId),
          titlesPromise,
        ]);
        if (res.error) return { view: null, error: res.error };
        view = buildView(
          "bunpo",
          level,
          sourceId,
          res.rows,
          titles,
          toBunpoEntry,
          (row) => row.pattern,
        );
      } else {
        const [res, titles] = await Promise.all([
          fetchAllRows<KanjiRow>(table, sourceId),
          titlesPromise,
        ]);
        if (res.error) return { view: null, error: res.error };
        view = buildView(
          "kanji",
          level,
          sourceId,
          res.rows,
          titles,
          toKanjiEntry,
          (row) => row.kanji,
        );
      }
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

function tf(entry: Bilingual | string | null | undefined, lang: Lang): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return entry[lang] || entry.en || entry.id || "";
}

/** Teks yang sama dengan yang dirender GrammarCard, supaya hasilnya identik. */
export function bunpoEntryText(entry: BunpoEntry, lang: Lang): string {
  const [pattern, example, meaning, segments, , translation, usage] = entry;
  const segText = Array.isArray(segments)
    ? segments.map(([seg, rom]) => `${seg} ${rom}`).join(" ")
    : "";
  return [
    pattern,
    tf(meaning, lang),
    example,
    segText,
    tf(translation, lang),
    tf(usage as Bilingual | "" | undefined, lang),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Teks yang sama dengan yang dirender KanjiGrid. */
export function kanjiEntryText(entry: KanjiEntry, lang: Lang): string {
  const [char, reading, meaning] = entry;
  return [char, reading, tf(meaning, lang)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const textCache = new WeakMap<
  ContentSubGroupView<any>,
  Partial<Record<Lang, string[]>>
>();

function textsOf(
  kind: LessonKind,
  sg: ContentSubGroupView<any>,
  lang: Lang,
): string[] {
  let byLang = textCache.get(sg);
  if (!byLang) {
    byLang = {};
    textCache.set(sg, byLang);
  }
  const hit = byLang[lang];
  if (hit) return hit;
  const built = sg.items.map((item) =>
    kind === "bunpo" ? bunpoEntryText(item, lang) : kanjiEntryText(item, lang),
  );
  byLang[lang] = built;
  return built;
}

export type ContentViewSearch = {
  total: number;
  /** key sub chapter -> jumlah item cocok */
  perKey: Record<string, number>;
  /** id grup accordion yang punya minimal satu item cocok (kosong kalau tanpa query) */
  groupIds: string[];
};

export function searchContentView(
  view: ContentLevelView<any>,
  query: string,
  lang: Lang,
): ContentViewSearch {
  const q = query.trim().toLowerCase();
  const perKey: Record<string, number> = {};
  const groupIds: string[] = [];
  let total = 0;

  view.chapters.forEach((ch) => {
    let chapterHit = false;
    ch.subGroups.forEach((sg) => {
      const texts = textsOf(view.kind, sg, lang);
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
