import { useLang } from "@/i18n/LangContext";
import { useSpeech } from "@/hooks/useSpeech";
import type { Bilingual } from "@/data/types";

type BunpoItem = readonly [
  string,
  string,
  Bilingual,
  readonly (readonly [string, string])[],
  string,
  Bilingual,
];

type GrammarCardProps = {
  items: readonly BunpoItem[];
};

export default function GrammarCard({ items }: GrammarCardProps) {
  const { lang } = useLang();
  const { speak } = useSpeech();

  const tf = (entry: Bilingual | string | null | undefined): string => {
    if (entry == null) return "";
    if (typeof entry === "string") return entry;
    return entry[lang] || entry.en || entry.id || "";
  };

  return (
    <div className="grammar-list">
      {items.map((item, idx) => {
        const pattern = item[0];
        const example = item[1];
        const meaning = item[2];
        const segments = item[3];
        const translation = item[5];

        return (
          <div key={idx} className="grammar-card">
            <span className="grammar-pattern">{pattern}</span>
            <span className="grammar-meaning">{tf(meaning)}</span>

            <div className="grammar-example-row">
              <span className="grammar-example">{example}</span>
              <button
                type="button"
                className="speak-btn"
                onClick={(e) => speak(example, e.currentTarget)}
              >
                🔊
              </button>
            </div>

            <div className="grammar-segments">
              {segments.map((seg, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  className="segment-chip"
                  onClick={(e) => speak(seg[0], e.currentTarget)}
                >
                  <span className="seg-jp">{seg[0]}</span>
                  <span className="seg-romaji">{seg[1]}</span>
                </button>
              ))}
            </div>

            {translation && (
              <span className="vocab-example-translation">
                {tf(translation)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
