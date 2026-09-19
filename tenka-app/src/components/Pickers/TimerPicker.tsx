import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";

export default function TimerPicker() {
  const { t } = useLang();
  const { selectedTimerSeconds, setSelectedTimerSeconds } = useUI();

  const options = [
    { value: 0, label: t("quiz.timerOff") },
    { value: 3, label: "3s" },
    { value: 5, label: "5s" },
    { value: 10, label: "10s" },
  ];

  return (
    <div className="timer-picker">
      <span className="settings-label">{t("quiz.timerLabel")}</span>
      <div className="timer-options">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`timer-btn ${
              selectedTimerSeconds === opt.value ? "active" : ""
            }`}
            onClick={() => setSelectedTimerSeconds(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}