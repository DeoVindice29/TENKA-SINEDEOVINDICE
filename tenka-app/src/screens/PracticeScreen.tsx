import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { SCRIPTS } from "@/data/scripts";
import PracticeSheet from "@/components/Practice/PracticeSheet";
import ScrollTopButton from "@/components/ScrollTopButton";
import {
  isJlptScript,
  JLPT_SCRIPTS,
  practiceCount,
  practiceTypesFor,
  type JlptScriptKey,
  type PracticeTypeKey,
} from "@/data/jlptConquest";
import PageHero from "@/components/PageHero";

// Latihan Tipe Soal — section terpisah (dibuka dari tombol di kanan atas, sama
// seperti Flashcard). Isinya tipe-tipe soal Penaklukan yang bisa dilatih
// sendiri-sendiri, untuk Basic Kotoba, Bunpō, dan Kanji N5. Daftar tipe tiap
// aksara diambil dari data/jlptConquest.ts (sama dengan tier Penaklukan-nya).
//
// Setelah menekan Mulai, soal tampil sebagai SATU lembar yang di-scroll ke bawah
// (kayak Google Form) lewat <PracticeSheet>, bukan kuis satu-satu lagi.

const TYPE_ICONS: Record<PracticeTypeKey, string> = {
  meaning: "📜",
  reading: "🔤",
  write: "🖌️",
  fill: "✍️",
  usage: "🧩",
  similar: "🔁",
  particle: "🔤",
  conjugation: "✍️",
  transform: "🔁",
};

// Pilihan jumlah soal: 10 / 20 selama masih di bawah total, lalu "Semua".
function countSteps(total: number): number[] {
  const steps = [10, 20].filter((n) => n < total);
  steps.push(total);
  return steps;
}

export default function PracticeScreen() {
  const { t } = useLang();
  const { currentScript, setSessionActive } = useUI();

  // Buka Practice dengan script yang sedang aktif di Home (kalau termasuk
  // JLPT), mis. dari kartu "Go to Practice" milik Basic Bunpō.
  const [script, setScript] = useState<JlptScriptKey>(
    isJlptScript(currentScript) ? currentScript : "kotoba",
  );
  const [pickedType, setPickedType] = useState<PracticeTypeKey | null>(null);
  const [count, setCount] = useState(10);
  // Teks mentah yang lagi diketik di kotak "ketik sendiri" — null kalau kotak
  // itu lagi gak difokus/gak dipakai (biar gak dipaksa ke-clamp tiap huruf).
  const [customDraft, setCustomDraft] = useState<string | null>(null);

  const types = useMemo(() => practiceTypesFor(script), [script]);
  const totals = useMemo(
    () =>
      Object.fromEntries(types.map((k) => [k, practiceCount(script, k)])) as Record<
        PracticeTypeKey,
        number
      >,
    [script, types],
  );

  // tipe yang dipilih tidak ada di aksara ini (mis. pindah dari Bunpō ke Kanji)
  // → pakai tipe pertama
  const type = pickedType && types.includes(pickedType) ? pickedType : types[0];
  const total = totals[type];
  const steps = countSteps(total);
  // jumlah soal aktif = angka yang dipilih, dibatasi 1..total (biar angka
  // custom yang ketinggalan dari tipe/aksara sebelumnya gak pernah kebablasan)
  const activeCount = total > 0 ? Math.min(Math.max(count, 1), total) : 0;
  const isCustomActive = total > 0 && !steps.includes(activeCount);

  const commitCustomDraft = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) {
      setCount(total > 0 ? Math.min(n, total) : n);
    }
    setCustomDraft(null);
  };

  // lembar soal yang lagi dikerjakan (null = masih di layar pengaturan)
  const [sheet, setSheet] = useState<{ count: number } | null>(null);

  const start = () => setSheet({ count: activeCount });

  // selama lembar soal terbuka: sembunyikan tombol Conquests di topbar
  const sheetOpen = sheet !== null;
  useEffect(() => {
    setSessionActive(sheetOpen);
    return () => setSessionActive(false);
  }, [sheetOpen, setSessionActive]);

  // Lembar soal: hero disembunyikan biar fokus ke soal
  if (sheet) {
    return (
      <section id="screen-practice">
        <PracticeSheet
          key={`${script}:${type}:${sheet.count}`}
          script={script}
          type={type}
          icon={TYPE_ICONS[type]}
          count={sheet.count}
          onBack={() => setSheet(null)}
        />
        <ScrollTopButton id="btn-practice-scrolltop" />
      </section>
    );
  }

  return (
    <section id="screen-practice">
      <PageHero
        variant="practice"
        eyebrow={t("practice.eyebrow")}
        title={t("practice.title")}
        sub={t("practice.sub")}
      />

      <div className="quiz-variant-picker practice-script-picker">
        <span className="settings-label">{t("practice.scriptLabel")}</span>
        <div className="quiz-variant-options practice-seg">
          {JLPT_SCRIPTS.map((k) => (
            <button
              key={k}
              type="button"
              className={`quiz-variant-btn ${script === k ? "active" : ""}`}
              onClick={() => setScript(k)}
            >
              {SCRIPTS[k].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flash-section-label">{t("quiz.typeLabel")}</div>
      <div className="flash-deck-grid practice-fade" key={script}>
        {types.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={type === k}
            className={`flash-deck-card practice-type-card ${
              type === k ? "active" : ""
            }`}
            onClick={() => setPickedType(k)}
          >
            <span className="flash-deck-glyph">{TYPE_ICONS[k]}</span>
            <span className="flash-deck-info">
              <span className="flash-deck-name">
                {t(`practice.${script}.${k}`)}
              </span>
              <span className="flash-deck-count">
                {t(`practice.${script}.${k}Desc`)} · <b>{totals[k]}</b>{" "}
                {t("practice.questions")}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="quiz-variant-picker practice-count-picker">
        <span className="settings-label">{t("practice.countLabel")}</span>
        <div className="quiz-variant-options practice-seg">
          {steps.map((n) => (
            <button
              key={n}
              type="button"
              className={`quiz-variant-btn ${
                !isCustomActive && activeCount === n ? "active" : ""
              }`}
              onClick={() => {
                setCount(n);
                setCustomDraft(null);
              }}
            >
              {n === total ? t("practice.all", { count: n }) : n}
            </button>
          ))}
          <input
            type="number"
            inputMode="numeric"
            className={`quiz-variant-btn practice-count-input ${
              isCustomActive ? "active" : ""
            }`}
            aria-label={t("practice.customCountAria")}
            placeholder={t("practice.customCount")}
            min={1}
            max={total || 1}
            disabled={total === 0}
            value={customDraft ?? (isCustomActive ? String(activeCount) : "")}
            onChange={(e) => setCustomDraft(e.target.value)}
            onFocus={(e) => setCustomDraft(e.target.value)}
            onBlur={(e) => commitCustomDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        </div>
      </div>

      <button
        className="primary"
        id="btn-start"
        type="button"
        disabled={total === 0}
        onClick={start}
      >
        {t("practice.start", { count: activeCount })}
      </button>

      <ScrollTopButton id="btn-practice-scrolltop" />
    </section>
  );
}
