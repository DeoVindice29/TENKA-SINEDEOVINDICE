import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLevelUnlock } from "@/hooks/useLevelUnlock";
import { useOrganizeSources } from "@/hooks/useOrganizeSources";
import {
  resolveOrganize,
  type OrganizeBy,
  type ResolvedOrganize,
} from "@/components/ContentSourceSwitch";
import { getCachedSoal, loadSoal } from "@/lib/soalPractice";
import type { OrganizeSourceRow, SoalRow } from "@/lib/contentTypes";
import type { KotobaLevel } from "@/lib/kotobaSupabase";
import type { JlptScriptKey } from "@/data/jlptConquest";

export type PracticeSource = {
  level: KotobaLevel;
  setLevel: (next: KotobaLevel) => void;
  organize: ResolvedOrganize;
  setOrganize: (next: OrganizeBy) => void;
  sources: OrganizeSourceRow[];
  /** true kalau soalnya dari Supabase (bukan Topic bawaan N5) */
  fromDb: boolean;
  status: "idle" | "loading" | "ready" | "error";
  error: string;
  rows: SoalRow[] | null;
  retry: () => void;
};

type State =
  | { key: string; status: "loading" }
  | { key: string; status: "ready"; rows: SoalRow[] }
  | { key: string; status: "error"; error: string };

/**
 * Pilihan Level + "Category" untuk Latihan Soal (Practice), sama konsepnya
 * dengan Home / Lessons / Flashcard tapi disimpan terpisah
 * (tenka:lvl:practice:* / tenka:org:practice:*). Daftar Category diambil
 * dari organize_sources milik aksaranya (Kotoba / Bunpō / Kanji).
 *
 * Default "topic" (N5) = soal bawaan app, jadi Practice berperilaku persis
 * seperti sebelumnya sampai user memilih Category dari Supabase.
 */
export function usePracticeSource(script: JlptScriptKey): PracticeSource {
  const [kotobaLevel, setKotobaLevel] = useLocalStorage<KotobaLevel>(
    "tenka:lvl:practice:kotoba",
    "N5",
  );
  const [bunpoLevel, setBunpoLevel] = useLocalStorage<KotobaLevel>(
    "tenka:lvl:practice:bunpo",
    "N5",
  );
  const [kanjiLevel, setKanjiLevel] = useLocalStorage<KotobaLevel>(
    "tenka:lvl:practice:kanji",
    "N5",
  );
  const [kotobaOrg, setKotobaOrg] = useLocalStorage<OrganizeBy>(
    "tenka:org:practice:kotoba",
    "topic",
  );
  const [bunpoOrg, setBunpoOrg] = useLocalStorage<OrganizeBy>(
    "tenka:org:practice:bunpo",
    "topic",
  );
  const [kanjiOrg, setKanjiOrg] = useLocalStorage<OrganizeBy>(
    "tenka:org:practice:kanji",
    "topic",
  );

  const storedLevel =
    script === "kanji" ? kanjiLevel : script === "bunpo" ? bunpoLevel : kotobaLevel;
  const storedOrg =
    script === "kanji" ? kanjiOrg : script === "bunpo" ? bunpoOrg : kotobaOrg;
  const setLevel =
    script === "kanji" ? setKanjiLevel : script === "bunpo" ? setBunpoLevel : setKotobaLevel;
  const setOrganize =
    script === "kanji" ? setKanjiOrg : script === "bunpo" ? setBunpoOrg : setKotobaOrg;

  // level yang masih terkunci jatuh ke level terbuka sebelumnya (hanya saat
  // render — pilihan tersimpan tidak ditimpa)
  const { resolveLevel } = useLevelUnlock();
  const level = resolveLevel(storedLevel);

  const { sources, ready } = useOrganizeSources(script);
  const organize = resolveOrganize(level, storedOrg, sources, ready);
  const fromDb = organize.sourceId !== null;

  const sourceId = organize.sourceId;
  const key = fromDb ? `${level}:${script}:${sourceId}` : null;
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key || sourceId === null) {
      setState(null);
      return;
    }
    const cached = getCachedSoal(level, script, sourceId);
    if (cached && attempt === 0) {
      setState({ key, status: "ready", rows: cached });
      return;
    }
    let cancelled = false;
    setState({ key, status: "loading" });
    loadSoal(level, script, sourceId).then((res) => {
      if (cancelled) return;
      if (res.error !== null) setState({ key, status: "error", error: res.error });
      else setState({ key, status: "ready", rows: res.rows });
    });
    return () => {
      cancelled = true;
    };
  }, [key, level, script, sourceId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  let status: PracticeSource["status"] = "idle";
  let error = "";
  let rows: SoalRow[] | null = null;
  if (key) {
    // state milik pilihan sebelumnya (render pertama setelah ganti pilihan) -> anggap loading
    if (!state || state.key !== key || state.status === "loading") status = "loading";
    else if (state.status === "error") {
      status = "error";
      error = state.error;
    } else {
      status = "ready";
      rows = state.rows;
    }
  }

  return { level, setLevel, organize, setOrganize, sources, fromDb, status, error, rows, retry };
}
