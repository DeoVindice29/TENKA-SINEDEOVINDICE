import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  CONQUEST_TITLES,
  getConqueredTitles,
  earnConquestTitle,
  getConquestLockReason as checkLockReason,
} from "@/data/titles";
import { getLocalizedConquestStory } from "@/data/conquestStory";
import { getJlptStory, isJlptScript } from "@/data/jlptConquest";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/state/AuthContext";
import { getSpeedrunBest, saveSpeedrunTime } from "@/utils/speedrun";
import { promoteIfHigher, computeRankIndex } from "@/data/ranks";

export type ConquestStory = {
  epilogue: string;
  phases: { label: string; text: string }[];
};

type ConquestContextValue = {
  isConquered: (scriptKey: string) => boolean;
  isLocked: (scriptKey: string) => string | null;
  getStory: (scriptKey: string) => ConquestStory | null;
  completeConquest: (scriptKey: string) => {
    promoted: boolean;
    newTitle: boolean;
    rankIndex: number;
    titleInfo: { title: string; emoji: string } | null;
  };
  getSpeedrunBestTime: (scriptKey: string) => number | null;
  submitSpeedrunTime: (
    scriptKey: string,
    ms: number,
  ) => { isNewRecord: boolean; prevBest: number | null };
  reloadFlag: number;
  reload: () => void;
};

const ConquestContext = createContext<ConquestContextValue | null>(null);

export function ConquestProvider({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  const { isAdmin } = useAuth();
  const [reloadFlag, setReloadFlag] = useState(0);

  const reload = useCallback(() => setReloadFlag((n) => n + 1), []);

  const isConquered = useCallback(
    (scriptKey: string) => !!getConqueredTitles()[scriptKey],
    [],
  );

  // akun admin lolos semua gate progression (chapter trials, dll) —
  // gak perlu urut menaklukkan yang sebelumnya dulu.
  const isLocked = useCallback(
    (scriptKey: string) => (isAdmin ? null : checkLockReason(scriptKey)),
    [isAdmin],
  );

  const getStory = useCallback(
    (scriptKey: string): ConquestStory | null =>
      isJlptScript(scriptKey)
        ? getJlptStory(scriptKey, lang)
        : getLocalizedConquestStory(scriptKey),
    [lang],
  );

  const completeConquest = useCallback((scriptKey: string) => {
    const promoted = promoteIfHigher(scriptKey, "all");
    const newTitle = earnConquestTitle(scriptKey);
    const rankIndex = computeRankIndex();
    const titleInfo = newTitle ? CONQUEST_TITLES[scriptKey] : null;
    setReloadFlag((n) => n + 1);
    return {
      promoted,
      newTitle,
      rankIndex,
      titleInfo: titleInfo
        ? { title: titleInfo.title, emoji: titleInfo.emoji }
        : null,
    };
  }, []);

  const getSpeedrunBestTime = useCallback(
    (scriptKey: string) => getSpeedrunBest(scriptKey),
    [],
  );

  const submitSpeedrunTime = useCallback((scriptKey: string, ms: number) => {
    const result = saveSpeedrunTime(scriptKey, ms);
    setReloadFlag((n) => n + 1);
    return result;
  }, []);

  return (
    <ConquestContext.Provider
      value={{
        isConquered,
        isLocked,
        getStory,
        completeConquest,
        getSpeedrunBestTime,
        submitSpeedrunTime,
        reloadFlag,
        reload,
      }}
    >
      {children}
    </ConquestContext.Provider>
  );
}

export function useConquest(): ConquestContextValue {
  const ctx = useContext(ConquestContext);
  if (!ctx) {
    throw new Error("useConquest must be used inside <ConquestProvider>");
  }
  return ctx;
}
