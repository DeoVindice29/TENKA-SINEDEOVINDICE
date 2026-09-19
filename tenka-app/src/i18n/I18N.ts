export const LANG_KEY = "tebakAksara_lang_v1";

export type Lang = "en" | "id";

export type I18NEntry = {
  en: string;
  id: string;
};

export const I18N: Record<string, I18NEntry> = {
  "aria.openSettings": { en: "Open settings", id: "Buka pengaturan" },
  "aria.closeSettings": { en: "Close settings", id: "Tutup pengaturan" },
  "aria.changePhoto": { en: "Change profile photo", id: "Ganti foto profil" },
  "aria.setNickname": { en: "Set your nickname", id: "Atur nickname kamu" },
  "aria.chooseLanguage": { en: "Choose language", id: "Pilih bahasa" },
  "aria.chooseBorderStyle": {
    en: "Choose theme color",
    id: "Pilih warna tema",
  },
  "aria.chooseScript": { en: "Choose a script", id: "Pilih aksara" },
  "aria.chooseScriptStudy": {
    en: "Choose a script to study",
    id: "Pilih aksara untuk belajar",
  },
  "profile.addNickname": { en: "+ Add nickname", id: "+ Tambah nickname" },
  "appearance.language": { en: "Language", id: "Bahasa" },

  "start.chooseTierFirst": {
    en: "Choose a tier first",
    id: "Pilih tingkatan dulu",
  },
  "start.studyFirst": {
    en: "Study First",
    id: "Belajar Dulu",
  },
  "start.studyScriptFirst": {
    en: "Study {label} First",
    id: "Belajar {label} Dulu",
  },
  "start.startCount": {
    en: "Start — {title} ({count} Questions)",
    id: "Mulai — {title} ({count} Soal)",
  },
  "start.startRandomCount": {
    en: "Start — {title} ({count} Random Questions)",
    id: "Mulai — {title} ({count} Soal Acak)",
  },
  "quiz.typeLabel": { en: "Question Type", id: "Tipe Soal" },
  "quiz.meaning": { en: "Meaning", id: "Arti" },
  "quiz.mixed": { en: "Mixed", id: "Campuran" },
  "quiz.difficultyLabel": { en: "Difficulty", id: "Tingkat Kesulitan" },
  "quiz.choices4": { en: "4 choices", id: "4 pilihan" },
  "quiz.choices8": { en: "8 choices", id: "8 pilihan" },
  "quiz.typeItYourself": { en: "type it yourself", id: "ketik sendiri" },
  "quiz.hardHint": {
    en: "🔥 Hard is only available for Hiragana & Katakana.",
    id: "🔥 Hard cuma tersedia untuk Hiragana & Katakana.",
  },
  "quiz.timerLabel": { en: "Timer", id: "Timer" },
  "quiz.timerOff": { en: "No Timer", id: "Tanpa Waktu" },
  "quiz.streak": { en: "streak", id: "beruntun" },
  "quiz.next": { en: "Next", id: "Lanjut" },
  "quiz.seeResults": { en: "See Results", id: "Lihat Hasil" },
  "quiz.guessRomaji": { en: "Guess the romaji", id: "Tebak romaji" },
  "quiz.guessMeaning": { en: "Guess the meaning", id: "Tebak artinya" },
  "quiz.guessKanjiForm": { en: "Which kanji is it?", id: "Kanji yang mana?" },
  "quiz.guessFunction": { en: "Guess the function", id: "Tebak fungsinya" },
  "quiz.guessKalimat": { en: "Guess the Particle!", id: "Tebak Partikel!" },
  "quiz.function": { en: "Function", id: "Fungsi" },
  "quiz.kalimat": { en: "Particle", id: "Partikel" },
  "quiz.kanjiFormBtn": { en: "Kanji", id: "Kanji" },
  "quiz.answer": { en: "Answer", id: "Jawab" },
  "quiz.typeRomajiPlaceholder": {
    en: "Type the romaji here...",
    id: "Ketik romaji-nya di sini...",
  },
  "quiz.correct": { en: "Correct!", id: "Tepat!" },
  "quiz.missedAnswerWas": {
    en: 'Missed — the answer was "{answer}"',
    id: 'Meleset — jawabannya "{answer}"',
  },
  "quiz.failedAnswerWas": {
    en: 'Failed — the answer was "{answer}"',
    id: 'Gagal — jawabannya "{answer}"',
  },
  "quiz.fillAnswerFirst": {
    en: "Fill in your answer before continuing.",
    id: "Isi dulu jawabannya sebelum lanjut.",
  },
  "quiz.meaningLabel": { en: "Meaning: {value}", id: "Arti: {value}" },
  "quiz.romajiLabel": { en: "Romaji: {value}", id: "Romaji: {value}" },
  "quiz.functionLabel": { en: "Function: {value}", id: "Fungsi: {value}" },
  "quiz.kalimatLabel": { en: "Example: {value}", id: "Kalimat: {value}" },
  "quiz.hiraganaLabel": { en: "Hiragana: {value}", id: "Hiragana: {value}" },
  "quiz.kanjiLabel": { en: "Kanji: {value}", id: "Kanji: {value}" },
  "quiz.usageNote": { en: "Note: {value}", id: "Catatan: {value}" },
  "range.label": { en: "Question Range", id: "Rentang Soal" },
  "range.chooseRange": { en: "Choose Range", id: "Pilih Rentang" },
  "range.random": { en: "Random", id: "Acak" },
  "range.from": { en: "From", id: "Dari" },
  "range.to": { en: "To", id: "Sampai" },
  "range.all": { en: "All ({n})", id: "seluruh ({n})" },
  "range.oneSelected": {
    en: "1 question selected ({from})",
    id: "1 soal terpilih ({from})",
  },
  "range.manySelected": {
    en: "{count} questions selected ({from} → {to})",
    id: "{count} soal terpilih ({from} → {to})",
  },
  "range.randomHint": {
    en: "🎲 {count} random questions picked from {total} total in this tier",
    id: "🎲 {count} soal acak dipilih dari total {total} soal di tingkatan ini",
  },
  "range.randomCountLabel": {
    en: "Number of questions (picked randomly from this whole tier)",
    id: "Jumlah soal (diambil acak dari seluruh tingkatan ini)",
  },
  "learn.eyebrow": { en: "study mode", id: "mode belajar" },
  "learn.title": { en: "Character Tables", id: "Tabel Aksara" },
  "learn.sub": {
    en: "Memorize the shape and reading of each character before starting a Trial. Choose a script below.",
    id: "Hafalkan dulu bentuk dan cara baca tiap karakter sebelum mulai Trial. Pilih aksaranya di bawah.",
  },
  "learn.readyStart": {
    en: "Ready — Start Trial",
    id: "Sudah Siap — Mulai Trial",
  },
  "learn.characters": { en: "characters", id: "karakter" },
  "learn.words": { en: "words", id: "kata" },
  "learn.patterns": { en: "patterns", id: "pola" },
  "learn.searchPlaceholder": {
    en: "Search word, reading, or meaning…",
    id: "Cari kata, cara baca, atau arti…",
  },
  "learn.searchResultsCount": {
    en: "{count} result(s) found",
    id: "{count} hasil ditemukan",
  },
  "learn.noResults": {
    en: 'No matches for "{query}". Try a different word.',
    id: 'Tidak ada yang cocok dengan "{query}". Coba kata lain.',
  },
  "learn.usageNote": { en: "Notes", id: "Catatan" },
  "learn.listenPronunciation": {
    en: "Listen to {text}, read {reading}",
    id: "Dengar ucapan {text}, dibaca {reading}",
  },
  "learn.listenExample": {
    en: "Listen to the example sentence",
    id: "Dengar kalimat contoh",
  },
  "learn.listenSegment": {
    en: "Listen to {seg}, read {rom}",
    id: "Dengar {seg}, dibaca {rom}",
  },
  "common.back": { en: "Back", id: "Kembali" },
  "common.cancel": { en: "Cancel", id: "Batal" },
  "common.backArmed": {
    en: "Sure? Click again to cancel",
    id: "Yakin? Klik lagi untuk batalkan",
  },
  "aria.openFlashcards": {
    en: "Open Flashcards",
    id: "Buka Flashcard",
  },
  "aria.learnSearch": {
    en: "Search this study set",
    id: "Cari di materi ini",
  },
  "aria.clearSearch": {
    en: "Clear search",
    id: "Bersihkan pencarian",
  },
  "aria.jumpToSection": {
    en: "Jump to {label}",
    id: "Lompat ke {label}",
  },
  "aria.backToTop": {
    en: "Back to top",
    id: "Kembali ke atas",
  },
  "theme.light": { en: "Light Mode", id: "Mode Terang" },
  "theme.dark": { en: "Dark Mode", id: "Mode Gelap" },
  "aria.switchToLight": {
    en: "Switch to light mode",
    id: "Ganti ke mode terang",
  },
  "aria.switchToDark": {
    en: "Switch to dark mode",
    id: "Ganti ke mode gelap",
  },
  "borderStyle.bw": { en: "Default", id: "Default" },
  "borderStyle.rainbow": { en: "Rainbow", id: "Pelangi" },
  "borderStyle.pink": { en: "Pink", id: "Pink" },
  "borderStyle.purple": { en: "Purple", id: "Ungu" },
  "borderStyle.cyan": { en: "Cyan", id: "Cyan" },
  "borderStyle.blue": { en: "Blue", id: "Biru" },
  "borderStyle.green": { en: "Green", id: "Hijau" },
  "borderStyle.yellow": { en: "Yellow", id: "Kuning" },
  "borderStyle.orange": { en: "Orange", id: "Oranye" },
  "borderStyle.rose": { en: "Red", id: "Merah" },
  "borderStyle.teal": { en: "Teal", id: "Toska" },
  "footer.copyright": {
    en: "© 2026 | Sine Deo Vindice",
    id: "© 2026 | Sine Deo Vindice",
  },

  "results.correct": { en: "correct", id: "tepat" },
  "results.accuracy": { en: "Accuracy {acc}%", id: "Akurasi {acc}%" },
  "results.retrySet": { en: "Retry This Set", id: "Ulangi Set Ini" },

  "quiz.timeUpAnswerWas": {
    en: "⏰ Time's up! The answer was {answer}",
    id: "⏰ Waktu habis! Jawabannya {answer}",
  },

  "learn.kotobaWords": { en: "words", id: "kata" },
  "learn.bunpoPatterns": { en: "patterns", id: "pola" },

  "matchMode.cardTitle": { en: "Match Mode", id: "Mode Match" },
  "matchMode.cardDesc": {
    en: "Match 4 characters with their romaji, round by round.",
    id: "Cocokkan 4 huruf dengan romaji-nya, ronde demi ronde.",
  },
  "matchMode.instruction": {
    en: "Tap a character, then its matching romaji",
    id: "Ketuk sebuah huruf, lalu romaji yang cocok",
  },
  "matchMode.roundProgress": {
    en: "Round {current}/{total}",
    id: "Ronde {current}/{total}",
  },
  "matchMode.restart": { en: "Restart", id: "Ulangi" },
  "matchMode.playAgain": { en: "Play Again", id: "Main Lagi" },
  "matchMode.doneTitle": { en: "All matched!", id: "Semua cocok!" },
  "matchMode.doneSub": {
    en: "{pairs} pairs · {mistakes} mistakes · {time}",
    id: "{pairs} pasangan · {mistakes} kali salah · {time}",
  },

  "flash.eyebrow": { en: "flashcard mode", id: "mode flashcard" },
  "flash.title": { en: "Flashcards", id: "Flashcard" },
  "flash.sub": {
    en: "Anki-style flip cards with built-in spaced repetition. Pick a deck below, or import your own .apkg file.",
    id: "Kartu balik ala Anki dengan pengulangan berjarak bawaan. Pilih deck di bawah, atau impor file .apkg milikmu sendiri.",
  },
  "flash.builtinHeading": { en: "Built-in Decks", id: "Deck Bawaan" },
  "flash.myDecksHeading": { en: "My Imported Decks", id: "Deck Impor Saya" },
  "flash.noCustomDecks": {
    en: "No decks imported yet.",
    id: "Belum ada deck yang diimpor.",
  },
  "flash.importBtn": { en: "Import .apkg Deck", id: "Impor Deck .apkg" },
  "flash.importHint": {
    en: "Your .apkg file is read entirely in your browser — nothing is uploaded anywhere.",
    id: "File .apkg kamu dibaca sepenuhnya di browser — tidak ada yang diunggah ke mana pun.",
  },
  "flash.dueNow": { en: "due now", id: "jatuh tempo" },
  "flash.cards": { en: "cards", id: "kartu" },
  "flash.deleteDeck": { en: "Delete deck", id: "Hapus deck" },
  "flash.confirmDelete": {
    en: 'Delete the deck "{name}"? This can\'t be undone.',
    id: 'Hapus deck "{name}"? Ini tidak bisa dibatalkan.',
  },
  "flash.progress": {
    en: "Card {current}/{total} · {label}",
    id: "Kartu {current}/{total} · {label}",
  },
  "flash.again": { en: "Again", id: "Lagi" },
  "flash.hard": { en: "Hard", id: "Sulit" },
  "flash.good": { en: "Good", id: "Bagus" },
  "flash.easy": { en: "Easy", id: "Mudah" },
  "flash.showAnswer": { en: "Show Answer", id: "Tampilkan Jawaban" },
  "flash.restart": { en: "Restart Deck", id: "Ulangi Deck" },
  "flash.doneTitle": {
    en: "Deck complete for now!",
    id: "Deck selesai untuk sekarang!",
  },
  "flash.doneSub": {
    en: "You reviewed {count} card(s) from {label}.",
    id: "Kamu sudah mengulang {count} kartu dari {label}.",
  },
  "flash.reviewAgain": {
    en: "Review This Deck Again",
    id: "Ulangi Deck Ini Lagi",
  },
  "flash.chooseAnother": { en: "Choose Another Deck", id: "Pilih Deck Lain" },

  "conquest.modeTitle": { en: "Conquer Mode", id: "Mode penaklukkan" },
  "conquest.conquered": { en: "Conquered", id: "Ditaklukkan" },
  "conquest.cancelConquest": {
    en: "Cancel Conquest",
    id: "Batalkan penaklukkan",
  },
  "conquest.startThisChapter": {
    en: "Start This Chapter",
    id: "Mulai Chapter Ini",
  },
  "conquest.cardTitleWithLabel": {
    en: "Conquer {label}",
    id: "Taklukkan {label}",
  },
  "conquest.desc": {
    en: "Conquer all of {label} at once — {count} questions, one mistake and it's over.",
    id: "Taklukkan seluruh {label} sekaligus — {count} soal, satu kali salah langsung gagal.",
  },
  "conquest.lockNote": {
    en: "🔒 Conquer {lockLabel} first before you can conquer {label}.",
    id: "🔒 Taklukkan {lockLabel} dulu sebelum bisa menaklukkan {label}.",
  },
  "conquest.modalTitleWithLabel": {
    en: "⚔️ Conquer {label}",
    id: "⚔️ Taklukkan {label}",
  },
  "conquestModal.confirm": { en: "Start Conquering", id: "Mulai Menaklukkan" },
  "conquestModal.threePhaseIntro": {
    en: "This isn't an ordinary trial — this is the Knight's Trial. Conquering {label} is split into 3 story Chapters (basic → dotted → combined), {count} questions in total.",
    id: "Ini bukan trial biasa — ini Ujian Ksatria. Penaklukkan {label} terbagi menjadi 3 Chapter cerita (dasar → bertitik → gabungan), total {count} soal.",
  },
  "conquestModal.singleIntro": {
    en: "You'll face all {count} {label} questions at once, shuffled.",
    id: "Kamu akan menghadapi seluruh {count} soal {label} sekaligus, diacak.",
  },
  "conquestModal.rule.typeOnly": {
    en: "In <b>every Chapter</b>, you must <b>type your own</b> answer — there's no multiple choice at all.",
    id: "Di <b>seluruh Chapter</b>, kamu harus <b>mengetik sendiri</b> jawabannya — tidak ada pilihan ganda sama sekali.",
  },
  "conquestModal.rule.oneWrongFails": {
    en: "Get <b>even one</b> answer wrong and the conquest instantly <b>FAILS</b>.",
    id: "Salah <b>satu saja</b> jawaban, penaklukkan langsung <b>GAGAL</b>.",
  },
  "conquestModal.rule.failRestartChapter": {
    en: "If you fail, you'll have to start over from Chapter 1.",
    id: "Kalau gagal, kamu harus mengulang lagi dari Chapter 1.",
  },
  "conquestModal.rule.failRestartFirst": {
    en: "If you fail, you'll have to start over from the first question.",
    id: "Kalau gagal, kamu harus mengulang lagi dari soal pertama.",
  },
  "conquestModal.rule.allAtOnce": {
    en: "All questions for this script will be shuffled and shown all at once, <b>without breaks</b>.",
    id: "Seluruh soal aksara ini akan diacak dan ditampilkan sekaligus, <b>tanpa dipotong</b>.",
  },
  "conquestModal.rule.becomeKnightBoth": {
    en: "Conquer both Hiragana &amp; Katakana to officially be <b>knighted (騎士)</b>.",
    id: "Taklukkan Hiragana &amp; Katakana keduanya untuk resmi <b>diangkat menjadi Knight (騎士)</b>.",
  },
  "conquestModal.rule.becomeKnightSolo": {
    en: "Conquer this fully and you'll officially be <b>knighted (騎士)</b> — both the Hiragana &amp; Katakana trials complete!",
    id: "Taklukkan ini sampai tuntas dan kamu akan resmi <b>diangkat menjadi Knight (騎士)</b> — ujian Hiragana &amp; Katakana lunas keduanya!",
  },
  "conquestStory.eyebrowStart": {
    en: "⚔️ The Knight's Trial begins",
    id: "⚔️ Ujian Ksatria dimulai",
  },
  "conquestStory.eyebrowFinal": {
    en: "⚔️ Final chapter",
    id: "⚔️ Chapter terakhir",
  },
  "conquestStory.eyebrowNext": {
    en: "⚔️ Next chapter",
    id: "⚔️ Chapter berikutnya",
  },
  "conquestStory.titleWithScript": {
    en: "{label} — {script}",
    id: "{label} — {script}",
  },
  "conquestStory.startThisChapter": {
    en: "Start This Chapter",
    id: "Mulai Chapter Ini",
  },
  "speedrun.cardTitleWithLabel": {
    en: "Speedrun {label}",
    id: "Speedrun {label}",
  },
  "speedrun.modalTitleWithLabel": {
    en: "⚡ Speedrun {label}",
    id: "⚡ Speedrun {label}",
  },
  "speedrun.descNoRecord": {
    en: "Race through all {count} {label} questions as fast as you can — no record yet.",
    id: "Balapan menjawab seluruh {count} soal {label} secepat mungkin — belum ada record.",
  },
  "speedrun.descWithRecord": {
    en: "Race through all {count} {label} questions as fast as you can — your best: <b>{time}</b>.",
    id: "Balapan menjawab seluruh {count} soal {label} secepat mungkin — rekormu: <b>{time}</b>.",
  },
  "speedrun.confirm": { en: "Ready?", id: "Siap?" },
  "speedrun.intro": {
    en: "You'll face all {count} {label} questions at once, shuffled — type the answer yourself, timed from the moment the countdown ends.",
    id: "Kamu akan menghadapi seluruh {count} soal {label} sekaligus, diacak — ketik sendiri jawabannya, waktu berjalan begitu hitung mundur selesai.",
  },
  "speedrun.rule.timed": {
    en: "A timer runs the whole way through — answer as fast as you can!",
    id: "Timer berjalan dari awal sampai akhir — jawab secepat mungkin!",
  },
  "speedrun.rule.mistakesCost": {
    en: "Get more than 3 wrong and the run instantly fails.",
    id: "Salah lebih dari 3 kali, run langsung gagal.",
  },
  "speedrun.rule.autoNext": {
    en: "Correct answer auto-advances to the next question — no need to press Enter.",
    id: "Jawaban benar otomatis lanjut ke soal berikutnya — nggak perlu pencet Enter.",
  },
  "speedrun.rule.recordSaved": {
    en: "Only your fastest completed run is saved as your personal record.",
    id: "Hanya waktu tercepatmu yang berhasil diselesaikan yang disimpan sebagai record pribadimu.",
  },

  "results.failureReason": {
    en: "Reasons for failure",
    id: "Penyebab kegagalan",
  },
  "results.needsPractice": { en: "Needs practice", id: "Perlu diulang" },
  "results.tryAgainFromStart": {
    en: "⚔️ Try Again From Start",
    id: "⚔️ Coba Lagi dari Awal",
  },
  "results.conquerAgain": { en: "⚔️ Conquer Again", id: "⚔️ Taklukkan Lagi" },
  "results.speedrunAgain": { en: "⚡ Speedrun Again", id: "⚡ Speedrun Lagi" },
  "quiz.chapterLabel": {
    en: "⚔️ {phaseLabel} · Question {current}/{total}",
    id: "⚔️ {phaseLabel} · Soal {current}/{total}",
  },
  "quiz.conquerLabel": {
    en: "⚔️ Conquer — {label} · Question {current}/{total}",
    id: "⚔️ Penaklukkan — {label} · Soal {current}/{total}",
  },
  "quiz.speedrunLabel": {
    en: "⚡ Speedrun — {label} · Question {current}/{total}",
    id: "⚡ Speedrun — {label} · Soal {current}/{total}",
  },

  "profile.nextRank": {
    en: "{req} and rise to {emoji} {title}",
    id: "{req} untuk naik menjadi {emoji} {title}",
  },
  "profile.highestN5": {
    en: "Highest N5 rank reached — {emoji} {title} unlocks once N4 material arrives.",
    id: "Tingkatan N5 tertinggi tercapai — {emoji} {title} akan terbuka begitu materi N4 hadir.",
  },
  "profile.highestReached": {
    en: "Highest rank reached — take the throne, Emperor! 👑",
    id: "Tingkatan tertinggi tercapai — bertahtalah, Emperor! 👑",
  },
  
  "borderStyle.heading": { en: "Theme Color", id: "Warna Tema" },

    "flash.importing": { en: "Reading your .apkg file…", id: "Membaca file .apkg kamu…" },
  "flash.importSuccess": {
    en: '✅ Imported "{name}" — {count} card(s) added.',
    id: '✅ "{name}" diimpor — {count} kartu ditambahkan.',
  },
  "flash.importFailed": {
    en: "❌ Import failed: {msg}",
    id: "❌ Impor gagal: {msg}",
  },
  "flash.storageFull": {
    en: "not enough space in this browser's storage",
    id: "ruang penyimpanan browser ini tidak cukup",
  },
};
