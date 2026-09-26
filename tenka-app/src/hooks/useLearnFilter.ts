import { useEffect, useState, type RefObject } from "react";

export type LearnChip = { id: string; label: string };

export type LearnFilterResult = {
  /** satu chip per .learn-section yang sedang tampil di tab ini */
  chips: LearnChip[];
  /** id section yang tidak punya hasil cocok (chip-nya diredupkan) */
  noMatchIds: string[];
  /** total item yang cocok dengan pencarian */
  total: number;
  /** id grup accordion (Kotoba) yang punya hasil cocok */
  matchingGroupIds: string[];
};

/**
 * Hasil pencarian yang sudah dihitung dari DATA, bukan DOM. Dipakai tab Kotoba:
 * panel accordion-nya di-mount malas, jadi kartu di Chapter yang masih tertutup
 * tidak ada di DOM dan tidak bisa dihitung dari sana.
 */
export type LearnFilterOverride = LearnFilterResult;

function sameList<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Pencarian + navigasi chip di layar Learn.
 *
 * Konten Learn dirender oleh banyak komponen (GojuonTable, KanjiGrid,
 * VocabList, GrammarCard, ...), jadi filternya bekerja langsung di DOM hasil
 * render — sama seperti versi vanilla: item yang tidak cocok diberi class
 * `no-match` (CSS-nya sudah ada, display: none), begitu juga label baris
 * tabel, pemisah kategori, section, dan grup accordion yang seluruh isinya
 * tidak cocok. Class ini hanya di-toggle di elemen yang className-nya statis
 * di React, jadi tidak tertimpa saat re-render.
 */
export function useLearnFilter(
  rootRef: RefObject<HTMLElement | null>,
  scriptKey: string,
  lang: string,
  query: string,
  override?: LearnFilterOverride | null,
  /** berubah tiap ada panel accordion yang baru di-mount, biar filter diulang */
  mountSignal?: unknown,
): LearnFilterResult {
  const [chips, setChips] = useState<LearnChip[]>([]);
  const [noMatchIds, setNoMatchIds] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [matchingGroupIds, setMatchingGroupIds] = useState<string[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = query.trim().toLowerCase();
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>(".learn-section"),
    );

    const nextChips: LearnChip[] = sections.map((sectionEl, idx) => {
      // section Kotoba sudah punya id stabil dari komponennya
      if (!sectionEl.id) sectionEl.id = `learn-sec-${scriptKey}-${idx}`;
      // teks node pertama di judul = nama section (tanpa hitungan "14 karakter")
      const titleEl = sectionEl.querySelector(".learn-section-title");
      const label = titleEl?.childNodes[0]?.textContent?.trim() || `#${idx + 1}`;
      return { id: sectionEl.id, label };
    });

    let totalMatches = 0;
    const nextNoMatch: string[] = [];

    sections.forEach((sectionEl) => {
      const items = sectionEl.querySelectorAll<HTMLElement>(
        ".kana-cell.filled, .kanji-cell, .grammar-card",
      );
      let sectionMatches = 0;
      items.forEach((item) => {
        const isMatch =
          !q || (item.textContent ?? "").toLowerCase().includes(q);
        item.classList.toggle("no-match", !isMatch);

        if (item.classList.contains("grammar-card")) {
          // kartu vocab/bunpo: tandai cuma bagian teks yang benar-benar
          // cocok (kata, bacaan, arti, atau chip segmen), bukan seluruh
          // kartu — biar mirip highlight kata, bukan border kotak besar.
          item
            .querySelectorAll<HTMLElement>(
              ".vocab-word, .vocab-kanji, .vocab-reading, .grammar-meaning, .grammar-pattern",
            )
            .forEach((field) => {
              const fieldMatch =
                !!q && (field.textContent ?? "").toLowerCase().includes(q);
              field.classList.toggle("search-hit", fieldMatch);
            });
          item.querySelectorAll<HTMLElement>(".segment-chip").forEach((chip) => {
            const chipMatch =
              !!q && (chip.textContent ?? "").toLowerCase().includes(q);
            chip.classList.toggle("search-hit", chipMatch);
          });
        } else {
          // kana-cell / kanji-cell: satu sel = satu karakter, jadi seluruh
          // selnya sekalian yang jadi "chip" penandanya.
          item.classList.toggle("search-hit", !!q && isMatch);
        }

        if (isMatch) {
          sectionMatches++;
          totalMatches++;
        }
      });

      // label baris gojuon (K, S, T, ...) ada di luar .kana-cell — sembunyikan
      // juga kalau semua sel di barisnya tidak cocok
      sectionEl.querySelectorAll<HTMLElement>(".kana-row").forEach((rowEl) => {
        const filled = Array.from(
          rowEl.querySelectorAll<HTMLElement>(".kana-cell.filled"),
        );
        const rowHasMatch = filled.some(
          (cell) => !cell.classList.contains("no-match"),
        );
        rowEl.classList.toggle("no-match", filled.length > 0 && !rowHasMatch);
      });

      // pemisah kategori Kotoba: ikut disembunyikan kalau semua kartu di
      // bawahnya tidak cocok, biar tidak ada judul kategori yang mengambang.
      sectionEl
        .querySelectorAll<HTMLElement>(".vocab-cat-divider")
        .forEach((dividerEl) => {
          let runHasMatch = false;
          let sib = dividerEl.nextElementSibling;
          while (sib && !sib.classList.contains("vocab-cat-divider")) {
            if (
              sib.classList.contains("grammar-card") &&
              !sib.classList.contains("no-match")
            ) {
              runHasMatch = true;
              break;
            }
            sib = sib.nextElementSibling;
          }
          dividerEl.classList.toggle("no-match", !runHasMatch);
        });

      const sectionNoMatch = items.length > 0 && sectionMatches === 0;
      sectionEl.classList.toggle("no-match", sectionNoMatch);
      if (sectionNoMatch) nextNoMatch.push(sectionEl.id);
    });

    // grup accordion (Kotoba): tampil & terbuka hanya kalau ada section cocok.
    // Kalau ada override (dari data), pakai itu — panel yang belum di-mount
    // tidak punya .learn-section untuk diperiksa.
    const nextGroups: string[] = [];
    root.querySelectorAll<HTMLElement>(".tier-group").forEach((groupEl) => {
      const gid = groupEl.dataset.groupId;
      const hasMatch = override
        ? !!gid && override.matchingGroupIds.includes(gid)
        : !!q && !!groupEl.querySelector(".learn-section:not(.no-match)");
      groupEl.classList.toggle("no-match", !!q && !hasMatch);
      if (hasMatch && gid) nextGroups.push(gid);
    });

    if (override) {
      setChips((prev) =>
        sameList(prev, override.chips) ? prev : override.chips,
      );
      setNoMatchIds((prev) =>
        sameList(prev, override.noMatchIds) ? prev : override.noMatchIds,
      );
      setTotal(override.total);
      setMatchingGroupIds((prev) =>
        sameList(prev, override.matchingGroupIds)
          ? prev
          : override.matchingGroupIds,
      );
      return;
    }

    setChips((prev) => (sameList(prev, nextChips) ? prev : nextChips));
    setNoMatchIds((prev) => (sameList(prev, nextNoMatch) ? prev : nextNoMatch));
    setTotal(totalMatches);
    setMatchingGroupIds((prev) =>
      sameList(prev, nextGroups) ? prev : nextGroups,
    );
  }, [rootRef, scriptKey, lang, query, override, mountSignal]);

  return { chips, noMatchIds, total, matchingGroupIds };
}
