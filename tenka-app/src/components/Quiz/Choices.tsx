import { useMemo } from "react";
import { useQuiz } from "@/state/QuizContext";
import { buildChoices } from "@/utils/buildChoices";

export default function Choices() {
  const { state, dispatch } = useQuiz();
  const current = state.queue[state.index];

  const options = useMemo(() => {
    if (!current) return [];
    // soal Penaklukan ala JLPT membawa pilihan jawabannya sendiri
    if (current[5]) return current[5];
    const pool = state.wrongPools[current[2]] || state.pool;
    const count = state.difficulty === "medium" ? 8 : 4;
    return buildChoices(current, pool as never, count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, current?.[0]]);

  if (!current) return null;

  const count = current[5]
    ? current[5].length
    : state.difficulty === "medium"
      ? 8
      : 4;

  // Penaklukan ala JLPT (Kotoba/Bunpō/Kanji): tiap pilihan diberi nomor 1–4
  // seperti lembar ujian JLPT (nomornya juga = tombol keyboard 1–4).
  const numbered = !!current[5];

  return (
    <div className={`choices ${count === 8 ? "choices-2col" : ""}`}>
      {options.map((opt, i) => {
        const isCorrect = opt === current[1];
        const wasChosen = state.answered && state.lastChosen === opt;
        let cls = numbered ? "choice numbered" : "choice";
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
            {numbered ? (
              <>
                <span className="choice-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="choice-text">{opt}</span>
              </>
            ) : (
              opt
            )}
          </button>
        );
      })}
    </div>
  );
}
