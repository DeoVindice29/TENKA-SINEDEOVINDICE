import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import { SCRIPTS, type ScriptKey } from "@/data/scripts";
import { shuffle } from "@/utils/shuffle";
import { getRankIndex } from "@/data/ranks";

export type QuizQueueItem = [string, string, string, string?, string?, string?];

export type QuizState = {
  script: string | null;
  mode: string | null;
  pool: (readonly string[])[];
  wrongPools: Record<string, (readonly string[])[]>;
  queue: QuizQueueItem[];
  difficulty: "easy" | "medium" | "hard";
  timerSeconds: number;
  index: number;
  score: number;
  streak: number;
  maxStreak: number;
  missed: QuizQueueItem[];
  results: boolean[];
  conquest: boolean;
  conquestFailed: boolean;
  conquestPhaseBoundaries: number[] | null;
  conquestPhaseIndex: number;
  speedrun: boolean;
  speedrunStart: number | null;
  speedrunElapsedMs: number;
  speedrunMistakes: number;
  speedrunFailed: boolean;
  rankIndexBefore: number;
  answered: boolean;
  lastChosen: string | null;
  lastCorrect: boolean;
};

type QuizAction =
  | { type: "START_QUIZ"; payload: Partial<QuizState> }
  | { type: "ANSWER"; chosen: string }
  | { type: "NEXT_QUESTION" }
  | { type: "FAIL_QUIZ" }
  | { type: "ENTER_PHASE"; phaseIndex: number }
  | { type: "RESET" };

const initialState: QuizState = {
  script: null,
  mode: null,
  pool: [],
  wrongPools: {},
  queue: [],
  difficulty: "easy",
  timerSeconds: 0,
  index: 0,
  score: 0,
  streak: 0,
  maxStreak: 0,
  missed: [],
  results: [],
  conquest: false,
  conquestFailed: false,
  conquestPhaseBoundaries: null,
  conquestPhaseIndex: 0,
  speedrun: false,
  speedrunStart: null,
  speedrunElapsedMs: 0,
  speedrunMistakes: 0,
  speedrunFailed: false,
  rankIndexBefore: 0,
  answered: false,
  lastChosen: null,
  lastCorrect: false,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START_QUIZ":
      return { ...initialState, ...action.payload, answered: false };

    case "ANSWER": {
      const current = state.queue[state.index];
      if (!current) return state;

      const isCorrect =
        String(action.chosen).trim().toLowerCase() ===
        String(current[1]).trim().toLowerCase();

      const nextStreak = isCorrect ? state.streak + 1 : 0;
      const nextScore = isCorrect ? state.score + 1 : state.score;
      const nextMaxStreak = Math.max(state.maxStreak, nextStreak);
      const nextMissed = isCorrect ? state.missed : [...state.missed, current];
      const nextResults = [...state.results];
      nextResults[state.index] = isCorrect;

      let conquestFailed = state.conquestFailed;
      let speedrunMistakes = state.speedrunMistakes;
      let speedrunFailed = state.speedrunFailed;

      if (!isCorrect) {
        if (state.conquest) conquestFailed = true;
        if (state.speedrun) {
          speedrunMistakes += 1;
          if (speedrunMistakes > 3) speedrunFailed = true;
        }
      }

      return {
        ...state,
        score: nextScore,
        streak: nextStreak,
        maxStreak: nextMaxStreak,
        missed: nextMissed,
        results: nextResults,
        conquestFailed,
        speedrunMistakes,
        speedrunFailed,
        answered: true,
        lastChosen: action.chosen,
        lastCorrect: isCorrect,
      };
    }

    case "NEXT_QUESTION":
      return {
        ...state,
        index: state.index + 1,
        answered: false,
        lastChosen: null,
        lastCorrect: false,
      };

    case "FAIL_QUIZ":
      return { ...state, index: state.queue.length };

    case "ENTER_PHASE":
      // PENTING: jangan reset index — biar lanjut ke soal Chapter berikutnya
      return { ...state, conquestPhaseIndex: action.phaseIndex };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

type StartQuizOptions = {
  difficulty: "easy" | "medium" | "hard";
  timerSeconds: number;
  variant: string;
  conquest?: boolean;
  speedrun?: boolean;
};

type QuizContextValue = {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
  startQuiz: (
    scriptKey: ScriptKey,
    mode: string,
    opts?: StartQuizOptions,
  ) => void;
  startConquest: (
    scriptKey: ScriptKey,
    fallbackDifficulty?: "easy" | "medium" | "hard",
  ) => void;
  startSpeedrun: (
    scriptKey: ScriptKey,
    fallbackDifficulty?: "easy" | "medium" | "hard",
  ) => void;
};

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const buildQueue = (
    scriptKey: ScriptKey,
    mode: string,
    variant: string,
    forceHard: boolean,
  ): QuizQueueItem[] | null => {
    const script = SCRIPTS[scriptKey];
    if (!script) return null;

    const scriptData = script.data as unknown as Record<
      string,
      (readonly string[])[]
    >;
    const scriptDataRomaji = (
      script as unknown as {
        dataRomaji?: Record<string, (readonly string[])[]>;
      }
    ).dataRomaji;

    const pool = scriptData[mode];
    if (!pool) return null;

    const romajiPool = scriptDataRomaji?.[mode];
    const isSimpleScript = scriptKey === "hiragana" || scriptKey === "katakana";

    const mutablePool: (readonly string[])[] = pool.map((item) =>
      Array.from(item),
    );
    const mutableRomaji: (readonly string[])[] | null = romajiPool
      ? romajiPool.map((item) => Array.from(item))
      : null;

    return shuffle([...mutablePool]).map((item) => {
      if (isSimpleScript || !mutableRomaji || forceHard) {
        return [String(item[0]), String(item[1]), "romaji"];
      }

      let chosenType: string;
      if (variant === "both") {
        chosenType = Math.random() < 0.5 ? "meaning" : "romaji";
      } else {
        chosenType = variant;
      }

      const romajiItem = mutableRomaji.find((r) => r[0] === item[0]);

      if (chosenType === "romaji" && romajiItem) {
        return [
          String(item[0]),
          String(romajiItem[1]),
          "romaji",
          String(item[1]),
        ];
      }

      return [
        String(item[0]),
        String(item[1]),
        "meaning",
        romajiItem ? String(romajiItem[1]) : "",
      ];
    });
  };

  const startQuiz = (
    scriptKey: ScriptKey,
    mode: string,
    opts?: StartQuizOptions,
  ) => {
    const queue = buildQueue(scriptKey, mode, opts?.variant ?? "romaji", false);
    if (!queue) return;

    const script = SCRIPTS[scriptKey];
    const scriptData = script.data as unknown as Record<
      string,
      (readonly string[])[]
    >;
    const scriptDataRomaji = (
      script as unknown as {
        dataRomaji?: Record<string, (readonly string[])[]>;
      }
    ).dataRomaji;
    const pool = scriptData[mode];
    const romajiPool = scriptDataRomaji?.[mode];

    dispatch({
      type: "START_QUIZ",
      payload: {
        script: scriptKey,
        mode,
        pool: pool.map((i) => Array.from(i)),
        wrongPools: {
          romaji: romajiPool
            ? romajiPool.map((i) => Array.from(i))
            : pool.map((i) => Array.from(i)),
          meaning: pool.map((i) => Array.from(i)),
        },
        queue,
        difficulty: opts?.difficulty ?? "easy",
        timerSeconds: opts?.timerSeconds ?? 0,
        rankIndexBefore: getRankIndex(),
        conquest: opts?.conquest ?? false,
        speedrun: opts?.speedrun ?? false,
      },
    });
  };

  // Aturan kesulitan Mode Penaklukan & Speedrun, sama persis kayak file
  // vanilla (getConquestPhaseDifficulty + forceKotobaMedium):
  // - Hiragana/Katakana: SELALU "hard" (ketik sendiri, tanpa pilihan ganda).
  // - Basic Kotoba: dikunci "medium" (8 pilihan) — tidak ikut setting user.
  // - Kanji/Bunpō: ikut difficulty yang dipilih user di Settings, tapi kalau
  //   dia pilih "hard" tetap turun ke "easy" karena keduanya belum punya
  //   UI mode ketik-sendiri (cuma didukung Hiragana/Katakana).
  const resolveConquestDifficulty = (
    scriptKey: ScriptKey,
    fallback: "easy" | "medium" | "hard",
  ): "easy" | "medium" | "hard" => {
    const supportsHard = scriptKey === "hiragana" || scriptKey === "katakana";
    if (supportsHard) return "hard";
    if (scriptKey === "kotoba") return "medium";
    return fallback === "hard" ? "easy" : fallback;
  };

  const startConquest = (
    scriptKey: ScriptKey,
    fallbackDifficulty: "easy" | "medium" | "hard" = "easy",
  ) => {
    const script = SCRIPTS[scriptKey];
    if (!script) return;

    const scriptData = script.data as unknown as Record<
      string,
      (readonly string[])[]
    >;

    const isThreePhase = scriptKey === "hiragana" || scriptKey === "katakana";
    const difficulty = resolveConquestDifficulty(scriptKey, fallbackDifficulty);

    if (isThreePhase) {
      const t1 = scriptData.tier1;
      const t2 = scriptData.tier2;
      const t3 = scriptData.tier3;
      const poolAll = scriptData.all;

      const q1 = shuffle([...t1]).map(
        (i) => [String(i[0]), String(i[1]), "romaji"] as QuizQueueItem,
      );
      const q2 = shuffle([...t2]).map(
        (i) => [String(i[0]), String(i[1]), "romaji"] as QuizQueueItem,
      );
      const q3 = shuffle([...t3]).map(
        (i) => [String(i[0]), String(i[1]), "romaji"] as QuizQueueItem,
      );

      dispatch({
        type: "START_QUIZ",
        payload: {
          script: scriptKey,
          mode: "conquest",
          pool: poolAll.map((i) => Array.from(i)),
          wrongPools: {
            romaji: poolAll.map((i) => Array.from(i)),
            meaning: poolAll.map((i) => Array.from(i)),
          },
          queue: [...q1, ...q2, ...q3],
          difficulty,
          timerSeconds: 0,
          conquest: true,
          speedrun: false,
          conquestPhaseBoundaries: [
            0,
            q1.length,
            q1.length + q2.length,
            q1.length + q2.length + q3.length,
          ],
          conquestPhaseIndex: 0,
          rankIndexBefore: getRankIndex(),
        },
      });
    } else {
      const poolAll = scriptData.all;
      const shuffled = shuffle([...poolAll]).map(
        (i) => [String(i[0]), String(i[1]), "romaji"] as QuizQueueItem,
      );

      dispatch({
        type: "START_QUIZ",
        payload: {
          script: scriptKey,
          mode: "conquest",
          pool: poolAll.map((i) => Array.from(i)),
          wrongPools: {
            romaji: poolAll.map((i) => Array.from(i)),
            meaning: poolAll.map((i) => Array.from(i)),
          },
          queue: shuffled,
          difficulty,
          timerSeconds: 0,
          conquest: true,
          speedrun: false,
          rankIndexBefore: getRankIndex(),
        },
      });
    }
  };

  const startSpeedrun = (
    scriptKey: ScriptKey,
    fallbackDifficulty: "easy" | "medium" | "hard" = "easy",
  ) => {
    const script = SCRIPTS[scriptKey];
    if (!script) return;

    const poolAll = (
      script.data as unknown as Record<string, (readonly string[])[]>
    ).all;

    const shuffled = shuffle([...poolAll]).map(
      (i) => [String(i[0]), String(i[1]), "romaji"] as QuizQueueItem,
    );

    const difficulty = resolveConquestDifficulty(scriptKey, fallbackDifficulty);

    dispatch({
      type: "START_QUIZ",
      payload: {
        script: scriptKey,
        mode: "speedrun",
        pool: poolAll.map((i) => Array.from(i)),
        wrongPools: {
          romaji: poolAll.map((i) => Array.from(i)),
          meaning: poolAll.map((i) => Array.from(i)),
        },
        queue: shuffled,
        difficulty,
        timerSeconds: 0,
        conquest: false,
        speedrun: true,
        speedrunStart: Date.now(),
        rankIndexBefore: getRankIndex(),
      },
    });
  };

  return (
    <QuizContext.Provider
      value={{ state, dispatch, startQuiz, startConquest, startSpeedrun }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used inside <QuizProvider>");
  return ctx;
}
