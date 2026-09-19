import { useLang } from "@/i18n/LangContext";
import { SCRIPTS } from "@/data/scripts";
import { useConquest } from "@/state/ConquestContext";

type ConquestModalProps = {
  open: boolean;
  scriptKey: string;
  onCancel: () => void;
  onConfirmConquest: () => void;
  onConfirmSpeedrun: () => void;
};

export default function ConquestModal({
  open,
  scriptKey,
  onCancel,
  onConfirmConquest,
  onConfirmSpeedrun,
}: ConquestModalProps) {
  const { t } = useLang();
  const { isConquered } = useConquest();

  if (!open) return null;

  const script = SCRIPTS[scriptKey as keyof typeof SCRIPTS];
  if (!script) return null;

  const total = (script.data as Record<string, readonly unknown[]>).all.length;
  const conquered = isConquered(scriptKey);
  const isThreePhase = scriptKey === "hiragana" || scriptKey === "katakana";

  // Speedrun mode
  if (conquered) {
    return (
      <div className="modal-overlay open" aria-hidden="false">
        <div className="modal-panel" role="alertdialog" aria-modal="true">
          <h2>{t("speedrun.modalTitleWithLabel", { label: script.label })}</h2>
          <p className="modal-text">
            {t("speedrun.intro", { count: total, label: script.label })}
          </p>
          <ul className="modal-rules">
            <li>{t("speedrun.rule.timed")}</li>
            <li>{t("speedrun.rule.mistakesCost")}</li>
            <li>{t("speedrun.rule.autoNext")}</li>
            <li>{t("speedrun.rule.recordSaved")}</li>
          </ul>
          <div className="modal-actions">
            <button className="ghost" type="button" onClick={onCancel}>
              {t("common.cancel")}
            </button>
            <button
              className="primary"
              type="button"
              onClick={onConfirmSpeedrun}
            >
              {t("speedrun.confirm")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conquest mode
  const bothConquered = isConquered("hiragana") && isConquered("katakana");
  const rules: string[] = [];
  if (isThreePhase) {
    rules.push(t("conquestModal.rule.typeOnly"));
    rules.push(t("conquestModal.rule.oneWrongFails"));
    rules.push(t("conquestModal.rule.failRestartChapter"));
    rules.push(
      scriptKey === "katakana" && !bothConquered
        ? t("conquestModal.rule.becomeKnightSolo")
        : t("conquestModal.rule.becomeKnightBoth"),
    );
  } else {
    rules.push(t("conquestModal.rule.allAtOnce"));
    rules.push(t("conquestModal.rule.oneWrongFails"));
    rules.push(t("conquestModal.rule.failRestartFirst"));
  }

  return (
    <div className="modal-overlay open" aria-hidden="false">
      <div className="modal-panel" role="alertdialog" aria-modal="true">
        <h2>{t("conquest.modalTitleWithLabel", { label: script.label })}</h2>
        <p className="modal-text">
          {isThreePhase
            ? t("conquestModal.threePhaseIntro", {
                label: script.label,
                count: total,
              })
            : t("conquestModal.singleIntro", {
                count: total,
                label: script.label,
              })}
        </p>
        <ul className="modal-rules">
          {rules.map((r, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: r }} />
          ))}
        </ul>
        <div className="modal-actions">
          <button className="ghost" type="button" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            className="primary danger"
            type="button"
            onClick={onConfirmConquest}
          >
            {t("conquestModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
