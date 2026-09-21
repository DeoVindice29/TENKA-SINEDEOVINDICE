export const SPEEDRUN_KEY = "tebakAksara_speedrun_v1";

// Speedrun cuma ada di aksara dasar. Basic Kotoba, Bunpō & Kanji N5 sudah
// pakai Penaklukan ala ujian JLPT (acak per tier), jadi tidak ada speedrun.
export const SPEEDRUN_SCRIPTS: readonly string[] = ["hiragana", "katakana"];

export function supportsSpeedrun(scriptKey: string): boolean {
  return SPEEDRUN_SCRIPTS.includes(scriptKey);
}

export type SpeedrunRecords = Record<string, number>;

export function getSpeedrunRecords(): SpeedrunRecords {
  try {
    return JSON.parse(localStorage.getItem(SPEEDRUN_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getSpeedrunBest(scriptKey: string): number | null {
  const r = getSpeedrunRecords();
  return typeof r[scriptKey] === "number" ? r[scriptKey] : null;
}

export type SaveSpeedrunResult = {
  isNewRecord: boolean;
  prevBest: number | null;
};

export function saveSpeedrunTime(
  scriptKey: string,
  timeMs: number,
): SaveSpeedrunResult {
  const r = getSpeedrunRecords();
  const prevBest = typeof r[scriptKey] === "number" ? r[scriptKey] : null;
  const isNewRecord = prevBest === null || timeMs < prevBest;
  if (isNewRecord) {
    r[scriptKey] = timeMs;
    localStorage.setItem(SPEEDRUN_KEY, JSON.stringify(r));
  }
  return { isNewRecord, prevBest };
}
