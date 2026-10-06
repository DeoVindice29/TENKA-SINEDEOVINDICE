import { Fragment, memo } from "react";
import { useLang } from "@/i18n/LangContext";
import { useSpeech } from "@/hooks/useSpeech";
import type { Bilingual } from "@/data/types";

export type CategoryRun = { label: Bilingual; start: number; count: number };

type VocabListProps = {
  items: any[];
  /**
   * Pemisah kategori (dari KOTOBA_N5_LEARN[].categoryRuns). Disisipkan tepat
   * sebelum kartu ke-`start`, sama seperti versi vanilla.
   */
  runs?: CategoryRun[] | null;
};

function VocabList({ items, runs }: VocabListProps) {
  const { lang, t } = useLang();
  const { speak } = useSpeech();

  const tf = (entry: Bilingual | string | null | undefined): string => {
    if (entry == null) return "";
    if (typeof entry === "string") return entry;
    return entry[lang] || entry.en || entry.id || "";
  };

  const runByStart: Record<number, CategoryRun> = {};
  if (runs) runs.forEach((run) => (runByStart[run.start] = run));

  return (
    <div className="grammar-list vocab-list">
      {items.map((item: any, idx: number) => {
        const word = item[0];
        const reading = item[1];
        const meaning = item[2];
        const example = item[3];
        const segments = item[4];
        const translation = item[5];
        const kanjiWord = item[6];
        const kanjiExample = item[7];
        const usage = item[8];

        const run = runByStart[idx];

        return (
          <Fragment key={idx}>
            {run && (
              <div className="vocab-cat-divider">
                <span className="vocab-cat-label">{tf(run.label)}</span>
                <span className="vocab-cat-count">
                  {run.count} {t("learn.words")}
                </span>
              </div>
            )}
            <div className="grammar-card vocab-card">
              <div className="vocab-top">
                <div className="vocab-main">
                  <button
                    type="button"
                    className="vocab-word-btn"
                    aria-label={t("learn.listenPronunciation", {
                      text: word,
                      reading,
                    })}
                    onClick={(e) => speak(word, e.currentTarget)}
                  >
                    <span className="vocab-word-stack">
                      {kanjiWord && (
                        <span className="vocab-kanji">{kanjiWord}</span>
                      )}
                      <span className="grammar-pattern vocab-word">{word}</span>
                    </span>
                    <span className="cell-audio-icon">🔊</span>
                  </button>
                  <span className="vocab-reading">{reading}</span>
                  <span className="grammar-meaning">{tf(meaning)}</span>
                </div>
                {usage && (
                  <div className="vocab-usage">
                    <span className="vocab-usage-label">
                      {t("learn.usageNote")}
                    </span>
                    <p className="vocab-usage-text">{tf(usage)}</p>
                  </div>
                )}
              </div>

              {example && (
                <div className="vocab-example-block">
                  <div className="grammar-example-row">
                    <div className="vocab-example-stack">
                      {kanjiExample && kanjiExample !== example && (
                        <span className="vocab-example-kanji">
                          {kanjiExample}
                        </span>
                      )}
                      <span className="grammar-example">{example}</span>
                    </div>
                    <button
                      type="button"
                      className="speak-btn"
                      aria-label={t("learn.listenExample")}
                      onClick={(e) => speak(example, e.currentTarget)}
                    >
                      🔊
                    </button>
                  </div>
                  <div className="grammar-segments">
                    {segments &&
                      segments.map((seg: any, sIdx: number) => (
                        <button
                          key={sIdx}
                          type="button"
                          className="segment-chip"
                          aria-label={t("learn.listenSegment", {
                            seg: seg[0],
                            rom: seg[1],
                          })}
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
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export default memo(VocabList);
