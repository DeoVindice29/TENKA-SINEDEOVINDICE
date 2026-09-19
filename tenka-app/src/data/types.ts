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

// [pattern, example, meaning, segments, blankVersion, exampleTranslation]
export type BunpoEntry = readonly [
  string,
  string,
  Bilingual,
  readonly [string, string][],
  string,
  Bilingual
];

export type BunpoLearnSection = {
  tierKey: string;
  title: Bilingual;
  desc: Bilingual;
  items: BunpoEntry[];
};