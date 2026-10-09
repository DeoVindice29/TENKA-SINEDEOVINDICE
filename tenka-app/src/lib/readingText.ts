// Parser untuk teks cerita dengan markup {kanji|bacaan}.
// Lihat catatan di src/data/readingStories.ts.

import type { ReadingToken } from "@/data/readingStories";

export type ReadingSegment = {
  /** teks yang ditampilkan di mode kanji (atau kana biasa kalau tanpa ruby) */
  text: string;
  /** bacaan hiragana; undefined = segmen ini kana biasa */
  ruby?: string;
};

const TOKEN = /\{([^{}|]+)\|([^{}|]+)\}/g;

export function parseReading(src: string): ReadingSegment[] {
  const out: ReadingSegment[] = [];
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: src.slice(last, at) });
    out.push({ text: m[1], ruby: m[2] });
    last = at + m[0].length;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out;
}

/** Versi hiragana polos (semua kanji diganti bacaannya). */
export function toKana(src: string): string {
  return src.replace(TOKEN, (_m, _k: string, r: string) => r);
}

/** Versi kanji tanpa furigana. */
export function toKanji(src: string): string {
  return src.replace(TOKEN, (_m, k: string) => k);
}

/** Cerita → daftar kalimat hiragana (dipecah di 。), untuk suara. */
export function storySentences(tokens: readonly ReadingToken[]): string[] {
  const out: string[] = [];
  let cur = "";
  for (const tk of tokens) {
    cur += toKana(tk.t);
    if (tk.t === "。") {
      out.push(cur);
      cur = "";
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
}
