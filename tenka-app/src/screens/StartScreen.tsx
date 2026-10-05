import { useEffect, useState } from "react";
import heroArt from "@/assets/hero-start.webp";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useQuiz } from "@/state/QuizContext";
import { useConquest } from "@/state/ConquestContext";
import { SCRIPTS } from "@/data/scripts";
import ScriptTabs from "@/components/ScriptTabs";
import Levels from "@/components/Levels";
import DbLevels from "@/components/DbLevels";
import ContentSourceSwitch from "@/components/ContentSourceSwitch";
import { LessonsLoading } from "@/components/ui/Loader";
import { useHomeContentSource } from "@/hooks/useHomeContentSource";
import VariantPicker from "@/components/Pickers/VariantPicker";
import DifficultyPicker from "@/components/Pickers/DifficultyPicker";
import TimerPicker from "@/components/Pickers/TimerPicker";
import RangePicker from "@/components/Pickers/RangePicker";
import SpeedrunCountdown from "@/components/Quiz/SpeedrunCountdown";
import ConquestModal from "@/components/Conquest/ConquestModal";
import AdminConquestReset from "@/components/Admin/AdminConquestReset";
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
    setSelectedMode,
    pendingConquestOpen,
    setPendingConquestOpen,
  } = useUI();
  const { startQuiz, startConquest, startSpeedrun } = useQuiz();
  const { isConquered, isLocked, getSpeedrunBestTime } = useConquest();

  // Kotoba, Bunpō & Kanji: pilih Level + Organize by (Minna no Nihongo, dst) seperti di
  // Lessons. Default "Topic" = data bawaan, jadi tampilan lama tidak berubah.
  const src = useHomeContentSource(currentScript);
  const srcKey =
    currentScript === "kanji"
      ? "Kanji"
      : currentScript === "bunpo"
        ? "Bunpo"
        : "Kotoba";

  const [modalOpen, setModalOpen] = useState(false);
  const [countdownOpen, setCountdownOpen] = useState(false);

  // Datang dari tombol "Go" di Rank Missions: langsung buka popup Penaklukan
  // aksara yang dipilih. Kalau aksaranya masih terkunci (harus takluk aksara
  // sebelumnya dulu), popup tidak dibuka — kartu Penaklukan yang menampilkan
  // catatan kuncinya seperti biasa.
  useEffect(() => {
    if (!pendingConquestOpen) return;
    setPendingConquestOpen(false);
    if (!isLocked(currentScript)) setModalOpen(true);
  }, [pendingConquestOpen, currentScript, isLocked, setPendingConquestOpen]);

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

  // Match Mode: semua aksara (huruf ↔ romaji, kata/kanji ↔ arti, pola ↔ fungsi).
  const supportsMatch = true;

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
  // Conquest JLPT yang sudah ditaklukkan: kartunya jadi pintasan ke Practice
  // (bukan mengulang Conquest).
  const goesToPractice = isJlpt && conquered && !speedrunMode;
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
            <h1>
              From Commoner 『平民』{" "}
              <span className="hero-h1-line2">To Emperor 『天皇』</span>
            </h1>
            <p className="sub">
              "Train hard, conquer every conquest, and claim your
              throne as <b>Emperor</b>."
            </p>
          </div>
        </div>
      </header>

      <div className="start-panel">
      <ScriptTabs />

      {src.enabled && (
        <ContentSourceSwitch
          level={src.level}
          organize={src.organize}
          sources={src.sources}
          onLevelChange={(next) => {
            src.setLevel(next);
            setSelectedMode(null); // tingkatan lama tidak ada di sumber baru
          }}
          onOrganizeChange={(next) => {
            src.setOrganize(next);
            setSelectedMode(null);
          }}
        />
      )}

      {src.enabled && src.fromDb ? (
        <>
          {(src.status === "loading" || src.organize.pending) && (
            <LessonsLoading
              label={t(
                srcKey === "Kotoba" ? "source.loading" : `source.loading${srcKey}`,
                { level: src.level },
              )}
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
          {((!src.organize.pending && src.organize.sourceId === null) ||
            (src.view && src.view.total === 0)) && (
            <p className="learn-no-results">
              {t(`source.empty${srcKey}`, { level: src.level })}
            </p>
          )}
          {src.view && src.view.total > 0 && (
            <DbLevels
              key={src.view.allKey}
              view={src.view}
              selectedMode={selectedMode}
              onSelect={setSelectedMode}
            />
          )}
        </>
      ) : (
        <Levels />
      )}

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
              <span className="match-mode-desc">
                {t(
                  currentScript === "kotoba"
                    ? "matchMode.cardDescKotoba"
                    : currentScript === "kanji"
                      ? "matchMode.cardDescKanji"
                      : currentScript === "bunpo"
                        ? "matchMode.cardDescBunpo"
                        : "matchMode.cardDesc",
                )}
              </span>
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
        onClick={() =>
          goesToPractice ? setScreen("practice") : setModalOpen(true)
        }
      >
        <span className="conquest-icon" id="conquest-icon" />
        <span className="conquest-body">
          <span className="conquest-title">
            {speedrunMode
              ? t("speedrun.cardTitleWithLabel", { label: script.label })
              : goesToPractice
                ? t("conquest.goToPracticeCardTitle") + " ✓"
                : t("conquest.cardTitleWithLabel", { label: script.label }) +
                  (conquered ? " ✓" : "")}
          </span>
          {speedrunMode && bestTime !== null ? (
            // teks rekor mengandung <b>…</b>, jadi harus dirender sebagai HTML
            <span
              className="conquest-desc"
              dangerouslySetInnerHTML={{
                __html: t("speedrun.descWithRecord", {
                  count: totalAll,
                  label: script.label,
                  time: fmtSpeedrunTime(bestTime),
                }),
              }}
            />
          ) : (
          <span className="conquest-desc">
            {speedrunMode
              ? t("speedrun.descNoRecord", {
                  count: totalAll,
                  label: script.label,
                })
              : goesToPractice
                ? t("conquest.goToPracticeDesc", { label: script.label })
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
          )}
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

      <AdminConquestReset scriptKey={currentScript} />

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
