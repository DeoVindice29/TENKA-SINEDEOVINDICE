import type { Session } from "@supabase/supabase-js";
import {
  accountFromSession,
  loadAccounts,
  removeAccount,
  upsertAccount,
  type SavedAccount,
} from "@/lib/accountSwitcher";

/**
 * Daftar akun tersimpan untuk "Ganti akun" (Pengaturan → Ganti akun, layar
 * Login). Sekarang memakai daftar yang SAMA dengan quick switch Admin Panel
 * (lib/accountSwitcher.ts), jadi akun yang sudah login di Pengaturan otomatis
 * ada di Admin dan sebaliknya — tidak perlu login ulang.
 *
 * Isinya token sesi Supabase tiap akun — sama sensitifnya dengan sesi login
 * yang sudah disimpan Supabase sendiri di browser ini. Cuma ada di perangkat
 * ini, tidak dikirim ke server.
 */

export function loadUserAccounts(): SavedAccount[] {
  return loadAccounts();
}

/**
 * Tambah / perbarui satu akun (urutan tetap; akun baru di akhir). Nama & foto
 * dari profil Tenka (kalau ada) menggantikan nama/foto bawaan akun Google.
 * Role yang sudah dikenal (dari Admin Panel) tidak ditimpa.
 */
export function upsertUserAccount(
  session: Session,
  override?: { name?: string | null; avatar?: string | null },
): SavedAccount[] {
  return upsertAccount(accountFromSession(session, null), override);
}

export function removeUserAccount(id: string): SavedAccount[] {
  return removeAccount(id);
}
