import { useQuiz } from "@/state/QuizContext";
import AdminSkipTools from "@/components/Admin/AdminSkipTools";

// Tombol skip admin buat semua jenis kuis (Penaklukan, Speedrun, kuis biasa,
// Latihan Tipe Soal). Dirender di samping QuizScreen — jadi tetap kelihatan
// di layar cerita antar-Tier juga, bukan cuma pas ada soal.
export default function AdminQuizTools() {
  const { state, dispatch } = useQuiz();

  // queue kosong / sudah habis → layar hasil yang tampil, gak perlu tombolnya
  if (state.queue.length === 0 || state.index >= state.queue.length) {
    return null;
  }

  const current = state.queue[state.index];
  const b = state.conquestPhaseBoundaries;

  // sama persis dengan penentuan layar cerita antar-Tier di QuizScreen
  const pendingPhaseIdx =
    state.conquest && b && state.index > 0 ? b.indexOf(state.index) : -1;

  const skipOne = () => {
    // lagi di layar cerita Tier berikutnya → anggap "Mulai Tier" ditekan,
    // biar penanda Tier aktif (dipakai hitungan tier JLPT) tetap sinkron
    if (pendingPhaseIdx !== -1 && pendingPhaseIdx !== state.conquestPhaseIndex) {
      dispatch({ type: "ENTER_PHASE", phaseIndex: pendingPhaseIdx });
    }
    if (state.answered) {
      dispatch({
        type:
          state.conquestFailed || state.speedrunFailed
            ? "FAIL_QUIZ"
            : "NEXT_QUESTION",
      });
      return;
    }
    dispatch({ type: "ANSWER", chosen: current[1] });
    dispatch({ type: "NEXT_QUESTION" });
  };

  // Tier yang "sedang berjalan": kalau lagi di layar cerita bagian
  // berikutnya, itulah yang di-skip; kalau tidak, bagian yang sedang dikerjakan.
  const hasPhases = !!state.conquest && !!b && b.length >= 2;
  const activePhaseIdx =
    pendingPhaseIdx !== -1 && pendingPhaseIdx !== state.conquestPhaseIndex
      ? pendingPhaseIdx
      : state.conquestPhaseIndex;

  return (
    <AdminSkipTools
      onSkipOne={skipOne}
      onSkipPhase={
        hasPhases
          ? () =>
              dispatch({ type: "ADMIN_SKIP_PHASE", phaseIndex: activePhaseIdx })
          : undefined
      }
      onSkipAll={() => dispatch({ type: "ADMIN_SKIP_ALL" })}
    />
  );
}
