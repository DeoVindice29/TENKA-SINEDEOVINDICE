import { useAuth } from "@/state/AuthContext";

type Props = {
  /** skip 1 soal (dijawab benar otomatis, lanjut ke soal berikutnya) */
  onSkipOne?: () => void;
  /** lulusin seluruh Tier yang sedang berjalan (cuma di Penaklukan bertahap) */
  onSkipPhase?: () => void;
  skipPhaseLabel?: string;
  /** langsung selesaikan semuanya sebagai LULUS → layar hasil */
  onSkipAll: () => void;
  skipAllLabel?: string;
};

// Pill kecil "ADMIN" di pojok kiri-bawah layar kuis/Match — cuma muncul buat
// akun dev (role "dev" dari Supabase, lewat useAuth().isDev), supaya dev
// bisa ngecek semua tampilan (cerita Tier, layar hasil, naik pangkat,
// dll.) tanpa harus ngerjain soalnya satu-satu. User biasa gak dapet apa-apa.
export default function AdminSkipTools({
  onSkipOne,
  onSkipPhase,
  skipPhaseLabel = "Skip Tier",
  onSkipAll,
  skipAllLabel = "Skip semua",
}: Props) {
  const { isDev } = useAuth();
  if (!isDev) return null;

  return (
    <div className="admin-skip-tools" role="group" aria-label="Admin tools">
      <span className="admin-skip-tag">DEV</span>
      {onSkipOne && (
        <button
          type="button"
          className="admin-skip-btn"
          onClick={onSkipOne}
          title="Jawab benar otomatis & lanjut ke soal berikutnya"
        >
          ⏭ Skip soal
        </button>
      )}
      {onSkipPhase && (
        <button
          type="button"
          className="admin-skip-btn admin-skip-btn--phase"
          onClick={onSkipPhase}
          title="Lulusin semua soal di bagian ini & lanjut ke bagian berikutnya"
        >
          ⏩ {skipPhaseLabel}
        </button>
      )}
      <button
        type="button"
        className="admin-skip-btn admin-skip-btn--all"
        onClick={onSkipAll}
        title="Selesaikan semua soal sebagai lulus & langsung ke layar hasil"
      >
        ⏩ {skipAllLabel}
      </button>
    </div>
  );
}
