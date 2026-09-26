import { useUI } from "@/state/UIContext";
import { useLang } from "@/i18n/LangContext";
import { useQuiz } from "@/state/QuizContext";

type TopControlsProps = {
  onOpenSettings: () => void;
};

export default function TopControls({ onOpenSettings }: TopControlsProps) {
  const { screen, setScreen } = useUI();
  const { t } = useLang();
  const { state } = useQuiz();

  // Lagi Penaklukan (cerita atau sesi kuisnya) → sembunyikan semua tombol,
  // termasuk Settings, biar bener-bener fokus & gak keganggu di tengah sesi.
  const inConquest =
    screen === "conquest-story" || (screen === "quiz" && state.conquest);

  if (inConquest) return null;

  // Sembunyikan tombol practice & flashcards di layar kuis (non-Penaklukan)/
  // match/sesi belajar flashcard (biar fokus) — tombol Settings TETAP muncul
  // di semua layar ini.
  const hidden =
    screen === "quiz" || screen === "match" || screen === "flashcard";

  // Di lobby flashcard (pilih deck) tombol pengaturan TETAP ada; tombol
  // flashcard disembunyikan karena kita udah ada di lobby-nya.
  const inFlashLobby = screen === "flashdeck";
  // Sama untuk lobby Latihan Tipe Soal
  const inPracticeLobby = screen === "practice";

  return (
    <div className="top-controls">
      {!hidden && !inPracticeLobby && (
        <button
          className="icon-btn"
          id="practice-toggle"
          type="button"
          aria-label={t("aria.openPractice")}
          onClick={() => setScreen("practice")}
        />
      )}
      {!hidden && !inFlashLobby && (
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
