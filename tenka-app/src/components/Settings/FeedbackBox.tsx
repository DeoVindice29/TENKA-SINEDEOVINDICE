import { useState } from "react";
import { useLang } from "@/i18n/LangContext";

export default function FeedbackBox() {
  const { lang } = useLang();
  const [msg, setMsg] = useState("");

  const send = () => {
    const subject = encodeURIComponent(
      lang === "id"
        ? "Masukan — Learning Japanese App"
        : "Feedback — Learning Japanese App",
    );
    const body = encodeURIComponent(
      msg.trim() ||
        (lang === "id"
          ? "Tulis masukanmu di sini..."
          : "Write your feedback here..."),
    );
    window.location.href = `mailto:ferlisuganda29@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="settings-group">
      <span className="settings-label">
        {lang === "id" ? "Kirim Masukan" : "Send Feedback"}
      </span>
      <textarea
        className="feedback-textarea"
        rows={3}
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder={
          lang === "id"
            ? "Ada saran, ide, atau nemu bug? Tulis di sini..."
            : "Got a suggestion, idea, or found a bug? Write it here..."
        }
      />
      <button className="secondary" type="button" onClick={send}>
        {lang === "id" ? "Kirim Masukan" : "Send Feedback"}
      </button>
    </div>
  );
}
