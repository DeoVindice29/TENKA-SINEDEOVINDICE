import type { Bilingual } from "./types";

// Cerita latihan membaca — satu paragraf panjang per cerita.
//
// Cerita dipecah per KATA (token). Tiap token punya:
//   t : teks Jepang dengan markup {kanji|bacaan}, mis. "{行|い}きます"
//   m : arti kata (bilingual) — tampil sebagai gloss di bawah kata / saat diketuk
//   p : true kalau partikel / penutup (では/です), biar di mode hiragana
//       polos ia menempel ke kata sebelumnya
// Token tanpa `m` adalah tanda baca (、 。 「 」).
//
// Cerita ditulis penuh kanji (ejaan Jepang umum); layar Reading menampilkan
// furigana di atas kanji (bisa dimatikan) dan suara dibacakan dari bacaan kana.

export type ReadingLevel = "N5" | "N4";

export type ReadingToken = {
  t: string;
  m?: Bilingual;
  p?: boolean;
};

export type ReadingStory = {
  id: string;
  level: ReadingLevel;
  emoji: string;
  /** judul dengan markup yang sama */
  title: string;
  titleTr: Bilingual;
  text: ReadingToken[];
  /** terjemahan lengkap paragraf */
  tr: Bilingual;
};

export const READING_LEVELS: ReadingLevel[] = ["N5", "N4"];

const b = (en: string, id: string): Bilingual => ({ en, id });
/** kata biasa */
const w = (t: string, en: string, id: string): ReadingToken => ({ t, m: b(en, id) });
/** partikel / penutup kalimat */
const p = (t: string, en: string, id: string): ReadingToken => ({
  t,
  m: b(en, id),
  p: true,
});
/** tanda baca */
const x = (t: string): ReadingToken => ({ t });

const WA = p("は", "(topic marker)", "(penanda topik)");
const GA = p("が", "(subject marker)", "(penanda subjek)");
const WO = p("を", "(object marker)", "(penanda objek)");
const NI = p("に", "(at / to / in)", "(di / ke / pada)");
const DE = p("で", "(at / by / with)", "(di / dengan / naik)");
const DE2 = p("で", "(is …, and)", "(adalah …, dan)");
const NO = p("の", "(of / 's)", "(milik / penghubung)");
const TO = p("と", "(and / with)", "(dan / bersama)");
const MO = p("も", "(also)", "(juga)");
const HE = p("へ", "(toward)", "(ke arah)");
const KARA = p("から", "(from)", "(dari)");
const YA = p("や", "(and, among others)", "(dan, antara lain)");
const DESU = p("です", "(is — polite)", "(adalah — sopan)");
const COMMA = x("、");
const STOP = x("。");

export const READING_STORIES: ReadingStory[] = [
  // ───────────────────────── N5 ─────────────────────────
  {
    id: "n5-day",
    level: "N5",
    emoji: "🌅",
    title: "{私|わたし}の {毎日|まいにち}",
    titleTr: b("My Daily Routine", "Rutinitas Harianku"),
    text: [
      w("{私|わたし}", "I", "saya"), WA, w("{毎日|まいにち}", "every day", "setiap hari"),
      w("{六時|ろくじ}", "six o'clock", "jam enam"), NI, w("{起|お}きます", "get up", "bangun"), STOP,
      w("{水|みず}", "water", "air"), WO, w("{飲|の}んで", "drink, and then", "minum, lalu"), COMMA,
      w("パン", "bread", "roti"), WO, w("{食|た}べます", "eat", "makan"), STOP,
      w("{七時|しちじ}", "seven o'clock", "jam tujuh"), NI,
      w("{電車|でんしゃ}", "train", "kereta listrik"), DE,
      w("{学校|がっこう}", "school", "sekolah"), HE, w("{行|い}きます", "go", "pergi"), STOP,
      w("{学校|がっこう}", "school", "sekolah"), DE, w("{先生|せんせい}", "teacher", "guru"), TO,
      w("{日本語|にほんご}", "Japanese language", "bahasa Jepang"), WO, w("{話|はな}します", "speak", "berbicara"), STOP,
      w("{午後|ごご}", "afternoon", "siang/sore"), WA, w("{友|とも}だち", "friend", "teman"), TO,
      w("{本|ほん}", "book", "buku"), WO, w("{読|よ}みます", "read", "membaca"), STOP,
      w("{四時|よじ}", "four o'clock", "jam empat"), NI, w("{家|うち}", "home", "rumah"), HE,
      w("{帰|かえ}ります", "go back", "pulang"), STOP,
      w("そして", "and then", "lalu"), w("{十時|じゅうじ}", "ten o'clock", "jam sepuluh"), NI,
      w("{寝|ね}ます", "go to sleep", "tidur"), STOP,
    ],
    tr: b(
      "I get up at six every day. I drink some water and eat bread. At seven I go to school by train. At school I speak Japanese with my teacher. In the afternoon I read books with my friends. At four I go back home. And at ten I go to sleep.",
      "Saya bangun jam enam setiap hari. Saya minum air dan makan roti. Jam tujuh saya pergi ke sekolah naik kereta. Di sekolah saya berbicara bahasa Jepang dengan guru. Siang hari saya membaca buku bersama teman. Jam empat saya pulang ke rumah. Lalu jam sepuluh saya tidur.",
    ),
  },
  {
    id: "n5-mountain",
    level: "N5",
    emoji: "⛰️",
    title: "{山|やま}へ {行|い}った {日|ひ}",
    titleTr: b("The Day We Went to the Mountain", "Hari Pergi ke Gunung"),
    text: [
      w("{昨日|きのう}", "yesterday", "kemarin"), WA, w("{天気|てんき}", "weather", "cuaca"), GA,
      w("{良|よ}かったので", "because it was good", "karena bagus"), COMMA,
      w("{友|とも}だち", "friend", "teman"), TO, w("{山|やま}", "mountain", "gunung"), HE,
      w("{行|い}きました", "went", "pergi (lampau)"), STOP,
      w("{山|やま}", "mountain", "gunung"), WA, w("{大|おお}きくて", "big, and", "besar, dan"), COMMA,
      w("{木|き}", "trees", "pohon"), GA, w("たくさん", "a lot", "banyak"),
      w("ありました", "there were", "ada (lampau)"), STOP,
      w("{川|かわ}", "river", "sungai"), NO, w("{水|みず}", "water", "air"), WA,
      w("とても", "very", "sangat"), w("きれいでした", "was clean", "bersih (lampau)"), STOP,
      w("{私|わたし}たち", "we", "kami"), WA, w("{川|かわ}", "river", "sungai"), NO,
      w("{側|そば}", "beside", "dekat/samping"), DE, w("お{弁当|べんとう}", "packed lunch", "bekal"), WO,
      w("{食|た}べました", "ate", "makan (lampau)"), STOP,
      w("{午後|ごご}", "afternoon", "siang/sore"), NI, w("なって", "became, and then", "menjadi, lalu"),
      w("{雨|あめ}", "rain", "hujan"), GA, w("{降|ふ}ったので", "because it rained", "karena turun hujan"), COMMA,
      w("{早|はや}く", "early / quickly", "lebih awal / cepat"), w("{帰|かえ}りました", "went home", "pulang (lampau)"), STOP,
    ],
    tr: b(
      "Yesterday the weather was good, so I went to the mountain with a friend. The mountain was big and there were lots of trees. The river water was very clean. We ate our packed lunch beside the river. In the afternoon it started to rain, so we went home early.",
      "Kemarin cuacanya bagus, jadi saya pergi ke gunung bersama teman. Gunungnya besar dan ada banyak pohon. Air sungainya sangat bersih. Kami makan bekal di dekat sungai. Sore harinya turun hujan, jadi kami pulang lebih awal.",
    ),
  },
  {
    id: "n5-family",
    level: "N5",
    emoji: "👨‍👩‍👦",
    title: "{私|わたし}の {家族|かぞく}",
    titleTr: b("My Family", "Keluargaku"),
    text: [
      w("{私|わたし}", "I", "saya"), NO, w("{家族|かぞく}", "family", "keluarga"), WA,
      w("{四人|よにん}", "four people", "empat orang"), DESU, STOP,
      w("{父|ちち}", "(my) father", "ayah (saya)"), WA, w("{先生|せんせい}", "teacher", "guru"), DE2, COMMA,
      w("{母|はは}", "(my) mother", "ibu (saya)"), WA, w("{毎日|まいにち}", "every day", "setiap hari"),
      w("{美味|おい}しい", "delicious", "enak"), w("ご{飯|はん}", "meal, rice", "makanan, nasi"), WO,
      w("{作|つく}ります", "make, cook", "membuat, memasak"), STOP,
      w("{弟|おとうと}", "younger brother", "adik laki-laki"), WA, w("{六歳|ろくさい}", "six years old", "enam tahun"), DE2, COMMA,
      w("{小|ちい}さい", "small", "kecil"), w("{男|おとこ}の{子|こ}", "boy", "anak laki-laki"), DESU, STOP,
      w("{休|やす}みの{日|ひ}", "day off", "hari libur"), WA, COMMA,
      w("{皆|みんな}で", "all together", "semuanya bersama"), w("{山|やま}", "mountain", "gunung"), YA,
      w("{川|かわ}", "river", "sungai"), HE, w("{行|い}きます", "go", "pergi"), STOP,
      w("{私|わたし}", "I", "saya"), WA, w("{家族|かぞく}", "family", "keluarga"), GA,
      w("{大好|だいす}き", "love, like a lot", "sangat suka"), DESU, STOP,
    ],
    tr: b(
      "There are four people in my family. My father is a teacher, and my mother cooks delicious meals every day. My little brother is six years old, a small boy. On days off we all go to the mountains or the river together. I love my family very much.",
      "Keluarga saya terdiri dari empat orang. Ayah saya seorang guru, dan ibu saya memasak makanan enak setiap hari. Adik laki-laki saya berumur enam tahun, seorang anak kecil. Di hari libur kami semua pergi ke gunung atau sungai bersama-sama. Saya sangat menyayangi keluarga saya.",
    ),
  },
  {
    id: "n5-shopping",
    level: "N5",
    emoji: "🛍️",
    title: "{買|か}い{物|もの}",
    titleTr: b("Shopping", "Belanja"),
    text: [
      w("{今日|きょう}", "today", "hari ini"), WA, w("{友|とも}だち", "friend", "teman"), TO,
      w("{店|みせ}", "shop", "toko"), HE, w("{買|か}い{物|もの}", "shopping", "belanja"), NI,
      w("{行|い}きました", "went", "pergi (lampau)"), STOP,
      w("{店|みせ}", "shop", "toko"), DE, w("{新|あたら}しい", "new", "baru"),
      w("{赤|あか}い", "red", "merah"), w("{靴|くつ}", "shoes", "sepatu"), WO,
      w("{見|み}ました", "saw", "melihat (lampau)"), STOP,
      w("でも", "but", "tetapi"), COMMA, w("{高|たか}かったので", "because it was expensive", "karena mahal"), COMMA,
      w("{千円|せんえん}", "1,000 yen", "1.000 yen"), NO, w("{本|ほん}", "book", "buku"), WO,
      w("{買|か}いました", "bought", "membeli (lampau)"), STOP,
      w("それから", "after that", "setelah itu"), COMMA, w("{喫茶店|きっさてん}", "café", "kafe"), DE,
      w("ジュース", "juice", "jus"), WO, w("{飲|の}みました", "drank", "minum (lampau)"), STOP,
      w("とても", "very", "sangat"), w("{楽|たの}しい", "fun", "menyenangkan"),
      w("{一日|いちにち}", "one day", "satu hari"),
      p("でした", "(was — polite)", "(adalah — sopan, lampau)"), STOP,
    ],
    tr: b(
      "Today I went shopping with a friend. At the shop I saw a pair of new red shoes. But they were expensive, so I bought a 1,000-yen book instead. After that, we drank juice at a café. It was a very fun day.",
      "Hari ini saya pergi belanja bersama teman. Di toko saya melihat sepatu merah yang baru. Tetapi harganya mahal, jadi saya membeli buku seharga 1.000 yen. Setelah itu kami minum jus di kafe. Hari yang sangat menyenangkan.",
    ),
  },

  // ───────────────────────── N4 ─────────────────────────
  {
    id: "n4-kyoto",
    level: "N4",
    emoji: "⛩️",
    title: "{京都|きょうと}{旅行|りょこう}",
    titleTr: b("A Trip to Kyoto", "Wisata ke Kyoto"),
    text: [
      w("{先週|せんしゅう}", "last week", "minggu lalu"), COMMA,
      w("{家族|かぞく}", "family", "keluarga"), TO, w("{京都|きょうと}", "Kyoto", "Kyoto"), HE,
      w("{旅行|りょこう}", "trip", "perjalanan wisata"), NI, w("{行|い}きました", "went", "pergi (lampau)"), STOP,
      w("{朝|あさ}", "morning", "pagi"), w("{早|はや}く", "early", "awal / cepat"), COMMA,
      w("{駅|えき}", "station", "stasiun"), DE, w("{新幹線|しんかんせん}", "Shinkansen (bullet train)", "Shinkansen (kereta cepat)"), NI,
      w("{乗|の}って", "ride, and then", "naik, lalu"), COMMA,
      w("{窓|まど}", "window", "jendela"), KARA, w("{大|おお}きい", "big", "besar"),
      w("{山|やま}", "mountain", "gunung"), WO, w("{見|み}ました", "saw", "melihat (lampau)"), STOP,
      w("{京都|きょうと}", "Kyoto", "Kyoto"), NI, WA, w("{古|ふる}い", "old", "tua / kuno"),
      w("お{寺|てら}", "temple", "kuil"), GA, w("たくさん", "a lot", "banyak"),
      w("あって", "there are, and", "ada, dan"), COMMA,
      w("{有名|ゆうめい}な", "famous", "terkenal"), w("お{寺|てら}", "temple", "kuil"), DE,
      w("{写真|しゃしん}", "photo", "foto"), WO, w("{撮|と}りました", "took", "mengambil"), STOP,
      w("{昼|ひる}ごはん", "lunch", "makan siang"), NI, w("{京都|きょうと}", "Kyoto", "Kyoto"), NO,
      w("{料理|りょうり}", "cuisine", "masakan"), WO, w("{食|た}べて", "eat, and then", "makan, lalu"), COMMA,
      w("{夜|よる}", "night", "malam"), WA, w("{旅館|りょかん}", "ryokan (Japanese inn)", "ryokan (penginapan Jepang)"), NI,
      w("{泊|と}まりました", "stayed overnight", "menginap"), STOP,
      w("{次|つぎ}", "next", "berikutnya"), NO, w("{日|ひ}", "day", "hari"), MO,
      w("{楽|たの}しかったです", "was fun", "menyenangkan (lampau)"), STOP,
    ],
    tr: b(
      "Last week I went on a trip to Kyoto with my family. Early in the morning we boarded the Shinkansen at the station and saw a big mountain from the window. Kyoto has many old temples, and we took pictures at a famous one. For lunch we ate Kyoto cuisine, and at night we stayed at a ryokan. The next day was fun too.",
      "Minggu lalu saya pergi berlibur ke Kyoto bersama keluarga. Pagi-pagi sekali kami naik Shinkansen di stasiun dan melihat gunung besar dari jendela. Di Kyoto ada banyak kuil tua, dan kami mengambil foto di salah satu kuil yang terkenal. Untuk makan siang kami menyantap masakan khas Kyoto, dan malamnya menginap di ryokan. Keesokan harinya pun menyenangkan.",
    ),
  },
  {
    id: "n4-hospital",
    level: "N4",
    emoji: "🏥",
    title: "{病院|びょういん}へ {行|い}った {日|ひ}",
    titleTr: b("The Day I Went to the Hospital", "Hari Pergi ke Rumah Sakit"),
    text: [
      w("{昨日|きのう}", "yesterday", "kemarin"), KARA, w("{頭|あたま}", "head", "kepala"), GA,
      w("{痛|いた}くて", "hurts, and", "sakit, dan"), COMMA, w("{熱|ねつ}", "fever", "demam"), MO,
      w("ありました", "there was", "ada (lampau)"), STOP,
      w("{今朝|けさ}", "this morning", "pagi ini"), COMMA, w("{病院|びょういん}", "hospital", "rumah sakit"), HE,
      w("{行|い}きました", "went", "pergi (lampau)"), STOP,
      w("{医者|いしゃ}", "doctor", "dokter"), WA, x("「"), w("{風邪|かぜ}", "a cold", "flu biasa"),
      w("ですから", "so (it's)", "jadi (karena)"), COMMA, w("{薬|くすり}", "medicine", "obat"), WO,
      w("{飲|の}んで", "drink, and then", "minum, lalu"), COMMA, w("{早|はや}く", "early", "lebih awal"),
      w("{寝|ね}て", "sleep, and", "tidur, lalu"), w("ください", "please", "tolong / silakan"), x("」"),
      TO, w("{言|い}いました", "said", "berkata (lampau)"), STOP,
      w("{今日|きょう}", "today", "hari ini"), WA, w("{会社|かいしゃ}", "company, office", "kantor"), WO,
      w("{休|やす}んで", "take a day off, and", "libur, lalu"), COMMA, w("{家|うち}", "home", "rumah"), DE,
      w("ゆっくり", "slowly, at ease", "dengan tenang"), w("{休|やす}みました", "rested", "beristirahat"), STOP,
      w("{夜|よる}", "night", "malam"), NI, WA, w("{少|すこ}し", "a little", "sedikit"),
      w("{元気|げんき}", "healthy", "sehat"), NI, w("なったので", "because I became", "karena menjadi"), COMMA,
      w("{明日|あした}", "tomorrow", "besok"), WA, w("{会社|かいしゃ}", "company, office", "kantor"), NI,
      w("{行|い}けると", "can go (that)", "bisa pergi (bahwa)"), w("{思|おも}います", "think", "berpikir / merasa"), STOP,
    ],
    tr: b(
      "Since yesterday I had a headache and a fever too. This morning I went to the hospital. The doctor said, \"It's a cold, so take medicine and sleep early.\" Today I took the day off work and rested well at home. By night I felt a little better, so I think I can go to work tomorrow.",
      "Sejak kemarin kepala saya sakit dan saya juga demam. Pagi ini saya pergi ke rumah sakit. Dokter berkata, \"Ini flu biasa, jadi minumlah obat dan tidurlah lebih awal.\" Hari ini saya libur kerja dan beristirahat dengan tenang di rumah. Malamnya saya agak lebih sehat, jadi saya rasa besok saya bisa berangkat kerja.",
    ),
  },
  {
    id: "n4-birthday",
    level: "N4",
    emoji: "🎂",
    title: "{友|とも}だちの {誕生日|たんじょうび}",
    titleTr: b("A Friend's Birthday", "Ulang Tahun Teman"),
    text: [
      w("{来週|らいしゅう}", "next week", "minggu depan"), NO, w("{土曜日|どようび}", "Saturday", "hari Sabtu"), WA,
      w("{友|とも}だち", "friend", "teman"), NO, w("{誕生日|たんじょうび}", "birthday", "ulang tahun"), DESU, STOP,
      w("{私|わたし}", "I", "saya"), WA, w("{駅|えき}", "station", "stasiun"), NO,
      w("{近|ちか}く", "nearby", "dekat"), NO, w("{店|みせ}", "shop", "toko"), DE, COMMA,
      w("{赤|あか}い", "red", "merah"), w("シャツ", "shirt", "kemeja"), WO,
      w("プレゼント", "present", "hadiah"), NI, w("{買|か}いました", "bought", "membeli (lampau)"), STOP,
      w("{友|とも}だち", "friend", "teman"), WA, w("{赤|あか}", "red (color)", "(warna) merah"), GA,
      w("{好|す}き", "like", "suka"), w("だと", "that (it is)", "bahwa (itu)"),
      w("{言|い}って いました", "had been saying", "pernah bilang"), STOP,
      w("パーティー", "party", "pesta"), WA, w("{夜|よる}", "night", "malam"),
      w("{七時|しちじ}", "seven o'clock", "jam tujuh"), KARA, DESU, STOP,
      w("{私|わたし}", "I", "saya"), GA, w("{料理|りょうり}", "dishes, cooking", "masakan"), WO,
      w("{作|つく}ります", "make", "membuat"), STOP,
      w("{皆|みんな}で", "all together", "semuanya bersama"), w("{歌|うた}", "songs", "lagu"), WO,
      w("{歌|うた}って", "sing, and then", "bernyanyi, lalu"), COMMA,
      w("{楽|たの}しい", "fun", "menyenangkan"), w("{夜|よる}", "night", "malam"), NI,
      w("なる", "become", "menjadi"), p("と", "(quote marker)", "(penanda kutipan)"),
      w("{思|おも}います", "think", "berpikir / merasa"), STOP,
    ],
    tr: b(
      "Next Saturday is my friend's birthday. I bought a red shirt as a present at a shop near the station. My friend had said he likes red. The party starts at seven in the evening, and I will cook the food. We will all sing songs together, and I think it will be a fun night.",
      "Sabtu depan adalah ulang tahun teman saya. Saya membeli kemeja merah sebagai hadiah di toko dekat stasiun. Teman saya pernah bilang bahwa ia suka warna merah. Pestanya mulai jam tujuh malam, dan saya yang akan memasak. Kami semua akan bernyanyi bersama, dan saya rasa malamnya akan menyenangkan.",
    ),
  },
];
