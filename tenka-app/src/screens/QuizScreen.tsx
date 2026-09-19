import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useQuiz } from "@/state/QuizContext";
import { SCRIPTS } from "@/data/scripts";
import { useConquest } from "@/state/ConquestContext";
import QuizHeader from "@/components/Quiz/QuizHeader";
import QuizStamp from "@/components/Quiz/QuizStamp";
import Choices from "@/components/Quiz/Choices";
import HardInput from "@/components/Quiz/HardInput";
import Feedback from "@/components/Quiz/Feedback";
import ResultsScreen from "@/screens/ResultsScreen";
import ConquestStory from "@/components/Conquest/ConquestStory";

function fmtTime(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const m = Math.floor(totalCs / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(
    cs,
  ).padStart(2, "0")}`;
}

export default function QuizScreen() {
  const { t } = useLang();
  const { setScreen } = useUI();
  const { state, dispatch } = useQuiz();
  const { getStory } = useConquest();

  const [showStory, setShowStory] = useState(() => {
    return (
      state.conquest &&
      !!state.conquestPhaseBoundaries &&
      state.index === 0 &&
      state.conquestPhaseIndex === 0
    );
  });
  const [speedrunElapsed, setSpeedrunElapsed] = useState(0);

  // Speedrun timer
  useEffect(() => {
    if (!state.speedrun || !state.speedrunStart) return;
    const interval = window.setInterval(() => {
      setSpeedrunElapsed(Date.now() - state.speedrunStart!);
    }, 100);
    return () => window.clearInterval(interval);
  }, [state.speedrun, state.speedrunStart]);

  // Auto-next setelah jawaban benar di speedrun
  useEffect(() => {
    if (!state.speedrun || !state.answered || !state.lastCorrect) return;
    const to = window.setTimeout(() => {
      dispatch({ type: "NEXT_QUESTION" });
    }, 350);
    return () => window.clearTimeout(to);
  }, [state.speedrun, state.answered, state.lastCorrect, dispatch]);

  // PRIORITAS 1: kalau queue habis → Results
  if (state.queue.length > 0 && state.index >= state.queue.length) {
    return <ResultsScreen />;
  }

  // Kalau queue kosong total → placeholder
  if (state.queue.length === 0) {
    return (
      <section id="screen-quiz">
        <p>No quiz started.</p>
        <button className="secondary" onClick={() => setScreen("start")}>
          {t("common.back")}
        </button>
      </section>
    );
  }

  // Conquest story screens
  if (showStory && state.conquest && state.conquestPhaseBoundaries) {
    return (
      <ConquestStory
        scriptKey={state.script!}
        phaseIndex={state.conquestPhaseIndex}
        onBack={() => setScreen("start")}
        onContinue={() => setShowStory(false)}
      />
    );
  }

  // Show story di antara chapter — hanya kalau kita BELUM masuk ke phase
  // tujuan (conquestPhaseIndex belum di-update). Tanpa guard ini,
  // ENTER_PHASE cuma update conquestPhaseIndex tanpa geser `index`, jadi
  // kondisi di bawah tetap true selamanya dan layar story ini nge-loop,
  // gak pernah lanjut ke soal Chapter berikutnya.
  const pendingPhaseIdx =
    state.conquest && state.conquestPhaseBoundaries && state.index > 0
      ? state.conquestPhaseBoundaries.indexOf(state.index)
      : -1;

  if (
    pendingPhaseIdx !== -1 &&
    pendingPhaseIdx !== state.conquestPhaseIndex
  ) {
    return (
      <ConquestStory
        scriptKey={state.script!}
        phaseIndex={pendingPhaseIdx}
        onBack={() => setScreen("start")}
        onContinue={() => {
          dispatch({ type: "ENTER_PHASE", phaseIndex: pendingPhaseIdx });
        }}
      />
    );
  }

  const currentType = state.queue[state.index]?.[2];
  let modeLabel = t("quiz.guessRomaji");
  if (state.conquest) {
    const script = SCRIPTS[state.script as keyof typeof SCRIPTS];
    if (state.conquestPhaseBoundaries) {
      const story = getStory(state.script!);
      const phase = story?.phases[state.conquestPhaseIndex];
      const b = state.conquestPhaseBoundaries;
      const qInPhase = state.index - b[state.conquestPhaseIndex] + 1;
      const phaseLen =
        b[state.conquestPhaseIndex + 1] - b[state.conquestPhaseIndex];
      modeLabel = t("quiz.chapterLabel", {
        phaseLabel: phase?.label ?? "",
        current: qInPhase,
        total: phaseLen,
      });
    } else {
      modeLabel = t("quiz.conquerLabel", {
        label: script?.label ?? "",
        current: state.index + 1,
        total: state.queue.length,
      });
    }
  } else if (state.speedrun) {
    const script = SCRIPTS[state.script as keyof typeof SCRIPTS];
    modeLabel = t("quiz.speedrunLabel", {
      label: script?.label ?? "",
      current: state.index + 1,
      total: state.queue.length,
    });
  } else if (currentType === "meaning") {
    modeLabel = t("quiz.guessMeaning");
  } else if (currentType === "kalimat") {
    modeLabel = t("quiz.guessKalimat");
  }

  return (
    <section
      id="screen-quiz"
      className={
        state.conquest
          ? "conquest-active"
          : state.speedrun
            ? "speedrun-active"
            : ""
      }
    >
           <div className="quiz-back-row">
        <button
          className="quiz-back"
          type="button"
          data-i18n="common.back"
          onClick={() => setScreen("start")}
        >
          {t("common.back")}
        </button>
        <button
          className="quiz-back"
          type="button"
          onClick={() => window.location.reload()}
        >
          Restart
        </button>
      </div>

      {state.speedrun && (
        <div className="quiz-top">
          <div className="quiz-progress-text">
            {state.index + 1}/{state.queue.length}
          </div>
          <div className="speedrun-timer">⏱️ {fmtTime(speedrunElapsed)}</div>
        </div>
      )}

      {!state.speedrun && <QuizHeader />}

      <QuizStamp />

      <div className="quiz-mode-label">{modeLabel}</div>

      {state.difficulty === "hard" ? <HardInput /> : <Choices />}

      <Feedback />
    </section>
  );
}
