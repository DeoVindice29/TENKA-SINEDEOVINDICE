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
