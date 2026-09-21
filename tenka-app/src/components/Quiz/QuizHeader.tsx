import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useQuiz } from "@/state/QuizContext";

export default function QuizHeader() {
  const { t } = useLang();
  const { state, dispatch } = useQuiz();

  const position = state.index + 1;
  const total = state.queue.length;
  const showStreak = state.streak >= 1;
  // makin panjang streak, makin banyak api: 1-2 → 🔥, 3-5 → 🔥🔥, 6+ → 🔥🔥🔥
  const flames = state.streak >= 6 ? 3 : state.streak >= 3 ? 2 : 1;
  const showTimer = state.timerSeconds > 0 && !state.answered;

  const [remaining, setRemaining] = useState(state.timerSeconds);
  const deadlineRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    // Reset timer tiap kali ganti soal
    if (state.timerSeconds <= 0) return;
    if (state.answered) return;

    firedRef.current = false;
    deadlineRef.current = Date.now() + state.timerSeconds * 1000;
    setRemaining(state.timerSeconds);

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      const ms = deadlineRef.current - Date.now();
      const sec = Math.max(0, Math.ceil(ms / 1000));
      setRemaining(sec);
      if (ms <= 0 && !firedRef.current) {
        firedRef.current = true;
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const current = state.queue[state.index];
        if (current) {
          dispatch({ type: "ANSWER", chosen: "__TIMEOUT__" });
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.index, state.timerSeconds, state.answered, dispatch, state.queue]);

  return (
    <div className="quiz-top">
      <div className="quiz-progress-text">
        {position}/{total}
      </div>

      {showTimer && (
        <div className={`question-timer ${remaining <= 1 ? "urgent" : ""}`}>
          ⏱️ <span>{remaining}</span>s
        </div>
      )}

      {showStreak && (
        <div className="streak show">
          <span className="flame">{"🔥".repeat(flames)}</span> {state.streak}{" "}
          <span>{t("quiz.streak")}</span>
        </div>
      )}
    </div>
  );
}