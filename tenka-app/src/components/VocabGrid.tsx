import { useLang } from "@/i18n/LangContext";
import { useSpeech } from "@/hooks/useSpeech";
import type { Bilingual } from "@/data/types";

type VocabItem = readonly [
  string,
  string,
  Bilingual,
  string,
  readonly (readonly [string, string])[],
  Bilingual,
  string,
  string,
  Bilingual | "",
];

type VocabGridProps = {
  items: readonly VocabItem[];
};

export default function VocabGrid({ items }: VocabGridProps) {
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
        const word = item[0];
        const reading = item[1];
        const meaning = item[2];
        const kanjiWord = item[6];

        return (
          <div
            key={idx}
            className="kanji-cell vocab-cell"
            role="button"
            tabIndex={0}
            aria-label={`Listen to ${word}, read ${reading}`}
            onClick={(e) => speak(word, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                speak(word, e.currentTarget);
              }
            }}
          >
            {kanjiWord && <span className="vocab-kanji">{kanjiWord}</span>}
            <span className="kj">{word}</span>
            <span className="kj-reading">{reading}</span>
            <span className="kj-meaning">{tf(meaning)}</span>
            <span className="cell-audio-icon">🔊</span>
          </div>
        );
      })}
    </div>
  );
}
