import { useLang } from "@/i18n/LangContext";
import { useLevelUnlock } from "@/hooks/useLevelUnlock";
import { KOTOBA_LEVELS, type KotobaLevel } from "@/lib/kotobaSupabase";
import type { OrganizeSourceRow } from "@/lib/contentTypes";
import { sourceName } from "@/lib/organizeSources";

/** "topic" = data bawaan app; "src:<id>" = satu Category dari Supabase. */
export type OrganizeBy = "topic" | `src:${number}`;

export type ResolvedOrganize = {
  /** pilihan yang benar-benar aktif; null = belum ada yang bisa dipakai */
  value: OrganizeBy | null;
  /** id Category Supabase yang aktif (null kalau Topic / belum ada) */
  sourceId: number | null;
  /** true selama daftar Category masih dimuat dan pilihan belum bisa ditentukan */
  pending: boolean;
};

/**
 * Cocokkan pilihan tersimpan denga Category yang benar-benar ada di level
 * ini. Pilihan lama ("minna") atau yang sudah dihapus admin jatuh ke Category
 * pertama di level itu; kalau tidak ada, Topic (N5) atau kosong.
 */
export function resolveOrganize(
  level: KotobaLevel,
  stored: string,
  sources: OrganizeSourceRow[],
  ready: boolean,
): ResolvedOrganize {
  const topicAvailable = level === "N5";
  if (stored === "topic" && topicAvailable) return { value: "topic", sourceId: null, pending: false };
  if (!ready) return { value: null, sourceId: null, pending: true };

  const levelSources = sources.filter((s) => s.tier === level);
  const match = levelSources.find((s) => `src:${s.id}` === stored) ?? levelSources[0];
  if (match) return { value: `src:${match.id}`, sourceId: match.id, pending: false };
  if (topicAvailable) return { value: "topic", sourceId: null, pending: false };
  return { value: null, sourceId: null, pending: false };
}

type Props = {
  level: KotobaLevel;
  organize: ResolvedOrganize;
  /** semua Category kotoba (semua level); disaring per level di sini */
  sources: OrganizeSourceRow[];
  onLevelChange: (next: KotobaLevel) => void;
  onOrganizeChange: (next: OrganizeBy) => void;
};

/**
 * Dua baris pilihan di atas daftar:
 *  1. Level JLPT N5-N1 — selalu tampil. N4-N1 terkunci sampai N5 ditaklukkan.
 *  2. "Category": Topic (data bawaan app — cuma ada untuk N5, jadi
 *     disembunyikan di N4-N1) plus semua Category dari Supabase di level itu
 *     (Minna no Nihongo, dan yang ditambah admin).
 * Dibikin generik supaya section lain (Flashcard, Practice, Home) bisa pakai
 * komponen yang sama nanti.
 */
export default function ContentSourceSwitch({
  level,
  organize,
  sources,
  onLevelChange,
  onOrganizeChange,
}: Props) {
  const { t, lang } = useLang();
  const { isLevelUnlocked, allUnlocked } = useLevelUnlock();

  // data Topic bawaan cuma ada untuk N5 — di level lain pill Topic disembunyikan
  const topicAvailable = level === "N5";
  const levelSources = sources.filter((s) => s.tier === level);

  return (
    <div className="source-switch-wrap">
      <div className="source-switch" role="group" aria-label={t("source.level")}>
        <span className="source-switch-label">{t("source.level")}</span>
        <div className="source-switch-seg source-levels">
          {KOTOBA_LEVELS.map((lv) => {
            const locked = !isLevelUnlocked(lv);
            return (
              <button
                key={lv}
                type="button"
                className={`source-pill ${level === lv ? "active" : ""} ${
                  locked ? "locked" : ""
                }`}
                aria-pressed={level === lv}
                aria-disabled={locked}
                disabled={locked}
                title={
                  locked
                    ? t("source.lockedHintFor", {
                        prev: KOTOBA_LEVELS[KOTOBA_LEVELS.indexOf(lv) - 1],
                        level: lv,
                      })
                    : undefined
                }
                onClick={() => onLevelChange(lv)}
              >
                {locked && (
                  <span className="source-pill-lock" aria-hidden="true">
                    🔒
                  </span>
                )}
                {lv}
              </button>
            );
          })}
        </div>
      </div>

      {!allUnlocked && <p className="source-switch-hint">{t("source.lockedHint")}</p>}

      <div className="source-switch" role="group" aria-label={t("source.label")}>
        <span className="source-switch-label">{t("source.label")}</span>
        <div className="source-switch-seg">
          {/* Topic = data bawaan app, cuma ada untuk N5 → disembunyikan di N4-N1 */}
          {topicAvailable && (
            <button
              type="button"
              className={`source-pill ${organize.value === "topic" ? "active" : ""}`}
              aria-pressed={organize.value === "topic"}
              onClick={() => onOrganizeChange("topic")}
            >
              {t("source.local")}
            </button>
          )}
          {levelSources.map((src) => {
            const value: OrganizeBy = `src:${src.id}`;
            return (
              <button
                key={src.id}
                type="button"
                className={`source-pill ${organize.value === value ? "active" : ""}`}
                aria-pressed={organize.value === value}
                onClick={() => onOrganizeChange(value)}
              >
                {sourceName(src, lang)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
