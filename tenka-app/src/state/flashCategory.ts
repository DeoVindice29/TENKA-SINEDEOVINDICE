export type FlashRating = "again" | "hard" | "good" | "easy";

// New   = kartu belum pernah disentuh (belum pernah dirating)
// Learn = rating terakhir Again, Hard, atau Good
// Due   = rating terakhir Easy
// none  = nilai lastRating yang gak dikenal (data lama/rusak)
export type FlashCategory = "new" | "learn" | "due" | "none";

export function classifyCard(
  st: { lastRating?: string } | null | undefined,
): FlashCategory {
  if (!st || !st.lastRating) return "new";
  if (
    st.lastRating === "again" ||
    st.lastRating === "hard" ||
    st.lastRating === "good"
  )
    return "learn";
  if (st.lastRating === "easy") return "due";
  return "none";
}

// Kartu "siap muncul" = belum pernah disentuh, atau jadwal muncul lagi-nya
// (due) udah lewat. Dipakai BARENG oleh angka di deck picker dan antrean di
// dalam sesi, biar dua-duanya selalu ngitung kartu yang sama.
export function isCardReady(
  st: { due?: number } | null | undefined,
  now: number = Date.now(),
): boolean {
  return !st || !st.due || st.due <= now;
}
