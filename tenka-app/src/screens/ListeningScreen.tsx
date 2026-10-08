import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useSpeech } from "@/hooks/useSpeech";
import { KOTOBA_N5_LEARN } from "@/data/kotobaN5";
import type { Bilingual } from "@/data/types";
import PageHero from "@/components/PageHero";
import ScrollTopButton from "@/components/ScrollTopButton";

// Latihan Listening — dengar suara Jepang (speechSynthesis, sama seperti
// tombol suara di Flashcard), lalu pilih artinya. Soal diambil acak dari bank
// Kotoba N5 bawaan app. Dua tipe:
//  - word     : dengar KATA  → pilih arti kata
//  - sentence : dengar KALIMAT contoh → pilih terjemahan kalimat
// Tampilan lembar soal memakai kelas ps-* yang sama dengan Latihan Soal.

type ListenType = "word" | "sentence";
type Lang = "en" | "id";

type Question = {
  audio: string;
  answer: string;
  choices: string[];
};

const tf = (b: Bilingual | string | "" | undefined, lang: Lang): string => {
  if (!b) return "";
  if (typeof b === "string") return b;
  return b[lang] || b.en || b.id || "";
};

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Raw = { audio: string; text: string };

function buildPool(type: ListenType, lang: Lang): Raw[] {
  const out: Raw[] = [];
  const seen = new Set<string>();
  for (const section of KOTOBA_N5_LEARN) {
    for (const e of section.items) {
      const audio = type === "word" ? e[0] : e[3];
      const text = tf(type === "word" ? e[2] : e[5], lang).trim();
      if (!audio || !text || seen.has(audio)) continue;
      seen.add(audio);
      out.push({ audio, text });
    }
  }
  return out;
}

function buildQuestions(type: ListenType, lang: Lang, count: number): Question[] {
  const pool = buildPool(type, lang);
  const picked = shuffle(pool).slice(0, count);
  return picked.map((p) => {
    const distractors = shuffle(
      pool.filter((o) => o.text !== p.text),
    )
      .filter((o, i, arr) => arr.findIndex((x) => x.text === o.text) === i)
      .slice(0, 3)
      .map((o) => o.text);
    return {
      audio: p.audio,
      answer: p.text,
      choices: shuffle([p.text, ...distractors]),
    };
  });
}

const COUNTS = [10, 20, 30];

const HeadphoneIcon = () => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4" height="7" rx="1.5" />
    <rect x="17" y="14" width="4" height="7" rx="1.5" />
  </svg>
);

export default function ListeningScreen() {
  const { t, lang } = useLang();
  const { setSessionActive } = useUI();
  const { speak, supported, voiceStatus } = useSpeech();

  const [type, setType] = useState<ListenType>("word");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const sessionOpen = questions !== null;
  useEffect(() => {
    setSessionActive(sessionOpen);
    return () => setSessionActive(false);
  }, [sessionOpen, setSessionActive]);

  // hentikan suara saat keluar dari halaman / lembar soal
  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  const totalAvailable = useMemo(
    () => buildPool(type, lang).length,
    [type, lang],
  );
  const activeCount = Math.min(count, totalAvailable);

  const start = useCallback(() => {
    setQuestions(buildQuestions(type, lang, activeCount));
    setAnswers({});
    setSubmitted(false);
    setShowMissing(false);
  }, [type, lang, activeCount]);

  const back = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setQuestions(null);
  };

  if (questions) {
    const total = questions.length;
    const answeredCount = Object.keys(answers).length;
    const score = questions.filter((q, i) => answers[i] === q.answer).length;
    const percent = total ? Math.round((score / total) * 100) : 0;
    const verdict =
      percent >= 90
        ? t("practice.sheet.verdictGreat")
        : percent >= 70
          ? t("practice.sheet.verdictGood")
          : t("practice.sheet.verdictTry");

    const submit = () => {
      if (answeredCount < total) {
        setShowMissing(true);
        const firstMissing = questions.findIndex((_, i) => answers[i] === undefined);
        document
          .getElementById(`ls-q-${firstMissing}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setSubmitted(true);
      requestAnimationFrame(() =>
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    };

    return (
      <section id="screen-listening">
        <div className="ps-sheet" ref={topRef}>
          <div className="ps-topbar">
            <button type="button" className="ps-back" onClick={back}>
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

          <header className="ps-title-card">
            <div className="ps-title-accent" aria-hidden="true" />
            <div className="ps-title-body">
              <span className="ps-title-icon" aria-hidden="true">
                🎧
              </span>
              <div>
                <h2 className="ps-title">{t(`listening.type.${type}`)}</h2>
                <p className="ps-title-desc">{t(`listening.type.${type}Desc`)}</p>
                <p className="ps-title-meta">
                  {t("practice.sheet.meta", { count: total })}
                </p>
              </div>
            </div>
          </header>

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
                  <button type="button" className="primary" onClick={start}>
                    {t("practice.sheet.retry")}
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
            {questions.map((q, i) => {
              const chosen = answers[i];
              const ok = submitted && chosen === q.answer;
              const bad = submitted && !ok;
              const missing = showMissing && chosen === undefined;
              return (
                <li
                  key={i}
                  id={`ls-q-${i}`}
                  className={`ps-card ${ok ? "is-correct" : bad ? "is-wrong" : ""} ${
                    missing ? "is-missing" : ""
                  }`}
                >
                  <div className="ps-card-head">
                    <span className="ps-num">{i + 1}</span>
                    {!submitted && (
                      <span className="ps-req" aria-hidden="true">
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

                  <button
                    type="button"
                    className="ls-play"
                    disabled={!supported}
                    onClick={(e) => speak(q.audio, e.currentTarget)}
                  >
                    <HeadphoneIcon />
                    <span>{t("listening.play")}</span>
                  </button>
                  {submitted && (
                    <p className="ls-transcript kana">{q.audio}</p>
                  )}

                  <div className="ps-opts" role="radiogroup" aria-label={`${i + 1}`}>
                    {q.choices.map((opt, k) => {
                      const selected = chosen === opt;
                      const isAnswer = opt === q.answer;
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
                          onClick={() =>
                            setAnswers((a) => ({ ...a, [i]: opt }))
                          }
                        >
                          <span className="ps-radio" aria-hidden="true" />
                          <span className="ps-opt-text">{opt}</span>
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
        <ScrollTopButton id="btn-listening-scrolltop" />
      </section>
    );
  }

  return (
    <section id="screen-listening">
      <PageHero
        variant="practice"
        eyebrow={t("listening.eyebrow")}
        title={t("listening.title")}
        sub={t("listening.sub")}
      />

      {(!supported || voiceStatus === "missing") && (
        <p className="learn-no-results">{t("listening.noVoice")}</p>
      )}

      <div className="flash-section-label">{t("quiz.typeLabel")}</div>
      <div className="flash-deck-grid">
        {(["word", "sentence"] as ListenType[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={type === k}
            className={`flash-deck-card practice-type-card ${
              type === k ? "active" : ""
            }`}
            onClick={() => setType(k)}
          >
            <span className="flash-deck-glyph">{k === "word" ? "🔊" : "🗣️"}</span>
            <span className="flash-deck-info">
              <span className="flash-deck-name">{t(`listening.type.${k}`)}</span>
              <span className="flash-deck-count">{t(`listening.type.${k}Desc`)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="range-picker practice-count-picker">
        <span className="settings-label">{t("listening.countLabel")}</span>
        <div className="range-random">
          <div className="range-random-options">
            {COUNTS.filter((n) => n <= totalAvailable).map((n) => (
              <button
                key={n}
                type="button"
                className={`range-count-btn range-count-num ${
                  activeCount === n ? "active" : ""
                }`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className="primary"
        id="btn-start"
        type="button"
        disabled={!supported || activeCount === 0}
        onClick={start}
      >
        {t("practice.start", { count: activeCount })}
      </button>
    </section>
  );
}
