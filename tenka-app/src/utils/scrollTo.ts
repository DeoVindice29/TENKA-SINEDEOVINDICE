// Helper kecil buat auto-scroll ke section berikutnya begitu user
// bikin pilihan (tier, variant, difficulty, timer, dst). Dipakai di
// semua picker biar behavior-nya konsisten di seluruh alur StartScreen.
//
// requestAnimationFrame dipakai supaya scroll jalan SETELAH React
// selesai re-render (misal elemen yang tadinya disabled jadi enabled,
// atau konten baru muncul), jadi posisi scroll-nya akurat.
export function scrollToId(
  id: string,
  options: ScrollIntoViewOptions = { behavior: "smooth", block: "start" },
) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView(options);
  });
}
