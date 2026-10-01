import { supabase } from "@/lib/supabaseClient";

/**
 * Pencatat aktivitas belajar buat halaman Statistik di Admin Panel.
 * Tabel & fungsinya ada di supabase/migrations/2026_add_activity_events.sql.
 *
 * Sengaja "fire and forget": kalau gagal (offline, tamu, migrasi belum
 * dijalankan) app tetap jalan normal dan tidak menampilkan error apa pun.
 */

export type ActivityKind = "active" | "practice_session" | "conquest_cleared" | "answer";

export type ActivityEvent = {
  kind: ActivityKind;
  script?: string;
  /** teks soal / materi yang dilatih */
  item?: string;
  /** info tambahan, mis. jawaban yang benar */
  hint?: string;
  correct?: boolean;
};

const MAX_TEXT = 200;
const clip = (s?: string) => (s ? s.slice(0, MAX_TEXT) : undefined);

// tabel belum ada (migrasi belum dijalankan) → berhenti mencoba sampai reload
let disabled = false;

export async function logActivity(ev: ActivityEvent): Promise<void> {
  if (disabled) return;
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return; // mode tamu: tidak dicatat

    const { error } = await supabase.from("activity_events").insert({
      user_id: userId,
      kind: ev.kind,
      script: ev.script ?? null,
      item: clip(ev.item) ?? null,
      hint: clip(ev.hint) ?? null,
      correct: ev.correct ?? null,
    });
    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") disabled = true;
      console.debug("activity log skipped:", error.message);
    }
  } catch (err) {
    console.debug("activity log failed:", err);
  }
}

/** Tandai akun ini aktif hari ini — dicatat paling banyak sekali per hari per browser. */
export function pingDailyActive(userId: string): void {
  const key = `tenka:activePing:${userId}`;
  const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD, zona waktu lokal
  try {
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
  } catch {
    /* storage diblokir: tetap catat */
  }
  void logActivity({ kind: "active" });
}
