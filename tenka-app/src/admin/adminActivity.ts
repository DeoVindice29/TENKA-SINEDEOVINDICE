import type { ContentKind } from "@/lib/contentTypes";

/**
 * Log aktivitas admin (tambah/hapus konten) buat kartu "Aktivitas Terbaru"
 * di Dashboard. Disimpan di localStorage (lewat useLocalStorage di
 * AdminPanel.tsx) — bukan di Supabase, jadi log ini per-browser/perangkat,
 * bukan riwayat gabungan semua admin. Cukup buat kebutuhan "apa yang baru
 * saja saya lakukan di panel ini".
 */

export type ActivityAction = "add" | "delete";

export type ActivityEntry = {
  id: string;
  action: ActivityAction;
  kind: ContentKind;
  /** teks utama entry-nya, mis. kana/kanji/pattern */
  label: string;
  /** arti (meaning_id) buat konteks tambahan, opsional */
  meaning?: string;
  tier?: string;
  /** epoch ms */
  at: number;
};

export const ACTIVITY_STORAGE_KEY = "tenka-admin-activity";
export const ACTIVITY_LIMIT = 50;

export function appendActivity(
  prev: ActivityEntry[],
  entry: Omit<ActivityEntry, "id" | "at">,
): ActivityEntry[] {
  const next: ActivityEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  };
  return [next, ...prev].slice(0, ACTIVITY_LIMIT);
}

const KIND_LABEL: Record<ContentKind, string> = {
  kotoba: "kotoba",
  kanji: "kanji",
  bunpo: "bunpō",
};

export function activityKindLabel(kind: ContentKind): string {
  return KIND_LABEL[kind];
}

export function formatRelativeTime(at: number, lang: "en" | "id" = "id"): string {
  const en = lang === "en";
  const diffSec = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (diffSec < 45) return en ? "Just now" : "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return en ? `${diffMin} min ago` : `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return en ? `${diffHour} h ago` : `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return en ? `${diffDay} d ago` : `${diffDay} hari lalu`;
  return new Date(at).toLocaleDateString(en ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" });
}
