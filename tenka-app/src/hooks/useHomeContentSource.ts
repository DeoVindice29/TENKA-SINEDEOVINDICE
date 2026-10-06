import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLevelUnlock } from "@/hooks/useLevelUnlock";
import { useOrganizeSources } from "@/hooks/useOrganizeSources";
import { useContentView } from "@/hooks/useContentView";
import { useKotobaLevel } from "@/hooks/useKotobaLevel";
import {
  resolveOrganize,
  type OrganizeBy,
  type ResolvedOrganize,
} from "@/components/ContentSourceSwitch";
import type { OrganizeSourceRow } from "@/lib/contentTypes";
import type { QuizViewLike } from "@/lib/quizModes";
import type { KotobaLevel } from "@/lib/kotobaSupabase";

type Kind = "kotoba" | "bunpo" | "kanji";

export type HomeContentSource = {
  /** tab aktif punya pilihan Level + Organize by (Kotoba / Bunpō / Kanji)? */
  enabled: boolean;
  level: KotobaLevel;
  setLevel: (next: KotobaLevel) => void;
  organize: ResolvedOrganize;
  setOrganize: (next: OrganizeBy) => void;
  sources: OrganizeSourceRow[];
  /** true kalau yang dipakai data Supabase (bukan Topic bawaan) */
  fromDb: boolean;
  status: "idle" | "loading" | "ready" | "error";
  error: string;
  view: QuizViewLike | null;
  retry: () => void;
};

/**
 * Pilihan Level + "Organize by" di Home untuk tab Kotoba / Bunpō / Kanji, sama konsepnya
 * dengan yang ada di Lessons (LearnScreen) tapi disimpan terpisah
 * (tenka:lvl:quiz:* / tenka:org:quiz:*), jadi memilih sumber untuk belajar
 * tidak mengubah sumber untuk kuis, dan sebaliknya.
 *
 * Default-nya "topic" (data bawaan N5), jadi Home berperilaku persis seperti
 * sebelumnya sampai user memilih Organize by dari Supabase.
 */
export function useHomeContentSource(script: string): HomeContentSource {
  const kind: Kind | null =
    script === "kotoba" || script === "bunpo" || script === "kanji"
      ? script
      : null;

  const [kotobaLevel, setKotobaLevel] = useLocalStorage<KotobaLevel>(
    "tenka:lvl:quiz:kotoba",
    "N5",
  );
  const [kotobaOrg, setKotobaOrg] = useLocalStorage<OrganizeBy>(
    "tenka:org:quiz:kotoba",
    "topic",
  );
  const [bunpoLevel, setBunpoLevel] = useLocalStorage<KotobaLevel>(
    "tenka:lvl:quiz:bunpo",
    "N5",
  );
  const [kanjiLevel, setKanjiLevel] = useLocalStorage<KotobaLevel>(
    "tenka:lvl:quiz:kanji",
    "N5",
  );
  const [bunpoOrg, setBunpoOrg] = useLocalStorage<OrganizeBy>(
    "tenka:org:quiz:bunpo",
    "topic",
  );
  const [kanjiOrg, setKanjiOrg] = useLocalStorage<OrganizeBy>(
    "tenka:org:quiz:kanji",
    "topic",
  );

  const storedLevel =
    kind === "kanji" ? kanjiLevel : kind === "bunpo" ? bunpoLevel : kotobaLevel;
  const storedOrg =
    kind === "kanji" ? kanjiOrg : kind === "bunpo" ? bunpoOrg : kotobaOrg;
  const setLevel =
    kind === "kanji"
      ? setKanjiLevel
      : kind === "bunpo"
        ? setBunpoLevel
        : setKotobaLevel;
  const setOrganize =
    kind === "kanji"
      ? setKanjiOrg
      : kind === "bunpo"
        ? setBunpoOrg
        : setKotobaOrg;

  // level yang masih terkunci jatuh ke level terbuka sebelumnya (hanya saat
  // render — pilihan tersimpan tidak ditimpa), sama seperti di Lessons
  const { resolveLevel } = useLevelUnlock();
  const level = resolveLevel(storedLevel);

  const { sources, ready } = useOrganizeSources(kind ?? "kotoba");
  const organize = resolveOrganize(level, storedOrg, sources, ready);
  const fromDb = !!kind && organize.value !== "topic";

  const dbLevel = fromDb ? level : null;
  const kotoba = useKotobaLevel(
    kind === "kotoba" ? dbLevel : null,
    organize.sourceId,
  );
  const bunpo = useContentView(
    "bunpo",
    kind === "bunpo" ? dbLevel : null,
    organize.sourceId,
  );
  const kanji = useContentView(
    "kanji",
    kind === "kanji" ? dbLevel : null,
    organize.sourceId,
  );
  const state: {
    status: "idle" | "loading" | "ready" | "error";
    error?: string;
    view?: QuizViewLike;
    retry: () => void;
  } =
    kind === "kanji"
      ? (kanji as any)
      : kind === "bunpo"
        ? (bunpo as any)
        : (kotoba as any);

  return {
    enabled: !!kind,
    level,
    setLevel,
    organize,
    setOrganize,
    sources,
    fromDb,
    status: !kind ? "idle" : state.status,
    error: state.status === "error" ? (state.error ?? "") : "",
    view: state.status === "ready" ? (state.view ?? null) : null,
    retry: state.retry,
  };
}
