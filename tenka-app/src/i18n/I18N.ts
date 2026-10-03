export const LANG_KEY = "tebakAksara_lang_v1";

/**
 * Bahasa default saat user belum pernah memilih: ikuti bahasa browser/perangkat.
 * Bahasa Indonesia -> "id", sisanya -> "en". Pilihan manual user (localStorage)
 * selalu menang atas deteksi ini.
 */
export function detectDefaultLang(): "id" | "en" {
  try {
    const prefs =
      typeof navigator !== "undefined"
        ? navigator.languages?.length
          ? navigator.languages
          : [navigator.language]
        : [];
    for (const raw of prefs) {
      const code = (raw || "").toLowerCase();
      if (code.startsWith("id") || code.startsWith("in")) return "id";
      if (code.startsWith("en")) return "en";
    }
  } catch {
    /* abaikan, pakai fallback */
  }
  return "en";
}

export type Lang = "en" | "id";

export type I18NEntry = {
  en: string;
  id: string;
};

export const I18N: Record<string, I18NEntry> = {
  "nav.home": { en: "Home", id: "Home" },
  "nav.learn": { en: "Lessons", id: "Lessons" },
  "nav.flashcard": { en: "Flashcard", id: "Flashcard" },
  "nav.practice": { en: "Practice", id: "Latihan Soal" },
  "nav.statistik": { en: "Statistics", id: "Statistik" },
  "nav.settings": { en: "Settings", id: "Pengaturan" },
  "nav.tagline": { en: "Learn Japanese", id: "天の学び" },
  "statistik.title": { en: "Statistics", id: "Statistik" },
  "statistik.comingSoonTitle": {
    en: "Coming soon",
    id: "Segera hadir",
  },
  "statistik.comingSoonDesc": {
    en: "Your progress stats — streaks, accuracy, and time studied — will show up here once this feature is ready.",
    id: "Statistik progres kamu — streak, akurasi, dan waktu belajar — akan muncul di sini setelah fitur ini siap.",
  },
  "aria.openSettings": { en: "Open settings", id: "Buka pengaturan" },
  "aria.closeSettings": { en: "Close settings", id: "Tutup pengaturan" },
  "aria.changePhoto": { en: "Change profile image", id: "Ganti gambar profil" },
  "aria.viewPhoto": { en: "View profile photo", id: "Lihat foto profil" },
  "aria.closeZoom": { en: "Close photo", id: "Tutup foto" },
  "aria.setNickname": { en: "Set your nickname", id: "Atur nickname kamu" },
  "aria.chooseLanguage": { en: "Choose language", id: "Pilih bahasa" },
  "aria.chooseBorderStyle": {
    en: "Choose theme color",
    id: "Pilih warna tema",
  },
  "aria.pickCustomAccent": {
    en: "Pick a custom accent color",
    id: "Pilih warna aksen sendiri",
  },
  "aria.pickCustomText": {
    en: "Pick a custom text color (outside colored backgrounds)",
    id: "Pilih warna teks sendiri (di luar latar berwarna)",
  },
  "aria.pickCustomOnAccent": {
    en: "Pick a custom text color (on colored backgrounds)",
    id: "Pilih warna teks sendiri (di atas latar berwarna)",
  },
  "aria.pickCustomIcon": {
    en: "Pick a custom icon color",
    id: "Pilih warna ikon sendiri",
  },
  "aria.pickCustomBackground": {
    en: "Pick a custom background color",
    id: "Pilih warna latar sendiri",
  },
  "aria.pickCustomQuizCorrect": {
    en: "Pick a custom correct-answer color",
    id: "Pilih warna jawaban benar sendiri",
  },
  "aria.pickCustomQuizWrong": {
    en: "Pick a custom wrong-answer color",
    id: "Pilih warna jawaban salah sendiri",
  },
  "aria.pickCustomVermillion": {
    en: "Pick a custom vermillion accent color",
    id: "Pilih warna aksen vermillion sendiri",
  },
  "aria.pickCustomGold": {
    en: "Pick a custom gold accent color",
    id: "Pilih warna aksen emas sendiri",
  },
  "aria.pickCustomMoss": {
    en: "Pick a custom moss accent color",
    id: "Pilih warna aksen moss sendiri",
  },
  "aria.pickCustomChoiceBg": {
    en: "Pick a custom answer choice background color",
    id: "Pilih warna latar pilihan jawaban sendiri",
  },
  "aria.pickCustomChoiceSelected": {
    en: "Pick a custom color for the selected answer in Match mode",
    id: "Pilih warna jawaban terpilih di mode Match sendiri",
  },
  "aria.resetCustomTheme": {
    en: "Reset custom theme colors to the rainbow defaults",
    id: "Reset warna tema kustom ke warna rainbow default",
  },
  "aria.chooseScript": { en: "Choose a script", id: "Pilih aksara" },
  "aria.chooseScriptStudy": {
    en: "Choose a script to study",
    id: "Pilih aksara untuk belajar",
  },
  "profile.addNickname": { en: "+ Add nickname", id: "+ Tambah nickname" },
  "profile.joinedOn": { en: "Joined {date}", id: "Bergabung {date}" },
  "profile.viewProgress": { en: "View progress", id: "Lihat progres" },
  "profile.changePhoto": { en: "Change image", id: "Ganti gambar" },
  "auth.signOutConfirmTitle": {
    en: "Sign out?",
    id: "Yakin ingin keluar?",
  },
  "auth.signOutConfirmBody": {
    en: "You'll need to sign in again to keep tracking your progress.",
    id: "Kamu perlu masuk lagi untuk melanjutkan progres belajarmu.",
  },
  "auth.welcomeBadge": {
    en: "ようこそ • Welcome",
    id: "ようこそ • Selamat Datang",
  },
  "auth.tagline": {
    en: "Master Japanese, Hold the World",
    id: "Kuasai Bahasa Jepang, Genggam Dunia",
  },
  "auth.loginPrompt": {
    en: "Sign in to save your progress and profile.",
    id: "Masuk dulu buat nyimpen progress dan profile kamu.",
  },
  "auth.howSignupWorks": {
    en: "How does signup work?",
    id: "Gimana cara daftarnya?",
  },
  "auth.howSignupWorksTitle": {
    en: "How signing up works",
    id: "Cara kerja pendaftaran",
  },
  "auth.howSignupStep1": {
    en: "Fill in your email, and password, then tap Sign Up.",
    id: "Isi email, dan kata sandi, lalu ketuk Daftar.",
  },
  "auth.howSignupStep2": {
    en: "We'll send a confirmation link to that email — check your inbox (and spam folder).",
    id: "Kami kirim link konfirmasi ke email itu — cek inbox kamu (dan folder spam).",
  },
  "auth.howSignupStep3": {
    en: "Tap the link in the email to activate your account.",
    id: "Ketuk link di email itu buat mengaktifkan akun kamu.",
  },
  "auth.howSignupStep4": {
    en: "Come back here and log in — you'll then pick a username and image.",
    id: "Balik ke sini dan masuk — nanti kamu bisa pilih username dan gambar.",
  },
  "auth.howSignupGoogleNote": {
    en: "Signing in with Google skips all of this — you're in right away.",
    id: "Kalau masuk pakai Google, semua langkah ini dilewati — langsung masuk. Jadi mending sing up pake google aja dah",
  },
  "auth.gotIt": { en: "Got it", id: "Oke, mengerti" },
  "auth.dismiss": { en: "Dismiss", id: "Tutup" },
  "auth.loginWithGoogle": {
    en: "Login with Google",
    id: "Masuk dengan Google",
  },
  "auth.tabLogin": { en: "Log In", id: "Masuk" },
  "auth.tabSignup": { en: "Sign Up", id: "Daftar" },
  "auth.noAccountYet": {
    en: "Don't have an account?",
    id: "Belum punya akun?",
  },
  "auth.alreadyHaveAccount": {
    en: "Already have an account?",
    id: "Sudah punya akun?",
  },
  "auth.emailLabel": { en: "Email", id: "Email" },
  "auth.emailPlaceholder": { en: "you@email.com", id: "nama@email.com" },
  "auth.passwordLabel": { en: "Password", id: "Kata Sandi" },
  "auth.passwordPlaceholder": { en: "••••••••", id: "••••••••" },
  "auth.forgotPassword": { en: "Forgot password?", id: "Lupa kata sandi?" },
  "auth.rememberMe": {
    en: "Remember me on this device",
    id: "Ingat saya di perangkat ini",
  },
  "auth.loginButton": { en: "Log in to 天下", id: "Masuk ke 天下" },
  "auth.loginButtonLoading": { en: "Logging in…", id: "Sedang masuk…" },
  "auth.signupNameLabel": {
    en: "Full Name / Username",
    id: "Nama Lengkap / Username",
  },
  "auth.namePlaceholder": { en: "e.g. Mike Miller", id: "Contoh: Mike Miller" },
  "auth.signupEmailLabel": { en: "Activation Email", id: "Email Aktivasi" },
  "auth.signupEmailPlaceholder": {
    en: "Mike@domain.com",
    id: "Mike@domain.com",
  },
  "auth.minChars": { en: "Min. 8 characters", id: "Min. 8 Karakter" },
  "auth.strengthDefault": { en: "Strength", id: "Kekuatan" },
  "auth.strengthWeak": { en: "Weak", id: "Lemah" },
  "auth.strengthMedium": { en: "Medium", id: "Sedang" },
  "auth.strengthStrong": { en: "Strong", id: "Kuat" },
  "auth.signupButton": {
    en: "Create Account",
    id: "Buat Akun",
  },
  "auth.signupButtonLoading": { en: "Creating account…", id: "Membuat akun…" },
  "auth.orContinueWith": {
    en: "or continue with",
    id: "atau lanjutkan dengan",
  },
  "auth.backToOptions": { en: "Back to other options", id: "Kembali ke pilihan lain" },
  "auth.or": { en: "or", id: "atau" },
  "auth.loginWithEmail": { en: "Login with email", id: "Masuk dengan email" },
  "auth.signupWithEmail": { en: "Sign up with email", id: "Daftar dengan email" },
  "auth.continueAsGuest": {
    en: "Continue as Guest",
    id: "Lanjutkan sebagai Tamu",
  },
  "auth.legalPrefix": {
    en: "By continuing, you agree to",
    id: "Dengan melanjutkan, Anda menyetujui",
  },
  "auth.termsOfService": { en: "Terms of Service", id: "Syarat Ketentuan" },
  "auth.privacyPolicy": { en: "Privacy Policy", id: "Kebijakan Privasi" },
  "auth.legalSuffix": { en: "of 『天下』.", id: "『天下』." },
  "auth.showPassword": { en: "Show password", id: "Tampilkan kata sandi" },
  "auth.hidePassword": { en: "Hide password", id: "Sembunyikan kata sandi" },
  "auth.emailRequired": { en: "Email is required", id: "Email wajib diisi" },
  "auth.passwordRequired": {
    en: "Password is required",
    id: "Kata sandi wajib diisi",
  },
  "auth.nameRequired": { en: "Name is required", id: "Nama wajib diisi" },
  "auth.passwordMinLength": {
    en: "Password must be at least 8 characters",
    id: "Kata sandi minimal 8 karakter",
  },
  "auth.forgotEmailNeeded": {
    en: "Enter your email above first, then tap “Forgot password?”",
    id: "Isi email kamu di atas dulu, baru ketuk “Lupa kata sandi?”",
  },
  "auth.toastLoginTitle": {
    en: "Okaeri! (おかえり)",
    id: "Okaeri! (おかえり)",
  },
  "auth.toastLoginMessage": {
    en: "Welcome back to 天下, {name}!",
    id: "Selamat datang kembali di 天下, {name}!",
  },
  "auth.toastSignupTitle": {
    en: "Hajimemashite! (はじめまして)",
    id: "Hajimemashite! (はじめまして)",
  },
  "auth.toastSignupMessage": {
    en: "Account created — check {email} to confirm it.",
    id: "Akun dibuat — cek {email} buat konfirmasi.",
  },
  "auth.toastErrorTitle": { en: "Something went wrong", id: "Ada yang salah" },
  "auth.toastForgotTitle": { en: "Forgot Password", id: "Lupa Kata Sandi" },
  "auth.toastForgotMessage": {
    en: "A recovery link has been sent to your email.",
    id: "Tautan pemulihan telah dikirim ke email Anda.",
  },

  /* ---- friendly auth error messages (admin-chat tone) ---- */
  /* "…" = full version shown in the toast. "…Short" = one-liner for the
     small inline error box under the form (no room for long sentences). */
  "auth.err.invalidCredentialsTitle": {
    en: "Hmm, that didn't match",
    id: "Hmm, itu belum cocok",
  },
  "auth.err.invalidCredentials": {
    en: "Email or password is wrong — or if you just signed up, confirm your email first.",
    id: "Email atau kata sandinya salah — atau kalau baru daftar, konfirmasi dulu emailnya ya.",
  },
  "auth.err.invalidCredentialsShort": {
    en: "Email or password is wrong.",
    id: "Email atau kata sandi salah.",
  },
  "auth.err.invalidEmailTitle": {
    en: "That email looks off",
    id: "Format emailnya kurang pas",
  },
  "auth.err.invalidEmail": {
    en: "That's not a valid email — try the format name@email.com.",
    id: "Formatnya belum valid — coba pakai format nama@email.com.",
  },
  "auth.err.invalidEmailShort": {
    en: "Invalid email format.",
    id: "Format email gak valid.",
  },
  "auth.err.emailNotConfirmedTitle": {
    en: "Email not confirmed yet",
    id: "Email belum dikonfirmasi",
  },
  "auth.err.emailNotConfirmed": {
    en: "Confirm your email first — check your inbox for the link.",
    id: "Konfirmasi dulu emailnya — cek link-nya di inbox kamu.",
  },
  "auth.err.emailNotConfirmedShort": {
    en: "Confirm your email first.",
    id: "Konfirmasi emailnya dulu.",
  },
  "auth.err.userExistsTitle": {
    en: "You already have an account",
    id: "Akun kamu udah ada",
  },
  "auth.err.userExists": {
    en: "This email already has an account. Try logging in instead.",
    id: "Email ini udah punya akun. Coba masuk lewat tab Log In ya.",
  },
  "auth.err.userExistsShort": {
    en: "Email already registered.",
    id: "Email udah terdaftar.",
  },
  "auth.err.weakPasswordTitle": {
    en: "Password's too short",
    id: "Kata sandinya kependekan",
  },
  "auth.err.weakPassword": {
    en: "Use at least 8 characters for your password.",
    id: "Pakai minimal 8 karakter buat kata sandinya ya.",
  },
  "auth.err.weakPasswordShort": {
    en: "Min. 8 characters.",
    id: "Min. 8 karakter.",
  },
  "auth.err.rateLimitTitle": {
    en: "Whoa, slow down a bit",
    id: "Waduh, pelan-pelan dulu",
  },
  "auth.err.rateLimit": {
    en: "Too many tries — wait a minute, then try again.",
    id: "Kebanyakan coba — tunggu semenit, terus coba lagi.",
  },
  "auth.err.rateLimitShort": {
    en: "Too many attempts.",
    id: "Kebanyakan percobaan.",
  },
  "auth.err.networkTitle": {
    en: "Can't reach the server",
    id: "Gagal menghubungi server",
  },
  "auth.err.network": {
    en: "Can't reach the server — check your connection.",
    id: "Gagal konek ke server — cek koneksi internet kamu.",
  },
  "auth.err.networkShort": {
    en: "Connection problem.",
    id: "Masalah koneksi.",
  },
  "auth.err.genericTitle": { en: "Something went wrong", id: "Ada yang salah" },
  "auth.err.generic": {
    en: "Couldn't complete that — please try again.",
    id: "Belum berhasil — coba lagi ya.",
  },
  "auth.err.genericShort": {
    en: "Something went wrong.",
    id: "Ada yang salah.",
  },
  "auth.err.resendButton": {
    en: "Resend confirmation email",
    id: "Kirim ulang email konfirmasi",
  },
  "auth.err.resendSentTitle": {
    en: "Confirmation email sent",
    id: "Email konfirmasi terkirim",
  },
  "auth.err.resendSentMessage": {
    en: "Check {email} for the new confirmation link.",
    id: "Cek {email} buat link konfirmasi yang baru.",
  },

  /* ---- extra login-form logic/security copy ---- */
  "auth.err.invalidEmailFormat": {
    en: "That doesn't look like a valid email.",
    id: "Itu belum kelihatan kayak email yang valid.",
  },
  "auth.confirmPasswordLabel": {
    en: "Confirm Password",
    id: "Konfirmasi Kata Sandi",
  },
  "auth.confirmPasswordPlaceholder": {
    en: "Re-enter your password",
    id: "Ketik ulang kata sandinya",
  },
  "auth.passwordMismatch": {
    en: "Passwords don't match.",
    id: "Kata sandinya gak sama.",
  },
  "auth.passwordsMatch": {
    en: "Passwords match",
    id: "Password cocok",
  },
  "auth.emailInvalidInline": {
    en: "Enter a valid email address",
    id: "Masukin alamat email yang valid",
  },
  "auth.passwordTooShortInline": {
    en: "At least 8 characters",
    id: "Minimal 8 karakter",
  },
  "auth.signupFixFields": {
    en: "Fix the highlighted fields to continue.",
    id: "Perbaiki kolom yang ditandai dulu buat lanjut.",
  },
  "auth.capsLockWarning": {
    en: "Heads up — Caps Lock is on.",
    id: "Eh, Caps Lock kamu lagi nyala.",
  },
  "auth.tooManyAttempts": {
    en: "Too many attempts. Try again in {seconds}s.",
    id: "Kebanyakan percobaan. Coba lagi dalam {seconds}d.",
  },
  "auth.setupTitle": {
    en: "Complete your journey's look",
    id: "Lengkapi tampilan perjalananmu",
  },
  "auth.setupSubtitle": {
    en: "Let's set up your profile",
    id: "Ayo set up profile kamu",
  },
  "auth.usernameRequired": {
    en: "Username is required",
    id: "Username wajib diisi",
  },
  "auth.tapToChangePhoto": {
    en: "Tap to change image",
    id: "Ketuk buat ganti gambar",
  },
  "auth.usernameTaken": {
    en: "That username is already taken",
    id: "Username itu udah dipakai orang lain",
  },
  "crop.title": { en: "Adjust your image", id: "Atur gambar kamu" },
  "crop.hint": {
    en: "Drag to reposition, use the slider to zoom.",
    id: "Geser buat atur posisi, pakai slider buat zoom.",
  },
  "crop.zoom": { en: "Zoom", id: "Zoom" },
  "crop.cancel": { en: "Cancel", id: "Batal" },
  "crop.apply": { en: "Apply", id: "Terapkan" },
  "auth.saving": { en: "Saving…", id: "Menyimpan…" },
  "auth.continue": { en: "Start Exploring", id: "Mulai Menjelajah" },
  "auth.signOut": { en: "Sign out", id: "Keluar" },
  "profile.nicknamePlaceholder": {
    en: "Your nickname...",
    id: "Nickname kamu...",
  },
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
  "quiz.timerCustom": { en: "Custom", id: "Kustom" },
  "quiz.timerCustomAria": {
    en: "Custom timer in seconds (1-600)",
    id: "Timer kustom dalam detik (1-600)",
  },
  "quiz.timerCustomUnit": { en: "seconds per question", id: "detik per soal" },
  "quiz.streak": { en: "streak", id: "beruntun" },
  "quiz.next": { en: "Next", id: "Lanjut" },
  "quiz.seeResults": { en: "See Results", id: "Lihat Hasil" },
  "quiz.guessRomaji": { en: "Guess the romaji", id: "Tebak romaji" },
  "quiz.guessHiragana": { en: "Guess the hiragana", id: "Tebak hiragana" },
  "quiz.hiragana": { en: "Hiragana", id: "Hiragana" },
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
  "quiz.readingLabel": { en: "Reading: {value}", id: "Bacaan: {value}" },
  "quiz.functionLabel": { en: "Function: {value}", id: "Fungsi: {value}" },
  "quiz.kalimatLabel": { en: "Example: {value}", id: "Kalimat: {value}" },
  "quiz.translationLabel": {
    en: "Translation: {value}",
    id: "Arti kalimat: {value}",
  },
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
  "range.customCount": { en: "Custom…", id: "Ketik sendiri…" },
  "range.customCountAria": {
    en: "Type a custom number of questions",
    id: "Ketik jumlah soal sendiri",
  },
  "learn.eyebrow": { en: "study mode", id: "mode belajar" },
  "learn.title": { en: "Character Tables", id: "Tabel Aksara" },
  "learn.sub": {
    en: "Memorize the shape and reading of each character before starting a Conquest. Choose a script below.",
    id: "Hafalkan dulu bentuk dan cara baca tiap karakter sebelum mulai Conquest. Pilih aksaranya di bawah.",
  },
  "learn.readyStart": {
    en: "Ready — Start Conquest",
    id: "Sudah Siap — Mulai Conquest",
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
  "learn.studyAsFlashcards": {
    en: "Study This as Flashcards",
    id: "Pelajari Ini sebagai Flashcard",
  },
  "levels.groupChapter": { en: "Chapter {n}", id: "Chapter {n}" },
  "levels.subTiers": { en: "sub chapters", id: "sub chapter" },
  "n4.eyebrow": { en: "N4 · beta", id: "N4 · beta" },
  "n4.title": { en: "Kotoba, Kanji & Bunpō N4", id: "Kotoba, Kanji & Bunpō N4" },
  "n4.sub": {
    en: "N4 data is pulled straight from the database — this section is still early and will keep growing.",
    id: "Data N4 diambil langsung dari database — bagian ini masih tahap awal dan bakal terus ditambah.",
  },
  "n4.loading": { en: "Loading data…", id: "Memuat data…" },
  "n4.loadError": { en: "Failed to load data", id: "Gagal memuat data" },
  "n4.emptyKotoba": {
    en: "No N4 vocabulary yet.",
    id: "Belum ada data kotoba N4.",
  },
  "n4.emptyKanji": { en: "No N4 kanji yet.", id: "Belum ada data kanji N4." },
  "n4.emptyBunpo": {
    en: "No N4 grammar patterns yet.",
    id: "Belum ada data bunpō N4.",
  },

  "source.label": { en: "Organize by", id: "Susun berdasarkan" },
  "source.local": { en: "Topic", id: "Topik" },
  "source.minna": { en: "Minna no Nihongo", id: "Minna no Nihongo" },
  "source.level": { en: "Level", id: "Level" },
  "source.topicOnlyN5": {
    en: "Topic view is only available for N5.",
    id: "Tampilan Topic hanya tersedia untuk N5.",
  },
  "source.lockedHint": {
    en: "Conquer N5 to unlock N4, conquer N4 to unlock N3, and so on.",
    id: "Taklukkan N5 untuk membuka N4, taklukkan N4 untuk membuka N3, dan seterusnya.",
  },
  "source.lockedHintFor": {
    en: "Conquer {prev} to unlock {level}.",
    id: "Taklukkan {prev} untuk membuka {level}.",
  },
  "source.loading": {
    en: "Loading {level} vocabulary…",
    id: "Memuat kotoba {level}…",
  },
  "source.loadError": { en: "Failed to load data", id: "Gagal memuat data" },
  "source.retry": { en: "Try again", id: "Coba lagi" },
  "loading.generic": { en: "Loading…", id: "Memuat…" },
  "loading.auth": {
    en: "Checking your session…",
    id: "Mengecek sesi kamu…",
  },
  "loading.sync": {
    en: "Syncing your progress…",
    id: "Menyinkronkan progres kamu…",
  },

  "source.emptyKotoba": {
    en: "No {level} vocabulary yet.",
    id: "Belum ada data kotoba {level}.",
  },
  "source.emptyBunpo": {
    en: "No {level} grammar yet.",
    id: "Belum ada data bunpō {level}.",
  },
  "source.emptyKanji": {
    en: "No {level} kanji yet.",
    id: "Belum ada data kanji {level}.",
  },
  "source.loadingBunpo": {
    en: "Loading {level} grammar…",
    id: "Memuat bunpō {level}…",
  },
  "source.loadingKanji": {
    en: "Loading {level} kanji…",
    id: "Memuat kanji {level}…",
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
  "aria.openPractice": {
    en: "Open Question Practice",
    id: "Buka Latihan Soal",
  },
  "practice.eyebrow": { en: "question types", id: "tipe soal" },
  "practice.title": { en: "Question Practice", id: "Latihan Soal" },
  "practice.sub": {
    en: "Drill the exam-style question types from Conquest mode, drawn at random from the whole bank. Not every entry has every type, so each type is its own pool.",
    id: "Latih tipe soal ala ujian dari Mode Penaklukan, diambil acak dari seluruh bank soal. Tidak semua entri punya semua tipe, jadi tiap tipe punya kumpulan soalnya sendiri.",
  },
  "practice.countLabel": { en: "Number of questions", id: "Jumlah soal" },
  "practice.all": { en: "All ({count})", id: "Semua ({count})" },
  "practice.questions": { en: "questions", id: "soal" },
  "practice.customCount": { en: "Custom…", id: "Ketik sendiri…" },
  "practice.customCountAria": {
    en: "Type a custom number of questions",
    id: "Ketik jumlah soal sendiri",
  },
  "practice.scriptLabel": { en: "Script", id: "Aksara" },
  "practice.kotoba.write": { en: "Find the Kanji", id: "Tebak Kanji" },
  "practice.kotoba.writeDesc": {
    en: "Hiragana sentence, one word underlined — pick its kanji.",
    id: "Kalimat hiragana, satu kata digarisbawahi — pilih kanjinya.",
  },
  "practice.kotoba.reading": { en: "Find the Reading", id: "Tebak Bacaan" },
  "practice.kotoba.readingDesc": {
    en: "Kanji sentence, one word underlined — pick its reading.",
    id: "Kalimat kanji, satu kata digarisbawahi — pilih bacaannya.",
  },
  "practice.kotoba.fill": { en: "Best Word", id: "Kata yang Cocok" },
  "practice.kotoba.fillDesc": {
    en: "Sentence with a blank — pick the word that fits.",
    id: "Kalimat dengan bagian kosong — pilih kata yang cocok.",
  },
  "practice.kotoba.usage": { en: "Correct Sentence", id: "Kalimat yang Benar" },
  "practice.kotoba.usageDesc": {
    en: "Four sentences use the word — pick the correct one.",
    id: "Empat kalimat memakai kata itu — pilih yang benar.",
  },
  "practice.bunpo.meaning": { en: "Pattern Meaning", id: "Arti Pola" },
  "practice.bunpo.meaningDesc": {
    en: "A grammar pattern appears — pick its function.",
    id: "Sebuah pola tata bahasa muncul — pilih fungsinya.",
  },
  "practice.bunpo.particle": {
    en: "Choose the Particle",
    id: "Tebak Partikel",
  },
  "practice.bunpo.particleDesc": {
    en: "Sentence with a blank — pick the particle that fits.",
    id: "Kalimat dengan bagian kosong — pilih partikel yang tepat.",
  },
  "practice.bunpo.conjugation": {
    en: "Verb Conjugation",
    id: "Konjugasi Kata Kerja",
  },
  "practice.bunpo.conjugationDesc": {
    en: "Sentence with a blank verb — pick the correct form.",
    id: "Kalimat dengan kata kerja kosong — pilih bentuk yang tepat.",
  },
  "practice.bunpo.usage": { en: "Correct Sentence", id: "Kalimat yang Benar" },
  "practice.bunpo.usageDesc": {
    en: "Four sentences use the pattern — pick the correct one.",
    id: "Empat kalimat memakai pola itu — pilih yang benar.",
  },
  "practice.bunpo.arrange": {
    en: "Arrange the Sentence (★)",
    id: "Susun Kalimat (★)",
  },
  "practice.bunpo.arrangeDesc": {
    en: "Put four pieces in order — pick the one that lands on ★.",
    id: "Susun empat potongan — pilih yang jatuh di posisi ★.",
  },
  "practice.kanji.meaning": { en: "Kanji Meaning", id: "Arti Kanji" },
  "practice.kanji.meaningDesc": {
    en: "A kanji appears — pick its meaning.",
    id: "Sebuah kanji muncul — pilih artinya.",
  },
  "practice.kanji.reading": { en: "Reading Kanji", id: "Baca Kanji" },
  "practice.kanji.readingDesc": {
    en: "A kanji appears — pick its reading (hiragana).",
    id: "Sebuah kanji muncul — pilih bacaannya (hiragana).",
  },
  "practice.kanji.write": { en: "Pick the Kanji", id: "Tebak Kanjinya" },
  "practice.kanji.writeDesc": {
    en: "A meaning appears — pick the kanji. The wrong choices look alike.",
    id: "Sebuah arti muncul — pilih kanjinya. Pilihan salahnya bentuknya mirip.",
  },
  "practice.kanji.fill": { en: "Best Word", id: "Kata yang Cocok" },
  "practice.kanji.fillDesc": {
    en: "Sentence with a blank — pick the kanji word that fits.",
    id: "Kalimat dengan bagian kosong — pilih kata kanji yang cocok.",
  },
  "practice.start": {
    en: "Start — {count} Questions",
    id: "Mulai — {count} Soal",
  },
  "aria.learnSearch": {
    en: "Search this study set",
    id: "Cari di lessons ini",
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
  "borderStyle.default": { en: "Default", id: "Default" },
  "borderStyle.custom": { en: "Custom", id: "Kustom" },
  "borderStyle.customAccent": { en: "Accent", id: "Aksen" },
  "borderStyle.customText": { en: "Text (outside)", id: "Teks (di luar)" },
  "borderStyle.customOnAccent": {
    en: "Text (on background)",
    id: "Teks (di atas latar)",
  },
  "borderStyle.customIcon": { en: "Icon", id: "Ikon" },
  "borderStyle.customBackground": { en: "Background", id: "Latar" },
  "borderStyle.customQuizCorrect": { en: "Correct answer", id: "Jawaban benar" },
  "borderStyle.customQuizWrong": { en: "Wrong answer", id: "Jawaban salah" },
  "borderStyle.customVermillion": { en: "Vermillion accent", id: "Aksen vermillion" },
  "borderStyle.customGold": { en: "Gold accent", id: "Aksen emas" },
  "borderStyle.customMoss": { en: "Moss accent", id: "Aksen moss" },
  "borderStyle.customChoiceBg": {
    en: "Answer choice background",
    id: "Latar pilihan jawaban",
  },
  "borderStyle.customChoiceSelected": {
    en: "Selected answer (Match mode)",
    id: "Jawaban terpilih (mode Match)",
  },
  "borderStyle.sectionTextIcon": { en: "Text & icons", id: "Teks & ikon" },
  "borderStyle.sectionBackground": {
    en: "Background & choices",
    id: "Latar & pilihan",
  },
  "borderStyle.sectionQuiz": { en: "Quiz feedback", id: "Umpan balik kuis" },
  "borderStyle.sectionAccents": { en: "Extra accents", id: "Aksen tambahan" },
  "borderStyle.reset": { en: "Reset", id: "Reset" },
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

  "settings.menu.heading": { en: "Settings", id: "Pengaturan" },
  "settings.menu.subheading": {
    en: "Customize your experience",
    id: "Sesuaikan pengalamanmu",
  },
  "settings.menu.account.heading": {
    en: "Account & Experience",
    id: "Akun & Pengalaman",
  },
  "settings.menu.about.heading": { en: "About the app", id: "Tentang aplikasi" },
  "settings.about.appName": {
    en: "『天下』 TENKA",
    id: "『天下』 TENKA",
  },
  "settings.about.tagline": {
    en: "Signifies the ultimate ambition—to stand beneath the open sky and hold the fate of the world within one's hands.",
    id: "Melambangkan ambisi tertinggi — berdiri di bawah langit terbuka dan menggenggam nasib dunia di tangan sendiri.",
  },
  "settings.menu.profile.title": { en: "Profile", id: "Profil" },
  "settings.menu.profile.desc": {
    en: "Name, title and profile",
    id: "Nama, gelar, dan profil",
  },
  "settings.menu.appearance.title": { en: "Appearance", id: "Tampilan" },
  "settings.menu.appearance.desc": {
    en: "Theme, font and colors",
    id: "Tema, font, dan warna",
  },
  "settings.menu.progress.title": { en: "Progress", id: "Progres" },
  "settings.menu.progress.desc": {
    en: "Titles and speedrun records",
    id: "Title dan rekor speedrun",
  },
  "settings.menu.feedback.title": { en: "Feedback", id: "Masukan" },
  "settings.menu.feedback.desc": {
    en: "Suggestions and bug reports",
    id: "Saran dan laporan bug",
  },
  "settings.profile.subheading": {
    en: "Manage your profile information",
    id: "Kelola informasi profilmu",
  },
  "settings.appearance.subheading": {
    en: "Personalize your learning environment",
    id: "Personalisasi tampilan belajarmu",
  },
  "settings.progress.subheading": {
    en: "Your achievements and learning journey",
    id: "Pencapaian dan perjalanan belajarmu",
  },
  "settings.feedback.subheading": {
    en: "Have an idea? Found a bug? Let us know!",
    id: "Ada ide? Nemu bug? Kasih tau kami!",
  },
  "settings.appearance.display": { en: "Display", id: "Tampilan" },
  "settings.appearance.font": { en: "Font", id: "Font" },
  "settings.appearance.customColors": {
    en: "Customize colors",
    id: "Kustomisasi warna",
  },
  "aria.backToSettings": { en: "Back to settings", id: "Kembali ke pengaturan" },
  "sidebar.identity.editHint": {
    en: "Double-click to edit name and photo",
    id: "Klik dua kali untuk edit nama dan foto",
  },

  "titles.heading": {
    en: "Conquest Title Collection",
    id: "Koleksi Title Penaklukkan",
  },
  "titles.hint": {
    en: "Complete every conquest ⚔️ to claim the title of Conqueror!",
    id: "Selesaikan setiap penaklukan ⚔️ untuk meraih gelar Penakluk!",
  },

  "speedrunRecords.heading": { en: "Speedrun Records", id: "Rekor Speedrun" },
  "speedrunRecords.hint": {
    en: "Your fastest completed run for each conquered script.",
    id: "Waktu tercepatmu untuk tiap aksara yang sudah ditaklukkan.",
  },
  "speedrunRecords.empty": {
    en: "Conquer Hiragana or Katakana ⚔️ to unlock Speedrun Mode for it.",
    id: "Taklukkan Hiragana atau Katakana ⚔️ untuk membuka Mode Speedrun-nya.",
  },
  "speedrunRecords.notPlayedYet": {
    en: "Not run yet",
    id: "Belum pernah dicoba",
  },

  "about.heading": { en: "About", id: "Tentang" },
  "about.summary": { en: "Noble Ranks", id: "Tingkatan Kebangsawanan" },
  "about.intro": {
    en: "Conquer every Tier Conquest to climb from commoner to emperor.",
    id: "Taklukkan tiap Tier Conquest untuk naik dari rakyat jelata sampai kaisar.",
  },
  "rank.comingSoon": { en: "Coming soon", id: "Segera hadir" },

  "missions.open": { en: "Rank conquests", id: "Conquest kenaikan pangkat" },
  "missions.button": { en: "Conquests", id: "Conquest" },
  "missions.title": { en: "Rank Conquests", id: "Conquest Pangkat" },
  "missions.sub": {
    en: "Finish these conquests to climb the noble ranks.",
    id: "Selesaikan conquest ini untuk naik pangkat bangsawan.",
  },
  "missions.current": { en: "Current", id: "Sekarang" },
  "missions.next": { en: "Next", id: "Berikutnya" },
  "missions.progress": {
    en: "{done} of {total} conquests done",
    id: "{done} dari {total} conquest selesai",
  },
  "missions.conquer": {
    en: "Conquer all of {label}",
    id: "Taklukkan seluruh {label}",
  },
  "missions.unlocks": { en: "Unlocks {rank}", id: "Membuka {rank}" },
  "missions.done": { en: "Done", id: "Selesai" },
  "missions.go": {
    en: "Begin",
    id: "Mulai",
  },
  "missions.allN5": {
    en: "All N5 conquests complete!",
    id: "Semua conquest N5 ditaklukkan!",
  },
  "missions.later": {
    en: "N4 – N1 conquests await in the lands ahead.",
    id: "Conquest N4 – N1 menanti di negeri seberang.",
  },
  "missions.close": { en: "Close", id: "Tutup" },
  "missions.badge": { en: "LEARN", id: "BELAJAR" },
  "missions.steps": { en: "Path to {rank}", id: "Jalan Menuju {rank}" },
  "missions.stepsSub": {
    en: "Complete these conquests to earn your next rank.",
    id: "Selesaikan conquest ini untuk meraih pangkat berikutnya.",
  },
  "missions.desc": {
    en: "Conquer all {count} {label} tiers.",
    id: "Taklukkan semua {count} tier {label}.",
  },
  "missions.completed": {
    en: "Conquered",
    id: "Ditaklukkan",
  },
  "missions.footer": {
    en: "Every conquest brings you closer to the throne.",
    id: "Setiap conquest membawamu lebih dekat ke tahta.",
  },

  "guide.msg.start": {
    en: "Let's start today's conquest together — you've got this!",
    id: "Ayo kita mulai conquest hari ini bareng-bareng — kamu pasti bisa!",
  },
  "guide.msg.progress": {
    en: "You're on the right path, keep up the spirit!",
    id: "Kamu sudah berada di jalan yang tepat, terus semangat!",
  },
  "guide.msg.almost": {
    en: "Almost there — just one more step to finish this conquest!",
    id: "Sedikit lagi — satu langkah lagi buat menyelesaikan conquest ini!",
  },
  "guide.msg.done": {
    en: "Amazing, conquest complete! Ready for the next one?",
    id: "Keren, conquest selesai! Siap lanjut ke conquest berikutnya?",
  },
  "guide.msg.sub": {
    en: "Every letter you learn is a step toward your goal.",
    id: "Setiap huruf yang kamu pelajari adalah langkah menuju tujuanmu.",
  },
  "guide.intro.0": {
    en: "Hiya, welcome to Tenka! 🎉",
    id: "Halo, selamat datang di Tenka! 🎉",
  },
  "guide.intro.1": {
    en: "I'm your little guide here — let me show you around real quick.",
    id: "Aku pemandu kecilmu di sini — yuk kukenalin dulu tempat ini.",
  },
  "guide.intro.2": {
    en: "Head to Learn to meet Hiragana, Katakana, Kanji, and everyday vocabulary.",
    id: "Di halaman Belajar, kamu bisa kenalan sama Hiragana, Katakana, Kanji, sampai kosakata sehari-hari.",
  },
  "guide.intro.3": {
    en: "Then sharpen what you've learned with Quizzes and Flashcards.",
    id: "Habis itu, asah yang sudah kamu pelajari lewat Latihan Soal dan Flashcards.",
  },
  "guide.intro.4": {
    en: "Feeling bold? Try Match mode to race your own brain for speed!",
    id: "Berani tantangan? Coba mode Match buat ngadu kecepatan otakmu!",
  },
  "guide.intro.5": {
    en: "Every script you conquer climbs your rank — from Commoner all the way to Emperor.",
    id: "Setiap aksara yang kamu taklukkan bakal naikkin pangkatmu — dari Rakyat Jelata sampai Kaisar.",
  },
  "guide.intro.6": {
    en: "Alright, your first conquest is waiting — let's get started!",
    id: "Nah, conquest pertamamu sudah menunggu — yuk kita mulai!",
  },
  "guide.intro.next": { en: "Next", id: "Lanjut" },
  "guide.intro.start": { en: "Let's start!", id: "Ayo mulai!" },
  "guide.intro.skip": { en: "Skip intro", id: "Lewati intro" },
  "guide.intro.step": {
    en: "{current} of {total}",
    id: "{current} dari {total}",
  },
  "guide.quote.0": {
    en: "It's study time! Even 10 minutes counts.",
    id: "Waktunya belajar! 10 menit pun berarti.",
  },
  "guide.quote.1": {
    en: "Don't give up — every mistake is a step forward!",
    id: "Jangan menyerah — setiap kesalahan adalah langkah maju!",
  },
  "guide.quote.2": {
    en: "Write down one new word today. Future you says thanks!",
    id: "Catat satu kata baru hari ini. Kamu di masa depan bakal berterima kasih!",
  },
  "guide.quote.3": {
    en: "I'm proud of you for showing up today.",
    id: "Aku bangga kamu mau belajar hari ini.",
  },
  "guide.quote.4": {
    en: "Hmm… which script will you conquer next?",
    id: "Hmm… aksara mana yang mau kamu taklukkan berikutnya?",
  },
  "guide.quote.5": {
    en: "Ready to climb the ranks? Let's go!",
    id: "Siap naik pangkat? Ayo berangkat!",
  },
  "guide.quote.6": {
    en: "Sip some water, then back to the conquest!",
    id: "Minum dulu, terus lanjut conquestnya!",
  },
  "guide.quote.7": {
    en: "Consistency beats cramming. Little by little!",
    id: "Rutin tiap hari lebih ampuh daripada belajar kebut. Sedikit demi sedikit!",
  },
  "guide.quote.8": {
    en: "Fun fact: hiragana was born from cursive kanji!",
    id: "Fun fact: hiragana lahir dari kanji yang ditulis sambung!",
  },
  "guide.quote.9": {
    en: "Every noble started as a commoner. You've got this!",
    id: "Bangsawan mana pun dulunya rakyat biasa. Kamu pasti bisa!",
  },
  "guide.quote.10": {
    en: "Wow, you're getting faster every day!",
    id: "Wow, kamu makin cepat tiap hari!",
  },
  "guide.quote.11": {
    en: "Your next conquest is right there — go for it!",
    id: "Conquest berikutnya sudah di depan mata — gas!",
  },
  "guide.quote.12": {
    en: "Tired? Rest a little, then come back stronger.",
    id: "Capek? Istirahat sebentar, lalu balik lebih kuat.",
  },
  "guide.quote.13": {
    en: "Learning Japanese is a journey. I'm cheering for you!",
    id: "Belajar bahasa Jepang itu perjalanan. Aku menyemangatimu!",
  },
  "guide.quote.14": {
    en: "Every conquest you finish deserves a celebration!",
    id: "Setiap conquest yang kamu selesaikan pantas dirayakan!",
  },
  "guide.progress.start.0": {
    en: "Your journey starts with {script}. Take the first step — I'm right here with you!",
    id: "Perjalananmu dimulai dari {script}. Ayo ambil langkah pertama — aku temani!",
  },
  "guide.progress.start.1": {
    en: "No conquests completed yet, and that's okay. {script} is a great place to begin!",
    id: "Belum ada conquest yang ditaklukkan, nggak apa-apa. {script} tempat yang pas buat mulai!",
  },
  "guide.progress.start.2": {
    en: "Ready? Conquer {script} first and you're on your way to {rank}!",
    id: "Siap? Taklukkan {script} dulu, dan kamu mulai melangkah menuju {rank}!",
  },
  "guide.progress.mid.0": {
    en: "{done} of {total} conquests done — nice pace! Next up: {script}.",
    id: "{done} dari {total} conquest sudah beres — lumayan banget! Berikutnya: {script}.",
  },
  "guide.progress.mid.1": {
    en: "You're on the right path to {rank}. Keep the momentum with {script}!",
    id: "Kamu sudah di jalur yang tepat menuju {rank}. Jaga semangatnya di {script}!",
  },
  "guide.progress.mid.2": {
    en: "Look at you go — {done} conquests down! {script} is waiting for you.",
    id: "Lihat kamu sekarang — {done} conquest sudah ditaklukkan! {script} sudah menunggu.",
  },
  "guide.progress.last.0": {
    en: "So close! Only {script} stands between you and {rank}!",
    id: "Tinggal sedikit lagi! Cuma {script} yang tersisa sebelum kamu jadi {rank}!",
  },
  "guide.progress.last.1": {
    en: "One more conquest and you'll be a {rank}. You've got this — go for {script}!",
    id: "Satu conquest lagi dan kamu jadi {rank}. Kamu pasti bisa — gas {script}!",
  },
  "guide.progress.last.2": {
    en: "{done} of {total} done. Finish {script} and the {rank} rank is yours!",
    id: "{done} dari {total} beres. Selesaikan {script} dan pangkat {rank} jadi milikmu!",
  },
  "guide.progress.done.0": {
    en: "All {total} N5 conquests complete! I'm so proud of you!",
    id: "Semua {total} conquest N5 sudah kamu taklukkan! Aku bangga banget sama kamu!",
  },
  "guide.progress.done.1": {
    en: "You did it — the whole N5 is yours! N4 is waiting in the lands ahead.",
    id: "Kamu berhasil — seluruh N5 jadi milikmu! N4 sudah menanti di negeri seberang.",
  },
  "guide.progress.done.2": {
    en: "N5 complete! Want to keep sharpening your skills? Head to Practice!",
    id: "N5 tuntas! Mau terus mengasah kemampuan? Ayo ke Practice!",
  },
  "guide.tipsHeading": { en: "Tip of the Day", id: "Tips Hari Ini" },
  "guide.tipsSource": {
    en: "— A message from your companion",
    id: "— Pesan dari temanmu",
  },
  "guide.tip.0": {
    en: "「 Little by little, a little becomes a lot. 」",
    id: "「 Sedikit demi sedikit, lama-lama jadi bukit. 」",
  },
  "guide.tip.1": {
    en: "「 A journey of a thousand miles begins with a single step. 」",
    id: "「 Perjalanan seribu mil dimulai dengan satu langkah. 」",
  },
  "guide.tip.2": {
    en: "「 Review yesterday's letters before learning new ones. 」",
    id: "「 Ulangi huruf kemarin sebelum belajar yang baru. 」",
  },
  "guide.tip.3": {
    en: "「 Ten minutes a day beats one long session a week. 」",
    id: "「 Sepuluh menit tiap hari lebih baik dari sekali seminggu. 」",
  },
  "guide.tip.4": {
    en: "「 Mistakes are proof that you're actually trying. 」",
    id: "「 Salah itu tanda kamu benar-benar sedang mencoba. 」",
  },
  "guide.tip.5": {
    en: "「 Say it out loud — your ears learn too. 」",
    id: "「 Ucapkan dengan suara — telingamu juga ikut belajar. 」",
  },

  "feedback.heading": { en: "Send Feedback", id: "Kirim Masukan" },
  "feedback.button": { en: "Send Feedback", id: "Kirim Masukan" },
  "feedback.placeholder": {
    en: "Got a suggestion, idea, or found a bug? Write it here...",
    id: "Ada saran, ide, atau nemu bug? Tulis di sini...",
  },
  "feedback.subject": {
    en: "Feedback — Learning Japanese App",
    id: "Masukan — Learning Japanese App",
  },
  "feedback.bodyDefault": {
    en: "Write your feedback here...",
    id: "Tulis masukanmu di sini...",
  },
  "feedback.sending": { en: "Sending…", id: "Mengirim…" },
  "feedback.error": {
    en: "Couldn't send your feedback. Check your connection and try again.",
    id: "Masukan belum terkirim. Cek koneksi internetmu lalu coba lagi.",
  },
  "feedback.errorServer": {
    en: "The feedback service isn't responding right now. Please try again a bit later.",
    id: "Layanan masukan sedang tidak merespons. Coba lagi beberapa saat lagi.",
  },
  "feedback.thanksTitle": {
    en: "Thanks for reporting!",
    id: "Terima kasih sudah melapor!",
  },
  "feedback.thanksBody": {
    en: "Your feedback has been sent to the Tenka team. We read every message.",
    id: "Masukanmu sudah terkirim ke tim Tenka. Setiap pesan pasti kami baca.",
  },
  "feedback.thanksClose": { en: "Got it", id: "Oke" },

  "speedrun.countdownGo": { en: "GO!", id: "MULAI!" },
  "matchMode.cardTitle": { en: "Match Mode", id: "Mode Match" },
  "matchMode.cardDesc": {
    en: "Match 4 characters with their romaji, round by round.",
    id: "Cocokkan 4 huruf dengan romaji-nya, ronde demi ronde.",
  },
  "matchMode.instruction": {
    en: "Tap a character, then its matching romaji",
    id: "Ketuk sebuah huruf, lalu romaji yang cocok",
  },
  "matchMode.cardDescKotoba": {
    en: "Match 5 words with their meanings, round by round.",
    id: "Cocokkan 5 kata dengan artinya, ronde demi ronde.",
  },
  "matchMode.instructionKotoba": {
    en: "Tap a word, then its matching meaning",
    id: "Ketuk sebuah kata, lalu pasangan yang cocok",
  },
  "matchMode.cardDescKanji": {
    en: "Match 5 kanji with their meanings or readings, round by round.",
    id: "Cocokkan 5 kanji dengan arti atau bacaannya, ronde demi ronde.",
  },
  "matchMode.cardDescBunpo": {
    en: "Match 4 grammar patterns with their functions, round by round.",
    id: "Cocokkan 4 pola tata bahasa dengan fungsinya, ronde demi ronde.",
  },
  "matchMode.instructionKanji": {
    en: "Tap a kanji, then its matching meaning or reading",
    id: "Ketuk sebuah kanji, lalu arti atau bacaan yang cocok",
  },
  "matchMode.instructionBunpo": {
    en: "Tap a pattern, then its matching function",
    id: "Ketuk sebuah pola, lalu fungsi yang cocok",
  },
  "matchMode.instructionBunpoKalimat": {
    en: "Tap a sentence, then the pattern that fills the blank",
    id: "Ketuk sebuah kalimat, lalu pola yang cocok untuk bagian kosong",
  },
  "acct.switch.title": { en: "Switch account", id: "Ganti akun" },
  "acct.switch.desc": {
    en: "Hop to another saved account without signing in again.",
    id: "Pindah ke akun lain yang tersimpan tanpa login ulang.",
  },
  "acct.switch.count": {
    en: "{count} saved accounts",
    id: "{count} akun tersimpan",
  },
  "acct.switch.active": { en: "Active", id: "Aktif" },
  "acct.switch.add": { en: "Add another account", id: "Tambah akun lain" },
  "acct.switch.addHint": {
    en: "You'll pick another Google account. This account stays in the list.",
    id: "Kamu akan memilih akun Google lain. Akun ini tetap ada di daftar.",
  },
  "acct.switch.remove": {
    en: "Remove {name} from list",
    id: "Hapus {name} dari daftar",
  },
  "acct.switch.removeHint": {
    en: "Remove from list (does not delete the account)",
    id: "Hapus dari daftar (tidak menghapus akunnya)",
  },
  "acct.switch.expired": {
    en: "The session for {name} has expired. Sign in again to use this account.",
    id: "Sesi {name} sudah kedaluwarsa. Login lagi untuk memakai akun ini.",
  },
  "acct.switch.saved": { en: "Saved accounts", id: "Akun tersimpan" },
  "acct.switch.continueAs": {
    en: "Continue as {name}",
    id: "Lanjut sebagai {name}",
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
  "flash.new": { en: "New", id: "Baru" },
  "flash.learn": { en: "Learn", id: "Belajar" },
  "flash.due": { en: "Due", id: "Ulang" },
  "flash.deleteDeck": { en: "Delete deck", id: "Hapus deck" },
  "flash.confirmDelete": {
    en: 'Delete the deck "{name}"? This can\'t be undone.',
    id: 'Hapus deck "{name}"? Ini tidak bisa dibatalkan.',
  },
  "flash.progress": {
    en: "Card {current}/{total} · {label}",
    id: "Kartu {current}/{total} · {label}",
  },
  "flash.progressLabel": {
    en: "{label}",
    id: "{label}",
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
  "flash.caughtUp": {
    en: "No cards to review right now. They'll come back when they're due.",
    id: "Belum ada kartu yang perlu diulang sekarang. Kartu muncul lagi saat waktunya tiba.",
  },
  "flash.caughtUpTitle": {
    en: "Nothing to review right now",
    id: "Belum ada kartu untuk diulang",
  },
  "flash.caughtUpSub": {
    en: "Every card in {label} has been answered and is waiting for its next turn. Come back later, or press Review Again to practice them all.",
    id: "Semua kartu di {label} sudah pernah dijawab dan lagi menunggu jadwal muncul lagi. Kembali lagi nanti, atau tekan Ulangi untuk latihan semua kartu.",
  },
  "flash.studyAheadNote": {
    en: "Practice mode: all cards, even ones not due yet. Your answers here don't change the schedule or the numbers on the deck list.",
    id: "Mode latihan: semua kartu, termasuk yang belum jatuh tempo. Jawabanmu di sini tidak mengubah jadwal maupun angka di daftar deck.",
  },
  "flash.intervalNow": { en: "now", id: "sekarang" },
  "flash.waitingTitle": {
    en: "Waiting for the next card…",
    id: "Menunggu kartu berikutnya…",
  },
  "flash.waitingSub": {
    en: "The next card comes back in {time}.",
    id: "Kartu berikutnya muncul lagi dalam {time}.",
  },
  "flash.waitingSkip": { en: "Continue now", id: "Lanjut sekarang" },
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
    en: "Enter This Tier",
    id: "Masuki Tier Ini",
  },
  "conquest.cardTitleWithLabel": {
    en: "Conquer {label}",
    id: "Taklukkan {label}",
  },
  "conquest.jlptRetryCardTitleWithLabel": {
    en: "Retake the {label} Conquest",
    id: "Ulangi Conquest {label}",
  },
  "conquest.goToPracticeCardTitle": {
    en: "Want to practice? Head to Practice",
    id: "Mau latihan? Ke Practice yuk",
  },
  "conquest.goToPracticeDesc": {
    en: "You've already conquered the {label} Conquest. Want to keep sharpening your skills? Go to Practice!",
    id: "Kamu sudah menaklukkan Conquest {label}. Mau latihan lagi biar makin jago? Pergi ke Practice!",
  },
  "conquest.desc": {
    en: "Conquer all of {label} at once — {count} questions, one mistake and it's over.",
    id: "Taklukkan seluruh {label} sekaligus — {count} soal, satu kali salah langsung gagal.",
  },
  "conquest.jlptDesc": {
    en: "JLPT N5-style exam — {tiers} tiers, {count} random questions per tier. You need at least {percent}% correct in every tier.",
    id: "Ujian ala JLPT N5 — {tiers} tier, {count} soal acak per tier. Minimal {percent}% benar di setiap tier.",
  },
  "conquest.lockNote": {
    en: "🔒 Conquer {lockLabel} first before you can conquer {label}.",
    id: "🔒 Taklukkan {lockLabel} dulu sebelum bisa menaklukkan {label}.",
  },
  "conquest.modalTitleWithLabel": {
    en: "⚔️ Conquer {label}",
    id: "⚔️ Taklukkan {label}",
  },
  "conquestModal.confirm": {
    en: "Begin the Conquest",
    id: "Mulai Penaklukkan",
  },
  "conquestGuide.ready": {
    en: "Ready? Take a deep breath — the conquest begins the moment you press start! ⚔️",
    id: "Siap? Tarik napas dalam-dalam — ujiannya dimulai begitu kamu menekan mulai! ⚔️",
  },
  "conquestModal.threePhaseIntro": {
    en: "This isn't an ordinary conquest — this is the Knight's Conquest. Conquering {label} is split into 3 story Tiers (basic → dotted → combined), {count} questions in total.",
    id: "Ini bukan conquest biasa — ini Ujian Ksatria. Penaklukkan {label} terbagi menjadi 3 Tier cerita (dasar → bertitik → gabungan), total {count} soal.",
  },
  "conquestModal.singleIntro": {
    en: "You'll face all {count} {label} questions at once, shuffled.",
    id: "Kamu akan menghadapi seluruh {count} soal {label} sekaligus, diacak.",
  },
  "conquestModal.jlptIntro": {
    en: "This works like the JLPT N5 exam: 3 tiers — meaning, reading, and choosing the best word for a sentence — with {count} random {label} questions in each ({total} in total).",
    id: "Ujiannya ala JLPT N5: 3 tier — arti, membaca, dan memilih kata yang paling cocok untuk kalimat — masing-masing {count} soal acak {label} (total {total} soal).",
  },
  "conquestModal.jlptIntroBunpo": {
    en: "This works like the JLPT N5 grammar exam: 5 tiers — pattern meaning, particles, verb conjugation, choosing the correct sentence for a pattern, and arranging a sentence (★) — with {count} random {label} questions in each ({total} in total).",
    id: "Ujiannya ala JLPT N5 tata bahasa: 5 tier — arti pola, partikel, konjugasi kata kerja, memilih kalimat yang benar untuk sebuah pola, dan menyusun kalimat (★) — masing-masing {count} soal acak {label} (total {total} soal).",
  },
  "conquestModal.jlptIntroKanji": {
    en: "This works like the JLPT N5 kanji exam: 4 tiers — kanji meaning, kanji reading (hiragana), picking the kanji for a meaning, and choosing the best kanji word for a sentence — with {count} random {label} questions in each ({total} in total).",
    id: "Ujiannya ala JLPT N5 kanji: 4 tier — arti kanji, bacaan kanji (hiragana), menebak kanji dari arti, dan memilih kata kanji yang paling cocok untuk kalimat — masing-masing {count} soal acak {label} (total {total} soal).",
  },
  "conquestModal.jlptIntroKotoba": {
    en: "This works like the JLPT N5 vocabulary (Moji · Goi) exam: 4 tiers — hiragana → kanji, kanji → hiragana, choosing the best word for a sentence, and choosing the correct sentence for a word — with {count} random {label} questions in each ({total} in total).",
    id: "Ujiannya ala JLPT N5 Moji · Goi: 4 tier — hiragana → kanji, kanji → hiragana, memilih kata yang paling cocok untuk kalimat, dan memilih kalimat yang benar untuk sebuah kata — masing-masing {count} soal acak {label} (total {total} soal).",
  },
  "conquestModal.rule.jlptChoices": {
    en: "Every tier is <b>multiple choice with 4 options</b>. The questions are drawn at random from {label} each attempt.",
    id: "Semua tier berupa <b>pilihan ganda 4 opsi</b>. Soal diambil acak dari {label} setiap percobaan.",
  },
  "conquestModal.rule.jlptPassMark": {
    en: "You need <b>at least {percent}% correct in every tier</b>. Fall below that and the conquest ends in <b>DEFEAT</b> right away.",
    id: "Kamu harus <b>minimal {percent}% benar di setiap tier</b>. Kalau nilainya sudah tidak mungkin cukup, penaklukkan langsung berakhir <b>KEKALAHAN</b>.",
  },
  "conquestModal.rule.jlptFailRestart": {
    en: "If you fall, you'll have to march again from Tier 1.",
    id: "Kalau kalah, kamu harus maju lagi dari Tier 1.",
  },
  "conquestModal.rule.typeOnly": {
    en: "In <b>every Tier</b>, you must <b>type your own</b> answer — there's no multiple choice at all.",
    id: "Di <b>seluruh Tier</b>, kamu harus <b>mengetik sendiri</b> jawabannya — tidak ada pilihan ganda sama sekali.",
  },
  "conquestModal.rule.oneWrongFails": {
    en: "Get <b>even one</b> answer wrong and the conquest instantly ends in <b>DEFEAT</b>.",
    id: "Salah <b>satu saja</b> jawaban, penaklukkan langsung berakhir <b>KEKALAHAN</b>.",
  },
  "conquestModal.rule.failRestartChapter": {
    en: "If you fall, you'll have to march again from Tier 1.",
    id: "Kalau kalah, kamu harus maju lagi dari Tier 1.",
  },
  "conquestModal.rule.failRestartFirst": {
    en: "If you fall, you'll have to march again from the first question.",
    id: "Kalau kalah, kamu harus maju lagi dari soal pertama.",
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
    en: "Conquer this fully and you'll officially be <b>knighted (騎士)</b> — both the Hiragana &amp; Katakana conquests complete!",
    id: "Taklukkan ini sampai tuntas dan kamu akan resmi <b>diangkat menjadi Knight (騎士)</b> — ujian Hiragana &amp; Katakana lunas keduanya!",
  },
  "conquestStory.eyebrowStart": {
    en: "⚔️ The Knight's Conquest begins",
    id: "⚔️ Ujian Ksatria dimulai",
  },
  "conquestStory.eyebrowFinal": {
    en: "⚔️ Final tier",
    id: "⚔️ Tier terakhir",
  },
  "conquestStory.eyebrowNext": {
    en: "⚔️ Next tier",
    id: "⚔️ Tier berikutnya",
  },
  "conquestStory.titleWithScript": {
    en: "{label} — {script}",
    id: "{label} — {script}",
  },
  "conquestStory.jlptEyebrowStart": {
    en: "📝 The N5 exam begins",
    id: "📝 Ujian N5 dimulai",
  },
  "conquestStory.jlptEyebrowNext": {
    en: "📝 Next tier",
    id: "📝 Tier berikutnya",
  },
  "conquestStory.jlptEyebrowFinal": {
    en: "📝 Final tier",
    id: "📝 Tier terakhir",
  },
  "conquestStory.jlptMeta": {
    en: "{count} questions in this tier · 4 choices · at least {percent}% correct to pass ({need} of {count}).",
    id: "{count} soal di tier ini · 4 pilihan · minimal {percent}% benar untuk lulus ({need} dari {count}).",
  },
  "conquestStory.startThisTier": {
    en: "Enter This Tier",
    id: "Masuki Tier Ini",
  },
  "conquestStory.startThisChapter": {
    en: "Enter This Tier",
    id: "Masuki Tier Ini",
  },
  "conquestStory.diffLabel": {
    en: "🔥 type your own answer",
    id: "🔥 ketik jawaban sendiri",
  },
  "conquestStory.meta": {
    en: "{count} questions in this Tier · {diff} · one mistake and the whole conquest fails.",
    id: "{count} soal di Tier ini · {diff} · satu kali salah, seluruh penaklukkan gagal.",
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
  "speedrunGuide.ready": {
    en: "Ready? The timer starts the moment the countdown ends — go for a new record! ⚡",
    id: "Siap? Timer mulai begitu hitung mundur selesai — kejar rekor barumu! ⚡",
  },
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
  "results.goToPractice": { en: "🎯 Go to Practice", id: "🎯 Ke Latihan" },
  "results.speedrunAgain": { en: "⚡ Speedrun Again", id: "⚡ Speedrun Lagi" },

  "results.bestStreak": {
    en: " · best streak {n}",
    id: " · beruntun terbaik {n}",
  },
  "results.greetConquestFail": {
    en: "Keep going, {name}! 💪",
    id: "Semangat, {name}! 💪",
  },
  "results.greetConquestSuccess": {
    en: "Perfect, {name}! 🏆",
    id: "Sempurna, {name}! 🏆",
  },
  "results.greetPerfect": {
    en: "Perfect, {name}! 🎉",
    id: "Sempurna, {name}! 🎉",
  },
  "results.greetAlmost": {
    en: "Almost perfect, {name}! Just a bit more.",
    id: "Hampir sempurna, {name}! Sedikit lagi.",
  },
  "results.greetDecent": {
    en: "Not bad, {name}! Keep practicing.",
    id: "Lumayan, {name}! Terus berlatih ya.",
  },
  "results.greetKeepGoing": {
    en: "Keep going, {name}! Try again, take it slow.",
    id: "Semangat, {name}! Coba lagi pelan-pelan.",
  },
  "results.conquestFailBanner": {
    en: "💀 <b>Conquest Failed</b> — missed{phaseNote} (question {current} of {total}). {label} isn't conquered yet, try again from the start!",
    id: "💀 <b>Penaklukkan Gagal</b> — meleset{phaseNote} (soal ke-{current} dari {total}). {label} belum takluk, coba lagi dari awal!",
  },
  "results.jlptFailBanner": {
    en: "💀 <b>Conquest Failed</b> — too many mistakes{phaseNote} (question {current} of {total}). You need at least {percent}% correct in every tier of {label} — try again from the start!",
    id: "💀 <b>Penaklukkan Gagal</b> — kebanyakan salah{phaseNote} (soal ke-{current} dari {total}). Kamu perlu minimal {percent}% benar di setiap tier {label} — coba lagi dari awal!",
  },
  "results.greetConquestPassed": {
    en: "You passed, {name}! 🏆",
    id: "Lulus, {name}! 🏆",
  },
  "results.conquestFailPhaseNote": {
    en: " in {phase}",
    id: " di {phase}",
  },
  "results.conquestSuccessOpening": {
    en: "🏆 <b>Conquest Successful!</b> {epilogue}",
    id: "🏆 <b>Penaklukkan Berhasil!</b> {epilogue}",
  },
  "results.conquestSuccessOpeningPlain": {
    en: "🏆 <b>Conquest Successful!</b> You've officially conquered all of {label}!",
    id: "🏆 <b>Penaklukkan Berhasil!</b> Kamu resmi menaklukkan seluruh {label}!",
  },
  "results.newTitleEarned": {
    en: " New title earned: <b>{emoji} {title}</b> — check your collection in Settings.",
    id: " Title baru didapat: <b>{emoji} {title}</b> — cek koleksimu di Settings.",
  },
  "results.knightCeremony": {
    en: " <br><br>⚔️ <b>Knighting Ceremony!</b> You've fully conquered Hiragana and Katakana — the Knight Captain lays his sword on both your shoulders before the whole town. From today you officially hold the title <b>{emoji} {title} ({subtitle})</b>!",
    id: " <br><br>⚔️ <b>Upacara Pengangkatan Ksatria!</b> Hiragana dan Katakana sudah kau taklukkan sepenuhnya — Kapten Ksatria meletakkan pedangnya di kedua bahumu di hadapan seluruh warga kota. Mulai hari ini kau resmi menyandang gelar <b>{emoji} {title} ({subtitle})</b>!",
  },
  "results.baronCeremony": {
    en: " <br><br>🎗️ <b>Investiture Ceremony!</b> With Kotoba fully conquered, the King's court summons you before the throne — a scroll bearing the royal seal is placed in your hands. From today you officially hold the title <b>{emoji} {title} ({subtitle})</b>!",
    id: " <br><br>🎗️ <b>Upacara Pengangkatan Bangsawan!</b> Kotoba sudah kau taklukkan sepenuhnya — istana Raja memanggilmu menghadap singgasana, sebuah gulungan bersegel kerajaan diletakkan di tanganmu. Mulai hari ini kau resmi menyandang gelar <b>{emoji} {title} ({subtitle})</b>!",
  },
  "results.rankUp": {
    en: " Your rank rose to <b>{emoji} {title} ({subtitle})</b>",
    id: " Tingkatanmu naik menjadi <b>{emoji} {title} ({subtitle})</b>",
  },
  "results.rankUpPlain": {
    en: "Your rank rose! You are now <b>{emoji} {title} ({subtitle})</b>",
    id: "Tingkatanmu naik! Sekarang kamu adalah <b>{emoji} {title} ({subtitle})</b>",
  },
  "results.speedrunTime": { en: "Time: {time}", id: "Waktu: {time}" },
  "results.speedrunNewRecord": {
    en: "⚡ <b>New Record!</b> You finished {label} in <b>{time}</b>.",
    id: "⚡ <b>Rekor Baru!</b> Kamu menyelesaikan {label} dalam <b>{time}</b>.",
  },
  "results.speedrunFirstRecord": {
    en: "⚡ <b>First record set!</b> You finished {label} in <b>{time}</b>.",
    id: "⚡ <b>Rekor pertama tercatat!</b> Kamu menyelesaikan {label} dalam <b>{time}</b>.",
  },
  "results.speedrunNoRecord": {
    en: "You finished {label} in <b>{time}</b> — your best is still {best}.",
    id: "Kamu menyelesaikan {label} dalam <b>{time}</b> — rekor terbaikmu masih {best}.",
  },
  "results.speedrunFailBanner": {
    en: "💀 <b>Speedrun Failed</b> — too many mistakes (question {current} of {total}). Try again!",
    id: "💀 <b>Speedrun Gagal</b> — kebanyakan salah (soal ke-{current} dari {total}). Coba lagi!",
  },
  "results.defaultName": {
    en: "you",
    id: "kamu",
  },
  "results.chibiPerfect": {
    en: "Perfect, {name}! Not a single mistake!",
    id: "Sempurna, {name}! Nggak ada yang salah sama sekali!",
  },
  "results.chibiSpeedrunRecord": {
    en: "New record, {name}! {time} — your fingers are on fire!",
    id: "Rekor baru, {name}! {time} — jarimu ngebut banget!",
  },
  "results.chibiSpeedrunFirst": {
    en: "Your first record is on the board, {name}! Now try to beat it.",
    id: "Rekor pertamamu tercatat, {name}! Sekarang coba kalahkan sendiri ya.",
  },
  "results.chibiSpeedrunSlower": {
    en: "Flawless, {name}! Only {gap} off your best — one more run?",
    id: "Tanpa salah, {name}! Cuma {gap} dari rekormu — sekali lagi?",
  },
  "results.chibiSpeedrunFail": {
    en: "Oops, you slipped, {name}. Take a breath, then go again!",
    id: "Yah, kepeleset, {name}. Tarik napas, lalu gas lagi!",
  },
  "results.chibiConquestSuccess": {
    en: "You did it, {name}! {label} is yours — congratulations!",
    id: "Kamu berhasil, {name}! {label} resmi jadi milikmu — selamat!",
  },
  "results.chibiConquestFail": {
    en: "Don't give up, {name}! Review a little, then try again.",
    id: "Jangan menyerah, {name}! Ulas sebentar, lalu coba lagi.",
  },
  "results.statAccuracy": {
    en: "Accuracy",
    id: "Akurasi",
  },
  "results.statStreak": {
    en: "Best streak",
    id: "Beruntun terbaik",
  },
  "results.statTime": {
    en: "Your time",
    id: "Waktumu",
  },
  "results.statBest": {
    en: "Best record",
    id: "Rekor terbaik",
  },
  "results.badgeNewRecord": {
    en: "New record",
    id: "Rekor baru",
  },
  "results.badgeFirstRecord": {
    en: "First record",
    id: "Rekor pertama",
  },
  "results.badgeSpeedrunDone": {
    en: "Speedrun finished",
    id: "Speedrun selesai",
  },
  "results.badgeConquest": {
    en: "Conquest successful",
    id: "Penaklukan berhasil",
  },
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
    en: "Highest N5 rank reached — {emoji} {title} unlocks once N4 lessons arrive.",
    id: "Tingkatan N5 tertinggi tercapai — {emoji} {title} akan terbuka begitu lessons N4 hadir.",
  },
  "profile.highestReached": {
    en: "Highest rank reached — take the throne, Emperor! 👑",
    id: "Tingkatan tertinggi tercapai — bertahtalah, Emperor! 👑",
  },

  "borderStyle.heading": { en: "Theme Color", id: "Warna Tema" },

  "flash.importing": {
    en: "Reading your .apkg file…",
    id: "Membaca file .apkg kamu…",
  },
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
  "admin.loading.title": {
    en: "Loading…",
    id: "Memuat…",
  },
  "admin.loading.desc": {
    en: "One moment, checking your login session.",
    id: "Sebentar, lagi ngecek sesi login kamu.",
  },
  "admin.signedOut.title": {
    en: "Sign In Required",
    id: "Masuk Diperlukan",
  },
  "admin.signedOut.desc": {
    en: "Please sign in with your admin Google account\nto access the Tenka Admin Panel.",
    id: "Silakan login pakai akun Google admin\nuntuk mengakses Tenka Admin Panel.",
  },
  "admin.login.google": {
    en: "Login with Google",
    id: "Login with Google",
  },
  "admin.back.home": {
    en: "← Back to Home",
    id: "← Kembali ke Beranda",
  },
  "admin.denied.title": {
    en: "Admin Access Restricted",
    id: "Akses Admin Dibatasi",
  },
  "admin.denied.desc1": {
    en: "Your account doesn't have permission\nto access the Tenka Admin Panel.",
    id: "Akun kamu belum memiliki izin\nuntuk mengakses Tenka Admin Panel.",
  },
  "admin.denied.desc2": {
    en: "If you are an administrator,\nplease use the appropriate admin account.",
    id: "Jika kamu adalah administrator,\nsilakan gunakan akun admin yang sesuai.",
  },
  "admin.denied.switch": {
    en: "Switch account",
    id: "Ganti akun",
  },
  "admin.denied.current": {
    en: "Current account: {email}",
    id: "Akun saat ini: {email}",
  },
  "admin.session.expired": {
    en: "This account's session has expired. Remove it from the list, then add it again via Google login.",
    id: "Sesi akun ini sudah kedaluwarsa. Hapus dari daftar lalu tambahkan lagi lewat login Google.",
  },
  "admin.nav.dashboard": {
    en: "Dashboard",
    id: "Dashboard",
  },
  "admin.nav.stats": {
    en: "Statistics",
    id: "Statistik",
  },
  "admin.nav.users": {
    en: "Users",
    id: "Pengguna",
  },
  "admin.nav.lessons": {
    en: "Lessons",
    id: "Lessons",
  },
  "admin.nav.practice": {
    en: "Script Practice",
    id: "Script Practice",
  },
  "admin.nav.questions": {
    en: "Questions",
    id: "Soal",
  },
  "admin.nav.quotes": {
    en: "Quotes",
    id: "Kutipan",
  },
  "admin.nav.backToApp": {
    en: "Back to App",
    id: "Kembali ke Aplikasi",
  },
  "admin.nav.signOut": {
    en: "Sign out",
    id: "Sign out",
  },
  "admin.theme.toLight": {
    en: "Switch to light mode",
    id: "Ganti ke mode terang",
  },
  "admin.theme.toDark": {
    en: "Switch to dark mode",
    id: "Ganti ke mode gelap",
  },
  "admin.theme.light": {
    en: "Light mode",
    id: "Mode terang",
  },
  "admin.theme.dark": {
    en: "Dark mode",
    id: "Mode gelap",
  },
  "admin.lang.label": {
    en: "Language",
    id: "Bahasa",
  },
  "admin.switch.title": {
    en: "Switch account",
    id: "Ganti akun",
  },
  "admin.switch.sub": {
    en: "Quick switch",
    id: "Quick switch",
  },
  "admin.switch.add": {
    en: "Add account",
    id: "Tambah akun",
  },
  "admin.switch.remove": {
    en: "Remove {email} from list",
    id: "Hapus {email} dari daftar",
  },
  "admin.switch.removeHint": {
    en: "Remove from list (does not delete the account)",
    id: "Hapus dari daftar (tidak menghapus akunnya)",
  },
};
