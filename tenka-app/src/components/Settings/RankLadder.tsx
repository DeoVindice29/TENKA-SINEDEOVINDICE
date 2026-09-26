import { useLang } from "@/i18n/LangContext";
import { RANK_LEVELS, RANK_REQ_ID } from "@/data/ranks";

export default function RankLadder() {
  const { t, lang } = useLang();
  const rankIndex =
    parseInt(localStorage.getItem("tebakAksara_rank_v1") || "0", 10) || 0;

  const loc = (str: string) =>
    lang === "id" ? (RANK_REQ_ID as Record<string, string>)[str] || str : str;

  return (
    <details className="about-details">
      <summary>{t("about.summary")}</summary>
      <p className="about-intro">
        {t("about.intro")}
      </p>
      <ol className="rank-ladder">
        {RANK_LEVELS.map((r, i) => {
          const status = r.locked
            ? "locked"
            : i < rankIndex
            ? "done"
            : i === rankIndex
            ? "current"
            : "todo";
          return (
            <li key={i} className={`rank-item ${status}`}>
              <span className="rank-emoji">{r.emoji}</span>
              <span className="rank-body">
                <span className="rank-name">
                  {r.title}{" "}
                  <span className="rank-jp">{r.subtitle}</span>
                </span>
                <span className="rank-req">{loc(r.req)}</span>
              </span>
              {r.locked && (
                <span className="rank-soon">
                  {t("rank.comingSoon")}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}