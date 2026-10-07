import { supabase } from "@/lib/supabaseClient";

/**
 * Ambil entri (kotoba / kanji / bunpo) satu Category, urut sesuai yang
 * diatur admin: chapter → sub chapter → sort_order (tombol ▲▼ di Admin Panel)
 * → id. Kalau kolom sort_order belum ada (migrasi belum dijalankan), jatuh
 * balik ke urutan lama (chapter → sub chapter → id).
 */
export async function selectOrderedEntries(
  table: string,
  sourceId: number,
  range?: { from: number; to: number },
) {
  const base = () =>
    supabase
      .from(table)
      .select("*")
      .eq("source_id", sourceId)
      .order("chapter")
      .order("sub_tier");

  const withOrder = range
    ? await base().order("sort_order").order("id").range(range.from, range.to)
    : await base().order("sort_order").order("id");
  if (!withOrder.error) return withOrder;

  return range
    ? await base().order("id").range(range.from, range.to)
    : await base().order("id");
}
