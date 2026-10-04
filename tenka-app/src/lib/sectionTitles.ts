import { supabase } from "@/lib/supabaseClient";
import { sectionTitlesTable, type TreeKind, type SectionTitleRow } from "@/lib/contentTypes";

/**
 * sub_tier "0" dipakai sebagai penanda "ini nama Chapter-nya sendiri", bukan
 * nama salah satu Sub Chapter di dalamnya (Sub Chapter asli selalu mulai dari 1).
 * Jadi baris judul Chapter disimpan di tabel yang sama (section_titles),
 * cuma dibedakan lewat sub_tier ini — tidak perlu tabel/kolom baru.
 */
export const CHAPTER_TITLE_SUB_TIER = 0;

/**
 * Judul tampilan Sub Chapter: "Sub Chapter 1.1 — Nama". Sama formatnya dengan
 * tampilan Topic (data bawaan), jadi Minna no Nihongo / N4 kelihatan seragam.
 * Awalan lama di nama ("Tier 1.1 —", "Chapter 1.1 —", "Bab 1.1 —") dibuang dulu
 * supaya tidak dobel. Kalau nama kosong, cukup "Sub Chapter 1.1".
 */
export function subChapterLabel(chapter: number, subTier: number, name: string | null | undefined): string {
  const prefix = `Sub Chapter ${chapter}.${subTier}`;
  const clean = (name ?? "")
    .replace(/^\s*(?:sub\s*chapter|tier|chapter|bab)\s*\d+\.\d+\s*[—–-]?\s*/i, "")
    .trim();
  return clean ? `${prefix} — ${clean}` : prefix;
}

/**
 * Ambil nama section (kalau ada) buat satu (tier, chapter, sub_tier).
 * Dipakai buat ngisi ulang field "Nama Sub Chapter" pas edit entry yang
 * chapter/sub_tier-nya udah punya nama.
 */
export async function fetchSectionTitle(
  kind: TreeKind,
  tier: string,
  chapter: number,
  subTier: number
): Promise<SectionTitleRow | null> {
  const { data, error } = await supabase
    .from(sectionTitlesTable(kind))
    .select("*")
    .eq("tier", tier)
    .eq("chapter", chapter)
    .eq("sub_tier", subTier)
    .maybeSingle();
  if (error || !data) return null;
  return data as SectionTitleRow;
}

/** Ambil semua nama section buat satu tier, dipakai buat nge-grup tampilan (N4Screen dll). */
export async function fetchSectionTitles(
  kind: TreeKind,
  tier: string,
  sourceId?: number,
): Promise<SectionTitleRow[]> {
  let q = supabase.from(sectionTitlesTable(kind)).select("*").eq("tier", tier);
  if (sourceId !== undefined) q = q.eq("source_id", sourceId);
  const { data, error } = await q.order("chapter").order("sub_tier");
  if (error || !data) return [];
  return data as SectionTitleRow[];
}

/**
 * Simpan/update nama section. Dipanggil tiap kali entry kotoba/kanji/bunpo
 * disimpan, biar chapter.sub_tier baru otomatis punya nama begitu admin
 * ngisi "Nama Sub Chapter" — sama kayak title chapter yang udah ada di N5.
 * Kalau title_en & title_id kosong, gak usah nulis apa-apa (biar entry
 * lain di chapter yang sama gak ketimpa nama kosong).
 */
export async function upsertSectionTitle(kind: TreeKind, row: SectionTitleRow): Promise<string | null> {
  if (!row.title_en.trim() && !row.title_id.trim()) return null;
  const { error } = await supabase.from(sectionTitlesTable(kind)).upsert(row, {
    onConflict: "source_id,chapter,sub_tier",
  });
  return error ? error.message : null;
}

/** Ambil nama Chapter (kalau ada) buat satu (tier, chapter) — dipakai buat ngisi ulang field "Nama Chapter" pas edit. */
export async function fetchChapterTitle(
  kind: TreeKind,
  tier: string,
  chapter: number
): Promise<SectionTitleRow | null> {
  return fetchSectionTitle(kind, tier, chapter, CHAPTER_TITLE_SUB_TIER);
}

/** Simpan/update nama Chapter (baris sub_tier = 0), sama aturannya kayak upsertSectionTitle. */
export async function upsertChapterTitle(
  kind: TreeKind,
  row: Omit<SectionTitleRow, "sub_tier">
): Promise<string | null> {
  return upsertSectionTitle(kind, { ...row, sub_tier: CHAPTER_TITLE_SUB_TIER });
}
