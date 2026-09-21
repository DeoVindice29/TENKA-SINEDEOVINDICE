import { shuffle } from "./shuffle";

// entry format: [soal, jawaban, ...extra]
export type QuizPair = readonly [string, string, ...unknown[]];

export function buildChoices(
  correct: QuizPair,
  pool: QuizPair[] | readonly QuizPair[],
  count = 4,
): string[] {
  const wrongPool = pool.filter((p) => p[0] !== correct[0]);

  // hilangkan duplikat jawaban (mis. dua kanji beda yg kebetulan sama bacaannya)
  const uniqueWrongs = [
    ...new Map(wrongPool.map((p) => [p[1], p])).values(),
  ].filter((p) => p[1] !== correct[1]);

  const wrongs = shuffle(uniqueWrongs)
    .slice(0, count - 1)
    .map((p) => p[1]);
  return shuffle([correct[1], ...wrongs]);
}
