import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { scrollToId } from "@/utils/scrollTo";

export default function VariantPicker() {
  const { t } = useLang();
  const { currentScript, quizVariant, setQuizVariant } = useUI();

  const scriptsWithVariant = ["kotoba", "kanji", "bunpo"];
  if (!scriptsWithVariant.includes(currentScript)) return null;

  const isBunpo = currentScript === "bunpo";
  // Bunpō tidak punya soal Romaji: tipenya Fungsi / Partikel (kalimat
  // rumpang) / Campuran.
  const options = isBunpo
    ? [
        { key: "meaning", label: t("quiz.function") },
        { key: "kalimat", label: t("quiz.kalimat") },
        { key: "both", label: t("quiz.mixed") },
      ]
    : [
        { key: "meaning", label: t("quiz.meaning") },
        { key: "romaji", label: "Romaji" },
        { key: "both", label: t("quiz.mixed") },
      ];
  // pilihan lama dari script lain yang tidak ada di daftar ini → anggap
  // "meaning" (default) supaya selalu ada tombol yang menyala
  const activeKey = options.some((o) => o.key === quizVariant)
    ? quizVariant
    : "meaning";

  return (
    <div className="quiz-variant-picker" id="variant-picker">
      <span className="settings-label">{t("quiz.typeLabel")}</span>
      <div className="quiz-variant-options">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`quiz-variant-btn ${
              activeKey === opt.key ? "active" : ""
            }`}
            onClick={() => {
              setQuizVariant(opt.key);
              scrollToId("difficulty-picker");
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
