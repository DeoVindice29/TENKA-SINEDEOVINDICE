import { useLang } from "@/i18n/LangContext";

interface SignOutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SignOutModal({
  onConfirm,
  onCancel,
}: SignOutModalProps) {
  const { t } = useLang();

  return (
    <div
      className="modal-overlay open"
      aria-hidden="false"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="modal-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
      >
        <h2 id="signout-modal-title">{t("auth.signOutConfirmTitle")}</h2>
        <p className="modal-text">{t("auth.signOutConfirmBody")}</p>
        <div className="modal-actions">
          <button className="ghost" type="button" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            className="primary danger"
            type="button"
            onClick={onConfirm}
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
