# 天下 Tenka

**Aplikasi belajar bahasa Jepang berbasis web** — dari Hiragana & Katakana sampai Kotoba, Bunpō, dan Kanji level N5. Dibungkus tema "ujian ksatria": kamu mulai sebagai rakyat biasa, menaklukkan ujian demi ujian, lalu naik pangkat.

🌐 **Demo:** [tenka-app.vercel.app](https://tenka-app.vercel.app)

> Antarmuka tersedia dalam **Bahasa Indonesia** dan **English**, dengan tampilan terang & gelap, serta dioptimalkan untuk layar HP.

---

## ✨ Fitur

### 📚 Materi
| Tab | Isi |
| --- | --- |
| **Hiragana** | 46 huruf dasar, dakuten & handakuten, serta yōon |
| **Katakana** | Sama seperti Hiragana, plus bunyi serapan |
| **Kotoba** | Kosakata N5 per sub chapter (kata ganti & sapaan, keluarga, profesi, waktu, bilangan, dst.) |
| **Bunpō** | Pola tata bahasa N5 beserta contoh kalimat |
| **Kanji** | Kanji N5 lengkap dengan bacaan dan arti |

### 🎮 Mode latihan
- **Kuis** dengan tiga tingkat kesulitan: *Easy* (4 pilihan), *Medium* (8 pilihan), *Hard* (ketik sendiri).
- **Timer** per soal (No Time / 3s / 5s / 10s) dan pilihan rentang soal.
- **Mode Match** — cocokkan huruf/kata dengan pasangannya ronde demi ronde.
- **Latihan Soal** dengan tipe soal yang bisa diatur (arti, romaji, bacaan, kalimat rumpang).

### ⚔️ Penaklukan (Conquest) & Speedrun
- Ujian bertingkat (Tier 1–3) dengan **alur cerita** — satu kali salah, langsung gagal.
- **Speedrun** semua huruf sekaligus dengan rekor waktu pribadi.
- Kotoba, Bunpō, dan Kanji memakai format ujian ala JLPT dengan batas kelulusan.

### 🃏 Flashcard (ala Anki)
- Pengulangan berjarak (*spaced repetition*) dengan rating Again / Hard / Good / Easy.
- Penanda kartu aktif: **Baru**, **Belajar**, atau **Ulang**.
- **Impor deck `.apkg`** milikmu sendiri.
- Pengaturan **putar audio otomatis** saat kartu dibalik.

### 🏆 Progres & motivasi
- **Pangkat** (Commoner → Knight → Baron → Viscount → …), **gelar**, dan **misi pangkat**.
- Halaman **Statistik**: streak, akurasi, waktu belajar, kartu dikuasai, jawaban yang sering salah, dan heatmap aktivitas 15 minggu.
- **Maskot chibi** yang memberi semangat dan menjelaskan fitur.

### 🔊 Audio
Pelafalan Jepang memakai **Text-to-speech bawaan perangkat** (Web Speech API). Kalau audio tidak keluar di HP, kemungkinan data suara Jepang belum terpasang — app menampilkan panduan singkat untuk memperbaikinya (juga tersedia di **Pengaturan → Tampilan → Flashcard**).

### ⚙️ Lainnya
- Login & sinkronisasi progres lewat **Supabase**.
- Pilihan font Jepang, tema warna kustom, dan bahasa antarmuka.
- Panel admin untuk pengelolaan konten dan statistik.

---

## 🛠️ Teknologi

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) sebagai bundler
- [Supabase](https://supabase.com) untuk autentikasi dan penyimpanan progres
- [sql.js](https://github.com/sql-js/sql.js) + [JSZip](https://stuk.github.io/jszip/) untuk membaca file `.apkg`
- [Oxlint](https://oxc.rs) untuk linting
- Deploy: **Vercel** dan **GitHub Pages**

---

## 🚀 Menjalankan secara lokal

Aplikasi ada di folder `tenka-app/`.

```bash
# 1. Clone repo
git clone https://github.com/DeoVindice29/TENKA-SINEDEOVINDICE.git
cd TENKA-SINEDEOVINDICE/tenka-app

# 2. Pasang dependensi
npm install

# 3. Siapkan environment (lihat bagian di bawah)
cp .env.example .env

# 4. Jalankan dev server
npm run dev
```

Buka `http://localhost:5173`.

### Environment variable

Salin `.env.example` menjadi `.env`, lalu isi dengan data dari project Supabase milikmu (Dashboard Supabase → *Project Settings* → *API*):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

> ⚠️ Jangan pernah commit file `.env` yang sudah terisi. File ini sudah masuk `.gitignore`.

### Database

Skema tabel ada di folder `tenka-app/supabase/` (`schema.sql`, `profiles.sql`, dan `migrations/`). Jalankan lewat *SQL Editor* di dashboard Supabase.

### Script yang tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan dev server |
| `npm run build` | Cek tipe (`tsc`) lalu build produksi ke `dist/` |
| `npm run preview` | Pratinjau hasil build |
| `npm run lint` | Menjalankan Oxlint |
| `npm run lint:fix` | Memperbaiki masalah lint otomatis |
| `npm run typecheck` | Cek tipe TypeScript saja |

---

## ☁️ Deploy

**Vercel** — import repo, atur *Root Directory* ke `tenka-app`, lalu isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di *Environment Variables*. Base path otomatis `/` saat build di Vercel.

**GitHub Pages** — workflow ada di `.github/workflows/deploy.yml`. Di luar Vercel, base path memakai `/TENKA-SINEDEOVINDICE/tenka-app/` (diatur di `vite.config.ts`). Tambahkan kedua variabel Supabase sebagai *repository secrets*.

---

## 📁 Struktur proyek

```
TENKA-SINEDEOVINDICE/
├── .github/workflows/     # CI/CD (deploy ke GitHub Pages)
└── tenka-app/
    ├── public/            # Aset statis (favicon, sql.js wasm, 404.html)
    ├── supabase/          # Skema database
    └── src/
        ├── components/    # Komponen UI (Quiz, Flashcard, Conquest, Settings, ...)
        ├── screens/       # Layar utama (Start, Quiz, Match, Flashcard, Statistik, ...)
        ├── data/          # Materi: hiragana, katakana, kotoba, bunpō, kanji, cerita
        ├── state/         # Context (UI, Quiz, Flashcard, Conquest, Auth)
        ├── hooks/         # Custom hooks (useSpeech, useLocalStorage, ...)
        ├── i18n/          # Teks Indonesia & English
        ├── lib/           # Helper & klien Supabase
        ├── styles/        # CSS
        ├── admin/         # Panel admin
        └── assets/        # Gambar, maskot chibi, ikon pangkat
```

---

## 🤝 Kontribusi

Saran dan laporan bug sangat diterima — silakan buka [Issue](https://github.com/DeoVindice29/TENKA-SINEDEOVINDICE/issues) atau kirim Pull Request.

---

<p align="center">© 2026 · Sine Deo Vindice</p>
