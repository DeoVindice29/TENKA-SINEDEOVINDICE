import { useMemo } from "react";
import { useLang } from "@/i18n/LangContext";
import { useQuiz } from "@/state/QuizContext";
import { SCRIPTS } from "@/data/scripts";
import { getRandomChibiAvatar } from "@/lib/chibiAvatar";

type ExtraItemKind = "romaji" | "kanji" | "note" | "meaning" | "generic";

interface ExtraItem {
  kind: ExtraItemKind;
  label: string;
  value: string;
}

export default function Feedback() {
  const { t } = useLang();
  const { state, dispatch } = useQuiz();

  // avatar chibi stabil selama satu soal (nggak ganti tiap re-render) —
  // begitu koleksi ekspresinya nambah di src/assets/chibi/, ini otomatis
  // ikut ke-random dari situ.
  const chibiSrc = useMemo(
    () => getRandomChibiAvatar(state.index),
    [state.index],
  );

  if (!state.answered) {
    return <div className="feedback-row" />;
  }

  const current = state.queue[state.index];
  if (!current) return null;

  const isLast = state.index === state.queue.length - 1;
  const isTimeout = state.lastChosen === "__TIMEOUT__";
  const conquestFailed = state.conquest && state.conquestFailed;
  const speedrunFailed = state.speedrun && state.speedrunFailed;

  let feedbackMsg: string;
  if (isTimeout) {
    feedbackMsg = t("quiz.timeUpAnswerWas", { answer: current[1] });
  } else if (state.lastCorrect) {
    feedbackMsg = t("quiz.correct");
  } else if (conquestFailed) {
    feedbackMsg = t("quiz.failedAnswerWas", { answer: current[1] });
  } else {
    feedbackMsg = t("quiz.missedAnswerWas", { answer: current[1] });
  }

  // ambil cuma bagian label dari template "Label: {value}" (mis. "Romaji: ")
  // tanpa perlu key terjemahan label-only terpisah — jadi tetap ikut bahasa
  // aktif (en/id) apa adanya.
  const labelOnly = (key: string) =>
    t(key, { value: "" }).replace(/[:：]\s*$/, "");

  const extraValue = current[3];
  const type = current[2];
  const extraItems: ExtraItem[] = [];

  if (extraValue) {
    // label info tambahan per tipe soal yang didefinisikan script-nya
    // (Bunpō: "meaning" → contoh kalimat, "kalimat" → fungsi pola)
    const scriptCfg = state.script
      ? (SCRIPTS[state.script as keyof typeof SCRIPTS] as unknown as {
          extraLabelKeys?: Record<string, string>;
        })
      : undefined;
    const scriptLabelKey = scriptCfg?.extraLabelKeys?.[type];

    if (current[4]) {
      // soal Penaklukan ala JLPT: key label ikut dibawa di soalnya
      extraItems.push({
        kind: "generic",
        label: labelOnly(current[4]),
        value: extraValue,
      });
    } else if (scriptLabelKey) {
      extraItems.push({
        kind: "generic",
        label: labelOnly(scriptLabelKey),
        value: extraValue,
      });
    } else if (type === "romaji") {
      extraItems.push({
        kind: "meaning",
        label: labelOnly("quiz.meaningLabel"),
        value: extraValue,
      });
    } else if (type === "meaning") {
      extraItems.push({
        kind: "romaji",
        label: labelOnly("quiz.romajiLabel"),
        value: extraValue,
      });
    }
  }

  // Info tambahan lain di luar item di atas — khusus soal Kotoba biasa
  // (meaning/romaji, bukan kalimat Penaklukan/Latihan): kalau katanya punya
  // bentuk kanji dan/atau catatan cara pakai, tampilkan juga sebagai baris
  // tersendiri di bawah, tepat kayak versi vanilla-nya.
  if (
    state.script === "kotoba" &&
    state.mode &&
    (type === "meaning" || type === "romaji")
  ) {
    const kotobaCfg = SCRIPTS.kotoba as unknown as {
      dataKanji?: Record<string, readonly (readonly string[])[]>;
      dataUsage?: Record<string, readonly (readonly string[])[]>;
    };
    const kanjiPool = kotobaCfg.dataKanji?.[state.mode];
    const usagePool = kotobaCfg.dataUsage?.[state.mode];
    const kanjiForm = kanjiPool?.find((r) => r[0] === current[0])?.[1];
    const usageNote = usagePool?.find((r) => r[0] === current[0])?.[1];
    if (kanjiForm) {
      extraItems.push({
        kind: "kanji",
        label: labelOnly("quiz.kanjiLabel"),
        value: kanjiForm,
      });
    }
    if (usageNote) {
      extraItems.push({
        kind: "note",
        label: labelOnly("quiz.usageNote"),
        value: usageNote,
      });
    }
  }
  // Bunpō biasa (meaning/kalimat, bukan Penaklukan/Latihan): tambahin arti
  // kalimat contohnya juga, di bawah item pertama (Kalimat/Fungsi). Kuncinya
  // selalu pola-nya sendiri — utk tipe "meaning" pola ada di current[0], utk
  // tipe "kalimat" pola-nya adalah jawaban benarnya (current[1]).
  if (
    state.script === "bunpo" &&
    state.mode &&
    (type === "meaning" || type === "kalimat")
  ) {
    const bunpoCfg = SCRIPTS.bunpo as unknown as {
      dataTranslation?: Record<string, readonly (readonly string[])[]>;
      dataNote?: Record<string, readonly (readonly string[])[]>;
    };
    const translationPool = bunpoCfg.dataTranslation?.[state.mode];
    const notePool = bunpoCfg.dataNote?.[state.mode];
    const patternKey = type === "meaning" ? current[0] : current[1];
    const translation = translationPool?.find(
      (r) => r[0] === patternKey,
    )?.[1];
    const usageNote = notePool?.find((r) => r[0] === patternKey)?.[1];
    if (translation) {
      extraItems.push({
        kind: "meaning",
        label: labelOnly("quiz.translationLabel"),
        value: translation,
      });
    }
    if (usageNote) {
      extraItems.push({
        kind: "note",
        label: labelOnly("quiz.usageNote"),
        value: usageNote,
      });
    }
  }

  const handleNext = () => {
    if (conquestFailed || speedrunFailed) {
      dispatch({ type: "FAIL_QUIZ" });
    } else {
      dispatch({ type: "NEXT_QUESTION" });
    }
  };

  return (
    <div className="feedback-row">
      <div
        className={`feedback-pill ${state.lastCorrect ? "correct" : "wrong"}`}
      >
        <span className="feedback-pill-badge" aria-hidden="true">
          {state.lastCorrect ? (
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span>{feedbackMsg}</span>
      </div>

      {extraItems.length > 0 && (
        <div className="quiz-note-card">
          <span className="quiz-note-sparkle" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c.6 2.8 1.6 3.8 4 4-2.4.6-3.4 1.6-4 4-.6-2.4-1.6-3.4-4-4 2.4-.2 3.4-1.2 4-4Z" />
              <path d="M20 13c.3 1.4.8 1.9 2 2-1.2.3-1.7.8-2 2-.3-1.2-.8-1.7-2-2 1.2-.1 1.7-.6 2-2Z" />
            </svg>
          </span>

          <div className="quiz-note-avatar" aria-hidden="true">
            {chibiSrc ? (
              <img src={chibiSrc} alt="" />
            ) : (
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="var(--indigo)" />
                <circle cx="24" cy="26" r="13" fill="#fff" opacity="0.95" />
                <circle cx="19" cy="25" r="1.8" fill="var(--indigo-deep)" />
                <circle cx="29" cy="25" r="1.8" fill="var(--indigo-deep)" />
                <path
                  d="M19 31c1.6 1.4 8.4 1.4 10 0"
                  stroke="var(--indigo-deep)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M11 20c1-6 6-10 13-10s12 4 13 10"
                  fill="var(--indigo)"
                />
              </svg>
            )}
          </div>

          <div className="quiz-note-body">
            {extraItems.map((item, i) => (
              <div key={i} className={`quiz-note-row quiz-note-row-${item.kind}`}>
                <span className="quiz-note-key">
                  <span className="quiz-note-icon" aria-hidden="true">
                    {item.kind === "kanji" ? (
                      <span className="quiz-note-icon-glyph">字</span>
                    ) : item.kind === "note" ? (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 18h6M10 21h4M8 14a6 6 0 1 1 8 0c-.7.6-1 1.3-1 2.2V17H9v-.8c0-.9-.3-1.6-1-2.2Z"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 5.5C5.5 4.7 7.5 4.3 9 5v13.5c-1.5-.7-3.5-.3-5 .5v-13.5Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20 5.5C18.5 4.7 16.5 4.3 15 5v13.5c1.5-.7 3.5-.3 5 .5v-13.5Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="quiz-note-label">{item.label}</span>
                  <span className="quiz-note-colon">:</span>
                </span>
                <span className="quiz-note-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        id="btn-next"
        className="quiz-next-btn"
        type="button"
        // fokus otomatis ke Next supaya Enter/Space langsung lanjut. Di mode
        // ketik (hard) fokus dibiarkan di input biar keyboard HP tidak turun.
        autoFocus={state.difficulty !== "hard"}
        onClick={handleNext}
      >
        <span>
          {conquestFailed || speedrunFailed || isLast
            ? t("quiz.seeResults")
            : t("quiz.next")}
        </span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h13m0 0l-5-5m5 5l-5 5"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
