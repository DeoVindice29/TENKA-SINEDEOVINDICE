import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/state/AuthContext";

// Masukan dikirim langsung ke email lewat FormSubmit (layanan form untuk situs
// statis, tanpa API key). Pertama kali dipakai, FormSubmit mengirim email
// aktivasi ke alamat di bawah — klik tombol aktivasinya sekali saja.
const FEEDBACK_EMAIL = "tenka.sdv@gmail.com";
const FEEDBACK_ENDPOINT = `https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`;
const SEND_TIMEOUT_MS = 15000;
const MAX_LENGTH = 2000;
const APP_VERSION = "v1.0.0";

type Status = "idle" | "sending" | "error";

export default function FeedbackBox() {
  const { t, lang } = useLang();
  const { profile, isGuest } = useAuth();
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [thanksOpen, setThanksOpen] = useState(false);
  const thanksBtnRef = useRef<HTMLButtonElement>(null);

  const trimmed = msg.trim();
  const sending = status === "sending";

  useEffect(() => {
    if (thanksOpen) thanksBtnRef.current?.focus();
  }, [thanksOpen]);

  const send = async () => {
    if (!trimmed || sending) return;
    setStatus("sending");

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: t("feedback.subject"),
          _template: "table",
          _captcha: "false",
          _honey: "",
          Pesan: trimmed,
          Pengirim: isGuest || !profile?.username ? "Tamu (belum login)" : profile.username,
          Versi: APP_VERSION,
          Bahasa: lang,
          Perangkat: navigator.userAgent,
        }),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as { success?: string | boolean } | null;
      const ok = res.ok && data?.success !== false && data?.success !== "false";
      if (!ok) throw new Error("feedback send failed");

      setMsg("");
      setStatus("idle");
      setThanksOpen(true);
    } catch {
      // teks tetap dipertahankan supaya user tinggal coba kirim lagi
      setStatus("error");
    } finally {
      window.clearTimeout(timer);
    }
  };

  return (
    <div className="settings-card feedback-card">
      <textarea
        className="feedback-textarea"
        rows={5}
        maxLength={MAX_LENGTH}
        value={msg}
        disabled={sending}
        onChange={(e) => {
          setMsg(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        placeholder={t("feedback.placeholder")}
      />
      {status === "error" && (
        <p className="feedback-error" role="alert">
          {t("feedback.error")}
        </p>
      )}
      <button
        className="primary feedback-send-btn"
        type="button"
        disabled={!trimmed || sending}
        onClick={send}
      >
        {sending ? t("feedback.sending") : t("feedback.button")}
      </button>

      {thanksOpen &&
        createPortal(
          <div
            className="modal-overlay open"
            aria-hidden="false"
            onClick={(e) => {
              if (e.target === e.currentTarget) setThanksOpen(false);
            }}
          >
            <div
              className="modal-panel feedback-thanks"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="feedback-thanks-title"
            >
              <div className="feedback-thanks-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="30"
                  height="30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              </div>
              <h2 id="feedback-thanks-title">{t("feedback.thanksTitle")}</h2>
              <p className="modal-text">{t("feedback.thanksBody")}</p>
              <div className="modal-actions">
                <button
                  ref={thanksBtnRef}
                  className="primary"
                  type="button"
                  onClick={() => setThanksOpen(false)}
                >
                  {t("feedback.thanksClose")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
