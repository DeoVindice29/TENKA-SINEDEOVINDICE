import { LANG_KEY, type Lang } from "@/i18n/I18N";
import type { Bilingual } from "@/data/types";

/**
 * Bahasa aktif untuk isi soal kuis & Penaklukan (arti kata, terjemahan
 * kalimat, catatan cara pakai, dst).
 *
 * Data kuis dibangun di luar React (module SCRIPTS, registerQuizView,
 * jlptConquest), jadi tidak bisa memanggil useLang(). Modul ini menyimpan
 * bahasa yang sama dengan LangProvider (disinkronkan lewat setQuizLang) dan
 * memberi tahu pembangun data supaya mereka menyusun ulang isi soalnya.
 */

function readStored(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === "id" || stored === "en" ? stored : "en";
  } catch {
    return "en";
  }
}

let current: Lang = readStored();
const listeners = new Set<() => void>();

export function getQuizLang(): Lang {
  return current;
}

export function setQuizLang(next: Lang): void {
  if (next === current) return;
  current = next;
  listeners.forEach((fn) => fn());
}

/** Dipanggil setiap bahasa berganti; mengembalikan fungsi untuk berhenti. */
export function onQuizLangChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Ambil teks {en, id} sesuai bahasa aktif (fallback ke bahasa lain). */
export function pickLang(
  entry: Bilingual | string | "" | null | undefined,
): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return (current === "id" ? entry.id || entry.en : entry.en || entry.id) || "";
}
