import { useCallback } from "react";
import { useAuth } from "@/state/AuthContext";
import { useConquest } from "@/state/ConquestContext";
import { CONQUEST_ORDER, LEVEL_CONQUEST_KEYS } from "@/data/titles";
import { KOTOBA_LEVELS, type KotobaLevel } from "@/lib/kotobaSupabase";

/**
 * Kunci level JLPT untuk akun user, BERURUTAN:
 *   N5 selalu terbuka.
 *   N4 terbuka setelah semua aksara N5 ditaklukkan (hiragana, katakana,
 *   kotoba, bunpo, kanji = CONQUEST_ORDER).
 *   N3 terbuka setelah N4 ditaklukkan, N2 setelah N3, N1 setelah N2.
 * Status takluk dibaca dari akun yang lagi aktif (ConquestContext -> titles
 * per-akun, tersinkron ke Supabase). Akun dev lolos semua gate.
 */
export function useLevelUnlock() {
  const { isDev } = useAuth();
  const { isConquered } = useConquest();

  const n5Conquered = CONQUEST_ORDER.every((key) => isConquered(key));

  /** Sudah ditaklukkan? N5 = semua aksara N5; N4-N1 = flag level-nya. */
  const isLevelConquered = useCallback(
    (level: KotobaLevel): boolean =>
      level === "N5"
        ? n5Conquered
        : !!LEVEL_CONQUEST_KEYS[level] && isConquered(LEVEL_CONQUEST_KEYS[level]),
    [n5Conquered, isConquered],
  );

  const isLevelUnlocked = useCallback(
    (level: KotobaLevel): boolean => {
      if (isDev) return true;
      const idx = KOTOBA_LEVELS.indexOf(level);
      if (idx <= 0) return true; // N5
      return isLevelConquered(KOTOBA_LEVELS[idx - 1]);
    },
    [isDev, isLevelConquered],
  );

  /** Semua level sudah terbuka (tidak ada yang perlu petunjuk "terkunci"). */
  const allUnlocked = KOTOBA_LEVELS.every((lv) => isLevelUnlocked(lv));

  /** Level yang benar-benar dipakai: level yang masih terkunci jatuh ke level terbuka tertinggi sebelumnya. */
  const resolveLevel = useCallback(
    (level: KotobaLevel): KotobaLevel => {
      let idx = KOTOBA_LEVELS.indexOf(level);
      while (idx > 0 && !isLevelUnlocked(KOTOBA_LEVELS[idx])) idx--;
      return KOTOBA_LEVELS[Math.max(idx, 0)];
    },
    [isLevelUnlocked],
  );

  return { n5Conquered, allUnlocked, isLevelConquered, isLevelUnlocked, resolveLevel };
}
