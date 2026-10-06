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
  // まえに: (obj を) V-る → まえに → obj → V (urutan terkunci; を-nya di prefix
  // supaya objek tidak bisa dipindah ke depan dan membuat posisi ★ ambigu)
  [
    "ごはんを",
    ["たべる", "まえに", "てを", "あらいます"],
    "。",
    1,
    "ごはんを たべる まえに てを あらいます。",
    {
      en: "I wash my hands before eating.",
      id: "Saya mencuci tangan sebelum makan.",
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
  // Aは Bより C: topik di prefix → B の (pewatas) → N より → adj → です.
  // Topik sengaja di prefix: "Aは" dan "Bより" bisa bertukar tempat, kalau dua-
  // duanya jadi potongan, posisi ★ ambigu.
  [
    "わたしの へやは",
    ["あなたの", "へやより", "ひろい", "です"],
    "。",
    1,
    "わたしの へやは あなたの へやより ひろいです。",
    {
      en: "My room is bigger than your room.",
      id: "Kamar saya lebih luas daripada kamar kamu.",
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

// ---------------------------------------------------------------------------
// Bentuk "baris database / form admin" untuk soal susun kalimat (★).
//
// ArrangeEntry di atas adalah tuple ringkas buat bank bawaan. Kalau soal mau
// ditambah lewat admin/content manager, pakai ArrangeQuestion (field bernama,
// cocok dengan kolom tabel `bunpo_arrange` — lihat
// supabase/migrations/2026_add_bunpo_arrange.sql). validateArrangeQuestion()
// dipakai form admin sebelum simpan; toArrangeEntry() mengubahnya ke bentuk yang
// dibaca generator soal (jlptConquest.bunpoArrange).
// ---------------------------------------------------------------------------

export type ArrangeQuestion = {
  id?: string;
  /** teks tetap sebelum 4 kotak (boleh kosong) */
  prefix: string;
  /** 4 potongan dalam URUTAN BENAR */
  parts: [string, string, string, string];
  /** teks tetap sesudah 4 kotak, mis. "。" (boleh kosong) */
  suffix: string;
  /** index 0–3 kotak yang bertanda ★ */
  star: 0 | 1 | 2 | 3;
  /** kalimat lengkap yang benar, dengan spasi antarbunsetsu */
  full: string;
  meaning_id: string;
  meaning_en: string;
  /** catatan pola/grammar buat admin (opsional, tidak tampil di soal) */
  note?: string;
};

const stripSpaces = (s: string) => s.replace(/[\s\u3000]+/g, "");

/** Daftar masalah soal (kosong = aman disimpan). Pesan dalam bahasa Indonesia. */
export function validateArrangeQuestion(q: ArrangeQuestion): string[] {
  const errors: string[] = [];
  const parts = q.parts.map((p) => p.trim());

  if (parts.length !== 4 || parts.some((p) => !p)) {
    errors.push("Semua 4 potongan harus diisi.");
  }
  if (new Set(parts).size !== parts.length) {
    errors.push("Ke-4 potongan tidak boleh ada yang sama.");
  }
  if (![0, 1, 2, 3].includes(q.star)) {
    errors.push("Posisi ★ harus 1–4.");
  }
  if (!q.full.trim()) {
    errors.push("Kalimat lengkap harus diisi.");
  } else if (
    stripSpaces(q.full) !== stripSpaces(`${q.prefix}${parts.join("")}${q.suffix}`)
  ) {
    errors.push(
      "Kalimat lengkap harus sama dengan teks awal + 4 potongan (urutan benar) + teks akhir.",
    );
  }
  if (!q.meaning_id.trim() && !q.meaning_en.trim()) {
    errors.push("Arti kalimat harus diisi (minimal satu bahasa).");
  }
  return errors;
}

/** ArrangeQuestion (dari DB/form admin) → tuple yang dipakai generator soal. */
export function toArrangeEntry(q: ArrangeQuestion): ArrangeEntry {
  return [
    q.prefix.trim(),
    q.parts.map((p) => p.trim()) as unknown as ArrangeEntry[1],
    q.suffix.trim(),
    q.star,
    q.full.trim(),
    {
      en: q.meaning_en.trim() || q.meaning_id.trim(),
      id: q.meaning_id.trim() || q.meaning_en.trim(),
    },
  ];
}
