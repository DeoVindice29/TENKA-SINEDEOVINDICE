import { useEffect, useState } from "react";
import { useUI } from "@/state/UIContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import StartScreen from "@/screens/StartScreen";
import QuizScreen from "@/screens/QuizScreen";
import LearnScreen from "@/screens/LearnScreen";
import MatchScreen from "@/screens/MatchScreen";
import FlashcardScreen from "@/screens/FlashcardScreen";
import PracticeScreen from "@/screens/PracticeScreen";
import N4Screen from "@/screens/N4Screen";
import StatistikScreen from "@/screens/StatistikScreen";
import Sidebar from "@/components/Sidebar";
import SettingsPanel, { type SettingsView } from "@/components/SettingsPanel";
import { useLang } from "@/i18n/LangContext";
import { useTheme } from "@/hooks/useTheme";
import RankMissionsModal from "@/components/RankMissions/RankMissionsModal";
import { useRankIndex } from "@/hooks/useRankIndex";
import { MISSION_TOTAL, countMissionsDone } from "@/data/ranks";
import AdminPanel from "@/admin/AdminPanel";

// Layar-layar yang sengaja fokus penuh (sesi kuis/Match/Penaklukan/kartu
// flash aktif) — sidebar & topbar disembunyikan biar gak keganggu, sama
// seperti perilaku TopControls yang lama.
const FOCUS_SCREENS = new Set(["quiz", "match", "flashcard", "conquest-story"]);

export default function App() {
  const { screen } = useUI();
  const { t } = useLang();
  const themeApi = useTheme();
  useRankIndex(); // re-render saat pangkat berubah → hitungan misi ikut segar
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialView, setSettingsInitialView] =
    useState<SettingsView>("menu");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useLocalStorage<boolean>("tenka:adminOpen", false);
  const missionsDone = countMissionsDone();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [screen]);

  const focusMode = FOCUS_SCREENS.has(screen);

  return (
    <>
      <div className="washi-noise" />
      <div className={`app-shell ${focusMode ? "focus-mode" : ""}`}>
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
                  {missionsDone}/{MISSION_TOTAL}
                </span>
              </button>
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
            {screen === "statistik" && <StatistikScreen />}
            <footer className="site-footer">{t("footer.copyright")}</footer>
          </div>
        </div>
      </div>
      <RankMissionsModal
        open={missionsOpen}
        onClose={() => setMissionsOpen(false)}
      />
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
