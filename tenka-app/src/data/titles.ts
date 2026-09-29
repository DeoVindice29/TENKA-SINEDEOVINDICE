import {
  scopedKey,
  onProgressAccountChange,
  pushProgressPatch,
  fetchProgressRow,
} from "./progressAccount";

// dipancarkan tiap koleksi title berubah (dapet title baru, atau abis
// digabung sama data server pas ganti akun) — dipakai ConquestContext buat
// nge-refresh isConquered/isLocked/badge title tanpa reload halaman.
export const TITLES_EVENT = "tenka:titles-changed";

// NB: sama kayak RANK_KEY di ranks.ts, key ini di-namespace per akun lewat
// scopedKey() sebelum dipakai ke localStorage.
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

// Penaklukan per LEVEL JLPT (N4-N1). Sengaja dipisah dari CONQUEST_TITLES
// supaya tidak ikut dihitung di pangkat / misi / koleksi title N5. Disimpan di
// koleksi conquest_titles yang sama (jsonb, sudah tersinkron ke Supabase),
// jadi tidak perlu migrasi.
export const LEVEL_CONQUEST_KEYS: Record<string, string> = {
  N4: "level_n4",
  N3: "level_n3",
  N2: "level_n2",
  N1: "level_n1",
};

/** Tandai satu level (N4-N1) sebagai sudah ditaklukkan. */
export function earnLevelConquest(level: string): boolean {
  const key = LEVEL_CONQUEST_KEYS[level];
  return key ? earnConquestTitle(key) : false;
}

// Kunci urutan Penaklukan (harus takluk aksara sebelumnya dulu).
export const CONQUEST_LOCK_ENABLED = true;

export function getConquestLockReason(scriptKey: string): string | null {
  if (!CONQUEST_LOCK_ENABLED) return null;
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
    return JSON.parse(localStorage.getItem(scopedKey(TITLES_KEY)) || "{}");
  } catch {
    return {};
  }
}

export function earnConquestTitle(scriptKey: string): boolean {
  const t = getConqueredTitles();
  if (!t[scriptKey]) {
    t[scriptKey] = true;
    localStorage.setItem(scopedKey(TITLES_KEY), JSON.stringify(t));
    pushProgressPatch({ conquest_titles: t });
    window.dispatchEvent(new Event(TITLES_EVENT));
    return true;
  }
  return false;
}

/** Khusus admin (reset penaklukan): cabut title dari aksara-aksara ini. */
export function revokeConquestTitles(scriptKeys: string[]): boolean {
  const t = getConqueredTitles();
  let changed = false;
  for (const k of scriptKeys) {
    if (t[k]) {
      delete t[k];
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem(scopedKey(TITLES_KEY), JSON.stringify(t));
    pushProgressPatch({ conquest_titles: t });
    window.dispatchEvent(new Event(TITLES_EVENT));
  }
  return changed;
}

// Sama kayak di ranks.ts: tiap akun aktif berubah, tarik koleksi title dari
// Supabase dan gabungkan (union) sama yang udah ada di localStorage buat
// akun ini di browser ini.
onProgressAccountChange((userId) => {
  if (!userId) return;
  fetchProgressRow(userId).then((row) => {
    if (!row) return;
    const remote = row.conquest_titles ?? {};
    const local = getConqueredTitles();
    const merged = { ...remote, ...local };
    localStorage.setItem(scopedKey(TITLES_KEY), JSON.stringify(merged));
    window.dispatchEvent(new Event(TITLES_EVENT));
    if (Object.keys(merged).length > Object.keys(remote).length) {
      pushProgressPatch({ conquest_titles: merged });
    }
  });
});
