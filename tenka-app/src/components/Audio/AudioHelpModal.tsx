import { useLang } from "@/i18n/LangContext";
import Modal from "@/components/ui/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Panduan "audio tidak keluar". Suara Jepang dibacakan oleh mesin
// Text-to-speech milik HP (bukan oleh app), jadi data suaranya harus ada di HP.
export default function AudioHelpModal({ open, onClose }: Props) {
  const { t } = useLang();

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="audio-help-title"
      panelClassName="audio-help-panel"
    >
      <h2 id="audio-help-title">🔊 {t("audioHelp.title")}</h2>
      <p className="modal-text">{t("audioHelp.intro")}</p>

      <h3 className="audio-help-sub">{t("audioHelp.androidHeading")}</h3>
      <ol className="audio-help-steps">
        <li>{t("audioHelp.a1")}</li>
        <li>{t("audioHelp.a2")}</li>
        <li>{t("audioHelp.a3")}</li>
        <li>{t("audioHelp.a4")}</li>
        <li>{t("audioHelp.a5")}</li>
      </ol>

      <h3 className="audio-help-sub">{t("audioHelp.iosHeading")}</h3>
      <p className="modal-text">{t("audioHelp.ios")}</p>

      <h3 className="audio-help-sub">{t("audioHelp.stillHeading")}</h3>
      <ul className="audio-help-steps audio-help-bullets">
        <li>{t("audioHelp.s1")}</li>
        <li>{t("audioHelp.s2")}</li>
        <li>{t("audioHelp.s3")}</li>
      </ul>

      <div className="modal-actions">
        <button className="primary" type="button" onClick={onClose}>
          {t("audioHelp.close")}
        </button>
      </div>
    </Modal>
  );
}
