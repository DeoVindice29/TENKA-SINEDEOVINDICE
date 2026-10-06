import { useEffect } from "react";
import { useLang } from "@/i18n/LangContext";

interface AvatarZoomModalProps {
  src: string;
  onClose: () => void;
  /** Optional — lets the viewer jump straight to picking a new photo. */
  onChangePhoto?: () => void;
}

export default function AvatarZoomModal({
  src,
  onClose,
  onChangePhoto,
}: AvatarZoomModalProps) {
  const { t } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay open avatar-zoom-overlay"
      aria-hidden="false"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel avatar-zoom-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("aria.viewPhoto")}
      >
        <button
          type="button"
          className="avatar-zoom-close"
          aria-label={t("aria.closeZoom")}
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>

        <img src={src} alt="" className="avatar-zoom-img" />

        {onChangePhoto && (
          <button
            type="button"
            className="avatar-zoom-change-btn"
            onClick={onChangePhoto}
          >
            {t("profile.changePhoto")}
          </button>
        )}
      </div>
    </div>
  );
}
