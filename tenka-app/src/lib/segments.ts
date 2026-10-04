import type { SegmentPair } from "@/lib/contentTypes";
import { KOTOBA_N5_CHAPTERS } from "@/data/kotobaN5";
import { BUNPO_N5_CHAPTERS } from "@/data/bunpoN5";

export function segmentsToInput(segments: SegmentPair[] | null | undefined): string {
  if (!segments || segments.length === 0) return "";
  return segments.map(([kana, romaji]) => `${kana}|${romaji}`).join("\n");
}

// ---------------------------------------------------------------- auto-segmentasi
// Fitur: bikin segments otomatis dari "Kalimat Jepang" (kana) yang diketik
// admin, jadi field Segments manual gak perlu diisi lagi. Kalimat dipecah
// per spasi jadi "kata", lalu akhiran umum (partikel は/を/に, kopula です/ます
// dst) dipisah dari ujung tiap kata. Potongan yang persis sama dengan kana
// kosakata yang lagi diinput pakai romaji yang sudah diketik admin (biar
// akurat & konsisten sama data lama), potongan lain diromanisasi otomatis
// mora-per-mora (gaya wāpuro sederhana, tanpa macron — cocok sama konvensi
// romaji yang sudah dipakai di seed data, mis. がっこう -> gakkou).

const YOON: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  ぢゃ: "ja", ぢゅ: "ju", ぢょ: "jo",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
};

const KANA: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", ゐ: "i", ゑ: "e", を: "o",
  ん: "n",
};

// partikel yang bacaannya beda waktu dipakai sebagai partikel (bukan bagian kata)
const PARTICLE_READING: Record<string, string> = { は: "wa", へ: "e", を: "o" };

// Gabungan partikel yang bacaannya beda dari mora-per-mora (は dibaca "wa").
const COMPOUND_READING: Record<string, string> = {
  では: "dewa", とは: "towa", には: "niwa", へは: "ewa", からは: "karawa",
  ではありません: "dewaarimasen", ではない: "dewanai",
};

/**
 * Kata yang SELALU dibiarkan utuh (gak dipecah akhirannya), walaupun ujungnya
 * mirip partikel. Kalau ada kata yang masih salah pecah, tinggal tambahin di
 * sini — cukup satu baris: kana → romaji.
 */
export const KEEP_WHOLE: Record<string, string> = {
  でも: "demo",
  だから: "dakara",
  ですから: "desukara",
  それから: "sorekara",
  いつも: "itsumo",
  なに: "nani",
  ございます: "gozaimasu",
  ございました: "gozaimashita",
};

// Kamus kata dari data yang sudah ada (kotoba + contoh bunpō): tiap kata &
// segmen yang pernah dipakai, lengkap dengan romaji-nya. Dipakai buat
// ngenalin kata utuh kayak ひと / もの / しごと biar gak dipotong jadi
// ひ+と / も+の / しご+と cuma karena ujungnya kebetulan mirip partikel.
let lexiconCache: Map<string, string> | null = null;

function getLexicon(): Map<string, string> {
  if (lexiconCache) return lexiconCache;
  const lex = new Map<string, string>();
  const add = (kana: string, romaji: string) => {
    if (!kana || !romaji || lex.has(kana)) return;
    lex.set(kana, romaji.charAt(0).toLowerCase() + romaji.slice(1));
  };
  // Segmen dari contoh kalimat kadang sudah "nempel" partikel (mis. これは);
  // yang ujungnya mirip partikel jangan dimasukin, biar gak menghalangi
  // pemisahan. Kata utama (headword) tetap masuk apa adanya (ひと, しごと).
  const endsLikeParticle = (k: string) => k.length > 1 && /[はがをにでとものへねよか]$/.test(k);
  for (const chapter of KOTOBA_N5_CHAPTERS) {
    for (const e of chapter) {
      add(e[0], e[1]); // kata utama (kana + romaji-nya)
      for (const [k, r] of e[4] ?? []) if (!endsLikeParticle(k)) add(k, r);
    }
  }
  for (const chapter of BUNPO_N5_CHAPTERS) {
    for (const e of chapter) {
      for (const [k, r] of e[3] ?? []) if (!endsLikeParticle(k)) add(k, r);
    }
  }
  lexiconCache = lex;
  return lex;
}

function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** Romanisasi mora-per-mora sederhana (gaya wāpuro, tanpa macron). */
export function kanaToRomaji(input: string): string {
  const text = katakanaToHiragana(input);
  let out = "";
  let sokuon = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const pair = text.slice(i, i + 2);

    if (ch === "っ") {
      sokuon = true;
      continue;
    }
    if (ch === "ー") {
      const lastVowel = out.slice(-1);
      if ("aiueo".includes(lastVowel)) out += lastVowel;
      continue;
    }
    if (YOON[pair]) {
      let syll = YOON[pair];
      if (sokuon) {
        syll = syll[0] + syll;
        sokuon = false;
      }
      out += syll;
      i += 1;
      continue;
    }
    if (KANA[ch]) {
      let syll = KANA[ch];
      if (sokuon) {
        syll = syll[0] + syll;
        sokuon = false;
      }
      out += syll;
      continue;
    }
    // karakter gak dikenal (tanda baca, dll) — lewati aja
    sokuon = false;
  }

  return out;
}

function stripTrailingPunctuation(word: string): string {
  return word.replace(/[。、！？!?…～~・]+$/g, "");
}

// Penanda batas kata di form admin: "/" (atau "／", "|", "｜") — mudah diketik
// tanpa ganti keyboard. Spasi biasa tetap dianggap batas juga (kebiasaan
// lama). Penandanya cuma buat admin: waktu disimpan, semuanya dibuang dari
// kalimat, jadi di layar kalimatnya rapat tanpa spasi/garis miring.
const BOUNDARY_CHARS = /[\s/／|｜]+/;
const BOUNDARY_CHARS_G = /[\s/／|｜]+/g;

/** Kalimat bersih buat disimpan & ditampilkan: semua penanda batas dibuang. */
export function cleanExample(example: string): string {
  return example.replace(BOUNDARY_CHARS_G, "");
}

/**
 * Kebalikannya, buat ngisi ulang form saat edit: sisipin "/" di antara kata
 * berdasarkan segments yang tersimpan. Kalau segments gak cocok sama kalimat,
 * kalimat dikembalikan apa adanya.
 */
export function markExample(
  example: string,
  segments: readonly (readonly [string, string])[] | null | undefined,
): string {
  const plain = cleanExample(example ?? "");
  if (!segments || segments.length === 0) return plain;
  const tokens: string[] = [];
  let pos = 0;
  for (const [kana] of segments) {
    const idx = plain.indexOf(kana, pos);
    if (idx === -1) return plain;
    const gap = plain.slice(pos, idx); // tanda baca di antara kata
    if (gap) {
      if (tokens.length) tokens[tokens.length - 1] += gap;
      else tokens.push(gap);
    }
    tokens.push(kana);
    pos = idx + kana.length;
  }
  const rest = plain.slice(pos);
  if (rest) tokens[tokens.length - 1] += rest;
  return tokens.join("/");
}

function readingOf(piece: string, lex: Map<string, string>): string {
  return (
    KEEP_WHOLE[piece] ??
    COMPOUND_READING[piece] ??
    PARTICLE_READING[piece] ??
    lex.get(piece) ??
    kanaToRomaji(piece)
  );
}

/**
 * Bikin segments otomatis dari kalimat contoh (kana). Dipecah per penanda
 * (/ atau spasi) jadi "kata", lalu akhiran umum (partikel, です/ます, dst) dilepas dari ujung
 * tiap kata — KECUALI kata itu memang utuh: gabungan partikel (では, とは),
 * kata di KEEP_WHOLE, atau kata yang sudah ada di data (ひと, もの, しごと).
 * Romaji diambil dari kata yang lagi diinput, lalu dari data yang sudah ada,
 * baru diromanisasi otomatis.
 */
export function autoSegmentExample(example: string, entryKana: string, entryRomaji: string): SegmentPair[] {
  const segments: SegmentPair[] = [];
  const lex = getLexicon();
  const words = example.split(BOUNDARY_CHARS).filter(Boolean);

  // Gak ada pemecahan otomatis: tiap potongan hasil "/" atau spasi jadi satu
  // segmen apa adanya (ございます, わかりません, dst tetap utuh). Mau dipisah?
  // Kasih "/" sendiri di form admin.
  for (const raw of words) {
    const word = stripTrailingPunctuation(raw);
    if (!word) continue;
    if (entryKana && entryRomaji && word === entryKana) {
      segments.push([word, entryRomaji]);
    } else {
      segments.push([word, readingOf(word, lex)]);
    }
  }

  return segments;
}
