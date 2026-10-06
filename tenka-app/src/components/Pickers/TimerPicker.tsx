import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { scrollToId } from "@/utils/scrollTo";

const MAX_CUSTOM_SECONDS = 600;
const DEFAULT_CUSTOM_SECONDS = 15;

/**
 * variant "quiz"     — Tanpa Waktu / 3s / 5s / 10s (layar kuis biasa)
 * variant "practice" — Tanpa Waktu / 5s / 10s / Custom (layar Latihan Soal)
 */
export default function TimerPicker({
  variant = "quiz",
}: {
  variant?: "quiz" | "practice";
}) {
  const { t } = useLang();
  const { selectedTimerSeconds, setSelectedTimerSeconds } = useUI();
  const isPractice = variant === "practice";

  const presets = isPractice ? [0, 5, 10] : [0, 3, 5, 10];
  const [customOpen, setCustomOpen] = useState(
    () => isPractice && !presets.includes(selectedTimerSeconds),
  );
  const [customText, setCustomText] = useState(() =>
    isPractice && !presets.includes(selectedTimerSeconds)
      ? String(selectedTimerSeconds)
      : String(DEFAULT_CUSTOM_SECONDS),
  );

  // Nilai custom (mis. 7 detik) tidak ada tombolnya di layar kuis biasa, jadi
  // kembalikan ke "Tanpa Waktu" hanya saat meninggalkan Latihan Soal
  // (unmount) — bukan tiap nilainya berubah.
  const latestSeconds = useRef(selectedTimerSeconds);
  latestSeconds.current = selectedTimerSeconds;
  const setSecondsRef = useRef(setSelectedTimerSeconds);
  setSecondsRef.current = setSelectedTimerSeconds;
  useEffect(() => {
    if (!isPractice) return;
    return () => {
      if (![0, 3, 5, 10].includes(latestSeconds.current)) {
        setSecondsRef.current(0);
      }
    };
  }, [isPractice]);

  const scrollNext = () =>
    scrollToId(
      // range-picker bisa gak muncul (total soal 0) → fallback ke tombol start
      document.getElementById("range-picker") ? "range-picker" : "btn-start",
    );

  const pickPreset = (value: number) => {
    setCustomOpen(false);
    setSelectedTimerSeconds(value);
    scrollNext();
  };

  const openCustom = () => {
    const n = parseInt(customText, 10);
    const seconds =
      Number.isFinite(n) && n >= 1
        ? Math.min(n, MAX_CUSTOM_SECONDS)
        : DEFAULT_CUSTOM_SECONDS;
    setCustomOpen(true);
    setCustomText(String(seconds));
    setSelectedTimerSeconds(seconds);
  };

  const onCustomChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    setCustomText(digits);
    const n = parseInt(digits, 10);
    if (Number.isFinite(n) && n >= 1) {
      setSelectedTimerSeconds(Math.min(n, MAX_CUSTOM_SECONDS));
    }
  };

  // Saat input dilepas dalam keadaan kosong / 0 / lebih dari batas, rapikan.
  const onCustomBlur = () => {
    const n = parseInt(customText, 10);
    const fixed =
      Number.isFinite(n) && n >= 1
        ? Math.min(n, MAX_CUSTOM_SECONDS)
        : DEFAULT_CUSTOM_SECONDS;
    setCustomText(String(fixed));
    setSelectedTimerSeconds(fixed);
  };

  return (
    <div className="timer-picker" id="timer-picker">
      <span className="settings-label">{t("quiz.timerLabel")}</span>
      <div className="timer-options">
        {presets.map((value) => (
          <button
            key={value}
            type="button"
            className={`timer-btn ${
              !customOpen && selectedTimerSeconds === value ? "active" : ""
            }`}
            onClick={() => pickPreset(value)}
          >
            {value === 0 ? t("quiz.timerOff") : `${value}s`}
          </button>
        ))}
        {isPractice && (
          <button
            type="button"
            className={`timer-btn ${customOpen ? "active" : ""}`}
            onClick={openCustom}
          >
            {t("quiz.timerCustom")}
          </button>
        )}
      </div>

      {isPractice && customOpen && (
        <label className="timer-custom">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="timer-custom-input"
            value={customText}
            aria-label={t("quiz.timerCustomAria")}
            onChange={(e) => onCustomChange(e.target.value)}
            onBlur={onCustomBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
                scrollNext();
              }
            }}
          />
          <span className="timer-custom-unit">{t("quiz.timerCustomUnit")}</span>
        </label>
      )}
    </div>
  );
}
