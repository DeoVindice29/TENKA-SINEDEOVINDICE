import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/i18n/LangContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Panduan "audio tidak keluar". Suara Jepang dibacakan oleh mesin
// Text-to-speech milik HP (bukan oleh app), jadi data suaranya harus ada di HP.
//
// Di-render lewat portal ke <body> (bukan di dalam panel Pengaturan) karena
// panel Pengaturan memakai transform + overflow, yang membuat elemen
// position:fixed di dalamnya ikut terpotong ukuran panel. Gayanya ada di
// styles/audio-help.css (class .ah-*), tidak bergantung pada Modal umum.
export default function AudioHelpModal({ open, onClose }: Props) {
  const { t } = useLang();

  useEffect(() => {
    if (!open) return;
    // capture + stopImmediatePropagation: Esc cukup menutup panduan,
    // panel Pengaturan di bawahnya tetap terbuka.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`ah-overlay ${open ? "open" : ""}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ah-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-help-title"
      >
        <div className="ah-head">
          <h2 id="audio-help-title">🔊 {t("audioHelp.title")}</h2>
        </div>

        <div className="ah-body">
          <p className="ah-text">{t("audioHelp.intro")}</p>

          <h3 className="ah-sub">{t("audioHelp.androidHeading")}</h3>
          <ol className="ah-steps">
            <li>{t("audioHelp.a1")}</li>
            <li>{t("audioHelp.a2")}</li>
            <li>{t("audioHelp.a3")}</li>
            <li>{t("audioHelp.a4")}</li>
            <li>{t("audioHelp.a5")}</li>
          </ol>

          <h3 className="ah-sub">{t("audioHelp.iosHeading")}</h3>
          <p className="ah-text">{t("audioHelp.ios")}</p>

          <h3 className="ah-sub">{t("audioHelp.stillHeading")}</h3>
          <ul className="ah-steps">
            <li>{t("audioHelp.s1")}</li>
            <li>{t("audioHelp.s2")}</li>
            <li>{t("audioHelp.s3")}</li>
          </ul>
        </div>

        <div className="ah-foot">
          <button className="ah-btn" type="button" onClick={onClose}>
            {t("audioHelp.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
