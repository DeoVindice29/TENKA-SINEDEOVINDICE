// Bank soal Tier 5 Penaklukan Bunpō — Sentence Transformation (ubah bentuk kalimat).
//
// Sebuah kalimat ditampilkan, lalu ada perintah mengubahnya ke bentuk tertentu
// (negatif, lampau, bentuk て, bentuk ない, dst.). Ada 4 pilihan jawaban, cuma
// satu yang benar. Sama seperti bunpoUsage.ts, soal ini ditulis tangan: pilihan
// salah harus benar-benar SALAH secara tata bahasa (bukan sekadar terdengar
// aneh), supaya tidak ada jawaban ganda.
//
// Pedoman kalau mau menambah soal:
//   • Pilihan salah harus salah karena SATU alasan yang jelas — mis. salah
//     bentuk konjugasi (のみて ✗), atau menempelkan akhiran dua kali.
//   • Jangan masukkan bentuk yang sebenarnya juga benar. Contoh: bentuk negatif
//     sopan boleh ditulis ～ません ATAU ～ないです, jadi kalau jawabannya
//     ～ません, jangan taruh ～ないです sebagai pilihan salah (dan sebaliknya).
//   • Kalimat & pilihan ditulis dengan kanji N5 + hiragana (seperti contoh di
//     bawah), tanpa spasi antarbunsetsu.
//   • `instruction` = perintah dalam dua bahasa; pakai konstanta di bawah supaya
//     kalimatnya seragam.
//
// Format tiap soal:
//   [kalimat asal, perintah, jawaban benar, salah 1, salah 2, salah 3, arti jawaban benar]

import type { Bilingual } from "./types";

export type TransformEntry = readonly [
  sentence: string,
  instruction: Bilingual,
  correct: string,
  wrongA: string,
  wrongB: string,
  wrongC: string,
  meaning: Bilingual,
];

// ---- perintah (dipakai berulang) -------------------------------------------
const NEGATIVE: Bilingual = {
  en: "What is the correct negative form?",
  id: "bentuk negatif yang benar adalah?",
};
const PAST: Bilingual = {
  en: "What is the correct past form?",
  id: "bentuk lampau yang benar adalah?",
};
const PAST_NEGATIVE: Bilingual = {
  en: "What is the correct past negative form?",
  id: "bentuk negatif lampau yang benar adalah?",
};
const TE_FORM: Bilingual = {
  en: "What is the correct て-form of the verb?",
  id: "bentuk て dari kata kerjanya yang benar adalah?",
};
const NAI_FORM: Bilingual = {
  en: "What is the correct ない-form of the verb?",
  id: "bentuk ない dari kata kerjanya yang benar adalah?",
};
const TA_FORM: Bilingual = {
  en: "What is the correct plain past (た-form) of the verb?",
  id: "bentuk lampau biasa (bentuk た) dari kata kerjanya yang benar adalah?",
};
const WANT: Bilingual = {
  en: "What is the correct form to say “I want to …”?",
  id: "bentuk “ingin …” (〜たいです) yang benar adalah?",
};
const LETS: Bilingual = {
  en: "What is the correct form to say “Let's …”?",
  id: "bentuk ajakan “mari …” (〜ましょう) yang benar adalah?",
};
const PLEASE: Bilingual = {
  en: "What is the correct form to say “Please …”?",
  id: "bentuk permintaan “tolong …” (〜てください) yang benar adalah?",
};
const PLEASE_NOT: Bilingual = {
  en: "What is the correct form to say “Please don't …”?",
  id: "bentuk larangan “tolong jangan …” (〜ないでください) yang benar adalah?",
};

export const BUNPO_TRANSFORM: readonly TransformEntry[] = [
  // ---- negatif sopan ------------------------------------------------------
  [
    "学校へ行きます。",
    NEGATIVE,
    "学校へ行きません。",
    "学校へ行かないです。",
    "学校へ行きませんでした。",
    "学校へ行きないです。",
    { en: "I don't go to school.", id: "Saya tidak pergi ke sekolah." },
  ],
  [
    "毎日日本語を勉強します。",
    NEGATIVE,
    "毎日日本語を勉強しません。",
    "毎日日本語を勉強ません。",
    "毎日日本語を勉強しないません。",
    "毎日日本語を勉強じゃありません。",
    {
      en: "I don't study Japanese every day.",
      id: "Saya tidak belajar bahasa Jepang setiap hari.",
    },
  ],
  [
    "わたしは学生です。",
    NEGATIVE,
    "わたしは学生じゃありません。",
    "わたしは学生じゃないません。",
    "わたしは学生くないです。",
    "わたしは学生がありません。",
    { en: "I am not a student.", id: "Saya bukan pelajar." },
  ],
  [
    "この本は高いです。",
    NEGATIVE,
    "この本は高くないです。",
    "この本は高いくないです。",
    "この本は高じゃないです。",
    "この本は高いじゃないです。",
    { en: "This book is not expensive.", id: "Buku ini tidak mahal." },
  ],
  [
    "パンを食べたいです。",
    NEGATIVE,
    "パンを食べたくないです。",
    "パンを食べたいじゃないです。",
    "パンを食べないたいです。",
    "パンを食べたいません。",
    { en: "I don't want to eat bread.", id: "Saya tidak ingin makan roti." },
  ],

  // ---- lampau -------------------------------------------------------------
  [
    "本を読みます。",
    PAST,
    "本を読みました。",
    "本を読んでした。",
    "本を読むました。",
    "本を読みでした。",
    { en: "I read a book.", id: "Saya membaca buku." },
  ],
  [
    "この町は静かです。",
    PAST,
    "この町は静かでした。",
    "この町は静かかったです。",
    "この町は静かくなかったです。",
    "この町は静かにでした。",
    { en: "This town was quiet.", id: "Kota ini dulu sepi." },
  ],
  [
    "この映画はおもしろいです。",
    PAST,
    "この映画はおもしろかったです。",
    "この映画はおもしろいでした。",
    "この映画はおもしろくでした。",
    "この映画はおもしろだったです。",
    { en: "This movie was interesting.", id: "Film ini menarik." },
  ],
  [
    "朝ごはんを食べます。",
    PAST_NEGATIVE,
    "朝ごはんを食べませんでした。",
    "朝ごはんを食べませんました。",
    "朝ごはんを食べないでした。",
    "朝ごはんを食べなかったません。",
    {
      en: "I didn't eat breakfast.",
      id: "Saya tidak makan pagi (sarapan).",
    },
  ],

  // ---- bentuk て ----------------------------------------------------------
  [
    "水を飲みます。",
    TE_FORM,
    "飲んで",
    "飲みて",
    "飲いて",
    "飲って",
    { en: "drink → drink and … / please drink", id: "minum → minum lalu … / tolong minum" },
  ],
  [
    "学校へ行きます。",
    TE_FORM,
    "行って",
    "行いて",
    "行きて",
    "行んで",
    { en: "go → go and … / please go", id: "pergi → pergi lalu … / tolong pergi" },
  ],
  [
    "日本語を話します。",
    TE_FORM,
    "話して",
    "話いて",
    "話って",
    "話んで",
    { en: "speak → speak and … / please speak", id: "berbicara → berbicara lalu … / tolong bicara" },
  ],
  [
    "川で泳ぎます。",
    TE_FORM,
    "泳いで",
    "泳ぎて",
    "泳って",
    "泳んで",
    { en: "swim → swim and … / please swim", id: "berenang → berenang lalu … / tolong berenang" },
  ],
  [
    "六時に起きます。",
    TE_FORM,
    "起きて",
    "起いて",
    "起って",
    "起こて",
    { en: "wake up → wake up and … / please wake up", id: "bangun → bangun lalu … / tolong bangun" },
  ],
  [
    "うちへ来ます。",
    TE_FORM,
    "来て",
    "来きて",
    "来って",
    "来んで",
    { en: "come → come and … / please come", id: "datang → datang lalu … / tolong datang" },
  ],

  // ---- bentuk ない --------------------------------------------------------
  [
    "手紙を書きます。",
    NAI_FORM,
    "書かない",
    "書きない",
    "書くない",
    "書けない",
    { en: "I don't write a letter.", id: "Saya tidak menulis surat." },
  ],
  [
    "友だちに会います。",
    NAI_FORM,
    "会わない",
    "会あない",
    "会いない",
    "会うない",
    { en: "I don't meet my friend.", id: "Saya tidak bertemu teman." },
  ],
  [
    "バスを待ちます。",
    NAI_FORM,
    "待たない",
    "待ちない",
    "待つない",
    "待てない",
    { en: "I don't wait for the bus.", id: "Saya tidak menunggu bus." },
  ],
  [
    "うちへ帰ります。",
    NAI_FORM,
    "帰らない",
    "帰りない",
    "帰るない",
    "帰れない",
    { en: "I don't go home.", id: "Saya tidak pulang." },
  ],
  [
    "テレビを見ます。",
    NAI_FORM,
    "見ない",
    "見らない",
    "見かない",
    "見なない",
    { en: "I don't watch TV.", id: "Saya tidak menonton TV." },
  ],

  // ---- bentuk lampau biasa (た) --------------------------------------------
  [
    "かばんを買います。",
    TA_FORM,
    "買った",
    "買いた",
    "買んだ",
    "買うた",
    { en: "I bought a bag.", id: "Saya membeli tas." },
  ],
  [
    "友だちと遊びます。",
    TA_FORM,
    "遊んだ",
    "遊びた",
    "遊いた",
    "遊った",
    { en: "I played with my friend.", id: "Saya bermain dengan teman." },
  ],

  // ---- ～たいです ---------------------------------------------------------
  [
    "水を飲みます。",
    WANT,
    "水を飲みたいです。",
    "水を飲むたいです。",
    "水を飲んでたいです。",
    "水を飲みますたいです。",
    { en: "I want to drink water.", id: "Saya ingin minum air." },
  ],

  // ---- ～ましょう ---------------------------------------------------------
  [
    "いっしょに映画を見ます。",
    LETS,
    "いっしょに映画を見ましょう。",
    "いっしょに映画を見るましょう。",
    "いっしょに映画を見てましょう。",
    "いっしょに映画を見ませんましょう。",
    { en: "Let's watch a movie together.", id: "Mari menonton film bersama." },
  ],

  // ---- ～てください -------------------------------------------------------
  [
    "窓を開けます。",
    PLEASE,
    "窓を開けてください。",
    "窓を開けますください。",
    "窓を開けるください。",
    "窓を開けないください。",
    { en: "Please open the window.", id: "Tolong buka jendela." },
  ],

  // ---- ～ないでください ---------------------------------------------------
  [
    "ここで写真を撮ります。",
    PLEASE_NOT,
    "ここで写真を撮らないでください。",
    "ここで写真を撮りないでください。",
    "ここで写真を撮ないでください。",
    "ここで写真を撮ってないでください。",
    {
      en: "Please don't take photos here.",
      id: "Tolong jangan memotret di sini.",
    },
  ],
];
