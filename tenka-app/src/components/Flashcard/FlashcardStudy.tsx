import {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import { useLang } from "@/i18n/LangContext";
import { useFlash } from "@/state/FlashContext";
import {
  classifyCard,
  isCardReady,
  type FlashCategory,
  type FlashRating,
} from "@/state/flashCategory";
import { LEARN_STEP_MINUTES, nextInterval } from "@/state/flashSchedule";
import { useSpeech } from "@/hooks/useSpeech";
import { useFlashAutoplay } from "@/hooks/useFlashAutoplay";
import AudioHelpNotice from "@/components/Audio/AudioHelpNotice";
import { playSfx } from "@/lib/sfx";
import {
  buildDeckCardDescriptors,
  type FlashCardDescriptor,
  type FlashDeckRef,
} from "@/data/flashDecks";
import { KOTOBA_N5_CHAPTERS, KOTOBA_TIER_KEYS } from "@/data/kotobaN5";
import { KANJI_N5_CHAPTERS, KANJI_TIER_KEYS } from "@/data/kanjiN5";
import type { KanjiEntry, KotobaEntry } from "@/data/types";
import type { DbCardEntry } from "@/lib/flashDbDecks";
import { loadDbDeckCards } from "@/lib/flashDbDecks";
import {
  MEDIA_MARKER_RE,
  MEDIA_STATE_EVENT,
  getMediaUrl,
  mediaQueueItem,
  parseMediaQueueItem,
  playMedia,
  stopMedia,
} from "@/lib/flashMedia";
import { LoadingState } from "@/components/ui/Loader";
import Button from "@/components/ui/Button";

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
  return renderKotobaItem(item, lang);
}

function renderKotobaItem(
  item: KotobaEntry,
  lang: "en" | "id",
): CardContent {
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
  return renderKanjiItem(item, lang);
}

function renderKanjiItem(item: KanjiEntry, lang: "en" | "id"): CardContent {
  const [rawChar, rawReading, meaning, rawKana] = item;
  // teks dari admin: di-escape supaya aman dipakai sebagai HTML
  const char = escapeHtml(rawChar);
  const reading = escapeHtml(rawReading);
  const kana = escapeHtml(rawKana);

  const front = `<div class="fc-kanji-char">${char}</div>`;
  const back = `
    <div class="fc-kanji-char fc-kanji-char-sm">${char}</div>
    <hr>
    <div class="fc-reading">${reading}</div>
    ${kana ? `<div class="fc-kana-reading" data-speak="${kana}">${kana}<span class="fc-audio-icon">🔊</span></div>` : ""}
    <div class="fc-meaning">${escapeHtml(tfLocal(meaning, lang))}</div>
  `;

  const audioQueue: string[] = [];
  if (rawKana && rawKana.trim()) audioQueue.push(rawKana);

  return { front, back, audioQueue };
}

function getDbCard(data: DbCardEntry, lang: "en" | "id"): CardContent {
  if (data.content === "kotoba") return renderKotobaItem(data.entry, lang);
  return renderKanjiItem(data.entry, lang);
}

// Teks kartu custom → HTML. Penanda [sound:x] jadi tombol 🔊 dan [img:x] jadi
// <img>; file aslinya diambil dari IndexedDB setelah kartu tampil (lihat efek
// "resolve media" di FlashcardStudySession).
function mediaHtml(escaped: string): string {
  return escaped.replace(
    MEDIA_MARKER_RE,
    (_m, kind: string, name: string) =>
      kind === "sound"
        ? `<button type="button" class="fc-media-audio" data-audio="${name}" aria-label="Play audio">🔊</button>`
        : `<img class="fc-media-img" data-media="${name}" alt="" />`,
  );
}

// Sisi depan: kata/kalimat pendek tampil BESAR (seperti deck bawaan), makin
// panjang teksnya makin kecil. Sisi belakang: tiap field (dipisah baris kosong)
// jadi blok sendiri — field pertama sebagai judul.
function renderCustomText(raw: string, side: "front" | "back"): string {
  if (side === "front") {
    const plain = raw.replace(MEDIA_MARKER_RE, "").trim();
    const len = Array.from(plain).length;
    const size = len <= 10 ? "xl" : len <= 20 ? "lg" : len <= 40 ? "md" : "sm";
    const html = mediaHtml(escapeHtml(raw)).split("\n").join("<br>");
    return `<div class="fc-custom-text fc-custom-front fc-size-${size}">${html}</div>`;
  }
  const blocks = raw
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b, i) => {
      const html = mediaHtml(escapeHtml(b)).split("\n").join("<br>");
      return `<div class="fc-custom-block${i === 0 ? " fc-custom-lead" : ""}">${html}</div>`;
    })
    .join("");
  return `<div class="fc-custom-text fc-custom-back">${blocks}</div>`;
}

function soundNames(raw: string): string[] {
  return Array.from(raw.matchAll(MEDIA_MARKER_RE))
    .filter((m) => m[1] === "sound")
    .map((m) => m[2]);
}

function getCustomCard(deckId: string, idx: number): CardContent {
  try {
    const raw = localStorage.getItem("tebakAksara_flashCustomDecks_v1");
    const decks = raw ? JSON.parse(raw) : [];
    const deck = decks.find((d: { id: string }) => d.id === deckId);
    const card = deck?.cards[idx];
    if (!card) return { front: "", back: "", audioQueue: [] };
    // autoplay saat kartu dibalik: audio di sisi belakang; kalau tidak ada,
    // pakai audio di sisi depan
    const sounds = soundNames(card.back).length
      ? soundNames(card.back)
      : soundNames(card.front);
    return {
      front: renderCustomText(card.front, "front"),
      back: renderCustomText(card.back, "back"),
      audioQueue: sounds.map((n) => mediaQueueItem(deckId, n)),
    };
  } catch {
    return { front: "", back: "", audioQueue: [] };
  }
}

// Teks utama kartu (kana / kanji besar) harus muat SATU baris: kalau kata
// terlalu panjang, font-size-nya diperkecil sampai pas selebar kartu (tidak
// pernah turun ke baris kedua). Kalimat contoh & arti tetap boleh membungkus.
const FIT_SELECTOR = ".fc-kana, .fc-kanji-front, .fc-kanji-char";
const FIT_MIN_PX = 12;

function fitOneLine(face: HTMLElement | null) {
  if (!face || face.clientWidth === 0) return;
  const cs = getComputedStyle(face);
  const avail =
    face.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (!(avail > 0)) return;
  face.querySelectorAll<HTMLElement>(FIT_SELECTOR).forEach((el) => {
    el.style.fontSize = ""; // balik ke ukuran dari CSS dulu
    let size = parseFloat(getComputedStyle(el).fontSize);
    for (let i = 0; i < 8 && el.scrollWidth > avail && size > FIT_MIN_PX; i++) {
      size = Math.max(
        FIT_MIN_PX,
        Math.floor(size * Math.min(0.97, avail / el.scrollWidth)),
      );
      el.style.fontSize = `${size}px`;
    }
  });
}

// Jeda antar audio dalam satu kartu (kata → contoh kalimat, dst.): 1 detik,
// dihitung dari saat suara sebelumnya BENAR-BENAR selesai.
const AUDIO_GAP_MS = 1000;

function playAudioQueue(
  queue: string[],
  speakFn: (
    text: string,
    btnEl?: HTMLElement | null,
    onEnd?: () => void,
  ) => void,
): () => void {
  if (!queue.length) return () => {};
  let cancelled = false;
  let gapTimer: number | null = null;
  let watchdog: number | null = null;

  const clearWatchdog = () => {
    if (watchdog) window.clearInterval(watchdog);
    watchdog = null;
  };

  const playNext = (i: number) => {
    if (cancelled || i >= queue.length) return;
    let advanced = false;
    const next = () => {
      if (advanced || cancelled) return;
      advanced = true;
      clearWatchdog();
      gapTimer = window.setTimeout(() => playNext(i + 1), AUDIO_GAP_MS);
    };

    // file audio dari deck hasil import (.apkg) → putar langsung, tanpa TTS
    const media = parseMediaQueueItem(queue[i]);
    if (media) {
      void playMedia(media.deckId, media.name, next);
      return;
    }

    speakFn(queue[i], null, next);

    // Cadangan kalau browser (sering di Android) tidak memanggil onend:
    // pantau status speechSynthesis. Begitu suara sempat mulai lalu berhenti,
    // langsung anggap selesai — tanpa menunggu timer perkiraan yang panjang.
    const synth =
      typeof window !== "undefined" && "speechSynthesis" in window
        ? window.speechSynthesis
        : null;
    const t0 = Date.now();
    let started = false;
    watchdog = window.setInterval(() => {
      if (advanced || cancelled) return clearWatchdog();
      const active = !!synth && (synth.speaking || synth.pending);
      if (active) started = true;
      const elapsed = Date.now() - t0;
      if (
        (started && !active && elapsed > 300) || // suara selesai
        (!started && elapsed > 2000) || // suara tak pernah mulai
        elapsed > 20000 // batas aman
      ) {
        next();
      }
    }, 150);
  };

  playNext(0);

  return () => {
    cancelled = true;
    clearWatchdog();
    if (gapTimer) window.clearTimeout(gapTimer);
    stopMedia();
  };
}

function FlashcardStudySession({
  deckRef,
  deckLabel,
  onBack,
}: FlashcardStudyProps) {
  const { t, lang } = useLang();
  const { rateCard, getCardState, reloadFlag } = useFlash();
  const {
    speak,
    supported: speechSupported,
    voiceStatus,
  } = useSpeech();
  const [autoplay, setAutoplay] = useFlashAutoplay();

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
  // rekap jawaban sesi ini (ditampilkan di layar selesai)
  const [tally, setTally] = useState<Record<FlashRating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [done, setDone] = useState(queue.length === 0);
  // true kalau lagi "Ulangi Deck" (semua kartu, termasuk yang belum jatuh tempo)
  const [studyAhead, setStudyAhead] = useState(false);
  const [waiting, setWaiting] = useState<WaitingCard[]>([]);
  const [nowTs, setNowTs] = useState(() => Date.now());
  // Kategori (Baru/Belajar/Ulang) tiap kartu DIBEKUKAN waktu mode "Ulangi Deck"
  // dimulai. Tanpa ini angka Belajar/Ulang ikut berubah tiap kartu dijawab
  // (dan loncat pas klik Ulangi Deck karena semua kartu ikut dihitung ulang).
  const [frozenCats, setFrozenCats] = useState<Record<string, FlashCategory>>({});

  const current = queue[idx];

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  // gambar kartu impor yang sedang diperbesar (blob URL), null = tertutup
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const content = useMemo(() => {
    if (!current) return { front: "", back: "", audioQueue: [] };
    if (current.kind === "kotoba")
      return getKotobaCard(current.tierKey || "", current.idx, lang);
    if (current.kind === "kanji")
      return getKanjiCard(current.tierKey || "", current.idx, lang);
    if (current.kind === "custom" && current.deckId)
      return getCustomCard(current.deckId, current.idx);
    if (current.kind === "db" && current.db) return getDbCard(current.db, lang);
    return { front: "", back: "", audioQueue: [] };
  }, [current, lang]);

  const srs = current ? getCardState(current.id) : null;

  // Kategori kartu yang sedang tampil (Baru / Belajar / Ulang) — dipakai untuk
  // menandai kartu di layar + menyorot hitungan yang sesuai.
  const currentCat: FlashCategory = !current
    ? "none"
    : studyAhead
      ? (frozenCats[current.id] ?? "new")
      : classifyCard(srs);

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
    // Mode Ulangi Deck: tiap kartu dihitung sekali (kartu yang dijawab Ulang
    // Lagi masuk antrean dua kali) dan pakai kategori yang dibekukan.
    const seen = new Set<string>();
    remaining.forEach((c) => {
      if (studyAhead) {
        if (seen.has(c.id)) return;
        seen.add(c.id);
      }
      const cat = studyAhead
        ? (frozenCats[c.id] ?? "new")
        : classifyCard(getCardState(c.id));
      if (cat === "new") fresh++;
      else if (cat === "learn") learning++;
      else if (cat === "due") review++;
    });
    return { fresh, learning, review };
    // reloadFlag: kategori berubah tiap kartu dirating (state ada di localStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, idx, waiting, getCardState, reloadFlag, studyAhead, frozenCats]);

  // Pas-kan teks utama kartu ke satu baris (lihat fitOneLine). Dijalankan ulang
  // saat kartu berganti, ukuran kartu berubah (rotasi/resize), dan font selesai
  // dimuat (lebar teks berubah setelah font Jepang siap).
  useLayoutEffect(() => {
    const run = () => {
      fitOneLine(frontRef.current);
      fitOneLine(backRef.current);
    };
    run();
    // sekali lagi di frame berikutnya: di HP ukuran kartu kadang baru final
    // setelah layout selesai (address bar / keyboard / rotasi layar)
    const raf = window.requestAnimationFrame(run);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(run) : null;
    if (ro) {
      if (frontRef.current) ro.observe(frontRef.current);
      if (backRef.current) ro.observe(backRef.current);
    }
    window.addEventListener("resize", run);
    window.addEventListener("orientationchange", run);
    void document.fonts?.ready.then(run);
    return () => {
      window.cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", run);
      window.removeEventListener("orientationchange", run);
    };
  }, [content.front, content.back]);

  // Reset scroll tiap ganti kartu
  useEffect(() => {
    if (frontRef.current) frontRef.current.scrollTop = 0;
    if (backRef.current) backRef.current.scrollTop = 0;
  }, [current?.id, flipped]);

  // Gambar kartu hasil import: isi src dari IndexedDB setelah kartu tampil.
  // Audio yang masih jalan dihentikan saat pindah kartu.
  useEffect(() => {
    if (current?.kind !== "custom" || !current.deckId) return;
    const deckId = current.deckId;
    let alive = true;
    [frontRef.current, backRef.current].forEach((root) => {
      root
        ?.querySelectorAll<HTMLImageElement>("img[data-media]")
        .forEach((img) => {
          const name = img.getAttribute("data-media");
          if (!name || img.getAttribute("src")) return;
          void getMediaUrl(deckId, name).then((url) => {
            if (alive && url) img.src = url;
          });
        });
    });
    return () => {
      alive = false;
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, content]);

  // Animasi tombol 🔊 selagi file audio kartu impor diputar (termasuk autoplay).
  useEffect(() => {
    const onState = (e: Event) => {
      const name = (e as CustomEvent<{ name: string | null }>).detail?.name;
      document.querySelectorAll<HTMLElement>(".fc-media-audio").forEach((el) => {
        el.classList.toggle("is-playing", name != null && el.dataset.audio === name);
      });
    };
    window.addEventListener(MEDIA_STATE_EVENT, onState);
    return () => window.removeEventListener(MEDIA_STATE_EVENT, onState);
  }, []);

  // Esc menutup gambar yang diperbesar
  useEffect(() => {
    if (!zoomSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomSrc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomSrc]);

  // Auto-speak queue waktu kartu di-flip ke BACK
  useEffect(() => {
    if (!flipped) return;
    if (!autoplay) return;
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
  }, [flipped, current?.id, autoplay]);

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
      // Mode Ulangi Deck = latihan: jawaban TIDAK mengubah jadwal / kategori
      // kartu, jadi angka Baru/Belajar/Ulang di daftar deck tidak ikut berubah.
      if (!studyAhead) rateCard(current.id, rating);
      setRatedCount((n) => n + 1);
      setTally((tl) => ({ ...tl, [rating]: tl[rating] + 1 }));
      playSfx(
        rating === "again"
          ? "rateAgain"
          : rating === "hard"
            ? "rateHard"
            : rating === "good"
              ? "rateGood"
              : "rateEasy",
      );

      let nextQueue = queue;
      let nextWaiting = waiting;
      if (rating === "again") {
        // Again: langsung masuk antrean Learn, posisi acak
        nextQueue = insertRandom(queue, current, idx + 1);
        setQueue(nextQueue);
      } else if (studyAhead) {
        // latihan: Hard/Good/Easy langsung lanjut, tanpa ditahan
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
    [current, queue, waiting, idx, rateCard, studyAhead],
  );

  // suara balik kartu (hanya saat jawaban dibuka) + suara deck selesai
  useEffect(() => {
    if (flipped) playSfx("flip");
  }, [flipped]);
  useEffect(() => {
    if (done && ratedCount > 0) {
      const to = window.setTimeout(() => playSfx("win"), 150);
      return () => window.clearTimeout(to);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const handleRestart = () => {
    const frozen: Record<string, FlashCategory> = {};
    allCards.forEach((c) => {
      frozen[c.id] = classifyCard(getCardState(c.id));
    });
    setFrozenCats(frozen);
    setQueue(shuffle(allCards));
    setIdx(0);
    setFlipped(false);
    setRatedCount(0);
    setTally({ again: 0, hard: 0, good: 0, easy: 0 });
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
    const audioEl = target.closest("[data-audio]") as HTMLElement | null;
    if (audioEl && current?.kind === "custom" && current.deckId) {
      e.stopPropagation();
      const name = audioEl.getAttribute("data-audio");
      if (name) void playMedia(current.deckId, name);
      return;
    }
    const imgEl = target.closest("img.fc-media-img") as HTMLImageElement | null;
    if (imgEl?.getAttribute("src")) {
      e.stopPropagation();
      setZoomSrc(imgEl.getAttribute("src"));
      return;
    }
    const speakEl = target.closest("[data-speak]") as HTMLElement | null;
    if (speakEl) {
      e.stopPropagation();
      const text = speakEl.getAttribute("data-speak");
      if (text) speak(text);
    }
  };

  if (done) {
    const nothingToReview = ratedCount === 0;
    const rateChips: { key: FlashRating; label: string }[] = [
      { key: "again", label: t("flash.again") },
      { key: "hard", label: t("flash.hard") },
      { key: "good", label: t("flash.good") },
      { key: "easy", label: t("flash.easy") },
    ];
    return (
      <>
        <div className="quiz-back-row flash-back-row">
          <button
            className="quiz-back flash-back-btn"
            type="button"
            data-i18n="common.back"
            onClick={onBack}
          >
            {t("common.back")}
          </button>
        </div>
        <div className="flash-done-wrap">
          <div className="flash-done" role="status">
            <span className="flash-done-badge" aria-hidden="true">
              {nothingToReview ? "☾" : "✓"}
            </span>
            <p className="flash-done-deck">{deckLabel}</p>
            <p className="flash-done-title">
              {nothingToReview
                ? t("flash.caughtUpTitle")
                : t("flash.doneTitle")}
            </p>
            {nothingToReview ? (
              <p className="flash-done-sub">
                {t("flash.caughtUpSub", { label: deckLabel })}
              </p>
            ) : (
              <>
                <div className="flash-done-total">
                  <span className="flash-done-total-num">{ratedCount}</span>
                  <span className="flash-done-total-label">
                    {t("flash.cards")}
                  </span>
                </div>
                <div className="flash-done-tally">
                  {rateChips.map((c) => (
                    <span
                      key={c.key}
                      className={`flash-done-chip flash-done-chip--${c.key}`}
                    >
                      <b>{tally[c.key]}</b>
                      <i>{c.label}</i>
                    </span>
                  ))}
                </div>
              </>
            )}
            <div className="flash-done-actions">
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
          </div>
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
        <div className="quiz-back-row flash-back-row">
          <button className="quiz-back flash-back-btn" type="button" onClick={onBack}>
            {t("common.back")}
          </button>
        </div>
        <div className="flash-done-wrap">
          <div className="flash-done flash-done--wait" role="status">
            <span className="flash-done-badge" aria-hidden="true">
              ⏳
            </span>
            <p className="flash-done-deck">{deckLabel}</p>
            <p className="flash-done-title">{t("flash.waitingTitle")}</p>
            <div className="flash-done-total">
              <span className="flash-done-total-num">{time}</span>
            </div>
            <p className="flash-done-sub">{t("flash.waitingSub", { time })}</p>
            <div className="flash-done-actions">
              <button className="primary" type="button" onClick={skipWait}>
                {t("flash.waitingSkip")}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="quiz-back-row flash-back-row">
        <button
          className="quiz-back flash-back-btn"
          type="button"
          data-i18n="common.back"
          onClick={onBack}
        >
          {t("common.back")}
        </button>
        {speechSupported && (
          <button
            className={`quiz-back flash-back-btn flash-autoplay-btn ${autoplay ? "on" : "off"}`}
            type="button"
            aria-pressed={autoplay}
            title={t("flash.autoplay")}
            onClick={() => setAutoplay(!autoplay)}
          >
            <span aria-hidden="true">{autoplay ? "🔊" : "🔇"}</span>
            <span>{t(autoplay ? "flash.autoplayOn" : "flash.autoplayOff")}</span>
          </button>
        )}
      </div>

      <AudioHelpNotice show={speechSupported && voiceStatus === "missing"} />

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
          {currentCat !== "none" && (
            <span className={`flash-cat-chip flash-cat-${currentCat}`}>
              {t(
                currentCat === "new"
                  ? "flash.new"
                  : currentCat === "learn"
                    ? "flash.learn"
                    : "flash.due",
              )}
            </span>
          )}
        </div>
      </div>

      {studyAhead && (
        <p className="flash-study-ahead-note">{t("flash.studyAheadNote")}</p>
      )}

      <div className="flash-queue-counts">
        <span className={`fqc-item ${currentCat === "new" ? "active" : ""}`}>
          <span className="fqc-num fqc-new">{queueCounts.fresh}</span>
          <span className="fqc-label">{t("flash.new")}</span>
        </span>
        <span className={`fqc-item ${currentCat === "learn" ? "active" : ""}`}>
          <span className="fqc-num fqc-learn">{queueCounts.learning}</span>
          <span className="fqc-label">{t("flash.learn")}</span>
        </span>
        <span className={`fqc-item ${currentCat === "due" ? "active" : ""}`}>
          <span className="fqc-num fqc-review">{queueCounts.review}</span>
          <span className="fqc-label">{t("flash.due")}</span>
        </span>
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
            {!studyAhead && <span className="fr-interval">{intervals.again}</span>}
          </button>
          <button
            className="flash-rate-btn hard"
            type="button"
            onClick={() => handleRating("hard")}
          >
            <span className="fr-emoji" />
            <span>{t("flash.hard")}</span>
            {!studyAhead && <span className="fr-interval">{intervals.hard}</span>}
          </button>
          <button
            className="flash-rate-btn good"
            type="button"
            onClick={() => handleRating("good")}
          >
            <span className="fr-emoji" />
            <span>{t("flash.good")}</span>
            {!studyAhead && <span className="fr-interval">{intervals.good}</span>}
          </button>
          <button
            className="flash-rate-btn easy"
            type="button"
            onClick={() => handleRating("easy")}
          >
            <span className="fr-emoji" />
            <span>{t("flash.easy")}</span>
            {!studyAhead && <span className="fr-interval">{intervals.easy}</span>}
          </button>
        </div>
      )}

      {zoomSrc && (
        <div
          className="fc-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomSrc(null)}
        >
          <img className="fc-lightbox-img" src={zoomSrc} alt="" />
          <button
            type="button"
            className="fc-lightbox-close"
            aria-label={t("aria.closeZoom")}
            onClick={() => setZoomSrc(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// Deck dari konten admin dimuat dulu dari Supabase (cache bareng layar Lessons),
// baru sesi belajarnya dibuka. Deck bawaan / impor langsung jalan seperti biasa.
export default function FlashcardStudy(props: FlashcardStudyProps) {
  const { t } = useLang();
  const ref = props.deckRef;
  const [state, setState] = useState<
    { status: "loading" } | { status: "ready" } | { status: "error"; error: string }
  >({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const isDb = ref.kind === "db";
  const dbKey =
    ref.kind === "db" ? `${ref.content}:${ref.level}:${ref.sourceId}` : "";

  useEffect(() => {
    if (ref.kind !== "db") return;
    let cancelled = false;
    setState({ status: "loading" });
    loadDbDeckCards(ref).then((res) => {
      if (cancelled) return;
      if (res.error !== null) setState({ status: "error", error: res.error });
      else setState({ status: "ready" });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbKey, attempt]);

  if (!isDb || state.status === "ready")
    return <FlashcardStudySession {...props} key={dbKey} />;

  if (state.status === "error") {
    return (
      <div className="flash-empty-hint">
        <p>{t("flash.adminLoadError")}</p>
        <p>{state.error}</p>
        <Button type="button" onClick={() => setAttempt((n) => n + 1)}>
          {t("flash.adminRetry")}
        </Button>{" "}
        <Button type="button" variant="secondary" onClick={props.onBack}>
          {t("flash.chooseAnother")}
        </Button>
      </div>
    );
  }

  return <LoadingState label={t("flash.adminLoading")} />;
}
