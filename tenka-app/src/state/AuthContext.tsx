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
  isAdmin: boolean;
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
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<{ error: string | null }>;
};

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
  // akun admin (dicek via RPC is_admin di server, sama kayak AdminPanel)
  // dipakai buat lepas semua gate "locked" di app biasa (bukan cuma
  // /admin-panel) — jadi admin bisa preview/akses semua konten tanpa
  // harus progress manual dulu.
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const { data, error } = await supabase.rpc("is_admin");
    if (error) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(!!data);
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
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) {
        await Promise.all([
          loadProfile(data.session.user.id),
          checkAdmin(data.session.user.id),
        ]);
      } else {
        setIsAdmin(false);
      }
      if (!cancelled) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, next) => {
        setSession(next);
        if (next) {
          await Promise.all([loadProfile(next.user.id), checkAdmin(next.user.id)]);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, checkAdmin, isGuest]);

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
      options: { redirectTo: window.location.origin },
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
          emailRedirectTo: window.location.origin,
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
      redirectTo: window.location.origin,
    });
    return { error: error?.message ?? null };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
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
      return;
    }
    setIsAdmin(false);
    supabase.auth.signOut();
  }, [isGuest]);

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
        isAdmin,
        continueAsGuest,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        resetPassword,
        resendConfirmation,
        signOut,
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
