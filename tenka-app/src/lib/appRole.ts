import { supabase } from "@/lib/supabaseClient";

// dev   = akses penuh (semua menu Admin Panel + alat dev di app biasa)
// admin = cuma boleh tambah/ubah materi & latihan di Admin Panel (hapus khusus dev)
export type AppRole = "dev" | "admin";

export const ROLE_LABEL: Record<AppRole | "user", string> = {
  dev: "Dev",
  admin: "Admin",
  user: "User",
};

/** Ambil role akun yang sedang login dari server (fungsi SQL app_role()).
 *  Kalau migrasi role belum dijalankan (fungsi belum ada), jatuh ke is_admin()
 *  lama dan akun itu dianggap dev — perilakunya sama seperti sebelum ada role. */
export async function fetchAppRole(): Promise<AppRole | null> {
  const { data, error } = await supabase.rpc("app_role");
  if (!error) return data === "dev" || data === "admin" ? data : null;
  const legacy = await supabase.rpc("is_admin");
  return !legacy.error && legacy.data ? "dev" : null;
}
