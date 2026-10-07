import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { SCRIPTS } from "@/data/scripts";
import PracticeSheet from "@/components/Practice/PracticeSheet";
import ScrollTopButton from "@/components/ScrollTopButton";
import {
  isJlptScript,
  JLPT_SCRIPTS,
  PRACTICE_MIXED,
  practiceModeCount,
  practiceModesFor,
  type JlptScriptKey,
  type PracticeModeKey,
} from "@/data/jlptConquest";
import PageHero from "@/components/PageHero";
import ContentSourceSwitch from "@/components/ContentSourceSwitch";
import { LoadingState } from "@/components/ui/Loader";
import { usePracticeSource } from "@/hooks/usePracticeSource";
import { soalCounts, soalRowsToQueue } from "@/lib/soalPractice";

// Latihan Tipe Soal — section terpisah (dibuka dari tombol di kanan atas, sama
// seperti Flashcard). Isinya tipe-tipe soal Penaklukan yang bisa dilatih
// sendiri-sendiri, untuk Basic Kotoba, Bunpō, dan Kanji N5. Daftar tipe tiap
// aksara diambil dari data/jlptConquest.ts (sama dengan tier Penaklukan-nya).
//
// Setelah menekan Mulai, soal tampil sebagai SATU lembar yang di-scroll ke bawah
// (kayak Google Form) lewat <PracticeSheet>, bukan kuis satu-satu lagi.
//
// Sumber soal dipilih lewat Level + Category (sama seperti Home/Lessons):
// "Topic" (N5) = soal bawaan app dari generator; Category lain = bank soal
// yang ditulis admin di Supabase (soal_entries_<level>).

const TYPE_ICONS: Record<PracticeModeKey, string> = {
  meaning: "📜",
  reading: "🔤",
  write: "🖌️",
  fill: "✍️",
  usage: "🧩",
  similar: "🔁",
  particle: "🔤",
  conjugation: "✍️",
  transform: "🔁",
  mixed: "🎲",
};

// Pilihan jumlah soal: 10 / 20 selama masih di bawah total, lalu "Semua".
function countSteps(total: number): number[] {
  const steps = [10, 20].filter((n) => n < total);
  steps.push(total);
  return steps;
}

export default function PracticeScreen() {
  const { t, lang } = useLang();
  const { currentScript, setSessionActive } = useUI();

  // Buka Practice dengan script yang sedang aktif di Home (kalau termasuk
  // JLPT), mis. dari kartu "Go to Practice" milik Basic Bunpō.
  const [script, setScript] = useState<JlptScriptKey>(
    isJlptScript(currentScript) ? currentScript : "kotoba",
  );
  const [pickedType, setPickedType] = useState<PracticeModeKey | null>(null);
  const [count, setCount] = useState(10);
  // Teks mentah yang lagi diketik di kotak "ketik sendiri" — null kalau kotak
  // itu lagi gak difokus/gak dipakai (biar gak dipaksa ke-clamp tiap huruf).
  const [customDraft, setCustomDraft] = useState<string | null>(null);

  // Level + Category (per aksara, disimpan terpisah dari Home/Lessons)
  const src = usePracticeSource(script);
  const fromDb = src.fromDb;

  // soal dari Supabase → antrean siap pakai (null selama belum dimuat)
  const pool = useMemo(
    () => (src.rows ? soalRowsToQueue(src.rows, script, lang) : null),
    [src.rows, script, lang],
  );

  // tipe soal aksara ini + "Mixed" (campuran semua tipe) di paling akhir
  const allTypes = useMemo(() => practiceModesFor(script), [script]);
  const totals = useMemo(() => {
    if (fromDb) {
      const counts: Partial<Record<PracticeModeKey, number>> = src.rows
        ? soalCounts(src.rows, script)
        : {};
      return Object.fromEntries(
        allTypes.map((k) => [k, counts[k] ?? 0]),
      ) as Record<PracticeModeKey, number>;
    }
    return Object.fromEntries(
      allTypes.map((k) => [k, practiceModeCount(script, k)]),
    ) as Record<PracticeModeKey, number>;
  }, [script, allTypes, fromDb, src.rows]);

  // dari Supabase: tipe yang belum punya soal disembunyikan (admin menambahnya
  // bertahap); Topic bawaan menampilkan semua tipe seperti biasa. Selama
  // sumbernya belum siap (dimuat / error / belum ada Category) belum ada tipe.
  const sourceReady = fromDb
    ? src.status === "ready"
    : src.organize.value === "topic";
  const types = useMemo(
    () =>
      !sourceReady
        ? []
        : fromDb
          ? allTypes.filter((k) => totals[k] > 0)
          : allTypes,
    [sourceReady, fromDb, allTypes, totals],
  );

  // tipe yang dipilih tidak ada di aksara/sumber ini (mis. pindah dari Bunpō
  // ke Kanji) → pakai tipe pertama; kosong kalau sumbernya belum punya soal
  const type: PracticeModeKey | undefined =
    pickedType && types.includes(pickedType) ? pickedType : types[0];
  const total = type ? totals[type] : 0;
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
  if (sheet && type) {
    return (
      <section id="screen-practice">
        <PracticeSheet
          key={`${script}:${src.level}:${src.organize.value}:${type}:${sheet.count}`}
          script={script}
          type={type}
          icon={TYPE_ICONS[type]}
          count={sheet.count}
          pool={fromDb && pool ? pool : undefined}
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

      <ContentSourceSwitch
        level={src.level}
        organize={src.organize}
        sources={src.sources}
        onLevelChange={(next) => {
          src.setLevel(next);
          setPickedType(null);
        }}
        onOrganizeChange={(next) => {
          src.setOrganize(next);
          setPickedType(null);
        }}
      />

      {(src.organize.pending || (fromDb && src.status === "loading")) && (
        <LoadingState
          label={t("practice.loadingSoal", { level: src.level })}
          compact
        />
      )}
      {src.status === "error" && (
        <div className="learn-no-results">
          <p style={{ color: "#c0392b" }}>
            {t("source.loadError")}: {src.error}
          </p>
          <button type="button" className="source-retry" onClick={src.retry}>
            {t("source.retry")}
          </button>
        </div>
      )}
      {!src.organize.pending && src.organize.value === null && (
        <p className="learn-no-results">
          {t("practice.noSource", { level: src.level })}
        </p>
      )}
      {fromDb && src.status === "ready" && types.length === 0 && (
        <p className="learn-no-results">
          {t("practice.noSoal", { level: src.level })}
        </p>
      )}

      {types.length > 0 && (
      <>
      <div className="flash-section-label">{t("quiz.typeLabel")}</div>
      <div className="flash-deck-grid practice-fade" key={`${script}:${src.level}:${src.organize.value}`}>
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
                {k === PRACTICE_MIXED
                  ? t("practice.mixed")
                  : t(`practice.${script}.${k}`)}
              </span>
              <span className="flash-deck-count">
                {k === PRACTICE_MIXED
                  ? t("practice.mixedDesc")
                  : t(`practice.${script}.${k}Desc`)}{" "}
                · <b>{totals[k]}</b>{" "}
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
      </>
      )}

      <ScrollTopButton id="btn-practice-scrolltop" />
    </section>
  );
}
