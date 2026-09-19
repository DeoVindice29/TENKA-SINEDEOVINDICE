export const TITLES_KEY = "tebakAksara_titles_v1";

export type ConquestTitle = {
  title: string;
  emoji: string;
};

export const CONQUEST_TITLES: Record<string, ConquestTitle> = {
  hiragana: { title: "Hiragana Conqueror", emoji: "あ" },
  katakana: { title: "Katakana Conqueror", emoji: "ア" },
  kotoba: { title: "Basic Kotoba Conqueror", emoji: "語" },
  bunpo: { title: "Bunpō Conqueror", emoji: "文" },
  kanji: { title: "Kanji N5 Conqueror", emoji: "漢" },
};

export const CONQUEST_ORDER = Object.keys(CONQUEST_TITLES);

export function getConquestLockReason(scriptKey: string): string | null {
  const idx = CONQUEST_ORDER.indexOf(scriptKey);
  if (idx <= 0) return null;
  const earned = getConqueredTitles();
  for (let i = 0; i < idx; i++) {
    if (!earned[CONQUEST_ORDER[i]]) return CONQUEST_ORDER[i];
  }
  return null;
}

export function getConqueredTitles(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(TITLES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function earnConquestTitle(scriptKey: string): boolean {
  const t = getConqueredTitles();
  if (!t[scriptKey]) {
    t[scriptKey] = true;
    localStorage.setItem(TITLES_KEY, JSON.stringify(t));
    return true;
  }
  return false;
}
