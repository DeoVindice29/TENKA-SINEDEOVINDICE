import { supabase } from "@/lib/supabaseClient";
import { SECTION_TITLES_TABLE, type SectionTitleRow } from "@/lib/contentTypes";

/**
 * Ambil nama section (kalau ada) buat satu (tier, chapter, sub_tier).
 * Dipakai buat ngisi ulang field "Nama Sub-Tier" pas edit entry yang
 * chapter/sub_tier-nya udah punya nama.
 */
export async function fetchSectionTitle(
  tier: string,
  chapter: number,
  subTier: number
): Promise<SectionTitleRow | null> {
  const { data, error } = await supabase
    .from(SECTION_TITLES_TABLE)
    .select("*")
    .eq("tier", tier)
    .eq("chapter", chapter)
    .eq("sub_tier", subTier)
    .maybeSingle();
  if (error || !data) return null;
  return data as SectionTitleRow;
}

/** Ambil semua nama section buat satu tier, dipakai buat nge-grup tampilan (N4Screen dll). */
export async function fetchSectionTitles(tier: string): Promise<SectionTitleRow[]> {
  const { data, error } = await supabase
    .from(SECTION_TITLES_TABLE)
    .select("*")
    .eq("tier", tier)
    .order("chapter")
    .order("sub_tier");
  if (error || !data) return [];
  return data as SectionTitleRow[];
}

/**
 * Simpan/update nama section. Dipanggil tiap kali entry kotoba/kanji/bunpo
 * disimpan, biar chapter.sub_tier baru otomatis punya nama begitu admin
 * ngisi "Nama Sub-Tier" — sama kayak title chapter yang udah ada di N5.
 * Kalau title_en & title_id kosong, gak usah nulis apa-apa (biar entry
 * lain di chapter yang sama gak ketimpa nama kosong).
 */
export async function upsertSectionTitle(row: SectionTitleRow): Promise<string | null> {
  if (!row.title_en.trim() && !row.title_id.trim()) return null;
  const { error } = await supabase.from(SECTION_TITLES_TABLE).upsert(row, {
    onConflict: "tier,chapter,sub_tier",
  });
  return error ? error.message : null;
}
