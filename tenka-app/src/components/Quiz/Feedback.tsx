import { useLang } from "@/i18n/LangContext";
import { useQuiz } from "@/state/QuizContext";
import { SCRIPTS } from "@/data/scripts";

export default function Feedback() {
  const { t } = useLang();
  const { state, dispatch } = useQuiz();

  if (!state.answered) {
    return <div className="feedback-row" />;
  }

  const current = state.queue[state.index];
  if (!current) return null;

  const isLast = state.index === state.queue.length - 1;
  const isTimeout = state.lastChosen === "__TIMEOUT__";
  const conquestFailed = state.conquest && state.conquestFailed;
  const speedrunFailed = state.speedrun && state.speedrunFailed;

  let feedbackMsg: string;
  if (isTimeout) {
    feedbackMsg = t("quiz.timeUpAnswerWas", { answer: current[1] });
  } else if (state.lastCorrect) {
    feedbackMsg = t("quiz.correct");
  } else if (conquestFailed) {
    feedbackMsg = t("quiz.failedAnswerWas", { answer: current[1] });
  } else {
    feedbackMsg = t("quiz.missedAnswerWas", { answer: current[1] });
  }

  const extraValue = current[3];
  const type = current[2];
  let extraLabel: string | null = null;
  if (extraValue) {
    // label info tambahan per tipe soal yang didefinisikan script-nya
    // (Bunpō: "meaning" → contoh kalimat, "kalimat" → fungsi pola)
    const scriptCfg = state.script
      ? (SCRIPTS[state.script as keyof typeof SCRIPTS] as unknown as {
          extraLabelKeys?: Record<string, string>;
        })
      : undefined;
    const scriptLabelKey = scriptCfg?.extraLabelKeys?.[type];

    if (current[4]) {
      // soal Penaklukan ala JLPT: key label ikut dibawa di soalnya
      extraLabel = t(current[4], { value: extraValue });
    } else if (scriptLabelKey) {
      extraLabel = t(scriptLabelKey, { value: extraValue });
    } else if (type === "romaji") {
      extraLabel = t("quiz.meaningLabel", { value: extraValue });
    } else if (type === "meaning") {
      extraLabel = t("quiz.romajiLabel", { value: extraValue });
    }
  }

  // Info tambahan lain di luar extraLabel di atas — khusus soal Kotoba biasa
  // (meaning/romaji, bukan kalimat Penaklukan/Latihan): kalau katanya punya
  // bentuk kanji dan/atau catatan cara pakai, tampilkan juga sebagai baris
  // tersendiri di bawah extraLabel, tepat kayak versi vanilla-nya.
  const extraLines: string[] = [];
  if (extraLabel) extraLines.push(extraLabel);
  if (
    state.script === "kotoba" &&
    state.mode &&
    (type === "meaning" || type === "romaji")
  ) {
    const kotobaCfg = SCRIPTS.kotoba as unknown as {
      dataKanji?: Record<string, readonly (readonly string[])[]>;
      dataUsage?: Record<string, readonly (readonly string[])[]>;
    };
    const kanjiPool = kotobaCfg.dataKanji?.[state.mode];
    const usagePool = kotobaCfg.dataUsage?.[state.mode];
    const kanjiForm = kanjiPool?.find((r) => r[0] === current[0])?.[1];
    const usageNote = usagePool?.find((r) => r[0] === current[0])?.[1];
    if (kanjiForm) extraLines.push(t("quiz.kanjiLabel", { value: kanjiForm }));
    if (usageNote) extraLines.push(t("quiz.usageNote", { value: usageNote }));
  }
  // Bunpō biasa (meaning/kalimat, bukan Penaklukan/Latihan): tambahin arti
  // kalimat contohnya juga, di bawah extraLabel (Kalimat/Fungsi). Kuncinya
  // selalu pola-nya sendiri — utk tipe "meaning" pola ada di current[0], utk
  // tipe "kalimat" pola-nya adalah jawaban benarnya (current[1]).
  if (
    state.script === "bunpo" &&
    state.mode &&
    (type === "meaning" || type === "kalimat")
  ) {
    const bunpoCfg = SCRIPTS.bunpo as unknown as {
      dataTranslation?: Record<string, readonly (readonly string[])[]>;
      dataNote?: Record<string, readonly (readonly string[])[]>;
    };
    const translationPool = bunpoCfg.dataTranslation?.[state.mode];
    const notePool = bunpoCfg.dataNote?.[state.mode];
    const patternKey = type === "meaning" ? current[0] : current[1];
    const translation = translationPool?.find(
      (r) => r[0] === patternKey,
    )?.[1];
    const usageNote = notePool?.find((r) => r[0] === patternKey)?.[1];
    if (translation) {
      extraLines.push(t("quiz.translationLabel", { value: translation }));
    }
    if (usageNote) extraLines.push(t("quiz.usageNote", { value: usageNote }));
  }

  const handleNext = () => {
    if (conquestFailed || speedrunFailed) {
      dispatch({ type: "FAIL_QUIZ" });
    } else {
      dispatch({ type: "NEXT_QUESTION" });
    }
  };

  return (
    <div className="feedback-row">
      <div className="feedback-col">
        <div
          className={`feedback-text ${state.lastCorrect ? "correct" : "wrong"}`}
        >
          {feedbackMsg}
        </div>
        {extraLines.map((line, i) => (
          <div key={i} className="feedback-extra">
            {line}
          </div>
        ))}
      </div>
      <button
        id="btn-next"
        className="ghost"
        type="button"
        // fokus otomatis ke Next supaya Enter/Space langsung lanjut. Di mode
        // ketik (hard) fokus dibiarkan di input biar keyboard HP tidak turun.
        autoFocus={state.difficulty !== "hard"}
        onClick={handleNext}
      >
        {conquestFailed || speedrunFailed || isLast
          ? t("quiz.seeResults")
          : t("quiz.next")}
      </button>
    </div>
  );
}
