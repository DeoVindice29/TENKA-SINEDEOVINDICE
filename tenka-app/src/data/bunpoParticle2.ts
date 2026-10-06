// Bank soal "Tebak Partikel" dengan DUA bagian kosong — ala soal JLPT:
//   かばん (＿＿) ほん (＿＿) だします。   →   から / を
//
// Tiap soal punya dua kotak kosong ("..."), dan pilihan jawabannya adalah
// PASANGAN partikel ("から/を"). Soal ditulis tangan supaya cuma ada satu
// pasangan yang benar.
//
// Pedoman kalau mau menambah soal:
//   • Pasangan salah harus benar-benar salah secara tata bahasa (bukan sekadar
//     terdengar aneh), dan JANGAN memasukkan pasangan lain yang sebenarnya juga
//     bisa dipakai (mis. に/へ untuk arah, に/から untuk "dari/kepada").
//   • Tulis hiragana + spasi antarbunsetsu, dua kotak kosong = dua "...".
//   • Format pasangan: "partikel1/partikel2" (tanpa spasi).
//
// Format tiap soal:
//   [kalimat, pasangan benar, salah 1, salah 2, salah 3, arti kalimat]

import type { Bilingual } from "./types";

export type ParticlePairEntry = readonly [
  sentence: string,
  correct: string,
  wrongA: string,
  wrongB: string,
  wrongC: string,
  meaning: Bilingual,
];

export const BUNPO_PARTICLE_PAIRS: readonly ParticlePairEntry[] = [
  [
    "かばん ... ほん ... だします。",
    "から/を",
    "に/を",
    "で/を",
    "の/を",
    {
      en: "I take a book out of the bag.",
      id: "Saya mengeluarkan buku dari dalam tas.",
    },
  ],
  [
    "ともだち ... プレゼント ... あげます。",
    "に/を",
    "を/に",
    "で/を",
    "から/が",
    {
      en: "I give a present to a friend.",
      id: "Saya memberi hadiah kepada teman.",
    },
  ],
  [
    "わたしは じてんしゃ ... えき ... いきます。",
    "で/へ",
    "を/へ",
    "から/を",
    "に/で",
    {
      en: "I go to the station by bicycle.",
      id: "Saya pergi ke stasiun naik sepeda.",
    },
  ],
  [
    "としょかん ... ほん ... かります。",
    "で/を",
    "を/で",
    "が/を",
    "の/に",
    {
      en: "I borrow a book at the library.",
      id: "Saya meminjam buku di perpustakaan.",
    },
  ],
  [
    "ちちは まいあさ ろくじ ... いえ ... でます。",
    "に/を",
    "を/に",
    "へ/を",
    "から/で",
    {
      en: "My father leaves the house at six every morning.",
      id: "Ayah saya keluar rumah jam enam setiap pagi.",
    },
  ],
  [
    "ともだち ... えいが ... みに いきます。",
    "と/を",
    "を/と",
    "で/に",
    "から/が",
    {
      en: "I go to see a movie with a friend.",
      id: "Saya pergi menonton film bersama teman.",
    },
  ],
  [
    "かぎ ... ドア ... あけます。",
    "で/を",
    "を/で",
    "に/が",
    "へ/を",
    {
      en: "I open the door with a key.",
      id: "Saya membuka pintu dengan kunci.",
    },
  ],
  [
    "まいにち あさ ... よる ... はたらきます。",
    "から/まで",
    "まで/から",
    "に/で",
    "を/の",
    {
      en: "I work from morning until night every day.",
      id: "Saya bekerja dari pagi sampai malam setiap hari.",
    },
  ],
  [
    "せんせい ... しつもん ... します。",
    "に/を",
    "を/に",
    "で/が",
    "から/の",
    {
      en: "I ask the teacher a question.",
      id: "Saya bertanya kepada guru.",
    },
  ],
  [
    "ここ ... しゃしん ... とっても いいですか。",
    "で/を",
    "を/で",
    "が/に",
    "の/が",
    {
      en: "May I take a photo here?",
      id: "Bolehkah saya memotret di sini?",
    },
  ],
  [
    "かばんの なか ... ほん ... あります。",
    "に/が",
    "で/を",
    "を/が",
    "が/に",
    {
      en: "There is a book in the bag.",
      id: "Ada buku di dalam tas.",
    },
  ],
  [
    "えき ... うち ... あるいて じゅっぷんです。",
    "から/まで",
    "まで/から",
    "に/で",
    "を/に",
    {
      en: "It is a ten-minute walk from the station to my house.",
      id: "Dari stasiun ke rumah saya jalan kaki sepuluh menit.",
    },
  ],
];
