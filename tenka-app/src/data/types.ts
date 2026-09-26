export type Bilingual = { en: string; id: string };

// [kanji, reading, meaning, kana]
export type KanjiEntry = readonly [string, string, Bilingual, string];

// [kana, romaji, meaning, example, segments, exampleTranslation, kanjiWord, kanjiExample, usage]
export type KotobaEntry = readonly [
  string,
  string,
  Bilingual,
  string,
  readonly [string, string][],
  Bilingual,
  string,
  string,
  Bilingual | "",
];

// [kana, romaji]
export type KanaEntry = readonly [string, string];

export type KotobaLearnSection = {
  tierKey: string;
  title: Bilingual;
  desc: Bilingual;
  items: KotobaEntry[];
  categoryRuns?: { label: Bilingual; start: number; count: number }[] | null;
};

// [pattern, example, meaning, segments, blankVersion, exampleTranslation, usageNote]
export type BunpoEntry = readonly [
  string,
  string,
  Bilingual,
  readonly [string, string][],
  string,
  Bilingual,
  (Bilingual | "")?
];

export type BunpoLearnSection = {
  tierKey: string;
  title: Bilingual;
  desc: Bilingual;
  items: BunpoEntry[];
};

export type VerbFormKey = "masu" | "te" | "nai" | "ta" | "naide";

export type VerbForms = Record<VerbFormKey, string>;

// Kata kerja N5 + seluruh bentuk konjugasinya, dipakai soal "tebak konjugasi"
// (Penaklukan Bunpō Tier 3). Kalimat & pilihan semuanya hiragana murni,
// selaras dengan gaya kalimat "blank" (....) yang dipakai BunpoEntry.
export type VerbConjugationEntry = {
  /** id unik — perlu karena ada homofon beda kanji (きる = 着る / 切る) */
  id: string;
  kana: string;
  kanji: string;
  type: "godan" | "ichidan" | "irregular";
  meaning: Bilingual;
  forms: VerbForms;
  /** kalimat hiragana dengan "..." di posisi kata kerja yang dikonjugasi */
  sentence: string;
  /** bentuk mana yang benar buat kalimat ini */
  target: VerbFormKey;
  translation: Bilingual;
};