import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  classifyCard,
  isCardReady,
  type FlashRating,
} from "./flashCategory";
import { capLearnDue, nextInterval } from "./flashSchedule";

const FLASH_SRS_KEY = "tebakAksara_flashSRS_v1";
const FLASH_CUSTOM_DECKS_KEY = "tebakAksara_flashCustomDecks_v1";
const FLASH_DAY_MS = 24 * 60 * 60 * 1000;

export type FlashCardState = {
  ef: number;
  interval: number;
  due: number;
  reps: number;
  lapses: number;
  lastRating?: FlashRating;
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
    const all: Record<string, FlashCardState> = JSON.parse(
      localStorage.getItem(FLASH_SRS_KEY) || "{}",
    );
    Object.values(all).forEach(capLearnDue);
    return all;
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
  rateCard: (id: string, rating: FlashRating) => void;
  dueSummary: (ids: string[]) => {
    total: number;
    fresh: number;
    learning: number;
    due: number;
  };
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
    (id: string, rating: FlashRating) => {
      const all = getSRS();
      const st = all[id] || {
        ef: 2.5,
        interval: 0,
        due: 0,
        reps: 0,
        lapses: 0,
      };
      const now = Date.now();

      // interval dihitung dari state SEBELUM diupdate (ef/reps lama)
      const interval = nextInterval(st, rating);

      if (rating === "again") {
        st.lapses = (st.lapses || 0) + 1;
        st.reps = 0;
        st.ef = Math.max(1.3, st.ef - 0.2);
      } else if (rating === "hard") {
        st.ef = Math.max(1.3, st.ef - 0.15);
        st.reps += 1;
      } else if (rating === "good") {
        st.reps += 1;
      } else {
        st.ef = Math.min(3.2, st.ef + 0.15);
        st.reps += 1;
      }
      st.interval = interval;
      st.due = now + interval * FLASH_DAY_MS;
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
    // Kategori dari rating TERAKHIR tiap kartu:
    //   New   = belum pernah disentuh
    //   Learn = terakhir dijawab Again / Hard / Good
    //   Due   = terakhir dijawab Easy
    // Tapi cuma kartu yang SIAP MUNCUL (waktunya udah lewat) yang dihitung,
    // sama persis kayak antrean di dalam sesi — jadi angka luar = angka dalam.
    const now = Date.now();
    let fresh = 0;
    let learning = 0;
    let due = 0;
    ids.forEach((id) => {
      if (!isCardReady(all[id], now)) return;
      const cat = classifyCard(all[id]);
      if (cat === "new") fresh++;
      else if (cat === "learn") learning++;
      else if (cat === "due") due++;
    });
    return { total: ids.length, fresh, learning, due };
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
