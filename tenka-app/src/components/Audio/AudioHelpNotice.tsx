import { useState } from "react";
import { useLang } from "@/i18n/LangContext";
import AudioHelpModal from "./AudioHelpModal";

const DISMISS_KEY = "tenka:audioHelpDismissed";

/**
 * Banner kecil yang muncul HANYA kalau HP tidak punya voice Jepang. Bisa
 * ditutup (diingat), dan panduannya tetap bisa dibuka lagi dari
 * Pengaturan → Tampilan → Flashcard.
 */
export default function AudioHelpNotice({ show }: { show: boolean }) {
  const { t } = useLang();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [open, setOpen] = useState(false);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // abaikan
    }
  };

  return (
    <>
      {show && !dismissed && (
        <div className="audio-help-notice" role="status">
          <span className="audio-help-notice-icon" aria-hidden="true">
            🔇
          </span>
          <span className="audio-help-notice-text">
            {t("audioHelp.notice")}
          </span>
          <button
            type="button"
            className="audio-help-notice-btn"
            onClick={() => setOpen(true)}
          >
            {t("audioHelp.seeHow")}
          </button>
          <button
            type="button"
            className="audio-help-notice-x"
            aria-label={t("audioHelp.dismiss")}
            onClick={dismiss}
          >
            ×
          </button>
        </div>
      )}
      <AudioHelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
