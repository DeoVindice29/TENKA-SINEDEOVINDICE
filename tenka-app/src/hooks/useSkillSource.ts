import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLevelUnlock } from "@/hooks/useLevelUnlock";
import { useOrganizeSources } from "@/hooks/useOrganizeSources";
import { useKotobaLevel } from "@/hooks/useKotobaLevel";
import {
  resolveOrganize,
  type ResolvedOrganize,
} from "@/components/ContentSourceSwitch";
import { KOTOBA_N5_LEARN } from "@/data/kotobaN5";
import type { KotobaEntry } from "@/data/types";
import type { OrganizeSourceRow } from "@/lib/contentTypes";
import type { KotobaLevel } from "@/lib/kotobaSupabase";

export type SkillKey = "listening" | "speaking";

export type SkillSource = {
  level: KotobaLevel;
  setLevel: (next: KotobaLevel) => void;
  organize: ResolvedOrganize;
  sources: OrganizeSourceRow[];
  /** "empty" = level ini belum punya Category sama sekali */
  status: "loading" | "ready" | "error" | "empty";
  error: string;
  /** kosakata (format KotobaEntry) yang dipakai sebagai bank soal */
  entries: KotobaEntry[];
  retry: () => void;
};

const EMPTY: KotobaEntry[] = [];

// Topic bawaan N5 — diratakan sekali saja (data statis).
const N5_BUILTIN: KotobaEntry[] = KOTOBA_N5_LEARN.flatMap((s) => s.items);

/**
 * Pilihan Level untuk Listening & Speaking (tanpa pilihan Category),
 * disimpan terpisah (tenka:lvl:<skill>). Bank soalnya kosakata level itu:
 * Topic bawaan (N5) atau Category kotoba pertama dari Supabase (N4–N1).
 * Level yang masih terkunci otomatis jatuh ke level terbuka sebelumnya.
 */
export function useSkillSource(skill: SkillKey): SkillSource {
  const [storedLevel, setLevel] = useLocalStorage<KotobaLevel>(
    `tenka:lvl:${skill}`,
    "N5",
  );

  const { resolveLevel } = useLevelUnlock();
  const level = resolveLevel(storedLevel);

  const { sources, ready } = useOrganizeSources("kotoba");
  const organize = resolveOrganize(level, "topic", sources, ready);
  const view = useKotobaLevel(level, organize.sourceId);

  const readyView = view.status === "ready" ? view.view : null;
  const viewEntries = useMemo(
    () =>
      readyView
        ? readyView.chapters.flatMap((c) => c.subGroups.flatMap((g) => g.items))
        : EMPTY,
    [readyView],
  );

  let status: SkillSource["status"];
  let entries: KotobaEntry[] = EMPTY;
  let error = "";
  if (organize.pending) status = "loading";
  else if (organize.value === null) status = "empty";
  else if (organize.value === "topic") {
    status = "ready";
    entries = N5_BUILTIN;
  } else if (view.status === "ready") {
    status = "ready";
    entries = viewEntries;
  } else if (view.status === "error") {
    status = "error";
    error = view.error;
  } else status = "loading";

  return {
    level,
    setLevel,
    organize,
    sources,
    status,
    error,
    entries,
    retry: view.retry,
  };
}
