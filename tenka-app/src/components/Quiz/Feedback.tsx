import { useLang } from "@/i18n/LangContext";
import { useQuiz } from "@/state/QuizContext";

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
    if (type === "romaji") {
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
      <button className="ghost" type="button" onClick={handleNext}>
        {conquestFailed || speedrunFailed || isLast
          ? t("quiz.seeResults")
          : t("quiz.next")}
      </button>
    </div>
  );
}
