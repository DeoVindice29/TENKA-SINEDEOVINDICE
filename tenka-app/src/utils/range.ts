import { SCRIPTS } from "@/data/scripts";
import { GOJUON_HIRAGANA } from "@/data/hiragana";
import { GOJUON_KATAKANA } from "@/data/katakana";
import { shuffle } from "@/utils/shuffle";

export type RangeMode = "manual" | "random";

export type RangeItem = {
  kana: string;
  romaji: string;
  arti: string;
  /** nomor batch — dipakai buat warna selang-seling di daftar dropdown */
  batch: number;
};

type ScriptShape = {
  data: Record<string, readonly (readonly unknown[])[]>;
  dataRomaji?: Record<string, readonly (readonly unknown[])[]>;
  quizType?: string;
};

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "en" in (v as Record<string, unknown>)) {
    return String((v as { en: unknown }).en ?? "");
  }
  return String(v);
}

// Batch selang-seling: hiragana/katakana pakai grup baris tabel gojūon asli
// (mis. "a-i-u-e-o" satu batch), script lain dikelompokkan tiap 4 item
// berurutan supaya tetap ada variasi warna walau tanpa tabel baris.
function getBatchSizes(
  scriptKey: string,
  modeId: string,
  total: number,
): number[] {
  const isKana = scriptKey === "hiragana" || scriptKey === "katakana";
  if (isKana) {
    const gojuon = (
      scriptKey === "hiragana" ? GOJUON_HIRAGANA : GOJUON_KATAKANA
    ) as Record<string, { chars: unknown[] }[]>;
    const tiers = modeId === "all" ? ["tier1", "tier2", "tier3"] : [modeId];
    const sizes: number[] = [];
    tiers.forEach((tier) => {
      (gojuon[tier] ?? []).forEach((row) => {
        const n = row.chars.filter(Boolean).length;
        if (n > 0) sizes.push(n);
      });
    });
    return sizes;
  }
  const sizes: number[] = [];
  for (let remaining = total; remaining > 0; remaining -= 4) {
    sizes.push(Math.min(4, remaining));
  }
  return sizes;
}

/** Daftar item (kana / romaji / arti / batch) dari satu tingkatan. */
export function getRangeItems(scriptKey: string, modeId: string): RangeItem[] {
  const script = SCRIPTS[scriptKey as keyof typeof SCRIPTS] as unknown as
    | ScriptShape
    | undefined;
  const pool = script?.data?.[modeId];
  if (!script || !pool) return [];

  const batchOf: number[] = [];
  getBatchSizes(scriptKey, modeId, pool.length).forEach((size, b) => {
    for (let k = 0; k < size; k++) batchOf.push(b);
  });

  return pool.map((item, i) => {
    const kana = str(item[0]);
    const romajiPool = script.dataRomaji?.[modeId];
    let romaji = "";
    let arti = "";
    if (romajiPool) {
      romaji = str(romajiPool[i]?.[1]);
      arti = str(item[1]);
    } else if (script.quizType === "meaning") {
      arti = str(item[1]);
    } else {
      romaji = str(item[1]);
    }
    return { kana, romaji, arti, batch: batchOf[i] ?? 0 };
  });
}

/** Opsi jumlah soal mode Acak: kelipatan 5 sampai total, selalu diakhiri "seluruh". */
export function getRandomCountSteps(total: number): number[] {
  const steps: number[] = [];
  for (let n = 5; n < total; n += 5) steps.push(n);
  steps.push(total);
  return steps;
}

export type RangeSelection = {
  mode: RangeMode;
  from: number;
  to: number;
  randomCount: number;
};

/** Indeks soal yang dipakai dari sebuah pool, sesuai mode rentang yang aktif. */
export function computeRangeIndices(
  length: number,
  range?: RangeSelection,
): number[] {
  const all = Array.from({ length }, (_, i) => i);
  if (!range || length === 0) return all;
  if (range.mode === "random") {
    return shuffle(all).slice(0, Math.min(range.randomCount, length));
  }
  const from = Math.max(0, Math.min(range.from, length - 1));
  const to = Math.max(from, Math.min(range.to, length - 1));
  return all.slice(from, to + 1);
}
