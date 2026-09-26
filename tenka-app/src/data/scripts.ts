export type ScriptKey = "hiragana" | "katakana" | "kanji" | "kotoba" | "bunpo";

import type { Bilingual } from "./types";

function tf(entry: Bilingual | string | null | undefined): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return entry.en || "";
}

function primaryReading(str: string): string {
  return str.includes(" / ") ? str.split(" / ")[0].trim() : str;
}

import {
  HIRAGANA_TIER1,
  HIRAGANA_TIER2,
  HIRAGANA_TIER3,
  HIRAGANA_SOKUON_WORDS,
  HIRAGANA_CHOON_WORDS,
  HIRAGANA_HATSUON_WORDS,
  GOJUON_HIRAGANA,
} from "./hiragana";

import {
  KATAKANA_TIER1,
  KATAKANA_TIER2,
  KATAKANA_TIER3,
  GOJUON_KATAKANA,
  KATAKANA_SOKUON_WORDS,
  KATAKANA_CHOONPU_WORDS,
  KATAKANA_HATSUON_WORDS,
  KATAKANA_TOKUSHUON_W_WORDS,
  KATAKANA_TOKUSHUON_F_WORDS,
  KATAKANA_TOKUSHUON_V_WORDS,
  KATAKANA_TOKUSHUON_TD_WORDS,
  KATAKANA_TOKUSHUON_SHCHJ_WORDS,
  KATAKANA_TOKUSHUON_TS_WORDS,
  KATAKANA_TOKUSHUON_OTHER_WORDS,
} from "./katakana";

import {
  KANJI_N5_CHAPTERS,
  KANJI_N5_CH1,
  KANJI_N5_CH2,
  KANJI_N5_CH3,
  KANJI_N5_CH4,
  KANJI_N5_CH5,
  KANJI_N5_CH6,
  KANJI_N5_CH7,
  KANJI_N5_CH8,
  KANJI_N5_CH9,
  KANJI_READING,
  KANJI_TIER_KEYS,
  KANJI_LEVEL_META,
} from "./kanjiN5";

import {
  KOTOBA_N5_CHAPTERS,
  KOTOBA_N5_LEVEL_TEXT,
  KOTOBA_N5_LEARN,
  KOTOBA_TIER_KEYS,
  KOTOBA_TIER_GROUPS,
  KOTOBA_N5_LEVEL_META,
} from "./kotobaN5";

import {
  BUNPO_N5_CHAPTERS,
  BUNPO_N5_LEVEL_TEXT,
  BUNPO_N5_LEARN,
  BUNPO_N5_TIER_KEYS,
  BUNPO_N5_LEVEL_META,
} from "./bunpoN5";

// Total kanji dihitung dari datanya, dipakai di deskripsi kartu "All Mixed".
const KANJI_N5_TOTAL = KANJI_N5_CHAPTERS.reduce((sum, c) => sum + c.length, 0);

export const SCRIPTS = {
  hiragana: {
    key: "hiragana",
    label: "Hiragana",
    tabGlyph: "あ",
    quizType: "romaji",
    quizLabelKey: "quiz.guessRomaji",
    data: {
      tier1: HIRAGANA_TIER1,
      tier2: HIRAGANA_TIER2,
      tier3: HIRAGANA_TIER3,
    },
    levelText: {
      tier1: {
        title: { en: "Basic", id: "Dasar" },
        type: { en: "Gojūon", id: "Gojūon" },
        sample: "あ い う",
        desc: {
          en: "Gojūon — the 46 core characters from a to n.",
          id: "Gojūon — 46 karakter inti dari a sampai n.",
        },
      },
      tier2: {
        title: { en: "Dotted", id: "Bertitik" },
        type: { en: "Dakuten & Handakuten", id: "Dakuten & Handakuten" },
        sample: "が ざ ぱ",
        desc: {
          en: "Dakuten & handakuten: ga, za, da, ba, pa.",
          id: "Dakuten & handakuten: ga, za, da, ba, pa.",
        },
      },
      tier3: {
        title: { en: "Combined", id: "Gabungan" },
        type: { en: "Yōon", id: "Yōon" },
        sample: "きゃ しゅ",
        desc: {
          en: "Yōon — small combinations like kya, sha, cho.",
          id: "Yōon — kombinasi kecil seperti kya, sha, cho.",
        },
      },
      all: {
        title: { en: "All Mixed", id: "seluruh Campur" },
        type: { en: "Mixed", id: "Campuran" },
        sample: "ん づ りょ",
        desc: {
          en: "All hiragana characters shuffled into one Chapter.",
          id: "Seluruh karakter hiragana diacak menjadi satu Chapter.",
        },
      },
    },
    learnSections: [
      {
        tierKey: "tier1",
        title: { en: "Gojūon — Basic", id: "Gojūon — Dasar" },
        desc: {
          en: "The 46 core characters. This is the foundation you need to memorize first.",
          id: "46 karakter inti. Ini fondasi yang wajib dihafal duluan.",
        },
        rows: GOJUON_HIRAGANA.tier1,
      },
      {
        tierKey: "tier2",
        title: {
          en: "Dakuten & Handakuten — Dotted",
          id: "Dakuten & Handakuten — Bertitik",
        },
        desc: {
          en: "A double mark (゛) or small circle (゜) changes how the character is read.",
          id: "Tanda titik dua (゛) atau lingkaran kecil (゜) mengubah cara baca.",
        },
        rows: GOJUON_HIRAGANA.tier2,
      },
      {
        tierKey: "tier3",
        title: { en: "Yōon — Combined", id: "Yōon — Gabungan" },
        desc: {
          en: "A consonant + small ゃゅょ, read together as one syllable.",
          id: "Konsonan + ゃゅょ kecil yang dibaca sebagai satu suku kata.",
        },
        rows: GOJUON_HIRAGANA.tier3,
      },
      {
        tierKey: "sokuon",
        title: { en: "Sokuon — Small っ", id: "Sokuon — っ Kecil" },
        desc: {
          en: "A small っ before a consonant means a short held pause — double that consonant when reading it, e.g. がっこう (gakkou), きって (kitte).",
          id: "っ kecil sebelum konsonan berarti jeda singkat — konsonan berikutnya dibaca ganda, contoh: がっこう (gakkou), きって (kitte).",
        },
        items: HIRAGANA_SOKUON_WORDS,
      },
      {
        tierKey: "choon",
        title: { en: "Chōon — Long Vowel", id: "Chōon — Vokal Panjang" },
        desc: {
          en: "A long vowel sound made by doubling the vowel. The a/i/u rows usually double the same kana; the e/o rows usually lengthen with い / う instead, e.g. おかあさん (okaasan), おにいさん (oniisan), くうき (kuuki), せんせい (sensei), とうきょう (toukyou).",
          id: "Bunyi vokal panjang yang dibuat dengan menggandakan vokalnya. Baris a/i/u biasanya menggandakan kana yang sama; baris e/o biasanya dipanjangkan dengan い / う, contoh: おかあさん (okaasan), おにいさん (oniisan), くうき (kuuki), せんせい (sensei), とうきょう (toukyou).",
        },
        items: HIRAGANA_CHOON_WORDS,
      },
      {
        tierKey: "hatsuon",
        title: { en: "Hatsuon — Nasal ん", id: "Hatsuon — ん Nasal" },
        desc: {
          en: 'ん shifts its sound depending on what comes right after it — like "m" before m/b/p, like "n" before n/t/d/s/z/r, like "ng" before k/g, and a plain nasalized n before a vowel/y/w or at the end of a word.',
          id: 'ん berubah bunyinya tergantung huruf sesudahnya — seperti "m" sebelum m/b/p, seperti "n" sebelum n/t/d/s/z/r, seperti "ng" sebelum k/g, dan tetap bunyi n nasal biasa sebelum vokal/y/w atau di akhir kata.',
        },
        items: HIRAGANA_HATSUON_WORDS,
      },
    ],
  },
  katakana: {
    key: "katakana",
    label: "Katakana",
    tabGlyph: "ア",
    quizType: "romaji",
    quizLabelKey: "quiz.guessRomaji",
    data: {
      tier1: KATAKANA_TIER1,
      tier2: KATAKANA_TIER2,
      tier3: KATAKANA_TIER3,
    },
    levelText: {
      tier1: {
        title: { en: "Basic", id: "Dasar" },
        type: { en: "Gojūon", id: "Gojūon" },
        sample: "ア イ ウ",
        desc: {
          en: "The 46 core katakana characters, from a to n.",
          id: "46 karakter inti katakana, dari a sampai n.",
        },
      },
      tier2: {
        title: { en: "Dotted", id: "Bertitik" },
        type: { en: "Dakuten & Handakuten", id: "Dakuten & Handakuten" },
        sample: "ガ ザ パ",
        desc: {
          en: "Katakana dakuten & handakuten: ga, za, da, ba, pa.",
          id: "Dakuten & handakuten katakana: ga, za, da, ba, pa.",
        },
      },
      tier3: {
        title: { en: "Combined", id: "Gabungan" },
        type: { en: "Yōon", id: "Yōon" },
        sample: "キャ シュ",
        desc: {
          en: "Katakana yōon — small combinations like kya, sha, cho.",
          id: "Yōon katakana — kombinasi kecil seperti kya, sha, cho.",
        },
      },
      all: {
        title: { en: "All Mixed", id: "seluruh Campur" },
        type: { en: "Mixed", id: "Campuran" },
        sample: "ン ヅ リョ",
        desc: {
          en: "All katakana characters shuffled into one Chapter.",
          id: "Seluruh karakter katakana diacak menjadi satu Chapter.",
        },
      },
    },
    learnSections: [
      {
        tierKey: "tier1",
        title: { en: "Gojūon — Basic", id: "Gojūon — Dasar" },
        desc: {
          en: "The 46 core katakana characters, mostly used for loanwords and foreign names.",
          id: "46 karakter inti katakana, biasanya dipakai untuk kata serapan asing dan nama.",
        },
        rows: GOJUON_KATAKANA.tier1,
      },
      {
        tierKey: "tier2",
        title: {
          en: "Dakuten & Handakuten — Dotted",
          id: "Dakuten & Handakuten — Bertitik",
        },
        desc: {
          en: "Just like hiragana, the dot marks change how the consonant is read.",
          id: "Sama seperti hiragana, tanda titik mengubah cara baca konsonannya.",
        },
        rows: GOJUON_KATAKANA.tier2,
      },
      {
        tierKey: "tier3",
        title: { en: "Yōon — Combined", id: "Yōon — Gabungan" },
        desc: {
          en: "A consonant + small ャュョ, read together as one syllable.",
          id: "Konsonan + ャュョ kecil, dibaca sebagai satu suku kata.",
        },
        rows: GOJUON_KATAKANA.tier3,
      },
      {
        tierKey: "sokuon",
        title: { en: "Sokuon — Small ッ", id: "Sokuon — ッ Kecil" },
        desc: {
          en: "A small ッ before a consonant means a short held pause — double that consonant when reading it, e.g. サッカー (sakkaa), ポケット (poketto). Very common in loanwords.",
          id: "ッ kecil sebelum konsonan berarti jeda singkat — konsonan berikutnya dibaca ganda, contoh: サッカー (sakkaa), ポケット (poketto). Sangat umum di kata serapan asing.",
        },
        items: KATAKANA_SOKUON_WORDS,
      },
      {
        tierKey: "choonpu",
        title: {
          en: "Chōonpu — Long Vowel Mark",
          id: "Chōonpu — Tanda Vokal Panjang",
        },
        desc: {
          en: "The dash ー lengthens the vowel that comes right before it — unlike hiragana, katakana doesn't double the vowel kana, e.g. コーヒー (koohii), ケーキ (keeki). Extremely common in loanwords.",
          id: "Tanda garis ー memanjangkan vokal tepat sebelumnya — berbeda dari hiragana, katakana tidak menggandakan kana vokalnya, contoh: コーヒー (koohii), ケーキ (keeki). Sangat umum di kata serapan asing.",
        },
        items: KATAKANA_CHOONPU_WORDS,
      },
      {
        tierKey: "hatsuon",
        title: { en: "Hatsuon — Nasal ン", id: "Hatsuon — ン Nasal" },
        desc: {
          en: 'ン shifts its sound depending on what comes right after it — like "m" before p/b/m, like "n" before n/t/d/s/z/r, like "ng" before k/g, and a plain nasalized n before a vowel/y/w or at the end of a word.',
          id: 'ン berubah bunyinya tergantung huruf sesudahnya — seperti "m" sebelum p/b/m, seperti "n" sebelum n/t/d/s/z/r, seperti "ng" sebelum k/g, dan tetap bunyi n nasal biasa sebelum vokal/y/w atau di akhir kata.',
        },
        items: KATAKANA_HATSUON_WORDS,
      },
      {
        tierKey: "tokushuonW",
        title: { en: "Tokushuon — W", id: "Tokushuon — W" },
        desc: {
          en: 'Extended katakana invented to write foreign sounds — ウ + small ィ/ェ/ォ for the "wi/we/wo" sounds, distinct from the plain わ/を, e.g. ウィスキー (wisukii), ウェブ (webu), ウォーキング (wookingu).',
          id: 'Katakana tambahan yang dibuat untuk menulis bunyi asing — ウ + ィ/ェ/ォ kecil untuk bunyi "wi/we/wo", berbeda dari わ/を biasa, contoh: ウィスキー (wisukii), ウェブ (webu), ウォーキング (wookingu).',
        },
        items: KATAKANA_TOKUSHUON_W_WORDS,
      },
      {
        tierKey: "tokushuonF",
        title: { en: "Tokushuon — F", id: "Tokushuon — F" },
        desc: {
          en: 'Extended katakana invented to write foreign sounds — フ + small ァ/ィ/ェ/ォ for the "fa/fi/fe/fo" sounds that plain フ (fu) alone can\'t show, e.g. ファミリー (famirii), フィルム (firumu), カフェ (kafe), フォーク (fooku).',
          id: 'Katakana tambahan yang dibuat untuk menulis bunyi asing — フ + ァ/ィ/ェ/ォ kecil untuk bunyi "fa/fi/fe/fo" yang tidak bisa ditunjukkan フ (fu) biasa, contoh: ファミリー (famirii), フィルム (firumu), カフェ (kafe), フォーク (fooku).',
        },
        items: KATAKANA_TOKUSHUON_F_WORDS,
      },
      {
        tierKey: "tokushuonV",
        title: { en: "Tokushuon — V", id: "Tokushuon — V" },
        desc: {
          en: 'Extended katakana invented to write foreign sounds — ヴ (u + dakuten) + small ァ/ィ/ェ/ォ for the "va/vi/ve/vo" sounds, distinct from the b-row バ/ビ/ブ/ベ/ボ, e.g. ヴァイオリン (vaiorin), ヴィーナス (viinasu), ヴェール (veeru), ヴォーカル (vookaru).',
          id: 'Katakana tambahan yang dibuat untuk menulis bunyi asing — ヴ (u + dakuten) + ァ/ィ/ェ/ォ kecil untuk bunyi "va/vi/ve/vo", berbeda dari deret b: バ/ビ/ブ/ベ/ボ, contoh: ヴァイオリン (vaiorin), ヴィーナス (viinasu), ヴェール (veeru), ヴォーカル (vookaru).',
        },
        items: KATAKANA_TOKUSHUON_V_WORDS,
      },
      {
        tierKey: "tokushuonTD",
        title: { en: "Tokushuon — T & D", id: "Tokushuon — T & D" },
        desc: {
          en: 'Extended katakana invented to write foreign sounds — テ/デ + small ィ for "ti/di" (distinct from ち/ji), and ト/ド + small ゥ for "tu/du" (distinct from つ/zu), e.g. パーティー (paatii), キャンディ (kyandi), タトゥー (tatuu), ヒンドゥー (hindu).',
          id: 'Katakana tambahan yang dibuat untuk menulis bunyi asing — テ/デ + ィ kecil untuk "ti/di" (berbeda dari ち/ji), dan ト/ド + ゥ kecil untuk "tu/du" (berbeda dari つ/zu), contoh: パーティー (paatii), キャンディ (kyandi), タトゥー (tatuu), ヒンドゥー (hindu).',
        },
        items: KATAKANA_TOKUSHUON_TD_WORDS,
      },
      {
        tierKey: "tokushuonShChJ",
        title: { en: "Tokushuon — Sh, Ch, J", id: "Tokushuon — Sh, Ch, J" },
        desc: {
          en: 'Extended katakana invented to write foreign sounds — シ/チ/ジ + small ェ for "she/che/je", distinct from せ/te/ze, e.g. シェフ (shefu), チェック (chekku), ジェットコースター (jettokoosutaa).',
          id: 'Katakana tambahan yang dibuat untuk menulis bunyi asing — シ/チ/ジ + ェ kecil untuk "she/che/je", berbeda dari せ/te/ze, contoh: シェフ (shefu), チェック (chekku), ジェットコースター (jettokoosutaa).',
        },
        items: KATAKANA_TOKUSHUON_SHCHJ_WORDS,
      },
      {
        tierKey: "tokushuonTs",
        title: { en: "Tokushuon — Ts", id: "Tokushuon — Ts" },
        desc: {
          en: 'Extended katakana invented to write foreign sounds — ツ + small ァ/ィ/ェ/ォ for "tsa/tsi/tse/tso", distinct from た/ち/せ/そ, e.g. ピッツァ (pittsua), ヴェネツィア (venetsia), ツェッペリン (tsepperin), スケルツォ (sukerutsuo).',
          id: 'Katakana tambahan yang dibuat untuk menulis bunyi asing — ツ + ァ/ィ/ェ/ォ kecil untuk "tsa/tsi/tse/tso", berbeda dari た/ち/せ/そ, contoh: ピッツァ (pittsua), ヴェネツィア (venetsia), ツェッペリン (tsepperin), スケルツォ (sukerutsuo).',
        },
        items: KATAKANA_TOKUSHUON_TS_WORDS,
      },
      {
        tierKey: "tokushuonOther",
        title: { en: "Tokushuon — Other", id: "Tokushuon — Lainnya" },
        desc: {
          en: "A mixed set of rarer extended katakana — イェ (ye), クァ/グァ (kwa/gwa), and デュ (dyu) — each distinct from its plain-kana neighbor, e.g. イェルサレム (yerusaremu), クァルテット (kwarutetto), グァテマラ (gwatemara), デュエット (dyuetto).",
          id: "Kumpulan katakana tambahan yang lebih jarang — イェ (ye), クァ/グァ (kwa/gwa), dan デュ (dyu) — masing-masing berbeda dari kana polos di sebelahnya, contoh: イェルサレム (yerusaremu), クァルテット (kwarutetto), グァテマラ (gwatemara), デュエット (dyuetto).",
        },
        items: KATAKANA_TOKUSHUON_OTHER_WORDS,
      },
    ],
  },
  kanji: {
    key: "kanji",
    label: "Kanji N5",
    tabGlyph: "漢",
    quizType: "meaning",
    quizLabelKey: "quiz.guessMeaning",
    quizLabelRomajiKey: "quiz.guessHiragana",
    hasVariants: true,
    // "kanjiForm": tipe soal ke-4 khusus Kanji N5 — kebalikan dari "romaji"/"meaning":
    // yang ditunjukkan adalah bacaan hiragana-nya (dari dataKana), dan yang harus
    // ditebak adalah kanji mana yang tepat untuk bacaan tersebut (pilihan jawabannya
    // berupa karakter kanji, bukan romaji/arti).
    // Catatan: key internal "romaji" dipertahankan (dipakai di banyak tempat di
    // QuizContext/RangePicker), tapi utk Kanji N5 isinya sekarang bacaan HIRAGANA,
    // bukan romaji — makanya label & quizLabelKey-nya "Hiragana"/"guessHiragana".
    quizLabelKeys: {
      meaning: "quiz.guessMeaning",
      romaji: "quiz.guessHiragana",
      kanjiForm: "quiz.guessKanjiForm",
    },
    extraLabelKeys: {
      meaning: "quiz.hiraganaLabel",
      romaji: "quiz.meaningLabel",
      kanjiForm: "quiz.meaningLabel",
    },
    variantButtons: [
      { key: "meaning", icon: "🈺", i18nKey: "quiz.meaning" },
      { key: "romaji", icon: "🔤", label: "Hiragana" },
      { key: "kanjiForm", icon: "🈶", i18nKey: "quiz.kanjiFormBtn" },
      { key: "both", icon: "🎲", i18nKey: "quiz.mixed" },
    ],
    // Kanji punya 9 subtier (Chapter N5, bukan lagi cuma tier1/2/3) — levelMeta
    // custom ini dipakai renderLevels() sebagai pengganti LEVEL_META global.
    tierKeys: KANJI_TIER_KEYS,
    levelMeta: KANJI_LEVEL_META,
    data: Object.fromEntries(
      KANJI_TIER_KEYS.map((tk, i) => [
        tk,
        KANJI_N5_CHAPTERS[i].map(([c, , m]) => [c, tf(m)]),
      ]),
    ),
    // Dulu ini bacaan ROMAJI (primaryReading(r)) — sekarang dipakai buat tipe
    // soal "Hiragana" di Kuis biasa, jadi isinya bacaan hiragana (elemen ke-4)
    // biar konsisten dengan Latihan Tipe Soal & Mode Penaklukan, yang juga
    // selalu pakai hiragana (bukan romaji) buat bacaan kanji.
    dataRomaji: Object.fromEntries(
      KANJI_TIER_KEYS.map((tk, i) => [
        tk,
        KANJI_N5_CHAPTERS[i].map(([c, , , k]) => [c, k]),
      ]),
    ),
    // dataKana: bacaan hiragana tiap kanji (elemen ke-4 di KANJI_N5_CH*), ditampilkan
    // sebagai furigana pendamping di feedback kuis setelah user menjawab.
    dataKana: Object.fromEntries(
      KANJI_TIER_KEYS.map((tk, i) => [
        tk,
        KANJI_N5_CHAPTERS[i].map(([c, , , k]) => [c, k]),
      ]),
    ),
    levelText: {
      tier1: {
        title: {
          en: "Chapter 1 — Numbers & Counting",
          id: "Chapter 1 — Angka & Jumlah",
        },
        sample: "一 二 十",
        desc: {
          en: `${KANJI_N5_CH1.length} kanji: numbers and counting.`,
          id: `${KANJI_N5_CH1.length} kanji: angka dan hitungan.`,
        },
      },
      tier2: {
        title: {
          en: "Chapter 2 — Nature, Elements & Weather",
          id: "Chapter 2 — Alam, Elemen & Cuaca",
        },
        sample: "日 山 天",
        desc: {
          en: `${KANJI_N5_CH2.length} kanji: nature and the elements.`,
          id: `${KANJI_N5_CH2.length} kanji: alam dan unsur-unsurnya.`,
        },
      },
      tier3: {
        title: {
          en: "Chapter 3 — Time & Seasons",
          id: "Chapter 3 — Waktu & Musim",
        },
        sample: "年 朝 夜",
        desc: {
          en: `${KANJI_N5_CH3.length} kanji: time of day and calendar words.`,
          id: `${KANJI_N5_CH3.length} kanji: waktu dalam sehari dan kalender.`,
        },
      },
      tier4: {
        title: {
          en: "Chapter 4 — Direction & Position",
          id: "Chapter 4 — Arah & Posisi",
        },
        sample: "上 東 西",
        desc: {
          en: `${KANJI_N5_CH4.length} kanji: directions and positions.`,
          id: `${KANJI_N5_CH4.length} kanji: arah dan posisi.`,
        },
      },
      tier5: {
        title: {
          en: "Chapter 5 — People, Family & Relationships",
          id: "Chapter 5 — Manusia, Keluarga & Hubungan",
        },
        sample: "人 父 友",
        desc: {
          en: `${KANJI_N5_CH5.length} kanji: people, family, and body parts.`,
          id: `${KANJI_N5_CH5.length} kanji: orang, keluarga, dan anggota tubuh.`,
        },
      },
      tier6: {
        title: {
          en: "Chapter 6 — Traits, Size & Colors",
          id: "Chapter 6 — Sifat, Ukuran & Warna",
        },
        sample: "大 高 青",
        desc: {
          en: `${KANJI_N5_CH6.length} kanji: traits, sizes, and colors.`,
          id: `${KANJI_N5_CH6.length} kanji: sifat, ukuran, dan warna.`,
        },
      },
      tier7: {
        title: {
          en: "Chapter 7 — Places, Buildings & Transportation",
          id: "Chapter 7 — Tempat, Bangunan & Transportasi",
        },
        sample: "国 駅 空",
        desc: {
          en: `${KANJI_N5_CH7.length} kanji: places, buildings, and transportation.`,
          id: `${KANJI_N5_CH7.length} kanji: tempat, bangunan, dan transportasi.`,
        },
      },
      tier8: {
        title: {
          en: "Chapter 8 — Basic Verbs & Activities",
          id: "Chapter 8 — Kata Kerja Dasar & Aktivitas",
        },
        sample: "行 見 読",
        desc: {
          en: `${KANJI_N5_CH8.length} kanji: basic everyday verbs.`,
          id: `${KANJI_N5_CH8.length} kanji: kata kerja dasar sehari-hari.`,
        },
      },
      tier9: {
        title: {
          en: "Chapter 9 — Life Concepts & More Verbs",
          id: "Chapter 9 — Konsep Kehidupan & Kata Kerja Tambahan",
        },
        sample: "買 学 花",
        desc: {
          en: `${KANJI_N5_CH9.length} kanji: everyday life concepts and more verbs.`,
          id: `${KANJI_N5_CH9.length} kanji: konsep kehidupan sehari-hari dan kata kerja tambahan.`,
        },
      },
      all: {
        title: { en: "All Mixed", id: "seluruh Campur" },
        sample: "一 学 会",
        desc: {
          en: `All ${KANJI_N5_TOTAL} N5 kanji shuffled into one Chapter.`,
          id: `Seluruh ${KANJI_N5_TOTAL} kanji N5 diacak menjadi satu Chapter.`,
        },
      },
    },
    learnCards: [
      {
        tierKey: "tier1",
        title: {
          en: "Chapter 1 — Numbers & Counting",
          id: "Chapter 1 — Angka & Jumlah",
        },
        desc: {
          en: `${KANJI_N5_CH1.length} kanji: numbers and counting.`,
          id: `${KANJI_N5_CH1.length} kanji: angka dan hitungan.`,
        },
        items: KANJI_N5_CH1,
      },
      {
        tierKey: "tier2",
        title: {
          en: "Chapter 2 — Nature, Elements & Weather",
          id: "Chapter 2 — Alam, Elemen & Cuaca",
        },
        desc: {
          en: `${KANJI_N5_CH2.length} kanji: nature and the elements.`,
          id: `${KANJI_N5_CH2.length} kanji: alam dan unsur-unsurnya.`,
        },
        items: KANJI_N5_CH2,
      },
      {
        tierKey: "tier3",
        title: {
          en: "Chapter 3 — Time & Seasons",
          id: "Chapter 3 — Waktu & Musim",
        },
        desc: {
          en: `${KANJI_N5_CH3.length} kanji: time of day and calendar words.`,
          id: `${KANJI_N5_CH3.length} kanji: waktu dalam sehari dan kalender.`,
        },
        items: KANJI_N5_CH3,
      },
      {
        tierKey: "tier4",
        title: {
          en: "Chapter 4 — Direction & Position",
          id: "Chapter 4 — Arah & Posisi",
        },
        desc: {
          en: `${KANJI_N5_CH4.length} kanji: directions and positions.`,
          id: `${KANJI_N5_CH4.length} kanji: arah dan posisi.`,
        },
        items: KANJI_N5_CH4,
      },
      {
        tierKey: "tier5",
        title: {
          en: "Chapter 5 — People, Family & Relationships",
          id: "Chapter 5 — Manusia, Keluarga & Hubungan",
        },
        desc: {
          en: `${KANJI_N5_CH5.length} kanji: people, family, and body parts.`,
          id: `${KANJI_N5_CH5.length} kanji: orang, keluarga, dan anggota tubuh.`,
        },
        items: KANJI_N5_CH5,
      },
      {
        tierKey: "tier6",
        title: {
          en: "Chapter 6 — Traits, Size & Colors",
          id: "Chapter 6 — Sifat, Ukuran & Warna",
        },
        desc: {
          en: `${KANJI_N5_CH6.length} kanji: traits, sizes, and colors.`,
          id: `${KANJI_N5_CH6.length} kanji: sifat, ukuran, dan warna.`,
        },
        items: KANJI_N5_CH6,
      },
      {
        tierKey: "tier7",
        title: {
          en: "Chapter 7 — Places, Buildings & Transportation",
          id: "Chapter 7 — Tempat, Bangunan & Transportasi",
        },
        desc: {
          en: `${KANJI_N5_CH7.length} kanji: places, buildings, and transportation.`,
          id: `${KANJI_N5_CH7.length} kanji: tempat, bangunan, dan transportasi.`,
        },
        items: KANJI_N5_CH7,
      },
      {
        tierKey: "tier8",
        title: {
          en: "Chapter 8 — Basic Verbs & Activities",
          id: "Chapter 8 — Kata Kerja Dasar & Aktivitas",
        },
        desc: {
          en: `${KANJI_N5_CH8.length} kanji: basic everyday verbs.`,
          id: `${KANJI_N5_CH8.length} kanji: kata kerja dasar sehari-hari.`,
        },
        items: KANJI_N5_CH8,
      },
      {
        tierKey: "tier9",
        title: {
          en: "Chapter 9 — Life Concepts & More Verbs",
          id: "Chapter 9 — Konsep Kehidupan & Kata Kerja Tambahan",
        },
        desc: {
          en: `${KANJI_N5_CH9.length} kanji: everyday life concepts and more verbs.`,
          id: `${KANJI_N5_CH9.length} kanji: konsep kehidupan sehari-hari dan kata kerja tambahan.`,
        },
        items: KANJI_N5_CH9,
      },
    ],
  },
  kotoba: {
    key: "kotoba",
    label: "Basic Kotoba",
    tabGlyph: "語",
    quizType: "meaning",
    quizLabelKey: "quiz.guessMeaning",
    quizLabelRomajiKey: "quiz.guessRomaji",
    hasVariants: true,
    quizLabelKeys: { meaning: "quiz.guessMeaning", romaji: "quiz.guessRomaji" },
    extraLabelKeys: {
      meaning: "quiz.romajiLabel",
      romaji: "quiz.meaningLabel",
    },
    variantButtons: [
      { key: "meaning", icon: "🈺", i18nKey: "quiz.meaning" },
      { key: "romaji", icon: "🔤", label: "Romaji" },
      { key: "both", icon: "🎲", i18nKey: "quiz.mixed" },
    ],
    // Kotoba N5 sekarang punya 7 Tier / 21 Sub-Tier (bukan lagi cuma tier1/2/3) —
    // tierKeys + levelMeta custom ini dipakai renderLevels() sebagai pengganti
    // LEVEL_META global, sama persis seperti pola yang dipakai Kanji N5 (9 Chapter)
    // & Bunpō N5 (15 Sub-Tier).
    tierKeys: KOTOBA_TIER_KEYS,
    levelMeta: KOTOBA_N5_LEVEL_META,
    // groups: dipakai renderLevels() utk nge-render 24 sub-tier di atas sebagai
    // Nested Accordion (7 Chapter + kartu "All Mixed" berdiri sendiri = 8).
    groups: KOTOBA_TIER_GROUPS,
    data: Object.fromEntries(
      KOTOBA_TIER_KEYS.map((tk, i) => [
        tk,
        KOTOBA_N5_CHAPTERS[i].map(([c, , m]) => [c, tf(m)]),
      ]),
    ),
    dataRomaji: Object.fromEntries(
      KOTOBA_TIER_KEYS.map((tk, i) => [
        tk,
        KOTOBA_N5_CHAPTERS[i].map(([c, r]) => [c, r]),
      ]),
    ),
    // dataKanji: bentuk kanji tiap kata (elemen ke-7 di KOTOBA_N5_CHAPTERS, "" kalau
    // katanya memang biasa ditulis kana saja), ditampilkan sebagai info tambahan
    // di feedback kuis setelah user menjawab.
    dataKanji: Object.fromEntries(
      KOTOBA_TIER_KEYS.map((tk, i) => [
        tk,
        KOTOBA_N5_CHAPTERS[i].map(([c, , , , , , k]) => [c, k || ""]),
      ]),
    ),
    // dataUsage: catatan singkat "cara pakai" tiap kata (elemen ke-9 di
    // KOTOBA_N5_CHAPTERS, "" kalau tidak ada catatan), ditampilkan sebagai info
    // tambahan di feedback kuis, tepat di bawah baris kanji-nya.
    dataUsage: Object.fromEntries(
      KOTOBA_TIER_KEYS.map((tk, i) => [
        tk,
        KOTOBA_N5_CHAPTERS[i].map(([c, , , , , , , , u]) => [c, tf(u)]),
      ]),
    ),
    levelText: KOTOBA_N5_LEVEL_TEXT,
    learnVocab: KOTOBA_N5_LEARN,
  },
  bunpo: {
    key: "bunpo",
    label: "Bunpō",
    tabGlyph: "文",
    quizType: "meaning",
    quizLabelKey: "quiz.guessFunction",
    // "hasVariants" + "variantMode: sentence" mengaktifkan mode soal ke-2 khusus
    // Bunpō, "Kalimat" — kebalikan dari "Fungsi": bukannya menunjukkan pola lalu
    // menebak fungsinya, di sini yang ditunjukkan adalah contoh kalimatnya, dan
    // yang harus ditebak adalah pola/partikel mana yang cocok dipakai di situ.
    hasVariants: true,
    variantMode: "sentence",
    quizLabelKeys: {
      meaning: "quiz.guessFunction",
      kalimat: "quiz.guessKalimat",
    },
    extraLabelKeys: {
      meaning: "quiz.kalimatLabel",
      kalimat: "quiz.functionLabel",
    },
    variantButtons: [
      { key: "meaning", icon: "🈺", i18nKey: "quiz.function" },
      { key: "kalimat", icon: "📝", i18nKey: "quiz.kalimat" },
      { key: "both", icon: "🎲", i18nKey: "quiz.mixed" },
    ],
    // Bunpō N5 sekarang 100 pola / 15 sub-tier (bukan 36 pola / 3 tier lagi) —
    // tierKeys + levelMeta custom ini dipakai renderLevels() sebagai pengganti
    // LEVEL_META global, sama persis seperti pola yang dipakai Kanji N5 (9 Chapter).
    tierKeys: BUNPO_N5_TIER_KEYS,
    levelMeta: BUNPO_N5_LEVEL_META,
    data: Object.fromEntries(
      BUNPO_N5_TIER_KEYS.map((tk, i) => [
        tk,
        BUNPO_N5_CHAPTERS[i].map(([c, , m]) => [c, tf(m)]),
      ]),
    ),
    // dataKalimat: soal "Kalimat" — [contoh_kalimat, pola] per tingkatan. Tidak
    // perlu di-resolve ulang tiap ganti bahasa karena isinya murni bahasa Jepang.
    dataKalimat: Object.fromEntries(
      BUNPO_N5_TIER_KEYS.map((tk, i) => [
        tk,
        BUNPO_N5_CHAPTERS[i].map(([c, ex]) => [ex, c]),
      ]),
    ),
    // dataKalimatBlank: sama seperti dataKalimat tapi soalnya versi romaji
    // tanpa kanji dengan partikel/pola-nya dikosongkan "..." — dipakai khusus
    // sebagai teks SOAL mode "Tebak Partikel!" supaya jawabannya (kanji/pola)
    // tidak kebocoran. dataKalimat aslinya tetap dipakai buat info "extra"
    // (contoh kalimat lengkap) yang muncul setelah jawab soal mode "Fungsi".
    dataKalimatBlank: Object.fromEntries(
      BUNPO_N5_TIER_KEYS.map((tk, i) => [
        tk,
        BUNPO_N5_CHAPTERS[i].map(([c, , , , blank]) => [blank, c]),
      ]),
    ),
    // dataTranslation: arti kalimat contoh (elemen ke-6 di BUNPO_N5_CHAPTERS),
    // dikunci per pola (sama seperti "data") — ditampilkan sebagai info
    // tambahan di feedback kuis, tepat di bawah baris Kalimat/Fungsi-nya.
    dataTranslation: Object.fromEntries(
      BUNPO_N5_TIER_KEYS.map((tk, i) => [
        tk,
        BUNPO_N5_CHAPTERS[i].map(([c, , , , , tr]) => [c, tf(tr)]),
      ]),
    ),
    // dataNote: catatan singkat "cara pakai" tiap pola (elemen ke-7 di
    // BUNPO_N5_CHAPTERS, "" kalau tidak ada catatan) — ditampilkan sebagai
    // info tambahan di feedback kuis, tepat kayak dataUsage di Kotoba.
    dataNote: Object.fromEntries(
      BUNPO_N5_TIER_KEYS.map((tk, i) => [
        tk,
        BUNPO_N5_CHAPTERS[i].map(([c, , , , , , n]) => [c, tf(n)]),
      ]),
    ),
    levelText: BUNPO_N5_LEVEL_TEXT,
    learnGrammar: BUNPO_N5_LEARN,
  },
};

// Build "all" pool untuk setiap script (gabungan semua tier)
Object.values(SCRIPTS).forEach((s) => {
  const anyS = s as unknown as {
    tierKeys?: readonly string[];
    data: Record<string, readonly unknown[]>;
    dataRomaji?: Record<string, readonly unknown[]>;
    dataKalimat?: Record<string, readonly unknown[]>;
    dataKalimatBlank?: Record<string, readonly unknown[]>;
    dataKanji?: Record<string, readonly unknown[]>;
    dataUsage?: Record<string, readonly unknown[]>;
    dataTranslation?: Record<string, readonly unknown[]>;
    dataNote?: Record<string, readonly unknown[]>;
  };
  const tks = anyS.tierKeys || ["tier1", "tier2", "tier3"];

  const cat = <T,>(obj: Record<string, T[]>): T[] =>
    tks.reduce<T[]>((acc, tk) => acc.concat(obj[tk] || []), []);

  anyS.data.all = cat(anyS.data as Record<string, unknown[]>);
  if (anyS.dataRomaji) {
    anyS.dataRomaji.all = cat(anyS.dataRomaji as Record<string, unknown[]>);
  }
  // Bunpō: pool "all" untuk soal Kalimat harus sejajar (index sama) dengan
  // data.all supaya rentang soal & pencocokan pola tetap benar.
  if (anyS.dataKalimat) {
    anyS.dataKalimat.all = cat(anyS.dataKalimat as Record<string, unknown[]>);
  }
  if (anyS.dataKalimatBlank) {
    anyS.dataKalimatBlank.all = cat(
      anyS.dataKalimatBlank as Record<string, unknown[]>,
    );
  }
  // Kotoba: pool "all" utk info tambahan (bentuk kanji & catatan cara pakai)
  // di feedback kuis, biar tetap kebaca pas mode "Semua Chapter" juga.
  if (anyS.dataKanji) {
    anyS.dataKanji.all = cat(anyS.dataKanji as Record<string, unknown[]>);
  }
  if (anyS.dataUsage) {
    anyS.dataUsage.all = cat(anyS.dataUsage as Record<string, unknown[]>);
  }
  if (anyS.dataTranslation) {
    anyS.dataTranslation.all = cat(
      anyS.dataTranslation as Record<string, unknown[]>,
    );
  }
  // Bunpō: pool "all" utk catatan cara pakai di feedback kuis, sama kayak
  // dataUsage di Kotoba, biar tetap kebaca pas mode "Semua Sub-Tier" juga.
  if (anyS.dataNote) {
    anyS.dataNote.all = cat(anyS.dataNote as Record<string, unknown[]>);
  }
});