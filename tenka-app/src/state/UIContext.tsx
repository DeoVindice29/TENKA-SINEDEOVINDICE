import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type Screen =
  | "start"
  | "learn"
  | "flashdeck"
  | "flashcard"
  | "practice"
  | "quiz"
  | "conquest-story"
  | "match"
  | "results"
  | "n4"
  | "statistik";

export type ScriptKey = "hiragana" | "katakana" | "kotoba" | "bunpo" | "kanji";

// Layar yang aman buat "diingat" lewat refresh — state-nya cuma butuh
// context ini sendiri. Layar sesi (quiz/match/flashcard/practice/
// conquest-story/results) butuh data dari QuizContext/FlashContext/
// ConquestContext yang TIDAK ikut disimpan, jadi kalau di-resume abis
// refresh malah nyangkut di layar kosong/rusak — mending balik ke "start".
const RESUMABLE_SCREENS = new Set<Screen>(["start", "learn", "n4", "statistik"]);
const SCREEN_STORAGE_KEY = "tenka:screen";

export type PendingFlashDeck = {
  kind: "kotoba" | "kanji";
  tierKey: string;
  label: string;
};

export type Difficulty = "easy" | "medium" | "hard";
export type RangeMode = "manual" | "random";

type UIContextValue = {
  screen: Screen;
  setScreen: (s: Screen) => void;
  goBack: () => void;

  currentScript: ScriptKey;
  setCurrentScript: (s: ScriptKey) => void;

  selectedMode: string | null;
  setSelectedMode: (m: string | null) => void;

  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (d: Difficulty) => void;

  selectedTimerSeconds: number;
  setSelectedTimerSeconds: (s: number) => void;

  rangeMode: RangeMode;
  setRangeMode: (m: RangeMode) => void;

  rangeFrom: number;
  setRangeFrom: (n: number) => void;

  rangeTo: number;
  setRangeTo: (n: number) => void;

  randomCount: number;
  setRandomCount: (n: number) => void;

  quizVariant: string;
  setQuizVariant: (v: string) => void;

  matchScript: ScriptKey;
  setMatchScript: (s: ScriptKey) => void;

  matchMode: string | null;
  setMatchMode: (m: string | null) => void;

  /**
   * Deck yang dipilih dari luar layar Flashcard (mis. tombol "Study This as
   * Flashcards" di Mode Belajar) — FlashcardScreen langsung membukanya lalu
   * mengosongkannya lagi.
   */
  pendingFlashDeck: PendingFlashDeck | null;
  setPendingFlashDeck: (d: PendingFlashDeck | null) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [storedScreen, setStoredScreen] = useLocalStorage<Screen>(SCREEN_STORAGE_KEY, "start");
  const [screen, setScreenState] = useState<Screen>(
    RESUMABLE_SCREENS.has(storedScreen) ? storedScreen : "start"
  );
  const [currentScript, setCurrentScript] = useState<ScriptKey>("hiragana");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("easy");
  const [selectedTimerSeconds, setSelectedTimerSeconds] = useState<number>(0);
  const [rangeMode, setRangeMode] = useState<RangeMode>("manual");
  const [rangeFrom, setRangeFrom] = useState<number>(0);
  const [rangeTo, setRangeTo] = useState<number>(0);
  const [randomCount, setRandomCount] = useState<number>(5);
  const [quizVariant, setQuizVariant] = useState<string>("meaning");
  const [matchScript, setMatchScript] = useState<ScriptKey>("hiragana");
  const [matchMode, setMatchMode] = useState<string | null>(null);
  const [pendingFlashDeck, setPendingFlashDeck] =
    useState<PendingFlashDeck | null>(null);

  const setScreen = useCallback(
    (s: Screen) => {
      setScreenState(s);
      // Cuma layar "aman" yang disimpan — lihat catatan RESUMABLE_SCREENS.
      setStoredScreen(RESUMABLE_SCREENS.has(s) ? s : "start");
    },
    [setStoredScreen]
  );

  const goBack = useCallback(() => setScreen("start"), [setScreen]);

  return (
    <UIContext.Provider
      value={{
        screen,
        setScreen,
        goBack,
        currentScript,
        setCurrentScript,
        selectedMode,
        setSelectedMode,
        selectedDifficulty,
        setSelectedDifficulty,
        selectedTimerSeconds,
        setSelectedTimerSeconds,
        rangeMode,
        setRangeMode,
        rangeFrom,
        setRangeFrom,
        rangeTo,
        setRangeTo,
        randomCount,
        setRandomCount,
        quizVariant,
        setQuizVariant,
        matchScript,
        setMatchScript,
        matchMode,
        setMatchMode,
        pendingFlashDeck,
        setPendingFlashDeck,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}
