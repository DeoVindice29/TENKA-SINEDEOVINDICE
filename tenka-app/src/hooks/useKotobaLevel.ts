import { useCallback, useEffect, useState } from "react";
import {
  getCachedKotobaView,
  loadKotobaView,
  type KotobaLevel,
  type KotobaLevelView,
} from "@/lib/kotobaSupabase";

type State =
  | { key: string; status: "loading" }
  | { key: string; status: "ready"; view: KotobaLevelView }
  | { key: string; status: "error"; error: string };

export type KotobaLevelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; view: KotobaLevelView }
  | { status: "error"; error: string };

/**
 * Ambil kotoba satu level + satu "Organize by" dari Supabase. level atau
 * sourceId = null berarti tidak ada yang diambil (sumber bawaan / belum ada
 * Organize by). Hasil di-cache per (level, sourceId), jadi ganti-ganti pilihan
 * tidak fetch ulang.
 */
export function useKotobaLevel(
  level: KotobaLevel | null,
  sourceId: number | null,
): KotobaLevelState & {
  retry: () => void;
} {
  const key = level && sourceId !== null ? `${level}:${sourceId}` : null;
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!level || sourceId === null || key === null) {
      setState(null);
      return;
    }
    const cached = getCachedKotobaView(level, sourceId);
    if (cached) {
      setState({ key, status: "ready", view: cached });
      return;
    }

    let cancelled = false;
    setState({ key, status: "loading" });
    loadKotobaView(level, sourceId).then((res) => {
      if (cancelled) return;
      if (res.error !== null) {
        setState({ key, status: "error", error: res.error });
      } else {
        setState({ key, status: "ready", view: res.view });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [level, sourceId, key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (!key) return { status: "idle", retry };
  // state milik pilihan sebelumnya (render pertama setelah ganti pilihan) -> anggap loading
  if (!state || state.key !== key) return { status: "loading", retry };
  if (state.status === "ready") return { status: "ready", view: state.view, retry };
  if (state.status === "error") return { status: "error", error: state.error, retry };
  return { status: "loading", retry };
}
