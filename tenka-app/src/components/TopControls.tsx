import { useUI } from "@/state/UIContext";
import { useLang } from "@/i18n/LangContext";

type TopControlsProps = {
  onOpenSettings: () => void;
};

export default function TopControls({ onOpenSettings }: TopControlsProps) {
  const { screen, setScreen } = useUI();
  const { t } = useLang();

  // Sembunyikan di layar kuis/flashcard (biar fokus)
  const hidden =
    screen === "quiz" ||
    screen === "conquest-story" ||
    screen === "match" ||
    screen === "flashdeck" ||
    screen === "flashcard";

  if (hidden) return null;

  return (
    <div className="top-controls">
      <button
        className="icon-btn"
        id="flashcards-toggle"
        type="button"
        aria-label={t("aria.openFlashcards")}
        onClick={() => setScreen("flashdeck")}
      />
      <button
        className="icon-btn"
        id="settings-toggle"
        type="button"
        aria-label={t("aria.openSettings")}
        onClick={onOpenSettings}
      />
    </div>
  );
}
