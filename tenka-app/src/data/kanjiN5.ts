import type { KanjiEntry } from "./types";

export const KANJI_N5_CH1: readonly KanjiEntry[] = [
  // Chapter 1: Angka & Jumlah (14)
  ["一", "ichi", { en: "one (1)", id: "satu (1)" }, "いち"],
  ["二", "ni", { en: "two (2)", id: "dua (2)" }, "に"],
  ["三", "san", { en: "three (3)", id: "tiga (3)" }, "さん"],
  ["四", "yon", { en: "four (4)", id: "empat (4)" }, "よん"],
  ["五", "go", { en: "five (5)", id: "lima (5)" }, "ご"],
  ["六", "roku", { en: "six (6)", id: "enam (6)" }, "ろく"],
  ["七", "nana", { en: "seven (7)", id: "tujuh (7)" }, "なな"],
  ["八", "hachi", { en: "eight (8)", id: "delapan (8)" }, "はち"],
  ["九", "kyuu", { en: "nine (9)", id: "sembilan (9)" }, "きゅう"],
  ["十", "juu", { en: "ten (10)", id: "sepuluh (10)" }, "じゅう"],
  ["百", "hyaku", { en: "hundred (100)", id: "seratus (100)" }, "ひゃく"],
  ["千", "sen", { en: "thousand (1,000)", id: "seribu (1.000)" }, "せん"],
  [
    "万",
    "man",
    { en: "ten thousand (10,000)", id: "sepuluh ribu (10.000)" },
    "まん",
  ],
  ["円", "en", { en: "yen (currency)", id: "yen (mata uang)" }, "えん"],
];
export const KANJI_N5_CH2: readonly KanjiEntry[] = [
  // Chapter 2: Alam, Elemen & Cuaca (11)
  ["日", "hi / nichi", { en: "day / sun", id: "hari / matahari" }, "ひ"],
  [
    "月",
    "tsuki",
    { en: "moon / month", id: "bulan (langit) / bulan (kalender)" },
    "つき",
  ],
  ["木", "ki", { en: "tree / wood", id: "pohon / kayu" }, "き"],
  ["火", "hi / ka", { en: "fire", id: "api" }, "ひ"],
  ["水", "mizu", { en: "water", id: "air" }, "みず"],
  ["土", "tsuchi", { en: "earth / soil", id: "tanah" }, "つち"],
  ["金", "kin", { en: "gold / money", id: "emas / uang" }, "きん"],
  ["山", "yama", { en: "mountain", id: "gunung" }, "やま"],
  ["川", "kawa", { en: "river", id: "sungai" }, "かわ"],
  ["田", "ta", { en: "rice field", id: "sawah" }, "た"],
  ["天", "ten", { en: "heaven / sky", id: "langit / surga" }, "てん"],
];
export const KANJI_N5_CH3: readonly KanjiEntry[] = [
  // Chapter 3: Waktu & Musim (11)
  ["年", "toshi", { en: "year", id: "tahun" }, "とし"],
  ["時", "ji", { en: "time / o'clock", id: "waktu / jam" }, "じ"],
  ["分", "fun", { en: "minute / part", id: "menit / bagian" }, "ふん"],
  ["半", "han", { en: "half", id: "setengah" }, "はん"],
  ["午", "go", { en: "noon", id: "tengah hari" }, "ご"],
  ["前", "mae", { en: "before / front", id: "sebelum / depan" }, "まえ"],
  ["後", "ato", { en: "after / behind", id: "sesudah / belakang" }, "あと"],
  ["今", "ima", { en: "now", id: "sekarang" }, "いま"],
  ["朝", "asa", { en: "morning", id: "pagi" }, "あさ"],
  ["昼", "hiru", { en: "daytime / noon", id: "siang" }, "ひる"],
  ["夜", "yoru", { en: "night", id: "malam" }, "よる"],
];
export const KANJI_N5_CH4: readonly KanjiEntry[] = [
  // Chapter 4: Arah & Posisi (10)
  ["上", "ue", { en: "up / above", id: "atas" }, "うえ"],
  ["下", "shita", { en: "down / below", id: "bawah" }, "した"],
  ["左", "hidari", { en: "left", id: "kiri" }, "ひだり"],
  ["右", "migi", { en: "right", id: "kanan" }, "みぎ"],
  ["中", "naka", { en: "middle / inside", id: "tengah / dalam" }, "なか"],
  ["外", "soto", { en: "outside", id: "luar" }, "そと"],
  ["北", "kita", { en: "north", id: "utara" }, "きた"],
  ["南", "minami", { en: "south", id: "selatan" }, "みなみ"],
  ["東", "higashi", { en: "east", id: "timur" }, "ひがし"],
  ["西", "nishi", { en: "west", id: "barat" }, "にし"],
];
export const KANJI_N5_CH5: readonly KanjiEntry[] = [
  // Chapter 5: Manusia, Keluarga & Hubungan (12)
  ["人", "hito", { en: "person", id: "orang" }, "ひと"],
  ["男", "otoko", { en: "man", id: "laki-laki" }, "おとこ"],
  ["女", "onna", { en: "woman", id: "perempuan" }, "おんな"],
  ["子", "ko", { en: "child", id: "anak" }, "こ"],
  ["目", "me", { en: "eye", id: "mata" }, "め"],
  ["耳", "mimi", { en: "ear", id: "telinga" }, "みみ"],
  ["口", "kuchi", { en: "mouth", id: "mulut" }, "くち"],
  ["手", "te", { en: "hand", id: "tangan" }, "て"],
  ["足", "ashi", { en: "leg / foot", id: "kaki" }, "あし"],
  ["父", "chichi", { en: "father", id: "ayah" }, "ちち"],
  ["母", "haha", { en: "mother", id: "ibu" }, "はは"],
  ["友", "tomo", { en: "friend", id: "teman" }, "とも"],
];
export const KANJI_N5_CH6: readonly KanjiEntry[] = [
  // Chapter 6: Sifat, Ukuran & Warna (12)
  ["大", "ookii", { en: "big", id: "besar" }, "おおきい"],
  ["小", "chiisai", { en: "small", id: "kecil" }, "ちいさい"],
  [
    "高",
    "takai",
    { en: "tall / high / expensive", id: "tinggi / mahal" },
    "たかい",
  ],
  ["長", "nagai", { en: "long", id: "panjang" }, "ながい"],
  ["新", "atarashii", { en: "new", id: "baru" }, "あたらしい"],
  ["古", "furui", { en: "old (things)", id: "lama / kuno" }, "ふるい"],
  ["多", "ooi", { en: "many / much", id: "banyak" }, "おおい"],
  ["少", "sukunai", { en: "few / little", id: "sedikit" }, "すくない"],
  ["白", "shiroi", { en: "white", id: "putih" }, "しろい"],
  ["赤", "akai", { en: "red", id: "merah" }, "あかい"],
  ["青", "aoi", { en: "blue", id: "biru" }, "あおい"],
  [
    "気",
    "ki",
    { en: "spirit / feeling / air", id: "semangat / perasaan / udara" },
    "き",
  ],
];
export const KANJI_N5_CH7: readonly KanjiEntry[] = [
  // Chapter 7: Tempat, Bangunan & Transportasi (11)
  ["国", "kuni", { en: "country", id: "negara" }, "くに"],
  [
    "会",
    "kai",
    { en: "meeting / association", id: "pertemuan / perkumpulan" },
    "かい",
  ],
  ["社", "sha", { en: "company / shrine", id: "perusahaan / kuil" }, "しゃ"],
  ["校", "kou", { en: "school", id: "sekolah" }, "こう"],
  ["店", "mise", { en: "shop / store", id: "toko" }, "みせ"],
  ["駅", "eki", { en: "station", id: "stasiun" }, "えき"],
  ["電", "den", { en: "electricity", id: "listrik" }, "でん"],
  ["車", "kuruma", { en: "car / vehicle", id: "mobil / kendaraan" }, "くるま"],
  ["道", "michi", { en: "road / way", id: "jalan" }, "みち"],
  ["門", "mon", { en: "gate", id: "gerbang" }, "もん"],
  ["空", "sora", { en: "sky / empty", id: "langit / kosong" }, "そら"],
];
export const KANJI_N5_CH8: readonly KanjiEntry[] = [
  // Chapter 8: Kata Kerja Dasar & Aktivitas (10)
  ["行", "iku", { en: "go", id: "pergi" }, "いく"],
  ["来", "kuru", { en: "come", id: "datang" }, "くる"],
  ["出", "deru", { en: "go out / exit", id: "keluar" }, "でる"],
  ["入", "hairu", { en: "enter", id: "masuk" }, "はいる"],
  ["見", "ken", { en: "see", id: "lihat" }, "けん"],
  ["聞", "kiku", { en: "hear / listen", id: "mendengar" }, "きく"],
  ["食", "shoku", { en: "eat", id: "makan" }, "しょく"],
  ["飲", "in", { en: "drink", id: "minum" }, "いん"],
  ["書", "kaku", { en: "write", id: "menulis" }, "かく"],
  ["読", "yomu", { en: "read", id: "membaca" }, "よむ"],
];
export const KANJI_N5_CH9: readonly KanjiEntry[] = [
  // Chapter 9: Konsep Kehidupan & Kata Kerja Tambahan (9)
  ["買", "kau", { en: "buy", id: "membeli" }, "かう"],
  ["休", "yasumu", { en: "rest / holiday", id: "istirahat / libur" }, "やすむ"],
  ["立", "tatsu", { en: "stand", id: "berdiri" }, "たつ"],
  ["生", "sei", { en: "life / born", id: "hidup / lahir" }, "せい"],
  ["学", "gaku", { en: "study / learning", id: "belajar / ilmu" }, "がく"],
  ["花", "hana", { en: "flower", id: "bunga" }, "はな"],
  ["魚", "sakana", { en: "fish", id: "ikan" }, "さかな"],
  ["名", "na", { en: "name", id: "nama" }, "な"],
  ["何", "nani", { en: "what", id: "apa" }, "なに"],
];
export const KANJI_N5_CHAPTERS: readonly (readonly KanjiEntry[])[] = [
  KANJI_N5_CH1,
  KANJI_N5_CH2,
  KANJI_N5_CH3,
  KANJI_N5_CH4,
  KANJI_N5_CH5,
  KANJI_N5_CH6,
  KANJI_N5_CH7,
  KANJI_N5_CH8,
  KANJI_N5_CH9,
];
// reading lookup used only in Learn mode + as a quiz hint
export const KANJI_READING: Record<string, string> = {};
KANJI_N5_CHAPTERS.forEach((ch) =>
  ch.forEach(([c, r]) => {
    KANJI_READING[c] = r;
  }),
);

export const KANJI_TIER_KEYS = ["tier1", "tier2", "tier3", "tier4", "tier5", "tier6", "tier7", "tier8", "tier9"] as const;

export const KANJI_LEVEL_META = [
  ...KANJI_TIER_KEYS.map((id, i) => ({ id, tier: i + 1, rank: "N5" })),
  { id: "all", tier: KANJI_TIER_KEYS.length, rank: "N5" },
];