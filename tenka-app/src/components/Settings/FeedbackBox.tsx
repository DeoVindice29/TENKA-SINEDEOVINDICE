import { useState } from "react";
import { useLang } from "@/i18n/LangContext";

export default function FeedbackBox() {
  const { t } = useLang();
  const [msg, setMsg] = useState("");

  const send = () => {
    const subject = encodeURIComponent(t("feedback.subject"));
    const body = encodeURIComponent(msg.trim() || t("feedback.bodyDefault"));
    window.location.href = `mailto:ferlisuganda29@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="settings-group">
      <span className="settings-label">
        {t("feedback.heading")}
      </span>
      <textarea
        className="feedback-textarea"
        rows={3}
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder={t("feedback.placeholder")}
      />
      <button className="secondary" type="button" onClick={send}>
        {t("feedback.button")}
      </button>
    </div>
  );
}
