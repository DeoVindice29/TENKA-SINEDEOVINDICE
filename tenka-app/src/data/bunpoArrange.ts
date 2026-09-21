// Bank soal Tier 5 Penaklukan Bunpō — susun kalimat ala JLPT もんだい 2
// ("★に はいる ものは どれですか").
//
// Sebuah kalimat punya 4 kotak kosong, salah satunya bertanda ★. Ada 4 potongan
// yang harus disusun ke 4 kotak itu dengan urutan yang benar; jawabannya adalah
// potongan yang jatuh di posisi ★. Ke-4 potongan itu sendiri yang jadi pilihan
// jawaban (diacak).
//
// Pedoman kalau mau menambah soal:
//   • Urutan yang benar HARUS satu-satunya yang wajar. Hindari dua frasa
//     berpartikel yang bisa ditukar (mis. "ここで" dan "しゃしんを" — dua-duanya
//     boleh di depan), karena kalau begitu posisi ★ jadi ambigu. Yang aman:
//     rangkaian yang urutannya terkunci tata bahasa (て + みたい, ゆっくり + kata
//     kerja, ほうが + いいです, dst.).
//   • Ke-4 potongan tidak boleh ada yang kembar (soalnya dilewati kalau kembar).
//   • `parts` ditulis dalam URUTAN BENAR; aplikasi yang mengacaknya.
//   • `prefix` / `suffix` = teks tetap di sekitar 4 kotak (boleh kosong "").
//   • `full` = kalimat lengkap yang benar, dengan spasi antarbunsetsu (dipakai
//     buat feedback). Tanpa spasi harus sama persis dengan prefix + parts + suffix.
//   • `star` = index (0–3) kotak yang bertanda ★.
//
// Format tiap soal:
//   [prefix, [4 potongan urut benar], suffix, star, full, arti kalimat]

import type { Bilingual } from "./types";

export type ArrangeEntry = readonly [
  prefix: string,
  parts: readonly [string, string, string, string],
  suffix: string,
  star: 0 | 1 | 2 | 3,
  full: string,
  meaning: Bilingual,
];

export const BUNPO_ARRANGE: readonly ArrangeEntry[] = [
  // V-て みたい: いちど → たべて → みたい → です (urutan terkunci)
  [
    "わたしは その りょうりを",
    ["いちど", "たべて", "みたい", "です"],
    "。",
    2,
    "わたしは その りょうりを いちど たべて みたいです。",
    {
      en: "I want to try eating that dish once.",
      id: "Saya ingin mencoba makan masakan itu sekali.",
    },
  ],
  // V-て ください: もうすこし → ゆっくり → V-て → ください
  [
    "すみません、",
    ["もうすこし", "ゆっくり", "はなして", "ください"],
    "。",
    1,
    "すみません、もうすこし ゆっくり はなして ください。",
    {
      en: "Excuse me, please speak a little more slowly.",
      id: "Permisi, tolong bicara sedikit lebih pelan.",
    },
  ],
  // V-た ほうが いいです: はやく → ねた → ほうが → いいです
  [
    "つかれた ときは、",
    ["はやく", "ねた", "ほうが", "いいです"],
    "。",
    2,
    "つかれた ときは、はやく ねた ほうが いいです。",
    {
      en: "When you're tired, you should go to bed early.",
      id: "Kalau lelah, sebaiknya tidur lebih awal.",
    },
  ],
  // てから: obj → V-て + から → obj → V (urutan terkunci, sub-klausa dulu)
  [
    "わたしは",
    ["しゅくだいを", "してから", "テレビを", "みます"],
    "。",
    1,
    "わたしは しゅくだいを してから テレビを みます。",
    {
      en: "I watch TV after finishing my homework.",
      id: "Saya menonton TV setelah mengerjakan PR.",
    },
  ],
  // なければなりません: adv → adv → V-なければ → なりません (urutan terkunci)
  [
    "あしたは しけんが あるので、",
    ["こんばん", "はやく", "ねなければ", "なりません"],
    "。",
    2,
    "あしたは しけんが あるので、こんばん はやく ねなければ なりません。",
    {
      en: "Since I have an exam tomorrow, I have to sleep early tonight.",
      id: "Karena besok ada ujian, saya harus tidur cepat malam ini.",
    },
  ],
  // まえに: V-る → まえに → obj → V (urutan terkunci)
  [
    "",
    ["でかける", "まえに", "てんきよほうを", "みます"],
    "。",
    1,
    "でかける まえに てんきよほうを みます。",
    {
      en: "I check the weather forecast before going out.",
      id: "Saya melihat ramalan cuaca sebelum pergi keluar.",
    },
  ],
  // たら: subj → V-たら → loc → V (klausa kondisi harus di depan)
  [
    "",
    ["あめが", "ふったら", "うちに", "います"],
    "。",
    1,
    "あめが ふったら うちに います。",
    {
      en: "If it rains, I'll stay home.",
      id: "Kalau hujan, saya akan tinggal di rumah.",
    },
  ],
  // ことができます: obj → V-る → ことが → できます (urutan terkunci)
  [
    "わたしは",
    ["ひらがなを", "よむ", "ことが", "できます"],
    "。",
    2,
    "わたしは ひらがなを よむ ことが できます。",
    {
      en: "I can read hiragana.",
      id: "Saya bisa membaca hiragana.",
    },
  ],
  // とおもいます: topic → subj → V-ると → おもいます (urutan terkunci)
  [
    "",
    ["あしたは", "あめが", "ふると", "おもいます"],
    "。",
    2,
    "あしたは あめが ふると おもいます。",
    {
      en: "I think it will rain tomorrow.",
      id: "Saya pikir besok akan hujan.",
    },
  ],
  // Aは Bより C: A(topik) → Bより → adj → です (urutan terkunci)
  [
    "",
    ["でんしゃは", "バスより", "はやい", "です"],
    "。",
    1,
    "でんしゃは バスより はやいです。",
    {
      en: "Trains are faster than buses.",
      id: "Kereta lebih cepat daripada bus.",
    },
  ],
  // ないほうがいいです: obj → V-ない → ほうが → いいです (urutan terkunci)
  [
    "からだの ために、",
    ["たばこを", "すわない", "ほうが", "いいです"],
    "。",
    1,
    "からだの ために、たばこを すわない ほうが いいです。",
    {
      en: "For your health, you'd better not smoke.",
      id: "Demi kesehatan, sebaiknya jangan merokok.",
    },
  ],
  // つもりです: loc → V-る → つもり → です (urutan terkunci)
  [
    "だいがくを そつぎょうしたら、",
    ["にほんで", "はたらく", "つもり", "です"],
    "。",
    1,
    "だいがくを そつぎょうしたら、にほんで はたらく つもりです。",
    {
      en: "After graduating from university, I intend to work in Japan.",
      id: "Setelah lulus kuliah, saya berniat bekerja di Jepang.",
    },
  ],
];
