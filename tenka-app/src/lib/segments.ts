import type { SegmentPair } from "@/lib/contentTypes";

/**
 * Format input manual di form admin: satu baris per kata, dipisah "|".
 *   わたし|watashi
 *   は|wa
 *   がくせい|gakusei
 * Baris yang gak punya "|" atau kosong, dilewatin aja (gak bikin error),
 * biar gak ribet — sesuai kesepakatan: input manual apa adanya, gak usah
 * auto-split dari kalimat.
 */
export function parseSegmentsInput(text: string): SegmentPair[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf("|");
      if (idx === -1) return null;
      const kana = line.slice(0, idx).trim();
      const romaji = line.slice(idx + 1).trim();
      if (!kana || !romaji) return null;
      return [kana, romaji] as SegmentPair;
    })
    .filter((seg): seg is SegmentPair => seg !== null);
}

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

// akhiran umum yang biasa "nempel" di ujung kata dalam kalimat contoh, dicek
// dari yang paling panjang biar gak salah potong (mis. "ではありません" harus
// ke-detect duluan sebelum "は" sendirian).
const DETACHABLE_SUFFIXES = [
  "ではありません", "じゃありません", "ませんでした",
  "でした", "ません", "ました", "じゃない", "ではない",
  "だった", "です", "ます", "だ",
  "から", "まで", "より", "とは", "には", "では",
  "は", "が", "を", "に", "で", "と", "も", "や", "の", "へ", "ね", "よ", "か",
];

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

/**
 * Bikin segments otomatis dari kalimat contoh (kana). Dipecah per spasi jadi
 * "kata", lalu akhiran umum (partikel, です/ます, dst) dilepas dari ujung
 * tiap kata. Potongan yang persis sama dengan kana kosakata yang lagi
 * diinput dapet romaji yang sudah diketik admin; potongan lain diromanisasi
 * otomatis.
 */
export function autoSegmentExample(example: string, entryKana: string, entryRomaji: string): SegmentPair[] {
  const segments: SegmentPair[] = [];
  const words = example.trim().split(/\s+/).filter(Boolean);

  for (const raw of words) {
    const word = stripTrailingPunctuation(raw);
    if (!word) continue;

    const suffixes: string[] = [];
    let stem = word;
    let changed = true;
    while (changed) {
      changed = false;
      for (const suf of DETACHABLE_SUFFIXES) {
        if (stem.length > suf.length && stem.endsWith(suf)) {
          suffixes.unshift(suf);
          stem = stem.slice(0, stem.length - suf.length);
          changed = true;
          break;
        }
      }
    }

    if (stem) {
      if (entryKana && entryRomaji && stem === entryKana) {
        segments.push([stem, entryRomaji]);
      } else if (PARTICLE_READING[stem]) {
        segments.push([stem, PARTICLE_READING[stem]]);
      } else {
        segments.push([stem, kanaToRomaji(stem)]);
      }
    }
    for (const suf of suffixes) {
      segments.push([suf, PARTICLE_READING[suf] ?? kanaToRomaji(suf)]);
    }
  }

  return segments;
}
