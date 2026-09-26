import { useLang } from "@/i18n/LangContext";
import { useUI, type ScriptKey } from "@/state/UIContext";
import Modal from "@/components/ui/Modal";
import { SCRIPTS } from "@/data/scripts";
import {
  MISSION_TOTAL,
  RANK_LEVELS,
  RANK_MISSIONS,
  getConquery,
} from "@/data/ranks";
import { useRankIndex } from "@/hooks/useRankIndex";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Popup "Misi Pangkat": daftar target (taklukkan tiap aksara N5) yang harus
// diselesaikan supaya naik pangkat. Status diambil dari data Penaklukan yang
// sudah tersimpan (getConquery), dibaca ulang tiap popup dibuka.
export default function RankMissionsModal({ open, onClose }: Props) {
  const { t } = useLang();
  const { setScreen, setCurrentScript, setSelectedMode, setQuizVariant } =
    useUI();
  const rankIndex = useRankIndex();

  const conquered = open ? getConquery() : {};
  const groups = RANK_MISSIONS.map((g) => ({
    ...g,
    rank: RANK_LEVELS[g.rankIndex],
    items: g.scripts.map((k) => ({ key: k, done: !!conquered[k] })),
  }));
  const done = groups.reduce(
    (n, g) => n + g.items.filter((i) => i.done).length,
    0,
  );
  const allDone = done === MISSION_TOTAL;
  const currentGroup = groups.findIndex((g) => g.items.some((i) => !i.done));

  const current = RANK_LEVELS[rankIndex] ?? RANK_LEVELS[0];
  const next = allDone ? null : groups[currentGroup]?.rank ?? null;
  const pct = Math.round((done / MISSION_TOTAL) * 100);

  const go = (key: ScriptKey) => {
    setCurrentScript(key);
    setSelectedMode(null);
    setQuizVariant("meaning");
    setScreen("start");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="missions-title"
      panelClassName="missions-panel"
    >
      <h2 id="missions-title">{t("missions.title")}</h2>
      <p className="modal-text">{t("missions.sub")}</p>

      <div className="missions-hero">
        <div className="missions-rank">
          <span className="missions-rank-emoji">{current.emoji}</span>
          <small>{t("missions.current")}</small>
          <strong>{current.title}</strong>
        </div>
        <span className="missions-hero-arrow" aria-hidden="true">
          ›
        </span>
        <div className={`missions-rank ${next ? "" : "muted"}`}>
          <span className="missions-rank-emoji">{next ? next.emoji : "🏆"}</span>
          <small>{t("missions.next")}</small>
          <strong>{next ? next.title : "N4"}</strong>
        </div>
      </div>

      <div className="missions-progress">
        <div
          className="missions-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={MISSION_TOTAL}
          aria-valuenow={done}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <small>{t("missions.progress", { done, total: MISSION_TOTAL })}</small>
      </div>

      <ol className="missions-list">
        {groups.map((g, gi) => (
          <li
            key={g.rankIndex}
            className={`missions-group ${
              gi === currentGroup ? "current" : ""
            }`}
          >
            <div className="missions-group-head">
              <span>{g.rank.emoji}</span>
              <span>{t("missions.unlocks", { rank: g.rank.title })}</span>
            </div>
            {g.items.map((it) => (
              <div
                key={it.key}
                className={`mission-row ${it.done ? "done" : ""}`}
              >
                <span className="mission-check" aria-hidden="true">
                  {it.done ? "✓" : ""}
                </span>
                <span className="mission-text">
                  {t("missions.conquer", { label: SCRIPTS[it.key].label })}
                </span>
                {it.done ? (
                  <span className="mission-done">{t("missions.done")}</span>
                ) : (
                  <button
                    type="button"
                    className="mission-go"
                    onClick={() => go(it.key)}
                  >
                    {t("missions.go")}
                  </button>
                )}
              </div>
            ))}
          </li>
        ))}
      </ol>

      <p className="missions-later">
        {allDone ? `${t("missions.allN5")} ` : ""}
        {t("missions.later")}
      </p>

      <div className="modal-actions">
        <button className="ghost" type="button" onClick={onClose}>
          {t("missions.close")}
        </button>
      </div>
    </Modal>
  );
}
