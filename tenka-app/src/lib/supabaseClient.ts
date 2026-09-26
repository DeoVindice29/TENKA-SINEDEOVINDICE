import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Sengaja cuma warning, bukan throw — biar app utama (yang gak butuh
  // Supabase sama sekali kalau belum pakai fitur N4/admin) tetap jalan
  // normal walau .env belum diisi pas development awal.
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi di .env — " +
      "fitur N4 & /admin-panel tidak akan berfungsi sampai itu diisi.",
  );
}

/**
 * "Remember me" implementation.
 *
 * Supabase persists the session by writing it through this storage
 * adapter. To make the checkbox on the login form actually do something,
 * we swap between localStorage (survives closing the browser — "remember
 * me" checked) and sessionStorage (cleared when the tab/browser closes —
 * unchecked) based on a flag the login flow sets right before signing in.
 *
 * Reads check sessionStorage first, falling back to localStorage, so a
 * session written either way is still found within the same tab.
 */
let persistAcrossSessions = true;

export function setAuthPersistence(remember: boolean) {
  persistAcrossSessions = remember;
}

const dynamicStorage = {
  getItem(key: string) {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (persistAcrossSessions) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    storage: dynamicStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
