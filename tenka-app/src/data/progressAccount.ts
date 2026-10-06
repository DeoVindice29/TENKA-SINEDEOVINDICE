import { supabase } from "@/lib/supabaseClient";

// Progres pangkat/misi (ranks.ts, titles.ts) sebelumnya disimpan di
// localStorage dengan key GLOBAL (gak per-akun) — jadi kalau ganti akun di
// browser yang sama, progresnya "ketuker"/keliatan sama kayak akun
// sebelumnya. Modul ini nyimpen "siapa akun yang lagi aktif" dan nyediain:
//
// 1) `scopedKey()` — namespace tiap localStorage key pakai user id, jadi
//    beda akun otomatis beda storage (gak nunggu Supabase buat kefix).
// 2) `pushProgressPatch()` / `fetchProgressRow()` — baca/tulis progres ke
//    tabel `profiles` di Supabase, biar progres ikutan nyambung kalau login
//    dari device/browser lain, bukan cuma numpuk di satu browser.
//
// AuthContext manggil `setProgressUserId()` tiap kali sesi berubah
// (login/logout/ganti akun/mode tamu).

export const PROGRESS_ACCOUNT_EVENT = "tenka:progress-account-changed";

let currentUserId: string | null = null;

/** Bikin key localStorage unik per akun, misal "tebakAksara_rank_v1::<uid>". */
export function scopedKey(baseKey: string): string {
  return `${baseKey}::${currentUserId ?? "guest"}`;
}

type AccountChangeListener = (userId: string | null) => void;
const listeners = new Set<AccountChangeListener>();

/** ranks.ts/titles.ts daftar di sini buat ikut tarik ulang progres dari
 * Supabase tiap akun aktif berubah. */
export function onProgressAccountChange(fn: AccountChangeListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Dipanggil dari AuthContext. No-op kalau akunnya sama (hindari refetch
 * berulang tiap re-render). */
export function setProgressUserId(userId: string | null): void {
  if (userId === currentUserId) return;
  currentUserId = userId;
  listeners.forEach((fn) => fn(userId));
  window.dispatchEvent(new Event(PROGRESS_ACCOUNT_EVENT));
}

export type ProgressPatch = Partial<{
  rank_index: number;
  conquery: Record<string, boolean>;
  conquest_titles: Record<string, boolean>;
}>;

/** Fire-and-forget, sama kayak syncRankToProfile lama — gak nge-block UI.
 * Akun tamu / belum login (currentUserId null) dilewatin, progresnya cuma
 * kesimpen lokal (namespace "guest"). Kalau gagal (offline dll) progres
 * tetap aman di localStorage dan bakal ke-push lagi di update berikutnya. */
export function pushProgressPatch(patch: ProgressPatch): void {
  const userId = currentUserId;
  if (!userId) return;
  // Query builder Supabase itu lazy: baru dikirim kalau di-await/.then().
  // Tanpa ini update-nya gak pernah benar-benar sampai ke server.
  supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .then(({ error }) => {
      if (error) console.warn("[progress] gagal sync ke Supabase:", error.message);
    });
}

export type ProgressRow = {
  rank_index: number | null;
  conquery: Record<string, boolean> | null;
  conquest_titles: Record<string, boolean> | null;
};

// ---- status "lagi narik progres dari server" (buat indikator loading) ----
// ranks.ts & titles.ts sama-sama manggil fetchProgressRow tiap akun berubah,
// jadi cukup dihitung di sini. Ada batas waktu supaya indikator gak nyangkut
// selamanya kalau request-nya menggantung.

export const PROGRESS_SYNC_TIMEOUT_MS = 15_000;

let pendingSyncs = 0;
const syncListeners = new Set<() => void>();

function changeSyncCount(delta: 1 | -1): void {
  const wasSyncing = pendingSyncs > 0;
  pendingSyncs = Math.max(0, pendingSyncs + delta);
  if (wasSyncing !== pendingSyncs > 0) syncListeners.forEach((fn) => fn());
}

export function isProgressSyncing(): boolean {
  return pendingSyncs > 0;
}

export function subscribeProgressSync(fn: () => void): () => void {
  syncListeners.add(fn);
  return () => syncListeners.delete(fn);
}

export async function fetchProgressRow(userId: string): Promise<ProgressRow | null> {
  changeSyncCount(1);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    changeSyncCount(-1);
  };
  const timer = window.setTimeout(release, PROGRESS_SYNC_TIMEOUT_MS);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("rank_index, conquery, conquest_titles")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProgressRow;
  } finally {
    window.clearTimeout(timer);
    release();
  }
}
