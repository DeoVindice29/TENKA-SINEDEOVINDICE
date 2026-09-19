import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useQuiz } from "@/state/QuizContext";
import { useConquest } from "@/state/ConquestContext";
import { SCRIPTS } from "@/data/scripts";
import { RANK_LEVELS } from "@/data/ranks";

function fmtTime(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const m = Math.floor(totalCs / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(
    cs,
  ).padStart(2, "0")}`;
}

export default function ResultsScreen() {
  const { t } = useLang();
  const { setScreen } = useUI();
  const { state } = useQuiz();
  const { completeConquest, submitSpeedrunTime } = useConquest();

  const [promoMsg, setPromoMsg] = useState<string>("");
  const [promoClass, setPromoClass] = useState<string>("");

  useEffect(() => {
    try {
      if (state.conquest && !state.conquestFailed) {
        const result = completeConquest(state.script!);
        const script = SCRIPTS[state.script as keyof typeof SCRIPTS];
        let msg = `🏆 <b>Conquest Successful!</b> You've officially conquered all of ${script?.label ?? ""}!`;
        if (result.newTitle && result.titleInfo) {
          msg += ` New title: <b>${result.titleInfo.emoji} ${result.titleInfo.title}</b>`;
        }
        if (result.promoted) {
          const rank = RANK_LEVELS[result.rankIndex];
          msg += ` — Rank up: <b>${rank.emoji} ${rank.title} (${rank.subtitle})</b>`;
        }
        setPromoMsg(msg);
        setPromoClass("conquest-success");
      } else if (state.conquest && state.conquestFailed) {
        const script = SCRIPTS[state.script as keyof typeof SCRIPTS];
        setPromoMsg(
          `💀 <b>Conquest Failed</b> — ${script?.label ?? ""} isn't conquered yet, try again from the start!`,
        );
        setPromoClass("conquest-fail");
      } else if (state.speedrun && !state.speedrunFailed) {
        const elapsed = Date.now() - (state.speedrunStart ?? Date.now());
        const { isNewRecord, prevBest } = submitSpeedrunTime(
          state.script!,
          elapsed,
        );
        const script = SCRIPTS[state.script as keyof typeof SCRIPTS];
        let msg = "";
        if (isNewRecord && prevBest === null) {
          msg = `⚡ <b>First record set!</b> ${script?.label ?? ""} in <b>${fmtTime(elapsed)}</b>`;
        } else if (isNewRecord) {
          msg = `⚡ <b>New Record!</b> ${script?.label ?? ""} in <b>${fmtTime(elapsed)}</b>`;
        } else {
          msg = `Time: <b>${fmtTime(elapsed)}</b> — best: ${fmtTime(prevBest!)}`;
        }
        setPromoMsg(msg);
        setPromoClass(isNewRecord ? "conquest-success" : "");
      } else if (state.speedrun && state.speedrunFailed) {
        setPromoMsg(
          `💀 <b>Speedrun Failed</b> — too many mistakes. Try again!`,
        );
        setPromoClass("conquest-fail");
      }
    } catch (err) {
      console.error("ResultsScreen effect error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalQuestions = state.queue.length;
  const acc =
    totalQuestions > 0 ? Math.round((state.score / totalQuestions) * 100) : 0;

  const isConquestFail = state.conquest && state.conquestFailed;
  const isSpeedrunFail = state.speedrun && state.speedrunFailed;

  return (
    <section id="screen-results" className="results">
      {promoMsg && (
        <div
          className={`promo-banner ${promoClass}`}
          dangerouslySetInnerHTML={{ __html: promoMsg }}
        />
      )}

      <div className="score-stamp">
        <div className="num">
          {state.score}/{totalQuestions || "?"}
        </div>
        <div className="of">{t("results.correct")}</div>
      </div>

      <p className="acc">{t("results.accuracy", { acc })}</p>

      {state.missed.length > 0 && (
        <>
          <p className="missed-title">
            {state.conquest
              ? t("results.failureReason")
              : t("results.needsPractice")}
          </p>
          <div className="chips">
            {state.missed.map((m, i) => (
              <span key={i} className="chip">
                <span className="k">{m[0]}</span>
                <span className="r">{m[1]}</span>
              </span>
            ))}
          </div>
        </>
      )}

      <div className="result-actions">
        <button
          className="primary"
          type="button"
          onClick={() => window.location.reload()}
        >
          {isConquestFail
            ? t("results.tryAgainFromStart")
            : state.conquest
              ? t("results.conquerAgain")
              : state.speedrun || isSpeedrunFail
                ? t("results.speedrunAgain")
                : t("results.retrySet")}
        </button>
        <button
          className="ghost"
          type="button"
          data-i18n="common.back"
          onClick={() => setScreen("start")}
        >
          {t("common.back")}
        </button>
      </div>
    </section>
  );
}
