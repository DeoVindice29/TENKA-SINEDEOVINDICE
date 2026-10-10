import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLevelUnlock } from "@/hooks/useLevelUnlock";
import { useOrganizeSources } from "@/hooks/useOrganizeSources";
import { useKotobaLevel } from "@/hooks/useKotobaLevel";
import {
  resolveOrganize,
  type OrganizeBy,
  type ResolvedOrganize,
} from "@/components/ContentSourceSwitch";
import { KOTOBA_N5_LEARN, KOTOBA_TIER_GROUPS } from "@/data/kotobaN5";
import type { Bilingual, KotobaEntry } from "@/data/types";
import type { OrganizeSourceRow } from "@/lib/contentTypes";
import type { KotobaLevel } from "@/lib/kotobaSupabase";

export type SkillKey = "listening" | "speaking";

export type SkillSub = { id: string; title: Bilingual; items: KotobaEntry[] };
export type SkillChapter = { id: string; title: Bilingual; subs: SkillSub[] };

export type SkillSource = {
  level: KotobaLevel;
  setLevel: (next: KotobaLevel) => void;
  organize: ResolvedOrganize;
  setOrganize: (next: OrganizeBy) => void;
  /** Chapter → Sub Chapter dari Category yang aktif */
  chapters: SkillChapter[];
  /** "all" atau id Chapter / Sub Chapter yang dipilih (sudah divalidasi) */
  chapterId: string;
  subId: string;
  setChapterId: (id: string) => void;
  setSubId: (id: string) => void;
  sources: OrganizeSourceRow[];
  /** "empty" = level ini belum punya Category sama sekali */
  status: "loading" | "ready" | "error" | "empty";
  error: string;
  /** kosakata (format KotobaEntry) yang dipakai sebagai bank soal */
  entries: KotobaEntry[];
  retry: () => void;
};

// Topic bawaan N5 — dikelompokkan Chapter → Sub Chapter (data statis).
const N5_CHAPTERS: SkillChapter[] = KOTOBA_TIER_GROUPS.map((g) => ({
  id: g.id,
  title: g.title,
  subs: g.tierKeys.flatMap((tk) => {
    const sec = KOTOBA_N5_LEARN.find((x) => x.tierKey === tk);
    return sec ? [{ id: `${g.id}:${tk}`, title: sec.title, items: sec.items }] : [];
  }),
}));

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
  const [storedCat, setStoredCat] = useLocalStorage<string>(
    `tenka:cat:${skill}`,
    "topic",
  );
  const [rawChapter, setChapterId] = useState("all");
  const [rawSub, setSubId] = useState("all");

  const { resolveLevel } = useLevelUnlock();
  const level = resolveLevel(storedLevel);

  const { sources, ready } = useOrganizeSources("kotoba");
  const organize = resolveOrganize(level, storedCat, sources, ready);
  const view = useKotobaLevel(level, organize.sourceId);

  const readyView = view.status === "ready" ? view.view : null;
  const viewChapters = useMemo<SkillChapter[]>(
    () =>
      readyView
        ? readyView.chapters.map((c) => ({
            id: c.id,
            title: c.title,
            subs: c.subGroups.map((g) => ({
              id: g.key,
              title: g.title,
              items: g.items,
            })),
          }))
        : [],
    [readyView],
  );

  let status: SkillSource["status"];
  let chapters: SkillChapter[] = [];
  let error = "";
  if (organize.pending) status = "loading";
  else if (organize.value === null) status = "empty";
  else if (organize.value === "topic") {
    status = "ready";
    chapters = N5_CHAPTERS;
  } else if (view.status === "ready") {
    status = "ready";
    chapters = viewChapters;
  } else if (view.status === "error") {
    status = "error";
    error = view.error;
  } else status = "loading";

  // ganti Level / Category → pilihan Chapter & Sub Chapter kembali ke "Semua"
  useEffect(() => {
    setChapterId("all");
    setSubId("all");
  }, [level, organize.value]);

  const chapter = chapters.find((c) => c.id === rawChapter);
  const chapterId = chapter ? chapter.id : "all";
  const sub = chapter?.subs.find((x) => x.id === rawSub);
  const subId = sub ? sub.id : "all";

  const entries = useMemo<KotobaEntry[]>(() => {
    if (sub) return sub.items;
    if (chapter) return chapter.subs.flatMap((x) => x.items);
    return chapters.flatMap((c) => c.subs.flatMap((x) => x.items));
  }, [chapters, chapter, sub]);

  return {
    level,
    setLevel,
    organize,
    setOrganize: (next) => setStoredCat(next),
    chapters,
    chapterId,
    subId,
    setChapterId: (id) => {
      setChapterId(id);
      setSubId("all");
    },
    setSubId,
    sources,
    status,
    error,
    entries,
    retry: view.retry,
  };
}
