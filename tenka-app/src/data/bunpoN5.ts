import type { Bilingual, BunpoEntry, BunpoLearnSection } from "./types";

export const BUNPO_N5_TIER1: BunpoEntry[] = [
  [
    "_は_です",
    "私は学生です。",
    { en: "states that A is B", id: "menyatakan A adalah B" },
    [
      ["私", "Watashi"],
      ["は", "wa"],
      ["学生", "gakusei"],
      ["です。", "desu."],
    ],
    "わたしは がくせい ....",
    { en: "I am a student.", id: "Saya adalah murid/siswa." },
  ],
  [
    "_は_ではありません",
    "私は先生ではありません。",
    { en: "states that A is not B", id: "menyatakan A bukan B" },
    [
      ["私", "Watashi"],
      ["は", "wa"],
      ["先生", "sensei"],
      ["ではありません。", "dewa arimasen."],
    ],
    "わたしは せんせい ....",
    { en: "I am not a teacher.", id: "Saya bukan guru." },
  ],
  [
    "_は_でした",
    "昨日は休みでした。",
    { en: "A was B (past)", id: "A adalah B (lampau)" },
    [
      ["昨日", "Kinou"],
      ["は", "wa"],
      ["休み", "yasumi"],
      ["でした。", "deshita."],
    ],
    "きのうは やすみ ....",
    { en: "Yesterday was a day off.", id: "Kemarin adalah hari libur." },
  ],
  [
    "_は_ではありませんでした",
    "昨日は雨ではありませんでした。",
    { en: "A was not B (past)", id: "A bukan B (lampau)" },
    [
      ["昨日", "Kinou"],
      ["は", "wa"],
      ["雨", "ame"],
      ["ではありませんでした。", "dewa arimasen deshita."],
    ],
    "きのうは あめ ....",
    { en: "Yesterday was not rainy.", id: "Kemarin tidak hujan." },
  ],
  [
    "_も_",
    "私も学生です。",
    { en: "also / too", id: "juga" },
    [
      ["私", "Watashi"],
      ["も", "mo"],
      ["学生です。", "gakusei desu."],
    ],
    "わたし ... がくせいです。",
    { en: "I am also a student.", id: "Saya juga murid/siswa." },
  ],
  [
    "_の_",
    "これは私の本です。",
    {
      en: "indicates possession/description of a thing",
      id: "kepemilikan/keterangan benda",
    },
    [
      ["これ", "Kore"],
      ["は", "wa"],
      ["私の", "watashi no"],
      ["本です。", "hon desu."],
    ],
    "これは わたし ... ほんです。",
    { en: "This is my book.", id: "Ini buku saya." },
  ],
  [
    "_と_",
    "犬と猫がいます。",
    {
      en: "and (listing items exhaustively)",
      id: "dan (menyebut semua secara lengkap)",
    },
    [
      ["犬と", "Inu to"],
      ["猫が", "neko ga"],
      ["います。", "imasu."],
    ],
    "いぬ ... ねこが います。",
    { en: "There is a dog and a cat.", id: "Ada anjing dan kucing." },
  ],
];

// Sub-Tier 1.2: Partikel Utama (8)
export const BUNPO_N5_TIER2: BunpoEntry[] = [
  [
    "_は_",
    "私は日本人です。",
    { en: "topic particle", id: "partikel topik" },
    [
      ["私", "Watashi"],
      ["は", "wa"],
      ["日本人です。", "nihonjin desu."],
    ],
    "わたし ... にほんじんです。",
    { en: "I am Japanese.", id: "Saya orang Jepang." },
  ],
  [
    "_が_",
    "雨が降っています。",
    { en: "marks the sentence subject", id: "menandai subjek kalimat" },
    [
      ["雨", "Ame"],
      ["が", "ga"],
      ["降っています。", "futte imasu."],
    ],
    "あめ ... ふっています。",
    { en: "It is raining.", id: "Sedang turun hujan." },
  ],
  [
    "_を_",
    "水を飲みます。",
    { en: "marks the direct object", id: "menandai objek langsung" },
    [
      ["水", "Mizu"],
      ["を", "wo"],
      ["飲みます。", "nomimasu."],
    ],
    "みず ... のみます。",
    { en: "I drink water.", id: "Saya minum air." },
  ],
  [
    "_に_",
    "7時に起きます。",
    {
      en: "indicates time or destination",
      id: "menunjukkan waktu atau tujuan",
    },
    [
      ["7時", "Shichi-ji"],
      ["に", "ni"],
      ["起きます。", "okimasu."],
    ],
    "しちじ ... おきます。",
    { en: "I wake up at 7 o'clock.", id: "Saya bangun jam 7." },
  ],
  [
    "_で_",
    "電車で行きます。",
    {
      en: "indicates the place/means of doing something",
      id: "menunjukkan tempat/cara melakukan sesuatu",
    },
    [
      ["電車", "Densha"],
      ["で", "de"],
      ["行きます。", "ikimasu."],
    ],
    "でんしゃ ... いきます。",
    { en: "I go by train.", id: "Saya pergi naik kereta." },
  ],
  [
    "_と_",
    "友達と話します。",
    { en: "together with", id: "bersama dengan" },
    [
      ["友達", "Tomodachi"],
      ["と", "to"],
      ["話します。", "hanashimasu."],
    ],
    "ともだち ... はなします。",
    { en: "I talk with my friend.", id: "Saya berbicara dengan teman." },
  ],
  [
    "_から_",
    "9時から働きます。",
    { en: "from (starting point)", id: "dari (titik awal)" },
    [
      ["9時から", "Ku-ji kara"],
      ["働きます。", "hatarakimasu."],
    ],
    "くじ ... はたらきます。",
    {
      en: "I work starting from 9 o'clock.",
      id: "Saya bekerja mulai dari jam 9.",
    },
  ],
  [
    "_まで_",
    "5時まで働きます。",
    { en: "until (end point)", id: "sampai (titik akhir)" },
    [
      ["5時まで", "Go-ji made"],
      ["働きます。", "hatarakimasu."],
    ],
    "ごじ ... はたらきます。",
    { en: "I work until 5 o'clock.", id: "Saya bekerja sampai jam 5." },
  ],
];

// Sub-Tier 2.1: Keberadaan (Ada/Tinggal) (7)
export const BUNPO_N5_TIER3: BunpoEntry[] = [
  [
    "_があります",
    "机の上に本があります。",
    { en: "there is (inanimate)", id: "ada (benda mati)" },
    [
      ["机の上に", "Tsukue no ue ni"],
      ["本が", "hon ga"],
      ["あります。", "arimasu."],
    ],
    "つくえの うえに ほんが ....",
    { en: "There is a book on the desk.", id: "Ada buku di atas meja." },
  ],
  [
    "_がいます",
    "公園に猫がいます。",
    { en: "there is (animate)", id: "ada (makhluk hidup)" },
    [
      ["公園に", "Kouen ni"],
      ["猫が", "neko ga"],
      ["います。", "imasu."],
    ],
    "こうえんに ねこが ....",
    { en: "There is a cat in the park.", id: "Ada kucing di taman." },
  ],
  [
    "_に_があります/います",
    "教室に学生がいます。",
    { en: "there is X at a place", id: "di suatu tempat ada X" },
    [
      ["教室に", "Kyoushitsu ni"],
      ["学生が", "gakusei ga"],
      ["います。", "imasu."],
    ],
    "きょうしつに がくせいが ....",
    { en: "There are students in the classroom.", id: "Di kelas ada murid." },
  ],
  [
    "_は_にあります/います",
    "猫は教室にいます。",
    { en: "X is located at that place", id: "X berada di tempat tsb" },
    [
      ["猫は", "Neko wa"],
      ["教室に", "kyoushitsu ni"],
      ["います。", "imasu."],
    ],
    "ねこは きょうしつに ....",
    { en: "The cat is in the classroom.", id: "Kucingnya ada di kelas." },
  ],
  [
    "_に住んでいます",
    "東京に住んでいます。",
    { en: "living in", id: "tinggal di" },
    [
      ["東京に", "Toukyou ni"],
      ["住んでいます。", "sunde imasu."],
    ],
    "とうきょう ....",
    { en: "I live in Tokyo.", id: "Saya tinggal di Tokyo." },
  ],
  [
    "_の中に／上に／下に_",
    "箱の中に猫がいます。",
    { en: "inside/on top of/underneath", id: "di dalam/atas/bawah" },
    [
      ["箱の中に", "Hako no naka ni"],
      ["猫が", "neko ga"],
      ["います。", "imasu."],
    ],
    "はこの なかに ねこが ....",
    { en: "There is a cat inside the box.", id: "Ada kucing di dalam kotak." },
  ],
  [
    "_の隣に／そばに／近くに_",
    "駅の近くに店があります。",
    { en: "next to/near", id: "di sebelah/dekat" },
    [
      ["駅の近くに", "Eki no chikaku ni"],
      ["店が", "mise ga"],
      ["あります。", "arimasu."],
    ],
    "えきの ちかくに みせが ....",
    { en: "There is a shop near the station.", id: "Ada toko dekat stasiun." },
  ],
];

// Sub-Tier 2.2: Arah & Perpindahan (7)
export const BUNPO_N5_TIER4: BunpoEntry[] = [
  [
    "_へ/に行きます・来ます・帰ります",
    "学校へ行きます。",
    { en: "go/come/return to a place", id: "pergi/datang/pulang ke" },
    [
      ["学校へ", "Gakkou e"],
      ["行きます。", "ikimasu."],
    ],
    "がっこう ....",
    { en: "I go to school.", id: "Saya pergi ke sekolah." },
  ],
  [
    "_で行きます",
    "バスで行きます。",
    {
      en: "go by (means of transport)",
      id: "pergi dengan (alat transportasi)",
    },
    [
      ["バスで", "Basu de"],
      ["行きます。", "ikimasu."],
    ],
    "バス ....",
    { en: "I go by bus.", id: "Saya pergi naik bis." },
  ],
  [
    "_から_まで_",
    "家から学校まで歩きます。",
    { en: "from...to (distance)", id: "dari...sampai (jarak)" },
    [
      ["家から", "Ie kara"],
      ["学校まで", "gakkou made"],
      ["歩きます。", "arukimasu."],
    ],
    "いえから がっこうまで ....",
    {
      en: "I walk from home to school.",
      id: "Saya berjalan kaki dari rumah sampai sekolah.",
    },
  ],
  [
    "_を渡ります",
    "橋を渡ります。",
    { en: "to cross", id: "menyeberang" },
    [
      ["橋を", "Hashi wo"],
      ["渡ります。", "watarimasu."],
    ],
    "はし ....",
    { en: "I cross the bridge.", id: "Saya menyeberangi jembatan." },
  ],
  [
    "_を曲がります",
    "次の角を曲がります。",
    { en: "to turn", id: "belok" },
    [
      ["次の角を", "Tsugi no kado wo"],
      ["曲がります。", "magarimasu."],
    ],
    "つぎの かどを ....",
    {
      en: "I turn at the next corner.",
      id: "Saya belok di tikungan berikutnya.",
    },
  ],
  [
    "_をまっすぐ行きます",
    "この道をまっすぐ行きます。",
    { en: "go straight along", id: "jalan lurus" },
    [
      ["この道を", "Kono michi wo"],
      ["まっすぐ", "massugu"],
      ["行きます。", "ikimasu."],
    ],
    "この みちを まっすぐ ....",
    {
      en: "I go straight along this road.",
      id: "Saya jalan lurus di jalan ini.",
    },
  ],
  [
    "_に乗ります／_を降ります",
    "バスに乗ります。",
    { en: "get on/get off a vehicle", id: "naik/turun kendaraan" },
    [
      ["バスに", "Basu ni"],
      ["乗ります。", "norimasu."],
    ],
    "バス ....",
    { en: "I get on the bus.", id: "Saya naik bis." },
  ],
];

// Sub-Tier 3.1: Bentuk Sopan (Masu Form) (6)
export const BUNPO_N5_TIER5: BunpoEntry[] = [
  [
    "_ます",
    "毎日勉強します。",
    {
      en: "polite non-past positive",
      id: "bentuk sopan positif (sekarang/akan datang)",
    },
    [
      ["毎日", "Mainichi"],
      ["勉強します。", "benkyou shimasu."],
    ],
    "まいにち ....",
    { en: "I study every day.", id: "Saya belajar setiap hari." },
  ],
  [
    "_ません",
    "今日は勉強しません。",
    { en: "polite negative", id: "bentuk sopan negatif" },
    [
      ["今日は", "Kyou wa"],
      ["勉強しません。", "benkyou shimasen."],
    ],
    "きょうは ....",
    { en: "I will not study today.", id: "Hari ini saya tidak belajar." },
  ],
  [
    "_ました",
    "昨日、映画を見ました。",
    { en: "polite past positive", id: "bentuk sopan lampau positif" },
    [
      ["昨日、", "Kinou,"],
      ["映画を", "eiga wo"],
      ["見ました。", "mimashita."],
    ],
    "きのう、えいがを ....",
    { en: "I watched a movie yesterday.", id: "Kemarin saya menonton film." },
  ],
  [
    "_ませんでした",
    "昨日、行きませんでした。",
    { en: "polite past negative", id: "bentuk sopan lampau negatif" },
    [
      ["昨日、", "Kinou,"],
      ["行きませんでした。", "ikimasen deshita."],
    ],
    "きのう、....",
    { en: "I didn't go yesterday.", id: "Kemarin saya tidak pergi." },
  ],
  [
    "_ながら_",
    "音楽を聞きながら勉強します。",
    { en: "while doing", id: "sambil melakukan" },
    [
      ["音楽を", "Ongaku wo"],
      ["聞きながら", "kikinagara"],
      ["勉強します。", "benkyou shimasu."],
    ],
    "おんがくを きき... べんきょうします。",
    {
      en: "I study while listening to music.",
      id: "Saya belajar sambil mendengarkan musik.",
    },
  ],
  [
    "_（ます形の語幹）に行きます/来ます",
    "デパートへ買い物に行きます。",
    {
      en: "go/come to do (purpose)",
      id: "pergi/datang untuk melakukan (tujuan)",
    },
    [
      ["デパートへ", "Depaato e"],
      ["買い物に", "kaimono ni"],
      ["行きます。", "ikimasu."],
    ],
    "デパートへ かいものに ....",
    {
      en: "I go to the department store to shop.",
      id: "Saya pergi ke department store untuk belanja.",
    },
  ],
];

// Sub-Tier 3.2: Bentuk Te (Te Form) (8)
export const BUNPO_N5_TIER6: BunpoEntry[] = [
  [
    "_ています",
    "今、勉強しています。",
    {
      en: "doing right now / ongoing state",
      id: "sedang melakukan / kondisi berlanjut",
    },
    [
      ["今、", "Ima,"],
      ["勉強しています。", "benkyou shite imasu."],
    ],
    "いま、べんきょう ....",
    { en: "I am studying right now.", id: "Sedang belajar sekarang." },
  ],
  [
    "_てください",
    "ここに座ってください。",
    { en: "please do", id: "tolong lakukan" },
    [
      ["ここに", "Koko ni"],
      ["座ってください。", "suwatte kudasai."],
    ],
    "ここに ....",
    { en: "Please sit here.", id: "Tolong duduk di sini." },
  ],
  [
    "_てもいいです",
    "ここに座ってもいいです。",
    { en: "allowed to do", id: "boleh melakukan" },
    [
      ["ここに", "Koko ni"],
      ["座ってもいいです。", "suwattemo ii desu."],
    ],
    "ここに ....",
    { en: "You may sit here.", id: "Boleh duduk di sini." },
  ],
  [
    "_てはいけません",
    "ここに座ってはいけません。",
    { en: "not allowed to do", id: "tidak boleh melakukan" },
    [
      ["ここに", "Koko ni"],
      ["座ってはいけません。", "suwatte wa ikemasen."],
    ],
    "ここに ....",
    { en: "You must not sit here.", id: "Tidak boleh duduk di sini." },
  ],
  [
    "_てから_",
    "手を洗ってから食べます。",
    { en: "after doing", id: "setelah melakukan" },
    [
      ["手を洗ってから", "Te wo aratte kara"],
      ["食べます。", "tabemasu."],
    ],
    "てを あらって... たべます。",
    {
      en: "I eat after washing my hands.",
      id: "Saya makan setelah cuci tangan.",
    },
  ],
  [
    "_て、_",
    "朝起きて、顔を洗います。",
    {
      en: "connecting two consecutive actions",
      id: "menyambung dua aksi berurutan",
    },
    [
      ["朝起きて、", "Asa okite,"],
      ["顔を", "kao wo"],
      ["洗います。", "araimasu."],
    ],
    "あさ おきて、かおを ....",
    {
      en: "I wake up in the morning and wash my face.",
      id: "Saya bangun pagi lalu cuci muka.",
    },
  ],
  [
    "_てみます",
    "この料理を食べてみます。",
    { en: "try doing", id: "coba melakukan" },
    [
      ["この料理を", "Kono ryouri wo"],
      ["食べてみます。", "tabete mimasu."],
    ],
    "この りょうりを ....",
    {
      en: "I will try eating this dish.",
      id: "Saya akan coba makan masakan ini.",
    },
  ],
  [
    "_ておきます",
    "明日のために準備しておきます。",
    {
      en: "do in advance (preparation)",
      id: "melakukan lebih dulu (persiapan)",
    },
    [
      ["明日のために", "Ashita no tame ni"],
      ["準備しておきます。", "junbi shite okimasu."],
    ],
    "あしたの ために ....",
    {
      en: "I will prepare in advance for tomorrow.",
      id: "Saya akan menyiapkan lebih dulu untuk besok.",
    },
  ],
];

// Sub-Tier 3.3: Bentuk Nai (Nai Form) (7)
export const BUNPO_N5_TIER7: BunpoEntry[] = [
  [
    "_ない",
    "明日は行かない。",
    { en: "dictionary-form negative", id: "bentuk negatif kamus" },
    [
      ["明日は", "Ashita wa"],
      ["行かない。", "ikanai."],
    ],
    "あしたは ....",
    { en: "I won't go tomorrow.", id: "Besok saya tidak pergi." },
  ],
  [
    "_ないでください",
    "写真を撮らないでください。",
    { en: "please don't do", id: "tolong jangan lakukan" },
    [
      ["写真を", "Shashin wo"],
      ["撮らないでください。", "toranaide kudasai."],
    ],
    "しゃしんを ....",
    { en: "Please don't take photos.", id: "Tolong jangan mengambil foto." },
  ],
  [
    "_なければなりません",
    "薬を飲まなければなりません。",
    { en: "must do", id: "harus melakukan" },
    [
      ["薬を", "Kusuri wo"],
      ["飲まなければなりません。", "nomanakereba narimasen."],
    ],
    "くすりを ....",
    { en: "I must take medicine.", id: "Saya harus minum obat." },
  ],
  [
    "_なくてもいいです",
    "今日は勉強しなくてもいいです。",
    { en: "don't need to do", id: "tidak perlu melakukan" },
    [
      ["今日は", "Kyou wa"],
      ["勉強しなくてもいいです。", "benkyou shinakutemo ii desu."],
    ],
    "きょうは ....",
    {
      en: "I don't need to study today.",
      id: "Hari ini saya tidak perlu belajar.",
    },
  ],
  [
    "_ないで_",
    "朝ご飯を食べないで学校へ行きました。",
    { en: "without doing", id: "tanpa melakukan" },
    [
      ["朝ご飯を", "Asagohan wo"],
      ["食べないで", "tabenaide"],
      ["学校へ行きました。", "gakkou e ikimashita."],
    ],
    "あさごはんを たべないで がっこうへ ....",
    {
      en: "I went to school without eating breakfast.",
      id: "Saya pergi ke sekolah tanpa makan pagi.",
    },
  ],
  [
    "_ないほうがいいです",
    "たばこを吸わないほうがいいです。",
    { en: "better not to do", id: "lebih baik tidak melakukan" },
    [
      ["たばこを", "Tabako wo"],
      ["吸わないほうがいいです。", "suwanai hou ga ii desu."],
    ],
    "たばこを ....",
    { en: "You'd better not smoke.", id: "Lebih baik tidak merokok." },
  ],
  [
    "_ないつもりです",
    "今年は旅行しないつもりです。",
    { en: "intend not to do", id: "berniat tidak melakukan" },
    [
      ["今年は", "Kotoshi wa"],
      ["旅行しないつもりです。", "ryokou shinai tsumori desu."],
    ],
    "ことしは ....",
    {
      en: "I don't intend to travel this year.",
      id: "Saya berniat tidak bepergian tahun ini.",
    },
  ],
];

// Sub-Tier 3.4: Bentuk Kamus (Dictionary Form) (7)
export const BUNPO_N5_TIER8: BunpoEntry[] = [
  [
    "_（辞書形）",
    "毎日日本語を勉強する。",
    { en: "plain non-past form", id: "bentuk polos non-lampau" },
    [
      ["毎日", "Mainichi"],
      ["日本語を", "nihongo wo"],
      ["勉強する。", "benkyou suru."],
    ],
    "まいにち にほんごを ....",
    {
      en: "I study Japanese every day.",
      id: "Saya belajar bahasa Jepang setiap hari.",
    },
  ],
  [
    "_る ことができます",
    "漢字を読むことができます。",
    { en: "can / able to do", id: "bisa/mampu melakukan" },
    [
      ["漢字を", "Kanji wo"],
      ["読むことができます。", "yomu koto ga dekimasu."],
    ],
    "かんじを よむ ....",
    { en: "I can read kanji.", id: "Saya bisa membaca kanji." },
  ],
  [
    "_る こと_",
    "本を読むことが好きです。",
    {
      en: "turns a verb into a noun",
      id: "menjadikan kata kerja sebagai kata benda",
    },
    [
      ["本を", "Hon wo"],
      ["読むことが", "yomu koto ga"],
      ["好きです。", "suki desu."],
    ],
    "ほんを よむ ... すきです。",
    { en: "I like reading books.", id: "Saya suka membaca buku." },
  ],
  [
    "_る 前に_",
    "寝る前に歯を磨きます。",
    { en: "before doing", id: "sebelum melakukan" },
    [
      ["寝る前に", "Neru mae ni"],
      ["歯を", "ha wo"],
      ["磨きます。", "migakimasu."],
    ],
    "ねる ... はを みがきます。",
    {
      en: "I brush my teeth before sleeping.",
      id: "Saya menyikat gigi sebelum tidur.",
    },
  ],
  [
    "_る つもりです",
    "来年日本へ行くつもりです。",
    { en: "intend to / plan to", id: "berniat/berencana" },
    [
      ["来年", "Rainen"],
      ["日本へ", "Nihon e"],
      ["行くつもりです。", "iku tsumori desu."],
    ],
    "らいねん にほんへ いく ....",
    {
      en: "I plan to go to Japan next year.",
      id: "Saya berencana pergi ke Jepang tahun depan.",
    },
  ],
  [
    "_る（普通形）と思います",
    "明日雨が降ると思います。",
    { en: "I think / in my opinion", id: "menurut saya/saya pikir" },
    [
      ["明日", "Ashita"],
      ["雨が", "ame ga"],
      ["降ると思います。", "furu to omoimasu."],
    ],
    "あした あめが ふる ....",
    {
      en: "I think it will rain tomorrow.",
      id: "Saya pikir besok akan hujan.",
    },
  ],
  [
    "_る なら_",
    "日本へ行くなら、京都もいいですよ。",
    { en: "if/when (topic conditional)", id: "kalau/jika (kondisional topik)" },
    [
      ["日本へ行くなら、", "Nihon e iku nara,"],
      ["京都もいいですよ。", "Kyouto mo ii desu yo."],
    ],
    "にほんへ いく...、きょうとも いいですよ。",
    {
      en: "If you're going to Japan, Kyoto is also nice.",
      id: "Kalau mau pergi ke Jepang, Kyoto juga bagus.",
    },
  ],
];

// Sub-Tier 3.5: Bentuk Ta (Past Form) (7)
export const BUNPO_N5_TIER9: BunpoEntry[] = [
  [
    "_た",
    "昨日映画を見た。",
    { en: "plain past form", id: "bentuk lampau polos" },
    [
      ["昨日", "Kinou"],
      ["映画を", "eiga wo"],
      ["見た。", "mita."],
    ],
    "きのう えいがを ....",
    { en: "I watched a movie yesterday.", id: "Kemarin saya nonton film." },
  ],
  [
    "_た ことがあります",
    "日本へ行ったことがあります。",
    { en: "have done before", id: "pernah melakukan" },
    [
      ["日本へ", "Nihon e"],
      ["行ったことがあります。", "itta koto ga arimasu."],
    ],
    "にほんへ ....",
    { en: "I have been to Japan before.", id: "Saya pernah pergi ke Jepang." },
  ],
  [
    "_た 後で_",
    "食べた後で薬を飲みます。",
    { en: "after doing", id: "setelah melakukan" },
    [
      ["食べた後で", "Tabeta ato de"],
      ["薬を", "kusuri wo"],
      ["飲みます。", "nomimasu."],
    ],
    "たべた ... くすりを のみます。",
    {
      en: "I take medicine after eating.",
      id: "Saya minum obat setelah makan.",
    },
  ],
  [
    "_たり、_たりします",
    "週末は本を読んだり、映画を見たりします。",
    { en: "doing things like...", id: "melakukan hal-hal seperti..." },
    [
      ["週末は", "Shuumatsu wa"],
      ["本を読んだり、", "hon wo yondari,"],
      ["映画を見たりします。", "eiga wo mitari shimasu."],
    ],
    "しゅうまつは ほんを よんだり、えいがを みたり ....",
    {
      en: "On weekends I do things like read books and watch movies.",
      id: "Akhir pekan saya melakukan hal-hal seperti membaca buku dan menonton film.",
    },
  ],
  [
    "_た ほうがいいです",
    "早く寝たほうがいいです。",
    { en: "you should do", id: "sebaiknya melakukan" },
    [
      ["早く", "Hayaku"],
      ["寝たほうが", "neta hou ga"],
      ["いいです。", "ii desu."],
    ],
    "はやく ねた ... です。",
    { en: "You'd better sleep early.", id: "Lebih baik tidur lebih awal." },
  ],
  [
    "_たら_",
    "雨が降ったら、行きません。",
    { en: "if/when/once (conditional)", id: "kalau/jika/ketika (kondisional)" },
    [
      ["雨が降ったら、", "Ame ga futtara,"],
      ["行きません。", "ikimasen."],
    ],
    "あめが ふったら、....",
    { en: "If it rains, I won't go.", id: "Kalau hujan, saya tidak pergi." },
  ],
  [
    "_た まま_",
    "電気をつけたまま寝ました。",
    {
      en: "remain in a state after doing",
      id: "dalam keadaan tetap setelah melakukan",
    },
    [
      ["電気をつけたまま", "Denki wo tsuketa mama"],
      ["寝ました。", "nemashita."],
    ],
    "でんきを つけた まま ....",
    {
      en: "I fell asleep with the light left on.",
      id: "Saya tertidur dengan lampu tetap menyala.",
    },
  ],
];

// Sub-Tier 4.1: Kata Sifat-i (i-Adj) (6)
export const BUNPO_N5_TIER10: BunpoEntry[] = [
  [
    "_い（普通形）",
    "この家は大きいです。",
    { en: "base form", id: "bentuk dasar" },
    [
      ["この家は", "Kono ie wa"],
      ["大きいです。", "ookii desu."],
    ],
    "この いえは ....",
    { en: "This house is big.", id: "Rumah ini besar." },
  ],
  [
    "_くないです",
    "この家は大きくないです。",
    { en: "negative", id: "negatif" },
    [
      ["この家は", "Kono ie wa"],
      ["大きくないです。", "ookikunai desu."],
    ],
    "この いえは ....",
    { en: "This house is not big.", id: "Rumah ini tidak besar." },
  ],
  [
    "_かったです",
    "昨日は忙しかったです。",
    { en: "past positive", id: "lampau positif" },
    [
      ["昨日は", "Kinou wa"],
      ["忙しかったです。", "isogashikatta desu."],
    ],
    "きのうは ....",
    { en: "Yesterday was busy.", id: "Kemarin sibuk." },
  ],
  [
    "_くなかったです",
    "昨日は忙しくなかったです。",
    { en: "past negative", id: "lampau negatif" },
    [
      ["昨日は", "Kinou wa"],
      ["忙しくなかったです。", "isogashikunakatta desu."],
    ],
    "きのうは ....",
    { en: "Yesterday was not busy.", id: "Kemarin tidak sibuk." },
  ],
  [
    "_くて_",
    "この店は安くておいしいです。",
    { en: "connecting (and)", id: "menyambung (dan)" },
    [
      ["この店は", "Kono mise wa"],
      ["安くて", "yasukute"],
      ["おいしいです。", "oishii desu."],
    ],
    "この みせは やすくて ....",
    { en: "This shop is cheap and delicious.", id: "Toko ini murah dan enak." },
  ],
  [
    "_く_",
    "早く起きます。",
    { en: "adverb form", id: "bentuk keterangan (adverbia)" },
    [
      ["早く", "Hayaku"],
      ["起きます。", "okimasu."],
    ],
    "はやく ....",
    { en: "I wake up early.", id: "Saya bangun pagi-pagi." },
  ],
];

// Sub-Tier 4.2: Kata Sifat-na (na-Adj) (6)
export const BUNPO_N5_TIER11: BunpoEntry[] = [
  [
    "_です",
    "この町は静かです。",
    { en: "positive", id: "positif" },
    [
      ["この町は", "Kono machi wa"],
      ["静かです。", "shizuka desu."],
    ],
    "この まちは ....",
    { en: "This town is quiet.", id: "Kota ini tenang." },
  ],
  [
    "_ではありません",
    "この町は静かではありません。",
    { en: "negative", id: "negatif" },
    [
      ["この町は", "Kono machi wa"],
      ["静かではありません。", "shizuka dewa arimasen."],
    ],
    "この まちは ....",
    { en: "This town is not quiet.", id: "Kota ini tidak tenang." },
  ],
  [
    "_でした",
    "昨日のパーティーは賑やかでした。",
    { en: "past positive", id: "lampau positif" },
    [
      ["昨日のパーティーは", "Kinou no paatii wa"],
      ["賑やかでした。", "nigiyaka deshita."],
    ],
    "きのうの ぱーてぃーは ....",
    { en: "Yesterday's party was lively.", id: "Pesta kemarin ramai." },
  ],
  [
    "_ではありませんでした",
    "昨日のパーティーは賑やかではありませんでした。",
    { en: "past negative", id: "lampau negatif" },
    [
      ["昨日のパーティーは", "Kinou no paatii wa"],
      ["賑やかではありませんでした。", "nigiyaka dewa arimasen deshita."],
    ],
    "きのうの ぱーてぃーは ....",
    {
      en: "Yesterday's party was not lively.",
      id: "Pesta kemarin tidak ramai.",
    },
  ],
  [
    "_で_（な形容詞）",
    "この町は静かで、きれいです。",
    { en: "connecting (and)", id: "menyambung (dan)" },
    [
      ["この町は", "Kono machi wa"],
      ["静かで、", "shizuka de,"],
      ["きれいです。", "kirei desu."],
    ],
    "この まちは しずかで、....",
    {
      en: "This town is quiet and beautiful.",
      id: "Kota ini tenang dan indah.",
    },
  ],
  [
    "_に_（な形容詞）",
    "静かに話します。",
    { en: "adverb form", id: "bentuk keterangan (adverbia)" },
    [
      ["静かに", "Shizuka ni"],
      ["話します。", "hanashimasu."],
    ],
    "しずかに ....",
    { en: "I speak quietly.", id: "Saya berbicara dengan tenang." },
  ],
];

// Sub-Tier 5.1: Keinginan & Ajakan (7)
export const BUNPO_N5_TIER12: BunpoEntry[] = [
  [
    "_たいです",
    "日本へ行きたいです。",
    { en: "want to do", id: "ingin melakukan" },
    [
      ["日本へ", "Nihon e"],
      ["行きたいです。", "ikitai desu."],
    ],
    "にほんへ ... です。",
    { en: "I want to go to Japan.", id: "Saya ingin pergi ke Jepang." },
  ],
  [
    "_たくないです",
    "今日は働きたくないです。",
    { en: "don't want to do", id: "tidak ingin melakukan" },
    [
      ["今日は", "Kyou wa"],
      ["働きたくないです。", "hatarakitakunai desu."],
    ],
    "きょうは ....",
    {
      en: "I don't want to work today.",
      id: "Hari ini saya tidak ingin bekerja.",
    },
  ],
  [
    "_がほしいです",
    "新しい車がほしいです。",
    { en: "want (a thing)", id: "ingin (benda)" },
    [
      ["新しい車が", "Atarashii kuruma ga"],
      ["ほしいです。", "hoshii desu."],
    ],
    "あたらしい くるまが ....",
    { en: "I want a new car.", id: "Saya ingin mobil baru." },
  ],
  [
    "_ましょう",
    "一緒に食べましょう。",
    { en: "let's", id: "ayo/mari kita" },
    [
      ["一緒に", "Issho ni"],
      ["食べましょう。", "tabemashou."],
    ],
    "いっしょに ....",
    { en: "Let's eat together.", id: "Ayo makan bersama-sama." },
  ],
  [
    "_ましょうか",
    "一緒に映画を見ましょうか。",
    {
      en: "shall we... / how about...",
      id: "bagaimana kalau kita.../mari saya...",
    },
    [
      ["一緒に", "Issho ni"],
      ["映画を", "eiga wo"],
      ["見ましょうか。", "mimashou ka."],
    ],
    "いっしょに えいがを ....",
    {
      en: "Shall we watch a movie together?",
      id: "Bagaimana kalau kita nonton film bersama?",
    },
  ],
  [
    "_ませんか",
    "一緒に行きませんか。",
    {
      en: "would you like to...? (invitation)",
      id: "maukah kamu...? (ajakan)",
    },
    [
      ["一緒に", "Issho ni"],
      ["行きませんか。", "ikimasen ka."],
    ],
    "いっしょに ....",
    { en: "Would you like to go together?", id: "Mau pergi bersama-sama?" },
  ],
  [
    "_なさい",
    "早く寝なさい。",
    { en: "do it! (gentle command)", id: "lakukan! (perintah halus)" },
    [
      ["早く", "Hayaku"],
      ["寝なさい。", "nenasai."],
    ],
    "はやく ....",
    { en: "Go to sleep early!", id: "Cepat tidur!" },
  ],
];

// Sub-Tier 5.2: Alasan & Perbandingan (7)
export const BUNPO_N5_TIER13: BunpoEntry[] = [
  [
    "_から_",
    "雨が降っているから、行きません。",
    { en: "because (reason)", id: "karena (alasan)" },
    [
      ["雨が降っているから、", "Ame ga futte iru kara,"],
      ["行きません。", "ikimasen."],
    ],
    "あめが ふっているから、....",
    {
      en: "Because it's raining, I won't go.",
      id: "Karena sedang hujan, saya tidak pergi.",
    },
  ],
  [
    "_ので_",
    "雨なので、行きません。",
    {
      en: "because (softer/objective reason)",
      id: "karena (alasan lebih halus/objektif)",
    },
    [
      ["雨なので、", "Ame nanode,"],
      ["行きません。", "ikimasen."],
    ],
    "あめ ...、いきません。",
    {
      en: "Because it's raining, I won't go.",
      id: "Karena hujan, saya tidak pergi.",
    },
  ],
  [
    "_は_より_です",
    "私は犬より猫が好きです。",
    { en: "A is more ~ than B", id: "A lebih ~ daripada B" },
    [
      ["私は", "Watashi wa"],
      ["犬より", "inu yori"],
      ["猫が", "neko ga"],
      ["好きです。", "suki desu."],
    ],
    "わたしは いぬより ねこが すきです。",
    {
      en: "I like cats more than dogs.",
      id: "Saya lebih suka kucing daripada anjing.",
    },
  ],
  [
    "_と_とどちらが_ですか",
    "犬と猫とどちらが好きですか。",
    { en: "which is more ~, A or B?", id: "mana yang lebih ~, A atau B?" },
    [
      ["犬と猫と", "Inu to neko to"],
      ["どちらが", "dochira ga"],
      ["好きですか。", "suki desu ka."],
    ],
    "いぬと ねこと どちらが すきですか。",
    {
      en: "Which do you like more, dogs or cats?",
      id: "Mana yang lebih kamu suka, anjing atau kucing?",
    },
  ],
  [
    "_の中で_が一番_です",
    "果物の中でりんごが一番好きです。",
    { en: "among ~, ~ is the most ~", id: "di antara ~, ~ paling ~" },
    [
      ["果物の中で", "Kudamono no naka de"],
      ["りんごが", "ringo ga"],
      ["一番好きです。", "ichiban suki desu."],
    ],
    "くだものの なかで りんごが いちばん すきです。",
    {
      en: "Among fruits, I like apples the most.",
      id: "Di antara buah-buahan, saya paling suka apel.",
    },
  ],
  [
    "_でしょう",
    "明日は晴れでしょう。",
    { en: "probably / likely", id: "mungkin/kemungkinan besar" },
    [
      ["明日は", "Ashita wa"],
      ["晴れでしょう。", "hare deshou."],
    ],
    "あしたは はれ ....",
    { en: "It will probably be sunny tomorrow.", id: "Besok mungkin cerah." },
  ],
  [
    "_ほど_ない",
    "今日は昨日ほど暑くないです。",
    {
      en: "not as ~ as (negative comparison)",
      id: "tidak se~ (perbandingan negatif)",
    },
    [
      ["今日は", "Kyou wa"],
      ["昨日ほど", "kinou hodo"],
      ["暑くないです。", "atsukunai desu."],
    ],
    "きょうは きのうほど あつくないです。",
    {
      en: "Today is not as hot as yesterday.",
      id: "Hari ini tidak sepanas kemarin.",
    },
  ],
];

// Sub-Tier 6.1: Kata Tunjuk (Ko-So-A-Do) (5)
export const BUNPO_N5_TIER14: BunpoEntry[] = [
  [
    "これ／それ／あれ／どれ_",
    "これは私の本です。",
    {
      en: "this/that/that over there/which (thing)",
      id: "ini/itu/itu (jauh)/yang mana (benda)",
    },
    [
      ["これは", "Kore wa"],
      ["私の本です。", "watashi no hon desu."],
    ],
    "これは ....",
    { en: "This is my book.", id: "Ini buku saya." },
  ],
  [
    "この／その／あの／どの_",
    "この本は面白いです。",
    {
      en: "this/that/that over there/which N",
      id: "N ini/itu/itu (jauh)/yang mana",
    },
    [
      ["この本は", "Kono hon wa"],
      ["面白いです。", "omoshiroi desu."],
    ],
    "この ほんは ....",
    { en: "This book is interesting.", id: "Buku ini menarik." },
  ],
  [
    "_ここ／そこ／あそこ／どこ",
    "教室はここです。",
    {
      en: "here/there/over there/where (place)",
      id: "di sini/situ/sana/mana (tempat)",
    },
    [
      ["教室は", "Kyoushitsu wa"],
      ["ここです。", "koko desu."],
    ],
    "きょうしつは ....",
    { en: "The classroom is here.", id: "Kelasnya ada di sini." },
  ],
  [
    "_こちら／そちら／あちら／どちら",
    "お手洗いはあちらです。",
    {
      en: "this way/that way/that way over there/which way (polite)",
      id: "arah ini/itu/sana/mana (sopan)",
    },
    [
      ["お手洗いは", "Otearai wa"],
      ["あちらです。", "achira desu."],
    ],
    "おてあらいは ....",
    { en: "The restroom is that way.", id: "Toiletnya ke arah sana." },
  ],
  [
    "こんな／そんな／あんな／どんな_",
    "どんな音楽が好きですか。",
    {
      en: "this kind of/that kind of/what kind of N",
      id: "N seperti ini/itu/itu/bagaimana",
    },
    [
      ["どんな音楽が", "Donna ongaku ga"],
      ["好きですか。", "suki desu ka."],
    ],
    "どんな おんがくが すきですか。",
    {
      en: "What kind of music do you like?",
      id: "Musik seperti apa yang kamu suka?",
    },
  ],
];

// Sub-Tier 6.2: Partikel Akhir & Penghubung Kalimat (5)
export const BUNPO_N5_TIER15: BunpoEntry[] = [
  [
    "_か",
    "これは何ですか。",
    { en: "question particle", id: "partikel tanya" },
    [
      ["これ", "Kore"],
      ["は", "wa"],
      ["何ですか。", "nan desu ka."],
    ],
    "これは なんです ....",
    { en: "What is this?", id: "Ini apa?" },
  ],
  [
    "_ね",
    "今日は暑いですね。",
    {
      en: 'seeking agreement ("isn\'t it?")',
      id: 'mencari persetujuan ("ya kan?")',
    },
    [
      ["今日", "Kyou"],
      ["は", "wa"],
      ["暑いですね。", "atsui desu ne."],
    ],
    "きょうは あついです ....",
    { en: "It's hot today, isn't it?", id: "Hari ini panas, ya." },
  ],
  [
    "_よ",
    "もう6時ですよ。",
    { en: "emphasizes new information", id: "menegaskan info baru" },
    [
      ["もう", "Mou"],
      ["6時", "roku-ji"],
      ["ですよ。", "desu yo."],
    ],
    "もう ろくじです ....",
    { en: "It's already 6 o'clock!", id: "Sudah jam 6, lho!" },
  ],
  [
    "_や_",
    "机の上に本やノートがあります。",
    {
      en: "and so on (partial, non-exhaustive listing)",
      id: "dan lain-lain (menyebut sebagian, tidak lengkap)",
    },
    [
      ["机の上に", "Tsukue no ue ni"],
      ["本やノートが", "hon ya nooto ga"],
      ["あります。", "arimasu."],
    ],
    "つくえの うえに ほんや のーとが あります。",
    {
      en: "There are things like books and notebooks on the desk.",
      id: "Di atas meja ada buku, buku catatan, dan lain-lain.",
    },
  ],
  [
    "_そして／それから／でも／しかし_",
    "宿題をしました。それから、寝ました。",
    {
      en: "then/after that/but/however (sentence connector)",
      id: "kemudian/lalu/tapi/namun (penghubung antarkalimat)",
    },
    [
      ["宿題をしました。", "Shukudai wo shimashita."],
      ["それから、", "Sorekara,"],
      ["寝ました。", "nemashita."],
    ],
    "しゅくだいを しました。それから、ねました。",
    {
      en: "I did my homework. After that, I went to sleep.",
      id: "Saya mengerjakan PR. Setelah itu, saya tidur.",
    },
  ],
];

export const BUNPO_N5_TIER_KEYS: string[] = [
  "tier1",
  "tier2",
  "tier3",
  "tier4",
  "tier5",
  "tier6",
  "tier7",
  "tier8",
  "tier9",
  "tier10",
  "tier11",
  "tier12",
  "tier13",
  "tier14",
  "tier15",
];
export const BUNPO_N5_CHAPTERS: BunpoEntry[][] = [
  BUNPO_N5_TIER1,
  BUNPO_N5_TIER2,
  BUNPO_N5_TIER3,
  BUNPO_N5_TIER4,
  BUNPO_N5_TIER5,
  BUNPO_N5_TIER6,
  BUNPO_N5_TIER7,
  BUNPO_N5_TIER8,
  BUNPO_N5_TIER9,
  BUNPO_N5_TIER10,
  BUNPO_N5_TIER11,
  BUNPO_N5_TIER12,
  BUNPO_N5_TIER13,
  BUNPO_N5_TIER14,
  BUNPO_N5_TIER15,
];
export const BUNPO_N5_LEVEL_META: { id: string; tier: number; rank: string }[]  = [
  ...BUNPO_N5_TIER_KEYS.map((id, i) => ({ id, tier: i + 1, rank: "N5" })),
  { id: "all", tier: BUNPO_N5_TIER_KEYS.length, rank: "N5" },
];

// Jumlah pola di deskripsi tiap tingkat dihitung langsung dari datanya (bukan diketik
// manual), supaya angkanya tidak pernah meleset lagi kalau pola ditambah/dihapus.
const patternCountDesc = (items: readonly unknown[]): Bilingual => ({
  en: `${items.length} N5 grammar patterns.`,
  id: `${items.length} pola tata bahasa N5.`,
});
const BUNPO_N5_TOTAL = BUNPO_N5_CHAPTERS.reduce((sum, c) => sum + c.length, 0);

export const BUNPO_N5_LEVEL_TEXT: Record<
  string,
  { title: Bilingual; sample: string; desc: Bilingual }
> = {
  tier1: {
    title: {
      en: "Tier 1.1 — Predicate & Basic Sentences",
      id: "Tier 1.1 — Predikat & Kalimat Dasar",
    },
    sample: "_は_です",
    desc: patternCountDesc(BUNPO_N5_TIER1),
  },
  tier2: {
    title: { en: "Tier 1.2 — Main Particles", id: "Tier 1.2 — Partikel Utama" },
    sample: "_は_",
    desc: patternCountDesc(BUNPO_N5_TIER2),
  },
  tier3: {
    title: {
      en: "Tier 2.1 — Existence (There is / Living)",
      id: "Tier 2.1 — Keberadaan (Ada/Tinggal)",
    },
    sample: "_があります",
    desc: patternCountDesc(BUNPO_N5_TIER3),
  },
  tier4: {
    title: {
      en: "Tier 2.2 — Direction & Movement",
      id: "Tier 2.2 — Arah & Perpindahan",
    },
    sample: "_へ/に行きます・来ます・帰ります",
    desc: patternCountDesc(BUNPO_N5_TIER4),
  },
  tier5: {
    title: {
      en: "Tier 3.1 — Polite Form (Masu Form)",
      id: "Tier 3.1 — Bentuk Sopan (Masu Form)",
    },
    sample: "_ます",
    desc: patternCountDesc(BUNPO_N5_TIER5),
  },
  tier6: {
    title: { en: "Tier 3.2 — Te Form", id: "Tier 3.2 — Bentuk Te (Te Form)" },
    sample: "_ています",
    desc: patternCountDesc(BUNPO_N5_TIER6),
  },
  tier7: {
    title: {
      en: "Tier 3.3 — Nai Form",
      id: "Tier 3.3 — Bentuk Nai (Nai Form)",
    },
    sample: "_ない",
    desc: patternCountDesc(BUNPO_N5_TIER7),
  },
  tier8: {
    title: {
      en: "Tier 3.4 — Dictionary Form",
      id: "Tier 3.4 — Bentuk Kamus (Dictionary Form)",
    },
    sample: "_（辞書形）",
    desc: patternCountDesc(BUNPO_N5_TIER8),
  },
  tier9: {
    title: {
      en: "Tier 3.5 — Past Form (Ta Form)",
      id: "Tier 3.5 — Bentuk Ta (Past Form)",
    },
    sample: "_た",
    desc: patternCountDesc(BUNPO_N5_TIER9),
  },
  tier10: {
    title: {
      en: "Tier 4.1 — i-Adjectives",
      id: "Tier 4.1 — Kata Sifat-i (i-Adj)",
    },
    sample: "_い（普通形）",
    desc: patternCountDesc(BUNPO_N5_TIER10),
  },
  tier11: {
    title: {
      en: "Tier 4.2 — na-Adjectives",
      id: "Tier 4.2 — Kata Sifat-na (na-Adj)",
    },
    sample: "_です",
    desc: patternCountDesc(BUNPO_N5_TIER11),
  },
  tier12: {
    title: {
      en: "Tier 5.1 — Wants & Invitations",
      id: "Tier 5.1 — Keinginan & Ajakan",
    },
    sample: "_たいです",
    desc: patternCountDesc(BUNPO_N5_TIER12),
  },
  tier13: {
    title: {
      en: "Tier 5.2 — Reasons & Comparisons",
      id: "Tier 5.2 — Alasan & Perbandingan",
    },
    sample: "_から_",
    desc: patternCountDesc(BUNPO_N5_TIER13),
  },
  tier14: {
    title: {
      en: "Tier 6.1 — Demonstratives (Ko-So-A-Do)",
      id: "Tier 6.1 — Kata Tunjuk (Ko-So-A-Do)",
    },
    sample: "これ／それ／あれ／どれ_",
    desc: patternCountDesc(BUNPO_N5_TIER14),
  },
  tier15: {
    title: {
      en: "Tier 6.2 — Sentence-final Particles & Connectors",
      id: "Tier 6.2 — Partikel Akhir & Penghubung Kalimat",
    },
    sample: "_か",
    desc: patternCountDesc(BUNPO_N5_TIER15),
  },
  all: {
    title: { en: "All Mixed", id: "seluruh Campur" },
    sample: "_たいです",
    desc: {
      en: `All ${BUNPO_N5_TOTAL} N5 grammar patterns shuffled into one Chapter.`,
      id: `Seluruh ${BUNPO_N5_TOTAL} pola bunpō N5 diacak menjadi satu Chapter.`,
    },
  },
};

export const BUNPO_N5_LEARN: BunpoLearnSection[] = [
  {
    tierKey: "tier1",
    title: {
      en: "Tier 1.1 — Predicate & Basic Sentences",
      id: "Tier 1.1 — Predikat & Kalimat Dasar",
    },
    desc: patternCountDesc(BUNPO_N5_TIER1),
    items: BUNPO_N5_TIER1,
  },
  {
    tierKey: "tier2",
    title: { en: "Tier 1.2 — Main Particles", id: "Tier 1.2 — Partikel Utama" },
    desc: patternCountDesc(BUNPO_N5_TIER2),
    items: BUNPO_N5_TIER2,
  },
  {
    tierKey: "tier3",
    title: {
      en: "Tier 2.1 — Existence (There is / Living)",
      id: "Tier 2.1 — Keberadaan (Ada/Tinggal)",
    },
    desc: patternCountDesc(BUNPO_N5_TIER3),
    items: BUNPO_N5_TIER3,
  },
  {
    tierKey: "tier4",
    title: {
      en: "Tier 2.2 — Direction & Movement",
      id: "Tier 2.2 — Arah & Perpindahan",
    },
    desc: patternCountDesc(BUNPO_N5_TIER4),
    items: BUNPO_N5_TIER4,
  },
  {
    tierKey: "tier5",
    title: {
      en: "Tier 3.1 — Polite Form (Masu Form)",
      id: "Tier 3.1 — Bentuk Sopan (Masu Form)",
    },
    desc: patternCountDesc(BUNPO_N5_TIER5),
    items: BUNPO_N5_TIER5,
  },
  {
    tierKey: "tier6",
    title: { en: "Tier 3.2 — Te Form", id: "Tier 3.2 — Bentuk Te (Te Form)" },
    desc: patternCountDesc(BUNPO_N5_TIER6),
    items: BUNPO_N5_TIER6,
  },
  {
    tierKey: "tier7",
    title: {
      en: "Tier 3.3 — Nai Form",
      id: "Tier 3.3 — Bentuk Nai (Nai Form)",
    },
    desc: patternCountDesc(BUNPO_N5_TIER7),
    items: BUNPO_N5_TIER7,
  },
  {
    tierKey: "tier8",
    title: {
      en: "Tier 3.4 — Dictionary Form",
      id: "Tier 3.4 — Bentuk Kamus (Dictionary Form)",
    },
    desc: patternCountDesc(BUNPO_N5_TIER8),
    items: BUNPO_N5_TIER8,
  },
  {
    tierKey: "tier9",
    title: {
      en: "Tier 3.5 — Past Form (Ta Form)",
      id: "Tier 3.5 — Bentuk Ta (Past Form)",
    },
    desc: patternCountDesc(BUNPO_N5_TIER9),
    items: BUNPO_N5_TIER9,
  },
  {
    tierKey: "tier10",
    title: {
      en: "Tier 4.1 — i-Adjectives",
      id: "Tier 4.1 — Kata Sifat-i (i-Adj)",
    },
    desc: patternCountDesc(BUNPO_N5_TIER10),
    items: BUNPO_N5_TIER10,
  },
  {
    tierKey: "tier11",
    title: {
      en: "Tier 4.2 — na-Adjectives",
      id: "Tier 4.2 — Kata Sifat-na (na-Adj)",
    },
    desc: patternCountDesc(BUNPO_N5_TIER11),
    items: BUNPO_N5_TIER11,
  },
  {
    tierKey: "tier12",
    title: {
      en: "Tier 5.1 — Wants & Invitations",
      id: "Tier 5.1 — Keinginan & Ajakan",
    },
    desc: patternCountDesc(BUNPO_N5_TIER12),
    items: BUNPO_N5_TIER12,
  },
  {
    tierKey: "tier13",
    title: {
      en: "Tier 5.2 — Reasons & Comparisons",
      id: "Tier 5.2 — Alasan & Perbandingan",
    },
    desc: patternCountDesc(BUNPO_N5_TIER13),
    items: BUNPO_N5_TIER13,
  },
  {
    tierKey: "tier14",
    title: {
      en: "Tier 6.1 — Demonstratives (Ko-So-A-Do)",
      id: "Tier 6.1 — Kata Tunjuk (Ko-So-A-Do)",
    },
    desc: patternCountDesc(BUNPO_N5_TIER14),
    items: BUNPO_N5_TIER14,
  },
  {
    tierKey: "tier15",
    title: {
      en: "Tier 6.2 — Sentence-final Particles & Connectors",
      id: "Tier 6.2 — Partikel Akhir & Penghubung Kalimat",
    },
    desc: patternCountDesc(BUNPO_N5_TIER15),
    items: BUNPO_N5_TIER15,
  },
];
