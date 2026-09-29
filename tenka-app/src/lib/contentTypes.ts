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
  /** Organize by (organize_sources.id) tempat entri ini berada. */
  source_id: number;
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
  /** Organize by (organize_sources.id) tempat entri ini berada. */
  source_id: number;
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
  /** Organize by (organize_sources.id) tempat entri ini berada. */
  source_id: number;
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

// Nama dasar tabel per jenis konten. Datanya sudah dipisah per level JLPT,
// jadi jangan dipakai langsung di supabase.from(...) — pakai tableFor().
export const TABLE_NAME: Record<ContentKind, string> = {
  kotoba: "kotoba_entries",
  kanji: "kanji_entries",
  bunpo: "bunpo_entries",
};

export const TIER_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

/** Tabel Supabase untuk satu jenis konten di satu level, mis. kotoba_entries_n5. */
export function tableFor(kind: ContentKind, tier: string): string {
  return `${TABLE_NAME[kind]}_${tier.toLowerCase()}`;
}

/**
 * Satu baris = nama untuk satu grup (tier, chapter, sub_tier) — misal
 * "Sub Chapter 1.1 — Personal Pronouns & Greetings". Disimpan di tabel terpisah dari
 * entri (bukan diulang di tiap entry), satu tabel per ContentKind.
 */
export type SectionTitleRow = {
  tier: string;
  source_id: number;
  chapter: number;
  sub_tier: number;
  title_en: string;
  title_id: string;
};

/**
 * Nama Chapter / Sub Chapter disimpan per jenis konten, jadi Kotoba, Kanji,
 * dan Bunpō masing-masing punya daftar chapter sendiri:
 * section_titles_kotoba, section_titles_kanji, section_titles_bunpo.
 */
export function sectionTitlesTable(kind: ContentKind): string {
  return `section_titles_${kind}`;
}

/**
 * "Organize by" = cara/sumber menyusun materi di satu level, mis. "Minna no
 * Nihongo", "Genki", "Tema Harian". Ada di antara Level dan Chapter:
 * Level -> Organize by -> Chapter -> Sub Chapter -> entri. Daftarnya per jenis
 * konten + level (tabel organize_sources), jadi menghapus satu sumber di
 * Kotoba tidak menyentuh Kanji/Bunpō.
 */
export type OrganizeSourceRow = {
  id: number;
  kind: ContentKind;
  tier: string;
  name_id: string;
  name_en: string;
  sort_order: number;
};
