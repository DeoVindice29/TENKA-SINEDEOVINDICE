import type { Bilingual } from "@/data/types";

// Format VocabList: [kana, romaji, meaning, example, segments, translation, kanjiWord, kanjiExample, usage]
export type VocabItem = [
  string,
  string,
  Bilingual,
  string,
  [string, string][],
  Bilingual,
  string,
  string,
  Bilingual | "",
];
