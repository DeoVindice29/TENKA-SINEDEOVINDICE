import { MISSION_TOTAL, RANK_MISSIONS } from "./ranks";
import { CHIBI_QUOTES, type ProgressState } from "./chibiQuotes";

// Otak kecil buat "peri pemandu" chibi di popup Misi Pangkat — nentuin
// ekspresi + pesan mana yang cocok ditampilin berdasarkan progress misi
// saat ini, plus tips harian yang gantian tiap hari (bukan acak tiap
// render, biar "Tips Hari Ini" konsisten selama satu hari).

export type GuideExpression =
  | "pointing"
  | "happy"
  | "proud"
  | "celebrate"
  | "thinking";

export type GuideMood = {
  expression: GuideExpression;
  messageKey: string;
};

/**
 * `done` / `total`: progress grup misi yang sedang aktif (bukan total
 * semua misi) — biar reaksinya soal misi yang sedang dikerjakan user
 * sekarang, bukan keseluruhan.
 */
export function pickGuideMood(done: number, total: number, allDone: boolean): GuideMood {
  if (allDone) return { expression: "celebrate", messageKey: "guide.msg.done" };
  if (total <= 0 || done <= 0) return { expression: "pointing", messageKey: "guide.msg.start" };
  if (done >= total - 1) return { expression: "proud", messageKey: "guide.msg.almost" };
  return { expression: "happy", messageKey: "guide.msg.progress" };
}

const TIP_COUNT = 6;

/** Index tips hari ini — stabil sepanjang hari yang sama, ganti besok. */
export function getTodayTipIndex(): number {
  const now = new Date();
  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(now.getFullYear(), 0, 0)) /
      86_400_000,
  );
  return dayOfYear % TIP_COUNT;
}

export function getTodayTipKey(): string {
  return `guide.tip.${getTodayTipIndex()}`;
}

// ---------------------------------------------------------------------------
// Ucapan chibi di header popup Misi Pangkat — SELALU cocok dengan progres
// user, tapi tetap berganti-ganti tiap popup dibuka.
//
// Kandidat ucapan untuk satu keadaan progres =
//   (a) ucapan khusus progres (guide.progress.<keadaan>.<n>) yang menyebut
//       conquest berikutnya / pangkat tujuan / hitungan progres, dan
//   (b) kutipan umum (CHIBI_QUOTES) yang ditandai cocok untuk keadaan itu.
// Tiap dibuka dipilih satu secara acak — separuh peluang dari (a) supaya
// terasa personal, separuhnya dari (b) supaya tetap bervariasi — dan tidak
// pernah sama dua kali berturut-turut.
// ---------------------------------------------------------------------------

export type ProgressContext = {
  /** total conquest N5 yang sudah ditaklukkan / seluruhnya */
  done: number;
  total: number;
  /** sisa conquest di grup misi yang sedang aktif */
  remainingInGroup: number;
  allDone: boolean;
};

export type ChibiLine = {
  messageKey: string;
  /** nama file ekspresi chibi (tanpa ekstensi) */
  expression: string;
};

/** Ucapan khusus progres per keadaan (teks: I18N.ts, guide.progress.*). */
const PROGRESS_LINES: Record<ProgressState, readonly ChibiLine[]> = {
  start: [
    { messageKey: "guide.progress.start.0", expression: "pointing" },
    { messageKey: "guide.progress.start.1", expression: "its-time" },
    { messageKey: "guide.progress.start.2", expression: "ready" },
  ],
  mid: [
    { messageKey: "guide.progress.mid.0", expression: "happy" },
    { messageKey: "guide.progress.mid.1", expression: "spirit" },
    { messageKey: "guide.progress.mid.2", expression: "write" },
  ],
  last: [
    { messageKey: "guide.progress.last.0", expression: "proud" },
    { messageKey: "guide.progress.last.1", expression: "impressed" },
    { messageKey: "guide.progress.last.2", expression: "ready" },
  ],
  done: [
    { messageKey: "guide.progress.done.0", expression: "celebrate" },
    { messageKey: "guide.progress.done.1", expression: "love" },
    { messageKey: "guide.progress.done.2", expression: "proud" },
  ],
};

export function getProgressState(ctx: ProgressContext): ProgressState {
  if (ctx.allDone) return "done";
  if (ctx.done <= 0) return "start";
  if (ctx.remainingInGroup === 1) return "last";
  return "mid";
}

/** Progres misi dari data Penaklukan yang tersimpan (`conquered` = getConquery()). */
export function getProgressContext(
  conquered: Partial<Record<string, boolean>>,
): ProgressContext {
  const done = RANK_MISSIONS.reduce(
    (n, g) => n + g.scripts.filter((k) => conquered[k]).length,
    0,
  );
  const activeGroup = RANK_MISSIONS.find((g) => g.scripts.some((k) => !conquered[k]));
  return {
    done,
    total: MISSION_TOTAL,
    remainingInGroup: activeGroup
      ? activeGroup.scripts.filter((k) => !conquered[k]).length
      : 0,
    allDone: !activeGroup,
  };
}

/**
 * Pilih ucapan untuk progres ini. `prevKey` = messageKey yang tampil
 * sebelumnya (dihindari supaya tiap dibuka pasti ganti).
 */
export function pickChibiLine(
  ctx: ProgressContext,
  prevKey: string | null,
): ChibiLine {
  const state = getProgressState(ctx);
  const specific = PROGRESS_LINES[state];
  const general: ChibiLine[] = CHIBI_QUOTES.filter((q) =>
    q.states.includes(state),
  );

  const pickFrom = (list: readonly ChibiLine[]) =>
    list.filter((l) => l.messageKey !== prevKey);

  const preferSpecific = Math.random() < 0.5;
  let pool = pickFrom(preferSpecific ? specific : general);
  if (pool.length === 0) pool = pickFrom(preferSpecific ? general : specific);
  if (pool.length === 0) pool = [...specific, ...general];
  return pool[Math.floor(Math.random() * pool.length)];
}
