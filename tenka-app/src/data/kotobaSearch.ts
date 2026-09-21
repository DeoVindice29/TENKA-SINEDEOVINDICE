import { KOTOBA_N5_LEARN, KOTOBA_TIER_GROUPS } from "./kotobaN5";
import type { Bilingual, KotobaEntry } from "./types";

/**
 * Indeks pencarian Kotoba di level DATA (bukan DOM).
 *
 * Panel accordion Kotoba sekarang di-mount malas (lihat LearnAccordion), jadi
 * kartu yang Chapter-nya masih tertutup tidak ada di DOM sama sekali. Kalau
 * pencarian tetap baca DOM seperti dulu, kata di Chapter tertutup tidak akan
 * pernah ketemu. Jadi hitungan cocok/tidak untuk Kotoba dihitung dari array
 * datanya, lalu hasilnya dipakai untuk membuka Chapter yang relevan.
 *
 * Indeksnya dibangun malas (saat pencarian pertama) supaya membuka tab Kotoba
 * sendiri tidak membayar biaya apa pun.
 */

type Lang = "en" | "id";

function tf(entry: Bilingual | string | null | undefined, lang: Lang): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return entry[lang] || entry.en || entry.id || "";
}

/** Teks yang sama dengan yang dirender VocabList, supaya hasilnya identik. */
function entryText(entry: KotobaEntry, lang: Lang): string {
  const [
    word,
    reading,
    meaning,
    example,
    segments,
    translation,
    kanjiWord,
    kanjiExample,
    usage,
  ] = entry;

  const segText = Array.isArray(segments)
    ? segments.map(([seg, rom]) => `${seg} ${rom}`).join(" ")
    : "";

  return [
    kanjiWord,
    word,
    reading,
    tf(meaning, lang),
    tf(usage, lang),
    kanjiExample,
    example,
    segText,
    tf(translation, lang),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** tierKey -> teks tiap kartu (urutannya sama dengan KOTOBA_N5_LEARN[].items) */
const cache: Partial<Record<Lang, Record<string, string[]>>> = {};

function getIndex(lang: Lang): Record<string, string[]> {
  const hit = cache[lang];
  if (hit) return hit;
  const built: Record<string, string[]> = {};
  KOTOBA_N5_LEARN.forEach((section) => {
    built[section.tierKey] = section.items.map((item) =>
      entryText(item, lang),
    );
  });
  cache[lang] = built;
  return built;
}

export type KotobaSearchResult = {
  /** total kartu yang cocok di seluruh Kotoba */
  total: number;
  /** tierKey -> jumlah kartu yang cocok */
  perTier: Record<string, number>;
  /** id grup (grp1..grp8) yang punya minimal satu kartu cocok */
  groupIds: string[];
};

export function searchKotoba(query: string, lang: Lang): KotobaSearchResult {
  const q = query.trim().toLowerCase();
  const index = getIndex(lang);

  const perTier: Record<string, number> = {};
  let total = 0;

  KOTOBA_N5_LEARN.forEach((section) => {
    const texts = index[section.tierKey] ?? [];
    const n = q ? texts.reduce((acc, t) => acc + (t.includes(q) ? 1 : 0), 0)
                : texts.length;
    perTier[section.tierKey] = n;
    total += n;
  });

  const groupIds: string[] = [];
  if (q) {
    KOTOBA_TIER_GROUPS.forEach((g) => {
      if (g.tierKeys.some((tk) => (perTier[tk] ?? 0) > 0)) groupIds.push(g.id);
    });
  }

  return { total, perTier, groupIds };
}

/** id section stabil, dipakai chip navigasi & jumpToSection */
export function kotobaSectionId(tierKey: string): string {
  return `learn-sec-kotoba-${tierKey}`;
}
