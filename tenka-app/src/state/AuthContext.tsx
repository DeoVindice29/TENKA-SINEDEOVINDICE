import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, setAuthPersistence } from "@/lib/supabaseClient";
import { pingDailyActive } from "@/lib/activityLog";
import { setProgressUserId } from "@/data/progressAccount";
import { fetchAppRole, type AppRole } from "@/lib/appRole";
import type { SavedAccount } from "@/lib/accountSwitcher";
import {
  loadUserAccounts,
  removeUserAccount,
  upsertUserAccount,
} from "@/lib/userAccounts";

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type ProfilePatch = Partial<Pick<Profile, "username" | "avatar_url">>;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  /** role dari server: "dev" | "admin" | null (pengguna biasa/tamu) */
  role: AppRole | null;
  /** punya akses Admin Panel (admin ATAU dev) */
  isAdmin: boolean;
  /** akses penuh: alat dev di app (skip soal, buka kunci, reset penaklukan) */
  isDev: boolean;
  continueAsGuest: () => void;
  signInWithGoogle: () => void;
  signInWithPassword: (
    email: string,
    password: string,
    remember?: boolean,
  ) => Promise<{ error: string | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  /** akun yang pernah login di browser ini (untuk "Ganti akun") */
  accounts: SavedAccount[];
  /** pindah ke akun tersimpan tanpa login ulang; sukses → halaman dimuat ulang */
  switchAccount: (account: SavedAccount) => Promise<{ error: string | null }>;
  /** keluar dari sesi ini saja (akun tetap di daftar) → layar login */
  addAccount: () => Promise<void>;
  /** hapus dari daftar tersimpan (tidak menghapus akunnya) */
  forgetAccount: (id: string) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<{ error: string | null }>;
};

// URL app lengkap dengan base path (mis. https://user.github.io/REPO/tenka-app/).
// Jangan pakai window.location.origin saja: di GitHub Pages itu tidak memuat path
// repo, jadi tidak cocok dengan Redirect URLs di Supabase dan Supabase jatuh ke
// Site URL (localhost).
const APP_URL = window.location.origin + import.meta.env.BASE_URL;

const GUEST_FLAG_KEY = "tenka_guest_mode";
const GUEST_PROFILE_KEY = "tenka_guest_profile";

function loadGuestProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(GUEST_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function saveGuestProfile(profile: Profile) {
  try {
    window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) — guest mode
       still works for the current tab, it just won't persist a reload */
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // role akun (dicek di server lewat fungsi SQL app_role(), sama kayak
  // AdminPanel). Cuma "dev" yang dapat alat dev di app biasa (lepas semua
  // gate "locked", skip soal, reset penaklukan); "admin" cuma bisa
  // nambah materi & latihan di /admin-panel.
  const [role, setRole] = useState<AppRole | null>(null);
  const isAdmin = role !== null;
  const isDev = role === "dev";
  const [accounts, setAccounts] = useState<SavedAccount[]>(() => loadUserAccounts());

  const checkAdmin = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setRole(null);
      return;
    }
    setRole(await fetchAppRole());
  }, []);
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return window.localStorage.getItem(GUEST_FLAG_KEY) === "1";
    } catch {
      return false;
    }
  });

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (!error) setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (isGuest) {
      setProfile(loadGuestProfile());
      setRole(null);
      // mode tamu = gak ada akun Supabase buat progres pangkat/misi; ranks.ts/
      // titles.ts otomatis balik ke storage lokal namespace "guest".
      setProgressUserId(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      // penting: di-set SEBELUM loadProfile/checkAdmin biar ranks.ts/titles.ts
      // udah baca-tulis ke localStorage key akun yang bener sejak awal.
      setProgressUserId(data.session?.user.id ?? null);
      if (data.session) {
        pingDailyActive(data.session.user.id);
        await Promise.all([
          loadProfile(data.session.user.id),
          checkAdmin(data.session.user.id),
        ]);
      } else {
        setRole(null);
      }
      if (!cancelled) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, next) => {
        setSession(next);
        setProgressUserId(next?.user.id ?? null);
        if (next) {
          pingDailyActive(next.user.id);
          await Promise.all([loadProfile(next.user.id), checkAdmin(next.user.id)]);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, checkAdmin, isGuest]);

  // "Ganti akun": simpan / perbarui sesi akun yang sedang aktif tiap sesinya
  // berubah (login, token di-refresh Supabase, profil dimuat). Nama & foto
  // dari profil Tenka dipakai kalau sudah termuat untuk akun yang sama.
  useEffect(() => {
    if (isGuest || !session) return;
    const own = profile && profile.id === session.user.id ? profile : null;
    setAccounts(
      upsertUserAccount(session, {
        name: own?.username,
        avatar: own?.avatar_url,
      }),
    );
  }, [session, profile, isGuest]);

  const continueAsGuest = useCallback(() => {
    try {
      window.localStorage.setItem(GUEST_FLAG_KEY, "1");
    } catch {
      /* ignore — guest mode still works for this tab */
    }
    setProfile(loadGuestProfile());
    setIsGuest(true);
  }, []);

  const signInWithGoogle = useCallback(() => {
    setAuthPersistence(true);
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: APP_URL },
    });
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string, remember = true) => {
      setAuthPersistence(remember);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, fullName: string) => {
      setAuthPersistence(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: APP_URL,
        },
      });
      if (error) return { error: error.message };

      // Supabase intentionally returns NO error when the email already
      // belongs to a confirmed account — this is anti account-enumeration
      // behavior, not a bug. The only tell is `identities` coming back as
      // an empty array (a genuinely new signup has 1 identity). We turn
      // that into an explicit error so the UI can show the right message
      // instead of a misleading "check your email to confirm" success toast.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { error: "User already registered" };
      }

      return { error: null };
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: APP_URL,
    });
    return { error: error?.message ?? null };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: APP_URL },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(() => {
    if (isGuest) {
      try {
        window.localStorage.removeItem(GUEST_FLAG_KEY);
        window.localStorage.removeItem(GUEST_PROFILE_KEY);
      } catch {
        /* ignore */
      }
      setIsGuest(false);
      setProfile(null);
      setProgressUserId(null);
      return;
    }
    // keluar = akun ini juga dicabut dari daftar "Ganti akun"
    if (session) setAccounts(removeUserAccount(session.user.id));
    setRole(null);
    // scope "local": keluar di perangkat ini saja. Default-nya "global" akan
    // mencabut SEMUA sesi akun itu (browser/alamat lain ikut ter-logout).
    supabase.auth.signOut({ scope: "local" });
  }, [isGuest, session]);

  const switchAccount = useCallback(
    async (account: SavedAccount) => {
      const { data, error } = await supabase.auth.setSession({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
      });
      if (error) return { error: error.message };
      // setSession memutar (rotasi) refresh token. Simpan yang baru SEKARANG,
      // sebelum reload, supaya token lama di daftar tidak jadi basi.
      if (data.session) {
        setAccounts(
          upsertUserAccount(data.session, {
            name: account.name,
            avatar: account.avatar,
          }),
        );
      }
      // Muat ulang supaya seluruh state di memori (kuis, flashcard, progres,
      // pengaturan per akun) mulai bersih dari akun yang baru — sesinya sudah
      // tersimpan, jadi tidak perlu login lagi.
      window.location.reload();
      return { error: null };
    },
    [],
  );

  const addAccount = useCallback(async () => {
    // simpan akun aktif dulu, lalu langsung ke pemilih akun Google — tanpa
    // keluar dulu dan tanpa singgah di layar login. Sesi akun yang aktif
    // sekarang tidak dicabut, jadi tetap bisa dipilih lagi dari daftar;
    // kalau user membatalkan di tengah jalan, dia tetap masuk di akun ini.
    if (session) {
      setAccounts(
        upsertUserAccount(session, {
          name: profile?.id === session.user.id ? profile.username : null,
          avatar: profile?.id === session.user.id ? profile.avatar_url : null,
        }),
      );
    }
    setAuthPersistence(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: APP_URL,
        // paksa pilih akun Google, jangan langsung pakai akun yang sedang aktif
        queryParams: { prompt: "select_account" },
      },
    });
  }, [session, profile]);

  const forgetAccount = useCallback((id: string) => {
    setAccounts(removeUserAccount(id));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (isGuest) {
        const next: Profile = {
          id: "guest",
          username: profile?.username ?? null,
          avatar_url: profile?.avatar_url ?? null,
          ...patch,
        };
        saveGuestProfile(next);
        setProfile(next);
        return { error: null };
      }
      if (!session) return { error: "not-signed-in" };
      const { error } = await supabase
        .from("profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", session.user.id);
      if (error) return { error: error.message };
      await loadProfile(session.user.id);
      return { error: null };
    },
    [session, loadProfile, isGuest, profile],
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isGuest,
        role,
        isAdmin,
        isDev,
        continueAsGuest,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        resetPassword,
        resendConfirmation,
        signOut,
        accounts,
        switchAccount,
        addAccount,
        forgetAccount,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
