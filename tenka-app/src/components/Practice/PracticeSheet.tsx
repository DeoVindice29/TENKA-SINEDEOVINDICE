import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/i18n/LangContext";
import {
  buildPracticeMode,
  practiceTypeKeyOfQueueType,
  PRACTICE_MIXED,
  stripMarks,
  type JlptQueueItem,
  type JlptScriptKey,
  type PracticeModeKey,
  type PracticeTypeKey,
} from "@/data/jlptConquest";
import QuestionBody from "@/components/Quiz/QuestionBody";
import { logActivity } from "@/lib/activityLog";
import { appendStudyLog } from "@/state/flashStats";
import { pickFromPool } from "@/lib/soalPractice";
import "@/styles/practice-sheet.css";

// Latihan Tipe Soal versi "lembar soal" — semua soal tampil sekaligus dan
// di-scroll ke bawah (kayak Google Form), bukan satu-satu. Soalnya tetap dari
// generator yang sama dengan Penaklukan (buildPractice); yang beda cuma cara
// tampilnya: tiap tipe soal punya gaya kartunya sendiri (kata digarisbawahi,
// kotak kosong, kartu kalimat + perintah, dst.).

type Props = {
  script: JlptScriptKey;
  type: PracticeModeKey;
  icon: string;
  count: number;
  /**
   * Kumpulan soal dari Supabase (Category pilihan user). Kalau diisi, soal
   * diambil acak dari sini; kalau kosong, soal dibuat generator bawaan (Topic).
   */
  pool?: JlptQueueItem[];
  /** balik ke layar pengaturan latihan */
  onBack: () => void;
};

const normalize = (s: string) => String(s).trim().toLowerCase();

export default function PracticeSheet({
  script,
  type,
  icon,
  count,
  pool,
  onBack,
}: Props) {
  const { t } = useLang();
  const [round, setRound] = useState(0);
  // soal dibangun sekali per ronde; "Ulangi" = ronde baru = soal acak baru
  const items = useMemo<JlptQueueItem[]>(
    () =>
      pool
        ? pickFromPool(pool, type, count)
        : buildPracticeMode(script, type, count),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [script, type, count, round],
  );

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const answeredCount = Object.keys(answers).length;
  const total = items.length;
  const isRight = (i: number) =>
    answers[i] !== undefined && normalize(answers[i]) === normalize(items[i][1]);
  const score = submitted ? items.filter((_, i) => isRight(i)).length : 0;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  const labelOnly = (key: string) =>
    t(key, { value: "" }).replace(/[:：]\s*$/, "");

  const pick = (i: number, opt: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [i]: opt }));
  };

  const scrollToCard = (i: number) => {
    document
      .getElementById(`ps-q-${i}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submit = () => {
    if (submitted) return;
    // kayak Google Form soal wajib: ada yang kosong → lompat ke soal itu
    const firstEmpty = items.findIndex((_, i) => answers[i] === undefined);
    if (firstEmpty !== -1) {
      setShowMissing(true);
      scrollToCard(firstEmpty);
      return;
    }

    // catat ke statistik, sama seperti jawaban di kuis biasa
    items.forEach((item, i) => {
      const ok = normalize(answers[i]) === normalize(item[1]);
      appendStudyLog(
        "quiz",
        `quiz:${script}:${stripMarks(item[0])}`,
        ok ? "good" : "again",
        Date.now(),
        stripMarks(item[0]),
      );
      logActivity({
        kind: "answer",
        script,
        item: stripMarks(item[0]),
        hint: item[1],
        correct: ok,
      });
    });
    logActivity({ kind: "practice_session", script });

    setSubmitted(true);
    setShowMissing(false);
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const retry = () => {
    setRound((r) => r + 1);
    setAnswers({});
    setSubmitted(false);
    setShowMissing(false);
    setOnlyWrong(false);
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const isMixed = type === PRACTICE_MIXED;
  const typeName = isMixed
    ? t("practice.mixed")
    : t(`practice.${script}.${type}`);
  const typeDesc = isMixed
    ? t("practice.mixedDesc")
    : t(`practice.${script}.${type}Desc`);
  const verdict =
    percent >= 90
      ? t("practice.sheet.verdictGreat")
      : percent >= 70
        ? t("practice.sheet.verdictGood")
        : t("practice.sheet.verdictTry");

  return (
    <div className="ps-sheet" ref={topRef}>
      <div className="ps-topbar">
        <button type="button" className="ps-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("practice.sheet.back")}
        </button>
      </div>

      {/* kartu judul ala Google Form */}
      <header className="ps-title-card">
        <div className="ps-title-accent" aria-hidden="true" />
        <div className="ps-title-body">
          <span className="ps-title-icon" aria-hidden="true">
            {icon}
          </span>
          <div>
            <h2 className="ps-title">{typeName}</h2>
            <p className="ps-title-desc">{typeDesc}</p>
            <p className="ps-title-meta">
              {t("practice.sheet.meta", { count: total })}
            </p>
          </div>
        </div>
      </header>

      {/* hasil — muncul di atas setelah dikirim */}
      {submitted && (
        <section className="ps-result" aria-live="polite">
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
            <h3>{verdict}</h3>
            <p>{t("practice.sheet.resultLine", { score, total, percent })}</p>
            <div className="ps-result-actions">
              <button type="button" className="primary" onClick={retry}>
                {t("practice.sheet.retry")}
              </button>
              {score < total && (
                <label className="ps-toggle">
                  <input
                    type="checkbox"
                    checked={onlyWrong}
                    onChange={(e) => setOnlyWrong(e.target.checked)}
                  />
                  <span>{t("practice.sheet.onlyWrong")}</span>
                </label>
              )}
            </div>
          </div>
        </section>
      )}

      {/* progres — nempel di atas selama scroll */}
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
          if (submitted && onlyWrong && ok) return null;
          const chosen = answers[i];
          const missing = showMissing && chosen === undefined;
          const choices = item[5] ?? [];
          // di mode Mixed tiap soal punya tipenya sendiri (dibaca dari queue)
          const itemType: PracticeTypeKey =
            practiceTypeKeyOfQueueType(item[2]) ??
            (isMixed ? "meaning" : (type as PracticeTypeKey));

          return (
            <li
              key={`${round}-${i}`}
              id={`ps-q-${i}`}
              className={`ps-card ps-type-${itemType} ${
                ok ? "is-correct" : bad ? "is-wrong" : ""
              } ${missing ? "is-missing" : ""}`}
            >
              <div className="ps-card-head">
                <span className="ps-num">{i + 1}</span>
                {isMixed && (
                  <span className="ps-type-chip">
                    {t(`practice.${script}.${itemType}`)}
                  </span>
                )}
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

              <QuestionBody
                q={item[0]}
                type={itemType}
              />

              <div
                className="ps-opts"
                role="radiogroup"
                aria-label={`${i + 1}`}
              >
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
                      <span className="kana">{item[3]}</span>
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
