import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  CONQUEST_TITLES,
  getConqueredTitles,
  earnConquestTitle,
  revokeConquestTitles,
  getConquestLockReason as checkLockReason,
  TITLES_EVENT,
} from "@/data/titles";
import { getLocalizedConquestStory } from "@/data/conquestStory";
import { getJlptStory, isJlptScript } from "@/data/jlptConquest";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/state/AuthContext";
import { getSpeedrunBest, saveSpeedrunTime } from "@/utils/speedrun";
import {
  promoteIfHigher,
  computeRankIndex,
  setRankIndex,
  unmarkScriptsConquered,
  RANK_EVENT,
} from "@/data/ranks";

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
  /** Khusus dev: reset status takluk satu aksara (atau "all") — title,
   *  status misi, dan pangkat dihitung ulang. Rekor speedrun tidak disentuh. */
  resetConquest: (target: string) => void;
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
  const { isDev } = useAuth();
  const [reloadFlag, setReloadFlag] = useState(0);

  const reload = useCallback(() => setReloadFlag((n) => n + 1), []);

  // pas progres pangkat/title ke-gabung ulang dari Supabase (login, ganti
  // akun, atau logout ke tamu — lihat ranks.ts/titles.ts), ikut refresh
  // isConquered/isLocked/badge title-nya tanpa perlu reload halaman.
  useEffect(() => {
    const bump = () => setReloadFlag((n) => n + 1);
    window.addEventListener(RANK_EVENT, bump);
    window.addEventListener(TITLES_EVENT, bump);
    return () => {
      window.removeEventListener(RANK_EVENT, bump);
      window.removeEventListener(TITLES_EVENT, bump);
    };
  }, []);

  const isConquered = useCallback(
    (scriptKey: string) => !!getConqueredTitles()[scriptKey],
    [],
  );

  // akun dev lolos semua gate progression (chapter conquests, dll) —
  // gak perlu urut menaklukkan yang sebelumnya dulu.
  const isLocked = useCallback(
    (scriptKey: string) => (isDev ? null : checkLockReason(scriptKey)),
    [isDev],
  );

  const getStory = useCallback(
    (scriptKey: string): ConquestStory | null =>
      isJlptScript(scriptKey)
        ? getJlptStory(scriptKey, lang)
        : getLocalizedConquestStory(scriptKey, lang),
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

  const resetConquest = useCallback(
    (target: string) => {
      if (!isDev) return; // cuma pengaman di sisi UI, bukan pengganti RLS Supabase
      const keys = target === "all" ? Object.keys(CONQUEST_TITLES) : [target];
      revokeConquestTitles(keys);
      unmarkScriptsConquered(keys);
      // pangkat turun ke hasil hitung ulang dari status takluk yang tersisa
      setRankIndex(computeRankIndex());
      setReloadFlag((n) => n + 1);
    },
    [isDev],
  );

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
        resetConquest,
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
