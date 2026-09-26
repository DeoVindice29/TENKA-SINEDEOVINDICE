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
    { en: "は marks the topic (A), not necessarily the grammatical subject — です is the polite copula and can be dropped entirely in casual speech.", id: "は menandai topik (A), bukan selalu subjek gramatikal — です adalah kopula sopan yang bisa dihilangkan sepenuhnya dalam percakapan santai." },
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
    { en: "The casual/spoken equivalent is じゃありません (or even shorter, じゃない) — ではありません sounds more formal/written.", id: "Bentuk santai/lisan yang setara adalah じゃありません (atau lebih pendek lagi, じゃない) — ではありません terdengar lebih formal/tertulis." },
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
    { en: "Just the copula です becomes でした in the past — the rest of the sentence (は, the noun) doesn't change.", id: "Hanya kopula です yang berubah jadi でした untuk lampau — bagian lain kalimat (は, kata bendanya) tidak berubah." },
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
    { en: "Casual speech often shortens this to じゃなかったです or じゃありませんでした.", id: "Dalam percakapan santai sering dipendekkan jadi じゃなかったです atau じゃありませんでした." },
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
    { en: "も replaces は, が, or を entirely — you never see は/が/を together with も on the same noun (e.g. わたしはも is wrong).", id: "も menggantikan は, が, atau を sepenuhnya — tidak pernah muncul bersamaan dengan は/が/を pada kata benda yang sama (contoh: わたしはも salah)." },
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
    { en: "の can chain more than once (私の友達の本 = my friend's book) and can also stand alone to mean 'one/the one' (赤いのがいい = the red one is good).", id: "の bisa dirangkai lebih dari sekali (私の友達の本 = buku milik teman saya) dan juga bisa berdiri sendiri berarti 'yang itu' (赤いのがいい = yang merah lebih bagus)." },
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
    { en: "と lists items completely/exhaustively — use や instead if the list is only a partial example (see the や pattern later on).", id: "と menyebutkan semua item secara lengkap — kalau daftarnya cuma sebagian contoh saja, pakai や (lihat pola や nanti)." },
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
    { en: "は marks what the sentence is ABOUT (the topic), which often differs from が, which marks the grammatical subject/new information.", id: "は menandai apa yang sedang DIBAHAS kalimat (topik), yang sering berbeda dari が yang menandai subjek gramatikal/informasi baru." },
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
    { en: "が tends to appear with new information, questions like 何が, and with verbs like ある/いる/わかる/好き — even when the noun feels like a topic in English.", id: "が cenderung muncul dengan informasi baru, pertanyaan seperti 何が, dan kata kerja seperti ある/いる/わかる/好き — meski dalam terjemahan terasa seperti topik." },
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
    { en: "Besides the direct object, を also marks the path taken or point of departure with motion verbs like 渡る (cross), 曲がる (turn), and 出る (leave).", id: "Selain objek langsung, を juga menandai jalur yang dilalui atau titik keberangkatan pada kata kerja gerak seperti 渡る (menyeberang), 曲がる (belok), dan 出る (keluar/berangkat)." },
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
    { en: "に marks a fixed point — a specific time, a destination, or where something exists (います/あります) — different from で, which marks where an action takes place.", id: "に menandai titik tetap — waktu spesifik, tujuan, atau tempat keberadaan (います/あります) — berbeda dari で yang menandai tempat berlangsungnya aksi." },
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
    { en: "で marks the place an action happens or the means/tool used — for a fixed location of existence, use に instead (公園で遊ぶ vs 公園にいる).", id: "で menandai tempat berlangsungnya aksi atau alat/cara yang dipakai — untuk lokasi keberadaan yang tetap, pakai に (公園で遊ぶ vs 公園にいる)." },
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
    { en: "Here と means 'together with' and needs a person/animal — for an inanimate tool or means, use で instead.", id: "Di sini と berarti 'bersama dengan' dan butuh orang/makhluk hidup — untuk alat/benda mati sebagai 'sarana', pakai で." },
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
    { en: "から marks a starting point in time or space — it's often paired with まで ('until') to describe a full range.", id: "から menandai titik awal, baik waktu maupun tempat — sering dipasangkan dengan まで ('sampai') untuk menyebut rentang penuh." },
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
    { en: "まで marks an end point — combine it with から to say 'from...to' (see the から〜まで pattern).", id: "まで menandai titik akhir — gabungkan dengan から untuk mengatakan 'dari...sampai' (lihat pola から〜まで)." },
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
    { en: "あります is only for inanimate things and plants — for people or animals, use います instead (see the next pattern).", id: "あります hanya untuk benda mati dan tumbuhan — untuk orang atau hewan, pakai います (lihat pola berikutnya)." },
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
    { en: "います is for people and animals (anything that can move on its own) — for objects, use あります instead.", id: "います dipakai untuk orang dan hewan (apa pun yang bisa bergerak sendiri) — untuk benda, pakai あります." },
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
    { en: "The word order here is fixed: [place]に [thing]が あります/います — the place always comes first, marked by に, not は.", id: "Urutan kata di sini tetap: [tempat]に [benda]が あります/います — tempatnya selalu di depan, ditandai に, bukan は." },
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
    { en: "This mirrors the previous pattern — start with は when the THING is already known and you're saying where it is.", id: "Ini kebalikan dari pola sebelumnya — mulai dengan は kalau BENDA-nya sudah diketahui dan kamu ingin bilang di mana letaknya." },
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
    { en: "住んでいます uses the ている form because living somewhere is an ongoing state, not a one-time action — literally 'has settled and is living'.", id: "住んでいます pakai bentuk ている karena tinggal di suatu tempat adalah kondisi berlanjut, bukan aksi sekali — secara harfiah 'sudah menetap dan sedang tinggal'." },
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
    { en: "These are nouns (中/上/下) linked with の, not particles — you can swap in other position words the same way, like 前 (front) or 後ろ (back).", id: "Kata-kata ini (中/上/下) adalah kata benda yang disambung dengan の, bukan partikel — kamu bisa ganti dengan kata posisi lain, seperti 前 (depan) atau 後ろ (belakang)." },
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
    { en: "隣 means directly adjacent (next door), while そば and 近く just mean 'in the vicinity' — they're not perfectly interchangeable.", id: "隣 berarti persis bersebelahan (sebelah langsung), sedangkan そば dan 近く hanya berarti 'di sekitar' — tidak selalu bisa saling gantikan." },
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
    { en: "へ and に are interchangeable here to mark the destination — へ emphasizes the direction of travel, while に can also mark a more specific arrival point.", id: "へ dan に bisa saling gantikan di sini untuk menandai tujuan — へ menekankan arah perjalanan, sedangkan に bisa juga menandai titik kedatangan yang lebih spesifik." },
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
    { en: "で here marks the means of transport — for going on foot, the special phrase 歩いて行きます is used instead of 足で.", id: "で di sini menandai alat transportasi — untuk pergi jalan kaki, dipakai frasa khusus 歩いて行きます, bukan 足で." },
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
    { en: "The same から〜まで pair used for time also works for distance — context tells you whether it's a time range or a physical route.", id: "Pasangan から〜まで yang sama dipakai untuk waktu juga berlaku untuk jarak — konteks kalimat yang menentukan apakah itu rentang waktu atau rute fisik." },
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
    { en: "渡る needs something with two sides to cross — a bridge (橋), a road (道), a river (川) — not just any location.", id: "渡る butuh objek yang punya dua sisi untuk diseberangi — jembatan (橋), jalan (道), sungai (川) — bukan sembarang tempat." },
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
    { en: "曲がる is usually paired with a landmark like 角 (corner) or 交差点 (intersection) — combine it with 右に/左に to say which direction to turn.", id: "曲がる biasanya dipasangkan dengan patokan seperti 角 (tikungan) atau 交差点 (persimpangan) — gabungkan dengan 右に/左に untuk menyebut arah beloknya." },
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
    { en: "まっすぐ (straight) is an adverb placed right before the verb — the noun+を before it is the road/path being followed, not crossed.", id: "まっすぐ (lurus) adalah kata keterangan yang diletakkan tepat sebelum kata kerjanya — kata benda+を sebelumnya adalah jalan yang dilalui, bukan yang diseberangi." },
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
    { en: "Notice the particles differ: 乗る (get on) takes に, but 降りる (get off) takes を — a common mix-up for beginners.", id: "Perhatikan partikelnya berbeda: 乗る (naik) pakai に, tapi 降りる (turun) pakai を — sering tertukar oleh pemula." },
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
    { en: "ます attaches to the stem of a verb (the ます-form) — this is the default polite ending taught first in most textbooks.", id: "ます disambung ke bentuk stem kata kerja (bentuk ます) — ini akhiran sopan standar yang biasanya diajarkan pertama kali." },
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
    { en: "ません simply replaces ます — no extra word or change to the stem is needed to make a polite verb negative.", id: "ません tinggal menggantikan ます — tidak perlu tambahan kata atau perubahan stem untuk membuat kata kerja sopan jadi negatif." },
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
    { en: "ました replaces ます for the past — same stem, just a different ending, regardless of verb type.", id: "ました menggantikan ます untuk bentuk lampau — stem-nya sama, cuma akhirannya beda, berlaku untuk semua jenis kata kerja." },
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
    { en: "This is the past-tense version of ません — used for 'didn't do', not to be confused with なかったです, the plain/casual equivalent.", id: "Ini versi lampau dari ません — dipakai untuk 'tidak melakukan (dulu)', jangan bingung dengan なかったです yang merupakan versi santai/polos." },
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
    { en: "The verb before ながら must be in its stem (ます-form minus ます) — the main action, not ながら's verb, is what matters grammatically.", id: "Kata kerja sebelum ながら harus dalam bentuk stem (bentuk ます tanpa ます) — aksi utamanya adalah yang di akhir kalimat, bukan yang diikuti ながら." },
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
    { en: "Only 行きます/来ます/帰ります follow the stem+に pattern this way — it isn't used with other verbs to mean 'purpose'.", id: "Hanya 行きます/来ます/帰ります yang bisa mengikuti pola stem+に seperti ini — tidak dipakai dengan kata kerja lain untuk menyatakan 'tujuan'." },
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
    { en: "ている can mean either 'doing right now' (食べている = is eating) or a resulting state (結婚している = is married) — context decides which.", id: "ている bisa berarti 'sedang melakukan' (食べている = sedang makan) atau kondisi hasil dari sebuah aksi (結婚している = sudah menikah) — konteks yang menentukan." },
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
    { en: "てください is a request, not a command — for something closer to an order, the plain imperative or なさい (see later) sounds stronger.", id: "てください adalah permintaan, bukan perintah keras — untuk kesan lebih memerintah, bentuk perintah polos atau なさい (lihat nanti) terasa lebih tegas." },
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
    { en: "てもいいです is often used as a question (てもいいですか) to ask permission — もいい literally means 'is also fine/good'.", id: "てもいいです sering dipakai sebagai pertanyaan (てもいいですか) untuk minta izin — もいい secara harfiah berarti 'juga baik-baik saja'." },
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
    { en: "てはいけません sounds fairly strong/formal, like a rule — casual speech often uses てだめ or ちゃだめ instead.", id: "てはいけません terdengar cukup tegas/formal, seperti sebuah aturan — percakapan santai sering memakai てだめ atau ちゃだめ." },
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
    { en: "てから emphasizes the sequence — do this FIRST, then that — and is more explicit about order than just connecting with て alone.", id: "てから menekankan urutan — lakukan ini DULU, baru itu — lebih jelas soal urutan dibanding hanya menyambung dengan て saja." },
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
    { en: "The plain て-form connects actions or clauses like 'and' — for an i-adjective use くて and for a na-adjective/noun use で instead of て.", id: "Bentuk て polos menyambung aksi/klausa seperti kata 'dan' — untuk adjektiva-i pakai くて dan untuk adjektiva-na/kata benda pakai で, bukan て." },
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
    { en: "てみる literally means 'do and see' — it implies trying something out to see what happens, not just attempting it once with effort.", id: "てみる secara harfiah berarti 'melakukan lalu melihat' — menyiratkan mencoba sesuatu untuk melihat hasilnya, bukan sekadar berusaha keras." },
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
    { en: "ておく implies doing something now to prepare for later — casual speech often shortens ておく to とく.", id: "ておく menyiratkan melakukan sesuatu sekarang untuk persiapan nanti — dalam percakapan santai ておく sering dipendekkan jadi とく." },
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
    { en: "ない is the plain/casual counterpart of ません — used with friends and family, or as the base for other patterns like ないで and なければ.", id: "ない adalah padanan bentuk polos/santai dari ません — dipakai ke teman dan keluarga, atau sebagai dasar pola lain seperti ないで dan なければ." },
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
    { en: "The verb must be in its ない-form first, then add でください — don't confuse this with てください, the positive request.", id: "Kata kerjanya harus dalam bentuk ない dulu, baru tambahkan でください — jangan tertukar dengan てください yang merupakan permintaan positif." },
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
    { en: "This literally means 'if [you] don't do it, it won't do' — a common casual shortening is なきゃ (なきゃいけない).", id: "Secara harfiah berarti 'kalau tidak melakukan, tidak akan jadi/tidak boleh' — bentuk santai yang umum adalah なきゃ (なきゃいけない)." },
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
    { en: "This is the negative counterpart of てもいいです — compare 'don't need to do' (なくてもいい) with 'must not do' (てはいけません), very different meanings.", id: "Ini kebalikan negatif dari てもいいです — bandingkan 'tidak perlu melakukan' (なくてもいい) dengan 'tidak boleh melakukan' (てはいけません), maknanya sangat berbeda." },
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
    { en: "ないで connects two actions where the second happens INSTEAD of or WITHOUT the first — don't confuse it with なくて, a plain negative 'and not'.", id: "ないで menyambung dua aksi di mana aksi kedua terjadi SEBAGAI GANTI atau TANPA aksi pertama — jangan tertukar dengan なくて yang berarti 'dan tidak'." },
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
    { en: "This is built from the negative ない + ほうがいい ('that option is better') — for the positive 'you should do', use the た form instead.", id: "Pola ini dibentuk dari ない + ほうがいい ('pilihan itu lebih baik') — untuk versi positif 'sebaiknya melakukan', pakai bentuk た (lihat たほうがいいです)." },
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
    { en: "つもり expresses a personal intention/plan, not a prediction — it's normally only used for the speaker, or asked as a question to the listener.", id: "つもり menyatakan niat/rencana pribadi, bukan prediksi — biasanya hanya dipakai untuk diri sendiri, atau ditanyakan ke lawan bicara." },
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
    { en: "The dictionary form is the base form found in a Japanese dictionary — it's also the casual/plain way to say 'will do' or a habitual fact.", id: "Bentuk kamus adalah bentuk dasar yang dicari di kamus bahasa Jepang — juga cara santai/polos untuk mengatakan 'akan melakukan' atau fakta kebiasaan." },
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
    { en: "ことができる is the more formal way to say 'can do' — in casual speech, the potential form (e.g. 読める instead of 読むことができる) is used more often.", id: "ことができる adalah cara lebih formal untuk mengatakan 'bisa melakukan' — di percakapan santai, bentuk potensial (mis. 読める, bukan 読むことができる) lebih sering dipakai." },
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
    { en: "こと turns a whole verb phrase into a noun so it can be the subject or object of another verb, like 好き, or だ/です.", id: "こと mengubah seluruh frasa kata kerja menjadi kata benda supaya bisa menjadi subjek/objek kata kerja lain, seperti 好き, atau だ/です." },
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
    { en: "The verb before 前に always stays in the dictionary form, even if the main clause is in the past — 前に itself just means 'before'.", id: "Kata kerja sebelum 前に selalu tetap dalam bentuk kamus, meski klausa utamanya lampau — 前に sendiri berarti 'sebelum', tidak terpengaruh waktu kalimat." },
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
    { en: "つもりです states a personal plan/intention — for a more tentative 'I think I will', combine the volitional form with と思っている instead.", id: "つもりです menyatakan rencana/niat pribadi — untuk kesan lebih ragu 'sepertinya akan', gabungkan bentuk volisional dengan と思っている." },
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
    { en: "と思います always follows the plain form of the verb/adjective, never the polite ます-form, even though 思います itself is polite.", id: "と思います selalu mengikuti bentuk polos kata kerja/kata sifat, bukan bentuk sopan ます, meskipun 思います sendiri adalah bentuk sopan." },
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
    { en: "なら reacts to something already mentioned or assumed — it's closer to 'if that's the case, then...' than a hypothetical from scratch.", id: "なら bereaksi terhadap sesuatu yang sudah disebutkan atau diasumsikan — lebih mendekati 'kalau begitu ceritanya...' daripada andaian dari awal." },
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
    { en: "た is the plain/casual past — used with friends and family, or as the base for other patterns like たことがある and たり.", id: "た adalah bentuk lampau polos/santai — dipakai ke teman dan keluarga, atau sebagai dasar pola lain seperti たことがある dan たり." },
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
    { en: "ことがある describes a past experience, not a routine — for something done regularly, just use the plain verb with a frequency word.", id: "ことがある menceritakan pengalaman masa lalu, bukan kebiasaan rutin — untuk sesuatu yang dilakukan secara rutin, pakai kata kerja polos dengan kata frekuensi." },
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
    { en: "た後で is interchangeable with てから in most cases, but 後で can also follow a noun+の (食事の後で) while てから cannot.", id: "た後で bisa saling gantikan dengan てから di sebagian besar kasus, tapi 後で juga bisa mengikuti kata benda+の (食事の後で), sedangkan てから tidak bisa." },
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
    { en: "たり lists example actions without implying strict order or a complete list — end the sentence with します/した, not たり alone.", id: "たり menyebutkan contoh-contoh aksi tanpa menyiratkan urutan ketat atau daftar lengkap — kalimatnya harus ditutup dengan します/した, bukan たり saja." },
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
    { en: "たほうがいい is advice using the past form even when talking about the future — it sounds like a suggestion, softer than a command.", id: "たほうがいい adalah saran yang memakai bentuk lampau meski membicarakan masa depan — terdengar seperti anjuran, lebih halus daripada perintah." },
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
    { en: "たら is the most flexible conditional in Japanese — it works for hypotheticals, one-time events, and sequential 'when X, then Y', unlike と or ば.", id: "たら adalah bentuk kondisional paling fleksibel dalam bahasa Jepang — cocok untuk andaian, kejadian sekali, dan urutan 'kalau X terjadi, lalu Y', berbeda dari と atau ば." },
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
    { en: "まま highlights that something was left unchanged while another action happened — often used to point out something forgotten or left on purpose.", id: "まま menekankan bahwa sesuatu dibiarkan tidak berubah selagi aksi lain terjadi — sering dipakai untuk menunjukkan sesuatu yang terlupa atau sengaja dibiarkan." },
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
    { en: "i-adjectives always end in い in their dictionary form and conjugate on their own — 大きい alone is already a complete casual sentence, no です needed.", id: "Adjektiva-i selalu berakhiran い dalam bentuk kamus dan berkonjugasi sendiri — 大きい saja sudah jadi kalimat santai yang lengkap, tidak butuh です." },
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
    { en: "Drop the final い and add くない — the exception is いい (good), whose negative is irregular: よくない, not いくない.", id: "Hilangkan huruf い terakhir lalu tambah くない — pengecualiannya adalah いい (bagus), yang negatifnya tidak beraturan: よくない, bukan いくない." },
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
    { en: "Drop い and add かった — いい is irregular in the past too: よかった, not いかった.", id: "Hilangkan い lalu tambah かった — sekali lagi, いい tidak beraturan juga di bentuk lampau: よかった, bukan いかった." },
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
    { en: "This combines the negative くない with the past ending かった — literally くなかった, then です is added for politeness.", id: "Ini gabungan negatif くない dengan akhiran lampau かった — secara harfiah くなかった, lalu です ditambahkan untuk kesopanan." },
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
    { en: "くて links two i-adjectives (or an adjective and a reason/result) — don't use plain て with an i-adjective, that's only for verbs.", id: "くて menyambung dua adjektiva-i (atau adjektiva dengan alasan/hasil) — jangan pakai て polos untuk adjektiva-i, itu hanya untuk kata kerja." },
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
    { en: "Drop い and add く to turn an i-adjective into an adverb describing a verb, e.g. 早い (fast) → 早く (quickly/early).", id: "Hilangkan い lalu tambah く untuk mengubah adjektiva-i menjadi kata keterangan yang menjelaskan kata kerja, mis. 早い (cepat) → 早く (dengan cepat/pagi-pagi)." },
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
    { en: "Unlike i-adjectives, na-adjectives need です/だ to complete a sentence — the word itself (like 静か) isn't a full predicate on its own.", id: "Berbeda dari adjektiva-i, adjektiva-na butuh です/だ untuk melengkapi kalimat — katanya sendiri (seperti 静か) bukan predikat lengkap." },
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
    { en: "Just like the noun-negative pattern, casual speech shortens this to じゃありません or じゃない.", id: "Sama seperti pola negasi kata benda, dalam percakapan santai dipendekkan jadi じゃありません atau じゃない." },
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
    { en: "Only です changes to でした for the past — the na-adjective itself never conjugates.", id: "Hanya です yang berubah jadi でした untuk lampau — adjektiva-na-nya sendiri tidak pernah berkonjugasi." },
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
    { en: "As with nouns, casual speech often shortens this to じゃなかったです.", id: "Seperti pada kata benda, dalam percakapan santai sering dipendekkan jadi じゃなかったです." },
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
    { en: "Na-adjectives use で (not くて) to connect to the next part of the sentence — this で is different from the particle で that marks means/place.", id: "Adjektiva-na memakai で (bukan くて) untuk menyambung ke bagian kalimat berikutnya — で ini berbeda dari partikel で yang menandai alat/tempat." },
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
    { en: "Add に (not く) to turn a na-adjective into an adverb — this に is also different from the location/time particle に.", id: "Tambahkan に (bukan く) untuk mengubah adjektiva-na menjadi kata keterangan — に ini juga berbeda dari partikel に untuk waktu/tempat." },
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
    { en: "たい attaches to the verb stem and conjugates like an i-adjective (たくない, たかった) — normally only for the speaker's own desires, or as a question.", id: "たい disambung ke stem kata kerja dan berkonjugasi seperti adjektiva-i (たくない, たかった) — biasanya hanya dipakai untuk keinginan diri sendiri, atau sebagai pertanyaan." },
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
    { en: "This is the negative of たい, conjugated exactly like an i-adjective negative (くない).", id: "Ini bentuk negatif dari たい, berkonjugasi persis seperti negatif adjektiva-i (くない)." },
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
    { en: "ほしい is for wanting a THING (a noun), not an action — for wanting to DO something, use たい instead (see the previous patterns).", id: "ほしい dipakai untuk menginginkan BENDA (kata benda), bukan aksi — untuk ingin MELAKUKAN sesuatu, pakai たい (lihat pola sebelumnya)." },
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
    { en: "ましょう invites the listener to do something together — it can sound pushy toward someone of higher status, where a question form is safer.", id: "ましょう mengajak lawan bicara melakukan sesuatu bersama — bisa terkesan memaksa kalau dipakai ke orang yang lebih dihormati, lebih aman pakai bentuk pertanyaan." },
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
    { en: "Adding か to ましょう softens the invitation into a suggestion, asking for the listener's opinion instead of assuming they'll agree.", id: "Menambahkan か ke ましょう melunakkan ajakan menjadi saran, meminta pendapat lawan bicara alih-alih menganggap mereka pasti setuju." },
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
    { en: "ませんか literally asks a negative question ('won't you...?') but functions as a polite invitation, leaving more room to decline than ましょう.", id: "ませんか secara harfiah bertanya negatif ('tidakkah kamu...?') tapi berfungsi sebagai ajakan sopan — memberi ruang lebih untuk menolak dibanding ましょう." },
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
    { en: "なさい is a command typically used by parents to children or teachers to students — too direct for someone of higher status or a stranger.", id: "なさい adalah perintah yang biasa dipakai orang tua ke anak atau guru ke murid — terlalu langsung untuk dipakai ke orang yang lebih dihormati atau orang asing." },
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
    { en: "This から states a reason based on the speaker's own judgment — it can even stand alone at the end of a sentence as the full reason ('...から。').", id: "から di sini menyatakan alasan berdasarkan penilaian pribadi pembicara — bahkan bisa berdiri sendiri di akhir kalimat sebagai alasan lengkap ('...から。')." },
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
    { en: "ので sounds softer and more objective than から, so it's often preferred when giving an excuse to someone you should be polite to.", id: "ので terdengar lebih halus dan objektif dibanding から, jadi sering dipilih saat memberi alasan/permintaan izin ke orang yang harus dihormati." },
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
    { en: "The word order can flip (犬より猫のほうが好きです) with のほう added for extra clarity — but the basic は〜より〜 order shown here works too.", id: "Urutan katanya bisa dibalik (犬より猫のほうが好きです) dengan tambahan のほう untuk kejelasan ekstra — tapi urutan dasar は〜より〜 di sini juga berlaku." },
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
    { en: "どちら is the more formal choice for comparing two options — casual speech often uses どっち instead.", id: "どちら adalah pilihan lebih formal untuk membandingkan dua opsi — percakapan santai sering memakai どっち sebagai gantinya." },
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
    { en: "一番 means 'number one/the most' — の中で sets the group being compared, and can be swapped for で alone with some category words (季節の中で → 季節で).", id: "一番 berarti 'nomor satu/paling' — の中で menetapkan kelompok yang dibandingkan, dan bisa diganti で saja untuk kata kategori tertentu (季節の中で → 季節で)." },
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
    { en: "でしょう softens a statement into a guess — its plain/casual equivalent is だろう, and with rising intonation it becomes a question seeking confirmation.", id: "でしょう melunakkan pernyataan menjadi dugaan — padanan polos/santainya adalah だろう, dan dengan intonasi naik bisa jadi pertanyaan meminta konfirmasi." },
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
    { en: "ほど must be paired with a negative verb/adjective at the end — ほど alone without ない doesn't give this 'not as much as' meaning.", id: "ほど harus dipasangkan dengan kata kerja/sifat negatif di akhir kalimat — ほど saja tanpa ない tidak memberi makna 'tidak sebegitu' ini." },
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
    { en: "これ/それ/あれ/どれ stand alone as pronouns (they ARE the thing) — they can't be followed directly by a noun (use この/その/あの/どの for that).", id: "これ/それ/あれ/どれ berdiri sendiri sebagai kata ganti (mereka SENDIRI adalah bendanya) — tidak bisa langsung diikuti kata benda (pakai この/その/あの/どの untuk itu)." },
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
    { en: "この/その/あの/どの must always be followed by a noun — they can never stand alone the way これ/それ/あれ/どれ do.", id: "この/その/あの/どの selalu harus diikuti kata benda — tidak pernah bisa berdiri sendiri seperti これ/それ/あれ/どれ." },
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
    { en: "こ/そ/あ/ど follow the same distance logic as これ/それ/あれ/どれ — こ = near the speaker, そ = near the listener, あ = far from both.", id: "こ/そ/あ/ど mengikuti logika jarak yang sama seperti これ/それ/あれ/どれ — こ = dekat pembicara, そ = dekat lawan bicara, あ = jauh dari keduanya." },
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
    { en: "These are the more polite/formal versions of こっち/そっち/あっち/どっち — also often used politely to mean 'this/that person' instead of pointing directly.", id: "Ini versi lebih sopan/formal dari こっち/そっち/あっち/どっち — juga sering dipakai secara sopan untuk berarti 'orang ini/itu' alih-alih menunjuk langsung." },
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
    { en: "どんな is commonly used to ask an open question about type/kind ('what kind of music?'), while こんな/そんな/あんな describe a kind already known.", id: "どんな umum dipakai untuk bertanya secara terbuka soal jenis ('musik seperti apa?'), sedangkan こんな/そんな/あんな menjelaskan jenis yang sudah diketahui pembicara." },
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
    { en: "か at the end of a sentence turns a plain statement into a question — the word order doesn't change, unlike English.", id: "か di akhir kalimat mengubah pernyataan polos menjadi pertanyaan — urutan katanya tidak berubah, tidak seperti dalam terjemahan bahasa Inggris." },
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
    { en: "ね invites the listener to agree or react — it makes a statement feel more like a shared observation than a flat fact.", id: "ね mengajak lawan bicara untuk setuju atau menanggapi — membuat pernyataan terasa seperti observasi bersama, bukan sekadar fakta datar." },
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
    { en: "よ tells the listener something they likely don't know yet — overusing it can sound pushy, so use it carefully with people you should be polite to.", id: "よ memberi tahu lawan bicara sesuatu yang mungkin belum mereka ketahui — kalau kebanyakan dipakai bisa terkesan memaksa, jadi hati-hati terutama ke orang yang dihormati." },
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
    { en: "や signals the list isn't complete — it's often paired with など ('etc.') at the end for extra clarity, e.g. 本やノートなど.", id: "や menandakan daftarnya tidak lengkap — sering dipasangkan dengan など ('dan lain-lain') di akhir untuk kejelasan ekstra, mis. 本やノートなど." },
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
    { en: "These connect two separate sentences, not clauses within one sentence — each starts its own new sentence after a full stop (。).", id: "Kata-kata ini menyambung dua kalimat terpisah, bukan klausa dalam satu kalimat — masing-masing memulai kalimat baru setelah tanda titik (。)." },
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
