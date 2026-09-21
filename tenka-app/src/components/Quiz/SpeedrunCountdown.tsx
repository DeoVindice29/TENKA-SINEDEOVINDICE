import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";

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
    const timers: number[] = [];
    for (let i = 1; i < labels.length; i++) {
      timers.push(window.setTimeout(() => setStep(i), i * 1000));
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
      aria-hidden="false"
      onClick={onCancel}
    >
      {/* key = langkah → di-mount ulang supaya animasi "tick" main tiap angka */}
      <div
        key={step}
        className={`speedrun-countdown-number tick ${isGo ? "go" : ""}`}
      >
        {labels[step]}
      </div>
    </div>
  );
}
