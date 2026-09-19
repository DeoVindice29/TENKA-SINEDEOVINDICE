import { useLang } from "@/i18n/LangContext";
import { useConquest } from "@/state/ConquestContext";
import { SCRIPTS } from "@/data/scripts";
import { CONQUEST_TITLES, getConqueredTitles } from "@/data/titles";

function fmtTime(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const m = Math.floor(totalCs / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(
    cs,
  ).padStart(2, "0")}`;
}

export default function SpeedrunRecords() {
  const { lang } = useLang();
  const { getSpeedrunBestTime, reloadFlag } = useConquest();
  void reloadFlag;

  const earned = getConqueredTitles();
  const conqueredKeys = Object.keys(CONQUEST_TITLES).filter((k) => !!earned[k]);

  return (
    <div className="settings-group">
      <span className="settings-label">
        {lang === "id" ? "Rekor Speedrun" : "Speedrun Records"}
      </span>
      <p className="title-collection-hint">
        {lang === "id"
          ? "Waktu tercepatmu untuk tiap aksara yang sudah ditaklukkan."
          : "Your fastest completed run for each conquered script."}
      </p>
      <div className="speedrun-records">
        {conqueredKeys.length === 0 ? (
          <p className="speedrun-records-empty">
            {lang === "id"
              ? "Taklukkan sebuah aksara ⚔️ untuk membuka Mode Speedrun-nya."
              : "Conquer a script ⚔️ to unlock Speedrun Mode for it."}
          </p>
        ) : (
          conqueredKeys.map((key) => {
            const ct = CONQUEST_TITLES[key];
            const script = SCRIPTS[key as keyof typeof SCRIPTS];
            const best = getSpeedrunBestTime(key);
            return (
              <div key={key} className="speedrun-record-row">
                <span className="speedrun-record-emoji">{ct.emoji}</span>
                <span className="speedrun-record-label">
                  {script?.label ?? key}
                </span>
                <span
                  className={`speedrun-record-time ${
                    best === null ? "no-record" : ""
                  }`}
                >
                  {best !== null
                    ? fmtTime(best)
                    : lang === "id"
                      ? "Belum pernah dicoba"
                      : "Not run yet"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
