import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const FLASH_SRS_KEY = "tebakAksara_flashSRS_v1";
const FLASH_CUSTOM_DECKS_KEY = "tebakAksara_flashCustomDecks_v1";
const FLASH_DAY_MS = 24 * 60 * 60 * 1000;

export type FlashCardState = {
  ef: number;
  interval: number;
  due: number;
  reps: number;
  lapses: number;
  lastRating?: string;
  lastReviewed?: number;
};

export type CustomDeckCard = { front: string; back: string };
export type CustomDeck = {
  id: string;
  name: string;
  cards: CustomDeckCard[];
  createdAt: number;
};

function getSRS(): Record<string, FlashCardState> {
  try {
    return JSON.parse(localStorage.getItem(FLASH_SRS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveSRS(all: Record<string, FlashCardState>) {
  try {
    localStorage.setItem(FLASH_SRS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
function getCustomDecks(): CustomDeck[] {
  try {
    return JSON.parse(localStorage.getItem(FLASH_CUSTOM_DECKS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveCustomDecks(decks: CustomDeck[]): boolean {
  try {
    localStorage.setItem(FLASH_CUSTOM_DECKS_KEY, JSON.stringify(decks));
    return true;
  } catch {
    return false;
  }
}

type FlashContextValue = {
  getCardState: (id: string) => FlashCardState;
  rateCard: (id: string, rating: "again" | "hard" | "good" | "easy") => void;
  dueSummary: (ids: string[]) => { total: number; due: number };
  getCustomDecks: () => CustomDeck[];
  addCustomDeck: (name: string, cards: CustomDeckCard[]) => string | null;
  deleteCustomDeck: (id: string) => void;
  reload: () => void;
  reloadFlag: number;
};

const FlashContext = createContext<FlashContextValue | null>(null);

export function FlashProvider({ children }: { children: ReactNode }) {
  const [reloadFlag, setReloadFlag] = useState(0);

  const getCardState = useCallback((id: string): FlashCardState => {
    const all = getSRS();
    return all[id] || { ef: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 };
  }, []);

  const rateCard = useCallback(
    (id: string, rating: "again" | "hard" | "good" | "easy") => {
      const all = getSRS();
      const st = all[id] || {
        ef: 2.5,
        interval: 0,
        due: 0,
        reps: 0,
        lapses: 0,
      };
      const now = Date.now();

      if (rating === "again") {
        st.lapses = (st.lapses || 0) + 1;
        st.reps = 0;
        st.interval = 0;
        st.ef = Math.max(1.3, st.ef - 0.2);
        st.due = now;
      } else if (rating === "hard") {
        st.ef = Math.max(1.3, st.ef - 0.15);
        st.interval =
          st.reps === 0 ? 1 : Math.max(1, Math.round(st.interval * 1.2));
        st.reps += 1;
        st.due = now + st.interval * FLASH_DAY_MS;
      } else if (rating === "good") {
        st.interval =
          st.reps === 0 ? 1 : Math.max(1, Math.round(st.interval * st.ef));
        st.reps += 1;
        st.due = now + st.interval * FLASH_DAY_MS;
      } else if (rating === "easy") {
        st.ef = Math.min(3.2, st.ef + 0.15);
        st.interval =
          st.reps === 0
            ? 4
            : Math.max(1, Math.round(st.interval * st.ef * 1.3));
        st.reps += 1;
        st.due = now + st.interval * FLASH_DAY_MS;
      }
      st.lastRating = rating;
      st.lastReviewed = now;
      all[id] = st;
      saveSRS(all);
      setReloadFlag((n) => n + 1);
    },
    [],
  );

  const dueSummary = useCallback((ids: string[]) => {
    const all = getSRS();
    const now = Date.now();
    let due = 0;
    ids.forEach((id) => {
      const st = all[id];
      if (!st || st.due <= now) due++;
    });
    return { total: ids.length, due };
  }, []);

  const addCustomDeck = useCallback(
    (name: string, cards: CustomDeckCard[]): string | null => {
      const decks = getCustomDecks();
      const id =
        "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      decks.push({ id, name, cards, createdAt: Date.now() });
      const ok = saveCustomDecks(decks);
      if (ok) setReloadFlag((n) => n + 1);
      return ok ? id : null;
    },
    [],
  );

  const deleteCustomDeck = useCallback((id: string) => {
    saveCustomDecks(getCustomDecks().filter((d) => d.id !== id));
    const srs = getSRS();
    let changed = false;
    Object.keys(srs).forEach((k) => {
      if (k.indexOf(`custom:${id}:`) === 0) {
        delete srs[k];
        changed = true;
      }
    });
    if (changed) saveSRS(srs);
    setReloadFlag((n) => n + 1);
  }, []);

  const reload = useCallback(() => setReloadFlag((n) => n + 1), []);

  return (
    <FlashContext.Provider
      value={{
        getCardState,
        rateCard,
        dueSummary,
        getCustomDecks,
        addCustomDeck,
        deleteCustomDeck,
        reload,
        reloadFlag,
      }}
    >
      {children}
    </FlashContext.Provider>
  );
}

export function useFlash(): FlashContextValue {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error("useFlash must be used inside <FlashProvider>");
  return ctx;
}
