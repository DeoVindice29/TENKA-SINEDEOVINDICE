import { useUI } from "@/state/UIContext";
import { useLang } from "@/i18n/LangContext";

type TopControlsProps = {
  onOpenSettings: () => void;
};

export default function TopControls({ onOpenSettings }: TopControlsProps) {
  const { screen, setScreen } = useUI();
  const { t } = useLang();

  // Sembunyikan di layar kuis/match/sesi belajar flashcard (biar fokus)
  const hidden =
    screen === "quiz" ||
    screen === "conquest-story" ||
    screen === "match" ||
    screen === "flashcard";

  if (hidden) return null;

  // Di lobby flashcard (pilih deck) tombol pengaturan TETAP ada; tombol
  // flashcard disembunyikan karena kita udah ada di lobby-nya.
  const inFlashLobby = screen === "flashdeck";
  // Sama untuk lobby Latihan Tipe Soal
  const inPracticeLobby = screen === "practice";

  return (
    <div className="top-controls">
      {!inPracticeLobby && (
        <button
          className="icon-btn"
          id="practice-toggle"
          type="button"
          aria-label={t("aria.openPractice")}
          onClick={() => setScreen("practice")}
        />
      )}
      {!inFlashLobby && (
        <button
          className="icon-btn"
          id="flashcards-toggle"
          type="button"
          aria-label={t("aria.openFlashcards")}
          onClick={() => setScreen("flashdeck")}
        />
      )}
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
