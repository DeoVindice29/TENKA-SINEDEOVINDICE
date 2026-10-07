// Mode Penaklukan ala ujian JLPT N5 — dipakai Basic Kotoba, Bunpō, dan Kanji N5.
//
// Soalnya ratusan, jadi Penaklukan tidak lagi "semua soal sekaligus". Sekarang
// formatnya per tier, tiap tier N soal acak (pilihan ganda 4 opsi):
//
//   Basic Kotoba (Moji · Goi) — 5 tier
//     Tier 1 — Kalimat penuh hiragana, satu kata digarisbawahi → tebak kanjinya
//     Tier 2 — Kalimat penuh kanji N5, satu kata digarisbawahi → tebak hiragananya
//     Tier 3 — Pilih kata yang paling cocok untuk bagian kosong kalimat
//     Tier 4 — Similar Meaning: kata → pilih kata yang artinya paling mirip
//     Tier 5 — 「kata」を つかう ぶんは どれですか → pilih kalimat yang benar
//   Kanji N5 — 5 tier
//     Tier 1 — Arti kanji
//     Tier 2 — Baca kanji (hiragana)
//     Tier 3 — Tebak kanjinya dari arti (pilihan salah = kanji yang bentuknya
//              mirip, mis. 日/目/白)
//     Tier 4 — Pilih kata kanji yang paling cocok untuk kalimat
//     Tier 5 — 「kanji」を つかう ぶんは どれですか → pilih kalimat yang benar
//   Bunpō N5 — 5 tier
//     Tier 1 — Arti pola
//     Tier 2 — Tebak partikel yang tepat
//     Tier 3 — Tebak konjugasi kata kerja yang tepat (bentuk lain dari kata
//              kerja yang sama jadi pilihan salah, bukan kata lain)
//     Tier 4 — 「pola」を つかう ぶんは どれですか → pilih kalimat yang
//              pemakaiannya benar (bank: bunpoUsage.ts)
//     Tier 5 — Sentence Transformation: kalimat + perintah (negatif, lampau,
//              bentuk て, dst.) → pilih bentuk yang benar (bank: bunpoTransform.ts)
//
// Jumlah soal per tier diatur per-script di JLPT_QUESTIONS_PER_TIER (lihat di
// bawah, setelah JlptScriptKey dideklarasikan). Kotoba sudah 10 soal/tier;
// Bunpō & Kanji masih 1 dulu buat ngetes alurnya sampai bank soalnya siap.
// (Bank Tier 4 & 5 Bunpō masih contoh sedikit — soal lain menyusul.)

import type { Bilingual } from "./types";
import {
  KOTOBA_N5_CHAPTERS,
  KOTOBA_TIER_GROUP_DEFS,
  KOTOBA_TIER_KEYS,
} from "./kotobaN5";
import { KANJI_N5_CHAPTERS } from "./kanjiN5";
import { BUNPO_N5_CHAPTERS } from "./bunpoN5";
import { BUNPO_N5_CONJUGATION } from "./bunpoConjugation";
import { KOTOBA_USAGE } from "./kotobaUsage";
import { KANJI_USAGE } from "./kanjiUsage";
import { KOTOBA_SIMILAR } from "./kotobaSimilar";
import { KANJI_ALT_READINGS } from "./kanjiReadings";
import { BUNPO_USAGE } from "./bunpoUsage";
import { BUNPO_TRANSFORM } from "./bunpoTransform";
import { BUNPO_PARTICLE_PAIRS } from "./bunpoParticle2";
import type { VerbFormKey } from "./types";
import { shuffle } from "../utils/shuffle";
import { pickLang } from "../lib/quizLang";

/** Syarat lulus: minimal segini persen jawaban benar di SETIAP tier. */
export const JLPT_PASS_PERCENT = 80;

/** Jumlah benar minimal di satu tier (dibulatkan ke atas). */
export function jlptPassMark(tierLength: number): number {
  return Math.ceil((tierLength * JLPT_PASS_PERCENT) / 100);
}

export const JLPT_SCRIPTS = ["kotoba", "bunpo", "kanji"] as const;
export type JlptScriptKey = (typeof JLPT_SCRIPTS)[number];

export function isJlptScript(scriptKey: string): scriptKey is JlptScriptKey {
  return (JLPT_SCRIPTS as readonly string[]).includes(scriptKey);
}

/** Jumlah soal per tier, per script. */
export const JLPT_QUESTIONS_PER_TIER: Record<JlptScriptKey, number> = {
  kotoba: 10,
  bunpo: 10,
  kanji: 10,
};

/** Jumlah soal per tier untuk script ini. */
export function jlptQuestionsPerTier(scriptKey: string): number {
  return isJlptScript(scriptKey) ? JLPT_QUESTIONS_PER_TIER[scriptKey] : 0;
}

/** [soal, jawaban, tipe, info tambahan?, key label info?, pilihan jawaban?] */
export type JlptQueueItem = [
  string,
  string,
  string,
  string?,
  string?,
  string[]?,
];

export type JlptExam = {
  queue: JlptQueueItem[];
  /** batas index tiap tier di queue: [0, akhirTier1, akhirTier2, ...] */
  boundaries: number[];
};

const BLANK = "（＿＿＿）";
const CHOICE_COUNT = 4;

// Kata yang digarisbawahi di dalam kalimat soal dibungkus ⟦ ⟧ (dirender jadi
// <u> oleh QuizStamp). Kalau teks soal ditampilkan di tempat lain (mis. daftar
// soal yang salah), pakai stripMarks().
const MARK_OPEN = "⟦";
const MARK_CLOSE = "⟧";

export function stripMarks(text: string): string {
  return text.split(MARK_OPEN).join("").split(MARK_CLOSE).join("");
}

/** Pecah teks soal jadi potongan biasa & potongan yang digarisbawahi. */
export function splitMarks(text: string): { text: string; marked: boolean }[] {
  const parts: { text: string; marked: boolean }[] = [];
  let rest = text;
  while (rest.length > 0) {
    const open = rest.indexOf(MARK_OPEN);
    const close = open === -1 ? -1 : rest.indexOf(MARK_CLOSE, open);
    if (open === -1 || close === -1) {
      parts.push({ text: rest, marked: false });
      break;
    }
    if (open > 0) parts.push({ text: rest.slice(0, open), marked: false });
    parts.push({ text: rest.slice(open + 1, close), marked: true });
    rest = rest.slice(close + 1);
  }
  return parts;
}

type Candidate = {
  q: string;
  a: string;
  /** chapter asal — dipakai buat milih distraktor yang masuk akal */
  group: number;
  extra: string;
  extraLabelKey: string;
  /** jawaban lain yang juga benar → tidak boleh muncul sebagai pilihan salah */
  alsoCorrect?: readonly string[];
  /** kata yang ditanyakan — soal dengan kata sama (mis. homofon) tidak jadi distraktor */
  key?: string;
  /** id kata asal — satu kata tidak dipakai dua kali dalam satu ujian (jawaban tier lain bisa bocor) */
  id?: string;
  /** pilihan salah yang sudah ditentukan (soal tulis tangan) → tidak perlu dicari */
  distractors?: readonly string[];
};

/**
 * any        = distraktor dari mana saja
 * sameGroup  = utamakan dari chapter yang sama (mis. sesama partikel)
 * otherGroup = utamakan dari chapter lain (biar kecil kemungkinan ikut cocok
 *              di kalimat)
 */
type DistractorMode = "any" | "sameGroup" | "otherGroup";

type TierSpec = {
  type: string;
  cands: () => Candidate[];
  mode: DistractorMode;
  /** distraktor dipilih yang panjangnya mirip jawaban benar */
  similarLength?: boolean;
  /** penyusun distraktor khusus (menggantikan pemilihan umum) */
  distract?: (correct: Candidate, all: Candidate[]) => string[];
};

// Arti & terjemahan di soal Penaklukan mengikuti bahasa yang dipilih. Soal
// dibangun tepat saat ujian dimulai (buildJlptExam), jadi selalu fresh.
const en = (b: Bilingual): string => pickLang(b);
const isCjk = (ch: string) => /[\u4e00-\u9fff]/.test(ch);

// ---------------------------------------------------------------------------
// Kandidat soal per script
// ---------------------------------------------------------------------------

const L_READING = "quiz.readingLabel";
const L_MEANING = "quiz.meaningLabel";
const L_EXAMPLE = "quiz.kalimatLabel";

// ---------------------------------------------------------------------------
// Kotoba tier 1 & 2 — satu kata di dalam kalimat, dua aksara
// ---------------------------------------------------------------------------

// Yang dihitung "kanji N5": daftar Kanji N5 di aplikasi + kanji yang hampir
// selalu muncul di kosakata N5 (私, 本, 語, 曜日, ...).
const N5_KANJI = new Set([
  ...KANJI_N5_CHAPTERS.flatMap((ch) => ch.map((e) => e[0])),
  ...Array.from("本語話間先毎私週曜雨友"),
]);
const isN5Text = (text: string) =>
  Array.from(text)
    .filter(isCjk)
    .every((k) => N5_KANJI.has(k));

type WordInSentence = {
  id: string;
  group: number;
  /** kata di kalimat, hiragana (bentuk apa adanya: いきます) */
  kana: string;
  /** kata yang sama, kanji (行きます) */
  kanji: string;
  kanaSentence: string;
  kanjiSentence: string;
  extra: string;
};

// Kata + kalimat contohnya, dalam bentuk hiragana dan kanji. Kata yang ditanyakan
// = token kalimat itu apa adanya, jadi kata kerja/sifat ikut bentuk di kalimat
// (行きます → いきます). Hanya kata yang muncul persis sekali di kedua versi
// kalimat yang dipakai, supaya garis bawahnya tidak ambigu.
function kotobaWordsInSentence(): WordInSentence[] {
  return KOTOBA_N5_CHAPTERS.flatMap((ch, group) =>
    ch.flatMap((e): WordInSentence[] => {
      const kana = e[0];
      const kanjiWord = e[6];
      const kanaSentence = e[3];
      const kanjiSentence = e[7];
      if (!kanjiWord || !kanjiSentence || !Array.from(kanjiWord).some(isCjk)) {
        return [];
      }

      // okurigana = akhiran kana yang sama di bentuk kanji & bentuk kana
      let n = 0;
      while (
        n < kanjiWord.length &&
        n < kana.length &&
        kanjiWord[kanjiWord.length - 1 - n] === kana[kana.length - 1 - n] &&
        !isCjk(kanjiWord[kanjiWord.length - 1 - n])
      ) {
        n++;
      }
      const stemKanji = kanjiWord.slice(0, kanjiWord.length - n);
      const stemKana = kana.slice(0, kana.length - n);
      if (!stemKanji) return [];

      for (const [jp] of e[4]) {
        const token = jp.replace(/[。、？！?!,.\s]/g, "");
        if (!token.startsWith(stemKana)) continue;
        // bentuk kanji token ini harus benar-benar ada di kalimat kanjinya
        const kanjiToken = stemKanji + token.slice(stemKana.length);
        if (kanjiSentence.split(kanjiToken).length !== 2) continue;
        if (kanaSentence.split(token).length !== 2) continue;
        return [
          {
            id: token,
            group,
            kana: token,
            kanji: kanjiToken,
            kanaSentence,
            kanjiSentence,
            extra: `${en(e[2])} — ${en(e[5])}`,
          },
        ];
      }
      return [];
    }),
  );
}

// Tier 1 — もんだい2: kalimat penuh hiragana, satu kata digarisbawahi → pilih
// tulisan kanjinya.
function kotobaKanjiOfUnderlined(): Candidate[] {
  return kotobaWordsInSentence()
    .filter((w) => isN5Text(w.kanji))
    .map((w) => ({
      q: w.kanaSentence.replace(w.kana, `${MARK_OPEN}${w.kana}${MARK_CLOSE}`),
      a: w.kanji,
      group: w.group,
      id: w.id,
      key: w.kana,
      extra: w.extra,
      extraLabelKey: L_MEANING,
    }));
}

// Tier 2 — もんだい1: kalimat penuh kanji N5 (semua kanji di kalimat itu kanji
// N5), satu kata digarisbawahi → pilih bacaan hiragananya.
function kotobaReadingOfUnderlined(): Candidate[] {
  return kotobaWordsInSentence()
    .filter((w) => isN5Text(w.kanjiSentence))
    .map((w) => ({
      q: w.kanjiSentence.replace(w.kanji, `${MARK_OPEN}${w.kanji}${MARK_CLOSE}`),
      a: w.kana,
      group: w.group,
      id: w.id,
      key: w.kanji,
      extra: w.extra,
      extraLabelKey: L_MEANING,
    }));
}

// Pilihan bacaan yang "mirip": akhiran sama (kata lain), satu bunyi
// bertitik/tidak bertitik ditukar (か↔が), atau huruf pertama hilang
// (いきます → きます).
const VOICED: Record<string, string> = {};
for (const [plain, voiced] of [
  ["か", "が"], ["き", "ぎ"], ["く", "ぐ"], ["け", "げ"], ["こ", "ご"],
  ["さ", "ざ"], ["し", "じ"], ["す", "ず"], ["せ", "ぜ"], ["そ", "ぞ"],
  ["た", "だ"], ["ち", "ぢ"], ["つ", "づ"], ["て", "で"], ["と", "ど"],
  ["は", "ば"], ["ひ", "び"], ["ふ", "ぶ"], ["へ", "べ"], ["ほ", "ぼ"],
]) {
  VOICED[plain] = voiced;
  VOICED[voiced] = plain;
}

const O_ROW = "おこそとのほもよろごぞどぼぽょ";
const E_ROW = "えけせてねへめれげぜでべぺ";

// bunyi panjang ditambah/dikurangi (うんどう → うんど, とけい → とけ)
function toggleLongVowel(word: string): string | null {
  const chars = Array.from(word);
  for (let i = 0; i < chars.length - 1; i++) {
    if (
      (O_ROW.includes(chars[i]) && chars[i + 1] === "う") ||
      (E_ROW.includes(chars[i]) && chars[i + 1] === "い")
    ) {
      return [...chars.slice(0, i + 1), ...chars.slice(i + 2)].join("");
    }
  }
  const at = chars.findIndex((ch, i) => i < chars.length - 1 && O_ROW.includes(ch));
  if (at === -1) return null;
  return [...chars.slice(0, at + 1), "う", ...chars.slice(at + 1)].join("");
}

// varian "hampir benar" dari bacaan yang benar
function lookalikes(word: string): string[] {
  const chars = Array.from(word);
  const out: string[] = [];
  const spots = chars
    .map((ch, i) => (VOICED[ch] ? i : -1))
    .filter((i) => i >= 0);
  for (const at of shuffle(spots).slice(0, 2)) {
    const c = [...chars];
    c[at] = VOICED[c[at]];
    out.push(c.join(""));
  }
  const lv = toggleLongVowel(word);
  if (lv) out.push(lv);
  // huruf pertama hilang — tapi jangan sampai kata baru diawali ん / kana kecil
  if (chars.length >= 4 && !/^[んっーぁぃぅぇぉゃゅょ]/.test(chars[1])) {
    out.push(chars.slice(1).join(""));
  }
  return shuffle(out);
}

function kanaReadingDistractors(
  correct: Candidate,
  all: Candidate[],
): string[] {
  const banned = new Set([correct.a]);
  const out: string[] = [];
  const minLen = Math.min(2, correct.a.length);
  const add = (w: string | null | undefined) => {
    if (w && w.length >= minLen && !banned.has(w) && out.length < CHOICE_COUNT - 1) {
      banned.add(w);
      out.push(w);
    }
  };

  const others = all.filter((c) => c.key !== correct.key);
  const ending = correct.a.slice(-2);
  const sameEnding = shuffle(
    others.filter(
      (c) =>
        c.a.endsWith(ending) && Math.abs(c.a.length - correct.a.length) <= 2,
    ),
  );
  const variants = lookalikes(correct.a);
  add(sameEnding[0]?.a);
  add(variants[0]);
  add(variants[1]);
  add(sameEnding[1]?.a);
  variants.slice(2).forEach(add);

  // sisanya: kata lain yang panjang & huruf awal/akhirnya mirip
  const first = correct.a[0];
  const last = correct.a[correct.a.length - 1];
  const score = (w: string) =>
    Math.abs(w.length - correct.a.length) -
    (w[0] === first ? 1 : 0) -
    (w[w.length - 1] === last ? 1 : 0);
  const filler = shuffle(others).slice(0, 60);
  filler.sort((x, y) => score(x.a) - score(y.a));
  for (const c of filler) add(c.a);
  return out;
}

// Kanji yang bentuknya mirip — bahan pilihan salah Tier 1 (tebak kanjinya),
// seperti di ujian asli: 学生 → 字生 / 学主.
const LOOKALIKE_GROUPS = [
  "日目白百", "人入八", "大犬太", "天夫大", "木本末未", "土士", "千干", "力刀",
  "子字学", "生主", "休体", "右石", "左右", "上止", "小少", "午牛", "今令", "時持待",
  "間問聞門", "会合", "何可", "名各", "気汽", "電雷", "北比", "母毎", "校交",
  "円内", "見貝", "来米", "食良", "飲飯", "読続売", "買貸", "語話読", "道通",
  "駅訳", "空穴", "手毛", "耳取", "男田", "花化", "魚漁", "車東", "立位",
  "新親", "高京", "青清", "万方", "父交", "先光", "中申", "水永", "山出",
  "川州", "友反", "週周",
];
const LOOKALIKE: Record<string, string[]> = {};
for (const group of LOOKALIKE_GROUPS) {
  for (const ch of group) {
    const others = Array.from(group).filter((o) => o !== ch);
    LOOKALIKE[ch] = Array.from(new Set([...(LOOKALIKE[ch] ?? []), ...others]));
  }
}

// varian "hampir benar" dari tulisan kanji: satu kanji diganti kanji yang mirip
function kanjiLookalikes(word: string): string[] {
  const chars = Array.from(word);
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    for (const alt of LOOKALIKE[chars[i]] ?? []) {
      const c = [...chars];
      c[i] = alt;
      out.push(c.join(""));
    }
  }
  return shuffle(out);
}

// Pilihan salah untuk soal "tebak kanjinya": kanji mirip, kata asli yang
// memakai kanji yang sama (水曜日 → 木曜日), lalu kata lain yang panjangnya mirip.
function kanjiFormDistractors(correct: Candidate, all: Candidate[]): string[] {
  // kata dengan bacaan sama (homofon, mis. 暑い / 熱い) juga benar → jangan dipakai
  const homophones = all.filter((c) => c.key === correct.key).map((c) => c.a);
  const banned = new Set([correct.a, ...homophones]);
  const out: string[] = [];
  const add = (w: string | null | undefined) => {
    if (w && !banned.has(w) && out.length < CHOICE_COUNT - 1) {
      banned.add(w);
      out.push(w);
    }
  };

  const others = shuffle(all.filter((c) => c.key !== correct.key));
  const kanjiHere = new Set(Array.from(correct.a).filter(isCjk));
  const lengthGap = (w: string) => Math.abs(w.length - correct.a.length);
  const related = others.filter(
    (c) => lengthGap(c.a) <= 1 && Array.from(c.a).some((ch) => kanjiHere.has(ch)),
  );
  const looks = kanjiLookalikes(correct.a);

  add(looks[0]);
  add(related[0]?.a);
  add(looks[1]);
  add(related[1]?.a);
  looks.slice(2).forEach(add);
  related.slice(2).forEach((c) => add(c.a));

  // sisanya: kata lain yang panjang & huruf akhirnya mirip
  const last = correct.a[correct.a.length - 1];
  const score = (w: string) => lengthGap(w) - (w[w.length - 1] === last ? 1 : 0);
  const filler = others.slice(0, 60).sort((x, y) => score(x.a) - score(y.a));
  filler.forEach((c) => add(c.a));
  return out;
}

// Sub Chapter (27) → Chapter (8: orang, waktu, benda, tempat, kata kerja, ...).
// Pilihan salah Tier 3 diambil dari CHAPTER lain, bukan cuma sub chapter lain —
// kalau tidak, jawaban "かない" bisa ditemani "わたし" / "あなた" yang sama-sama
// cocok di kalimatnya.
function chapterOfSubTier(subTier: number): number {
  return KOTOBA_TIER_GROUP_DEFS.findIndex((g) =>
    g.tierKeys.includes(KOTOBA_TIER_KEYS[subTier]),
  );
}

// Kalimat contoh dengan kata targetnya dikosongkan. Hanya dipakai kalau kata itu
// muncul persis sebagai satu token dan hanya sekali di kalimat, supaya tempat
// kosongnya tidak ambigu.
function kotobaFill(): Candidate[] {
  return KOTOBA_N5_CHAPTERS.flatMap((ch, subTier) =>
    ch.flatMap((e) => {
      const word = e[0];
      const sentence = e[3];
      const isToken = e[4].some(
        ([jp]) => jp.replace(/[。、？！?!,.\s]/g, "") === word,
      );
      if (word.length < 2 || !isToken) return [];
      if (sentence.split(word).length !== 2) return [];
      return [
        {
          q: sentence.replace(word, BLANK),
          a: word,
          group: chapterOfSubTier(subTier),
          id: word,
          extra: `${sentence} — ${en(e[5])}`,
          extraLabelKey: L_EXAMPLE,
        },
      ];
    }),
  );
}

// Tier 4 — 「とる」を つかう ぶんは どれですか: 4 kalimat memakai kata yang sama,
// pilih yang pemakaiannya benar. Soalnya ditulis tangan di kotobaUsage.ts.
function kotobaUsage(): Candidate[] {
  return KOTOBA_USAGE.map(([word, correct, wrongA, wrongB, wrongC, meaning], i) => ({
    q: `「${word}」 を つかう ぶんは どれですか。`,
    a: correct,
    group: i,
    id: word.replace("〜", ""),
    distractors: [wrongA, wrongB, wrongC],
    extra: en(meaning),
    extraLabelKey: L_MEANING,
  }));
}

// Tier 1 — kanji → arti. Info tambahan di feedback = bacaan hiragana (bukan romaji).
function kanjiMeaning(): Candidate[] {
  return KANJI_N5_CHAPTERS.flatMap((ch, group) =>
    ch.map((e) => ({
      q: e[0],
      a: en(e[2]),
      group,
      id: e[0],
      extra: e[3],
      extraLabelKey: L_READING,
    })),
  );
}

// Tier 2 — kanji → bacaan (hiragana). Bacaan lain kanji itu (on/kun) dilarang
// muncul sebagai pilihan salah — lihat kanjiReadings.ts.
function kanjiReading(): Candidate[] {
  return KANJI_N5_CHAPTERS.flatMap((ch, group) =>
    ch.map((e) => ({
      q: e[0],
      a: e[3],
      group,
      id: e[0],
      extra: en(e[2]),
      extraLabelKey: L_MEANING,
      alsoCorrect: [e[3], ...(KANJI_ALT_READINGS[e[0]] ?? [])],
    })),
  );
}

// Tier 3 — arti → kanji. Pilihan salah diutamakan kanji yang bentuknya mirip
// (LOOKALIKE_GROUPS), baru sisanya diisi kanji acak dari bank.
function kanjiFromMeaning(): Candidate[] {
  return KANJI_N5_CHAPTERS.flatMap((ch, group) =>
    ch.map((e) => ({
      q: en(e[2]),
      a: e[0],
      group,
      id: e[0],
      extra: e[3],
      extraLabelKey: L_READING,
    })),
  );
}

function kanjiLookalikeDistractors(
  correct: Candidate,
  all: Candidate[],
): string[] {
  const out: string[] = [];
  for (const k of shuffle(LOOKALIKE[correct.a] ?? [])) {
    if (out.length >= CHOICE_COUNT - 1) break;
    if (k !== correct.a) out.push(k);
  }
  if (out.length < CHOICE_COUNT - 1) {
    const pool = shuffle(
      all.filter((c) => c.a !== correct.a && !out.includes(c.a)),
    );
    for (const c of pool) {
      if (out.length >= CHOICE_COUNT - 1) break;
      out.push(c.a);
    }
  }
  return out;
}

// Kanji tidak punya kalimat sendiri, jadi dipinjam dari kalimat contoh kotoba
// yang kata kanji-nya cuma tersusun dari kanji N5.
function kanjiFill(): Candidate[] {
  const n5 = new Set(KANJI_N5_CHAPTERS.flatMap((ch) => ch.map((e) => e[0])));
  return KOTOBA_N5_CHAPTERS.flatMap((ch, group) =>
    ch.flatMap((e) => {
      const word = e[6];
      const sentence = e[7];
      if (!word || !sentence) return [];
      if (!Array.from(word).filter(isCjk).every((k) => n5.has(k))) return [];
      if (!Array.from(word).some(isCjk)) return [];
      if (sentence.split(word).length !== 2) return [];
      return [
        {
          q: sentence.replace(word, BLANK),
          a: word,
          group,
          id: word,
          extra: `${sentence} — ${en(e[5])}`,
          extraLabelKey: L_EXAMPLE,
        },
      ];
    }),
  );
}

// Tier 5 Kanji (Usage) — 「六」を つかう ぶんは どれですか。
// Soal ditulis tangan di kanjiUsage.ts: KE-4 kalimat sama-sama memuat kanji itu,
// jadi tidak bisa dijawab cuma dengan mencari kanji yang sama. Yang diuji adalah
// pemakaiannya — satu kalimat wajar, tiga lainnya salah (kata bantu bilangan /
// kata kerja / kolokasi keliru).
function kanjiUsage(): Candidate[] {
  const bank = new Map(KANJI_USAGE.map((u) => [u[0], u] as const));
  return KANJI_N5_CHAPTERS.flatMap((ch, group) =>
    ch.flatMap((e) => {
      const u = bank.get(e[0]);
      if (!u) return [];
      const [kanji, correct, wrongA, wrongB, wrongC, meaning] = u;
      return [
        {
          q: `「${kanji}」を つかう ぶんは どれですか。`,
          a: correct,
          group,
          id: kanji,
          distractors: [wrongA, wrongB, wrongC],
          extra: `${correct} — ${en(meaning)}`,
          extraLabelKey: L_EXAMPLE,
        },
      ];
    }),
  );
}

function bunpoMeaning(): Candidate[] {
  return BUNPO_N5_CHAPTERS.flatMap((ch, group) =>
    ch.map((e) => ({
      q: e[0],
      a: en(e[2]),
      group,
      extra: e[1],
      extraLabelKey: L_EXAMPLE,
    })),
  );
}

// Label pola memakai "_" untuk menandai posisinya di kalimat (_は_ = di tengah,
// _か = di ujung, dst.), jadi label TIDAK bisa dipakai langsung sebagai pilihan
// jawaban partikel — garis bawahnya membocorkan posisi. Pilihan Tier 2 memakai
// partikel polosnya (は, が, を, ...).
const bareParticle = (pattern: string) => pattern.split("_").join("");

// Pola yang benar-benar cuma satu partikel, per chapter (index chapter di
// BUNPO_N5_CHAPTERS): も di chapter 0, partikel utama di chapter 1, dan
// partikel akhir か/ね/よ di chapter 14. Konstruksi majemuk (_の_, _と_ di
// chapter 0, _や_, dst.) sengaja tidak dimasukkan.
const PARTICLE_TIER: Record<number, readonly string[]> = {
  0: ["も"],
  1: ["は", "が", "を", "に", "で", "と", "から", "まで"],
  14: ["か", "ね", "よ"],
};

// Kalimat dengan PARTIKEL dikosongkan ("...") → pilih partikel yang tepat.
// Mirip bunpoFill, tapi kandidatnya dibatasi ke pola yang murni satu partikel,
// jadi soalnya konsisten "tebak partikelnya" (bukan pola lain).
function bunpoParticleFill(): Candidate[] {
  const single = BUNPO_N5_CHAPTERS.flatMap((ch, group) =>
    ch.flatMap((e) => {
      const particle = bareParticle(e[0]);
      if (!PARTICLE_TIER[group]?.includes(particle)) return [];
      const blank = e[4];
      if (!blank || !blank.includes("...")) return [];
      return [
        {
          q: blank,
          a: particle,
          group,
          extra: `${e[1]} — ${en(e[5])}`,
          extraLabelKey: L_EXAMPLE,
        },
      ];
    }),
  );

  // Soal dua kotak kosong (ditulis tangan di bunpoParticle2.ts): pilihannya
  // pasangan partikel, mis. "から/を". Pilihan salahnya sudah ditentukan.
  const pairs = BUNPO_PARTICLE_PAIRS.map(
    ([sentence, correct, wrongA, wrongB, wrongC, meaning], i) => ({
      q: sentence,
      a: correct,
      group: 1000 + i,
      id: `particle2-${i}`,
      distractors: [wrongA, wrongB, wrongC],
      extra: `${sentence
        .replace("...", correct.split("/")[0])
        .replace("...", correct.split("/")[1])} — ${en(meaning)}`,
      extraLabelKey: L_EXAMPLE,
    }),
  );

  return [...single, ...pairs];
}

// Kalimat dengan kata kerja dikosongkan ("...") → pilih bentuk konjugasi yang
// tepat. Pilihan salahnya bukan kata lain, tapi bentuk LAIN dari kata kerja
// yang SAMA (mis. のむ → のんで/のまない/のみます) — jadi soal ini murni
// nguji konjugasi, bukan kosakata.
const VERB_FORM_KEYS: VerbFormKey[] = ["masu", "te", "nai", "ta", "naide"];

function bunpoConjugation(): Candidate[] {
  return BUNPO_N5_CONJUGATION.map((v, i) => {
    const others = VERB_FORM_KEYS.filter((k) => k !== v.target);
    const distractors = shuffle(others)
      .slice(0, CHOICE_COUNT - 1)
      .map((k) => v.forms[k]);
    return {
      q: v.sentence,
      a: v.forms[v.target],
      group: i,
      extra: `${v.kana}（${en(v.meaning)}） — ${en(v.translation)}`,
      extraLabelKey: L_EXAMPLE,
      id: v.id,
      distractors,
    };
  });
}

// Tier 4 Bunpō — 「〜ながら」を つかう ぶんは どれですか: 4 kalimat memakai pola
// yang sama, pilih yang pemakaiannya benar. Soalnya ditulis tangan di
// bunpoUsage.ts (kalimat salahnya harus benar-benar salah secara tata bahasa).
function bunpoUsage(): Candidate[] {
  return BUNPO_USAGE.map(
    ([pattern, correct, wrongA, wrongB, wrongC, meaning], i) => ({
      q: `「${pattern}」 を つかう ぶんは どれですか。`,
      a: correct,
      group: i,
      id: pattern,
      distractors: [wrongA, wrongB, wrongC],
      extra: en(meaning),
      extraLabelKey: L_MEANING,
    }),
  );
}

// Tier 5 Bunpō — Sentence Transformation: sebuah kalimat + perintah mengubah
// bentuknya (negatif, lampau, bentuk て, ...) → pilih bentuk yang benar. Soalnya
// ditulis tangan di bunpoTransform.ts (pilihan salahnya harus benar-benar salah
// secara tata bahasa). Teks soal dua baris: 「kalimat」 lalu → perintah.
function bunpoTransform(): Candidate[] {
  return BUNPO_TRANSFORM.map(
    ([sentence, instruction, correct, wrongA, wrongB, wrongC, meaning], i) => ({
      q: `「${sentence}」\n→ ${en(instruction)}`,
      a: correct,
      group: i,
      id: `transform-${i}`,
      distractors: [wrongA, wrongB, wrongC],
      extra: `${correct} — ${en(meaning)}`,
      extraLabelKey: L_MEANING,
    }),
  );
}

// Tier 4 Kotoba "Similar Meaning" — kata → kata yang artinya mirip. Bank soalnya
// ditulis tangan di kotobaSimilar.ts.
function kotobaSimilar(): Candidate[] {
  return KOTOBA_SIMILAR.map(
    ([word, correct, wrongA, wrongB, wrongC, meaning], i) => ({
      q: word,
      a: correct,
      group: i,
      id: `similar-${word}`,
      key: word,
      distractors: [wrongA, wrongB, wrongC],
      extra: `${word} ≈ ${correct} — ${en(meaning)}`,
      extraLabelKey: L_MEANING,
    }),
  );
}

export const JLPT_TIER_TYPES = {
  meaning: "jlpt-meaning",
  reading: "jlpt-reading",
  fill: "jlpt-fill",
  write: "jlpt-write",
  usage: "jlpt-usage",
  similar: "jlpt-similar",
  particle: "jlpt-particle",
  conjugation: "jlpt-conjugation",
  transform: "jlpt-transform",
} as const;

const SPECS: Record<JlptScriptKey, TierSpec[]> = {
  kotoba: [
    {
      type: JLPT_TIER_TYPES.write,
      cands: kotobaKanjiOfUnderlined,
      mode: "any",
      distract: kanjiFormDistractors,
    },
    {
      type: JLPT_TIER_TYPES.reading,
      cands: kotobaReadingOfUnderlined,
      mode: "any",
      distract: kanaReadingDistractors,
    },
    {
      type: JLPT_TIER_TYPES.fill,
      cands: kotobaFill,
      mode: "otherGroup",
      similarLength: true,
    },
    { type: JLPT_TIER_TYPES.similar, cands: kotobaSimilar, mode: "any" },
    { type: JLPT_TIER_TYPES.usage, cands: kotobaUsage, mode: "any" },
  ],
  bunpo: [
    { type: JLPT_TIER_TYPES.meaning, cands: bunpoMeaning, mode: "any" },
    {
      type: JLPT_TIER_TYPES.particle,
      cands: bunpoParticleFill,
      mode: "any",
      // soal satu kotak kosong cuma boleh dapat pilihan salah berupa SATU
      // partikel (bukan pasangan "から/を" dari soal dua kotak kosong)
      distract: (correct, all) =>
        shuffle(
          Array.from(
            new Set(
              all
                .filter((c) => !c.a.includes("/") && c.a !== correct.a)
                .map((c) => c.a),
            ),
          ),
        ).slice(0, CHOICE_COUNT - 1),
    },
    { type: JLPT_TIER_TYPES.conjugation, cands: bunpoConjugation, mode: "any" },
    { type: JLPT_TIER_TYPES.usage, cands: bunpoUsage, mode: "any" },
    { type: JLPT_TIER_TYPES.transform, cands: bunpoTransform, mode: "any" },
  ],
  kanji: [
    { type: JLPT_TIER_TYPES.meaning, cands: kanjiMeaning, mode: "any" },
    {
      type: JLPT_TIER_TYPES.reading,
      cands: kanjiReading,
      mode: "any",
      similarLength: true,
    },
    {
      type: JLPT_TIER_TYPES.write,
      cands: kanjiFromMeaning,
      mode: "any",
      distract: kanjiLookalikeDistractors,
    },
    {
      type: JLPT_TIER_TYPES.fill,
      cands: kanjiFill,
      mode: "otherGroup",
    },
    { type: JLPT_TIER_TYPES.usage, cands: kanjiUsage, mode: "any" },
  ],
};

// Latihan memakai tipe soal yang sama persis dengan tier Penaklukan (5 tier per
// aksara), jadi tidak ada lagi tipe khusus Latihan.
const practiceSpecsOf = (scriptKey: JlptScriptKey): TierSpec[] => SPECS[scriptKey];

/** Jumlah tier ujian Penaklukan untuk script ini (Kotoba 5, Bunpō 5, Kanji 5). */
export function jlptTierCount(scriptKey: string): number {
  return isJlptScript(scriptKey) ? SPECS[scriptKey].length : 0;
}

// ---------------------------------------------------------------------------
// Penyusun soal + pilihan jawaban
// ---------------------------------------------------------------------------

function pickDistractors(
  correct: Candidate,
  all: Candidate[],
  spec: TierSpec,
): string[] {
  const banned = new Set([correct.a, ...(correct.alsoCorrect ?? [])]);
  const seen = new Set<string>();
  const base: Candidate[] = [];
  for (const c of all) {
    if (c.q === correct.q || banned.has(c.a) || seen.has(c.a)) continue;
    seen.add(c.a);
    base.push(c);
  }

  const preferred =
    spec.mode === "sameGroup"
      ? base.filter((c) => c.group === correct.group)
      : spec.mode === "otherGroup"
        ? base.filter((c) => c.group !== correct.group)
        : base;

  const need = CHOICE_COUNT - 1;
  let chosen: Candidate[];
  if (spec.similarLength) {
    const sample = shuffle(preferred).slice(0, 40);
    sample.sort(
      (x, y) =>
        Math.abs(x.a.length - correct.a.length) -
        Math.abs(y.a.length - correct.a.length),
    );
    chosen = sample.slice(0, need);
  } else {
    chosen = shuffle(preferred).slice(0, need);
  }

  if (chosen.length < need) {
    const used = new Set(chosen.map((c) => c.a));
    const rest = shuffle(base.filter((c) => !used.has(c.a)));
    chosen = chosen.concat(rest.slice(0, need - chosen.length));
  }
  return chosen.map((c) => c.a);
}

function buildTier(
  spec: TierSpec,
  count: number,
  used: Set<string>,
): JlptQueueItem[] {
  const all = spec.cands();

  // satu soal per teks soal (kalau ada yang kembar, ambil yang pertama)
  const byQuestion = new Map<string, Candidate>();
  for (const c of all) if (!byQuestion.has(c.q)) byQuestion.set(c.q, c);

  // Utamakan kata yang belum keluar di tier lain pada ujian yang sama —
  // kalau kata yang sama muncul lagi, soal sebelumnya membocorkan jawabannya
  // (mis. わたし → 私 di Tier 1, lalu 私 → わたし di Tier 2).
  const pool = shuffle([...byQuestion.values()]);
  const fresh = pool.filter((c) => !c.id || !used.has(c.id));
  const repeats = pool.filter((c) => c.id && used.has(c.id));
  const picked = [...fresh, ...repeats].slice(0, count);
  for (const c of picked) if (c.id) used.add(c.id);

  return picked.map((c) => {
    let distractors = c.distractors
      ? [...c.distractors]
      : spec.distract
        ? spec.distract(c, all)
        : [];
    if (distractors.length < CHOICE_COUNT - 1) {
      distractors = pickDistractors(c, all, spec);
    }
    const choices = shuffle([c.a, ...distractors]);
    return [c.q, c.a, spec.type, c.extra, c.extraLabelKey, choices] as JlptQueueItem;
  });
}

export function buildJlptExam(
  scriptKey: JlptScriptKey,
  perTier: number = jlptQuestionsPerTier(scriptKey),
): JlptExam {
  const used = new Set<string>();
  const tiers = SPECS[scriptKey].map((spec) => buildTier(spec, perTier, used));
  const boundaries = [0];
  for (const t of tiers) boundaries.push(boundaries[boundaries.length - 1] + t.length);
  return { queue: tiers.flat(), boundaries };
}

// ---------------------------------------------------------------------------
// Latihan Tipe Soal — section terpisah (screen "practice"), di luar Penaklukan
//
// Tipe-tipe soal Penaklukan (Kotoba, Bunpō, Kanji) bisa dilatih sendiri-sendiri.
// Tidak semua kata/pola/kanji punya soal untuk semua tipe (kata tanpa kanji
// tidak bisa jadi "Tebak Kanji", dst.), jadi latihannya TIDAK per tingkatan atau
// rentang seperti kuis biasa: tiap tipe punya kumpulan soalnya sendiri, dan soal
// diambil acak dari seluruh kumpulan itu. Generator soal & pilihan jawabannya
// sama persis dengan ujian Penaklukan (buildTier) — tipe & urutannya ikut SPECS,
// jadi tier baru di Penaklukan otomatis ikut muncul di Latihan.
// ---------------------------------------------------------------------------

/** Kunci tipe soal (write, reading, fill, usage, meaning, particle, ...). */
export type PracticeTypeKey = keyof typeof JLPT_TIER_TYPES;

const TYPE_KEY_BY_VALUE: Record<string, PracticeTypeKey> = Object.fromEntries(
  Object.entries(JLPT_TIER_TYPES).map(([key, value]) => [value, key]),
) as Record<string, PracticeTypeKey>;

/** Tipe soal yang bisa dilatih untuk script ini: tier Penaklukan (urut Tier 1, 2, ...). */
export function practiceTypesFor(scriptKey: JlptScriptKey): PracticeTypeKey[] {
  return practiceSpecsOf(scriptKey).map((spec) => TYPE_KEY_BY_VALUE[spec.type]);
}

export function isPracticeType(
  scriptKey: string,
  value: string,
): value is PracticeTypeKey {
  return (
    isJlptScript(scriptKey) &&
    (practiceTypesFor(scriptKey) as readonly string[]).includes(value)
  );
}

/** Type soal di queue (index 2, mis. "jlpt-write") → kunci tipe ("write"). */
export function practiceTypeKeyOfQueueType(
  queueType: string,
): PracticeTypeKey | undefined {
  return TYPE_KEY_BY_VALUE[queueType];
}

function practiceSpec(scriptKey: JlptScriptKey, type: PracticeTypeKey): TierSpec {
  const spec = practiceSpecsOf(scriptKey).find(
    (s) => s.type === JLPT_TIER_TYPES[type],
  );
  if (!spec) throw new Error(`Tipe latihan tidak dikenal: ${scriptKey}/${type}`);
  return spec;
}

const practiceCountCache = new Map<string, number>();

/** Jumlah soal berbeda yang tersedia untuk tipe ini. */
export function practiceCount(
  scriptKey: JlptScriptKey,
  type: PracticeTypeKey,
): number {
  const cacheKey = `${scriptKey}:${type}`;
  const cached = practiceCountCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const n = new Set(practiceSpec(scriptKey, type).cands().map((c) => c.q)).size;
  practiceCountCache.set(cacheKey, n);
  return n;
}

/** `count` soal acak (tanpa soal kembar) untuk satu tipe. */
export function buildPractice(
  scriptKey: JlptScriptKey,
  type: PracticeTypeKey,
  count: number,
): JlptQueueItem[] {
  return buildTier(practiceSpec(scriptKey, type), count, new Set());
}

// ---- Mode Mixed: campuran semua tipe soal Latihan untuk satu aksara ----------

export const PRACTICE_MIXED = "mixed" as const;
export type PracticeModeKey = PracticeTypeKey | typeof PRACTICE_MIXED;

/** Semua mode Latihan untuk aksara ini: tiap tipe soal + "mixed" di paling akhir. */
export function practiceModesFor(scriptKey: JlptScriptKey): PracticeModeKey[] {
  return [...practiceTypesFor(scriptKey), PRACTICE_MIXED];
}

/** Jumlah soal tersedia untuk satu mode (Mixed = jumlah semua tipe). */
export function practiceModeCount(
  scriptKey: JlptScriptKey,
  mode: PracticeModeKey,
): number {
  if (mode !== PRACTICE_MIXED) return practiceCount(scriptKey, mode);
  return practiceTypesFor(scriptKey).reduce(
    (sum, k) => sum + practiceCount(scriptKey, k),
    0,
  );
}

/**
 * `count` soal acak dari SEMUA tipe, dibagi rata antar tipe (tipe yang
 * soalnya lebih sedikit dari jatah tidak dipaksa; sisanya dioper ke tipe
 * lain). Kata yang sudah dipakai di satu tipe diutamakan tidak muncul lagi
 * di tipe lain, supaya soal sebelumnya tidak membocorkan jawabannya.
 */
export function buildPracticeMixed(
  scriptKey: JlptScriptKey,
  count: number,
): JlptQueueItem[] {
  const types = practiceTypesFor(scriptKey);
  const caps = types.map((k) => practiceCount(scriptKey, k));
  const alloc = types.map(() => 0);
  let left = Math.min(count, caps.reduce((a, b) => a + b, 0));
  // urutan pembagian diacak supaya sisa pembagian tidak selalu jatuh ke tipe pertama
  const order = shuffle(types.map((_, i) => i));
  while (left > 0) {
    let gave = false;
    for (const i of order) {
      if (left > 0 && alloc[i] < caps[i]) {
        alloc[i] += 1;
        left -= 1;
        gave = true;
      }
    }
    if (!gave) break;
  }
  const used = new Set<string>();
  const items = types.flatMap((k, i) =>
    alloc[i] > 0 ? buildTier(practiceSpec(scriptKey, k), alloc[i], used) : [],
  );
  return shuffle(items);
}

/** Satu pintu untuk lembar Latihan: tipe tunggal atau Mixed. */
export function buildPracticeMode(
  scriptKey: JlptScriptKey,
  mode: PracticeModeKey,
  count: number,
): JlptQueueItem[] {
  return mode === PRACTICE_MIXED
    ? buildPracticeMixed(scriptKey, count)
    : buildPractice(scriptKey, mode, count);
}

// ---------------------------------------------------------------------------
// Teks cerita/intro tiap tier (dipakai ConquestStory & ResultsScreen)
// ---------------------------------------------------------------------------

type Phase = { label: Bilingual; text: Bilingual };

export const JLPT_STORY: Record<
  JlptScriptKey,
  { epilogue: Bilingual; phases: Phase[] }
> = {
  // ── Kotoba · 5 tier · pangkat Baron (男爵) ───────────────────────────────
  // Lanjutan kisah Knight: Kapten mengirimmu ke Kotonoha (言の葉), kota pasar
  // perbatasan yang "mata uangnya adalah kata". Lulus = dianugerahi wilayah.
  kotoba: {
    epilogue: {
      en: "The Lord Chamberlain presses a wax seal onto the deed, and the market bell of Kotonoha rings out across the valley. “The barony is yours, Baron.” Words are no longer strangers to you — they are your subjects. Beyond the hills, the Viscount's citadel awaits, where the laws that bind words into sentences are kept.",
      id: "Kepala Rumah Tangga Kerajaan membubuhkan segel lilin pada akta tanahmu, dan lonceng pasar Kotonoha berdentang di seluruh lembah. “Wilayah ini milikmu, Baron.” Kata-kata kini bukan lagi orang asing bagimu — mereka adalah rakyatmu. Di balik perbukitan, benteng sang Viscount menanti, tempat hukum yang merangkai kata menjadi kalimat disimpan.",
    },
    phases: [
      {
        label: {
          en: "Tier 1 — The Merchants' Ledger",
          id: "Tier 1 — Buku Besar Para Saudagar",
        },
        text: {
          en: "🖌️ Your first morning in Kotonoha, a few days after the harbor ceremony. The guild clerk slides over a ledger he scribbled in a hurry, entirely in hiragana. “A contract without kanji carries no weight in court,” he mutters. One word in each sentence is underlined — pick the kanji that writes it correctly before the ink dries.",
          id: "🖌️ Pagi pertamamu di Kotonoha, beberapa hari setelah upacara di pelabuhan. Juru tulis serikat dagang menyodorkan buku besar yang ia coret terburu-buru, semuanya hiragana. “Kontrak tanpa kanji tak berbobot di pengadilan,” gumamnya. Satu kata di tiap kalimat digarisbawahi — pilih kanji yang menuliskannya dengan benar sebelum tintanya kering.",
        },
      },
      {
        label: {
          en: "Tier 2 — The Envoy's Letter",
          id: "Tier 2 — Surat Sang Utusan",
        },
        text: {
          en: "🔤 The ledger is settled — and just then a sealed letter from a far-off envoy arrives, dense with N5 kanji. The town crier squints, shakes his head, and the whole square waits for someone to read it aloud. One word in each sentence is underlined: pick how it is read (hiragana).",
          id: "🔤 Buku besar beres — dan tepat saat itu sepucuk surat bersegel dari utusan jauh tiba, padat dengan kanji N5. Si pembawa pengumuman menyipitkan mata lalu menggeleng, dan seluruh alun-alun menunggu seseorang membacakannya. Satu kata di tiap kalimat digarisbawahi: pilih cara bacanya (hiragana).",
        },
      },
      {
        label: {
          en: "Tier 3 — The Gnawed Contract",
          id: "Tier 3 — Kontrak yang Digerogoti Tikus",
        },
        text: {
          en: "✍️ By lantern light, the market's oldest contract turns up in the cellar — gnawed by mice, one word missing from every clause. “Fill a gap wrong,” the old merchant warns, “and somebody loses their shop.” Read each sentence and pick the word that fits best.",
          id: "✍️ Di bawah cahaya lentera, kontrak tertua pasar ditemukan di gudang bawah tanah — digerogoti tikus, satu kata hilang di setiap pasalnya. “Kalau salah mengisi,” kata saudagar tua itu, “ada yang kehilangan tokonya.” Baca tiap kalimat dan pilih kata yang paling cocok.",
        },
      },
      {
        label: {
          en: "Tier 4 — The Twin Scribes",
          id: "Tier 4 — Dua Juru Tulis Kembar",
        },
        text: {
          en: "🪶 The mended contract is read aloud — and the two rival scribes who drafted it start to bicker. “I wrote one word, he wrote another, yet they mean the same thing!” The town magistrate raises a hand: only someone who knows which words truly echo each other can settle it. A word appears — pick the word closest in meaning.",
          id: "🪶 Kontrak yang sudah ditambal dibacakan lantang — dan dua juru tulis saingan yang menyusunnya mulai berdebat. “Aku menulis satu kata, dia menulis kata lain, padahal maknanya sama!” Hakim kota mengangkat tangan: hanya orang yang tahu kata mana yang benar-benar bergema satu sama lain yang bisa menengahi. Sebuah kata muncul — pilih kata yang artinya paling mirip.",
        },
      },
      {
        label: {
          en: "Tier 5 — The Court of Witnesses",
          id: "Tier 5 — Pengadilan Para Saksi",
        },
        text: {
          en: "🧩 The final test, held in the town court at dusk: the scribes' quarrel has grown into a lawsuit between two merchants, and the verdict falls to you. A word appears in 「 」 and four witnesses each use it in a sentence — only one tells the truth, using the word correctly. Name that witness, and the barony is yours.",
          id: "🧩 Ujian pemungkas, digelar di pengadilan kota saat senja: pertengkaran para juru tulis berkembang menjadi gugatan dua saudagar, dan putusannya ada di tanganmu. Sebuah kata muncul di dalam 「 」 dan empat saksi masing-masing memakainya dalam kalimat — hanya satu yang jujur, memakai kata itu dengan benar. Tunjuk saksi itu, dan wilayah ini jadi milikmu.",
        },
      },
    ],
  },

  // ── Bunpō · 5 tier · pangkat Viscount (子爵) ─────────────────────────────
  // Sang Viscount menjaga Benteng Hukum di perbatasan. Tata bahasa = hukum
  // yang menahan seluruh kerajaan agar tidak runtuh.
  bunpo: {
    epilogue: {
      en: "The Viscount lifts the final tile to the lantern light, and the star at its center glows. “Every sentence in my realm is now in your hands,” he says, pinning the signet of a Viscount to your cloak. Only one title is left on the road through N5 — the Count's, in the capital's Hall of a Thousand Strokes, where the kanji are kept.",
      id: "Sang Viscount mengangkat ubin terakhir ke cahaya lentera, dan bintang di tengahnya berpendar. “Setiap kalimat di wilayahku kini ada di tanganmu,” katanya sambil menyematkan lambang Viscount di jubahmu. Tinggal satu gelar di jalan N5 — gelar Count, di Balairung Seribu Goresan di ibu kota, tempat para kanji disimpan.",
    },
    phases: [
      {
        label: {
          en: "Tier 1 — The Stone of Old Law",
          id: "Tier 1 — Batu Hukum Kuno",
        },
        text: {
          en: "📜 At the gate of the Citadel stands a pillar engraved with the old patterns — the laws every sentence in the realm must obey. The gatekeeper traces one with his finger: “Tell me what it does.” A grammar pattern appears — pick its function from four choices.",
          id: "📜 Di gerbang Benteng berdiri sebuah tugu berukir pola-pola kuno — hukum yang wajib ditaati setiap kalimat di kerajaan. Penjaga gerbang menelusuri satu ukiran dengan jarinya: “Katakan padaku, apa fungsinya.” Sebuah pola tata bahasa muncul — pilih fungsinya dari empat pilihan.",
        },
      },
      {
        label: {
          en: "Tier 2 — The Bridge of Particles",
          id: "Tier 2 — Jembatan Partikel",
        },
        text: {
          en: "🌉 To cross the moat you must walk the Bridge of Particles. A plank is missing every few steps, and only the right small word — は, が, を, に, で — will bear your weight. A sentence appears with a blank — pick the particle that fits, and don't look down.",
          id: "🌉 Untuk menyeberangi parit, kau harus melewati Jembatan Partikel. Setiap beberapa langkah ada papan yang hilang, dan hanya kata kecil yang tepat — は, が, を, に, で — yang sanggup menahan bobotmu. Sebuah kalimat muncul dengan bagian kosong — pilih partikel yang cocok, dan jangan menunduk.",
        },
      },
      {
        label: {
          en: "Tier 3 — The Verb Forge",
          id: "Tier 3 — Tempa Kata Kerja",
        },
        text: {
          en: "🔥 Inside, the Citadel's smith hammers verbs on his anvil until they bend into new shapes — て-form, ない-form, ます-form. “A verb shaped wrong will snap in battle,” he grunts. A sentence appears with an empty verb — pick the correctly conjugated form.",
          id: "🔥 Di dalam, pandai besi Benteng menempa kata kerja di landasannya hingga melengkung menjadi bentuk baru — bentuk て, ない, ます. “Kata kerja yang salah bentuk akan patah di medan perang,” geramnya. Sebuah kalimat muncul dengan kata kerja kosong — pilih bentuk konjugasi yang tepat.",
        },
      },
      {
        label: {
          en: "Tier 4 — The Forged Decrees",
          id: "Tier 4 — Titah-Titah Palsu",
        },
        text: {
          en: "🧩 A royal messenger bursts in with four decrees — three are forgeries, riddled with broken grammar. A pattern appears in 「 」 and four sentences use it; only one uses it correctly. Find the genuine decree before the forgers slip away.",
          id: "🧩 Seorang kurir kerajaan menerobos masuk membawa empat titah — tiga di antaranya palsu, penuh tata bahasa yang rusak. Sebuah pola muncul di dalam 「 」 dan empat kalimat memakainya; hanya satu yang memakainya dengan benar. Temukan titah yang asli sebelum para pemalsu kabur.",
        },
      },
      {
        label: {
          en: "Tier 5 — The Shapeshifter's Hall",
          id: "Tier 5 — Aula Sang Pengubah Rupa",
        },
        text: {
          en: "🪞 The last door opens onto the Shapeshifter's Hall, lined with mirrors that bend every sentence into a new shape. A sentence appears with an instruction — make it negative, past, or て-form — and four reflections answer back. Only one is true; pick it, the way the Viscount himself will test you.",
          id: "🪞 Pintu terakhir terbuka ke Aula Sang Pengubah Rupa, dindingnya penuh cermin yang membengkokkan setiap kalimat menjadi bentuk baru. Sebuah kalimat muncul bersama perintah — jadikan negatif, lampau, atau bentuk て — dan empat bayangan menjawab. Hanya satu yang benar; pilih itu, seperti ujian yang akan diberikan sang Viscount sendiri.",
        },
      },
    ],
  },

  // ── Kanji · 5 tier · pangkat Count (伯爵) ────────────────────────────────
  // Ibu kota, Balairung Seribu Goresan (千画の間). Ujian terakhir jalur N5.
  kanji: {
    epilogue: {
      en: "Applause echoes down the Hall of a Thousand Strokes as the Imperial Archivist sets the Count's seal upon your scroll. Hiragana, Katakana, Kotoba, Bunpō, and Kanji — all of N5 now lies within your domain, Count. Beyond the capital's eastern gate, the road to the Marquis's lands stretches on… still sealed, for now.",
      id: "Tepuk tangan menggema di Balairung Seribu Goresan saat Arsiparis Kekaisaran membubuhkan segel Count pada gulunganmu. Hiragana, Katakana, Kotoba, Bunpō, dan Kanji — seluruh N5 kini berada dalam wilayahmu, Count. Di balik gerbang timur ibu kota, jalan menuju tanah sang Marquis terbentang… untuk sementara masih tersegel.",
    },
    phases: [
      {
        label: {
          en: "Tier 1 — The Wall of Ancient Characters",
          id: "Tier 1 — Dinding Aksara Kuno",
        },
        text: {
          en: "📜 In the capital, the Imperial Archivist leads you into the Hall of a Thousand Strokes, its walls carved from floor to ceiling with kanji. “Anyone can admire a character,” she says. “A Count must know what it means.” A kanji appears — pick its meaning from four choices.",
          id: "📜 Di ibu kota, Arsiparis Kekaisaran menuntunmu ke Balairung Seribu Goresan, dindingnya terukir kanji dari lantai hingga langit-langit. “Siapa pun bisa mengagumi sebuah aksara,” katanya. “Seorang Count harus tahu artinya.” Sebuah kanji muncul — pilih artinya dari empat pilihan.",
        },
      },
      {
        label: {
          en: "Tier 2 — The Herald's Proclamation",
          id: "Tier 2 — Maklumat Sang Juru Warta",
        },
        text: {
          en: "🔤 At dawn a proclamation arrives for the court — but the herald has lost his voice, and the nobles are already filing in. You must read it in his place. A kanji appears — pick how it is read (hiragana).",
          id: "🔤 Menjelang fajar sebuah maklumat tiba untuk dibacakan di hadapan istana — tetapi sang juru warta kehilangan suaranya, dan para bangsawan sudah berdatangan. Kaulah yang harus membacakannya. Sebuah kanji muncul — pilih cara bacanya (hiragana).",
        },
      },
      {
        label: {
          en: "Tier 3 — The Forger's Seals",
          id: "Tier 3 — Stempel Sang Pemalsu",
        },
        text: {
          en: "🖌️ A counterfeiter has been stamping fake seals with characters that look almost like the real ones — one stroke too many, one too few. A meaning appears — pick the kanji that truly carries it. Careful: the wrong choices look alike.",
          id: "🖌️ Seorang pemalsu mencetak stempel palsu dengan aksara yang nyaris sama dengan aslinya — kelebihan satu goresan, kekurangan satu goresan. Sebuah arti muncul — pilih kanji yang benar-benar memilikinya. Hati-hati: pilihan salahnya bentuknya mirip.",
        },
      },
      {
        label: {
          en: "Tier 4 — The Imperial Decree",
          id: "Tier 4 — Titah Kekaisaran",
        },
        text: {
          en: "✍️ With the forged seals swept away, the Emperor's own decree is brought out and laid open on the table: a single kanji word missing from every sentence, waiting for a Count's pen. Read each sentence and pick the kanji word that fits best.",
          id: "✍️ Setelah stempel-stempel palsu disingkirkan, titah Kaisar sendiri dibawa keluar dan dibentangkan di atas meja: satu kata kanji hilang di setiap kalimatnya, menunggu pena seorang Count. Baca tiap kalimat dan pilih kata kanji yang paling cocok.",
        },
      },
      {
        label: {
          en: "Tier 5 — The Four Petitioners",
          id: "Tier 5 — Empat Pemohon",
        },
        text: {
          en: "🧩 The final tier, before the throne itself: four petitioners step forward, each presenting a sentence that contains the very same kanji — but only one uses it the way it is truly used. A kanji appears in 「 」 and four sentences follow. Pick the one that rings true, and the Count's seal is yours.",
          id: "🧩 Tier terakhir, di hadapan singgasana itu sendiri: empat pemohon maju satu per satu, masing-masing membawa kalimat yang memuat kanji yang sama persis — tetapi hanya satu yang memakainya dengan cara yang benar. Sebuah kanji muncul di dalam 「 」 dan empat kalimat menyusul. Pilih yang paling wajar, dan segel Count menjadi milikmu.",
        },
      },
    ],
  },
};

export function getJlptStory(
  scriptKey: JlptScriptKey,
  lang: "en" | "id",
): { epilogue: string; phases: { label: string; text: string }[] } {
  const s = JLPT_STORY[scriptKey];
  return {
    epilogue: s.epilogue[lang],
    phases: s.phases.map((p) => ({ label: p.label[lang], text: p.text[lang] })),
  };
}
