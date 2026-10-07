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
  /** Category (organize_sources.id) tempat entri ini berada. */
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
  /** Category (organize_sources.id) tempat entri ini berada. */
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
  /** Category (organize_sources.id) tempat entri ini berada. */
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

/**
 * Satu baris di tabel soal_entries_<level> — bank soal mode Latihan (pilihan
 * ganda). Disusun persis seperti materi: Level -> Category -> Chapter ->
 * Sub Chapter -> soal.
 */
export type SoalRow = {
  id: number;
  tier: string;
  /** Category (organize_sources.id) — kosong untuk soal Script Practice (daftar datar). */
  source_id: number | null;
  chapter: number;
  sub_tier: number;
  sort_order?: number;
  /** Aksara pemilik soal: "kotoba" | "bunpo" | "kanji" (halaman Script Practice). */
  script: string;
  /** Kunci tipe soal (write, reading, fill, usage, meaning, particle, ...). Kosong = soal lama. */
  question_type: string | null;
  /** Teks soal (biasanya kalimat Jepang). */
  question: string;
  question_translation_id: string | null;
  question_translation_en: string | null;
  /** Pilihan jawaban, 2–6 item. */
  options: string[];
  /** Indeks (mulai 0) pilihan yang benar di `options`. */
  answer_index: number;
  explanation_id: string | null;
  explanation_en: string | null;
  created_at: string;
};

export type ContentKind = "kotoba" | "kanji" | "bunpo";

/**
 * Jenis konten yang tersusun dalam pohon Level -> Category -> Chapter ->
 * Sub Chapter. Tiga materi + bank soal Latihan. ContentKind sengaja tidak
 * dilebarkan karena dipakai di Dashboard/Statistik/Aktivitas yang hanya
 * mengenal materi.
 */
export type TreeKind = ContentKind | "soal";

// Nama dasar tabel per jenis konten. Datanya sudah dipisah per level JLPT,
// jadi jangan dipakai langsung di supabase.from(...) — pakai tableFor().
export const TABLE_NAME: Record<ContentKind, string> = {
  kotoba: "kotoba_entries",
  kanji: "kanji_entries",
  bunpo: "bunpo_entries",
};

const TREE_TABLE_NAME: Record<TreeKind, string> = {
  ...TABLE_NAME,
  soal: "soal_entries",
};

export const TIER_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

/** Tabel Supabase untuk satu jenis konten di satu level, mis. kotoba_entries_n5. */
export function tableFor(kind: TreeKind, tier: string): string {
  return `${TREE_TABLE_NAME[kind]}_${tier.toLowerCase()}`;
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
export function sectionTitlesTable(kind: TreeKind): string {
  return `section_titles_${kind}`;
}

/**
 * "Category" = cara/sumber menyusun materi di satu level, mis. "Minna no
 * Nihongo", "Genki", "Tema Harian". Ada di antara Level dan Chapter:
 * Level -> Category -> Chapter -> Sub Chapter -> entri. Daftarnya per jenis
 * konten + level (tabel organize_sources), jadi menghapus satu sumber di
 * Kotoba tidak menyentuh Kanji/Bunpō.
 */
export type OrganizeSourceRow = {
  id: number;
  kind: TreeKind;
  tier: string;
  name_id: string;
  name_en: string;
  sort_order: number;
};
