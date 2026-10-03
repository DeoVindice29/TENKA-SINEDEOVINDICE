import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI, type ScriptKey } from "@/state/UIContext";
import { useAuth } from "@/state/AuthContext";
import { logActivity } from "@/lib/activityLog";
import { useQuiz } from "@/state/QuizContext";
import { useConquest } from "@/state/ConquestContext";
import { SCRIPTS } from "@/data/scripts";
import {
  RANK_LEVELS,
  getRankIndex,
  promoteIfHigher,
  rankLogoHtml,
} from "@/data/ranks";
import { formatSpeedrunTime } from "@/utils/formatTime";
import { getChibiAvatarByName } from "@/lib/chibiAvatar";
import { supportsSpeedrun } from "@/utils/speedrun";
import {
  isJlptScript,
  JLPT_PASS_PERCENT,
  stripMarks,
} from "@/data/jlptConquest";

export default function ResultsScreen() {
  const { t } = useLang();
  const { setScreen, setCurrentScript } = useUI();
  // nama akun dari Supabase (per akun); dulu ini baca localStorage global
  // lewat useProfile() jadi bisa nampilin nickname akun lain di browser
  // yang sama.
  const { profile } = useAuth();
  const nickname = profile?.username?.trim() || "";
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
  // hasil speedrun berhasil disimpan terstruktur (bukan HTML banner) supaya
  // waktu, rekor & selisihnya bisa tampil sebagai kartu statistik + ucapan chibi.
  const [speedrunInfo, setSpeedrunInfo] = useState<{
    elapsed: number;
    prevBest: number | null;
    isNewRecord: boolean;
  } | null>(null);

  // catat sesi latihan ke statistik admin — sekali per tampil layar hasil
  const loggedRef = useRef(false);
  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    if (!state.script) return;
    logActivity({ kind: "practice_session", script: state.script });
    if (state.conquest && !state.conquestFailed) {
      logActivity({ kind: "conquest_cleared", script: state.script });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                emoji: rankLogoHtml(rank),
                title: rank.title,
                subtitle: rank.subtitle,
              });
            } else if (rank.title === "Baron") {
              msg += t("results.baronCeremony", {
                emoji: rankLogoHtml(rank),
                title: rank.title,
                subtitle: rank.subtitle,
              });
            } else {
              msg += t("results.rankUp", {
                emoji: rankLogoHtml(rank),
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
          const { isNewRecord, prevBest } = submitSpeedrunTime(
            state.script!,
            elapsed,
          );
          setSpeedrunInfo({ elapsed, prevBest, isNewRecord });
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
              emoji: rankLogoHtml(rank),
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

  const isConquestFail = !!state.conquest && !!state.conquestFailed;
  const isSpeedrunFail = !!state.speedrun && !!state.speedrunFailed;
  const isConquestWin = !!state.conquest && !state.conquestFailed;
  const scriptLabel = SCRIPTS[state.script as keyof typeof SCRIPTS]?.label ?? "";

  const name = nickname || t("results.defaultName");
  const sr = speedrunInfo;
  const gapText =
    sr && sr.prevBest !== null && !sr.isNewRecord
      ? `+${((sr.elapsed - sr.prevBest) / 1000).toFixed(2)}s`
      : "";

  // ---- chibi: pilih ekspresi + ucapan sesuai hasil ----
  let expression = "happy";
  let cheer = "";
  if (isConquestFail) {
    expression = "sad";
    cheer = t("results.chibiConquestFail", { name });
  } else if (isSpeedrunFail) {
    expression = "disappointed";
    cheer = t("results.chibiSpeedrunFail", { name });
  } else if (isConquestWin) {
    expression = "celebrate";
    cheer = t("results.chibiConquestSuccess", { name, label: scriptLabel });
  } else if (sr?.isNewRecord) {
    expression = "celebrate";
    cheer =
      sr.prevBest === null
        ? t("results.chibiSpeedrunFirst", { name })
        : t("results.chibiSpeedrunRecord", {
            name,
            time: formatSpeedrunTime(sr.elapsed),
          });
  } else if (sr) {
    expression = "proud";
    cheer = t("results.chibiSpeedrunSlower", { name, gap: gapText });
  } else if (acc === 100) {
    expression = "proud";
    cheer = t("results.chibiPerfect", { name });
  } else if (acc >= 80) {
    expression = "impressed";
    cheer = t("results.greetAlmost", { name });
  } else if (acc >= 50) {
    expression = "happy";
    cheer = t("results.greetDecent", { name });
  } else {
    expression = "sad";
    cheer = t("results.greetKeepGoing", { name });
  }
  const chibiSrc =
    getChibiAvatarByName(expression) ??
    getChibiAvatarByName("happy") ??
    getChibiAvatarByName("cute");
  const festive = isConquestWin || !!sr?.isNewRecord;
  const mood = isConquestFail || isSpeedrunFail ? "down" : festive ? "win" : "";

  // lencana kecil di atas cincin skor
  let badge = "";
  if (isConquestWin) badge = t("results.badgeConquest");
  else if (sr?.isNewRecord)
    badge = t(
      sr.prevBest === null
        ? "results.badgeFirstRecord"
        : "results.badgeNewRecord",
    );
  else if (sr) badge = t("results.badgeSpeedrunDone");

  const stats: { label: string; value: string }[] = [
    { label: t("results.statAccuracy"), value: `${acc}%` },
  ];
  if (sr) {
    stats.push({
      label: t("results.statTime"),
      value: formatSpeedrunTime(sr.elapsed),
    });
    stats.push({
      label: t("results.statBest"),
      value: formatSpeedrunTime(
        sr.isNewRecord ? sr.elapsed : (sr.prevBest ?? sr.elapsed),
      ),
    });
  }
  if (state.maxStreak >= 3) {
    stats.push({
      label: t("results.statStreak"),
      value: String(state.maxStreak),
    });
  }

  const scoreText = `${state.score}/${totalQuestions || "?"}`;
  const scoreLenClass =
    scoreText.length >= 5 ? ` len-${Math.min(scoreText.length, 8)}` : "";
  const RING_R = 54;
  const RING_C = 2 * Math.PI * RING_R;

  const missedTitle = isConquestFail
    ? t("results.failureReason")
    : t("results.needsPractice");

  const retryLabel = isConquestFail
    ? t("results.tryAgainFromStart")
    : state.conquest
      ? t("results.goToPractice")
      : state.speedrun || isSpeedrunFail
        ? t("results.speedrunAgain")
        : t("results.retrySet");

  // Conquest berhasil → tombol utama mengarah ke Practice (bukan mengulang
  // penaklukan). Conquest gagal tetap "Coba Lagi dari Awal" (restartQuiz).
  const goesToPractice = isConquestWin;

  const handleStudyFirst = () => {
    setCurrentScript(state.script as ScriptKey);
    setScreen("learn");
  };

  return (
    <section id="screen-results" className={`results res-card ${mood}`}>
      <div className="res-chibi-row">
        <div className="res-chibi" aria-hidden="true">
          {festive && (
            <>
              <span className="res-spark res-spark--a" />
              <span className="res-spark res-spark--b" />
              <span className="res-spark res-spark--c" />
            </>
          )}
          {chibiSrc && (
            <img key={expression} src={chibiSrc} alt="" className="res-chibi-img" />
          )}
        </div>
        <div className="res-bubble" role="status">
          <p className="res-bubble-text">{cheer}</p>
        </div>
      </div>

      <div className="res-score">
        {badge && <span className="res-badge">{badge}</span>}
        <div className="res-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="res-ring-track" cx="60" cy="60" r={RING_R} />
            <circle
              className="res-ring-fill"
              cx="60"
              cy="60"
              r={RING_R}
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - acc / 100)}
            />
          </svg>
          <div className="res-ring-label">
            <div className={`num${scoreLenClass}`}>{scoreText}</div>
            <div className="of">{t("results.correct")}</div>
          </div>
        </div>
      </div>

      <dl className="res-stats">
        {stats.map((s) => (
          <div key={s.label} className="res-stat">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>

      {promoMsg && (
        <div
          className={`promo-banner ${promoClass}`}
          dangerouslySetInnerHTML={{ __html: promoMsg }}
        />
      )}

      {state.missed.length > 0 && (
        <div className="res-missed">
          <p className="missed-title">{missedTitle}</p>
          <div className="chips">
            {state.missed.map((m, i) => (
              <span key={i} className="chip">
                <span className="k">{stripMarks(m[0])}</span>
                <span className="r">{m[1]}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="result-actions">
        {!hideRetry && (
          <button
            className="primary"
            type="button"
            onClick={goesToPractice ? () => setScreen("practice") : restartQuiz}
          >
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
