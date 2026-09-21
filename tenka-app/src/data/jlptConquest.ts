// Mode Penaklukan ala ujian JLPT N5 — dipakai Basic Kotoba, Bunpō, dan Kanji N5.
//
// Soalnya ratusan, jadi Penaklukan tidak lagi "semua soal sekaligus". Sekarang
// formatnya per tier, tiap tier N soal acak (pilihan ganda 4 opsi):
//
//   Basic Kotoba (Moji · Goi) — 4 tier
//     Tier 1 — Kalimat penuh hiragana, satu kata digarisbawahi → tebak kanjinya
//     Tier 2 — Kalimat penuh kanji N5, satu kata digarisbawahi → tebak hiragananya
//     Tier 3 — Pilih kata yang paling cocok untuk bagian kosong kalimat
//     Tier 4 — 「kata」を つかう ぶんは どれですか → pilih kalimat yang benar
//   Kanji N5 — 4 tier
//     Tier 1 — Arti kanji
//     Tier 2 — Baca kanji (hiragana)
//     Tier 3 — Tebak kanjinya dari arti (pilihan salah = kanji yang bentuknya
//              mirip, mis. 日/目/白)
//     Tier 4 — Pilih kata kanji yang paling cocok untuk kalimat
//   Bunpō N5 — 5 tier
//     Tier 1 — Arti pola
//     Tier 2 — Tebak partikel yang tepat
//     Tier 3 — Tebak konjugasi kata kerja yang tepat (bentuk lain dari kata
//              kerja yang sama jadi pilihan salah, bukan kata lain)
//     Tier 4 — 「pola」を つかう ぶんは どれですか → pilih kalimat yang
//              pemakaiannya benar (bank: bunpoUsage.ts)
//     Tier 5 — Susun kalimat ala JLPT: 4 kotak, satu bertanda ★ → pilih
//              potongan yang jatuh di ★ (bank: bunpoArrange.ts)
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
import { KANJI_ALT_READINGS } from "./kanjiReadings";
import { BUNPO_USAGE } from "./bunpoUsage";
import { BUNPO_ARRANGE } from "./bunpoArrange";
import type { VerbFormKey } from "./types";
import { shuffle } from "../utils/shuffle";

/** Syarat lulus: minimal segini persen jawaban benar di SETIAP tier. */
export const JLPT_PASS_PERCENT = 80;

/** Jumlah benar minimal di satu tier (dibulatkan ke atas). */
export function jlptPassMark(tierLength: number): number {
  return Math.ceil((tierLength * JLPT_PASS_PERCENT) / 100);
}

/** Batas salah yang masih boleh di satu tier; lewat dari ini = gagal. */
export function jlptMaxWrong(tierLength: number): number {
  return tierLength - jlptPassMark(tierLength);
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

const en = (b: Bilingual): string => b.en;
const isCjk = (ch: string) => /[\u4e00-\u9fff]/.test(ch);

// ---------------------------------------------------------------------------
// Kandidat soal per script
// ---------------------------------------------------------------------------

const L_ROMAJI = "quiz.romajiLabel";
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

// Sub-tier (27) → Chapter (8: orang, waktu, benda, tempat, kata kerja, ...).
// Pilihan salah Tier 3 diambil dari CHAPTER lain, bukan cuma sub-tier lain —
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
  return BUNPO_N5_CHAPTERS.flatMap((ch, group) =>
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
}

// Kalimat dengan pola/partikel dikosongkan ("...") → pilih pola yang cocok.
// Sudah tidak dipakai di Tier 3 (diganti bunpoConjugation), disimpan buat
// kandidat Tier 4 nanti.
function bunpoFill(): Candidate[] {
  return BUNPO_N5_CHAPTERS.flatMap((ch, group) =>
    ch.flatMap((e) => {
      const blank = e[4];
      if (!blank || !blank.includes("...")) return [];
      return [
        {
          q: blank,
          a: e[0],
          group,
          extra: `${e[1]} — ${en(e[5])}`,
          extraLabelKey: L_EXAMPLE,
        },
      ];
    }),
  );
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

// Tier 5 Bunpō — susun kalimat ala JLPT (★). Kalimat punya 4 kotak, satu
// bertanda ★; keempat potongan jadi pilihan jawaban, jawabannya potongan yang
// jatuh di ★ kalau kalimatnya disusun dengan urutan yang benar.
const ARRANGE_SLOT = "＿＿";
const ARRANGE_STAR = "★";

function bunpoArrange(): Candidate[] {
  return BUNPO_ARRANGE.flatMap(
    ([prefix, parts, suffix, star, full, meaning], i) => {
      // potongan kembar → pilihan jawaban ambigu, soalnya dilewati
      if (new Set(parts).size !== parts.length) return [];
      const slots = parts.map((_, k) => (k === star ? ARRANGE_STAR : ARRANGE_SLOT));
      const closing = /^[。、？！]/.test(suffix) ? suffix : suffix ? ` ${suffix}` : "";
      const q = `${prefix ? `${prefix} ` : ""}${slots.join(" ")}${closing}`;
      return [
        {
          q,
          a: parts[star],
          group: i,
          id: `susun-${i}`,
          distractors: parts.filter((_, k) => k !== star),
          extra: `${full} — ${en(meaning)}`,
          extraLabelKey: L_EXAMPLE,
        },
      ];
    },
  );
}

export const JLPT_TIER_TYPES = {
  meaning: "jlpt-meaning",
  reading: "jlpt-reading",
  fill: "jlpt-fill",
  write: "jlpt-write",
  usage: "jlpt-usage",
  particle: "jlpt-particle",
  conjugation: "jlpt-conjugation",
  arrange: "jlpt-arrange",
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
    { type: JLPT_TIER_TYPES.usage, cands: kotobaUsage, mode: "any" },
  ],
  bunpo: [
    { type: JLPT_TIER_TYPES.meaning, cands: bunpoMeaning, mode: "any" },
    {
      type: JLPT_TIER_TYPES.particle,
      cands: bunpoParticleFill,
      mode: "any",
    },
    { type: JLPT_TIER_TYPES.conjugation, cands: bunpoConjugation, mode: "any" },
    { type: JLPT_TIER_TYPES.usage, cands: bunpoUsage, mode: "any" },
    { type: JLPT_TIER_TYPES.arrange, cands: bunpoArrange, mode: "any" },
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
  ],
};

/** Jumlah tier ujian Penaklukan untuk script ini (Kotoba 4, Bunpō 5, Kanji 4). */
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
    return [c.q, c.a, spec.type, c.extra, c.extraLabelKey, choices];
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

/** Tipe soal yang bisa dilatih untuk script ini, urut seperti Tier 1, 2, ... */
export function practiceTypesFor(scriptKey: JlptScriptKey): PracticeTypeKey[] {
  return SPECS[scriptKey].map((spec) => TYPE_KEY_BY_VALUE[spec.type]);
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
  const spec = SPECS[scriptKey].find((s) => s.type === JLPT_TIER_TYPES[type]);
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

// ---------------------------------------------------------------------------
// Teks cerita/intro tiap tier (dipakai ConquestStory & ResultsScreen)
// ---------------------------------------------------------------------------

type Phase = { label: Bilingual; text: Bilingual };

export const JLPT_STORY: Record<
  JlptScriptKey,
  { epilogue: Bilingual; phases: Phase[] }
> = {
  kotoba: {
    epilogue: {
      en: "You passed all four tiers of the N5 vocabulary exam — the examiners stamp your scroll. Basic Kotoba is yours.",
      id: "Kamu lulus keempat tier ujian kosakata N5 — para penguji membubuhkan cap di gulunganmu. Basic Kotoba resmi kau kuasai.",
    },
    phases: [
      {
        label: {
          en: "Tier 1 — Find the Kanji",
          id: "Tier 1 — Tebak Kanjinya",
        },
        text: {
          en: "🖌️ The exam opens with writing. A sentence appears fully in hiragana with one word underlined — pick how that word is written in kanji.",
          id: "🖌️ Ujian dibuka dengan menulis. Sebuah kalimat muncul penuh hiragana dengan satu kata digarisbawahi — pilih cara menulis kata itu dalam kanji.",
        },
      },
      {
        label: {
          en: "Tier 2 — Find the Reading",
          id: "Tier 2 — Tebak Hiragananya",
        },
        text: {
          en: "🔤 Now the other way around. A sentence appears in N5 kanji with one word underlined — pick how it is read (hiragana).",
          id: "🔤 Sekarang sebaliknya. Sebuah kalimat muncul dalam kanji N5 dengan satu kata digarisbawahi — pilih cara bacanya (hiragana).",
        },
      },
      {
        label: {
          en: "Tier 3 — Choose the Best Word",
          id: "Tier 3 — Pilih Kata yang Paling Cocok",
        },
        text: {
          en: "✍️ A sentence with a blank. Pick the word that fits best.",
          id: "✍️ Sebuah kalimat dengan bagian kosong. Pilih kata yang paling cocok.",
        },
      },
      {
        label: {
          en: "Tier 4 — Choose the Correct Sentence",
          id: "Tier 4 — Pilih Kalimat yang Benar",
        },
        text: {
          en: "🧩 The last tier: a word appears in 「 」 and four sentences use it — only one uses it correctly. Pick that sentence.",
          id: "🧩 Tier terakhir: sebuah kata muncul di dalam 「 」 dan ada empat kalimat yang memakainya — hanya satu yang pemakaiannya benar. Pilih kalimat itu.",
        },
      },
    ],
  },
  bunpo: {
    epilogue: {
      en: "You passed all five tiers of the N5 grammar exam — the examiners stamp your scroll. Bunpō is yours.",
      id: "Kamu lulus kelima tier ujian tata bahasa N5 — para penguji membubuhkan cap di gulunganmu. Bunpō resmi kau kuasai.",
    },
    phases: [
      {
        label: { en: "Tier 1 — Pattern Meaning", id: "Tier 1 — Arti Pola" },
        text: {
          en: "📜 The exam opens with meanings. A grammar pattern appears — pick its function from four choices.",
          id: "📜 Ujian dibuka dengan arti pola. Sebuah pola tata bahasa muncul — pilih fungsinya dari empat pilihan.",
        },
      },
      {
        label: { en: "Tier 2 — Choose the Particle", id: "Tier 2 — Tebak Partikel" },
        text: {
          en: "🔤 Next is particles. A sentence appears with a blank — pick the particle that fits.",
          id: "🔤 Berikutnya partikel. Sebuah kalimat muncul dengan bagian kosong — pilih partikel yang tepat.",
        },
      },
      {
        label: {
          en: "Tier 3 — Verb Conjugation",
          id: "Tier 3 — Konjugasi Kata Kerja",
        },
        text: {
          en: "✍️ Next up, verbs: a sentence with a blank verb. Pick the correctly conjugated form.",
          id: "✍️ Berikutnya kata kerja: sebuah kalimat dengan kata kerja kosong. Pilih bentuk konjugasi yang tepat.",
        },
      },
      {
        label: {
          en: "Tier 4 — Choose the Correct Sentence",
          id: "Tier 4 — Pilih Kalimat yang Benar",
        },
        text: {
          en: "🧩 A grammar pattern appears in 「 」 and four sentences use it — only one uses it correctly. Pick that sentence.",
          id: "🧩 Sebuah pola tata bahasa muncul di dalam 「 」 dan ada empat kalimat yang memakainya — hanya satu yang pemakaiannya benar. Pilih kalimat itu.",
        },
      },
      {
        label: {
          en: "Tier 5 — Arrange the Sentence (★)",
          id: "Tier 5 — Susun Kalimat (★)",
        },
        text: {
          en: "🧱 The last tier, straight from the JLPT: a sentence with four blanks, one marked ★. Put the four pieces in the right order, then pick the piece that lands on ★.",
          id: "🧱 Tier terakhir, persis ala JLPT: sebuah kalimat dengan empat kotak kosong, salah satunya bertanda ★. Susun keempat potongan dengan urutan yang benar, lalu pilih potongan yang jatuh di posisi ★.",
        },
      },
    ],
  },
  kanji: {
    epilogue: {
      en: "You passed all four tiers of the N5 kanji exam — the examiners stamp your scroll. Kanji N5 is yours.",
      id: "Kamu lulus keempat tier ujian kanji N5 — para penguji membubuhkan cap di gulunganmu. Kanji N5 resmi kau kuasai.",
    },
    phases: [
      {
        label: { en: "Tier 1 — Kanji Meaning", id: "Tier 1 — Arti Kanji" },
        text: {
          en: "📜 The exam opens with meanings. A kanji appears — pick what it means from four choices.",
          id: "📜 Ujian dibuka dengan arti kanji. Sebuah kanji muncul — pilih artinya dari empat pilihan.",
        },
      },
      {
        label: { en: "Tier 2 — Reading Kanji", id: "Tier 2 — Baca Kanji" },
        text: {
          en: "🔤 Next is reading. A kanji appears — pick how it is read (hiragana).",
          id: "🔤 Berikutnya membaca. Sebuah kanji muncul — pilih cara bacanya (hiragana).",
        },
      },
      {
        label: { en: "Tier 3 — Pick the Kanji", id: "Tier 3 — Tebak Kanjinya" },
        text: {
          en: "🖌️ Now the other way around. A meaning appears — pick the kanji that has it. Careful: the wrong choices look alike.",
          id: "🖌️ Sekarang sebaliknya. Sebuah arti muncul — pilih kanji yang punya arti itu. Hati-hati: pilihan salahnya bentuknya mirip.",
        },
      },
      {
        label: {
          en: "Tier 4 — Choose the Best Word",
          id: "Tier 4 — Pilih Kata yang Paling Cocok",
        },
        text: {
          en: "✍️ The last tier: a sentence with a blank. Pick the kanji word that fits best.",
          id: "✍️ Tier terakhir: sebuah kalimat dengan bagian kosong. Pilih kata kanji yang paling cocok.",
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
