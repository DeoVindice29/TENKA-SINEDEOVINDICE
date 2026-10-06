import { useSpeech } from "@/hooks/useSpeech";

type GojuonTableProps = {
  rows: any[];
};

export default function GojuonTable({ rows }: GojuonTableProps) {
  const { speak } = useSpeech();

  return (
    <div className="kana-table">
      {rows.map((row: any, rowIdx: number) => (
        <div key={rowIdx} className={`kana-row cols-${row.cols}`}>
          <div className="kana-row-label">{row.label}</div>
          {row.chars.map((pair: any, cellIdx: number) => {
            if (!pair || pair.length < 2) {
              return <div key={cellIdx} className="kana-cell empty" />;
            }
            const kana = pair[0];
            const romaji = pair[1];
            return (
              <div
                key={cellIdx}
                className="kana-cell filled speakable"
                role="button"
                tabIndex={0}
                aria-label={`Listen to ${kana}, read ${romaji}`}
                onClick={(e) => speak(kana, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    speak(kana, e.currentTarget);
                  }
                }}
              >
                <span className="k">{kana}</span>
                <span className="r">{romaji}</span>
                <span className="cell-audio-icon">🔊</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
