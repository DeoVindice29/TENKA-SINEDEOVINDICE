import { useEffect, useState } from "react";
import { RANK_EVENT, getRankIndex } from "../data/ranks";

/** Live rank index: re-reads localStorage whenever the rank is promoted
 * (setRankIndex fires RANK_EVENT) or another tab changes it. */
export function useRankIndex(): number {
  const [rankIndex, setRankIndex] = useState<number>(() => getRankIndex());

  useEffect(() => {
    const sync = () => setRankIndex(getRankIndex());
    window.addEventListener(RANK_EVENT, sync);
    window.addEventListener("storage", sync);
    sync();
    return () => {
      window.removeEventListener(RANK_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return rankIndex;
}
