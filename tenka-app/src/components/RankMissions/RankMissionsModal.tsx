import { useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI, type ScriptKey } from "@/state/UIContext";
import Modal from "@/components/ui/Modal";
import ChibiGuide from "@/components/RankMissions/ChibiGuide";
import { SCRIPTS } from "@/data/scripts";
import { isJlptScript, jlptTierCount } from "@/data/jlptConquest";
import {
  MISSION_TOTAL,
  RANK_LEVELS,
  RANK_MISSIONS,
  getConquery,
  type MissionScriptKey,
} from "@/data/ranks";
import { getProgressContext, pickChibiLine } from "@/data/chibiGuide";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Glyph + warna tiap kartu misi (dipakai class .rm-tone-*, lihat dashboard.css).
const MISSION_GLYPH: Record<MissionScriptKey, { glyph: string; tone: string }> = {
  hiragana: { glyph: "あ", tone: "teal" },
  katakana: { glyph: "ア", tone: "orange" },
  kotoba: { glyph: "語", tone: "gold" },
  bunpo: { glyph: "文", tone: "pink" },
  kanji: { glyph: "漢", tone: "purple" },
};

// Jumlah tier yang harus dilewati buat menaklukkan tiap materi, sesuai ujian
// Penaklukan: hiragana & katakana = 3 tier (tahap); kotoba/bunpō/kanji =
// ujian ala JLPT (jlptTierCount: kotoba 5, bunpō 5, kanji 5).
function tierCount(key: MissionScriptKey): number {
  return isJlptScript(key) ? jlptTierCount(key) : 3;
}

// Popup "Rank Missions": atas = pangkat sekarang → pangkat berikutnya,
// bawah = langkah-langkah (taklukkan tiap aksara/materi N5) yang harus
// diselesaikan buat naik ke pangkat itu. Status diambil dari data Penaklukan
// yang sudah tersimpan (getConquery), dibaca ulang tiap popup dibuka.
export default function RankMissionsModal({ open, onClose }: Props) {
  const { t } = useLang();
  const {
    setScreen,
    setCurrentScript,
    setSelectedMode,
    setQuizVariant,
    setPendingConquestOpen,
  } = useUI();

  // Ucapan chibi: dipilih ulang (acak, beda dari sebelumnya) TIAP popup
  // dibuka, tapi hanya dari ucapan yang cocok dengan progres user saat ini
  // (lihat pickChibiLine). Di-set saat render begitu `open` berubah jadi
  // true, jadi ucapan baru langsung tampil tanpa sempat berkedip.
  const [wasOpen, setWasOpen] = useState(open);
  const [quote, setQuote] = useState(() =>
    pickChibiLine(getProgressContext(getConquery()), null),
  );
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuote(
        pickChibiLine(getProgressContext(getConquery()), quote.messageKey),
      );
    }
  }

  const conquered = open ? getConquery() : {};
  const groups = RANK_MISSIONS.map((g) => ({
    ...g,
    rank: RANK_LEVELS[g.rankIndex],
    items: g.scripts.map((k) => ({ key: k, done: !!conquered[k] })),
  }));
  const done = groups.reduce(
    (n, g) => n + g.items.filter((i) => i.done).length,
    0,
  );
  const allDone = done === MISSION_TOTAL;
  const currentGroup = groups.findIndex((g) => g.items.some((i) => !i.done));

  const next = allDone ? null : groups[currentGroup]?.rank ?? null;

  // Judul bagian bawah: "Path to Knighthood" (nyambung sama Commoner → Knight).
  // Kalau semua N5 sudah tuntas, tetap nunjuk pangkat tujuan terakhir.
  const targetTitle = (next ?? groups[groups.length - 1].rank).title;
  const stepsTitle = t("missions.steps", {
    rank: targetTitle === "Knight" ? "Knighthood" : targetTitle,
  });

  // Langkah yang harus dilakukan buat naik ke pangkat berikutnya: semua
  // syarat dari awal sampai pangkat itu, urut (yang udah beres tetap
  // ditampilin sebagai "Completed"). Kalau semua N5 tuntas, tampilin semuanya.
  const stepGroups = allDone ? groups : groups.slice(0, currentGroup + 1);
  const steps = stepGroups.flatMap((g) => g.items);
  const stepsDone = steps.filter((i) => i.done).length;

  // Grup misi yang sedang aktif (buat variabel di kalimat chibi).
  const activeGroup = groups[currentGroup];
  // Isi variabel di kalimat: conquest yang harus dikerjakan berikutnya + pangkat
  // tujuannya + hitungan progres.
  const nextItem = activeGroup?.items.find((i) => !i.done);
  const quoteVars = {
    script: nextItem ? SCRIPTS[nextItem.key].label : "",
    rank: activeGroup?.rank.title ?? "",
    done,
    total: MISSION_TOTAL,
  };

  const go = (key: ScriptKey) => {
    setCurrentScript(key);
    setSelectedMode(null);
    setQuizVariant("meaning");
    // langsung buka popup Penaklukan aksara ini, bukan cuma pindah layar
    setPendingConquestOpen(true);
    setScreen("start");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="missions-title"
      panelClassName="missions-panel"
    >
      <header className="rm-hero">
        <button
          type="button"
          className="rm-close"
          aria-label={t("missions.close")}
          onClick={onClose}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* judul tetap ada buat screen reader (aria-labelledby), tapi gak
            ditampilin — bagian atas sekarang diisi bubble ucapan chibi */}
        <h2 id="missions-title" className="sr-only">
          {t("missions.title")}
        </h2>

        <div className="rm-hero-top">
          <ChibiGuide expression={quote.expression} />
          <div className="rm-bubble" key={quote.messageKey}>
            <span className="rm-bubble-petals" aria-hidden="true" />
            <p className="rm-bubble-text">{t(quote.messageKey, quoteVars)}</p>
          </div>
        </div>
      </header>

      <section className="rm-steps" aria-labelledby="missions-steps-title">
        <div className="rm-steps-head">
          <div>
            <h3 id="missions-steps-title">
              <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.6 0 0 3.5 0 7.9 0 13.6 8 20 8 20s8-6.4 8-12.1C16 3.5 12.4 0 8 0zm0 10.8a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8z" />
              </svg>
              {stepsTitle}
            </h3>
            <p>
              {allDone
                ? t("missions.allN5")
                : t("missions.stepsSub", { rank: next?.title ?? "" })}
            </p>
          </div>
          <span className="rm-count">
            {t("missions.progress", { done: stepsDone, total: steps.length })}
          </span>
        </div>

        <ol className="rm-cards">
          {steps.map((it, i) => {
            const meta = MISSION_GLYPH[it.key];
            const label = SCRIPTS[it.key].label;
            return (
              <li key={it.key} className="rm-cell">
                {i > 0 && (
                  <span className="rm-cards-arrow" aria-hidden="true">
                    <svg width="8" height="13" viewBox="0 0 10 16" fill="none">
                      <path d="M2 2l6 6-6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <div className={`rm-card ${it.done ? "done" : ""}`}>
                  <span className="rm-card-num">{i + 1}</span>
                  <span className={`rm-card-icon rm-tone-${meta.tone}`} aria-hidden="true">
                    {meta.glyph}
                  </span>
                  <div className="rm-card-body">
                    <strong>{t("missions.conquer", { label })}</strong>
                    <span>{t("missions.desc", { label, count: tierCount(it.key) })}</span>
                  </div>
                  {it.done ? (
                    <span className="rm-card-status">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <circle cx="7" cy="7" r="7" fill="currentColor" />
                        <path d="M4 7.2l2 2 4-4.2" stroke="var(--card)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t("missions.completed")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="rm-card-go"
                      onClick={() => go(it.key)}
                    >
                      {t("missions.go")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <p className="rm-later">{t("missions.later")}</p>
      </section>

      <footer className="rm-foot">
        <span className="rm-foot-line" aria-hidden="true" />
        <span className="rm-foot-text">
          <span aria-hidden="true">✦</span>
          {t("missions.footer")}
          <span aria-hidden="true">✦</span>
        </span>
        <span className="rm-foot-line" aria-hidden="true" />
      </footer>
    </Modal>
  );
}
