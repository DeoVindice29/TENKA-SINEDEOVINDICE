import { useLang } from "@/i18n/LangContext";
import { CONQUEST_TITLES, getConqueredTitles } from "@/data/titles";
import { useConquest } from "@/state/ConquestContext";
import { LockIcon } from "@/components/Settings/icons";

export default function TitleCollection() {
  const { t } = useLang();
  const { reloadFlag } = useConquest();
  void reloadFlag;

  const earned = getConqueredTitles();

  return (
    <>
      <span className="settings-card-title">
        {t("titles.heading")}
      </span>
      <p className="title-collection-hint">
        {t("titles.hint")}
      </p>
      <div className="achievement-grid">
        {Object.keys(CONQUEST_TITLES).map((key) => {
          const ct = CONQUEST_TITLES[key];
          const has = !!earned[key];
          return (
            <div
              key={key}
              className={`achievement-card ${has ? "earned" : "locked"}`}
            >
              <span className="achievement-glyph">
                {has ? ct.emoji : <LockIcon className="achievement-lock-icon" />}
              </span>
              <span className="achievement-name">{has ? ct.title : "???"}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
