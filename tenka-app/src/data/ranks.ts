import { supabase } from "@/lib/supabaseClient";

export const RANK_KEY = "tebakAksara_rank_v1";
export const PHOTO_KEY = "tebakAksara_photo_v1";
export const ConquerY_KEY = "tebakAksara_Conquery_v1";
export const NICKNAME_KEY = "tebakAksara_nickname_v1";

export const RANK_LEVELS = [
  {
    title: "Commoner",
    subtitle: "平民",
    emoji: "🌾",
    req: "The starting point of your journey.",
  },
  {
    title: "Knight",
    subtitle: "騎士",
    emoji: "⚔️",
    req: "Conquer all of Hiragana & Katakana.",
  },
  {
    title: "Baron",
    subtitle: "男爵",
    emoji: "🎗️",
    req: "Conquer all N5 Basic Kotoba.",
  },
  {
    title: "Viscount",
    subtitle: "子爵",
    emoji: "📯",
    req: "Understand all N5 Bunpō.",
  },
  {
    title: "Count",
    subtitle: "伯爵",
    emoji: "🏛️",
    req: "Conquer all N5 Kanji.",
  },
  {
    title: "Marquis",
    subtitle: "侯爵",
    emoji: "🏯",
    req: "Conquer all N5 material — Hiragana, Katakana, Basic Kotoba, Bunpō, and Kanji.",
  },
  {
    title: "Duke",
    subtitle: "公爵",
    emoji: "🦅",
    req: "Conquer all N4 material.",
    locked: true,
  },
  {
    title: "Archduke",
    subtitle: "大公",
    emoji: "🌟",
    req: "Conquer all N3 material.",
    locked: true,
  },
  {
    title: "King",
    subtitle: "国王",
    emoji: "🏵️",
    req: "Conquer all N2 material.",
    locked: true,
  },
  {
    title: "Emperor",
    subtitle: "天皇",
    emoji: "👑",
    req: "Conquer all N1 material.",
    locked: true,
  },
];
export const RANK_REQ_ID = {
  "The starting point of your journey.": "Titik awal perjalananmu.",
  "Conquer all of Hiragana & Katakana.":
    "Taklukkan seluruh Hiragana & Katakana.",
  "Conquer all N5 Basic Kotoba.": "Taklukkan seluruh Basic Kotoba N5.",
  "Understand all N5 Bunpō.": "Pahami seluruh Bunpō N5.",
  "Conquer all N5 Kanji.": "Taklukkan seluruh Kanji N5.",
  "Conquer all N5 material — Hiragana, Katakana, Basic Kotoba, Bunpō, and Kanji.":
    "Taklukkan seluruh materi N5 — Hiragana, Katakana, Basic Kotoba, Bunpō, dan Kanji.",
  "Conquer all N4 material.": "Taklukkan seluruh materi N4.",
  "Conquer all N3 material.": "Taklukkan seluruh materi N3.",
  "Conquer all N2 material.": "Taklukkan seluruh materi N2.",
  "Conquer all N1 material.": "Taklukkan seluruh materi N1.",
};

export function getRankIndex(): number {
  return parseInt(localStorage.getItem(RANK_KEY) || "0", 10) || 0;
}
// dipancarkan tiap pangkat berubah supaya UI (sidebar) ikut update tanpa reload
export const RANK_EVENT = "tenka:rank-changed";

export function setRankIndex(i: number): void {
  localStorage.setItem(RANK_KEY, String(i));
  window.dispatchEvent(new Event(RANK_EVENT));
  syncRankToProfile(i);
}

// Nyimpen rank_index ke profil Supabase juga (buat ditampilin di Admin
// Panel → Pengguna) — fire-and-forget, gak nge-block UI. Akun tamu gak
// punya baris profile di server jadi otomatis dilewatin (getSession()
// bakal null).
function syncRankToProfile(i: number): void {
  supabase.auth.getSession().then(({ data }) => {
    const userId = data.session?.user.id;
    if (!userId) return;
    supabase.from("profiles").update({ rank_index: i }).eq("id", userId);
  });
}

export function getConquery(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(ConquerY_KEY) || "{}");
  } catch (e) {
    return {};
  }
}
export function markScriptConquered(scriptKey: string): void {
  const m = getConquery();
  if (!m[scriptKey]) {
    m[scriptKey] = true;
    localStorage.setItem(ConquerY_KEY, JSON.stringify(m));
  }
}
export function computeRankIndex(): number {
  const m = getConquery();
  let idx = 0;
  if (m.hiragana && m.katakana) idx = 1; // Knight
  if (idx >= 1 && m.kotoba) idx = 2; // Baron
  if (idx >= 2 && m.bunpo) idx = 3; // Viscount
  if (idx >= 3 && m.kanji) idx = 4; // Count
  if (idx >= 4) idx = 5; // Marquis — seluruh N5 tuntas
  return idx;
}
export function promoteIfHigher(scriptKey: string, mode: string): boolean {
  if (mode === "all") markScriptConquered(scriptKey);
  const computed = computeRankIndex();
  if (computed > getRankIndex()) {
    setRankIndex(computed);
    return true;
  }
  return false;
}

// Misi kenaikan pangkat — target yang harus ditaklukkan per pangkat (sama
// dengan aturan computeRankIndex di atas). Dipakai popup "Misi" di topbar.
export type MissionScriptKey =
  | "hiragana"
  | "katakana"
  | "kotoba"
  | "bunpo"
  | "kanji";

export const RANK_MISSIONS: { rankIndex: number; scripts: MissionScriptKey[] }[] =
  [
    { rankIndex: 1, scripts: ["hiragana", "katakana"] }, // Knight
    { rankIndex: 2, scripts: ["kotoba"] }, // Baron
    { rankIndex: 3, scripts: ["bunpo"] }, // Viscount
    { rankIndex: 4, scripts: ["kanji"] }, // Count (→ Marquis)
  ];

export const MISSION_TOTAL = RANK_MISSIONS.reduce(
  (n, g) => n + g.scripts.length,
  0,
);

export function countMissionsDone(): number {
  const m = getConquery();
  return RANK_MISSIONS.reduce(
    (n, g) => n + g.scripts.filter((k) => m[k]).length,
    0,
  );
}
