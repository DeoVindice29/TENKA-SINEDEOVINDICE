import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { SCRIPTS } from "@/data/scripts";
import type { Bilingual } from "@/data/types";

type LevelMeta = { id: string; tier: number; rank: string };

function tf(
  entry: Bilingual | string | null | undefined,
  lang: "en" | "id",
): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return entry[lang] || entry.en || entry.id || "";
}

export default function Levels() {
  const { lang } = useLang();
  const { currentScript, selectedMode, setSelectedMode } = useUI();

  const script = SCRIPTS[currentScript as keyof typeof SCRIPTS];
  if (!script) return null;

  const levelMeta: LevelMeta[] = (script as { levelMeta?: LevelMeta[] })
    .levelMeta || [
    { id: "tier1", tier: 1, rank: "Warrior" },
    { id: "tier2", tier: 2, rank: "Epic" },
    { id: "tier3", tier: 3, rank: "Mythical" },
    { id: "all", tier: 4, rank: "Immortal" },
  ];

  const levelText = script.levelText as Record<
    string,
    {
      title: Bilingual;
      sample: string;
      desc: Bilingual;
      type?: Bilingual;
    }
  >;

  const dotCount = Math.max(...levelMeta.map((m) => m.tier));

  // Script yang pakai label "Chapter N" (kanji/bunpo/kotoba)
  const usesChapterLabel =
    currentScript === "kanji" ||
    currentScript === "bunpo" ||
    currentScript === "kotoba";

  // Script yang pakai label "Type" (hiragana/katakana)
  const usesTypeLabel =
    currentScript === "hiragana" || currentScript === "katakana";

  return (
    <div className="levels">
      {levelMeta.map((meta) => {
        const info = levelText[meta.id];
        if (!info) return null;
        const isSelected = selectedMode === meta.id;

        // Pisah title jadi "Chapter N" + sisa
        const kanjiTitleText = tf(info.title, lang);
        const dashIdx = kanjiTitleText.indexOf("—");
        const chapterLabel =
          dashIdx >= 0
            ? kanjiTitleText.slice(0, dashIdx).trim()
            : kanjiTitleText;
        const titleRest =
          dashIdx >= 0 ? kanjiTitleText.slice(dashIdx + 1).trim() : "";

        return (
          <button
            key={meta.id}
            className={`level-card ${isSelected ? "selected" : ""}`}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setSelectedMode(meta.id)}
          >
            {usesChapterLabel ? (
              <>
                <span className="tier">
                  <span className="tier-chapter-label">{chapterLabel}</span>
                  {meta.rank}
                </span>
                <span className="kana-sample">{info.sample}</span>
                <h3>{titleRest}</h3>
                <p>{tf(info.desc, lang)}</p>
              </>
            ) : usesTypeLabel ? (
              <>
                <span className="tier">
                  <span className="tier-chapter-label">
                    {info.type ? tf(info.type, lang) : meta.rank}
                  </span>
                </span>
                <span className="kana-sample">{info.sample}</span>
                <h3>{tf(info.title, lang)}</h3>
                <p>{tf(info.desc, lang)}</p>
              </>
            ) : (
              <>
                <span className="tier">
                  <span className="tier-dots">
                    {Array.from({ length: dotCount }, (_, i) => i + 1).map(
                      (n) => (
                        <span
                          key={n}
                          className={n <= meta.tier ? "filled" : ""}
                        />
                      ),
                    )}
                  </span>
                  {meta.rank}
                </span>
                <span className="kana-sample">{info.sample}</span>
                <h3>{tf(info.title, lang)}</h3>
                <p>{tf(info.desc, lang)}</p>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
