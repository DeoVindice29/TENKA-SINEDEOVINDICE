// Chibi expression avatars dipakai di kartu catatan (note card) quiz, dan
// juga di ChibiGuide (peri pemandu di popup Misi Pangkat, lihat
// src/components/RankMissions/ChibiGuide.tsx).
//
// Cukup taruh file gambar (.png/.jpg/.jpeg/.webp) di src/assets/chibi/ —
// otomatis kedetect via import.meta.glob, nggak perlu sentuh kode ini lagi.
// Selama foldernya masih kosong, getRandomChibiAvatar() balikin null dan
// komponen pemanggil akan fallback ke ilustrasi placeholder bawaan.
const modules = import.meta.glob("/src/assets/chibi/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const CHIBI_AVATARS = Object.values(modules);

// Map nama ekspresi (nama file tanpa ekstensi, mis. "happy", "pointing") ke
// URL gambarnya — dipakai ChibiGuide buat milih pose spesifik sesuai
// konteks (progress misi, tips, dst), bukan acak seperti di quiz.
const CHIBI_BY_NAME: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const match = path.match(/\/([^/]+)\.[a-zA-Z0-9]+$/);
  if (match) CHIBI_BY_NAME[match[1].toLowerCase()] = url;
}

/**
 * Ambil satu avatar chibi. `seed` (opsional) dipakai biar avatarnya stabil
 * selama satu soal yang sama (mis. index soal saat ini) alih-alih ganti-ganti
 * tiap kali komponennya re-render.
 */
export function getRandomChibiAvatar(seed?: number): string | null {
  if (CHIBI_AVATARS.length === 0) return null;
  const idx =
    seed === undefined
      ? Math.floor(Math.random() * CHIBI_AVATARS.length)
      : Math.abs(seed) % CHIBI_AVATARS.length;
  return CHIBI_AVATARS[idx];
}

/**
 * Ambil avatar chibi berdasarkan nama ekspresi spesifik (mis. "happy",
 * "pointing", "celebrate" — cocok sama nama file di src/assets/chibi/,
 * tanpa ekstensi, case-insensitive). Balikin null kalau nama itu belum
 * ada file-nya (mis. koleksinya belum lengkap) atau folder-nya kosong.
 */
export function getChibiAvatarByName(name: string): string | null {
  return CHIBI_BY_NAME[name.toLowerCase()] ?? null;
}
