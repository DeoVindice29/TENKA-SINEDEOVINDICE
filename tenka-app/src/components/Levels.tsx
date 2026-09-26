import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { SCRIPTS } from "@/data/scripts";
import type { Bilingual } from "@/data/types";
import { scrollToId } from "@/utils/scrollTo";

type LevelMeta = { id: string; tier: number; rank: string };

type TierGroup = {
  id: string;
  chapterNum: number;
  tierKeys: string[];
  sample: string;
  title: Bilingual;
  desc: Bilingual;
};

function tf(
  entry: Bilingual | string | null | undefined,
  lang: "en" | "id",
): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return entry[lang] || entry.en || entry.id || "";
}

export default function Levels() {
  const { t, lang } = useLang();
  const { currentScript, selectedMode, setSelectedMode } = useUI();

  // dibuka/tutup lagi tiap ganti script, biar ga nyangkut kebuka pas balik
  // ke Kotoba dari script lain
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  useEffect(() => {
    setOpenGroupId(null);
  }, [currentScript]);

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

  const renderCard = (meta: LevelMeta, extraClass = "") => {
    const info = levelText[meta.id];
    if (!info) return null;
    const isSelected = selectedMode === meta.id;

    // Pisah title jadi "Chapter N" + sisa
    const titleText = tf(info.title, lang);
    const dashIdx = titleText.indexOf("—");
    const chapterLabel =
      dashIdx >= 0 ? titleText.slice(0, dashIdx).trim() : titleText;
    const titleRest = dashIdx >= 0 ? titleText.slice(dashIdx + 1).trim() : "";

    // lingkaran ikon = karakter pertama sample, teks besar = sample penuh.
    // Pola Bunpō diawali "_" / tanda kurung (mis. "_は_です", "_（辞書形）"),
    // jadi yang dipakai huruf/kanji pertama yang sebenarnya, bukan penanda itu.
    const sampleChars = Array.from(info.sample ?? "");
    const iconChar =
      sampleChars.find((c) => /[\p{L}\p{N}]/u.test(c)) ?? sampleChars[0];
    const sampleNode = (
      <span className="kana-sample">
        <span className="kana-icon">{iconChar}</span>
        <span className="kana-text">{info.sample}</span>
      </span>
    );

    return (
      <button
        key={meta.id}
        className={[
          "level-card",
          isSelected ? "selected" : "",
          extraClass,
        ]
          .filter(Boolean)
          .join(" ")}
        type="button"
        aria-pressed={isSelected}
        onClick={() => {
          setSelectedMode(meta.id);
          scrollToId("options-panel");
        }}
      >
        {usesChapterLabel ? (
          <>
            <span className="tier">
              <span className="tier-chapter-label">{chapterLabel}</span>
              {meta.rank}
            </span>
            {sampleNode}
            <h3>{titleRest}</h3>
            <p>{tf(info.desc, lang)}</p>
          </>
        ) : usesTypeLabel ? (
          <>
            <span className="tier">
              <span className="tier-type-label">
                {info.type ? tf(info.type, lang) : meta.rank}
              </span>
            </span>
            {sampleNode}
            <h3>{tf(info.title, lang)}</h3>
            <p>{tf(info.desc, lang)}</p>
          </>
        ) : (
          <>
            <span className="tier">
              <span className="tier-dots">
                {Array.from({ length: dotCount }, (_, i) => i + 1).map(
                  (n) => (
                    <span key={n} className={n <= meta.tier ? "filled" : ""} />
                  ),
                )}
              </span>
              {meta.rank}
            </span>
            {sampleNode}
            <h3>{tf(info.title, lang)}</h3>
            <p>{tf(info.desc, lang)}</p>
          </>
        )}
      </button>
    );
  };

  // Kotoba (satu-satunya script yang punya `groups` saat ini): 24 sub-tier
  // dikelompokkan jadi accordion 7 Chapter, sama seperti Mode Belajar, plus
  // kartu "All Mixed" berdiri sendiri di luar kelompok = 8 tingkatan teratas.
  // Hanya 1 Chapter yang bisa kebuka dalam satu waktu.
  const groups = (script as { groups?: TierGroup[] }).groups;

  if (groups) {
    const metaByTierKey = Object.fromEntries(levelMeta.map((m) => [m.id, m]));
    const allMeta = metaByTierKey.all;

    return (
      <div className="levels levels--accordion">
        {groups.map((group) => {
          const isOpen = openGroupId === group.id;
          const hasSelected =
            !!selectedMode && group.tierKeys.includes(selectedMode);
          return (
            <div
              key={group.id}
              className={`tier-group ${hasSelected ? "has-selected" : ""}`}
            >
              <button
                type="button"
                className={`tier-group-header ${isOpen ? "open" : ""}`}
                aria-expanded={isOpen}
                onClick={() => setOpenGroupId(isOpen ? null : group.id)}
              >
                <span className="tier-group-chapter">
                  {t("levels.groupChapter", { n: group.chapterNum })}
                </span>
                <span className="tier-group-kana">{group.sample}</span>
                <span className="tier-group-text">
                  <span className="tier-group-title">
                    {tf(group.title, lang).replace(/^Chapter\s*\d+\s*—\s*/i, "")}
                  </span>
                  <span className="tier-group-desc">
                    {tf(group.desc, lang)}
                  </span>
                </span>
                <span className="tier-group-count">
                  {group.tierKeys.length} {t("levels.subTiers")}
                </span>
                <span className="tier-group-caret" aria-hidden="true" />
              </button>
              <div className={`tier-group-panel-wrap ${isOpen ? "open" : ""}`}>
                <div className="tier-group-panel">
                  <div className="tier-group-subgrid">
                    {group.tierKeys.map((tk) => {
                      const meta = metaByTierKey[tk];
                      return meta ? renderCard(meta) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {allMeta && renderCard(allMeta, "level-card-all")}
      </div>
    );
  }

  return (
    <div className="levels">
      {levelMeta.map((meta) => renderCard(meta))}
    </div>
  );
}
