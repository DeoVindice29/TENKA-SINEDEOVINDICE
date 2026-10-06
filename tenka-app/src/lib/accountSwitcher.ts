import type { Session } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/appRole";

/**
 * Quick switch akun untuk Admin Panel (khusus dev).
 *
 * Sesi tiap akun yang pernah dipakai di browser ini disimpan (token dari
 * Supabase — sama sensitifnya dengan sesi login yang sudah disimpan Supabase
 * sendiri), lalu ganti akun = setSession() dengan token tersimpan, tanpa login
 * ulang. Token diperbarui otomatis tiap Supabase me-refresh sesi.
 *
 * Disimpan di sessionStorage kalau sesi login sekarang juga di sessionStorage
 * (login tanpa "remember me"), selain itu di localStorage — jadi daftar ini
 * tidak bertahan lebih lama dari login aslinya.
 */

export type SavedAccount = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: AppRole | null;
  access_token: string;
  refresh_token: string;
};

// Satu daftar untuk SEMUA tempat ganti akun (Pengaturan, layar Login, Admin Panel).
// Dulu Admin punya daftar sendiri ("tenka:adminAccounts") sehingga akun yang
// sudah login di Pengaturan tidak muncul di Admin, dan token refresh (yang
// diputar tiap setSession) di salah satu daftar jadi basi.
const LIST_KEY = "tenka:userAccounts";
const LEGACY_ADMIN_KEY = "tenka:adminAccounts";
const ADDING_KEY = "tenka:adminAddingAccount";

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

/** Pindahkan daftar Admin lama (kalau ada) ke daftar bersama, sekali saja. */
function migrateLegacy() {
  for (const s of [localStorage, sessionStorage]) {
    try {
      const raw = s.getItem(LEGACY_ADMIN_KEY);
      if (!raw) continue;
      s.removeItem(LEGACY_ADMIN_KEY);
      const legacy = JSON.parse(raw) as SavedAccount[];
      if (!Array.isArray(legacy)) continue;
      const list = readList();
      for (const a of legacy) {
        if (!a || !a.id || !a.refresh_token) continue;
        const i = list.findIndex((x) => x.id === a.id);
        if (i < 0) list.push(a);
        else if (!list[i].role && a.role) list[i] = { ...list[i], role: a.role };
      }
      saveAccounts(list);
    } catch {
      /* rusak → abaikan */
    }
  }
}

function readList(): SavedAccount[] {
  for (const s of [localStorage, sessionStorage]) {
    try {
      const raw = s.getItem(LIST_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as SavedAccount[];
      if (Array.isArray(parsed)) return parsed.filter((a) => a && a.id && a.refresh_token);
    } catch {
      /* rusak → abaikan */
    }
  }
  return [];
}

export function loadAccounts(): SavedAccount[] {
  migrateLegacy();
  return readList();
}

function saveAccounts(list: SavedAccount[]) {
  const target = store();
  const other = target === localStorage ? sessionStorage : localStorage;
  try {
    other.removeItem(LIST_KEY);
    target.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    /* penyimpanan penuh / diblokir → fitur switch saja yang tidak jalan */
  }
}

export function accountFromSession(session: Session, role: AppRole | null): SavedAccount {
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const email = session.user.email ?? "";
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    email.split("@")[0] ||
    "Akun";
  const avatar =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  return {
    id: session.user.id,
    email,
    name,
    avatar,
    role,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
}

/**
 * Tambah / perbarui satu akun di daftar (urutan tetap; akun baru di akhir).
 * Token selalu diperbarui; role, nama & foto yang sudah tersimpan dipertahankan
 * kalau pemanggil tidak punya yang baru (Pengaturan tidak tahu role, Admin
 * tidak tahu nama profil Tenka). `override` (nama/foto profil Tenka) menang.
 */
export function upsertAccount(
  account: SavedAccount,
  override?: { name?: string | null; avatar?: string | null },
): SavedAccount[] {
  const list = loadAccounts();
  const i = list.findIndex((a) => a.id === account.id);
  const prev = i >= 0 ? list[i] : null;
  const merged: SavedAccount = {
    ...account,
    role: account.role ?? prev?.role ?? null,
    name: override?.name?.trim() || prev?.name || account.name,
    avatar: override?.avatar || prev?.avatar || account.avatar,
  };
  if (i >= 0) list[i] = merged;
  else list.push(merged);
  saveAccounts(list);
  return list;
}

export function removeAccount(id: string): SavedAccount[] {
  const list = loadAccounts().filter((a) => a.id !== id);
  saveAccounts(list);
  return list;
}

/** Ditandai sebelum redirect login Google, supaya akun yang balik dari sana ikut tersimpan. */
export function markAddingAccount() {
  try {
    sessionStorage.setItem(ADDING_KEY, "1");
  } catch {
    /* abaikan */
  }
}

export function consumeAddingAccount(): boolean {
  try {
    const on = sessionStorage.getItem(ADDING_KEY) === "1";
    sessionStorage.removeItem(ADDING_KEY);
    return on;
  } catch {
    return false;
  }
}
