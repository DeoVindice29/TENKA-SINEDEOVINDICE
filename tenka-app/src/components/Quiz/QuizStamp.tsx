import { useQuiz } from "@/state/QuizContext";

export default function QuizStamp() {
  const { state } = useQuiz();
  const current = state.queue[state.index];
  if (!current) return null;

  const text = current[0];
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
      <div className={`stamp ${isLong ? "long-text" : ""}`}>
        <span className="kana" style={style}>
          {text}
        </span>
      </div>
    </div>
  );
}