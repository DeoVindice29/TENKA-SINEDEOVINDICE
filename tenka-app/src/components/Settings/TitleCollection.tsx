import { useLang } from "@/i18n/LangContext";
import { CONQUEST_TITLES, getConqueredTitles } from "@/data/titles";
import { useConquest } from "@/state/ConquestContext";

export default function TitleCollection() {
  const { t } = useLang();
  const { reloadFlag } = useConquest();
  void reloadFlag;

  const earned = getConqueredTitles();

  return (
    <div className="settings-group">
      <span className="settings-label">
        {t("titles.heading")}
      </span>
      <p className="title-collection-hint">
        {t("titles.hint")}
      </p>
      <div className="title-collection">
        {Object.keys(CONQUEST_TITLES).map((key) => {
          const ct = CONQUEST_TITLES[key];
          const has = !!earned[key];
          return (
            <div
              key={key}
              className={`title-badge ${has ? "earned" : "locked"}`}
            >
              <span className="title-badge-emoji">{has ? ct.emoji : "🔒"}</span>
              <span className="title-badge-name">{has ? ct.title : "???"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
