import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { getChibiAvatarByName } from "@/lib/chibiAvatar";
import { INTRO_STEPS } from "@/data/introGuide";
import SakuraCanvas from "@/components/SakuraCanvas";
import introBg from "@/assets/intro-bg.webp";

type Props = {
  open: boolean;
  /** Dipanggil begitu bubble TERAKHIR diklik — sinyal buat App.tsx nampilin Misi Pangkat. */
  onFinish: () => void;
  /** Dipanggil kalau user milih lewatin intro-nya duluan (tidak memicu misi otomatis). */
  onSkip: () => void;
};

// Overlay pemandu chibi yang tampil sekali di kunjungan pertama: satu chibi,
// satu chat bubble yang gantian isinya + ekspresinya tiap "Lanjut" ditekan.
// Baru setelah step terakhir, App.tsx yang buka Misi Pangkat — komponen ini
// sendiri cuma ngurus sekuens ngobrolnya. Background sakura/pagoda-nya pakai
// asset gambar (src/assets/intro-bg.webp). Chat bubble-nya murni CSS (ukuran
// ngikutin isi teks) dengan dekorasi bunga src/assets/sakura-branch.webp (kiri-atas)
// dan kelopak src/assets/sakura-petals.webp (kanan) —
// lihat .intro-guide-bubble di dashboard.css. SakuraCanvas tetap dipasang di
// atasnya buat efek kelopak jatuh yang gerak.
export default function IntroGuide({ open, onFinish, onSkip }: Props) {
  const { t } = useLang();
  const [stepIndex, setStepIndex] = useState(0);

  // Reset ke langkah awal tiap kali overlay dibuka lagi (harusnya cuma
  // sekali seumur hidup localStorage, tapi jaga-jaga kalau dipanggil ulang).
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSkip();
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
  }, [open, stepIndex]);

  if (!open) return null;

  const total = INTRO_STEPS.length;
  const isLast = stepIndex >= total - 1;
  const step = INTRO_STEPS[stepIndex] ?? INTRO_STEPS[0];

  const chibiSrc =
    getChibiAvatarByName(step.expression) ??
    getChibiAvatarByName("happy") ??
    getChibiAvatarByName("cute");

  const advance = () => {
    if (isLast) {
      onFinish();
    } else {
      setStepIndex((i) => Math.min(i + 1, total - 1));
    }
  };

  return (
    <div className="intro-guide-overlay" role="dialog" aria-modal="true" aria-label={t("guide.intro.0")}>
      <div className="intro-guide-card">
        <button
          type="button"
          className="intro-guide-close"
          onClick={onSkip}
          aria-label={t("guide.intro.skip")}
          title={t("guide.intro.skip")}
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
            <span className="intro-guide-bubble-text" key={step.messageKey}>
              {t(step.messageKey)}
            </span>
          </div>

          <div className="intro-guide-footer">
            <span className="sr-only" aria-live="polite">
              {t("guide.intro.step", { current: stepIndex + 1, total })}
            </span>
            <button type="button" className="intro-guide-next" onClick={advance}>
              {isLast ? t("guide.intro.start") : t("guide.intro.next")}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
