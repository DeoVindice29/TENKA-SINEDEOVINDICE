import { getChibiAvatarByName } from "@/lib/chibiAvatar";

type Props = {
  /** nama file ekspresi di src/assets/chibi/ (tanpa ekstensi) */
  expression: string;
};

// Peri pemandu di header popup Misi Pangkat: chibi di dalam kotak pastel
// berlekuk. Ucapannya ditampilin sebagai bubble di sebelahnya (lihat
// RankMissionsModal), jadi gambar ini dekoratif (alt kosong). Kalau file
// ekspresi yang diminta belum ada, fallback ke "cute" atau "happy" — dan
// kalau koleksinya kosong total, kotaknya tampil tanpa gambar.
export default function ChibiGuide({ expression }: Props) {
  const chibiSrc =
    getChibiAvatarByName(expression) ??
    getChibiAvatarByName("cute") ??
    getChibiAvatarByName("happy");

  return (
    <div className="rm-chibi">
      <span className="rm-chibi-spark rm-chibi-spark--a" aria-hidden="true" />
      <span className="rm-chibi-spark rm-chibi-spark--b" aria-hidden="true" />
      {chibiSrc && (
        <img
          key={expression}
          src={chibiSrc}
          alt=""
          className="rm-chibi-img"
        />
      )}
    </div>
  );
}
