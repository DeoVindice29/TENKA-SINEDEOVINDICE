import type { FlashRating } from "./flashCategory";

// `interval` disimpan dalam HARI, jadi menit = pecahan hari.
export const FLASH_MINUTE_IN_DAYS = 1 / (60 * 24);

// Berapa menit kartu "ditahan" sebelum masuk lagi ke antrean Learn:
//   Again = 0 (langsung masuk antrean, posisi acak)
//   Hard  = 1 menit
//   Good  = 5 menit
// Easy keluar dari Learn dan jadi Due (1 hari, lalu tumbuh kalau Easy lagi).
export const LEARN_STEP_MINUTES = { again: 0, hard: 1, good: 5 } as const;

// Dipakai oleh rateCard() (yang nyimpen) DAN label di tombol (yang nampilin),
// jadi angka di tombol pasti sama dengan yang beneran ke-save.
export function nextInterval(
  st: { ef: number; interval: number; reps: number },
  rating: FlashRating,
): number {
  switch (rating) {
    case "again":
    case "hard":
    case "good":
      return LEARN_STEP_MINUTES[rating] * FLASH_MINUTE_IN_DAYS;
    case "easy": {
      if (!st.reps) return 1;
      const ef = Math.min(3.2, (st.ef || 2.5) + 0.15);
      return Math.max(1, Math.round((st.interval || 0) * ef * 1.3));
    }
  }
}

// Data lama: kartu yang dijawab Again/Hard/Good pakai aturan waktu yang lama
// (bisa sampai 1 hari) nyangkut nunggu jadwal lama. Di sini jadwalnya
// dipotong ke aturan baru (dihitung dari waktu terakhir dijawab).
export function capLearnDue(st: {
  lastRating?: string;
  lastReviewed?: number;
  due: number;
  interval: number;
}): void {
  const r = st.lastRating;
  if (r !== "again" && r !== "hard" && r !== "good") return;
  if (!st.lastReviewed) return;
  const minutes = LEARN_STEP_MINUTES[r];
  const cap = st.lastReviewed + minutes * 60_000;
  if (st.due > cap) {
    st.due = cap;
    st.interval = minutes * FLASH_MINUTE_IN_DAYS;
  }
}
