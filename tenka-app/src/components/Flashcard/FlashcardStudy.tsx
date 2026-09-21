import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLang } from "@/i18n/LangContext";
import { useFlash } from "@/state/FlashContext";
import {
  classifyCard,
  isCardReady,
  type FlashRating,
} from "@/state/flashCategory";
import { LEARN_STEP_MINUTES, nextInterval } from "@/state/flashSchedule";
import { useSpeech } from "@/hooks/useSpeech";
import {
  buildDeckCardDescriptors,
  type FlashCardDescriptor,
  type FlashDeckRef,
} from "@/data/flashDecks";
import { KOTOBA_N5_CHAPTERS, KOTOBA_TIER_KEYS } from "@/data/kotobaN5";
import { KANJI_N5_CHAPTERS, KANJI_TIER_KEYS } from "@/data/kanjiN5";

type FlashcardStudyProps = {
  deckRef: FlashDeckRef;
  deckLabel: string;
  onBack: () => void;
};

type CardContent = {
  front: string;
  back: string;
  audioQueue: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Kartu yang lagi "ditahan" (Hard 1 menit / Good 5 menit) sebelum masuk lagi
// ke antrean Learn.
type WaitingCard = { card: FlashCardDescriptor; at: number };

// Sisipin kartu di posisi ACAK di sisa antrean (mulai dari index `base`).
function insertRandom<T>(arr: T[], item: T, base: number): T[] {
  const start = Math.min(Math.max(base, 0), arr.length);
  const pos = start + Math.floor(Math.random() * (arr.length - start + 1));
  const next = [...arr];
  next.splice(pos, 0, item);
  return next;
}

function tfLocal(
  entry: { en: string; id: string } | string | null | undefined,
  lang: "en" | "id" = "en",
): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return entry[lang] || entry.en || entry.id || "";
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

function formatInterval(days: number): string {
  if (days < 1 / 24) {
    const minutes = Math.round(days * 24 * 60);
    return `${minutes}m`;
  }
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

function getKotobaCard(
  tierKey: string,
  idx: number,
  lang: "en" | "id",
): CardContent {
  const ti = (KOTOBA_TIER_KEYS as readonly string[]).indexOf(tierKey);
  if (ti < 0) return { front: "", back: "", audioQueue: [] };
  const item = KOTOBA_N5_CHAPTERS[ti][idx];
  if (!item) return { front: "", back: "", audioQueue: [] };
  const [
    kana,
    romaji,
    meaning,
    example,
    segments,
    translation,
    kanji,
    exampleKanji,
    usage,
  ] = item;

  const exRomaji = (segments || []).map((s) => s[1]).join(" ");
  const showExKanji = exampleKanji && exampleKanji !== example;

  const front = kanji
    ? `<div class="fc-kanji-front">${escapeHtml(kanji)}</div><div class="fc-kana">${escapeHtml(kana)}</div>`
    : `<div class="fc-kana">${escapeHtml(kana)}</div>`;

  const back = `
    <div class="fc-kana fc-kana-sm" data-speak="${escapeHtml(kana)}">${escapeHtml(kana)}<span class="fc-audio-icon">🔊</span></div>
    <div class="fc-romaji">${escapeHtml(romaji)}</div>
    <hr>
    <div class="fc-meaning">${escapeHtml(tfLocal(meaning, lang))}</div>
    ${kanji ? `<div class="fc-kanji-form">${escapeHtml(kanji)}</div>` : ""}
    ${showExKanji ? `<div class="fc-example-kanji">${escapeHtml(exampleKanji)}</div>` : ""}
    ${example ? `<div class="fc-example" data-speak="${escapeHtml(example)}">${escapeHtml(example)}<span class="fc-audio-icon">🔊</span></div>` : ""}
    ${exRomaji ? `<div class="fc-example-sub">${escapeHtml(exRomaji)}</div>` : ""}
    ${translation ? `<div class="fc-translation">${escapeHtml(tfLocal(translation, lang))}</div>` : ""}
    ${
      usage
        ? `<div class="vocab-usage fc-usage">
            <span class="vocab-usage-label">Notes</span>
            <p class="vocab-usage-text">${escapeHtml(tfLocal(usage, lang))}</p>
          </div>`
        : ""
    }
  `;

  const audioQueue: string[] = [kana];
  if (example && example.trim()) {
    audioQueue.push(example);
  }

  return { front, back, audioQueue };
}

function getKanjiCard(
  tierKey: string,
  idx: number,
  lang: "en" | "id",
): CardContent {
  const ti = (KANJI_TIER_KEYS as readonly string[]).indexOf(tierKey);
  if (ti < 0) return { front: "", back: "", audioQueue: [] };
  const item = KANJI_N5_CHAPTERS[ti][idx];
  if (!item) return { front: "", back: "", audioQueue: [] };
  const [char, reading, meaning, kana] = item;

  const front = `<div class="fc-kanji-char">${char}</div>`;
  const back = `
    <div class="fc-kanji-char fc-kanji-char-sm">${char}</div>
    <hr>
    <div class="fc-reading">${reading}</div>
    ${kana ? `<div class="fc-kana-reading" data-speak="${kana}">${kana}<span class="fc-audio-icon">🔊</span></div>` : ""}
    <div class="fc-meaning">${tfLocal(meaning, lang)}</div>
  `;

  const audioQueue: string[] = [];
  if (kana && kana.trim()) audioQueue.push(kana);

  return { front, back, audioQueue };
}

function getCustomCard(deckId: string, idx: number): CardContent {
  try {
    const raw = localStorage.getItem("tebakAksara_flashCustomDecks_v1");
    const decks = raw ? JSON.parse(raw) : [];
    const deck = decks.find((d: { id: string }) => d.id === deckId);
    const card = deck?.cards[idx];
    if (!card) return { front: "", back: "", audioQueue: [] };
    return {
      front: `<div class="fc-custom-text">${escapeHtml(card.front)
        .split("\n")
        .join("<br>")}</div>`,
      back: `<div class="fc-custom-text">${escapeHtml(card.back)
        .split("\n")
        .join("<br>")}</div>`,
      audioQueue: [],
    };
  } catch {
    return { front: "", back: "", audioQueue: [] };
  }
}

function playAudioQueue(
  queue: string[],
  speakFn: (text: string) => void,
): () => void {
  if (!queue.length) return () => {};
  let cancelled = false;
  let timer: number | null = null;

  const playNext = (i: number) => {
    if (cancelled || i >= queue.length) return;
    speakFn(queue[i]);
    const estimatedMs = Math.max(2000, queue[i].length * 320 + 1500);
    timer = window.setTimeout(() => playNext(i + 1), estimatedMs);
  };

  playNext(0);

  return () => {
    cancelled = true;
    if (timer) window.clearTimeout(timer);
  };
}

export default function FlashcardStudy({
  deckRef,
  deckLabel,
  onBack,
}: FlashcardStudyProps) {
  const { t, lang } = useLang();
  const { rateCard, getCardState, reloadFlag } = useFlash();
  const { speak } = useSpeech();

  const allCards = useMemo(() => {
    return buildDeckCardDescriptors(deckRef);
  }, [deckRef]);

  const [queue, setQueue] = useState(() => {
    // Cuma kartu yang siap muncul (sama kayak angka di deck picker).
    // Kalau belum ada yang siap, antrean kosong -> langsung layar "selesai".
    const now = Date.now();
    return shuffle(allCards.filter((c) => isCardReady(getCardState(c.id), now)));
  });
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);
  const [done, setDone] = useState(queue.length === 0);
  // true kalau lagi "Ulangi Deck" (semua kartu, termasuk yang belum jatuh tempo)
  const [studyAhead, setStudyAhead] = useState(false);
  const [waiting, setWaiting] = useState<WaitingCard[]>([]);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const total = queue.length;
  const current = queue[idx];

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const content = useMemo(() => {
    if (!current) return { front: "", back: "", audioQueue: [] };
    if (current.kind === "kotoba")
      return getKotobaCard(current.tierKey || "", current.idx, lang);
    if (current.kind === "kanji")
      return getKanjiCard(current.tierKey || "", current.idx, lang);
    if (current.kind === "custom" && current.deckId)
      return getCustomCard(current.deckId, current.idx);
    return { front: "", back: "", audioQueue: [] };
  }, [current, lang]);

  const srs = current ? getCardState(current.id) : null;

  const intervals = useMemo(() => {
    const fmt = (d: number) => (d === 0 ? t("flash.intervalNow") : formatInterval(d));
    if (!srs)
      return { again: fmt(0), hard: "1m", good: "5m", easy: "1d" };
    return {
      again: fmt(nextInterval(srs, "again")),
      hard: fmt(nextInterval(srs, "hard")),
      good: fmt(nextInterval(srs, "good")),
      easy: fmt(nextInterval(srs, "easy")),
    };
  }, [srs, t]);

  // 3 angka sisa antrean: New (belum disentuh) + Learn (terakhir Again/Hard/
  // Good) + Due (terakhir Easy). Kartu yang lagi ditahan (Hard/Good) tetap
  // dihitung Learn karena masih harus dikerjain di sesi ini.
  const queueCounts = useMemo(() => {
    const remaining = [...queue.slice(idx), ...waiting.map((w) => w.card)];
    let fresh = 0;
    let learning = 0;
    let review = 0;
    remaining.forEach((c) => {
      const cat = classifyCard(getCardState(c.id));
      if (cat === "new") fresh++;
      else if (cat === "learn") learning++;
      else if (cat === "due") review++;
    });
    return { fresh, learning, review };
    // reloadFlag: kategori berubah tiap kartu dirating (state ada di localStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, idx, waiting, getCardState, reloadFlag]);

  // Reset scroll tiap ganti kartu
  useEffect(() => {
    if (frontRef.current) frontRef.current.scrollTop = 0;
    if (backRef.current) backRef.current.scrollTop = 0;
  }, [current?.id, flipped]);

  // Auto-speak queue waktu kartu di-flip ke BACK
  useEffect(() => {
    if (!flipped) return;
    if (!content.audioQueue.length) return;

    let cleanup: (() => void) | null = null;
    const startTimer = window.setTimeout(() => {
      cleanup = playAudioQueue(content.audioQueue, speak);
    }, 400);

    return () => {
      window.clearTimeout(startTimer);
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, current?.id]);

  // Lepas kartu yang udah selesai ditahan: masuk ke posisi ACAK di sisa antrean.
  useEffect(() => {
    if (done || waiting.length === 0) return;
    const tick = () => {
      const t0 = Date.now();
      setNowTs(t0);
      const ready = waiting.filter((w) => w.at <= t0);
      if (ready.length === 0) return;
      setWaiting((prev) => prev.filter((w) => w.at > t0));
      setQueue((prev) => {
        let next = prev;
        const base = idx < prev.length ? idx + 1 : prev.length;
        ready.forEach((w) => {
          if (next.slice(base).some((c) => c.id === w.card.id)) return;
          next = insertRandom(next, w.card, base);
        });
        return next;
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [waiting, idx, done, queue.length]);

  const skipWait = () => {
    if (waiting.length === 0) return;
    const first = waiting.reduce((a, b) => (a.at <= b.at ? a : b));
    setWaiting((prev) => prev.filter((w) => w !== first));
    setQueue((prev) =>
      insertRandom(prev, first.card, idx < prev.length ? idx + 1 : prev.length),
    );
  };

  const handleRating = useCallback(
    (rating: FlashRating) => {
      if (!current) return;
      rateCard(current.id, rating);
      setRatedCount((n) => n + 1);

      let nextQueue = queue;
      let nextWaiting = waiting;
      if (rating === "again") {
        // Again: langsung masuk antrean Learn, posisi acak
        nextQueue = insertRandom(queue, current, idx + 1);
        setQueue(nextQueue);
      } else if (rating === "hard" || rating === "good") {
        // Hard 1 menit / Good 5 menit dulu, baru masuk antrean Learn
        nextWaiting = [
          ...waiting,
          {
            card: current,
            at: Date.now() + LEARN_STEP_MINUTES[rating] * 60_000,
          },
        ];
        setWaiting(nextWaiting);
      }

      if (idx + 1 >= nextQueue.length && nextWaiting.length === 0) {
        setDone(true);
      } else {
        // kalau antrean habis tapi masih ada kartu ditahan -> layar "menunggu"
        setIdx((i) => i + 1);
        setFlipped(false);
      }
    },
    [current, queue, waiting, idx, rateCard],
  );

  const handleRestart = () => {
    setQueue(shuffle(allCards));
    setIdx(0);
    setFlipped(false);
    setRatedCount(0);
    setWaiting([]);
    setDone(allCards.length === 0);
    setStudyAhead(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || !current) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }

      if (flipped) {
        if (e.key === "1") handleRating("again");
        else if (e.key === "2") handleRating("hard");
        else if (e.key === "3") handleRating("good");
        else if (e.key === "4") handleRating("easy");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, done, current, handleRating]);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const speakEl = target.closest("[data-speak]") as HTMLElement | null;
    if (speakEl) {
      e.stopPropagation();
      const text = speakEl.getAttribute("data-speak");
      if (text) speak(text);
    }
  };

  if (done) {
    return (
      <>
        <div className="quiz-back-row">
          <button
            className="quiz-back"
            type="button"
            data-i18n="common.back"
            onClick={onBack}
          >
            {t("common.back")}
          </button>
          <button
            className="quiz-back"
            type="button"
            data-i18n="flash.restart"
            onClick={handleRestart}
          >
            {t("flash.restart")}
          </button>
        </div>
        <div className="flash-done">
          <p className="flash-done-title">
            {ratedCount === 0 ? t("flash.caughtUpTitle") : t("flash.doneTitle")}
          </p>
          <p className="flash-done-sub">
            {ratedCount === 0
              ? t("flash.caughtUpSub", { label: deckLabel })
              : t("flash.doneSub", { count: ratedCount, label: deckLabel })}
          </p>
          <button className="primary" type="button" onClick={handleRestart}>
            {t("flash.reviewAgain")}
          </button>
          <button
            className="ghost"
            type="button"
            data-i18n="flash.chooseAnother"
            onClick={onBack}
          >
            {t("flash.chooseAnother")}
          </button>
        </div>
      </>
    );
  }

  // Antrean habis tapi masih ada kartu yang ditahan (Hard/Good) -> nunggu
  if (!current) {
    const nextAt = waiting.length
      ? Math.min(...waiting.map((w) => w.at))
      : nowTs;
    const secs = Math.max(0, Math.ceil((nextAt - nowTs) / 1000));
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    return (
      <>
        <div className="quiz-back-row">
          <button className="quiz-back" type="button" onClick={onBack}>
            {t("common.back")}
          </button>
          <button className="quiz-back" type="button" onClick={handleRestart}>
            {t("flash.restart")}
          </button>
        </div>
        <div className="flash-done">
          <p className="flash-done-title">{t("flash.waitingTitle")}</p>
          <p className="flash-done-sub">{t("flash.waitingSub", { time })}</p>
          <button className="primary" type="button" onClick={skipWait}>
            {t("flash.waitingSkip")}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="quiz-back-row">
        <button
          className="quiz-back"
          type="button"
          data-i18n="common.back"
          onClick={onBack}
        >
          {t("common.back")}
        </button>
        <button
          className="quiz-back"
          type="button"
          data-i18n="flash.restart"
          onClick={handleRestart}
        >
          {t("flash.restart")}
        </button>
      </div>

      <div className="quiz-top">
        <div className="flash-progress">
          {t("flash.progressLabel", { label: deckLabel })}
        </div>
      </div>

      <div className="flashcard-stage">
        <div className="flashcard">
          <div
            className={`flashcard-inner ${flipped ? "flipped" : ""}`}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setFlipped((f) => !f);
              }
            }}
          >
            <div
              ref={frontRef}
              className="flashcard-face flashcard-front"
              dangerouslySetInnerHTML={{ __html: content.front }}
            />
            <div
              ref={backRef}
              className="flashcard-face flashcard-back"
              dangerouslySetInnerHTML={{ __html: content.back }}
            />
          </div>
        </div>
      </div>

      {studyAhead && (
        <p className="flash-study-ahead-note">{t("flash.studyAheadNote")}</p>
      )}

      <div className="flash-queue-counts">
        <span className="fqc-new">{queueCounts.fresh}</span>
        <span className="fqc-sep">+</span>
        <span className="fqc-learn">{queueCounts.learning}</span>
        <span className="fqc-sep">+</span>
        <span className="fqc-review">{queueCounts.review}</span>
      </div>

      {!flipped ? (
        <button
          className="flash-show-answer-btn"
          type="button"
          onClick={() => setFlipped(true)}
        >
          {t("flash.showAnswer")}
        </button>
      ) : (
        <div className="flash-rate-row">
          <button
            className="flash-rate-btn again"
            type="button"
            onClick={() => handleRating("again")}
          >
            <span className="fr-emoji" />
            <span>{t("flash.again")}</span>
            <span className="fr-interval">{intervals.again}</span>
          </button>
          <button
            className="flash-rate-btn hard"
            type="button"
            onClick={() => handleRating("hard")}
          >
            <span className="fr-emoji" />
            <span>{t("flash.hard")}</span>
            <span className="fr-interval">{intervals.hard}</span>
          </button>
          <button
            className="flash-rate-btn good"
            type="button"
            onClick={() => handleRating("good")}
          >
            <span className="fr-emoji" />
            <span>{t("flash.good")}</span>
            <span className="fr-interval">{intervals.good}</span>
          </button>
          <button
            className="flash-rate-btn easy"
            type="button"
            onClick={() => handleRating("easy")}
          >
            <span className="fr-emoji" />
            <span>{t("flash.easy")}</span>
            <span className="fr-interval">{intervals.easy}</span>
          </button>
        </div>
      )}
    </>
  );
}
