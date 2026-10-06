import {
  splitMarks,
  stripMarks,
  type PracticeTypeKey,
} from "@/data/jlptConquest";
import "@/styles/practice-sheet.css";

// Isi soal ala lembar ujian JLPT — dipakai bareng oleh Latihan Tipe Soal
// (PracticeSheet) dan Penaklukan (QuizStamp), jadi gayanya selalu sama:
// kata digarisbawahi, kotak kosong, kartu kalimat + perintah, chip pola 「…」.

const BLANK_RE = /(（＿＿＿）|\.{3,}|…+)/;
const IS_BLANK_RE = /^(（＿＿＿）|\.{3,}|…+)$/;

// Teks soal → potongan: kata bergaris bawah (⟦ ⟧), kotak kosong.
function renderQuestionText(text: string) {
  return splitMarks(text).map((part, i) => {
    if (part.marked) {
      return (
        <u key={i} className="ps-mark">
          {part.text}
        </u>
      );
    }
    return (
      <span key={i}>
        {part.text.split(BLANK_RE).map((seg, j) => {
          if (!seg) return null;
          if (IS_BLANK_RE.test(seg)) {
            return <span key={j} className="ps-blank" aria-label="blank" />;
          }
          return <span key={j}>{seg}</span>;
        })}
      </span>
    );
  });
}

export function QuestionBody({
  q,
  type,
}: {
  q: string;
  type: PracticeTypeKey;
}) {
  const plain = stripMarks(q);

  // 「学校へ行きます。」\n→ bentuk negatif yang benar adalah? → kalimat asal
  // jadi kartu, perintahnya di bawahnya
  if (type === "transform") {
    const [sentence, ...rest] = plain.split("\n");
    const instruction = rest.join(" ").trim();
    return (
      <div className="ps-q ps-q--transform kana">
        <span className="ps-transform-sentence">{sentence}</span>
        {instruction && (
          <span className="ps-transform-instruction">{instruction}</span>
        )}
      </div>
    );
  }

  // 「〜ながら」を つかう ぶんは どれですか。 → pola jadi label menonjol
  if (type === "usage") {
    const m = plain.match(/^「(.+?)」\s*(.*)$/);
    if (m) {
      return (
        <div className="ps-q ps-q--usage kana">
          <span className="ps-usage-chip">{m[1]}</span>
          <span className="ps-usage-rest">{m[2]}</span>
        </div>
      );
    }
  }

  // satu kanji / satu pola / satu istilah pendek → tampil besar di tengah
  const hasMarks = q !== plain;
  const hasBlank = BLANK_RE.test(plain);
  const isTerm = !hasMarks && !hasBlank && plain.length <= 8 && !/[。、]/.test(plain);
  if (isTerm) {
    return (
      <div className="ps-q ps-q--term kana">
        <span>{plain}</span>
      </div>
    );
  }

  return (
    <div className="ps-q ps-q--sentence kana">{renderQuestionText(q)}</div>
  );
}

export default QuestionBody;
