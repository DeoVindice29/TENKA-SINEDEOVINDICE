import commonerLogo from "@/assets/rank/commoner.png";
import knightLogo from "@/assets/rank/knight.png";
import baronLogo from "@/assets/rank/baron.png";
import viscountLogo from "@/assets/rank/viscount.png";
import countLogo from "@/assets/rank/count.png";
import marquisLogo from "@/assets/rank/marquis.png";
import dukeLogo from "@/assets/rank/duke.png";
import kingLogo from "@/assets/rank/king.png";
import emperorLogo from "@/assets/rank/emperor.png";
import {
  scopedKey,
  onProgressAccountChange,
  pushProgressPatch,
  fetchProgressRow,
} from "./progressAccount";

// NB: RANK_KEY & ConquerY_KEY sekarang di-namespace per akun lewat
// scopedKey() (lihat progressAccount.ts) sebelum dipakai ke localStorage,
// jadi ganti akun di browser yang sama gak bikin progres "ketuker". Nilai
// mentah di sini cuma dipakai sebagai prefix key-nya.
export const RANK_KEY = "tebakAksara_rank_v1";
export const PHOTO_KEY = "tebakAksara_photo_v1";
export const ConquerY_KEY = "tebakAksara_Conquery_v1";
export const NICKNAME_KEY = "tebakAksara_nickname_v1";

// Urutan pangkat = urutan index yang disimpan di localStorage/Supabase
// (profiles.rank_index). 9 pangkat total (Archduke sudah dihapus):
//   0-4 Commoner → Count  = jalur N5 (Count = seluruh N5 tuntas)
//   5   Marquis           = N4
//   6   Duke              = N3
//   7   King              = N2
//   8   Emperor           = N1
// `logo` = gambar untuk UI; `emoji` tetap dipakai buat teks polos/pesan.
export const RANK_LEVELS = [
  {
    title: "Commoner",
    subtitle: "平民",
    emoji: "🌾",
    logo: commonerLogo,
    req: "The starting point of your journey.",
  },
  {
    title: "Knight",
    subtitle: "騎士",
    emoji: "⚔️",
    logo: knightLogo,
    req: "Conquer all of Hiragana & Katakana.",
  },
  {
    title: "Baron",
    subtitle: "男爵",
    emoji: "🎗️",
    logo: baronLogo,
    req: "Conquer all N5 Basic Kotoba.",
  },
  {
    title: "Viscount",
    subtitle: "子爵",
    emoji: "📯",
    logo: viscountLogo,
    req: "Understand all N5 Bunpō.",
  },
  {
    title: "Count",
    subtitle: "伯爵",
    emoji: "🏛️",
    logo: countLogo,
    req: "Conquer all N5 material — Hiragana, Katakana, Basic Kotoba, Bunpō, and Kanji.",
  },
  {
    title: "Marquis",
    subtitle: "侯爵",
    emoji: "🏯",
    logo: marquisLogo,
    req: "Conquer all N4 material.",
    locked: true,
  },
  {
    title: "Duke",
    subtitle: "公爵",
    emoji: "🦅",
    logo: dukeLogo,
    req: "Conquer all N3 material.",
    locked: true,
  },
  {
    title: "King",
    subtitle: "国王",
    emoji: "🏵️",
    logo: kingLogo,
    req: "Conquer all N2 material.",
    locked: true,
  },
  {
    title: "Emperor",
    subtitle: "天皇",
    emoji: "👑",
    logo: emperorLogo,
    req: "Conquer all N1 material.",
    locked: true,
  },
];

// Pangkat tertinggi yang sudah bisa diraih sekarang (yang belum `locked`).
// Dipakai buat nge-clamp rank tersimpan, biar progres lama (mis. rank 5 dari
// skema lama, waktu Marquis = tamat N5) gak nyangkut di pangkat yang masih
// terkunci.
export const MAX_UNLOCKED_RANK = RANK_LEVELS.reduce(
  (max, r, i) => (r.locked ? max : i),
  0,
);

/** HTML <img> kecil buat pangkat — dipakai di pesan yang dirender lewat
 * dangerouslySetInnerHTML (mis. ResultsScreen), di mana komponen React gak bisa
 * dipakai. */
export function rankLogoHtml(rank: { logo: string; title: string }): string {
  return `<img class="rank-logo-inline" src="${rank.logo}" alt="${rank.title}" />`;
}
export const RANK_REQ_ID = {
  "The starting point of your journey.": "Titik awal perjalananmu.",
  "Conquer all of Hiragana & Katakana.":
    "Taklukkan seluruh Hiragana & Katakana.",
  "Conquer all N5 Basic Kotoba.": "Taklukkan seluruh Basic Kotoba N5.",
  "Understand all N5 Bunpō.": "Pahami seluruh Bunpō N5.",
  "Conquer all N5 material — Hiragana, Katakana, Basic Kotoba, Bunpō, and Kanji.":
    "Taklukkan seluruh lessons N5 — Hiragana, Katakana, Basic Kotoba, Bunpō, dan Kanji.",
  "Conquer all N4 material.": "Taklukkan seluruh lessons N4.",
  "Conquer all N3 material.": "Taklukkan seluruh lessons N3.",
  "Conquer all N2 material.": "Taklukkan seluruh lessons N2.",
  "Conquer all N1 material.": "Taklukkan seluruh lessons N1.",
};

export function getRankIndex(): number {
  const raw =
    parseInt(localStorage.getItem(scopedKey(RANK_KEY)) || "0", 10) || 0;
  return Math.min(raw, MAX_UNLOCKED_RANK);
}
// dipancarkan tiap pangkat berubah supaya UI (sidebar) ikut update tanpa reload
export const RANK_EVENT = "tenka:rank-changed";

export function setRankIndex(i: number): void {
  localStorage.setItem(scopedKey(RANK_KEY), String(i));
  window.dispatchEvent(new Event(RANK_EVENT));
  // fire-and-forget ke Supabase (profiles.rank_index) — dilewatin otomatis
  // buat akun tamu/belum login (lihat pushProgressPatch)
  pushProgressPatch({ rank_index: i });
}

export function getConquery(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(scopedKey(ConquerY_KEY)) || "{}");
  } catch (e) {
    return {};
  }
}
export function markScriptConquered(scriptKey: string): void {
  const m = getConquery();
  if (!m[scriptKey]) {
    m[scriptKey] = true;
    localStorage.setItem(scopedKey(ConquerY_KEY), JSON.stringify(m));
    pushProgressPatch({ conquery: m });
    // kabari UI (counter Misi di topbar) — status penaklukan berubah walau
    // pangkatnya belum tentu naik (mis. baru Hiragana, Katakana belum)
    window.dispatchEvent(new Event(RANK_EVENT));
  }
}
/** Khusus admin (reset penaklukan): tandai aksara-aksara ini belum ditaklukkan. */
export function unmarkScriptsConquered(scriptKeys: string[]): void {
  const m = getConquery();
  let changed = false;
  for (const k of scriptKeys) {
    if (m[k]) {
      delete m[k];
      changed = true;
    }
  }
  if (changed) {
    localStorage.setItem(scopedKey(ConquerY_KEY), JSON.stringify(m));
    pushProgressPatch({ conquery: m });
    window.dispatchEvent(new Event(RANK_EVENT));
  }
}
export function computeRankIndex(): number {
  const m = getConquery();
  let idx = 0;
  if (m.hiragana && m.katakana) idx = 1; // Knight
  if (idx >= 1 && m.kotoba) idx = 2; // Baron
  if (idx >= 2 && m.bunpo) idx = 3; // Viscount
  if (idx >= 3 && m.kanji) idx = 4; // Count — seluruh N5 tuntas
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
    { rankIndex: 4, scripts: ["kanji"] }, // Count (seluruh N5 tuntas)
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

// Progres misi grup yang sedang aktif (buat counter "Misi" di topbar): grup
// pertama yang masih ada misi belum tuntas, mis. Knight = Hiragana + Katakana
// → mulai dari 0/2, jadi 1/2 begitu salah satunya ditaklukkan, lalu lanjut ke
// grup berikutnya (Baron 0/1, dst). Kalau semua misi N5 tuntas → total/total.
export function getActiveMissionProgress(): { done: number; total: number } {
  const m = getConquery();
  const group = RANK_MISSIONS.find((g) => g.scripts.some((k) => !m[k]));
  if (!group) return { done: MISSION_TOTAL, total: MISSION_TOTAL };
  return {
    done: group.scripts.filter((k) => m[k]).length,
    total: group.scripts.length,
  };
}

// Tiap kali akun aktif berubah (login, ganti akun, atau logout ke mode
// tamu — lihat AuthContext), tarik progres dari Supabase dan gabungkan
// (union/ambil yang lebih tinggi) sama yang udah kesimpen lokal buat akun
// itu di browser ini. Ini yang bikin progres tetap nyambung walau ganti
// device, tanpa nimpa progres lokal yang mungkin lebih baru (misal sempat
// main offline).
onProgressAccountChange((userId) => {
  if (!userId) return; // logout / mode tamu — gak ada yang perlu ditarik
  fetchProgressRow(userId).then((row) => {
    if (!row) return;

    const localRank = getRankIndex();
    const remoteRank = row.rank_index ?? 0;
    const mergedRank = Math.min(
      Math.max(localRank, remoteRank),
      MAX_UNLOCKED_RANK,
    );
    if (mergedRank !== localRank) {
      localStorage.setItem(scopedKey(RANK_KEY), String(mergedRank));
    }

    const remoteConquery = row.conquery ?? {};
    const localConquery = getConquery();
    const mergedConquery = { ...remoteConquery, ...localConquery };
    localStorage.setItem(scopedKey(ConquerY_KEY), JSON.stringify(mergedConquery));

    window.dispatchEvent(new Event(RANK_EVENT));

    // dorong balik ke server kalau lokal ternyata lebih maju
    const conqueryGrew =
      Object.keys(mergedConquery).length > Object.keys(remoteConquery).length;
    if (mergedRank > remoteRank || conqueryGrew) {
      pushProgressPatch({ rank_index: mergedRank, conquery: mergedConquery });
    }
  });
});
