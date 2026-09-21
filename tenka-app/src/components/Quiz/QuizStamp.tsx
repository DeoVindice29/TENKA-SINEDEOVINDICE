import { useQuiz } from "@/state/QuizContext";
import { splitMarks, stripMarks } from "@/data/jlptConquest";

export default function QuizStamp() {
  const { state } = useQuiz();
  const current = state.queue[state.index];
  if (!current) return null;

  // soal Penaklukan ala JLPT bisa punya kata yang digarisbawahi (⟦ ⟧)
  const parts = splitMarks(current[0]);
  const text = stripMarks(current[0]);
  const isLong = text.length > 6;

  let style: React.CSSProperties | undefined = undefined;
  if (isLong) {
    const len = text.length;
    const size =
      len <= 3 ? 34 : len <= 5 ? 28 : len <= 7 ? 23 : len <= 10 ? 19 : 16;
    style = {
      fontSize: `clamp(${size - 8}px, ${(size * 0.26).toFixed(1)}vw, ${
        size + 6
      }px)`,
    };
  }

  return (
    <div className="stamp-wrap">
      {/* key = index soal → elemen di-mount ulang, animasi "stempel" main tiap soal */}
      <div
        key={state.index}
        className={`stamp pop ${isLong ? "long-text" : ""}`}
      >
        <span className="kana" style={style}>
          {parts.map((p, i) =>
            p.marked ? <u key={i}>{p.text}</u> : <span key={i}>{p.text}</span>,
          )}
        </span>
      </div>
    </div>
  );
}