import { useLang } from "@/i18n/LangContext";
import { useSpeech } from "@/hooks/useSpeech";
import type { Bilingual } from "@/data/types";

type KanjiItem = readonly [string, string, Bilingual, string];

type KanjiGridProps = {
  items: readonly KanjiItem[];
};

export default function KanjiGrid({ items }: KanjiGridProps) {
  const { lang } = useLang();
  const { speak } = useSpeech();

  const tf = (entry: Bilingual | string | null | undefined): string => {
    if (entry == null) return "";
    if (typeof entry === "string") return entry;
    return entry[lang] || entry.en || entry.id || "";
  };

  return (
    <div className="kanji-grid">
      {items.map((item, idx) => {
        const char = item[0];
        const reading = item[1];
        const meaning = item[2];
        const kana = item[3];

        return (
          <div
            key={idx}
            className="kanji-cell"
            role="button"
            tabIndex={0}
            aria-label={`Listen to ${char}, read ${reading}`}
            onClick={(e) => speak(kana || char, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                speak(kana || char, e.currentTarget);
              }
            }}
          >
            <span className="kj">{char}</span>
            <span className="kj-reading">{reading}</span>
            <span className="kj-meaning">{tf(meaning)}</span>
            <span className="cell-audio-icon">🔊</span>
          </div>
        );
      })}
    </div>
  );
}
