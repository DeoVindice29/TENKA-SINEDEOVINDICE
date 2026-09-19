import { useMemo } from "react";
import { useQuiz } from "@/state/QuizContext";
import { buildChoices } from "@/utils/buildChoices";

export default function Choices() {
  const { state, dispatch } = useQuiz();
  const current = state.queue[state.index];

  const options = useMemo(() => {
    if (!current) return [];
    const pool = state.wrongPools[current[2]] || state.pool;
    const count = state.difficulty === "medium" ? 8 : 4;
    return buildChoices(current, pool as never, count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, current?.[0]]);

  if (!current) return null;

  const count = state.difficulty === "medium" ? 8 : 4;

  return (
    <div className={`choices ${count === 8 ? "choices-2col" : ""}`}>
      {options.map((opt, i) => {
        const isCorrect = opt === current[1];
        const wasChosen = state.answered && state.lastChosen === opt;
        let cls = "choice";
        if (state.answered && isCorrect) cls += " correct";
        if (state.answered && wasChosen && !isCorrect) cls += " wrong";

        return (
          <button
            key={i}
            className={cls}
            type="button"
            disabled={state.answered}
            onClick={() => dispatch({ type: "ANSWER", chosen: opt })}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
