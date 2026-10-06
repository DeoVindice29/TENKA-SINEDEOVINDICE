// Bank soal Latihan Kotoba "Similar Meaning" (Kata → Arti Mirip).
//
// Sebuah kata ditanyakan, pilih kata lain yang artinya MIRIP. Soal ini hanya ada
// di Latihan (bukan tier Penaklukan) dan ditulis tangan, karena pilihan
// salahnya harus benar-benar bukan sinonim kata itu.
//
// Pedoman kalau mau menambah soal:
//   • `correct` = kata yang artinya paling dekat dengan `word` (hiragana).
//   • Ketiga pilihan salah TIDAK boleh bisa dianggap sinonim `word` — boleh
//     lawan kata atau kata sekategori (mis. かんたん → むずかしい / たかい).
//   • Pakai kosakata level N5 supaya yang diuji maknanya, bukan kata sulit.

import type { Bilingual } from "./types";

// [word, correct, wrongA, wrongB, wrongC, meaning]
export type KotobaSimilarEntry = readonly [
  string,
  string,
  string,
  string,
  string,
  Bilingual,
];

export const KOTOBA_SIMILAR: KotobaSimilarEntry[] = [
  ["たくさん", "おおい", "すこし", "ちいさい", "ない", { en: "a lot, many", id: "banyak" }],
  ["すこし", "ちょっと", "たくさん", "ぜんぶ", "ずっと", { en: "a little", id: "sedikit" }],
  ["とても", "すごく", "すこし", "ぜんぜん", "ときどき", { en: "very", id: "sangat" }],
  ["かんたん", "やさしい", "むずかしい", "たかい", "ふるい", { en: "easy", id: "mudah" }],
  ["おいしい", "うまい", "まずい", "からい", "あまい", { en: "delicious", id: "enak" }],
  ["じょうず", "うまい", "へた", "すき", "きらい", { en: "skillful", id: "pandai / mahir" }],
  ["たのしい", "おもしろい", "かなしい", "さびしい", "いそがしい", { en: "fun", id: "menyenangkan" }],
  ["こわい", "おそろしい", "うれしい", "すずしい", "やさしい", { en: "scary", id: "menakutkan" }],
  ["きれい", "うつくしい", "きたない", "ふるい", "おおきい", { en: "pretty, beautiful", id: "cantik / indah" }],
  ["あぶない", "きけん", "あんぜん", "しずか", "げんき", { en: "dangerous", id: "berbahaya" }],
  ["たいせつ", "だいじ", "ひま", "いや", "べんり", { en: "important", id: "penting / berharga" }],
  ["ときどき", "たまに", "いつも", "まいにち", "すぐ", { en: "sometimes", id: "kadang-kadang" }],
  ["もうすぐ", "まもなく", "さっき", "ずっと", "ときどき", { en: "soon", id: "sebentar lagi" }],
  ["たぶん", "おそらく", "ぜんぜん", "もちろん", "ほんとうに", { en: "probably", id: "mungkin" }],
  ["ぜんぶ", "すべて", "すこし", "ちょっと", "はんぶん", { en: "all", id: "semua" }],
  ["みんな", "ぜんいん", "ひとり", "だれか", "ふたり", { en: "everyone", id: "semuanya" }],
  ["おなじ", "いっしょ", "べつ", "ちがう", "ほか", { en: "same", id: "sama" }],
  ["ほか", "べつ", "おなじ", "ぜんぶ", "まえ", { en: "other", id: "lain" }],
  ["さいしょ", "はじめ", "さいご", "つぎ", "あと", { en: "first, beginning", id: "awal / pertama" }],
  ["さいご", "おわり", "はじめ", "つぎ", "まえ", { en: "last, end", id: "akhir / terakhir" }],
  ["だれ", "どなた", "なに", "どこ", "いつ", { en: "who", id: "siapa" }],
  ["ここ", "こちら", "そこ", "あそこ", "どこ", { en: "here", id: "di sini" }],
  ["いえ", "うち", "みせ", "がっこう", "えき", { en: "house, home", id: "rumah" }],
  ["くるま", "じどうしゃ", "じてんしゃ", "でんしゃ", "ひこうき", { en: "car", id: "mobil" }],
  ["ほんや", "しょてん", "ぎんこう", "びょういん", "えいがかん", { en: "bookstore", id: "toko buku" }],
  ["ごはん", "しょくじ", "のみもの", "おかし", "くだもの", { en: "meal", id: "makan / hidangan" }],
  ["ともだち", "ゆうじん", "かぞく", "せんせい", "おとうと", { en: "friend", id: "teman" }],
  ["あした", "みょうにち", "きのう", "きょう", "あさって", { en: "tomorrow", id: "besok" }],
  ["かえる", "もどる", "いく", "くる", "でる", { en: "to return", id: "kembali / pulang" }],
  ["はたらく", "つとめる", "やすむ", "あそぶ", "ねる", { en: "to work", id: "bekerja" }],
  ["はなす", "しゃべる", "きく", "よむ", "かく", { en: "to speak", id: "berbicara" }],
  ["かんがえる", "おもう", "わすれる", "わらう", "さがす", { en: "to think", id: "berpikir" }],
  ["ならう", "まなぶ", "おしえる", "あそぶ", "わすれる", { en: "to learn", id: "belajar" }],
  ["あげる", "やる", "もらう", "かりる", "とる", { en: "to give", id: "memberi" }],
  ["もらう", "うけとる", "あげる", "おくる", "かえす", { en: "to receive", id: "menerima" }],
];
