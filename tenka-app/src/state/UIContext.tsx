import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Screen =
  | "start"
  | "learn"
  | "flashdeck"
  | "flashcard"
  | "quiz"
  | "conquest-story"
  | "match"
  | "results";

export type ScriptKey = "hiragana" | "katakana" | "kotoba" | "bunpo" | "kanji";

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
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("start");
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

  const goBack = useCallback(() => setScreen("start"), []);

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
