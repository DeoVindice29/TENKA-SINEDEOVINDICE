// Kutipan/tips singkat yang tampil bergantian di kartu promo sidebar
// (di bawah menu, di atas ilustrasi Fuji). Untuk sekarang isinya statis
// di file ini — nanti kalau admin panel sudah punya CRUD buat konten ini
// (misal tabel Supabase "sidebar_quotes"), cukup ganti cara array ini
// di-supply (fetch dari Supabase lalu fallback ke SIDEBAR_QUOTES kalau
// kosong/offline), tanpa perlu ubah logic rotasi di Sidebar.tsx.
export type SidebarQuote = {
  id: string;
  /** Tiap item = satu baris (di-render dengan <br /> di antaranya), per bahasa. */
  lines: {
    en: string[];
    id: string[];
  };
};

export const SIDEBAR_QUOTES: SidebarQuote[] = [
  {
    id: "small-steps",
    lines: {
      en: ["Small steps", "every day", "build big progress."],
      id: ["Langkah kecil", "setiap hari", "membangun progres besar."],
    },
  },
  {
    id: "consistency",
    lines: {
      en: ["Consistency beats", "intensity.", "Show up daily."],
      id: ["Konsistensi mengalahkan", "intensitas.", "Rutin tiap hari aja."],
    },
  },
  {
    id: "one-word",
    lines: {
      en: ["One new word today", "is one less word", "tomorrow."],
      id: ["Satu kata baru hari ini", "berarti satu kata", "lebih sedikit besok."],
    },
  },
  {
    id: "mistakes",
    lines: {
      en: ["Mistakes are proof", "you're trying.", "Keep going."],
      id: ["Salah itu bukti", "kamu udah coba.", "Terus lanjut."],
    },
  },
  {
    id: "fluency",
    lines: {
      en: ["Fluency is a marathon,", "not a sprint.", "Pace yourself."],
      id: ["Lancar berbahasa itu maraton,", "bukan lari cepat.", "Atur ritmemu."],
    },
  },
];
