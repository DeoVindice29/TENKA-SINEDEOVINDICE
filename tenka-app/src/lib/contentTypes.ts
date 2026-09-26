/**
 * Bentuk baris di tabel Supabase kotoba_entries / kanji_entries /
 * bunpo_entries — dipakai bareng oleh AdminPanel (nulis) dan layar N4
 * (baca). Sengaja "flat" (bukan tuple kayak KotobaEntry/BunpoEntry di
 * src/data/types.ts) karena lebih gampang dipetakan ke form HTML.
 */

export type SegmentPair = readonly [string, string];

export type KotobaRow = {
  id: number;
  tier: string;
  chapter: number;
  sub_tier: number;
  kana: string;
  romaji: string;
  meaning_en: string;
  meaning_id: string;
  example: string;
  segments: SegmentPair[];
  example_translation_en: string;
  example_translation_id: string;
  kanji_word: string;
  kanji_example: string;
  usage_en: string | null;
  usage_id: string | null;
  created_at: string;
};

export type KanjiRow = {
  id: number;
  tier: string;
  chapter: number;
  sub_tier: number;
  kanji: string;
  reading: string;
  meaning_en: string;
  meaning_id: string;
  kana: string;
  created_at: string;
};

export type BunpoRow = {
  id: number;
  tier: string;
  chapter: number;
  sub_tier: number;
  pattern: string;
  example: string;
  meaning_en: string;
  meaning_id: string;
  segments: SegmentPair[];
  blank_version: string;
  example_translation_en: string;
  example_translation_id: string;
  usage_note_en: string | null;
  usage_note_id: string | null;
  created_at: string;
};

export type ContentKind = "kotoba" | "kanji" | "bunpo";

export const TABLE_NAME: Record<ContentKind, string> = {
  kotoba: "kotoba_entries",
  kanji: "kanji_entries",
  bunpo: "bunpo_entries",
};

/**
 * Satu baris = nama untuk satu grup (tier, chapter, sub_tier) — misal
 * "Tier 1.1 — Personal Pronouns & Greetings". Dipakai bareng oleh semua
 * ContentKind (kotoba/kanji/bunpo boleh berbagi chapter+sub_tier yang
 * sama), makanya disimpan di tabel terpisah, bukan diulang di tiap entry.
 */
export type SectionTitleRow = {
  tier: string;
  chapter: number;
  sub_tier: number;
  title_en: string;
  title_id: string;
};

export const SECTION_TITLES_TABLE = "section_titles";
