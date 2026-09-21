import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI, type ScriptKey } from "@/state/UIContext";
import { useProfile } from "@/hooks/useProfile";
import { useQuiz } from "@/state/QuizContext";
import { useConquest } from "@/state/ConquestContext";
import { SCRIPTS } from "@/data/scripts";
import { RANK_LEVELS, getRankIndex, promoteIfHigher } from "@/data/ranks";
import { formatSpeedrunTime } from "@/utils/formatTime";
import { supportsSpeedrun } from "@/utils/speedrun";
import {
  isJlptScript,
  JLPT_PASS_PERCENT,
  stripMarks,
} from "@/data/jlptConquest";

export default function ResultsScreen() {
  const { t } = useLang();
  const { setScreen, setCurrentScript } = useUI();
  const { nickname } = useProfile();
  const { state, restartQuiz } = useQuiz();
  const { completeConquest, submitSpeedrunTime, getStory } = useConquest();

  const [promoMsg, setPromoMsg] = useState<string>("");
  const [promoClass, setPromoClass] = useState<string>("");
  // tombol "Taklukkan Lagi" disembunyikan begitu Conquest berhasil di aksara
  // yang punya Speedrun (kartunya sudah berubah jadi Mode Speedrun) — sama
  // seperti versi vanilla, cuma di sini digerakkan lewat state, bukan
  // classList. Kotoba/Bunpō/Kanji tidak punya Speedrun, jadi tombolnya tetap
  // ada (soal ujiannya diacak ulang tiap percobaan).
  const [hideRetry, setHideRetry] = useState(false);
  const [showStudyFirst, setShowStudyFirst] = useState(false);

  useEffect(() => {
    try {
      const script = SCRIPTS[state.script as keyof typeof SCRIPTS];

      if (state.conquest) {
        if (state.conquestFailed) {
          const phaseNote = state.conquestPhaseBoundaries
            ? t("results.conquestFailPhaseNote", {
                phase:
                  getStory(state.script!)?.phases[state.conquestPhaseIndex]
                    .label ?? "",
              })
            : "";
          // FAIL_QUIZ menggeser index ke akhir queue, jadi soal tempat gagalnya
          // = jumlah soal yang sudah dijawab.
          const failedAt = state.results.length;
          setPromoMsg(
            isJlptScript(state.script ?? "")
              ? t("results.jlptFailBanner", {
                  phaseNote,
                  current: failedAt,
                  total: state.queue.length,
                  label: script?.label ?? "",
                  percent: JLPT_PASS_PERCENT,
                })
              : t("results.conquestFailBanner", {
                  phaseNote,
                  current: failedAt,
                  total: state.queue.length,
                  label: script?.label ?? "",
                }),
          );
          setPromoClass("conquest-fail");
          setShowStudyFirst(true);
        } else {
          const result = completeConquest(state.script!);
          const opening = state.conquestPhaseBoundaries
            ? t("results.conquestSuccessOpening", {
                epilogue: getStory(state.script!)?.epilogue ?? "",
              })
            : t("results.conquestSuccessOpeningPlain", {
                label: script?.label ?? "",
              });
          let msg = opening;
          if (result.newTitle && result.titleInfo) {
            msg += t("results.newTitleEarned", {
              emoji: result.titleInfo.emoji,
              title: result.titleInfo.title,
            });
          }
          if (result.promoted) {
            const rank = RANK_LEVELS[result.rankIndex];
            if (rank.title === "Knight") {
              msg += t("results.knightCeremony", {
                emoji: rank.emoji,
                title: rank.title,
                subtitle: rank.subtitle,
              });
            } else if (rank.title === "Baron") {
              msg += t("results.baronCeremony", {
                emoji: rank.emoji,
                title: rank.title,
                subtitle: rank.subtitle,
              });
            } else {
              msg += t("results.rankUp", {
                emoji: rank.emoji,
                title: rank.title,
                subtitle: rank.subtitle,
              });
            }
          }
          setPromoMsg(msg);
          setPromoClass("conquest-success");
          setHideRetry(supportsSpeedrun(state.script!));
        }
      } else if (state.speedrun) {
        if (state.speedrunFailed) {
          setPromoMsg(
            t("results.speedrunFailBanner", {
              current: state.index + 1,
              total: state.queue.length,
            }),
          );
          setPromoClass("conquest-fail");
        } else {
          const elapsed = Date.now() - (state.speedrunStart ?? Date.now());
          const timeText = formatSpeedrunTime(elapsed);
          const { isNewRecord, prevBest } = submitSpeedrunTime(
            state.script!,
            elapsed,
          );
          let msg: string;
          if (isNewRecord && prevBest === null) {
            msg = t("results.speedrunFirstRecord", {
              label: script?.label ?? "",
              time: timeText,
            });
            setPromoClass("conquest-success");
          } else if (isNewRecord) {
            msg = t("results.speedrunNewRecord", {
              label: script?.label ?? "",
              time: timeText,
            });
            setPromoClass("conquest-success");
          } else {
            msg = t("results.speedrunNoRecord", {
              label: script?.label ?? "",
              time: timeText,
              best: formatSpeedrunTime(prevBest!),
            });
          }
          setPromoMsg(msg);
        }
      } else if (state.mode !== "practice") {
        // set biasa (bukan conquest/speedrun/latihan tipe soal): mode-nya bukan "all", jadi ini
        // tidak menandai aksara sebagai takluk — cuma jaga-jaga kalau rank
        // tersimpan sudah ketinggalan dari peta penaklukan yang ada.
        const promoted = promoteIfHigher(state.script!, state.mode!);
        if (promoted) {
          const rank = RANK_LEVELS[getRankIndex()];
          setPromoMsg(
            t("results.rankUpPlain", {
              emoji: rank.emoji,
              title: rank.title,
              subtitle: rank.subtitle,
            }),
          );
        }
      }
    } catch (err) {
      console.error("ResultsScreen effect error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalQuestions = state.queue.length;
  const acc =
    totalQuestions > 0 ? Math.round((state.score / totalQuestions) * 100) : 0;
  const streakNote =
    state.maxStreak >= 3 ? t("results.bestStreak", { n: state.maxStreak }) : "";

  const isConquestFail = state.conquest && state.conquestFailed;
  const isSpeedrunFail = state.speedrun && state.speedrunFailed;

  // sapaan pakai nickname: Conquest selalu dianggap 100% (satu salah = gagal),
  // jadi dipuji dua-duanya; di luar itu dinilai dari akurasi.
  let greet = "";
  if (nickname) {
    if (state.conquest) {
      greet = state.conquestFailed
        ? t("results.greetConquestFail", { name: nickname })
        : acc === 100
          ? t("results.greetConquestSuccess", { name: nickname })
          : t("results.greetConquestPassed", { name: nickname });
    } else if (acc === 100) {
      greet = t("results.greetPerfect", { name: nickname });
    } else if (acc >= 80) {
      greet = t("results.greetAlmost", { name: nickname });
    } else if (acc >= 50) {
      greet = t("results.greetDecent", { name: nickname });
    } else {
      greet = t("results.greetKeepGoing", { name: nickname });
    }
  }

  const scoreText = `${state.score}/${totalQuestions || "?"}`;
  const scoreLenClass =
    scoreText.length >= 5 ? ` len-${Math.min(scoreText.length, 8)}` : "";

  const missedTitle =
    state.conquest && state.conquestFailed
      ? t("results.failureReason")
      : t("results.needsPractice");

  const retryLabel = isConquestFail
    ? t("results.tryAgainFromStart")
    : state.conquest
      ? t("results.conquerAgain")
      : state.speedrun || isSpeedrunFail
        ? t("results.speedrunAgain")
        : t("results.retrySet");

  const handleStudyFirst = () => {
    setCurrentScript(state.script as ScriptKey);
    setScreen("learn");
  };

  return (
    <section id="screen-results" className="results">
      {promoMsg && (
        <div
          className={`promo-banner ${promoClass}`}
          dangerouslySetInnerHTML={{ __html: promoMsg }}
        />
      )}

      {greet && <p className="res-greet">{greet}</p>}

      <div className="score-stamp">
        <div className={`num${scoreLenClass}`}>{scoreText}</div>
        <div className="of">{t("results.correct")}</div>
      </div>

      <p className="acc">
        {t("results.accuracy", { acc })}
        {streakNote}
      </p>

      {state.missed.length > 0 && (
        <>
          <p className="missed-title">{missedTitle}</p>
          <div className="chips">
            {state.missed.map((m, i) => (
              <span key={i} className="chip">
                <span className="k">{stripMarks(m[0])}</span>
                <span className="r">{m[1]}</span>
              </span>
            ))}
          </div>
        </>
      )}

      <div className="result-actions">
        {!hideRetry && (
          <button className="primary" type="button" onClick={restartQuiz}>
            {retryLabel}
          </button>
        )}
        {showStudyFirst && (
          <button className="ghost" type="button" onClick={handleStudyFirst}>
            {t("start.studyFirst")}
          </button>
        )}
        <button
          className="ghost"
          type="button"
          data-i18n="common.back"
          onClick={() =>
            setScreen(state.mode === "practice" ? "practice" : "start")
          }
        >
          {t("common.back")}
        </button>
      </div>
    </section>
  );
}
