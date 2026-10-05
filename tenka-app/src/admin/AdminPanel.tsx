import { Fragment, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { fetchAppRole, type AppRole } from "@/lib/appRole";
import AdminContentManager, { type AdminSection, type QuickAddSignal } from "@/admin/AdminContentManager";
import adminBg from "@/assets/bg-admin-panel-login.webp";
import adminDoorlock from "@/assets/doorlock-admin-panel-login.webp";
import AccountSwitcher from "@/admin/AccountSwitcher";
import {
  accountFromSession,
  consumeAddingAccount,
  loadAccounts,
  markAddingAccount,
  removeAccount,
  upsertAccount,
  type SavedAccount,
} from "@/lib/accountSwitcher";
import { useTheme } from "@/hooks/useTheme";
import { useLang } from "@/i18n/LangContext";
import { Spinner } from "@/components/ui/Loader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ACTIVITY_STORAGE_KEY, appendActivity, type ActivityEntry } from "@/admin/adminActivity";
import {
  IconArrowLeft,
  IconBook,
  IconChart,
  IconChevronDown,
  IconClose,
  IconCode,
  IconDocument,
  IconHome,
  IconKanjiTile,
  IconLayers,
  IconMoon,
  IconQuote,
  IconSakura,
  IconSignOut,
  IconSun,
  IconUsers,
} from "@/admin/adminIcons";
import "@/admin/admin.css";

// Harus ikut `base` di vite.config.ts (mis. /TENKA-SINEDEOVINDICE/tenka-app/),
// kalau tidak redirect OAuth mendarat di URL tanpa base → halaman error Vite.
const ADMIN_URL = window.location.origin + import.meta.env.BASE_URL + "admin-panel";

/** Teks multi-baris ("\n") → dipisah <br />. */
function lines(text: string) {
  return text.split("\n").map((l, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {l}
    </Fragment>
  ));
}

/** Tombol tema terang/gelap Admin Panel (state dibagi lewat useTheme). */
function AdminThemeToggle({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={`adm-theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? t("admin.theme.toLight") : t("admin.theme.toDark")}
      title={isDark ? t("admin.theme.light") : t("admin.theme.dark")}
    >
      {isDark ? (
        <IconSun className="adm-theme-icon" />
      ) : (
        <IconMoon className="adm-theme-icon" />
      )}
    </button>
  );
}

/** Tombol ganti bahasa EN | ID untuk Admin Panel (pakai LangContext yang sama dgn app). */
function AdminLangToggle({ floating = false }: { floating?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      className={`adm-lang-toggle${floating ? " floating" : ""}`}
      role="group"
      aria-label={t("admin.lang.label")}
    >
      {(["en", "id"] as const).map((l) => (
        <button
          key={l}
          type="button"
          className={lang === l ? "active" : ""}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

type AuthStatus = "checking" | "signed-out" | "not-admin" | "admin";

type AdminPanelProps = {
  // dipanggil dari tombol "Kembali ke Beranda" di layar gate. Kalau
  // AdminPanel dipasang sbg overlay (App.tsx) ini nutup overlay-nya;
  // kalau diakses langsung lewat URL /admin-panel, fallback-nya balik
  // ke halaman utama.
  onClose?: () => void;
};

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { t } = useLang();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [role, setRole] = useState<AppRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<SavedAccount[]>(() => loadAccounts());

  // Quick switch akun: simpan / perbarui sesi akun yang sedang aktif. Akun
  // disimpan kalau (a) dia dev, (b) sudah ada di daftar (cukup token barunya
  // yang diperbarui tiap Supabase me-refresh), atau (c) baru saja ditambah dari
  // tombol "Tambah akun". Sesi admin biasa yang login sendiri tidak disimpan.
  useEffect(() => {
    if (status === "checking") return;
    if (!session || status !== "admin" || !role) {
      if (status !== "signed-out") consumeAddingAccount();
      return;
    }
    const adding = consumeAddingAccount();
    const known = loadAccounts().some((a) => a.id === session.user.id);
    if (role === "dev" || known || adding) {
      setAccounts(upsertAccount(accountFromSession(session, role)));
    }
  }, [session, role, status]);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin(current: Session | null) {
      if (!current) {
        if (!cancelled) setStatus("signed-out");
        return;
      }
      // role dari server: "dev" (akses penuh) | "admin" (materi & latihan saja)
      const next = await fetchAppRole();
      if (cancelled) return;
      setRole(next);
      setStatus(next ? "admin" : "not-admin");
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      checkAdmin(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      checkAdmin(next);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = () => {
    setAuthError(null);
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: ADMIN_URL },
    });
  };

  // sign out = akun ini dicabut dari daftar tersimpan (token-nya tidak tertinggal).
  const signOut = () => {
    // daftar akun sekarang dipakai bersama Pengaturan: cukup cabut akun yang
    // keluar, jangan hapus akun lain yang masih login di sana.
    if (session) setAccounts(removeAccount(session.user.id));
    return supabase.auth.signOut({ scope: "local" });
  };

  const switchAccount = async (account: SavedAccount): Promise<string | null> => {
    const { error } = await supabase.auth.setSession({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
    });
    if (error) {
      return t("admin.session.expired");
    }
    return null;
  };

  const addAccount = () => {
    markAddingAccount();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: ADMIN_URL,
        // paksa pilih akun Google, jangan langsung pakai akun yang sedang aktif
        queryParams: { prompt: "select_account" },
      },
    });
  };

  const forgetAccount = (id: string) => setAccounts(removeAccount(id));
  const goBack = onClose ?? (() => window.location.assign(import.meta.env.BASE_URL));

  // status "admin" beneran lolos gate → shell bertema (header + sidebar +
  // konten) yang senada sama desain utama Tenka.
  if (status === "admin" && role) {
    // Switcher tampil untuk dev, dan untuk akun lain yang dibuka lewat switcher
    // (biar bisa balik ke dev) — daftar itu hanya ada kalau dev yang membuatnya.
    const showSwitcher = !!session && (role === "dev" || accounts.some((a) => a.role === "dev"));
    return (
      <AdminShell
        key={session?.user.id ?? "shell"}
        role={role}
        actorName={session ? accountFromSession(session, role).name : ""}
        onSignOut={signOut}
        onGoBack={goBack}
        switcher={
          showSwitcher && session ? (
            <AccountSwitcher
              accounts={accounts}
              currentId={session.user.id}
              onSwitch={switchAccount}
              onAdd={addAccount}
              onRemove={forgetAccount}
            />
          ) : null
        }
      />
    );
  }

  // status checking/signed-out/not-admin → satu "scene" bertema yang sama,
  // teksnya nyesuain status.
  return (
    <div
      className="admin-scene"
      style={{ backgroundImage: `url(${adminBg})` }}
    >
      <AdminLangToggle floating />
      <div className="admin-scene-inner">
        <img
          className="admin-scene-character"
          src={adminDoorlock}
          alt=""
          aria-hidden="true"
        />
        <div className="admin-scene-lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" fill="currentColor" />
            <path
              d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="14.7" r="1.6" fill="#fff" />
          </svg>
        </div>

        <div className="admin-scene-card">
          {status === "checking" && (
            <div role="status" aria-live="polite">
              <div className="admin-scene-spinner">
                <Spinner size={32} />
              </div>
              <h1 className="admin-scene-title">{t("admin.loading.title")}</h1>
              <p className="admin-scene-desc">{t("admin.loading.desc")}</p>
            </div>
          )}

          {status === "signed-out" && (
            <>
              <h1 className="admin-scene-title">{t("admin.signedOut.title")}</h1>
              <p className="admin-scene-desc">{lines(t("admin.signedOut.desc"))}</p>
              {authError && <p className="admin-error">{authError}</p>}
              <button type="button" className="admin-scene-btn-primary" onClick={signInWithGoogle}>
                {t("admin.login.google")}
              </button>
              <button type="button" className="admin-scene-btn-secondary" onClick={goBack}>
                {t("admin.back.home")}
              </button>
            </>
          )}

          {status === "not-admin" && (
            <>
              <h1 className="admin-scene-title">{t("admin.denied.title")}</h1>
              <p className="admin-scene-desc">{lines(t("admin.denied.desc1"))}</p>
              <p className="admin-scene-desc">{lines(t("admin.denied.desc2"))}</p>
              {authError && <p className="admin-error">{authError}</p>}
              <button type="button" className="admin-scene-btn-primary" onClick={goBack}>
                {t("admin.back.home")}
              </button>
              <button type="button" className="admin-scene-btn-secondary" onClick={signOut}>
                {t("admin.denied.switch")}
              </button>
              <div className="admin-scene-divider" aria-hidden="true" />
              {session && (
                <p className="admin-scene-account">{t("admin.denied.current", { email: session.user.email ?? "" })}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- shell v2

type MateriKind = "kotoba" | "kanji" | "bunpo";

// Sub-menu Script Practice (satu halaman per aksara: tipe soal + tabel soal).
const PRACTICE_ITEMS: { key: MateriKind; label: string; icon: typeof IconBook }[] = [
  { key: "kotoba", label: "Kotoba", icon: IconBook },
  { key: "bunpo", label: "Bunpō", icon: IconDocument },
  { key: "kanji", label: "Kanji", icon: IconKanjiTile },
];

const MATERI_ITEMS: { key: MateriKind; label: string; icon: typeof IconBook }[] = [
  { key: "kotoba", label: "Kotoba", icon: IconBook },
  { key: "kanji", label: "Kanji", icon: IconKanjiTile },
  { key: "bunpo", label: "Bunpō", icon: IconDocument },
];

// Menu yang cuma boleh dibuka role "dev". Role "admin" cuma dapat Materi
// (Kotoba/Kanji/Bunpō) dan Latihan.
const DEV_ONLY_SECTIONS: AdminSection[] = ["dashboard", "statistik", "pengguna"];

function AdminShell({
  role,
  actorName,
  onSignOut,
  onGoBack,
  switcher,
}: {
  role: AppRole;
  /** nama akun yang lagi login — dicatat di Aktivitas Terbaru */
  actorName: string;
  onSignOut: () => void;
  onGoBack: () => void;
  switcher: ReactNode;
}) {
  const { t } = useLang();
  const [storedSection, setSection] = useLocalStorage<AdminSection>("tenka:adminSection", "dashboard");
  const isDev = role === "dev";
  // section terakhir yang tersimpan bisa jadi menu dev-only (mis. akun ini
  // baru diturunkan jadi admin) — paksa balik ke Kotoba.
  // nilai lama "soal" (sebelum ada Script Practice) → halaman Kotoba-nya.
  const legacy = (storedSection as string) === "soal" ? "practice-kotoba" : storedSection;
  const section: AdminSection =
    !isDev && DEV_ONLY_SECTIONS.includes(legacy) ? "kotoba" : legacy;
  const [materiOpen, setMateriOpen] = useState(true);
  const [latihanOpen, setLatihanOpen] = useState(true);
  const [quickAdd, setQuickAdd] = useState<QuickAddSignal | null>(null);
  // Mode HP: sidebar jadi drawer yang dibuka lewat tombol hamburger.
  const [navOpen, setNavOpen] = useState(false);
  const goSection = (next: AdminSection) => {
    setSection(next);
    setNavOpen(false);
  };
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);
  const [activity, setActivity] = useLocalStorage<ActivityEntry[]>(ACTIVITY_STORAGE_KEY, []);
  const isPractice = section.startsWith("practice-");
  const isMateri = section === "kotoba" || section === "kanji" || section === "bunpo";

  // dipanggil dari tombol Aksi Cepat di Dashboard: pindah ke section materi
  // yang dipilih dan langsung buka form tambahnya di sana.
  const handleQuickAdd = (kind: MateriKind) => {
    setSection(kind);
    setMateriOpen(true);
    setQuickAdd({ kind, token: Date.now() });
  };

  // dipanggil dari KotobaSection/KanjiSection/BunpoSection tiap kali insert
  // atau delete berhasil, buat kartu "Aktivitas Terbaru" di Dashboard.
  const logActivity = (entry: Omit<ActivityEntry, "id" | "at">) => {
    setActivity((prev) => appendActivity(prev, actorName ? { ...entry, by: actorName } : entry));
  };

  return (
    <div className="adm-shell">
      <div className="adm-body">
        <div className="adm-mobilebar">
          <button
            type="button"
            className="adm-mobilebar-btn"
            onClick={() => setNavOpen(true)}
            aria-label="Menu"
            aria-expanded={navOpen}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="adm-mobilebar-brand">
            <IconSakura />
            <span className="adm-mobilebar-name">Tenka</span>
          </span>
          {/* HP: bahasa + tema nempel di bar atas, tampil di semua section */}
          <div className="adm-mobilebar-actions">
            <AdminLangToggle />
            <AdminThemeToggle />
          </div>
        </div>
        <div className={`adm-backdrop${navOpen ? " open" : ""}`} onClick={() => setNavOpen(false)} aria-hidden="true" />
        <aside className={`adm-sidebar${navOpen ? " open" : ""}`}>
          <button type="button" className="adm-drawer-close" onClick={() => setNavOpen(false)} aria-label="Close">
            <IconClose />
          </button>
          <div className="adm-brand">
            <span className="adm-brand-icon">
              <IconSakura />
            </span>
            <div className="adm-brand-text">
              <span className="adm-brand-name">Tenka</span>
              <span className="adm-brand-caption">{isDev ? "Dev Panel" : "Admin Panel"}</span>
            </div>
          </div>

          <nav className="adm-nav">
            {isDev && (
              <>
                <button
                  type="button"
                  className={`adm-nav-item${section === "dashboard" ? " active" : ""}`}
                  onClick={() => goSection("dashboard")}
                >
                  <IconHome className="adm-nav-icon" /> {t("admin.nav.dashboard")}
                </button>

                <button
                  type="button"
                  className={`adm-nav-item${section === "statistik" ? " active" : ""}`}
                  onClick={() => goSection("statistik")}
                >
                  <IconChart className="adm-nav-icon" /> {t("admin.nav.stats")}
                </button>

                <button
                  type="button"
                  className={`adm-nav-item${section === "pengguna" ? " active" : ""}`}
                  onClick={() => goSection("pengguna")}
                >
                  <IconUsers className="adm-nav-icon" /> {t("admin.nav.users")}
                </button>
              </>
            )}

            <button
              type="button"
              className={`adm-nav-group${isMateri ? " active-parent" : ""}`}
              onClick={() => setMateriOpen((v) => !v)}
              aria-expanded={materiOpen}
            >
              <IconLayers className="adm-nav-icon" />
              <span className="adm-nav-label">{t("admin.nav.lessons")}</span>
              <IconChevronDown className={`adm-nav-caret${materiOpen ? " open" : ""}`} />
            </button>
            {materiOpen && (
              <div className="adm-nav-sub">
                {MATERI_ITEMS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`adm-nav-item${section === key ? " active" : ""}`}
                    onClick={() => goSection(key)}
                  >
                    <Icon className="adm-nav-icon" /> {label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className={`adm-nav-group${isPractice ? " active-parent" : ""}`}
              onClick={() => setLatihanOpen((v) => !v)}
              aria-expanded={latihanOpen}
            >
              <IconCode className="adm-nav-icon" />
              <span className="adm-nav-label">{t("admin.nav.practice")}</span>
              <IconChevronDown className={`adm-nav-caret${latihanOpen ? " open" : ""}`} />
            </button>
            {latihanOpen && (
              <div className="adm-nav-sub">
                {PRACTICE_ITEMS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`adm-nav-item${section === `practice-${key}` ? " active" : ""}`}
                    onClick={() => goSection(`practice-${key}`)}
                  >
                    <Icon className="adm-nav-icon" /> {label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className={`adm-nav-item adm-nav-item--single${section === "kutipan" ? " active" : ""}`}
              onClick={() => goSection("kutipan")}
            >
              <IconQuote className="adm-nav-icon" /> {t("admin.nav.quotes")}
            </button>

          </nav>

          <div className="adm-sidebar-footer">
            {switcher}
            <button type="button" className="adm-nav-item" onClick={onGoBack}>
              <IconArrowLeft className="adm-nav-icon" /> {t("admin.nav.backToApp")}
            </button>
            <button type="button" className="adm-nav-item signout" onClick={onSignOut}>
              <IconSignOut className="adm-nav-icon" /> {t("admin.nav.signOut")}
            </button>
          </div>
        </aside>

        <div className="adm-content-col">
          <div className="adm-floating-actions">
            <AdminLangToggle />
            <AdminThemeToggle />
          </div>

          <main className="adm-main">
            <AdminContentManager
              section={section}
              quickAdd={quickAdd}
              onQuickAdd={handleQuickAdd}
              onQuickAddHandled={() => setQuickAdd(null)}
              activity={activity}
              onLogActivity={logActivity}
              onNavigateToDashboard={() => setSection("dashboard")}
              onOpenSection={setSection}
              canDelete={isDev}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
