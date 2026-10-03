// Kutipan umum si chibi di header popup Misi Pangkat. Tiap kutipan punya
// ekspresi chibi sendiri — nama file di src/assets/chibi/, tanpa ekstensi —
// dan daftar KEADAAN PROGRES yang cocok buatnya, supaya kata-katanya tidak
// pernah bertentangan dengan progres user (mis. "conquest berikutnya sudah di
// depan mata" tidak muncul kalau semua conquest N5 sudah tuntas, atau "setiap
// conquest yang kamu selesaikan pantas dirayakan" tidak muncul kalau belum ada
// satu pun yang selesai). Teksnya ada di I18N.ts (guide.quote.N), en + id.
//
// Keadaan progres (lihat data/chibiGuide.ts):
//   start — belum ada conquest yang ditaklukkan
//   mid   — sudah ada yang beres, dan masih >1 conquest tersisa di grup aktif
//   last  — tinggal 1 conquest lagi buat naik ke pangkat berikutnya
//   done  — semua conquest N5 sudah ditaklukkan

export type ProgressState = "start" | "mid" | "last" | "done";

export type ChibiQuote = {
  /** kunci i18n teks kutipan */
  messageKey: string;
  /** nama file ekspresi chibi (tanpa ekstensi) */
  expression: string;
  /** keadaan progres di mana kutipan ini boleh muncul */
  states: readonly ProgressState[];
};

const ALL: readonly ProgressState[] = ["start", "mid", "last", "done"];
const ONGOING: readonly ProgressState[] = ["start", "mid", "last"];
const HAS_PROGRESS: readonly ProgressState[] = ["mid", "last", "done"];

export const CHIBI_QUOTES: ChibiQuote[] = [
  { messageKey: "guide.quote.0", expression: "its-time", states: ALL },
  { messageKey: "guide.quote.1", expression: "spirit", states: ONGOING },
  { messageKey: "guide.quote.2", expression: "write", states: ALL },
  { messageKey: "guide.quote.3", expression: "proud", states: ALL },
  { messageKey: "guide.quote.4", expression: "thinking", states: ONGOING },
  { messageKey: "guide.quote.5", expression: "ready", states: ONGOING },
  { messageKey: "guide.quote.6", expression: "drink", states: ONGOING },
  { messageKey: "guide.quote.7", expression: "cute", states: ALL },
  { messageKey: "guide.quote.8", expression: "nerd", states: ALL },
  { messageKey: "guide.quote.9", expression: "happy", states: ONGOING },
  { messageKey: "guide.quote.10", expression: "impressed", states: HAS_PROGRESS },
  { messageKey: "guide.quote.11", expression: "pointing", states: ONGOING },
  { messageKey: "guide.quote.12", expression: "rest", states: ALL },
  { messageKey: "guide.quote.13", expression: "love", states: ALL },
  { messageKey: "guide.quote.14", expression: "celebrate", states: HAS_PROGRESS },
];
