import { useEffect, useRef } from "react";
import { useLang } from "@/i18n/LangContext";
import { useTheme, type BorderStyle } from "@/hooks/useTheme";
import ProfileCard from "@/components/Settings/ProfileCard";
import FontSelector from "@/components/Settings/FontSelector";
import RankLadder from "@/components/Settings/RankLadder";
import TitleCollection from "@/components/Settings/TitleCollection";
import SpeedrunRecords from "@/components/Settings/SpeedrunRecords";
import FeedbackBox from "@/components/Settings/FeedbackBox";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme, borderStyle, setBorderStyle } = useTheme();

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // fokus pindah ke tombol tutup saat dibuka, dan kembali ke tombol gear
  // saat ditutup; Esc menutup panel.
  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
    } else if (wasOpenRef.current) {
      document.getElementById("settings-toggle")?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`settings-overlay ${open ? "open" : ""}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <h2 id="settings-title">
          Settings
          <button
            ref={closeBtnRef}
            className="close-x"
            id="settings-close"
            type="button"
            aria-label={t("aria.closeSettings")}
            onClick={onClose}
          />
        </h2>

        {/* Profile */}
        <div className="settings-group">
          <span className="settings-label">Profile</span>
          <ProfileCard />
        </div>

        {/* Speedrun Records */}
        <SpeedrunRecords />

        {/* Title Collection */}
        <TitleCollection />

        {/* About / Rank Ladder */}
        <RankLadder />

        {/* Appearance */}
        <div className="settings-group">
          <span className="settings-label">Appearance</span>

          <div className="theme-row">
            <span id="theme-toggle-label">
              {theme === "dark" ? t("theme.dark") : t("theme.light")}
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={toggleTheme}
                aria-labelledby="theme-toggle-label"
              />
              <span className="track" />
              <span className="thumb" id="theme-toggle" />
            </label>
          </div>

          <div className="lang-row">
            <span>{t("appearance.language")}</span>
            <div
              className="lang-options"
              role="group"
              aria-label={t("aria.chooseLanguage")}
            >
              <button
                type="button"
                className={`lang-btn ${lang === "en" ? "active" : ""}`}
                onClick={() => setLang("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${lang === "id" ? "active" : ""}`}
                onClick={() => setLang("id")}
              >
                ID
              </button>
            </div>
          </div>
        </div>

        {/* Font Selector */}
        <FontSelector />

        {/* Theme Color */}
        <div className="settings-group">
          <span className="settings-label">{t("borderStyle.heading")}</span>
          <div
            className="border-style-options"
            role="group"
            aria-label={t("aria.chooseBorderStyle")}
          >
            {(
              [
                "bw",
                "rainbow",
                "pink",
                "purple",
                "cyan",
                "blue",
                "green",
                "yellow",
                "orange",
                "rose",
                "teal",
              ] as BorderStyle[]
            ).map((style) => (
              <button
                key={style}
                type="button"
                className={`border-style-btn ${
                  borderStyle === style ? "active" : ""
                }`}
                onClick={() => setBorderStyle(style)}
              >
                <span
                  className={`border-style-swatch swatch-${style}`}
                  aria-hidden="true"
                />
                <span>{t(`borderStyle.${style}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <FeedbackBox />
      </div>
    </div>
  );
}
