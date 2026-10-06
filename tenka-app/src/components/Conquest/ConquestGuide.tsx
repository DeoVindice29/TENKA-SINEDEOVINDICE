import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { getChibiAvatarByName } from "@/lib/chibiAvatar";
import SakuraCanvas from "@/components/SakuraCanvas";
import introBg from "@/assets/intro-bg.webp";

export type ConquestGuideStep = {
  /** nama ekspresi chibi (cocok nama file di src/assets/chibi/) */
  expression: string;
  /** isi bubble — boleh mengandung <b>…</b> (sama seperti aturan di i18n) */
  html: string;
};

type Props = {
  steps: ConquestGuideStep[];
  /** label tombol di bubble terakhir (default: "Mulai Menaklukkan") */
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

// Versi "dijelasin chibi" dari popup sebelum Penaklukan: tampilannya memakai
// gaya yang sama dengan IntroGuide (overlay + background pagoda + chibi +
// bubble bunga sakura, class .intro-guide-*), tapi tiap bubble berisi satu
// aturan Penaklukan. Bubble terakhir → tombol berubah jadi "Mulai
// Menaklukkan" (onConfirm). Tombol X / Esc / klik area gelap = batal.
export default function ConquestGuide({
  steps,
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useLang();
  const [stepIndex, setStepIndex] = useState(0);

  const total = steps.length;
  const isLast = stepIndex >= total - 1;
  const step = steps[stepIndex] ?? steps[0];

  const advance = () => {
    if (isLast) onConfirm();
    else setStepIndex((i) => Math.min(i + 1, total - 1));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, total]);

  const chibiSrc =
    getChibiAvatarByName(step.expression) ??
    getChibiAvatarByName("ready") ??
    getChibiAvatarByName("cute");

  return (
    <div
      className="intro-guide-overlay conquest-guide"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="intro-guide-card">
        <button
          type="button"
          className="intro-guide-close"
          onClick={onCancel}
          aria-label={t("common.cancel")}
          title={t("common.cancel")}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="intro-guide-hero">
          <img src={introBg} alt="" className="intro-guide-bg" />
          <SakuraCanvas className="intro-guide-sakura" density={14} speed={0.5} nightBlue />

          {chibiSrc && (
            <img
              key={step.expression}
              src={chibiSrc}
              alt=""
              className="intro-guide-chibi"
            />
          )}

          <div className="intro-guide-bubble">
            <span className="intro-guide-bubble-petals" aria-hidden="true" />
            <span
              className="intro-guide-bubble-text"
              key={stepIndex}
              dangerouslySetInnerHTML={{ __html: step.html }}
            />
          </div>

          <div className="intro-guide-footer">
            <span className="sr-only" aria-live="polite">
              {t("guide.intro.step", { current: stepIndex + 1, total })}
            </span>
            <button
              type="button"
              className={`intro-guide-next${isLast ? " conquest-guide-go" : ""}`}
              onClick={advance}
              autoFocus
            >
              {isLast
                ? (confirmLabel ?? t("conquestModal.confirm"))
                : t("guide.intro.next")}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
