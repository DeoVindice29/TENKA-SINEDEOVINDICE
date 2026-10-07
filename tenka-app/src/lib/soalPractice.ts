import { supabase } from "@/lib/supabaseClient";
import { tableFor, type SoalRow } from "@/lib/contentTypes";
import {
  JLPT_TIER_TYPES,
  PRACTICE_MIXED,
  isPracticeType,
  type JlptQueueItem,
  type JlptScriptKey,
  type PracticeModeKey,
  type PracticeTypeKey,
} from "@/data/jlptConquest";

/**
 * Bank soal Latihan dari Supabase (soal_entries_<level>), diambil per
 * Level + aksara + Category. Dipakai Practice saat user memilih Category
 * dari database (bukan "Topic" bawaan). Soal ditulis admin lewat
 * Admin Panel -> Script Practice.
 */

type Lang = "en" | "id";

const cache = new Map<string, SoalRow[]>();
const cacheKey = (level: string, script: string, sourceId: number) =>
  `${level}:${script}:${sourceId}`;

export function getCachedSoal(
  level: string,
  script: JlptScriptKey,
  sourceId: number,
): SoalRow[] | null {
  return cache.get(cacheKey(level, script, sourceId)) ?? null;
}

export async function loadSoal(
  level: string,
  script: JlptScriptKey,
  sourceId: number,
): Promise<{ rows: SoalRow[]; error: null } | { rows: null; error: string }> {
  const { data, error } = await supabase
    .from(tableFor("soal", level))
    .select("*")
    .eq("script", script)
    .eq("source_id", sourceId)
    .not("question_type", "is", null)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) return { rows: null, error: error.message };
  const rows = (data ?? []) as SoalRow[];
  cache.set(cacheKey(level, script, sourceId), rows);
  return { rows, error: null };
}

/** Hanya soal yang tipenya dikenal aksara ini (tipe lain di DB diabaikan). */
function usable(rows: SoalRow[], script: JlptScriptKey): SoalRow[] {
  return rows.filter(
    (r) =>
      !!r.question_type &&
      isPracticeType(script, r.question_type) &&
      Array.isArray(r.options) &&
      r.options.length >= 2 &&
      r.answer_index >= 0 &&
      r.answer_index < r.options.length,
  );
}

/** Jumlah soal per tipe + total untuk mode Mixed. */
export function soalCounts(
  rows: SoalRow[],
  script: JlptScriptKey,
): Partial<Record<PracticeModeKey, number>> {
  const out: Partial<Record<PracticeModeKey, number>> = {};
  let total = 0;
  for (const r of usable(rows, script)) {
    const k = r.question_type as PracticeTypeKey;
    out[k] = (out[k] ?? 0) + 1;
    total += 1;
  }
  out[PRACTICE_MIXED] = total;
  return out;
}

const EXPLAIN_LABEL_KEY = "practice.sheet.explanationLabel";

/**
 * Baris soal -> format antrean yang dipakai PracticeSheet:
 * [soal, jawaban, tipe, info tambahan, key label info, pilihan jawaban].
 * Info tambahan = pembahasan (bahasa aktif, jatuh ke bahasa lain kalau kosong).
 */
export function soalRowsToQueue(
  rows: SoalRow[],
  script: JlptScriptKey,
  lang: Lang,
): JlptQueueItem[] {
  return usable(rows, script).map((r): JlptQueueItem => {
    const type = r.question_type as PracticeTypeKey;
    const explanation =
      (lang === "en"
        ? r.explanation_en || r.explanation_id
        : r.explanation_id || r.explanation_en) || "";
    const translation =
      (lang === "en"
        ? r.question_translation_en || r.question_translation_id
        : r.question_translation_id || r.question_translation_en) || "";
    const extra = [translation, explanation].filter(Boolean).join(" — ");
    return [
      r.question,
      r.options[r.answer_index],
      JLPT_TIER_TYPES[type],
      extra || undefined,
      extra ? EXPLAIN_LABEL_KEY : undefined,
      [...r.options],
    ];
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** `count` soal acak dari kumpulan (satu tipe, atau semua tipe untuk Mixed); pilihan jawaban diacak. */
export function pickFromPool(
  pool: JlptQueueItem[],
  mode: PracticeModeKey,
  count: number,
): JlptQueueItem[] {
  const subset =
    mode === PRACTICE_MIXED
      ? pool
      : pool.filter((q) => q[2] === JLPT_TIER_TYPES[mode as PracticeTypeKey]);
  return shuffle(subset)
    .slice(0, count)
    .map((q) => {
      const copy = [...q] as JlptQueueItem;
      if (copy[5]) copy[5] = shuffle(copy[5]);
      return copy;
    });
}
