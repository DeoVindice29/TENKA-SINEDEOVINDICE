import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { scrollToId } from "@/utils/scrollTo";

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
    <div className="timer-picker" id="timer-picker">
      <span className="settings-label">{t("quiz.timerLabel")}</span>
      <div className="timer-options">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`timer-btn ${
              selectedTimerSeconds === opt.value ? "active" : ""
            }`}
            onClick={() => {
              setSelectedTimerSeconds(opt.value);
              // range-picker bisa gak muncul (total soal 0) → fallback ke tombol start
              scrollToId(
                document.getElementById("range-picker") ? "range-picker" : "btn-start",
              );
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}