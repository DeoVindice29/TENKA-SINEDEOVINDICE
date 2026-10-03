import { useEffect } from "react";
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

  // Esc menutup modal, sama seperti komponen Modal umum.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="modal-overlay open"
      aria-hidden="false"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="modal-panel confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
        aria-describedby="signout-modal-body"
      >
        <span className="confirm-modal-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </span>
        <h2 id="signout-modal-title">{t("auth.signOutConfirmTitle")}</h2>
        <p id="signout-modal-body" className="modal-text">
          {t("auth.signOutConfirmBody")}
        </p>
        <div className="modal-actions">
          <button className="ghost" type="button" onClick={onCancel} autoFocus>
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
