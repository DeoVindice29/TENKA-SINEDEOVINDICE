import { useState } from "react";
import { useUI } from "@/state/UIContext";
import StartScreen from "@/screens/StartScreen";
import QuizScreen from "@/screens/QuizScreen";
import LearnScreen from "@/screens/LearnScreen";
import MatchScreen from "@/screens/MatchScreen";
import FlashcardScreen from "@/screens/FlashcardScreen";
import TopControls from "@/components/TopControls";
import SettingsPanel from "@/components/SettingsPanel";
import { useLang } from "@/i18n/LangContext";

export default function App() {
  const { screen } = useUI();
  const { t } = useLang();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="washi-noise" />
      <TopControls onOpenSettings={() => setSettingsOpen(true)} />
      <div className="stage">
        {screen === "start" && <StartScreen />}
        {screen === "learn" && <LearnScreen />}
        {screen === "quiz" && <QuizScreen />}
        {screen === "match" && <MatchScreen />}
        {(screen === "flashdeck" || screen === "flashcard") && (
          <FlashcardScreen />
        )}
        <footer className="site-footer">{t("footer.copyright")}</footer>
      </div>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
