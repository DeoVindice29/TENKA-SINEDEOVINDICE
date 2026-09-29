import { useEffect, useState } from "react";
import { RANK_EVENT, getActiveMissionProgress } from "../data/ranks";

/** Live progres misi grup yang sedang aktif (mis. 0/2 → 1/2). Dihitung ulang
 * tiap RANK_EVENT (pangkat naik / penaklukan baru / sinkron akun) atau
 * perubahan localStorage dari tab lain. */
export function useMissionProgress(): { done: number; total: number } {
  const [progress, setProgress] = useState(() => getActiveMissionProgress());

  useEffect(() => {
    const sync = () => {
      const next = getActiveMissionProgress();
      setProgress((prev) =>
        prev.done === next.done && prev.total === next.total ? prev : next,
      );
    };
    window.addEventListener(RANK_EVENT, sync);
    window.addEventListener("storage", sync);
    sync();
    return () => {
      window.removeEventListener(RANK_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return progress;
}
