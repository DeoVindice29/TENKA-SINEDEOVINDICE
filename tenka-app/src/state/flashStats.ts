import { getBuiltinDeckDefs, buildDeckCardDescriptors } from "@/data/flashDecks";
import { KOTOBA_N5_CHAPTERS, KOTOBA_TIER_KEYS } from "@/data/kotobaN5";
import { KANJI_N5_CHAPTERS, KANJI_TIER_KEYS } from "@/data/kanjiN5";
import type { FlashRating } from "./flashCategory";
import { pickLang } from "@/lib/quizLang";

const LOG_KEY = "tenka_flashLog_v1"; // dipakai semua mode belajar
const SRS_KEY = "tebakAksara_flashSRS_v1";
const LOG_MAX = 20000;
const DAY = 86_400_000;
const GAP_CAP = 60_000; // jeda > 60 dtk dianggap berhenti, dihitung maks 60 dtk
const FIRST_REVIEW_MS = 8_000;

export type Src = "flash" | "quiz" | "match";
export type SrcFilter = "all" | Src;
/** Dari halaman mana jawaban dicatat (flash otomatis "flashcard"). */
export type Origin = "quiz" | "practice" | "flashcard";
type Entry = { t: number; id: string; r: FlashRating; s?: Src; label?: string; o?: Origin };

function readLog(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function appendFlashLog(id: string, r: FlashRating, t: number) {
  appendStudyLog("flash", id, r, t);
}

/** Catat 1 jawaban dari mode apa pun (flash / quiz / match). */
export function appendStudyLog(
  s: Src,
  id: string,
  r: FlashRating,
  t: number = Date.now(),
  label?: string,
  origin?: Origin,
) {
  try {
    const log = readLog();
    log.push({ t, id, r, s, ...(label ? { label: label.slice(0, 40) } : {}), ...(origin ? { o: origin } : {}) });
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-LOG_MAX)));
  } catch {
    // ignore
  }
}

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Waktu belajar (ms) per entri: jeda ke review sebelumnya, dibatasi. */
function withDurations(log: Entry[]) {
  return log.map((e, i) => {
    const gap = i ? e.t - log[i - 1].t : Infinity;
    return { ...e, ms: gap <= GAP_CAP ? Math.max(gap, 1000) : FIRST_REVIEW_MS };
  });
}

function cardLabel(id: string): string {
  const [kind, tk, i] = id.split(":");
  const idx = Number(i);
  if (kind === "kotoba") {
    const ti = (KOTOBA_TIER_KEYS as readonly string[]).indexOf(tk);
    return String(KOTOBA_N5_CHAPTERS[ti]?.[idx]?.[0] ?? id);
  }
  if (kind === "kanji") {
    const ti = (KANJI_TIER_KEYS as readonly string[]).indexOf(tk);
    const it = KANJI_N5_CHAPTERS[ti]?.[idx] as readonly unknown[] | undefined;
    return String(it?.[0] ?? id);
  }
  return pickLang({ en: "Custom card", id: "Kartu kustom" });
}

// Aksara asal tiap entri log: id kuis/match membawa kunci aksara
// ("quiz:kotoba:…", "match:kanji"), id flashcard diawali "kotoba:"/"kanji:".
const SCRIPT_ROWS: readonly (readonly [string, string])[] = [
  ["hiragana", "Hiragana"],
  ["katakana", "Katakana"],
  ["kotoba", "Kotoba"],
  ["bunpo", "Bunpō"],
  ["kanji", "Kanji"],
];

// Kartu di luar lima materi bawaan: deck buatan/impor sendiri ("custom:…"),
// kartu deck dari database/admin ("db:…"), sisanya "other".
const EXTRA_ROWS: readonly (readonly [string, string])[] = [
  ["custom", "Deck Kustom"],
  ["db", "Deck Database"],
  ["other", "Lainnya"],
];
const ALL_ROWS: readonly (readonly [string, string])[] = [...SCRIPT_ROWS, ...EXTRA_ROWS];

function scriptOf(id: string): string {
  const [head, second] = id.split(":");
  const key = head === "quiz" || head === "match" ? second : head;
  if (key === undefined) return "other";
  return ALL_ROWS.some(([k]) => k === key) && key !== "other" ? key : "other";
}

export type Range = "today" | "7d" | "30d" | "all";

export function computeStats(range: Range, src: SrcFilter = "all") {
  const now = Date.now();
  const today = startOfDay(now);
  const all = withDurations(readLog().filter((e) => src === "all" || (e.s ?? "flash") === src));
  const span = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 0;
  const from = span ? today - (span - 1) * DAY : 0;
  const inR = all.filter((e) => e.t >= from);
  const prev = span
    ? all.filter((e) => e.t >= from - span * DAY && e.t < from)
    : [];

  const summarize = (es: typeof all) => {
    const n = es.length;
    const c = { again: 0, hard: 0, good: 0, easy: 0 };
    es.forEach((e) => c[e.r]++);
    return {
      n,
      c,
      acc: n ? Math.round(((n - c.again) / n) * 100) : 0,
      mins: Math.round(es.reduce((s, e) => s + e.ms, 0) / 60000),
    };
  };
  const cur = summarize(inR);
  const pre = summarize(prev);

  // streak dari hari-hari yang ada review-nya
  const days = new Set(all.map((e) => startOfDay(e.t)));
  let streak = 0;
  for (let d = days.has(today) ? today : today - DAY; days.has(d); d -= DAY) streak++;
  let best = 0;
  let run = 0;
  Array.from(days)
    .sort((a, b) => a - b)
    .forEach((d, i, arr) => {
      run = i && d - arr[i - 1] === DAY ? run + 1 : 1;
      best = Math.max(best, run);
    });

  // 7 hari terakhir (menit)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = today - (6 - i) * DAY;
    const ms = all
      .filter((e) => e.t >= d && e.t < d + DAY)
      .reduce((s, e) => s + e.ms, 0);
    return {
      d: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][new Date(d).getDay()],
      v: Math.round(ms / 60000),
      today: d === today,
      dow: new Date(d).getDay(),
    };
  });

  // heatmap 15 minggu (105 hari), kolom per minggu tidak dipisah: urut hari
  const heat = Array.from({ length: 105 }, (_, i) => {
    const d = today - (104 - i) * DAY;
    return all.filter((e) => e.t >= d && e.t < d + DAY).length;
  });

  // per-hari (semua waktu, ikut filter sumber): dasar heatmap hover & best performance
  const perDay = new Map<number, { n: number; again: number; ms: number }>();
  all.forEach((e) => {
    const k = startOfDay(e.t);
    const o = perDay.get(k) ?? { n: 0, again: 0, ms: 0 };
    o.n++;
    if (e.r === "again") o.again++;
    o.ms += e.ms;
    perDay.set(k, o);
  });

  // heatmap kalender seumur hidup: dari minggu aktivitas pertama sampai minggu ini
  // (minimal 15 minggu). Kolom = minggu (Sen-Min), baris = hari; sel setelah
  // hari ini ditandai `future`.
  const rawLog = readLog();
  const firstT = rawLog.length ? Math.min(...rawLog.map((e) => e.t)) : today;
  const dow = (new Date(today).getDay() + 6) % 7; // Senin = 0
  const weekOf = (t: number) => startOfDay(t) - ((new Date(t).getDay() + 6) % 7) * DAY;
  const weekCount = Math.max(15, Math.round((today - dow * DAY - weekOf(firstT)) / (7 * DAY)) + 1);
  const gridStart = today - dow * DAY - (weekCount - 1) * 7 * DAY;
  const heatWeeks = Array.from({ length: weekCount }, (_, w) =>
    Array.from({ length: 7 }, (_, r) => {
      const t = startOfDay(gridStart + (w * 7 + r) * DAY);
      const o = perDay.get(t);
      const n = o?.n ?? 0;
      return {
        t,
        n,
        acc: n && o ? Math.round(((n - o.again) / n) * 100) : 0,
        mins: o ? Math.round(o.ms / 60000) : 0,
        future: t > today,
      };
    }),
  );
  const activeDays = heatWeeks.flat().filter((c) => c.n > 0).length;

  // best performance (semua waktu, ikut filter sumber)
  const dayStats = Array.from(perDay.values());
  const bestAcc = dayStats
    .filter((d) => d.n >= 5)
    .reduce((m, d) => Math.max(m, Math.round(((d.n - d.again) / d.n) * 100)), 0);
  const bestAnswers = dayStats.reduce((m, d) => Math.max(m, d.n), 0);
  const scriptCount: Record<string, number> = {};
  all.forEach((e) => {
    const k = scriptOf(e.id);
    scriptCount[k] = (scriptCount[k] || 0) + 1;
  });
  const topScript = Object.entries(scriptCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostPracticed = topScript
    ? (ALL_ROWS.find(([k]) => k === topScript)?.[1] ?? "")
    : "";

  // kartu sering salah (+ asal kesalahan: flashcard / quiz di Home / Latihan Soal)
  const wrong: Record<string, number> = {};
  const labels: Record<string, string> = {};
  const wrongBy: Record<string, Record<string, number>> = {};
  inR.forEach((e) => {
    if (e.s === "match") return; // match tidak punya soal spesifik
    if (e.r === "again") {
      wrong[e.id] = (wrong[e.id] || 0) + 1;
      const o = (e.s ?? "flash") === "flash" ? "flashcard" : (e.o ?? "unknown");
      const m = (wrongBy[e.id] ??= {});
      m[o] = (m[o] || 0) + 1;
    }
    if (e.label) labels[e.id] = e.label;
  });
  const weak = Object.entries(wrong)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, n]) => [labels[id] || cardLabel(id), n] as const);

  // sering salah dipisah per jenis soal (aksara/materi), masing-masing diranking
  const weakGroups = ALL_ROWS
    .map(([k, label]) => {
      const rows = Object.entries(wrong).filter(([id]) => scriptOf(id) === k);
      const origins: Record<string, number> = {};
      rows.forEach(([id]) =>
        Object.entries(wrongBy[id] ?? {}).forEach(([o, v]) => (origins[o] = (origins[o] || 0) + v)),
      );
      return {
        k,
        label,
        total: rows.reduce((sum, [, v]) => sum + v, 0),
        origins,
        items: rows
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([id, v]) => {
            const top = Object.entries(wrongBy[id] ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];
            return [labels[id] || cardLabel(id), v, top ?? "unknown"] as const;
          }),
      };
    })
    .filter((g) => g.items.length);

  // SRS: dikuasai & jatuh tempo & progres per bab
  let srs: Record<string, { interval?: number; due?: number; lastReviewed?: number }> = {};
  try {
    srs = JSON.parse(localStorage.getItem(SRS_KEY) || "{}");
  } catch {
    srs = {};
  }
  const cards = Object.values(srs);
  const mastered = cards.filter((s) => (s.interval || 0) >= 7).length;
  const dueNow = cards.filter((s) => s.lastReviewed && (s.due || 0) <= now).length;

  const chapters = getBuiltinDeckDefs()
    .filter(
      (d) =>
        (d.ref.kind === "kotoba" || d.ref.kind === "kanji") &&
        d.ref.tierKey !== "all",
    )
    .map((d) => {
      const ids = buildDeckCardDescriptors(d.ref).map((c) => c.id);
      const idSet = new Set(ids);
      const done = ids.filter((id) => srs[id]?.lastReviewed).length;
      const es = inR.filter((e) => idSet.has(e.id));
      return {
        g: d.ref.kind === "kotoba" ? "Kotoba" : "Kanji",
        // Kanji tidak punya judul sub chapter: pakai nomornya ("tier3" -> "Sub Chapter 3")
        n:
          d.ref.kind === "kanji"
            ? `Sub Chapter ${(KANJI_TIER_KEYS as readonly string[]).indexOf(d.ref.tierKey) + 1}`
            : d.label.replace(/^(Kotoba|Kanji) — /, ""),
        p: ids.length ? Math.round((done / ids.length) * 100) : 0,
        done,
        total: ids.length,
        mins: Math.round(es.reduce((sum, e) => sum + e.ms, 0) / 60000),
        acc: es.length ? Math.round((es.filter((e) => e.r !== "again").length / es.length) * 100) : 0,
        answers: es.length,
      };
    });

  // rincian per aksara (ikut rentang waktu & filter sumber yang dipilih)
  const byScript = ALL_ROWS
    .map(([k, label]) => {
      const es = inR.filter((e) => scriptOf(e.id) === k);
      const n = es.length;
      return {
        k,
        label,
        n,
        acc: n ? Math.round((es.filter((e) => e.r !== "again").length / n) * 100) : 0,
        mins: Math.round(es.reduce((sum, e) => sum + e.ms, 0) / 60000),
      };
    })
    .filter((r) => SCRIPT_ROWS.some(([k]) => k === r.k) || r.n > 0);

  return {
    cur,
    pre,
    hasPrev: !!span,
    streak,
    best,
    week,
    heat,
    heatWeeks,
    activeDays,
    bestPerf: { streak: best, acc: bestAcc, answers: bestAnswers, practiced: mostPracticed, practicedKey: topScript ?? "" },
    weak,
    weakGroups,
    mastered,
    dueNow,
    chapters,
    byScript,
    total: all.length,
  };
}
