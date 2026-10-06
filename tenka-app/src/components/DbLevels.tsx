import { useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { SCRIPTS } from "@/data/scripts";
import type { Bilingual } from "@/data/types";
import type { QuizViewLike } from "@/lib/quizModes";
import { scrollToId } from "@/utils/scrollTo";

type Props = {
  view: QuizViewLike;
  selectedMode: string | null;
  onSelect: (mode: string) => void;
};

type CardInfo = { title: Bilingual; sample: string; desc: Bilingual };

function tf(entry: Bilingual, lang: "en" | "id"): string {
  return entry[lang] || entry.en || entry.id || "";
}

/**
 * Pilihan tingkatan di Home untuk data Supabase (Bunpō / Kanji dari Minna no
 * Nihongo, dst). Tampilannya sama dengan <Levels /> untuk Kotoba: accordion
 * Chapter, isinya kartu Sub Chapter, plus kartu "All Mixed" di bawahnya.
 * Kartu yang dipilih memakai id mode yang sudah didaftarkan ke SCRIPTS
 * (lib/quizModes.ts), jadi Range / Mulai Kuis / Penaklukan-nya jalan lewat
 * kode yang sama dengan data bawaan.
 */
export default function DbLevels({ view, selectedMode, onSelect }: Props) {
  const { t, lang } = useLang();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const levelText = (
    SCRIPTS[view.kind] as unknown as { levelText: Record<string, CardInfo> }
  ).levelText;

  const renderCard = (mode: string, extraClass = "") => {
    const info = levelText[mode];
    if (!info) return null;
    const isSelected = selectedMode === mode;

    // "Sub Chapter 1.1 — Nama" -> label + nama (sama seperti Levels.tsx)
    const titleText = tf(info.title, lang);
    const dashIdx = titleText.indexOf("—");
    const label = dashIdx >= 0 ? titleText.slice(0, dashIdx).trim() : titleText;
    const rest = dashIdx >= 0 ? titleText.slice(dashIdx + 1).trim() : "";

    // pola Bunpō bisa diawali "_" / tanda kurung — ambil huruf/kanji pertama
    const chars = Array.from(info.sample ?? "");
    const iconChar =
      chars.find((c) => /[\p{L}\p{N}]/u.test(c)) ?? chars[0] ?? "";

    return (
      <button
        key={mode}
        className={["level-card", isSelected ? "selected" : "", extraClass]
          .filter(Boolean)
          .join(" ")}
        type="button"
        aria-pressed={isSelected}
        onClick={() => {
          onSelect(mode);
          scrollToId("options-panel");
        }}
      >
        <span className="tier">
          <span className="tier-chapter-label">{label}</span>
        </span>
        <span className="kana-sample">
          <span className="kana-icon">{iconChar}</span>
          <span className="kana-text">{info.sample}</span>
        </span>
        <h3>{rest || label}</h3>
        <p>{tf(info.desc, lang)}</p>
      </button>
    );
  };

  return (
    <div className="levels levels--accordion">
      {view.chapters.map((ch) => {
        const isOpen = openGroupId === ch.id;
        const hasSelected =
          !!selectedMode && ch.subGroups.some((sg) => sg.key === selectedMode);
        return (
          <div
            key={ch.id}
            className={`tier-group ${hasSelected ? "has-selected" : ""}`}
          >
            <button
              type="button"
              className={`tier-group-header ${isOpen ? "open" : ""}`}
              aria-expanded={isOpen}
              onClick={() => setOpenGroupId(isOpen ? null : ch.id)}
            >
              <span className="tier-group-chapter">
                {t("levels.groupChapter", { n: ch.chapter })}
              </span>
              <span className="tier-group-kana">{ch.sample}</span>
              <span className="tier-group-text">
                <span className="tier-group-title">
                  {tf(ch.title, lang).replace(/^Chapter\s*\d+\s*—\s*/i, "")}
                </span>
                <span className="tier-group-desc">{tf(ch.desc, lang)}</span>
              </span>
              <span className="tier-group-count">
                {ch.subGroups.length} {t("levels.subTiers")}
              </span>
              <span className="tier-group-caret" aria-hidden="true" />
            </button>
            <div className={`tier-group-panel-wrap ${isOpen ? "open" : ""}`}>
              <div className="tier-group-panel">
                <div className="tier-group-subgrid">
                  {isOpen || hasSelected
                    ? ch.subGroups.map((sg) => renderCard(sg.key))
                    : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {renderCard(view.allKey, "level-card-all")}
    </div>
  );
}
