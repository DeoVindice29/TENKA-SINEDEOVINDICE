// Bank soal Tier 4 Penaklukan Bunpō — "「〜」を つかう ぶんは どれですか".
//
// Sebuah pola tata bahasa ditanyakan, lalu ada 4 kalimat yang SAMA-SAMA memakai
// pola itu, tapi cuma satu yang pemakaiannya benar. Sama seperti kotobaUsage.ts,
// soal ini ditulis tangan: kalimat salahnya harus benar-benar SALAH secara tata
// bahasa (bukan sekadar terdengar aneh), supaya tidak ada jawaban ganda.
//
// Pedoman kalau mau menambah soal:
//   • Ke-4 kalimat memuat pola yang ditanyakan (persis seperti tertulis di `pattern`).
//   • Kalimat salah harus salah karena SATU alasan yang jelas — mis. salah bentuk
//     sambungan (きく + ながら ✗), atau salah kata benda untuk います/あります.
//   • Hindari kalimat salah yang bisa dibenarkan dengan arti lain dari pola itu.
//   • Tulis hiragana + spasi antarbunsetsu (seperti kalimat di bunpoConjugation).
//
// Format tiap soal:
//   [pola, kalimat benar, salah 1, salah 2, salah 3, arti kalimat benar]

import type { Bilingual } from "./types";

export type BunpoUsageEntry = readonly [
  pattern: string,
  correct: string,
  wrongA: string,
  wrongB: string,
  wrongC: string,
  meaning: Bilingual,
];

export const BUNPO_USAGE: readonly BunpoUsageEntry[] = [
  // ---- います: yang ada di depannya harus makhluk hidup --------------------
  [
    "〜が います",
    "こうえんに ねこが います。",
    "つくえの うえに ほんが います。",
    "かばんの なかに さいふが います。",
    "へやに テレビが います。",
    { en: "There is a cat in the park.", id: "Ada kucing di taman." },
  ],
  // ---- ながら: kata kerja harus dalam bentuk ます-stem ---------------------
  [
    "〜ながら",
    "おんがくを ききながら べんきょうします。",
    "おんがくを きくながら べんきょうします。",
    "おんがくを きいてながら べんきょうします。",
    "おんがくを きいたながら べんきょうします。",
    {
      en: "I study while listening to music.",
      id: "Saya belajar sambil mendengarkan musik.",
    },
  ],
  // ---- ないで ください: bentuk ない dari kata kerja う (すう → すわない) --------
  [
    "〜ないで ください",
    "ここで たばこを すわないで ください。",
    "ここで たばこを すいないで ください。",
    "ここで たばこを すうないで ください。",
    "ここで たばこを すわなくないで ください。",
    {
      en: "Please don't smoke here.",
      id: "Tolong jangan merokok di sini.",
    },
  ],
  // ---- が あります: yang ada di depannya harus benda mati -------------------
  [
    "〜が あります",
    "つくえの うえに ほんが あります。",
    "にわに いぬが あります。",
    "きょうしつに せんせいが あります。",
    "いえに かぞくが あります。",
    { en: "There is a book on the desk.", id: "Ada buku di atas meja." },
  ],
  // ---- てください: kata kerja harus dalam bentuk て --------------------------
  [
    "〜て ください",
    "まどを あけて ください。",
    "まどを あける ください。",
    "まどを あけます ください。",
    "まどを あけない ください。",
    {
      en: "Please open the window.",
      id: "Tolong buka jendelanya.",
    },
  ],
  // ---- てもいいです: kata kerja harus dalam bentuk て -------------------------
  [
    "〜ても いいです",
    "ここで しゃしんを とっても いいです。",
    "ここで しゃしんを とるても いいです。",
    "ここで しゃしんを とりても いいです。",
    "ここで しゃしんを とらないても いいです。",
    {
      en: "You may take photos here.",
      id: "Boleh mengambil foto di sini.",
    },
  ],
  // ---- てはいけません: kata kerja harus dalam bentuk て ------------------------
  [
    "〜ては いけません",
    "としょかんで さわいでは いけません。",
    "としょかんで さわぐでは いけません。",
    "としょかんで さわぎでは いけません。",
    "としょかんで さわがないでは いけません。",
    {
      en: "You must not make noise in the library.",
      id: "Tidak boleh berisik di perpustakaan.",
    },
  ],
  // ---- てから: kata kerja harus dalam bentuk て -------------------------------
  [
    "〜てから〜",
    "しゅくだいを してから あそびます。",
    "しゅくだいを するてから あそびます。",
    "しゅくだいを しますてから あそびます。",
    "しゅくだいを したてから あそびます。",
    {
      en: "I'll play after finishing my homework.",
      id: "Saya akan bermain setelah mengerjakan PR.",
    },
  ],
  // ---- ないほうがいいです: kata kerja harus dalam bentuk ない ------------------
  [
    "〜ない ほうが いいです",
    "よるは コーヒーを のまない ほうが いいです。",
    "よるは コーヒーを のむ ほうが いいです。",
    "よるは コーヒーを のみ ほうが いいです。",
    "よるは コーヒーを のんで ほうが いいです。",
    {
      en: "You'd better not drink coffee at night.",
      id: "Sebaiknya jangan minum kopi di malam hari.",
    },
  ],
  // ---- なければなりません: kata kerja harus dalam bentuk ない (kurangi い) -------
  [
    "〜なければ なりません",
    "まいにち くすりを のまなければ なりません。",
    "まいにち くすりを のむなければ なりません。",
    "まいにち くすりを のみなければ なりません。",
    "まいにち くすりを のんでなければ なりません。",
    {
      en: "I have to take medicine every day.",
      id: "Saya harus minum obat setiap hari.",
    },
  ],
  // ---- なくてもいいです: kata kerja harus dalam bentuk ない (kurangi い) --------
  [
    "〜なくても いいです",
    "にちようびは がっこうに いかなくても いいです。",
    "にちようびは がっこうに いくなくても いいです。",
    "にちようびは がっこうに いきなくても いいです。",
    "にちようびは がっこうに いってなくても いいです。",
    {
      en: "You don't have to go to school on Sunday.",
      id: "Hari Minggu tidak perlu pergi ke sekolah.",
    },
  ],
  // ---- ことができます: kata kerja harus bentuk kamus --------------------------
  [
    "〜る こと が できます",
    "わたしは かんじを よむ ことが できます。",
    "わたしは かんじを よみ ことが できます。",
    "わたしは かんじを よんで ことが できます。",
    "わたしは かんじを よんだ ことが できます。",
    {
      en: "I can read kanji.",
      id: "Saya bisa membaca kanji.",
    },
  ],
  // ---- まえに: kata kerja harus bentuk kamus ----------------------------------
  [
    "〜る まえに〜",
    "ねる まえに はを みがきます。",
    "ねます まえに はを みがきます。",
    "ねて まえに はを みがきます。",
    "ねた まえに はを みがきます。",
    {
      en: "I brush my teeth before sleeping.",
      id: "Saya menggosok gigi sebelum tidur.",
    },
  ],
  // ---- つもりです: kata kerja harus bentuk kamus -------------------------------
  [
    "〜る つもりです",
    "らいねん にほんへ いく つもりです。",
    "らいねん にほんへ いきます つもりです。",
    "らいねん にほんへ いって つもりです。",
    "らいねん にほんへ いった つもりです。",
    {
      en: "I intend to go to Japan next year.",
      id: "Saya berniat pergi ke Jepang tahun depan.",
    },
  ],
  // ---- たり、たりします: kata kerja harus bentuk た + り ------------------------
  [
    "〜たり、〜たり します",
    "しゅうまつは ほんを よんだり、おんがくを きいたり します。",
    "しゅうまつは ほんを よむたり、おんがくを きいたり します。",
    "しゅうまつは ほんを よみたり、おんがくを きいたり します。",
    "しゅうまつは ほんを よんでたり、おんがくを きいたり します。",
    {
      en: "On weekends I do things like reading books and listening to music.",
      id: "Akhir pekan saya membaca buku, mendengarkan musik, dan sebagainya.",
    },
  ],
];
