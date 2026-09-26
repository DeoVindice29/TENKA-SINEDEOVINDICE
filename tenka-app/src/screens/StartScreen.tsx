import { useState } from "react";
import heroArt from "@/assets/hero-start.webp";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useQuiz } from "@/state/QuizContext";
import { useConquest } from "@/state/ConquestContext";
import { SCRIPTS } from "@/data/scripts";
import ScriptTabs from "@/components/ScriptTabs";
import Levels from "@/components/Levels";
import VariantPicker from "@/components/Pickers/VariantPicker";
import DifficultyPicker from "@/components/Pickers/DifficultyPicker";
import TimerPicker from "@/components/Pickers/TimerPicker";
import RangePicker from "@/components/Pickers/RangePicker";
import SpeedrunCountdown from "@/components/Quiz/SpeedrunCountdown";
import ConquestModal from "@/components/Conquest/ConquestModal";
import ScrollTopButton from "@/components/ScrollTopButton";
import { supportsSpeedrun } from "@/utils/speedrun";
import {
  isJlptScript,
  jlptTierCount,
  JLPT_PASS_PERCENT,
  jlptQuestionsPerTier,
} from "@/data/jlptConquest";
import type { Bilingual } from "@/data/types";

function tf(
  entry: Bilingual | string | null | undefined,
  lang: "en" | "id",
): string {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  return entry[lang] || entry.en || entry.id || "";
}

function fmtSpeedrunTime(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const m = Math.floor(totalCs / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(
    cs,
  ).padStart(2, "0")}`;
}

export default function StartScreen() {
  const { t, lang } = useLang();
  const {
    currentScript,
    selectedMode,
    setScreen,
    selectedDifficulty,
    selectedTimerSeconds,
    quizVariant,
    rangeMode,
    rangeFrom,
    rangeTo,
    randomCount,
    setMatchScript,
    setMatchMode,
  } = useUI();
  const { startQuiz, startConquest, startSpeedrun } = useQuiz();
  const { isConquered, isLocked, getSpeedrunBestTime } = useConquest();

  const [modalOpen, setModalOpen] = useState(false);
  const [countdownOpen, setCountdownOpen] = useState(false);

  const script = SCRIPTS[currentScript as keyof typeof SCRIPTS];

  if (!script) {
    return (
      <section id="screen-start">
        <div style={{ padding: 20 }}>
          <p>Script tidak ditemukan: {currentScript}</p>
        </div>
      </section>
    );
  }

  const canStart = selectedMode !== null;

  const selectedInfo = selectedMode
    ? (script.levelText?.[selectedMode as keyof typeof script.levelText] ??
      null)
    : null;

  const selectedPool = selectedMode
    ? (script.data?.[selectedMode as keyof typeof script.data] ?? null)
    : null;

  const supportsMatch =
    currentScript === "hiragana" || currentScript === "katakana";

  // jumlah soal yang akan dikerjakan, sesuai pilihan rentang / mode acak
  const poolTotal = selectedPool?.length ?? 0;
  const rFrom = Math.max(0, Math.min(rangeFrom, poolTotal - 1));
  const rTo = Math.max(rFrom, Math.min(rangeTo, poolTotal - 1));
  const questionCount =
    rangeMode === "random"
      ? Math.min(randomCount, poolTotal)
      : poolTotal > 0
        ? rTo - rFrom + 1
        : 0;

  const conquered = isConquered(currentScript);
  // Speedrun cuma untuk Hiragana & Katakana. Kotoba/Bunpō/Kanji yang sudah
  // takluk kartunya tetap Penaklukan ala JLPT (bisa diulang), cuma dikasih ✓.
  const speedrunMode = conquered && supportsSpeedrun(currentScript);
  const isJlpt = isJlptScript(currentScript);
  const lockKey = isLocked(currentScript);

  const dataAll = (
    script.data as Record<string, readonly unknown[]> | undefined
  )?.all;
  const totalAll = Array.isArray(dataAll) ? dataAll.length : 0;

  const bestTime = getSpeedrunBestTime(currentScript);

  return (
    <section id="screen-start">
      <header>
        <div className="hero-card">
          <img className="hero-art" src={heroArt} alt="" aria-hidden="true" />
          <div className="hero-icon" aria-hidden="true">
            天
          </div>
          <div className="hero-text">
            <div className="eyebrow">Learning Japanese — From Zero to Hero</div>
            <h1>Commoner 「平民」 To Emperor 「天皇」</h1>
            <p className="sub">
              "You are an ordinary person with a dream. Train hard, conquer
              every trial in your way, and claim your throne as{" "}
              <b>Emperor</b>."
            </p>
          </div>
        </div>
      </header>

      {/* tombol N4 sengaja terpisah dari ScriptTabs/Levels di bawah — N4
          belum masuk sistem quiz/conquest yang sama kayak N5, masih
          layar baca-data terpisah yang narik dari Supabase. */}
      <button
        className="secondary"
        id="btn-open-n4"
        type="button"
        onClick={() => setScreen("n4")}
      >
        N4 (Beta) — lihat data terbaru
      </button>

      <div className="start-panel">
      <ScriptTabs />

      <Levels />

      <div id="options-panel">
        {supportsMatch && (
          <button
            className="match-card"
            id="btn-match-mode"
            type="button"
            disabled={!selectedMode}
            onClick={() => {
              if (selectedMode) {
                setMatchScript(currentScript);
                setMatchMode(selectedMode);
                setScreen("match");
              }
            }}
          >
            <span className="match-mode-icon" />
            <span className="match-mode-body">
              <span className="match-mode-title">{t("matchMode.cardTitle")}</span>
              <span className="match-mode-desc">{t("matchMode.cardDesc")}</span>
            </span>
            <span className="match-mode-arrow" />
          </button>
        )}

        <VariantPicker />
        <DifficultyPicker />
        <TimerPicker />
        <RangePicker />
      </div>

      <button
        className="primary"
        id="btn-start"
        disabled={!canStart}
        onClick={() => {
          if (selectedMode) {
            startQuiz(currentScript, selectedMode, {
              difficulty: selectedDifficulty,
              timerSeconds: selectedTimerSeconds,
              variant: quizVariant,
              range: {
                mode: rangeMode,
                from: rangeFrom,
                to: rangeTo,
                randomCount,
              },
            });
            setScreen("quiz");
          }
        }}
      >
        {canStart && selectedInfo
          ? t(
              rangeMode === "random"
                ? "start.startRandomCount"
                : "start.startCount",
              {
                title: tf(selectedInfo.title, lang),
                count: questionCount,
              },
            )
          : t("start.chooseTierFirst")}
      </button>
      </div>

      <button
        className={`conquest-card ${speedrunMode ? "speedrun-mode" : ""} ${
          lockKey ? "locked" : ""
        }`}
        id="btn-conquest"
        type="button"
        disabled={!!lockKey}
        onClick={() => setModalOpen(true)}
      >
        <span className="conquest-icon" id="conquest-icon" />
        <span className="conquest-body">
          <span className="conquest-title">
            {speedrunMode
              ? t("speedrun.cardTitleWithLabel", { label: script.label })
              : isJlpt && conquered
                ? t("conquest.jlptRetryCardTitleWithLabel", {
                    label: script.label,
                  }) + " ✓"
                : t("conquest.cardTitleWithLabel", { label: script.label }) +
                  (conquered ? " ✓" : "")}
          </span>
          <span className="conquest-desc">
            {speedrunMode
              ? bestTime !== null
                ? t("speedrun.descWithRecord", {
                    count: totalAll,
                    label: script.label,
                    time: fmtSpeedrunTime(bestTime),
                  })
                : t("speedrun.descNoRecord", {
                    count: totalAll,
                    label: script.label,
                  })
              : isJlpt
                ? t("conquest.jlptDesc", {
                    tiers: jlptTierCount(currentScript),
                    count: jlptQuestionsPerTier(currentScript),
                    percent: JLPT_PASS_PERCENT,
                  })
                : t("conquest.desc", {
                    label: script.label,
                    count: totalAll,
                  })}
          </span>
          {lockKey && (
            <span className="conquest-lock-note">
              {t("conquest.lockNote", {
                lockLabel:
                  SCRIPTS[lockKey as keyof typeof SCRIPTS]?.label ?? lockKey,
                label: script.label,
              })}
            </span>
          )}
        </span>
        <span className="conquest-arrow" />
      </button>

      <ConquestModal
        open={modalOpen}
        scriptKey={currentScript}
        onCancel={() => setModalOpen(false)}
        onConfirmConquest={() => {
          setModalOpen(false);
          startConquest(currentScript, selectedDifficulty);
          setScreen("quiz");
        }}
        onConfirmSpeedrun={() => {
          // hitung mundur 3-2-1-GO dulu; timer speedrun baru jalan setelahnya
          setModalOpen(false);
          setCountdownOpen(true);
        }}
      />

      <SpeedrunCountdown
        open={countdownOpen}
        onCancel={() => setCountdownOpen(false)}
        onDone={() => {
          setCountdownOpen(false);
          startSpeedrun(currentScript, selectedDifficulty);
          setScreen("quiz");
        }}
      />

      <ScrollTopButton id="btn-start-scrolltop" />
    </section>
  );
}
