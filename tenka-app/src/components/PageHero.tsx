type PageHeroProps = {
  /** menentukan gambar latar banner */
  variant: "learn" | "flash" | "practice";
  eyebrow: string;
  title: string;
  sub: string;
};

// Header halaman (Belajar / Flashcards / Latihan Soal) — pakai kartu banner
// yang sama dengan Home: eyebrow di atas, judul, lalu deskripsi, rata kiri.
export default function PageHero({ variant, eyebrow, title, sub }: PageHeroProps) {
  return (
    <header className="page-hero-wrap">
      <div className={`hero-card page-hero page-hero--${variant}`}>
        <div className="hero-text">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p className="sub">{sub}</p>
        </div>
      </div>
    </header>
  );
}
