import { useEffect, useState } from "react";
import { useUI } from "@/state/UIContext";
import { useAuth } from "@/state/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import StartScreen from "@/screens/StartScreen";
import QuizScreen from "@/screens/QuizScreen";
import LearnScreen from "@/screens/LearnScreen";
import MatchScreen from "@/screens/MatchScreen";
import FlashcardScreen from "@/screens/FlashcardScreen";
import PracticeScreen from "@/screens/PracticeScreen";
import N4Screen from "@/screens/N4Screen";
import ListeningScreen from "@/screens/ListeningScreen";
import StatistikScreen from "@/screens/StatistikScreen";
import Sidebar from "@/components/Sidebar";
import SettingsPanel, { type SettingsView } from "@/components/SettingsPanel";
import { useLang } from "@/i18n/LangContext";
import { useTheme } from "@/hooks/useTheme";
import RankMissionsModal from "@/components/RankMissions/RankMissionsModal";
import IntroGuide from "@/components/Intro/IntroGuide";
import { useRankIndex } from "@/hooks/useRankIndex";
import { useMissionProgress } from "@/hooks/useMissionProgress";
import { useProgressSyncing } from "@/hooks/useProgressSyncing";
import { SyncBar } from "@/components/ui/Loader";
import { INTRO_SEEN_KEY } from "@/data/introGuide";
import AdminPanel from "@/admin/AdminPanel";
import quizSceneBg from "@/assets/bg-quiz.webp";
import quizSceneBgNight from "@/assets/bg-quiz-night.webp";

// Layar-layar yang sengaja fokus penuh (sesi kuis/Match/Penaklukan/kartu
// flash aktif) — sidebar & topbar disembunyikan biar gak keganggu, sama
// seperti perilaku TopControls yang lama.
const FOCUS_SCREENS = new Set(["quiz", "match", "flashcard", "conquest-story"]);

export default function App() {
  const { screen, setScreen, sessionActive } = useUI();
  const { t } = useLang();
  const { user, isGuest } = useAuth();
  const themeApi = useTheme();
  useRankIndex(); // re-render saat pangkat berubah → hitungan misi ikut segar
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialView, setSettingsInitialView] =
    useState<SettingsView>("menu");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useLocalStorage<boolean>("tenka:adminOpen", false);
  const missionProgress = useMissionProgress();
  const syncing = useProgressSyncing();

  // Peri pemandu chibi cuma nongol sekali per AKUN (bukan per-browser) —
  // di-scope pakai user id Supabase (atau "guest" buat mode tamu) supaya
  // login akun baru di browser yang sama tetap dapet intro-nya sendiri,
  // gak ketiban status "udah pernah lihat" dari akun sebelumnya. Baru
  // setelah bubble terakhir diklik, Misi Pangkat otomatis kebuka — kalau
  // di-skip, misinya tetap bisa dibuka manual lewat tombol Misi di topbar.
  const accountKey = user?.id ?? (isGuest ? "guest" : "anon");
  const [introSeen, setIntroSeen] = useLocalStorage<boolean>(
    `${INTRO_SEEN_KEY}:${accountKey}`,
    false,
  );
  const [introOpen, setIntroOpen] = useState(false);

  useEffect(() => {
    if (!introSeen) setIntroOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishIntro = () => {
    setIntroSeen(true);
    setIntroOpen(false);
    // Setelah intro selesai jangan auto-buka Conquest — langsung ke Home.
    setScreen("start");
  };

  const skipIntro = () => {
    setIntroSeen(true);
    setIntroOpen(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [screen]);

  const focusMode = FOCUS_SCREENS.has(screen);
  // tombol Conquests disembunyikan selama sesi soal berjalan (layar fokus
  // sudah menyembunyikan seluruh topbar; ini untuk sesi di layar biasa)
  const hideMissionsBtn = focusMode || sessionActive;

  return (
    <>
      {syncing && <SyncBar label={t("loading.sync")} />}
      <div className="washi-noise" />
      <div
        className={`app-shell ${focusMode ? "focus-mode" : ""} ${
          screen === "quiz" || screen === "match" ? "quiz-scenic" : ""
        }`}
        style={
          screen === "quiz" || screen === "match"
            ? {
                backgroundImage: `url(${
                  themeApi.theme === "dark" ? quizSceneBgNight : quizSceneBg
                })`,
              }
            : undefined
        }
      >
        {!focusMode && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpenSettings={(view) => {
              setSettingsInitialView(view ?? "menu");
              setSettingsOpen(true);
            }}
            onOpenAdmin={() => setAdminOpen(true)}
          />
        )}
        <div className="main-area">
          {!focusMode && (
            <header className="topbar">
              <button
                type="button"
                className="topbar-hamburger"
                aria-label={t("aria.openSettings")}
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <span />
                <span />
                <span />
              </button>
              <div className="topbar-spacer" />
              {!hideMissionsBtn && (
                <button
                  type="button"
                  className="topbar-missions-btn"
                  aria-label={t("missions.open")}
                  onClick={() => setMissionsOpen(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                  </svg>
                  <span className="topbar-missions-label">{t("missions.button")}</span>
                  <span className="topbar-missions-count">
                    {missionProgress.done}/{missionProgress.total}
                  </span>
                </button>
              )}
            </header>
          )}
          <div className="stage">
            {screen === "start" && <StartScreen />}
            {screen === "learn" && <LearnScreen />}
            {screen === "quiz" && <QuizScreen />}
            {screen === "match" && <MatchScreen />}
            {screen === "practice" && <PracticeScreen />}
            {(screen === "flashdeck" || screen === "flashcard") && (
              <FlashcardScreen />
            )}
            {screen === "n4" && <N4Screen />}
            {screen === "listening" && <ListeningScreen />}
            {screen === "statistik" && <StatistikScreen />}
            {screen !== "quiz" &&
              screen !== "match" &&
              screen !== "flashdeck" &&
              screen !== "flashcard" && (
              <footer className="site-footer">{t("footer.copyright")}</footer>
            )}
          </div>
        </div>
      </div>
      <RankMissionsModal
        open={missionsOpen}
        onClose={() => setMissionsOpen(false)}
      />
      <IntroGuide open={introOpen} onFinish={finishIntro} onSkip={skipIntro} />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        themeApi={themeApi}
        initialView={settingsInitialView}
      />
      {adminOpen && (
        <div className="admin-overlay">
          <AdminPanel onClose={() => setAdminOpen(false)} />
        </div>
      )}
    </>
  );
}
