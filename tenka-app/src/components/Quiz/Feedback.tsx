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
        {extraLabel && <div className="feedback-extra">{extraLabel}</div>}
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
