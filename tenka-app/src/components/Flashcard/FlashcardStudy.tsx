import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLang } from "@/i18n/LangContext";
import { useFlash } from "@/state/FlashContext";
import { useSpeech } from "@/hooks/useSpeech";
import { buildDeckCardDescriptors, type FlashDeckRef } from "@/data/flashDecks";
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

type SrsState = {
  ef: number;
  interval: number;
  reps: number;
  lapses: number;
};

function predictInterval(
  st: SrsState,
  rating: "again" | "hard" | "good" | "easy",
): number {
  const ef = st.ef || 2.5;
  const reps = st.reps || 0;
  const interval = st.interval || 0;

  if (rating === "again") return 10 / (60 * 24);
  if (rating === "hard") {
    if (reps === 0) return 6 / (60 * 24);
    return Math.max(1, Math.round(interval * 1.2));
  }
  if (rating === "good") {
    if (reps === 0) return 10 / (60 * 24);
    if (reps === 1) return 1;
    return Math.max(1, Math.round(interval * ef));
  }
  if (reps === 0) return 4;
  return Math.max(1, Math.round(interval * ef * 1.3));
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
  const { rateCard, getCardState } = useFlash();
  const { speak } = useSpeech();

  const allCards = useMemo(() => {
    return buildDeckCardDescriptors(deckRef);
  }, [deckRef]);

  const [queue, setQueue] = useState(() => {
    const now = Date.now();
    const due = allCards.filter((c) => {
      const st = getCardState(c.id);
      return !st.due || st.due <= now;
    });
    return shuffle(due.length > 0 ? due : allCards);
  });
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);
  const [done, setDone] = useState(false);

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
    if (!srs) return { again: "10m", hard: "10m", good: "10m", easy: "4d" };
    return {
      again: formatInterval(predictInterval(srs, "again")),
      hard: formatInterval(predictInterval(srs, "hard")),
      good: formatInterval(predictInterval(srs, "good")),
      easy: formatInterval(predictInterval(srs, "easy")),
    };
  }, [srs]);

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

  const handleRating = useCallback(
    (rating: "again" | "hard" | "good" | "easy") => {
      if (!current) return;
      rateCard(current.id, rating);
      setRatedCount((n) => n + 1);

      let nextQueue = queue;
      if (rating === "again") {
        nextQueue = [...queue];
        const reinsertAt = Math.min(nextQueue.length, idx + 4);
        nextQueue.splice(reinsertAt, 0, current);
        setQueue(nextQueue);
      }

      if (idx + 1 >= nextQueue.length) {
        setDone(true);
      } else {
        setIdx((i) => i + 1);
        setFlipped(false);
      }
    },
    [current, queue, idx, rateCard],
  );

  const handleRestart = () => {
    setQueue(shuffle(allCards));
    setIdx(0);
    setFlipped(false);
    setRatedCount(0);
    setDone(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;

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
  }, [flipped, done, handleRating]);

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
          <p className="flash-done-title">{t("flash.doneTitle")}</p>
          <p className="flash-done-sub">
            {t("flash.doneSub", { count: ratedCount, label: deckLabel })}
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
          {t("flash.progress", {
            current: idx + 1,
            total,
            label: deckLabel,
          })}
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
