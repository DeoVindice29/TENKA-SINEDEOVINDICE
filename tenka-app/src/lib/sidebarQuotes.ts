import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SIDEBAR_QUOTES, type SidebarQuote } from "@/data/sidebarQuotes";

/** Bentuk baris di tabel Supabase sidebar_quotes. */
export type SidebarQuoteRow = {
  id: number;
  text_id: string;
  text_en: string;
  author?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

const EVENT = "tenka:sidebar-quotes-changed";

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Baris database → bentuk yang dipakai kartu sidebar. Bahasa yang kosong
 *  ikut bahasa lainnya, jadi kartu tidak pernah tampil kosong. */
export function rowToQuote(row: SidebarQuoteRow): SidebarQuote {
  const id = toLines(row.text_id);
  const en = toLines(row.text_en);
  return {
    id: `db-${row.id}`,
    author: row.author?.trim() || undefined,
    lines: { id: id.length ? id : en, en: en.length ? en : id },
  };
}

// Cache per sesi halaman: sidebar app & sidebar admin sama-sama pakai hook
// ini, jadi cukup satu kali fetch.
let cache: SidebarQuote[] | null = null;
let inflight: Promise<SidebarQuote[]> | null = null;

async function loadQuotes(): Promise<SidebarQuote[]> {
  const query = (cols: string) =>
    supabase
      .from("sidebar_quotes")
      .select(cols)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
  let { data, error } = await query("id, text_id, text_en, author, sort_order, is_active, created_at");
  // kolom author belum ada (migrasi belum dijalankan) → ulangi tanpa author
  if (error) {
    ({ data, error } = await query("id, text_id, text_en, sort_order, is_active, created_at"));
  }
  // Tabel belum ada / kosong / offline → pakai daftar bawaan.
  if (error || !data || data.length === 0) return SIDEBAR_QUOTES;
  return (data as unknown as SidebarQuoteRow[]).map(rowToQuote);
}

/** Dipanggil Admin Panel setiap kali kutipan ditambah/diubah/dihapus supaya
 *  kartu di sidebar langsung ikut berubah tanpa reload. */
export function invalidateSidebarQuotes() {
  cache = null;
  inflight = null;
  window.dispatchEvent(new Event(EVENT));
}

/** Daftar kutipan untuk kartu sidebar. Langsung tersedia (bawaan), lalu
 *  diganti data dari Supabase begitu datang. */
export function useSidebarQuotes(): SidebarQuote[] {
  const [quotes, setQuotes] = useState<SidebarQuote[]>(cache ?? SIDEBAR_QUOTES);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cache) {
        setQuotes(cache);
        return;
      }
      inflight ??= loadQuotes();
      inflight
        .then((q) => {
          cache = q;
          if (!cancelled) setQuotes(q);
        })
        .catch(() => {
          inflight = null;
        });
    };
    run();
    window.addEventListener(EVENT, run);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, run);
    };
  }, []);

  return quotes;
}
