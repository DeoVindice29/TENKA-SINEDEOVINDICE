import type { Session } from "@supabase/supabase-js";
import { accountFromSession, type SavedAccount } from "@/lib/accountSwitcher";

/**
 * Daftar akun tersimpan untuk fitur "Ganti akun" milik pengguna biasa
 * (Pengaturan → Ganti akun, dan layar Login). Terpisah dari daftar quick
 * switch Admin Panel (lib/accountSwitcher.ts) supaya keduanya tidak saling
 * menimpa; tipe SavedAccount & cara membacanya dari sesi dipakai bersama.
 *
 * Isinya token sesi Supabase tiap akun — sama sensitifnya dengan sesi login
 * yang sudah disimpan Supabase sendiri di browser ini. Disimpan di
 * sessionStorage kalau login sekarang juga di sessionStorage (tanpa
 * "ingat saya"), selain itu di localStorage, jadi daftar tidak bertahan lebih
 * lama dari login aslinya. Cuma ada di perangkat ini, tidak dikirim ke server.
 */

const LIST_KEY = "tenka:userAccounts";

function store(): Storage {
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) ?? "";
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) return sessionStorage;
    }
  } catch {
    /* sessionStorage tidak tersedia */
  }
  return localStorage;
}

export function loadUserAccounts(): SavedAccount[] {
  for (const s of [localStorage, sessionStorage]) {
    try {
      const raw = s.getItem(LIST_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as SavedAccount[];
      if (Array.isArray(parsed)) {
        return parsed.filter((a) => a && a.id && a.refresh_token);
      }
    } catch {
      /* rusak → abaikan */
    }
  }
  return [];
}

function saveUserAccounts(list: SavedAccount[]) {
  const target = store();
  const other = target === localStorage ? sessionStorage : localStorage;
  try {
    other.removeItem(LIST_KEY);
    target.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    /* penyimpanan penuh / diblokir → fitur ganti akun saja yang tidak jalan */
  }
}

/**
 * Tambah / perbarui satu akun (urutan tetap; akun baru di akhir). Nama & foto
 * dari profil Tenka (kalau ada) menggantikan nama/foto bawaan akun Google.
 */
export function upsertUserAccount(
  session: Session,
  override?: { name?: string | null; avatar?: string | null },
): SavedAccount[] {
  const base = accountFromSession(session, null);
  const account: SavedAccount = {
    ...base,
    name: override?.name?.trim() || base.name,
    avatar: override?.avatar || base.avatar,
  };
  const list = loadUserAccounts();
  const i = list.findIndex((a) => a.id === account.id);
  if (i >= 0) list[i] = account;
  else list.push(account);
  saveUserAccounts(list);
  return list;
}

export function removeUserAccount(id: string): SavedAccount[] {
  const list = loadUserAccounts().filter((a) => a.id !== id);
  saveUserAccounts(list);
  return list;
}
