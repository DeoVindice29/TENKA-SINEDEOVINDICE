import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useQuiz } from "@/state/QuizContext";
import { SCRIPTS } from "@/data/scripts";
import { useConquest } from "@/state/ConquestContext";
import QuizHeader, { QuizStreak } from "@/components/Quiz/QuizHeader";
import QuizStamp from "@/components/Quiz/QuizStamp";
import Choices from "@/components/Quiz/Choices";
import HardInput from "@/components/Quiz/HardInput";
import Feedback from "@/components/Quiz/Feedback";
import ResultsScreen from "@/screens/ResultsScreen";
import ConquestStory from "@/components/Conquest/ConquestStory";
import AdminQuizTools from "@/components/Quiz/AdminQuizTools";
import ConquestSheet from "@/components/Conquest/ConquestSheet";
import { isJlptScript, practiceTypeKeyOfQueueType } from "@/data/jlptConquest";
import { playSfx } from "@/lib/sfx";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

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
  const { state } = useQuiz();
  // key = runId → Restart/Retry me-mount ulang seluruh layar kuis (timer,
  // input, cerita Chapter, dll. kembali bersih)
  return (
    <>
      <QuizScreenInner key={state.runId} />
      <AdminQuizTools />
    </>
  );
}

function QuizScreenInner() {
  const { t } = useLang();
  const { setScreen } = useUI();
  const { state, dispatch, restartQuiz } = useQuiz();
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

  // Keyboard HP terbuka (mode ketik): layar dipadatkan, dan kartu soal
  // digulung ke atas area yang terlihat tiap ganti soal / habis menjawab,
  // jadi user tidak perlu menggulung manual lagi.
  const kbOpen = useKeyboardOpen();
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!kbOpen) return;
    const id = window.setTimeout(
      () => cardRef.current?.scrollIntoView({ block: "start" }),
      80,
    );
    return () => window.clearTimeout(id);
  }, [kbOpen, state.index, state.answered]);

  // soal sudah maju (mis. admin skip Tier/Chapter dari layar cerita awal) →
  // jangan tampilkan lagi cerita pembuka
  useEffect(() => {
    if (state.index > 0) setShowStory(false);
  }, [state.index]);

  // Tombol Back "armed": klik pertama minta konfirmasi (3 detik), klik kedua
  // baru benar-benar keluar dari kuis.
  const [backArmed, setBackArmed] = useState(false);
  const backTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (backTimerRef.current) window.clearTimeout(backTimerRef.current);
    },
    [],
  );
  const handleBack = () => {
    if (!backArmed) {
      setBackArmed(true);
      if (backTimerRef.current) window.clearTimeout(backTimerRef.current);
      backTimerRef.current = window.setTimeout(() => setBackArmed(false), 3000);
      return;
    }
    if (backTimerRef.current) window.clearTimeout(backTimerRef.current);
    setBackArmed(false);
    // Latihan Tipe Soal kembali ke lobbynya, bukan ke layar awal
    setScreen(state.mode === "practice" ? "practice" : "start");
  };

  // Shortcut keyboard: 1-4 pilih jawaban, Enter/Space = Next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector(".settings-overlay.open")) return;
      const quizEl = document.getElementById("screen-quiz");
      if (!quizEl) return;

      if (e.key >= "1" && e.key <= "4") {
        const choices = quizEl.querySelectorAll<HTMLButtonElement>(
          "button.choice:not(:disabled)",
        );
        const btn = choices[Number(e.key) - 1];
        if (btn) {
          e.preventDefault();
          btn.click();
        }
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        const nextBtn = quizEl.querySelector<HTMLButtonElement>("#btn-next");
        // kalau fokus sudah di tombol Next, biarkan aksi native-nya jalan
        if (nextBtn && e.target !== nextBtn) {
          e.preventDefault();
          nextBtn.click();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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

  // Efek suara jawaban: benar / salah / waktu habis (+ bonus saat streak naik)
  const prevAnsweredRef = useRef(false);
  useEffect(() => {
    const was = prevAnsweredRef.current;
    prevAnsweredRef.current = state.answered;
    if (!state.answered || was) return;
    if (state.lastChosen === "__TIMEOUT__") {
      playSfx("timeout");
    } else if (state.lastCorrect) {
      playSfx("correct");
      // bonus suara hanya di kelipatan 5 (5, 10, 15, ...)
      if (state.streak > 0 && state.streak % 5 === 0) {
        window.setTimeout(() => playSfx("streak"), 260);
      }
    } else {
      playSfx("wrong");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answered]);

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
  // Kanji N5 tidak pakai romaji — tipe soal "romaji" isinya bacaan hiragana,
  // jadi judulnya juga "Tebak hiragana", bukan "Tebak romaji".
  let modeLabel =
    state.script === "kanji" ? t("quiz.guessHiragana") : t("quiz.guessRomaji");
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
    // Bunpō: "Tebak fungsinya", script lain: "Tebak artinya"
    modeLabel = t(
      state.script === "bunpo" ? "quiz.guessFunction" : "quiz.guessMeaning",
    );
  } else if (currentType === "kalimat") {
    modeLabel = t("quiz.guessKalimat");
  } else if (state.mode === "practice" && currentType) {
    // Latihan Tipe Soal: label = nama tipe soalnya (mis. "Tebak Kanji")
    const typeKey = practiceTypeKeyOfQueueType(currentType);
    if (typeKey) modeLabel = t(`practice.${state.script}.${typeKey}`);
  }

  // Penaklukan ala JLPT: satu Tier = satu lembar soal (gaya Latihan Tipe Soal)
  const isSheet =
    state.conquest &&
    !!state.conquestPhaseBoundaries &&
    !!state.script &&
    isJlptScript(state.script);

  const tierTotal = state.conquestPhaseBoundaries
    ? state.conquestPhaseBoundaries.length - 1
    : 0;
  const position = isSheet ? state.conquestPhaseIndex + 1 : state.index + 1;
  const total = isSheet ? tierTotal : state.queue.length;
  const pct = total > 0 ? Math.min(100, (position / total) * 100) : 0;

  return (
    <section
      id="screen-quiz"
      className={[
        state.conquest ? "conquest-active" : "",
        state.speedrun ? "speedrun-active" : "",
        kbOpen ? "kb-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="quiz-topbar">
        <button
          className={`quiz-pill-btn quiz-back ${backArmed ? "armed" : ""}`}
          type="button"
          data-i18n="common.back"
          onClick={handleBack}
        >
          <span>{backArmed ? t("common.backArmed") : t("common.back")}</span>
        </button>

        <div className="quiz-progress-center">
          <div className="quiz-progress-text">
            {position} / {total}
          </div>
          <div className="quiz-progress-bar" aria-hidden="true">
            <div className="quiz-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <button
          className="quiz-pill-btn quiz-restart"
          type="button"
          onClick={restartQuiz}
        >
          <svg
            className="quiz-pill-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M20 11A8 8 0 1 0 18.5 15.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 5v6h-6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Restart</span>
        </button>
      </div>

      {isSheet ? (
        <ConquestSheet key={state.conquestPhaseIndex} />
      ) : (
        <div className="quiz-card" ref={cardRef}>
          {state.speedrun && (
            <div className="quiz-substatus-row">
              <div className="speedrun-timer">⏱️ {fmtTime(speedrunElapsed)}</div>
            </div>
          )}

          {!state.speedrun && <QuizHeader />}

          <QuizStamp />

          <div className="quiz-mode-label">
            <span className="mode-label-line" aria-hidden="true" />
            <span className="mode-label-text">{modeLabel}</span>
            <span className="mode-label-line" aria-hidden="true" />
          </div>

          {state.difficulty === "hard" ? <HardInput /> : <Choices />}

          <Feedback />

          <QuizStreak />
        </div>
      )}
    </section>
  );
}
