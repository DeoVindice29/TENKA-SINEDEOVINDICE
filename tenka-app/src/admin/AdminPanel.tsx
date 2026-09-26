import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import AdminContentManager, { type AdminSection, type QuickAddSignal } from "@/admin/AdminContentManager";
import adminBg from "@/assets/bg-admin-panel-login.png";
import adminDoorlock from "@/assets/doorlock-admin-panel-login.png";
import { useTheme } from "@/hooks/useTheme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ACTIVITY_STORAGE_KEY, appendActivity, type ActivityEntry } from "@/admin/adminActivity";
import {
  IconArrowLeft,
  IconBook,
  IconChart,
  IconChevronDown,
  IconDocument,
  IconHome,
  IconKanjiTile,
  IconLayers,
  IconMoon,
  IconSakura,
  IconSignOut,
  IconSun,
  IconTarget,
  IconUsers,
} from "@/admin/adminIcons";
import "@/admin/admin.css";

type AuthStatus = "checking" | "signed-out" | "not-admin" | "admin";

type AdminPanelProps = {
  // dipanggil dari tombol "Kembali ke Beranda" di layar gate. Kalau
  // AdminPanel dipasang sbg overlay (App.tsx) ini nutup overlay-nya;
  // kalau diakses langsung lewat URL /admin-panel, fallback-nya balik
  // ke halaman utama.
  onClose?: () => void;
};

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin(current: Session | null) {
      if (!current) {
        if (!cancelled) setStatus("signed-out");
        return;
      }
      const { data, error } = await supabase.rpc("is_admin");
      if (cancelled) return;
      if (error) {
        console.error(error);
        setAuthError(error.message);
        setStatus("not-admin");
        return;
      }
      setStatus(data ? "admin" : "not-admin");
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
      options: { redirectTo: window.location.origin + "/admin-panel" },
    });
  };

  const signOut = () => supabase.auth.signOut();
  const goBack = onClose ?? (() => window.location.assign("/"));

  // status "admin" beneran lolos gate → shell bertema (header + sidebar +
  // konten) yang senada sama desain utama Tenka.
  if (status === "admin") {
    return <AdminShell onSignOut={signOut} onGoBack={goBack} />;
  }

  // status checking/signed-out/not-admin → satu "scene" bertema yang sama,
  // teksnya nyesuain status.
  return (
    <div
      className="admin-scene"
      style={{ backgroundImage: `url(${adminBg})` }}
    >
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
            <>
              <h1 className="admin-scene-title">Memuat…</h1>
              <p className="admin-scene-desc">Sebentar, lagi ngecek sesi login kamu.</p>
            </>
          )}

          {status === "signed-out" && (
            <>
              <h1 className="admin-scene-title">Masuk Diperlukan</h1>
              <p className="admin-scene-desc">
                Silakan login pakai akun Google admin
                <br />
                untuk mengakses Tenka Admin Panel.
              </p>
              {authError && <p className="admin-error">{authError}</p>}
              <button type="button" className="admin-scene-btn-primary" onClick={signInWithGoogle}>
                Login with Google
              </button>
              <button type="button" className="admin-scene-btn-secondary" onClick={goBack}>
                ← Kembali ke Beranda
              </button>
            </>
          )}

          {status === "not-admin" && (
            <>
              <h1 className="admin-scene-title">Akses Admin Dibatasi</h1>
              <p className="admin-scene-desc">
                Akun kamu belum memiliki izin
                <br />
                untuk mengakses Tenka Admin Panel.
              </p>
              <p className="admin-scene-desc">
                Jika kamu adalah administrator,
                <br />
                silakan gunakan akun admin yang sesuai.
              </p>
              {authError && <p className="admin-error">{authError}</p>}
              <button type="button" className="admin-scene-btn-primary" onClick={goBack}>
                ← Kembali ke Beranda
              </button>
              <button type="button" className="admin-scene-btn-secondary" onClick={signOut}>
                Ganti akun
              </button>
              <div className="admin-scene-divider" aria-hidden="true" />
              {session && (
                <p className="admin-scene-account">Akun saat ini: {session.user.email}</p>
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

const MATERI_ITEMS: { key: MateriKind; label: string; icon: typeof IconBook }[] = [
  { key: "kotoba", label: "Kotoba", icon: IconBook },
  { key: "kanji", label: "Kanji", icon: IconKanjiTile },
  { key: "bunpo", label: "Bunpō", icon: IconDocument },
];

function AdminShell({
  onSignOut,
  onGoBack,
}: {
  onSignOut: () => void;
  onGoBack: () => void;
}) {
  const [section, setSection] = useLocalStorage<AdminSection>("tenka:adminSection", "dashboard");
  const [materiOpen, setMateriOpen] = useState(true);
  const [latihanOpen, setLatihanOpen] = useState(true);
  const [quickAdd, setQuickAdd] = useState<QuickAddSignal | null>(null);
  const [activity, setActivity] = useLocalStorage<ActivityEntry[]>(ACTIVITY_STORAGE_KEY, []);
  const { theme, toggleTheme } = useTheme();

  const isMateri = section === "kotoba" || section === "kanji" || section === "bunpo";
  const isDark = theme === "dark";

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
    setActivity((prev) => appendActivity(prev, entry));
  };

  return (
    <div className="adm-shell">
      <div className="adm-body">
        <aside className="adm-sidebar">
          <div className="adm-brand">
            <span className="adm-brand-icon">
              <IconSakura />
            </span>
            <div className="adm-brand-text">
              <span className="adm-brand-row">
                <span className="adm-brand-name">Tenka</span>
                <span className="adm-brand-kanji">天華</span>
              </span>
              <span className="adm-brand-caption">Admin Panel</span>
            </div>
          </div>

          <nav className="adm-nav">
            <button
              type="button"
              className={`adm-nav-item${section === "dashboard" ? " active" : ""}`}
              onClick={() => setSection("dashboard")}
            >
              <IconHome className="adm-nav-icon" /> Dashboard
            </button>

            <button
              type="button"
              className={`adm-nav-item${section === "statistik" ? " active" : ""}`}
              onClick={() => setSection("statistik")}
            >
              <IconChart className="adm-nav-icon" /> Statistik
            </button>

            <button
              type="button"
              className={`adm-nav-group${isMateri ? " active-parent" : ""}`}
              onClick={() => setMateriOpen((v) => !v)}
              aria-expanded={materiOpen}
            >
              <IconLayers className="adm-nav-icon" />
              <span className="adm-nav-label">Materi</span>
              <IconChevronDown className={`adm-nav-caret${materiOpen ? " open" : ""}`} />
            </button>
            {materiOpen && (
              <div className="adm-nav-sub">
                {MATERI_ITEMS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`adm-nav-item${section === key ? " active" : ""}`}
                    onClick={() => setSection(key)}
                  >
                    <Icon className="adm-nav-icon" /> {label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className={`adm-nav-group${section === "soal" ? " active-parent" : ""}`}
              onClick={() => setLatihanOpen((v) => !v)}
              aria-expanded={latihanOpen}
            >
              <IconTarget className="adm-nav-icon" />
              <span className="adm-nav-label">Latihan</span>
              <IconChevronDown className={`adm-nav-caret${latihanOpen ? " open" : ""}`} />
            </button>
            {latihanOpen && (
              <div className="adm-nav-sub">
                <button
                  type="button"
                  className={`adm-nav-item${section === "soal" ? " active" : ""}`}
                  onClick={() => setSection("soal")}
                >
                  <IconDocument className="adm-nav-icon" /> Soal
                </button>
              </div>
            )}

            <button
              type="button"
              className={`adm-nav-item${section === "pengguna" ? " active" : ""}`}
              onClick={() => setSection("pengguna")}
            >
              <IconUsers className="adm-nav-icon" /> Pengguna
            </button>
          </nav>

          <div className="adm-sidebar-footer">
            <button type="button" className="adm-nav-item" onClick={onGoBack}>
              <IconArrowLeft className="adm-nav-icon" /> Kembali ke Aplikasi
            </button>
            <button type="button" className="adm-nav-item signout" onClick={onSignOut}>
              <IconSignOut className="adm-nav-icon" /> Sign out
            </button>
          </div>
        </aside>

        <div className="adm-content-col">
          <button
            type="button"
            className="adm-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
            title={isDark ? "Mode terang" : "Mode gelap"}
          >
            {isDark ? <IconSun className="adm-theme-icon" /> : <IconMoon className="adm-theme-icon" />}
          </button>

          <main className="adm-main">
            <AdminContentManager
              section={section}
              quickAdd={quickAdd}
              onQuickAdd={handleQuickAdd}
              onQuickAddHandled={() => setQuickAdd(null)}
              activity={activity}
              onLogActivity={logActivity}
              onNavigateToDashboard={() => setSection("dashboard")}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
