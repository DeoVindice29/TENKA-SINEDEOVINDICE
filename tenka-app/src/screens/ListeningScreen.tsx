import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { playSfx } from "@/lib/sfx";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useSpeech } from "@/hooks/useSpeech";
import type { Bilingual, KotobaEntry } from "@/data/types";
import { useSkillSource } from "@/hooks/useSkillSource";
import ContentSourceSwitch from "@/components/ContentSourceSwitch";
import SkillScopePicker from "@/components/SkillScopePicker";
import { LoadingState } from "@/components/ui/Loader";
import PageHero from "@/components/PageHero";
import ScrollTopButton from "@/components/ScrollTopButton";

// Latihan Listening — dengar suara Jepang (speechSynthesis, sama seperti
// tombol suara di Flashcard), lalu pilih artinya. Soal diambil acak dari bank
// Kotoba N5 bawaan app. Dua tipe:
//  - word     : dengar KATA  → pilih arti kata
//  - sentence : dengar KALIMAT contoh → pilih terjemahan kalimat
// Soal dikerjakan SATU-SATU (seperti kuis biasa): dengar → pilih jawaban
// bernomor 1–4 → langsung ketahuan benar/salah + teks aslinya → Lanjut.

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

function buildPool(
  entries: readonly KotobaEntry[],
  type: ListenType,
  lang: Lang,
): Raw[] {
  const out: Raw[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const audio = type === "word" ? e[0] : e[3];
    const text = tf(type === "word" ? e[2] : e[5], lang).trim();
    if (!audio || !text || seen.has(audio)) continue;
    seen.add(audio);
    out.push({ audio, text });
  }
  return out;
}

function buildQuestions(
  entries: readonly KotobaEntry[],
  type: ListenType,
  lang: Lang,
  count: number,
): Question[] {
  const pool = buildPool(entries, type, lang);
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

const HeadphoneIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
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

type Answered = { chosen: string; ok: boolean };

export default function ListeningScreen() {
  const { t, lang } = useLang();
  const { setSessionActive } = useUI();
  const { speak, supported, voiceStatus } = useSpeech();
  const src = useSkillSource("listening");

  const [type, setType] = useState<ListenType>("word");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [results, setResults] = useState<Answered[]>([]);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const playRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const sessionOpen = questions !== null;
  useEffect(() => {
    setSessionActive(sessionOpen);
    return () => setSessionActive(false);
  }, [sessionOpen, setSessionActive]);

  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };
  // hentikan suara saat keluar dari halaman / lembar soal
  useEffect(() => stopAudio, []);

  const totalAvailable = useMemo(
    () => buildPool(src.entries, type, lang).length,
    [src.entries, type, lang],
  );
  const activeCount = Math.min(count, totalAvailable);
  const countOptions = [
    ...COUNTS.filter((n) => n < totalAvailable),
    ...(totalAvailable > 0 ? [totalAvailable] : []),
  ];

  const start = useCallback(() => {
    stopAudio();
    setQuestions(buildQuestions(src.entries, type, lang, activeCount));
    setIndex(0);
    setChosen(null);
    setResults([]);
    setStreak(0);
    setDone(false);
  }, [src.entries, type, lang, activeCount]);

  const back = () => {
    stopAudio();
    setQuestions(null);
    setDone(false);
  };

  const current = questions?.[index];
  const answered = chosen !== null;

  // putar otomatis tiap ganti soal (dipicu klik Mulai/Lanjut, jadi lolos
  // blokir autoplay di HP)
  useEffect(() => {
    if (!current || done) return;
    const id = window.setTimeout(
      () => speak(current.audio, playRef.current),
      350,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, index, done]);

  const choose = useCallback(
    (opt: string) => {
      if (!current || chosen !== null) return;
      const ok = opt === current.answer;
      setChosen(opt);
      setResults((r) => {
        const next = [...r];
        next[index] = { chosen: opt, ok };
        return next;
      });
      setStreak((s) => (ok ? s + 1 : 0));
      playSfx(ok ? "correct" : "wrong");
      // fokus ke Lanjut supaya Enter langsung maju
      window.setTimeout(() => nextRef.current?.focus({ preventScroll: true }), 60);
    },
    [current, chosen, index],
  );

  const goNext = useCallback(() => {
    if (!questions) return;
    stopAudio();
    setChosen(null);
    if (index + 1 >= questions.length) setDone(true);
    else setIndex(index + 1);
  }, [questions, index]);

  // pintasan keyboard: 1–4 jawab, Enter/Spasi lanjut, R putar ulang
  useEffect(() => {
    if (!questions || done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key >= "1" && e.key <= "4" && current) {
        const opt = current.choices[Number(e.key) - 1];
        if (opt !== undefined) {
          e.preventDefault();
          choose(opt);
        }
      } else if ((e.key === "Enter" || e.key === " ") && answered) {
        if (e.target === nextRef.current) return;
        e.preventDefault();
        goNext();
      } else if ((e.key === "r" || e.key === "R") && current) {
        speak(current.audio, playRef.current);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [questions, done, current, answered, choose, goNext, speak]);

  // ---------------- hasil akhir ----------------
  if (questions && done) {
    const total = questions.length;
    const score = results.filter((r) => r?.ok).length;
    const percent = total ? Math.round((score / total) * 100) : 0;
    const verdict =
      percent >= 90
        ? t("practice.sheet.verdictGreat")
        : percent >= 70
          ? t("practice.sheet.verdictGood")
          : t("practice.sheet.verdictTry");
    const wrong = questions
      .map((q, i) => ({ q, r: results[i], i }))
      .filter((x) => x.r && !x.r.ok);

    return (
      <section id="screen-listening" className="lq-screen">
        <div className="lq-wrap">
          <section className="lq-result" aria-live="polite">
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
            <h3>{verdict}</h3>
            <p>{t("practice.sheet.resultLine", { score, total, percent })}</p>
            <div className="lq-result-actions">
              <button type="button" className="primary" onClick={start}>
                {t("practice.sheet.retry")}
              </button>
              <button type="button" className="sp-ghost" onClick={back}>
                {t("practice.sheet.back")}
              </button>
            </div>
          </section>

          {wrong.length > 0 && (
            <section className="lq-review">
              <h4>{t("listening.reviewTitle", { count: wrong.length })}</h4>
              <ul>
                {wrong.map(({ q, r, i }) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="lq-review-play"
                      aria-label={t("listening.play")}
                      disabled={!supported}
                      onClick={(e) => speak(q.audio, e.currentTarget)}
                    >
                      <HeadphoneIcon />
                    </button>
                    <div>
                      <p className="kana lq-review-jp">{q.audio}</p>
                      <p className="lq-review-ans">
                        <span className="ok">✓ {q.answer}</span>
                        <span className="no">✕ {r.chosen}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <ScrollTopButton id="btn-listening-scrolltop" />
      </section>
    );
  }

  // ---------------- sesi kuis (satu soal per layar) ----------------
  if (questions && current) {
    const total = questions.length;
    const isLast = index + 1 >= total;
    const ok = answered && chosen === current.answer;
    return (
      <section id="screen-listening" className="lq-screen">
        <div className="lq-wrap">
          <div className="lq-top">
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
              <span className="lq-back-text">{t("practice.sheet.back")}</span>
            </button>
            <div className="lq-progress" role="status">
              <div className="lq-progress-track">
                <div
                  className="lq-progress-fill"
                  style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
                />
              </div>
              <span className="lq-progress-text">
                {index + 1} / {total}
              </span>
            </div>
            {streak >= 2 && (
              <span className="lq-streak" title={t("quiz.streak")}>
                🔥 {streak}
              </span>
            )}
          </div>

          <div className={`lq-card ${answered ? (ok ? "is-ok" : "is-bad") : ""}`}>
            <span className="lq-chip">{t(`listening.type.${type}`)}</span>

            <button
              ref={playRef}
              type="button"
              className="lq-play"
              disabled={!supported}
              onClick={(e) => speak(current.audio, e.currentTarget)}
              aria-label={t("listening.play")}
            >
              <span className="lq-play-ring" aria-hidden="true" />
              <HeadphoneIcon size={40} />
            </button>
            <p className="lq-hint">
              {answered ? t("listening.replay") : t("listening.hint")}
            </p>

            <div className="lq-choices" role="group">
              {current.choices.map((opt, k) => {
                const isAnswer = opt === current.answer;
                const isChosen = chosen === opt;
                let cls = "lq-choice";
                if (answered && isAnswer) cls += " correct";
                else if (answered && isChosen) cls += " wrong";
                else if (answered) cls += " dim";
                return (
                  <button
                    key={k}
                    type="button"
                    className={cls}
                    disabled={answered}
                    onClick={() => choose(opt)}
                  >
                    <span className="lq-choice-num" aria-hidden="true">
                      {k + 1}
                    </span>
                    <span className="lq-choice-text">{opt}</span>
                    {answered && isAnswer && (
                      <span className="lq-choice-mark ok" aria-hidden="true">
                        ✓
                      </span>
                    )}
                    {answered && isChosen && !isAnswer && (
                      <span className="lq-choice-mark no" aria-hidden="true">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className={`lq-feedback ${ok ? "ok" : "no"}`} aria-live="polite">
                <b>{ok ? t("quiz.correct") : t("listening.wrong")}</b>
                <p className="kana lq-transcript-jp">{current.audio}</p>
                {!ok && (
                  <p className="lq-transcript-mean">
                    {t("listening.answerWas", { answer: current.answer })}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={`lq-footer ${answered ? "show" : ""}`}>
            <button
              ref={nextRef}
              type="button"
              className="primary lq-next"
              disabled={!answered}
              onClick={goNext}
            >
              {isLast ? t("quiz.seeResults") : t("quiz.next")}
            </button>
          </div>
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

      <ContentSourceSwitch
        level={src.level}
        organize={src.organize}
        sources={src.sources}
        onLevelChange={src.setLevel}
        onOrganizeChange={src.setOrganize}
      />

      {src.status === "ready" && (
        <SkillScopePicker src={src} available={totalAvailable} />
      )}

      {src.status === "loading" && (
        <LoadingState
          label={t("source.loading", { level: src.level })}
          compact
        />
      )}
      {src.status === "error" && (
        <div className="learn-no-results">
          <p style={{ color: "#c0392b" }}>
            {t("source.loadError")}: {src.error}
          </p>
          <button type="button" className="source-retry" onClick={src.retry}>
            {t("source.retry")}
          </button>
        </div>
      )}
      {src.status === "empty" && (
        <p className="learn-no-results">
          {t("practice.noSource", { level: src.level })}
        </p>
      )}
      {src.status === "ready" && totalAvailable === 0 && (
        <p className="learn-no-results">
          {t("source.emptyKotoba", { level: src.level })}
        </p>
      )}

      {src.status === "ready" && totalAvailable > 0 && (
      <>
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
            {countOptions.map((n) => (
              <button
                key={n}
                type="button"
                className={`range-count-btn range-count-num ${
                  activeCount === n ? "active" : ""
                }`}
                onClick={() => setCount(n)}
              >
                {n === totalAvailable && !COUNTS.includes(n)
                  ? t("skill.countAll", { count: n })
                  : n}
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
      </>
      )}
    </section>
  );
}
