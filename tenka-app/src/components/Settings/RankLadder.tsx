import { useLang } from "@/i18n/LangContext";
import { RANK_LEVELS, RANK_REQ_ID } from "@/data/ranks";
import { useRankIndex } from "@/hooks/useRankIndex";

export default function RankLadder() {
  const { t, lang } = useLang();
  // dulu baca localStorage mentah langsung (key global, gak ikut akun aktif
  // & gak ke-update pas ganti akun) — sekarang lewat hook yang sama kayak
  // Sidebar/RankMissionsModal.
  const rankIndex = useRankIndex();

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
              <img className="rank-logo" src={r.logo} alt="" aria-hidden="true" />
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