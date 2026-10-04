import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useQuiz } from "@/state/QuizContext";
import { playSfx } from "@/lib/sfx";

export default function QuizHeader() {
  const { state, dispatch } = useQuiz();

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

  // tik-tik di 3 detik terakhir (tidak bunyi di detik pertama timer)
  useEffect(() => {
    if (!showTimer) return;
    if (remaining > 0 && remaining <= 3 && remaining < state.timerSeconds) {
      playSfx("tick");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (!showTimer) return null;

  return (
    <div className="quiz-substatus-row">
      {showTimer && (
        <div className={`question-timer ${remaining <= 1 ? "urgent" : ""}`}>
          ⏱️ <span>{remaining}</span>s
        </div>
      )}
    </div>
  );
}

export function QuizStreak() {
  const { t } = useLang();
  const { state } = useQuiz();

  const showStreak = state.streak >= 1;
  if (!showStreak) return null;

  // api bertambah tiap kelipatan 5: 1-4 → 🔥, 5-9 → 🔥🔥, 10-14 → 🔥🔥🔥, ...
  // (maksimal 5 api supaya tidak melebar)
  const flames = Math.min(5, 1 + Math.floor(state.streak / 5));

  return (
    <div className="quiz-card-streak-row">
      <div className="streak show">
        <span className="flame">{"🔥".repeat(flames)}</span> {state.streak}{" "}
        <span>{t("quiz.streak")}</span>
      </div>
    </div>
  );
}