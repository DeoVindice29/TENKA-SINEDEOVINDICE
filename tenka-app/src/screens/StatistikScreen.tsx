import { useLang } from "@/i18n/LangContext";

export default function StatistikScreen() {
  const { t } = useLang();

  return (
    <section id="screen-statistik">
      <div className="empty-state-card">
        <div className="empty-state-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 19V5M4 19h16M8 19v-6m4 6V9m4 10v-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>{t("statistik.comingSoonTitle")}</h2>
        <p>{t("statistik.comingSoonDesc")}</p>
      </div>
    </section>
  );
}
