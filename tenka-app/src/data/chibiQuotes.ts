// Kutipan si chibi di header popup Misi Pangkat. Tiap kali popup dibuka,
// dipilih satu secara acak (gak pernah sama dua kali berturut-turut). Tiap
// kutipan punya ekspresi chibi sendiri — nama file di src/assets/chibi/,
// tanpa ekstensi. Teksnya ada di I18N.ts (guide.quote.N), en + id.

export type ChibiQuote = {
  /** kunci i18n teks kutipan */
  messageKey: string;
  /** nama file ekspresi chibi (tanpa ekstensi) */
  expression: string;
};

export const CHIBI_QUOTES: ChibiQuote[] = [
  { messageKey: "guide.quote.0", expression: "its-time" },
  { messageKey: "guide.quote.1", expression: "spirit" },
  { messageKey: "guide.quote.2", expression: "write" },
  { messageKey: "guide.quote.3", expression: "proud" },
  { messageKey: "guide.quote.4", expression: "thinking" },
  { messageKey: "guide.quote.5", expression: "ready" },
  { messageKey: "guide.quote.6", expression: "drink" },
  { messageKey: "guide.quote.7", expression: "cute" },
  { messageKey: "guide.quote.8", expression: "nerd" },
  { messageKey: "guide.quote.9", expression: "happy" },
  { messageKey: "guide.quote.10", expression: "impressed" },
  { messageKey: "guide.quote.11", expression: "pointing" },
  { messageKey: "guide.quote.12", expression: "rest" },
  { messageKey: "guide.quote.13", expression: "love" },
  { messageKey: "guide.quote.14", expression: "celebrate" },
];

/**
 * Pilih kutipan acak. `prev` = index kutipan sebelumnya (dihindari supaya
 * tiap dibuka pasti ganti). Index terakhir (= CHIBI_QUOTES.length) dipakai
 * untuk kutipan kontekstual sesuai progres misi (lihat pickGuideMood), jadi
 * kadang si chibi ngomong soal misi yang sedang dikerjakan.
 */
export function pickQuoteIndex(prev: number | null): number {
  const total = CHIBI_QUOTES.length + 1;
  let next = Math.floor(Math.random() * total);
  if (prev !== null && total > 1 && next === prev) {
    next = (next + 1 + Math.floor(Math.random() * (total - 1))) % total;
  }
  return next;
}
