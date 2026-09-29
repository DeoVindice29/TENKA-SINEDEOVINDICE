# Chibi expressions

Taruh gambar-gambar chibi di sini (`.png` / `.jpg` / `.webp`) — otomatis
kepakai di dua tempat:

1. Kartu catatan (note card) quiz — ambil satu secara acak/stabil per soal.
   Lihat `getRandomChibiAvatar()` di `src/lib/chibiAvatar.ts`.
2. ChibiGuide, si peri pemandu di popup Misi Pangkat — ambil pose spesifik
   sesuai nama file (mis. `pointing.webp`, `happy.webp`, `celebrate.webp`,
   `proud.webp`) lewat `getChibiAvatarByName()`. Nama file (tanpa ekstensi,
   case-insensitive) = nama ekspresinya.

Selama folder ini kosong, kedua fitur di atas fallback ke placeholder
bawaan / gak nampilin apa-apa — gak akan error.
