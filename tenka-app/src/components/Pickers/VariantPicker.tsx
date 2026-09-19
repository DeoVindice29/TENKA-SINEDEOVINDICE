import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";

export default function VariantPicker() {
  const { t } = useLang();
  const { currentScript, quizVariant, setQuizVariant } = useUI();

  const scriptsWithVariant = ["kotoba", "kanji", "bunpo"];
  if (!scriptsWithVariant.includes(currentScript)) return null;

  const isBunpo = currentScript === "bunpo";
  const options = [
    {
      key: "meaning",
      label: isBunpo ? t("quiz.function") : t("quiz.meaning"),
    },
    { key: "romaji", label: "Romaji" },
    { key: "both", label: t("quiz.mixed") },
  ];

  return (
    <div className="quiz-variant-picker">
      <span className="settings-label">{t("quiz.typeLabel")}</span>
      <div className="quiz-variant-options">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`quiz-variant-btn ${
              quizVariant === opt.key ? "active" : ""
            }`}
            onClick={() => setQuizVariant(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
