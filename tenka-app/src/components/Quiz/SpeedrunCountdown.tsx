import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { playSfx } from "@/lib/sfx";

type SpeedrunCountdownProps = {
  open: boolean;
  /** dipanggil setelah "GO!" selesai — saatnya mulai kuis */
  onDone: () => void;
  /** klik di mana saja membatalkan hitung mundur */
  onCancel: () => void;
};

// Hitung mundur 3 → 2 → 1 → GO! sebelum Speedrun (1 detik per langkah).
export default function SpeedrunCountdown({
  open,
  onDone,
  onCancel,
}: SpeedrunCountdownProps) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const labels = ["3", "2", "1", t("speedrun.countdownGo")];

  useEffect(() => {
    if (!open) return;
    setStep(0);
    playSfx("countdown");
    const timers: number[] = [];
    for (let i = 1; i < labels.length; i++) {
      timers.push(
        window.setTimeout(() => {
          setStep(i);
          playSfx(i === labels.length - 1 ? "go" : "countdown");
        }, i * 1000),
      );
    }
    timers.push(window.setTimeout(() => doneRef.current(), labels.length * 1000));
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isGo = step === labels.length - 1;
  return (
    <div
      className="modal-overlay speedrun-countdown-overlay open"
      role="alertdialog"
      aria-live="assertive"
      aria-label={labels[step]}
      onClick={onCancel}
    >
      <div className={`sr-cd ${isGo ? "go" : ""}`}>
        {/* key = langkah → elemen di-mount ulang supaya animasi ring & angka main lagi tiap langkah */}
        <svg className="sr-cd-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="sr-cd-track" cx="50" cy="50" r="46" />
          <circle key={step} className="sr-cd-arc" cx="50" cy="50" r="46" />
        </svg>
        <div key={step} className="sr-cd-number">
          {labels[step]}
        </div>
      </div>
      <p className="sr-cd-hint">{t("speedrun.countdownCancel")}</p>
    </div>
  );
}
