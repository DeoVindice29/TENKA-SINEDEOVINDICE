import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/i18n/LangContext";
import { useQuiz } from "@/state/QuizContext";
import { useConquest } from "@/state/ConquestContext";
import { useAuth } from "@/state/AuthContext";
import { SCRIPTS } from "@/data/scripts";
import { getChibiAvatarByName } from "@/lib/chibiAvatar";
import { playSfx } from "@/lib/sfx";
import {
  JLPT_PASS_PERCENT,
  jlptPassMark,
  practiceTypeKeyOfQueueType,
  stripMarks,
} from "@/data/jlptConquest";
import QuestionBody from "@/components/Quiz/QuestionBody";
import "@/styles/practice-sheet.css";

// Penaklukan ala ujian JLPT, tampil seperti Latihan Tipe Soal: satu Tier =
// satu lembar soal (semua soal tier itu sekaligus, scroll ke bawah). Setelah
// "Kirim jawaban": benar >= 80% → tombol lanjut ke Tier berikutnya (layar
// cerita), kurang dari itu → gagal dan lihat hasil. Soalnya sama persis dengan
// yang dibangun buildJlptExam; yang beda cuma cara tampil & kapan dinilai.

const normalize = (s: string) => String(s).trim().toLowerCase();

export default function ConquestSheet() {
  const { t } = useLang();
  const { state, dispatch } = useQuiz();
  const { getStory } = useConquest();
  const { profile } = useAuth();
  const name = profile?.username?.trim() || t("results.defaultName");

  const b = state.conquestPhaseBoundaries ?? [0, state.queue.length];
  const phase = Math.min(state.conquestPhaseIndex, b.length - 2);
  const start = b[phase];
  const end = b[phase + 1];
  const tierCount = b.length - 1;
  const isLastTier = phase === tierCount - 1;

  const items = useMemo(
    () => state.queue.slice(start, end),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.runId, start, end],
  );
  const total = items.length;
  const need = jlptPassMark(total);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const story = getStory(state.script!);
  const phaseLabel = story?.phases[phase]?.label ?? "";
  const scriptKey = state.script as string;

  const isRight = (i: number) =>
    answers[i] !== undefined && normalize(answers[i]) === normalize(items[i][1]);
  const score = submitted ? items.filter((_, i) => isRight(i)).length : 0;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = submitted && score >= need;
  const answeredCount = Object.keys(answers).length;

  const scriptLabel = SCRIPTS[scriptKey as keyof typeof SCRIPTS]?.label ?? "";
  const chibiExpression = passed ? (isLastTier ? "proud" : "celebrate") : "sad";
  const chibiSrc =
    getChibiAvatarByName(chibiExpression) ??
    getChibiAvatarByName("happy") ??
    getChibiAvatarByName("cute");
  const chibiLine = passed
    ? isLastTier
      ? t("conquest.sheet.chibiPassLast", { name, label: scriptLabel })
      : t("conquest.sheet.chibiPass", { name })
    : t("conquest.sheet.chibiFail", { name });

  const labelOnly = (key: string) =>
    t(key, { value: "" }).replace(/[:：]\s*$/, "");

  const pick = (i: number, opt: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [i]: opt }));
  };

  const scrollToCard = (i: number) => {
    document
      .getElementById(`cs-q-${i}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submit = () => {
    if (submitted) return;
    const firstEmpty = items.findIndex((_, i) => answers[i] === undefined);
    if (firstEmpty !== -1) {
      setShowMissing(true);
      scrollToCard(firstEmpty);
      return;
    }
    const right = items.filter(
      (it, i) => normalize(answers[i]) === normalize(it[1]),
    ).length;
    playSfx(right >= need ? "roundClear" : "lose");
    setSubmitted(true);
    setShowMissing(false);
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // lulus → ke Tier berikutnya / hasil akhir; gagal → layar hasil (gagal)
  const proceed = () => {
    dispatch({
      type: "SUBMIT_TIER",
      answers: items.map((_, i) => answers[i] ?? ""),
    });
    window.scrollTo({ top: 0 });
  };

  const firstType = practiceTypeKeyOfQueueType(items[0]?.[2] ?? "") ?? "meaning";
  const typeDesc = t(`practice.${scriptKey}.${firstType}Desc`);

  return (
    <div className="ps-sheet cs-sheet" ref={topRef}>
      <header className="ps-title-card">
        <div className="ps-title-accent" aria-hidden="true" />
        <div className="ps-title-body">
          <span className="ps-title-icon" aria-hidden="true">
            ⚔️
          </span>
          <div>
            <h2 className="ps-title">{phaseLabel}</h2>
            <p className="ps-title-desc">{typeDesc}</p>
            <p className="ps-title-meta">
              {t("conquest.sheet.tierMeta", {
                count: total,
                need,
                percent: JLPT_PASS_PERCENT,
              })}
            </p>
          </div>
        </div>
      </header>

      {submitted && (
        <section
          className={`ps-result ${passed ? "is-pass" : "is-fail"}`}
          aria-live="polite"
        >
          <div
            className="ps-ring"
            style={{ "--pct": percent } as CSSProperties}
            role="img"
            aria-label={`${percent}%`}
          >
            <div className="ps-ring-inner">
              <b>{score}</b>
              <span>/ {total}</span>
            </div>
          </div>
          <div className="ps-result-text">
            <div className="cs-chibi-row">
              {chibiSrc && (
                <img
                  key={chibiExpression}
                  src={chibiSrc}
                  alt=""
                  aria-hidden="true"
                  className="cs-chibi-img"
                />
              )}
              <p className="cs-chibi-bubble">{chibiLine}</p>
            </div>
            <h3>
              {passed
                ? t("conquest.sheet.passTitle")
                : t("conquest.sheet.failTitle")}
            </h3>
            <p>{t("practice.sheet.resultLine", { score, total, percent })}</p>
            {!passed && (
              <p>{t("conquest.sheet.need", { need, total })}</p>
            )}
            <div className="ps-result-actions">
              <button type="button" className="primary" onClick={proceed}>
                {passed
                  ? isLastTier
                    ? t("conquest.sheet.passFinish")
                    : t("conquest.sheet.passNext")
                  : t("conquest.sheet.failSee")}
              </button>
            </div>
          </div>
        </section>
      )}

      {!submitted && (
        <div className="ps-progress" role="status">
          <div className="ps-progress-track">
            <div
              className="ps-progress-fill"
              style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
            />
          </div>
          <span className="ps-progress-text">
            {t("practice.sheet.progress", { done: answeredCount, total })}
          </span>
        </div>
      )}

      <ol className="ps-list">
        {items.map((item, i) => {
          const ok = submitted && isRight(i);
          const bad = submitted && !ok;
          const chosen = answers[i];
          const missing = showMissing && chosen === undefined;
          const choices = item[5] ?? [];
          const type = practiceTypeKeyOfQueueType(item[2]) ?? "meaning";

          return (
            <li
              key={`${state.runId}-${phase}-${i}`}
              id={`cs-q-${i}`}
              className={`ps-card ps-type-${type} ${
                ok ? "is-correct" : bad ? "is-wrong" : ""
              } ${missing ? "is-missing" : ""}`}
            >
              <div className="ps-card-head">
                <span className="ps-num">{i + 1}</span>
                {!submitted && (
                  <span
                    className="ps-req"
                    title={t("practice.sheet.required")}
                    aria-label={t("practice.sheet.required")}
                  >
                    *
                  </span>
                )}
                {submitted && (
                  <span className={`ps-verdict ${ok ? "ok" : "no"}`}>
                    {ok
                      ? t("practice.sheet.correct")
                      : t("practice.sheet.wrong")}
                  </span>
                )}
              </div>

              <QuestionBody q={item[0]} type={type} />

              <div className="ps-opts" role="radiogroup" aria-label={`${i + 1}`}>
                {choices.map((opt, k) => {
                  const selected = chosen === opt;
                  const isAnswer = normalize(opt) === normalize(item[1]);
                  let cls = "ps-opt";
                  if (selected) cls += " is-selected";
                  if (submitted && isAnswer) cls += " is-answer";
                  if (submitted && selected && !isAnswer) cls += " is-bad";
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={submitted}
                      className={cls}
                      onClick={() => pick(i, opt)}
                    >
                      <span className="ps-radio" aria-hidden="true" />
                      <span className="ps-opt-text kana">{opt}</span>
                      {submitted && isAnswer && (
                        <span className="ps-opt-mark ok" aria-hidden="true">
                          ✓
                        </span>
                      )}
                      {submitted && selected && !isAnswer && (
                        <span className="ps-opt-mark no" aria-hidden="true">
                          ✕
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {missing && (
                <p className="ps-missing" role="alert">
                  {t("practice.sheet.missing")}
                </p>
              )}

              {submitted && (
                <div className="ps-explain">
                  {bad && (
                    <p className="ps-explain-answer">
                      {t("practice.sheet.answerWas")}{" "}
                      <b className="kana">{item[1]}</b>
                    </p>
                  )}
                  {item[3] && (
                    <p className="ps-explain-extra">
                      <span className="ps-explain-label">
                        {item[4] ? labelOnly(item[4]) : ""}
                      </span>
                      <span className="kana">{stripMarks(item[3])}</span>
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!submitted && (
        <div className="ps-footer">
          <button type="button" className="primary" onClick={submit}>
            {t("practice.sheet.submit")}
          </button>
        </div>
      )}
    </div>
  );
}
