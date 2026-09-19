export type ConquestPhase = {
  label: string;
  text: string;
};

export type ConquestScriptStory = {
  epilogue: string;
  phases: ConquestPhase[];
};

export type ConquestStoryID = {
  epilogue: string;
  phases: string[];
  phaseLabels: string[];
};

export const CONQUEST_STORY: Record<string, ConquestScriptStory> = {
  hiragana: {
    epilogue:
      "The magistrate stamps his official seal on your letter of recommendation. The First Trial of Knighthood is complete — you're officially recognized as ready to move on to the Second Trial in the port city, where Katakana awaits.",
    phases: [
      {
        label: "Chapter 1 — The Village Hall Gate",
        text: "⚔️ Since childhood you've only heard stories of the Imperial Knights from travelers passing through your village. Today, an envoy from the Knights' Hall has finally opened enrollment for new students. The first requirement: prove you can read and write all 46 basic Hiragana characters yourself in front of the village hall scribe — no cheat sheets, no multiple choice, purely from memory.",
      },
      {
        label: "Chapter 2 — The Spy's Cipher",
        text: '🎉 The village hall scribe nods, satisfied — your name is recorded as a candidate student! But before handing over the letter of recommendation, he produces a scroll of cipher text full of dotted and small-circled characters (dakuten & handakuten) seized from an enemy spy. "If you can read this cipher," he says, "you\'re worthy of becoming a knight\'s apprentice." Write out each sound yourself.',
      },
      {
        label: "Chapter 3 — The Magistrate's Decree",
        text: "✨ You've cracked the cipher. Before long, the local magistrate arrives bearing an official decree full of combined yōon characters — きゃ, しゅ, ちょ — to test you directly. This is the final trial before you may set off for the port city for the Second Trial of Knighthood.",
      },
    ],
  },
  katakana: {
    epilogue:
      'The Knight Captain sheathes his sword and lays it on both your shoulders. "Rise, Knight." That very night, before torchlight and the crash of harbor waves, you\'re officially made an Imperial Knight — two trials, Hiragana and Katakana, fully conquered.',
    phases: [
      {
        label: "Chapter 1 — The Harbor Gate",
        text: "⚔️ Armed with the magistrate's letter of recommendation, you arrive at a port city bustling with foreign ships and Katakana signboards. The gate officer, a knight-in-training, challenges you to read all 46 basic katakana characters one by one — no options, just write your own answers.",
      },
      {
        label: "Chapter 2 — The Foreign Ship's Cargo Manifest",
        text: '🎉 The gate opens! But at the dock, a foreign merchant hands you a cargo manifest full of dakuten & handakuten dotted item names mixed with foreign accents. "If you want to be a knight," he says, "you must be able to read this without a single misspelling." Write out each answer yourself.',
      },
      {
        label: "Chapter 3 — The Knight Captain's Decree",
        text: "✨ You've successfully read the entire cargo manifest. At the harbor watchtower, the Knight Captain himself steps in to test you with foreign combined yōon characters — kya, shu, cho — as the final trial. If you pass, the title of Knight will be officially bestowed this very night.",
      },
    ],
  },
};

export const CONQUEST_STORY_ID: Record<string, ConquestStoryID> = {
  hiragana: {
    epilogue:
      "Bupati membubuhkan cap resminya pada surat rekomendasimu. Ujian Ksatria Tahap Pertama tuntas — kau resmi diakui layak melangkah ke Ujian Tahap Kedua di kota pelabuhan, tempat Katakana menanti.",
    phases: [
      "⚔️ Sejak kecil kau hanya mendengar cerita tentang Ksatria Kekaisaran dari para musafir yang singgah di desamu. Hari ini, utusan Balai Ksatria akhirnya membuka pendaftaran murid baru. Syarat pertama: buktikan kau bisa membaca dan menulis sendiri 46 aksara dasar Hiragana di hadapan penulis balai desa — tanpa contekan, tanpa pilihan ganda, murni dari ingatanmu.",
      '🎉 Penulis balai desa mengangguk puas — namamu dicatat sebagai calon murid! Tapi sebelum surat rekomendasi diserahkan, ia menyodorkan gulungan sandi berisi huruf-huruf bertitik dan berlingkar kecil (dakuten & handakuten) yang disita dari mata-mata musuh. "Kalau kau bisa membaca sandi ini," katanya, "kau pantas menjadi murid ksatria." Tuliskan sendiri setiap bunyinya.',
      "✨ Sandi berhasil kau pecahkan. Tak lama, Bupati setempat datang membawa titah resmi penuh aksara gabungan yōon — きゃ, しゅ, ちょ — untuk mengujimu langsung. Ini ujian pemungkas sebelum kau boleh berangkat ke kota pelabuhan untuk Ujian Ksatria Tahap Kedua.",
    ],
    phaseLabels: [
      "Chapter 1 — Gerbang Balai Desa",
      "Chapter 2 — Sandi Sang Mata-Mata",
      "Chapter 3 — Titah Sang Bupati",
    ],
  },
  katakana: {
    epilogue:
      'Kapten Ksatria menyarungkan pedangnya dan meletakkannya di kedua bahumu. "Bangkitlah, Ksatria." Malam itu juga, di hadapan obor dan derap ombak pelabuhan, kau resmi diangkat menmenjadi Ksatria Kekaisaran — dua ujian, Hiragana dan Katakana, telah kau taklukkan sepenuhnya.',
    phases: [
      "⚔️ Berbekal surat rekomendasi dari Bupati, kau tiba di kota pelabuhan yang ramai oleh kapal asing dan papan nama beraksara Katakana. Petugas gerbang, seorang ksatria magang, menantangmu membaca 46 aksara dasar katakana satu per satu — tanpa pilihan, langsung tulis jawabanmu sendiri.",
      '🎉 Gerbang terbuka! Namun di dermaga, seorang saudagar asing menyerahkan daftar muatan kapal penuh nama barang bertitik dakuten & handakuten yang bercampur logat asing. "Kalau kau mau menjadi ksatria," katanya, "kau harus bisa baca ini tanpa salah eja." Tuliskan sendiri setiap jawabanmu.',
      "✨ Seluruh daftar muatan berhasil kau baca. Di menara pengawas pelabuhan, Kapten Ksatria sendiri turun tangan mengujimu dengan aksara gabungan yōon asing — kya, shu, cho — sebagai ujian pemungkas. Kalau kau lulus, gelar Ksatria akan resmi disematkan malam ini juga.",
    ],
    phaseLabels: [
      "Chapter 1 — Gerbang Pelabuhan",
      "Chapter 2 — Daftar Muatan Kapal Asing",
      "Chapter 3 — Titah Sang Kapten Ksatria",
    ],
  },
};

export function getLocalizedConquestStory(
  scriptKey: string,
): { epilogue: string; phases: { label: string; text: string }[] } | null {
  const story = CONQUEST_STORY[scriptKey];
  if (!story) return null;
  return story;
}
