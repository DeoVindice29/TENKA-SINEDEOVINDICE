import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useQuiz } from "@/state/QuizContext";

// Mode "hard": user mengetik sendiri jawabannya, tanpa pilihan ganda sama
// sekali — dipakai Mode Penaklukan & Speedrun utk aksara yang mendukungnya
// (Hiragana/Katakana). Lihat handleAnswer()/hardInputEl di file vanilla
// buat referensi perilaku aslinya (readOnly begitu dijawab, shake+warn
// kalau kosong, auto-submit pas Speedrun begitu ketikan match).
export default function HardInput() {
  const { t } = useLang();
  const { state, dispatch } = useQuiz();
  const current = state.queue[state.index];
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [warn, setWarn] = useState(false);
  const [shake, setShake] = useState(false);

  // Soal baru: reset input, hapus peringatan, & fokus lagi (biar keyboard
  // di HP tetap kebuka antar soal).
  useEffect(() => {
    setValue("");
    setWarn(false);
    setShake(false);
    inputRef.current?.focus();
  }, [state.index]);

  if (!current) return null;

  const correctAnswer = String(current[1]).trim().toLowerCase();
  const locked = state.answered;

  const submit = (raw: string) => {
    if (locked) return;
    if (raw.trim() === "") {
      setWarn(true);
      setShake(false);
      // restart animasi shake walau dipicu berkali-kali beruntun
      requestAnimationFrame(() => setShake(true));
      inputRef.current?.focus();
      return;
    }
    setWarn(false);
    dispatch({ type: "ANSWER", chosen: raw });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    if (warn) setWarn(false);
    // Speedrun: begitu ketikan sudah persis sama dengan jawaban benar,
    // langsung submit otomatis — tanpa perlu Enter/klik "Jawab".
    if (state.speedrun && !locked) {
      const typed = next.trim().toLowerCase();
      if (typed !== "" && typed === correctAnswer) {
        dispatch({ type: "ANSWER", chosen: next });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (locked) return;
      e.preventDefault();
      e.stopPropagation();
      submit(value);
    }
  };

  let inputClass = "hard-input";
  if (locked) inputClass += state.lastCorrect ? " correct" : " wrong";
  if (shake) inputClass += " shake-empty";

  return (
    <>
      {warn && (
        <div className="feedback-row">
          <div className="feedback-text warn">{t("quiz.fillAnswerFirst")}</div>
        </div>
      )}
      <div className="hard-input-row">
        <input
          ref={inputRef}
          type="text"
          className={inputClass}
          value={value}
          readOnly={locked}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t("quiz.typeRomajiPlaceholder")}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onAnimationEnd={() => setShake(false)}
        />
        <button
          type="button"
          className="primary"
          disabled={locked}
          onClick={() => submit(value)}
        >
          {t("quiz.answer")}
        </button>
      </div>
    </>
  );
}
