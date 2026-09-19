export const SPEEDRUN_KEY = "tebakAksara_speedrun_v1";

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
