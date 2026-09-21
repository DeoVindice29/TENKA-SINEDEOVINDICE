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
import { computeRangeIndices, type RangeSelection } from "@/utils/range";
import { supportsSpeedrun } from "@/utils/speedrun";
import {
  buildJlptExam,
  buildPractice,
  isJlptScript,
  isPracticeType,
  jlptMaxWrong,
} from "@/data/jlptConquest";

/**
 * [soal, jawaban, tipe, info tambahan?, key label info tambahan?, pilihan jawaban?]
 * Index 4-5 dipakai soal Penaklukan ala JLPT: label info di Feedback, dan
 * pilihan jawaban yang sudah disusun (kalau kosong, Choices menyusun sendiri
 * dari state.wrongPools).
 */
export type QuizQueueItem = [
  string,
  string,
  string,
  string?,
  string?,
  string[]?,
];

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
  speedrunMistakes: number;
  speedrunFailed: boolean;
  rankIndexBefore: number;
  /** pengaturan kuis biasa — disimpan supaya Restart/Retry bisa mengulang persis sama */
  variant: string;
  range: RangeSelection | null;
  /** naik tiap kuis dimulai/diulang; dipakai sebagai key supaya layar kuis di-reset bersih */
  runId: number;
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
  speedrunMistakes: 0,
  speedrunFailed: false,
  rankIndexBefore: 0,
  variant: "meaning",
  range: null,
  runId: 0,
  answered: false,
  lastChosen: null,
  lastCorrect: false,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START_QUIZ":
      return {
        ...initialState,
        ...action.payload,
        runId: state.runId + 1,
        answered: false,
      };

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
        if (state.conquest) {
          const b = state.conquestPhaseBoundaries;
          if (state.script && isJlptScript(state.script) && b) {
            // Ujian ala JLPT: tidak gagal di satu salah, tapi begitu jumlah
            // salah di tier ini melewati batas (lulus = min. 80% benar per
            // tier), nilai tier ini sudah pasti tidak akan cukup.
            const start = b[state.conquestPhaseIndex];
            const end = b[state.conquestPhaseIndex + 1];
            let wrongInTier = 0;
            for (let i = start; i <= state.index; i++) {
              if (nextResults[i] === false) wrongInTier++;
            }
            if (wrongInTier > jlptMaxWrong(end - start)) conquestFailed = true;
          } else {
            conquestFailed = true;
          }
        }
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
      return { ...initialState, runId: state.runId + 1 };

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
  /** rentang soal (Dari–Sampai atau acak) — dipakai di kuis biasa saja */
  range?: RangeSelection;
};

// ---------------------------------------------------------------------------
// Bunpō: dua tipe soal, dipilih lewat variant
//   "meaning" (Fungsi)  : pola → tebak fungsinya. Info tambahan = contoh kalimat.
//   "kalimat" (Partikel): kalimat dengan pola dikosongkan "..." → tebak pola.
//                         Info tambahan = fungsi pola.
//   "both"              : campuran acak keduanya.
// dataKalimat / dataKalimatBlank sejajar (index sama) dengan data.
// ---------------------------------------------------------------------------
type BunpoScriptData = {
  data: Record<string, (readonly string[])[]>;
  dataKalimat?: Record<string, (readonly string[])[]>;
  dataKalimatBlank?: Record<string, (readonly string[])[]>;
};

const BUNPO_VARIANTS = ["meaning", "kalimat", "both"];

function bunpoData(): BunpoScriptData {
  return SCRIPTS.bunpo as unknown as BunpoScriptData;
}

function buildBunpoQueue(
  mode: string,
  variant: string,
  range?: RangeSelection,
): QuizQueueItem[] | null {
  const s = bunpoData();
  const pool = s.data[mode];
  if (!pool) return null;
  const full = s.dataKalimat?.[mode];
  const blank = s.dataKalimatBlank?.[mode];

  // variant sisa dari script lain (mis. "romaji") dianggap "meaning"
  const v = BUNPO_VARIANTS.includes(variant) ? variant : "meaning";

  return shuffle(computeRangeIndices(pool.length, range)).map((i) => {
    const pattern = String(pool[i][0]);
    const meaning = String(pool[i][1]);
    const blankSentence = blank?.[i]?.[0];
    const wantKalimat =
      v === "kalimat" || (v === "both" && Math.random() < 0.5);

    // Beberapa pola majemuk tidak punya versi kosong ("..."): kalimatnya
    // sudah memuat polanya, jadi tidak boleh dijadikan soal Partikel
    // (jawaban kelihatan). Untuk pola itu pakai soal Fungsi.
    if (wantKalimat && blankSentence && blankSentence.includes("...")) {
      return [blankSentence, pattern, "kalimat", meaning] as QuizQueueItem;
    }
    return [
      pattern,
      meaning,
      "meaning",
      String(full?.[i]?.[0] ?? ""),
    ] as QuizQueueItem;
  });
}

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
  /** Latihan Tipe Soal (section terpisah): `count` soal acak dari satu tipe */
  startPractice: (
    scriptKey: ScriptKey,
    type: string,
    count: number,
    timerSeconds?: number,
  ) => void;
  /** ulangi kuis yang sedang/baru berjalan dengan pengaturan yang sama */
  restartQuiz: () => void;
};

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const buildQueue = (
    scriptKey: ScriptKey,
    mode: string,
    variant: string,
    forceHard: boolean,
    range?: RangeSelection,
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

    if (scriptKey === "bunpo") {
      return buildBunpoQueue(mode, variant, range);
    }

    const romajiPool = scriptDataRomaji?.[mode];
    const isSimpleScript = scriptKey === "hiragana" || scriptKey === "katakana";

    const mutablePool: (readonly string[])[] = pool.map((item) =>
      Array.from(item),
    );
    const mutableRomaji: (readonly string[])[] | null = romajiPool
      ? romajiPool.map((item) => Array.from(item))
      : null;

    const picked = computeRangeIndices(mutablePool.length, range).map(
      (i) => mutablePool[i],
    );

    return shuffle(picked).map((item) => {
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
    const queue = buildQueue(
      scriptKey,
      mode,
      opts?.variant ?? "romaji",
      false,
      opts?.range,
    );
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
          // Bunpō soal Partikel: pilihan jawabannya adalah pola (elemen ke-2)
          ...(scriptKey === "bunpo"
            ? {
                kalimat: (bunpoData().dataKalimatBlank?.[mode] ?? []).map(
                  (i) => Array.from(i),
                ),
              }
            : {}),
        },
        queue,
        difficulty: opts?.difficulty ?? "easy",
        timerSeconds: opts?.timerSeconds ?? 0,
        rankIndexBefore: getRankIndex(),
        conquest: opts?.conquest ?? false,
        speedrun: opts?.speedrun ?? false,
        variant: opts?.variant ?? "romaji",
        range: opts?.range ?? null,
      },
    });
  };

  // Aturan kesulitan Mode Penaklukan & Speedrun aksara dasar:
  // - Hiragana/Katakana: SELALU "hard" (ketik sendiri, tanpa pilihan ganda).
  // Basic Kotoba, Bunpō & Kanji tidak lewat sini lagi: Penaklukan mereka ala
  // JLPT (pilihan ganda 4 opsi, lihat startConquest) dan tidak ada Speedrun.
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

    // Basic Kotoba, Bunpō & Kanji N5: Penaklukan ala ujian JLPT N5 — 3 tier,
    // soal diacak per percobaan, selalu pilihan ganda 4 opsi (difficulty
    // pilihan user diabaikan). Lihat data/jlptConquest.ts.
    if (isJlptScript(scriptKey)) {
      const exam = buildJlptExam(scriptKey);
      dispatch({
        type: "START_QUIZ",
        payload: {
          script: scriptKey,
          mode: "conquest",
          pool: [],
          wrongPools: {},
          queue: exam.queue,
          difficulty: "easy",
          timerSeconds: 0,
          conquest: true,
          speedrun: false,
          conquestPhaseBoundaries: exam.boundaries,
          conquestPhaseIndex: 0,
          rankIndexBefore: getRankIndex(),
        },
      });
      return;
    }

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
    // Speedrun hanya untuk Hiragana & Katakana
    if (!supportsSpeedrun(scriptKey)) return;

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

  // Latihan Tipe Soal (Kotoba, Bunpō, Kanji): soal diambil acak dari kumpulan
  // satu tipe soal Penaklukan. Selalu pilihan ganda 4 opsi (dibawa di soalnya).
  // Jumlah soal disimpan di range.randomCount supaya Restart/Retry bisa
  // mengulang dengan pengaturan yang sama.
  const startPractice = (
    scriptKey: ScriptKey,
    type: string,
    count: number,
    timerSeconds = 0,
  ) => {
    if (!isJlptScript(scriptKey) || !isPracticeType(scriptKey, type)) return;
    const queue = buildPractice(scriptKey, type, count) as QuizQueueItem[];
    if (queue.length === 0) return;

    dispatch({
      type: "START_QUIZ",
      payload: {
        script: scriptKey,
        mode: "practice",
        pool: [],
        wrongPools: {},
        queue,
        difficulty: "easy",
        timerSeconds,
        conquest: false,
        speedrun: false,
        rankIndexBefore: getRankIndex(),
        variant: type,
        range: { mode: "random", from: 0, to: 0, randomCount: count },
      },
    });
  };

  // Restart (di layar kuis) & Retry (di layar hasil): mulai lagi dari awal
  // dengan script/tingkatan/pengaturan yang sama, tanpa reload halaman.
  const restartQuiz = () => {
    if (!state.script) return;
    const scriptKey = state.script as ScriptKey;
    if (state.speedrun) {
      startSpeedrun(scriptKey, state.difficulty);
    } else if (state.conquest) {
      startConquest(scriptKey, state.difficulty);
    } else if (state.mode === "practice") {
      startPractice(
        scriptKey,
        state.variant,
        state.range?.randomCount ?? state.queue.length,
        state.timerSeconds,
      );
    } else if (state.mode) {
      startQuiz(scriptKey, state.mode, {
        difficulty: state.difficulty,
        timerSeconds: state.timerSeconds,
        variant: state.variant,
        range: state.range ?? undefined,
      });
    }
  };

  return (
    <QuizContext.Provider
      value={{
        state,
        dispatch,
        startQuiz,
        startConquest,
        startSpeedrun,
        startPractice,
        restartQuiz,
      }}
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
