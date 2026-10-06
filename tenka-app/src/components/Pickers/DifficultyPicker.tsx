import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { scrollToId } from "@/utils/scrollTo";

type Difficulty = "easy" | "medium" | "hard";

export default function DifficultyPicker() {
  const { t } = useLang();
  const { currentScript, selectedDifficulty, setSelectedDifficulty } = useUI();

  const supportsHard =
    currentScript === "hiragana" || currentScript === "katakana";

  const options: {
    key: Difficulty;
    label: string;
    sub: string;
    disabled?: boolean;
  }[] = [
    { key: "easy", label: "Easy", sub: t("quiz.choices4") },
    { key: "medium", label: "Medium", sub: t("quiz.choices8") },
    {
      key: "hard",
      label: "Hard",
      sub: t("quiz.typeItYourself"),
      disabled: !supportsHard,
    },
  ];

  return (
    <div className="difficulty-picker" id="difficulty-picker">
      <span className="settings-label">{t("quiz.difficultyLabel")}</span>
      <div className="difficulty-options">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`difficulty-btn ${
              selectedDifficulty === opt.key ? "active" : ""
            }`}
            disabled={opt.disabled}
            onClick={() => {
              setSelectedDifficulty(opt.key);
              scrollToId("timer-picker");
            }}
          >
            {opt.label}
            <span className="difficulty-sub">{opt.sub}</span>
          </button>
        ))}
      </div>
      {!supportsHard && <p className="difficulty-hint">{t("quiz.hardHint")}</p>}
    </div>
  );
}
