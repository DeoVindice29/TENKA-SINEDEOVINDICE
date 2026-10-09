import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useSpeech } from "@/hooks/useSpeech";
import type { Bilingual, KotobaEntry } from "@/data/types";
import { useSkillSource } from "@/hooks/useSkillSource";
import ContentSourceSwitch from "@/components/ContentSourceSwitch";
import { LoadingState } from "@/components/ui/Loader";
import PageHero from "@/components/PageHero";
import ScrollTopButton from "@/components/ScrollTopButton";

// Latihan Speaking — tampil teks Jepang (kata / kalimat contoh dari bank
// Kotoba N5), pengguna mengucapkannya lewat mikrofon. Suara dikenali dengan
// Web Speech API (SpeechRecognition, ja-JP) lalu dibandingkan dengan teks
// target (kana ATAU kanji) → skor kecocokan 0–100%. Satu soal per layar.

type SpeakType = "word" | "sentence";
type Lang = "en" | "id";

type Item = {
  kana: string; // teks yang dibacakan / dibandingkan
  kanji: string; // versi kanji (boleh kosong) — pengenal suara sering memberi kanji
  meaning: string;
};

// ---- minimal typing untuk Web Speech API (belum ada di lib.dom) ----
type RecAlt = { transcript: string };
type RecResult = { length: number; [i: number]: RecAlt };
type RecEvent = { results: { length: number; [i: number]: RecResult } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

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

function buildPool(
  entries: readonly KotobaEntry[],
  type: SpeakType,
  lang: Lang,
): Item[] {
  const out: Item[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const kana = type === "word" ? e[0] : e[3];
    const kanji = type === "word" ? e[6] : e[7];
    const meaning = tf(type === "word" ? e[2] : e[5], lang).trim();
    if (!kana || !meaning || seen.has(kana)) continue;
    seen.add(kana);
    out.push({ kana, kanji: kanji || "", meaning });
  }
  return out;
}

// ---- pencocokan ----
// buang spasi & tanda baca, samakan katakana → hiragana, huruf latin kecil
function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/[\s　。、！？!?,.\-ー〜~「」『』（）()]/g, "")
    .replace(/[ァ-ヶ]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60),
    )
    .toLowerCase();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

// skor terbaik dari semua alternatif hasil × (target kana, target kanji)
function bestScore(
  heard: string[],
  item: Item,
): { score: number; text: string; viaKana: boolean } {
  const targets = [
    { n: normalize(item.kana), kana: true },
    { n: normalize(item.kanji), kana: false },
  ].filter((x) => x.n);
  let best = { score: 0, text: heard[0] ?? "", viaKana: true };
  for (const h of heard) {
    const nh = normalize(h);
    for (const tg of targets) {
      const sc = similarity(nh, tg.n);
      if (sc > best.score) best = { score: sc, text: h, viaKana: tg.kana };
    }
  }
  return best;
}

// Tandai tiap huruf target: true = terdengar benar, false = terlewat/salah,
// null = tanda baca (tidak dinilai). Memakai LCS antara ucapan & target.
function markChars(target: string, heard: string): (boolean | null)[] {
  const chars = Array.from(target);
  const tn = chars.map((c) => normalize(c));
  const idx: number[] = []; // posisi huruf bermakna di `chars`
  const seq: string[] = [];
  tn.forEach((n, i) => {
    if (n) {
      idx.push(i);
      seq.push(n);
    }
  });
  const hs = Array.from(normalize(heard));
  const m = seq.length;
  const n = hs.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        seq[i] === hs[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: (boolean | null)[] = chars.map(() => null);
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (seq[i] === hs[j]) {
      out[idx[i]] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out[idx[i]] = false;
      i++;
    } else j++;
  }
  while (i < m) out[idx[i++]] = false;
  return out;
}

const GOOD = 0.8;
const ALMOST = 0.55;
const COUNTS = [5, 10, 20];

const MicIcon = ({ size = 26 }: { size?: number }) => (
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
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" />
  </svg>
);

const HeadphoneIcon = () => (
  <svg
    width={20}
    height={20}
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

type Attempt = { heard: string; score: number; viaKana: boolean } | null;

export default function SpeakingScreen() {
  const { t, lang } = useLang();
  const { setSessionActive } = useUI();
  const { speak, supported: ttsSupported } = useSpeech();
  const RecCtor = useMemo(() => getRecognitionCtor(), []);
  const src = useSkillSource("speaking");

  const [type, setType] = useState<SpeakType>("word");
  const [count, setCount] = useState(10);
  const [items, setItems] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState<Attempt>(null);
  const [scores, setScores] = useState<number[]>([]); // skor terbaik tiap soal
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<"" | "nothing" | "denied">("");
  const [done, setDone] = useState(false);
  const recRef = useRef<Recognition | null>(null);

  const sessionOpen = items !== null;
  useEffect(() => {
    setSessionActive(sessionOpen);
    return () => setSessionActive(false);
  }, [sessionOpen, setSessionActive]);

  const stopAll = useCallback(() => {
    try {
      recRef.current?.abort();
    } catch {
      // ignore
    }
    recRef.current = null;
    setRecording(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => stopAll, [stopAll]);

  const totalAvailable = useMemo(
    () => buildPool(src.entries, type, lang).length,
    [src.entries, type, lang],
  );
  const activeCount = Math.min(count, totalAvailable);

  const start = useCallback(() => {
    stopAll();
    setItems(shuffle(buildPool(src.entries, type, lang)).slice(0, activeCount));
    setIndex(0);
    setAttempt(null);
    setScores([]);
    setError("");
    setDone(false);
  }, [src.entries, type, lang, activeCount, stopAll]);

  const back = () => {
    stopAll();
    setItems(null);
  };

  const current = items?.[index];

  const toggleRecord = () => {
    if (!RecCtor || !current) return;
    if (recording) {
      recRef.current?.stop();
      return;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setError("");
    const rec = new RecCtor();
    rec.lang = "ja-JP";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    let gotResult = false;
    rec.onresult = (e) => {
      const heard: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        for (let k = 0; k < r.length; k++) heard.push(r[k].transcript);
      }
      if (!heard.length) return;
      gotResult = true;
      const { score, text, viaKana } = bestScore(heard, current);
      setAttempt({ heard: text, score, viaKana });
      setScores((prev) => {
        const next = [...prev];
        next[index] = Math.max(next[index] ?? 0, score);
        return next;
      });
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("denied");
      } else if (e.error === "no-speech") {
        setError("nothing");
      }
    };
    rec.onend = () => {
      setRecording(false);
      if (!gotResult) setError((prev) => prev || "nothing");
      recRef.current = null;
    };
    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const goNext = () => {
    if (!items) return;
    stopAll();
    setAttempt(null);
    setError("");
    if (index + 1 >= items.length) setDone(true);
    else setIndex(index + 1);
  };

  // ---------------- hasil akhir ----------------
  if (items && done) {
    const total = items.length;
    const good = items.filter((_, i) => (scores[i] ?? 0) >= GOOD).length;
    const avg = total
      ? Math.round(
          (items.reduce((sum, _, i) => sum + (scores[i] ?? 0), 0) / total) * 100,
        )
      : 0;
    const percent = total ? Math.round((good / total) * 100) : 0;
    return (
      <section id="screen-speaking" className="spk-screen">
        <div className="spk-wrap">
          <section className="lq-result" aria-live="polite">
            <div
              className="ps-ring"
              style={{ "--pct": percent } as CSSProperties}
              role="img"
              aria-label={`${percent}%`}
            >
              <div className="ps-ring-inner">
                <b>{good}</b>
                <span>/ {total}</span>
              </div>
            </div>
            <h3>{t("speaking.resultTitle")}</h3>
            <p>{t("speaking.resultLine", { good, total, avg })}</p>
            <div className="lq-result-actions">
              <button type="button" className="primary" onClick={start}>
                {t("speaking.again")}
              </button>
              <button type="button" className="sp-ghost" onClick={back}>
                {t("speaking.quit")}
              </button>
            </div>
          </section>

          <section className="lq-review spk-review">
            <h4>{t("speaking.reviewTitle")}</h4>
            <ul>
              {items.map((it, i) => {
                const sc = scores[i];
                const pctI = sc === undefined ? null : Math.round(sc * 100);
                const lvl =
                  sc === undefined
                    ? "skip"
                    : sc >= GOOD
                      ? "ok"
                      : sc >= ALMOST
                        ? "mid"
                        : "no";
                return (
                  <li key={i}>
                    <button
                      type="button"
                      className="lq-review-play"
                      aria-label={t("speaking.listen")}
                      disabled={!ttsSupported}
                      onClick={(e) => speak(it.kana, e.currentTarget)}
                    >
                      <HeadphoneIcon />
                    </button>
                    <div className="spk-review-main">
                      <p className="kana lq-review-jp">{it.kana}</p>
                      <p className="lq-review-mean">{it.meaning}</p>
                    </div>
                    <span className={`spk-badge ${lvl}`}>
                      {pctI === null ? t("speaking.skipped") : `${pctI}%`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
        <ScrollTopButton id="btn-speaking-scrolltop" />
      </section>
    );
  }

  // ---------------- sesi latihan ----------------
  if (items && current) {
    const total = items.length;
    const pct = attempt ? Math.round(attempt.score * 100) : 0;
    const state = !attempt
      ? ""
      : attempt.score >= GOOD
        ? "ok"
        : attempt.score >= ALMOST
          ? "mid"
          : "no";
    const isLast = index + 1 >= total;
    const targetChars = Array.from(current.kana);
    const marks =
      attempt && attempt.viaKana
        ? markChars(current.kana, attempt.heard)
        : attempt && attempt.score >= GOOD
          ? targetChars.map(() => true as boolean | null)
          : null;
    return (
      <section id="screen-speaking" className="spk-screen">
        <div className="spk-wrap">
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
                  style={{ width: `${(index / total) * 100}%` }}
                />
              </div>
              <span className="lq-progress-text">
                {t("speaking.progress", { done: index + 1, total })}
              </span>
            </div>
          </div>

          <div className={`spk-card ${state ? `is-${state}` : ""}`}>
            <span className="lq-chip">{t(`speaking.type.${type}`)}</span>

            <div className="spk-prompt">
              <p
                className={`spk-target kana ${
                  targetChars.length > 14 ? "is-long" : ""
                }`}
                aria-label={current.kana}
              >
                {targetChars.map((c, k) => (
                  <span
                    key={k}
                    className={
                      marks ? (marks[k] === true ? "hit" : marks[k] === false ? "miss" : "") : ""
                    }
                  >
                    {c}
                  </span>
                ))}
              </p>
              {current.kanji && current.kanji !== current.kana && (
                <p className="spk-kanji">{current.kanji}</p>
              )}
              <p className="spk-meaning">{current.meaning}</p>
              <button
                type="button"
                className="spk-listen"
                disabled={!ttsSupported}
                onClick={(e) => speak(current.kana, e.currentTarget)}
              >
                <svg
                  width={18}
                  height={18}
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
                <span>{t("speaking.listen")}</span>
              </button>
            </div>

            <div className="spk-mic-zone">
              <button
                type="button"
                className={`spk-mic ${recording ? "is-rec" : ""}`}
                onClick={toggleRecord}
                aria-pressed={recording}
                aria-label={recording ? t("speaking.listening") : t("speaking.record")}
              >
                <span className="spk-mic-ring" aria-hidden="true" />
                <MicIcon size={34} />
              </button>
              <p className="spk-mic-label">
                {recording
                  ? t("speaking.listening")
                  : attempt
                    ? t("speaking.recordAgain")
                    : t("speaking.record")}
              </p>
            </div>

            {error === "denied" && (
              <p className="spk-alert" role="alert">
                {t("speaking.micDenied")}
              </p>
            )}
            {error === "nothing" && !attempt && (
              <p className="spk-alert" role="alert">
                {t("speaking.nothing")}
              </p>
            )}

            {attempt && (
              <div className="spk-result" aria-live="polite">
                <div className="spk-meter">
                  <div className="spk-meter-bar">
                    <div
                      className="spk-meter-fill"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <b className="spk-meter-num">{pct}%</b>
                </div>
                <p className="spk-verdict">
                  {state === "ok"
                    ? t("speaking.passed")
                    : state === "mid"
                      ? t("speaking.almost")
                      : t("speaking.off")}
                </p>
                <p className="spk-heard">
                  <span>{t("speaking.heard")}</span>
                  <em>{attempt.heard}</em>
                </p>
              </div>
            )}
          </div>

          <div className="spk-footer">
            {attempt && attempt.score < GOOD && (
              <button
                type="button"
                className="sp-ghost"
                onClick={() => {
                  setAttempt(null);
                  setError("");
                }}
              >
                {t("speaking.retry")}
              </button>
            )}
            <button
              type="button"
              className={attempt ? "primary" : "sp-ghost"}
              onClick={goNext}
            >
              {attempt
                ? isLast
                  ? t("speaking.finish")
                  : t("speaking.next")
                : t("speaking.skip")}
            </button>
          </div>
        </div>
        <ScrollTopButton id="btn-speaking-scrolltop" />
      </section>
    );
  }

  // ---------------- menu awal ----------------
  return (
    <section id="screen-speaking">
      <PageHero
        variant="practice"
        eyebrow={t("speaking.eyebrow")}
        title={t("speaking.title")}
        sub={t("speaking.sub")}
      />

      {!RecCtor && <p className="learn-no-results">{t("speaking.unsupported")}</p>}

      <ContentSourceSwitch
        level={src.level}
        onLevelChange={src.setLevel}
        hideCategory
      />

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
        {(["word", "sentence"] as SpeakType[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={type === k}
            className={`flash-deck-card practice-type-card ${
              type === k ? "active" : ""
            }`}
            onClick={() => setType(k)}
          >
            <span className="flash-deck-glyph">{k === "word" ? "🎤" : "💬"}</span>
            <span className="flash-deck-info">
              <span className="flash-deck-name">{t(`speaking.type.${k}`)}</span>
              <span className="flash-deck-count">{t(`speaking.type.${k}Desc`)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="range-picker practice-count-picker">
        <span className="settings-label">{t("speaking.countLabel")}</span>
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
        disabled={!RecCtor || activeCount === 0}
        onClick={start}
      >
        {t("speaking.start", { count: activeCount })}
      </button>
      </>
      )}
    </section>
  );
}
