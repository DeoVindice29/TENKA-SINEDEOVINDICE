import type { CSSProperties } from "react";

/**
 * Komponen loading bersama — dipakai di semua tempat yang menunggu data
 * (login, Lessons, N4, panel admin, sinkron progres, import flashcard).
 * Warna ikut variabel tema (--indigo, --ink, ...) jadi otomatis cocok di
 * mode terang/gelap/custom. Animasi dimatikan kalau OS minta reduced motion.
 */

// ---------------------------------------------------------------- spinner

export function Spinner({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`tk-spinner ${className}`.trim()}
      style={{ "--tk-spinner-size": `${size}px` } as CSSProperties}
      aria-hidden="true"
    />
  );
}

// ----------------------------------------------------------------- sakura

// Lima kelopak bunga sakura yang menyala bergantian mengelilingi pusat.
// Ini "wajah" loading Tenka: dipakai di layar penuh & blok loading konten.
const PETAL =
  "M24 24C17 19 15.5 9.5 21.4 5.2L24 8.2L26.6 5.2C32.5 9.5 31 19 24 24Z";

export function SakuraLoader({ size = 44 }: { size?: number }) {
  return (
    <svg
      className="tk-sakura"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={PETAL}
          transform={`rotate(${i * 72} 24 24)`}
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
      <circle cx="24" cy="24" r="2.2" className="tk-sakura-core" />
    </svg>
  );
}

// ------------------------------------------------------------ loading box

/** Spinner + teks, di tengah. Buat area konten yang belum ada isinya. */
export function LoadingState({
  label,
  hint,
  compact = false,
}: {
  label: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`tk-loading${compact ? " tk-loading--compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      {compact ? <Spinner size={16} /> : <SakuraLoader size={44} />}
      <p className="tk-loading-label">{label}</p>
      {hint && <p className="tk-loading-hint">{hint}</p>}
    </div>
  );
}

/** Spinner kecil + teks dalam satu baris (mis. di samping tombol/judul). */
export function InlineLoading({ label }: { label: string }) {
  return (
    <span className="tk-inline-loading" role="status" aria-live="polite">
      <Spinner size={14} />
      <span>{label}</span>
    </span>
  );
}

// --------------------------------------------------------------- skeleton

/** Satu batang abu-abu yang berkilau; ukuran lewat style/prop. */
export function Skeleton({
  width,
  height = 14,
  radius,
  className = "",
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
}) {
  return (
    <span
      className={`tk-skel ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/**
 * Kerangka daftar accordion (bentuknya mirip Chapter/Sub Chapter di layar
 * Lessons & N4) + label "Memuat…" di atasnya.
 */
export function LessonsLoading({
  label,
  rows = 4,
}: {
  label: string;
  rows?: number;
}) {
  return (
    <div className="tk-lessons-loading" aria-busy="true">
      <LoadingState label={label} compact />
      <div className="tk-skel-list" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div
            className="tk-skel-card"
            key={i}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <Skeleton width={68} height={24} radius={999} />
            <div className="tk-skel-card-text">
              <Skeleton width={`${46 + ((i * 19) % 28)}%`} height={14} />
              <Skeleton width={`${26 + ((i * 11) % 22)}%`} height={11} />
            </div>
            <Skeleton width={14} height={14} radius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ layar penuh

/** Dipakai AuthGate saat sesi login masih dicek — gelap, senada layar login. */
export function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="tk-fullscreen" role="status" aria-live="polite">
      <div className="tk-fullscreen-inner">
        <SakuraLoader size={56} />
        <span className="tk-fullscreen-mark">天下</span>
        <p className="tk-fullscreen-label">{label}</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- bar sinkron

/** Garis tipis di paling atas layar selama data akun masih ditarik. */
export function SyncBar({ label }: { label: string }) {
  return (
    <div className="tk-syncbar" role="status" aria-live="polite">
      <span className="tk-syncbar-track" aria-hidden="true">
        <span className="tk-syncbar-fill" />
      </span>
      <span className="tk-sr-only">{label}</span>
    </div>
  );
}
