import { supabase } from "@/lib/supabaseClient";
import type { TreeKind, OrganizeSourceRow } from "@/lib/contentTypes";

/** Nama tampilan sumber sesuai bahasa; jatuh ke bahasa lain kalau kosong. */
export function sourceName(row: Pick<OrganizeSourceRow, "name_id" | "name_en">, lang: "en" | "id"): string {
  const primary = lang === "en" ? row.name_en : row.name_id;
  const fallback = lang === "en" ? row.name_id : row.name_en;
  return primary.trim() || fallback.trim() || "—";
}

/** Semua sumber "Organize by" untuk satu jenis konten (semua level), urut tampil. */
export async function fetchOrganizeSources(kind: TreeKind, tier?: string): Promise<OrganizeSourceRow[]> {
  let q = supabase.from("organize_sources").select("*").eq("kind", kind);
  if (tier) q = q.eq("tier", tier);
  const { data, error } = await q.order("tier").order("sort_order").order("id");
  if (error || !data) return [];
  return data as OrganizeSourceRow[];
}

export async function createOrganizeSource(
  kind: TreeKind,
  tier: string,
  nameId: string,
  nameEn: string,
  sortOrder: number,
): Promise<{ row: OrganizeSourceRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("organize_sources")
    .insert({ kind, tier, name_id: nameId, name_en: nameEn, sort_order: sortOrder })
    .select("*")
    .single();
  if (error) return { row: null, error: error.message };
  return { row: data as OrganizeSourceRow, error: null };
}

export async function renameOrganizeSource(id: number, nameId: string, nameEn: string): Promise<string | null> {
  const { error } = await supabase.from("organize_sources").update({ name_id: nameId, name_en: nameEn }).eq("id", id);
  return error ? error.message : null;
}

/** Hapus sumber. Entri & nama chapter di dalamnya ikut terhapus (on delete cascade). */
export async function deleteOrganizeSource(id: number): Promise<string | null> {
  const { error } = await supabase.from("organize_sources").delete().eq("id", id);
  return error ? error.message : null;
}
