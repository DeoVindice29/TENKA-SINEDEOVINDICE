import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/state/AuthContext";
import ProfileCard from "@/components/Settings/ProfileCard";
import profileHeroBg from "@/assets/profile-hero-bg.webp";
import FontSelector from "@/components/Settings/FontSelector";
import RankLadder from "@/components/Settings/RankLadder";
import TitleCollection from "@/components/Settings/TitleCollection";
import SpeedrunRecords from "@/components/Settings/SpeedrunRecords";
import FeedbackBox from "@/components/Settings/FeedbackBox";
import SignOutModal from "@/components/Settings/SignOutModal";
import {
  UserIcon,
  PaletteIcon,
  TrophyIcon,
  MessageIcon,
  InfoIcon,
  LogoutIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from "@/components/Settings/icons";

const APP_VERSION = "v1.0.0";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  // opsional: kalau induk (App) sudah punya instance useTheme() sendiri
  // (mis. buat tombol toggle tema di topbar), dioper ke sini biar gak ada
  // dua state tema yang independen & gampang gak sinkron. Kalau gak
  // dioper, panel ini bikin instance-nya sendiri seperti sebelumnya.
  themeApi?: ReturnType<typeof useTheme>;
  // opsional: subview yang langsung dibuka saat panel ini open (mis. "profile"
  // waktu orang double-click nama/foto di sidebar). Default-nya "menu".
  initialView?: SettingsView;
};

// Layar utama Settings sekarang cuma 4 pintu masuk; klik salah satu pindah
// ke "subview" detailnya sendiri (dengan tombol back), bukan satu panel
// panjang berisi semua opsi sekaligus.
export type SettingsView = "menu" | "profile" | "appearance" | "progress" | "feedback";

export default function SettingsPanel({
  open,
  onClose,
  themeApi,
  initialView,
}: SettingsPanelProps) {
  const { lang, setLang, t } = useLang();
  const { signOut } = useAuth();
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const ownThemeApi = useTheme();
  const {
    theme,
    toggleTheme,
    borderStyle,
    setBorderStyle,
    customAccent,
    setCustomAccent,
    customText,
    setCustomText,
    customOnAccent,
    setCustomOnAccent,
    customIcon,
    setCustomIcon,
    customBackground,
    setCustomBackground,
    customQuizCorrect,
    setCustomQuizCorrect,
    customQuizWrong,
    setCustomQuizWrong,
    customVermillion,
    setCustomVermillion,
    customGold,
    setCustomGold,
    customMoss,
    setCustomMoss,
    customChoiceBg,
    setCustomChoiceBg,
    customChoiceSelected,
    setCustomChoiceSelected,
    resetCustomTheme,
  } = themeApi ?? ownThemeApi;

  const [view, setView] = useState<SettingsView>("menu");
  // Warna kustom disembunyikan di balik disclosure, collapsed by default —
  // kecuali orang itu sebelumnya sudah pakai tema custom, biar gak "hilang"
  // pengaturannya. Murni state UI, gak menyentuh localStorage/tema itu sendiri.
  const [colorsOpen, setColorsOpen] = useState(borderStyle === "custom");

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // fokus pindah ke tombol tutup saat dibuka, dan kembali ke tombol gear
  // saat ditutup; setiap dibuka ulang selalu mulai dari menu utama.
  useEffect(() => {
    if (open) {
      setView(initialView ?? "menu");
      closeBtnRef.current?.focus();
    } else if (wasOpenRef.current) {
      document.getElementById("settings-toggle")?.focus();
    }
    wasOpenRef.current = open;
  }, [open, initialView]);

  // Matikan scroll layar di belakang panel selagi Settings kebuka, biar
  // background-nya gak ikut geser waktu orang scroll isi panel.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Esc: kalau lagi di subview, mundur ke menu dulu; kalau udah di menu
  // utama, baru tutup panelnya.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view !== "menu") setView("menu");
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, view]);

  const headerTitle =
    view === "menu"
      ? t("settings.menu.heading")
      : view === "profile"
      ? t("settings.menu.profile.title")
      : view === "appearance"
      ? t("settings.menu.appearance.title")
      : view === "progress"
      ? t("settings.menu.progress.title")
      : t("settings.menu.feedback.title");

  const headerSub =
    view === "menu"
      ? t("settings.menu.subheading")
      : view === "profile"
      ? t("settings.profile.subheading")
      : view === "appearance"
      ? t("settings.appearance.subheading")
      : view === "progress"
      ? t("settings.progress.subheading")
      : t("settings.feedback.subheading");

  return (
    <div
      className={`settings-overlay ${open ? "open" : ""}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`settings-panel settings-panel--${view}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {view === "profile" ? (
          /* Header khusus Profile: gak ada judul/teks, cuma dua tombol
             bulat (back + close) yang ngambang di atas gambar bg sakura,
             persis kartu mockup-nya — bukan sticky bar seperti view lain. */
          <div className="profile-hero-topbar">
            <button
              type="button"
              className="profile-hero-btn profile-hero-back"
              aria-label={t("aria.backToSettings")}
              onClick={() => setView("menu")}
            >
              <ArrowLeftIcon />
            </button>
            <button
              ref={closeBtnRef}
              type="button"
              className="profile-hero-btn profile-hero-close"
              aria-label={t("aria.closeSettings")}
              onClick={onClose}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ) : (
          <div className="settings-header">
            {view !== "menu" && (
              <button
                type="button"
                className="settings-back-btn"
                aria-label={t("aria.backToSettings")}
                onClick={() => setView("menu")}
              >
                <ArrowLeftIcon />
              </button>
            )}
            <div className="settings-header-text">
              <h2 id="settings-title">{headerTitle}</h2>
              <p className="settings-header-sub">{headerSub}</p>
            </div>
            <button
              ref={closeBtnRef}
              className="close-x"
              id="settings-close"
              type="button"
              aria-label={t("aria.closeSettings")}
              onClick={onClose}
            />
          </div>
        )}

        {/* ---------- menu utama: 4 pintu masuk + tentang + logout ---------- */}
        {view === "menu" && (
          <div className="settings-menu-scroll">
          <span className="settings-menu-section-label">
            <UserIcon className="settings-menu-section-icon" />
            {t("settings.menu.account.heading")}
          </span>
          <nav className="settings-menu" aria-label={t("settings.menu.heading")}>
            <button
              type="button"
              className="settings-menu-item"
              onClick={() => setView("profile")}
            >
              <span className="settings-menu-icon settings-menu-icon--profile">
                <UserIcon />
              </span>
              <span className="settings-menu-text">
                <span className="settings-menu-title">
                  {t("settings.menu.profile.title")}
                </span>
                <span className="settings-menu-desc">
                  {t("settings.menu.profile.desc")}
                </span>
              </span>
              <ChevronRightIcon className="settings-menu-chevron" />
            </button>

            <button
              type="button"
              className="settings-menu-item"
              onClick={() => setView("progress")}
            >
              <span className="settings-menu-icon settings-menu-icon--progress">
                <TrophyIcon />
              </span>
              <span className="settings-menu-text">
                <span className="settings-menu-title">
                  {t("settings.menu.progress.title")}
                </span>
                <span className="settings-menu-desc">
                  {t("settings.menu.progress.desc")}
                </span>
              </span>
              <ChevronRightIcon className="settings-menu-chevron" />
            </button>

            <button
              type="button"
              className="settings-menu-item"
              onClick={() => setView("appearance")}
            >
              <span className="settings-menu-icon settings-menu-icon--appearance">
                <PaletteIcon />
              </span>
              <span className="settings-menu-text">
                <span className="settings-menu-title">
                  {t("settings.menu.appearance.title")}
                </span>
                <span className="settings-menu-desc">
                  {t("settings.menu.appearance.desc")}
                </span>
              </span>
              <ChevronRightIcon className="settings-menu-chevron" />
            </button>

            <button
              type="button"
              className="settings-menu-item"
              onClick={() => setView("feedback")}
            >
              <span className="settings-menu-icon settings-menu-icon--feedback">
                <MessageIcon />
              </span>
              <span className="settings-menu-text">
                <span className="settings-menu-title">
                  {t("settings.menu.feedback.title")}
                </span>
                <span className="settings-menu-desc">
                  {t("settings.menu.feedback.desc")}
                </span>
              </span>
              <ChevronRightIcon className="settings-menu-chevron" />
            </button>
          </nav>

          <span className="settings-menu-section-label">
            <InfoIcon className="settings-menu-section-icon" />
            {t("settings.menu.about.heading")}
          </span>
          <div className="settings-about-card">
            <img src="/favicon.svg" alt="" className="settings-about-icon" />
            <div className="settings-about-text">
              <span className="settings-about-name">{t("settings.about.appName")}</span>
              <span className="settings-about-tagline">
                {t("settings.about.tagline")}
              </span>
              <span className="settings-about-version">{APP_VERSION}</span>
            </div>
          </div>

          <button
            type="button"
            className="settings-menu-item settings-menu-item--danger"
            onClick={() => setSignOutConfirmOpen(true)}
          >
            <span className="settings-menu-icon settings-menu-icon--danger">
              <LogoutIcon />
            </span>
            <span className="settings-menu-text">
              <span className="settings-menu-title">{t("auth.signOut")}</span>
            </span>
          </button>
          </div>
        )}

        {/* ---------- subview: Profile ---------- */}
        {view === "profile" && (
          <div
            className="profile-hero"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(175, 212, 245, 0.35) 0%, rgba(216, 236, 251, 0.25) 55%, rgba(243, 250, 255, 0.15) 100%), url(${profileHeroBg})`,
            }}
          >
            <ProfileCard variant="hero" />

            <button
              type="button"
              className="profile-hero-progress-link"
              onClick={() => setView("progress")}
            >
              <TrophyIcon />
              {t("profile.viewProgress")}
            </button>
          </div>
        )}

        {/* ---------- subview: Appearance ---------- */}
        {view === "appearance" && (
          <div className="settings-subview-body">
            <section className="settings-card">
              <span className="settings-card-title">
                {t("settings.appearance.display")}
              </span>

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
            </section>

            <section className="settings-card">
              <FontSelector />
            </section>

            <section className="settings-card">
              <span className="settings-card-title">
                {t("borderStyle.heading")}
              </span>
              <div
                className="border-style-options"
                role="group"
                aria-label={t("aria.chooseBorderStyle")}
              >
                <button
                  type="button"
                  className={`border-style-btn ${
                    borderStyle === "default" ? "active" : ""
                  }`}
                  onClick={() => setBorderStyle("default")}
                >
                  <span
                    className="border-style-swatch swatch-default"
                    aria-hidden="true"
                  />
                  <span>{t("borderStyle.default")}</span>
                </button>

                <button
                  type="button"
                  className={`border-style-btn ${
                    borderStyle === "custom" ? "active" : ""
                  }`}
                  onClick={() => {
                    setBorderStyle("custom");
                    setColorsOpen(true);
                  }}
                >
                  <span
                    className="border-style-swatch"
                    style={{ background: customAccent }}
                    aria-hidden="true"
                  />
                  <span>{t("borderStyle.custom")}</span>
                </button>
              </div>

              {/* Warna kustom: collapsed/secondary by default, biar gak
                  langsung nge-dump belasan color picker di layar. */}
              <details
                className="about-details custom-colors-details"
                open={colorsOpen}
                onToggle={(e) =>
                  setColorsOpen((e.target as HTMLDetailsElement).open)
                }
              >
                <summary>{t("settings.appearance.customColors")}</summary>
                <div className="custom-color-fields">
                  <span className="custom-color-section">
                    {t("borderStyle.sectionTextIcon")}
                  </span>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customAccent }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customAccent")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customAccent}
                      onChange={(e) => {
                        setCustomAccent(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomAccent")}
                    />
                  </label>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customIcon }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customIcon")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customIcon}
                      onChange={(e) => {
                        setCustomIcon(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomIcon")}
                    />
                  </label>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customText }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customText")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customText}
                      onChange={(e) => {
                        setCustomText(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomText")}
                    />
                  </label>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customOnAccent }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customOnAccent")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customOnAccent}
                      onChange={(e) => {
                        setCustomOnAccent(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomOnAccent")}
                    />
                  </label>

                  <span className="custom-color-section">
                    {t("borderStyle.sectionBackground")}
                  </span>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customBackground }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customBackground")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customBackground}
                      onChange={(e) => {
                        setCustomBackground(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomBackground")}
                    />
                  </label>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customChoiceBg }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customChoiceBg")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customChoiceBg}
                      onChange={(e) => {
                        setCustomChoiceBg(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomChoiceBg")}
                    />
                  </label>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customChoiceSelected }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customChoiceSelected")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customChoiceSelected}
                      onChange={(e) => {
                        setCustomChoiceSelected(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomChoiceSelected")}
                    />
                  </label>

                  <span className="custom-color-section">
                    {t("borderStyle.sectionQuiz")}
                  </span>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customQuizCorrect }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customQuizCorrect")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customQuizCorrect}
                      onChange={(e) => {
                        setCustomQuizCorrect(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomQuizCorrect")}
                    />
                  </label>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customQuizWrong }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customQuizWrong")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customQuizWrong}
                      onChange={(e) => {
                        setCustomQuizWrong(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomQuizWrong")}
                    />
                  </label>

                  <span className="custom-color-section">
                    {t("borderStyle.sectionAccents")}
                  </span>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customVermillion }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customVermillion")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customVermillion}
                      onChange={(e) => {
                        setCustomVermillion(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomVermillion")}
                    />
                  </label>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customGold }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customGold")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customGold}
                      onChange={(e) => {
                        setCustomGold(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomGold")}
                    />
                  </label>
                  <label className="custom-color-field">
                    <span
                      className="border-style-swatch"
                      style={{ background: customMoss }}
                      aria-hidden="true"
                    />
                    <span className="custom-color-field-label">
                      {t("borderStyle.customMoss")}
                    </span>
                    <input
                      type="color"
                      className="custom-color-input"
                      value={customMoss}
                      onChange={(e) => {
                        setCustomMoss(e.target.value);
                        setBorderStyle("custom");
                      }}
                      aria-label={t("aria.pickCustomMoss")}
                    />
                  </label>

                  <button
                    type="button"
                    className="custom-theme-reset"
                    onClick={resetCustomTheme}
                    aria-label={t("aria.resetCustomTheme")}
                  >
                    <span
                      className="custom-theme-reset-swatch"
                      aria-hidden="true"
                    />
                    <span>{t("borderStyle.reset")}</span>
                  </button>
                </div>
              </details>
            </section>
          </div>
        )}

        {/* ---------- subview: Progress ---------- */}
        {view === "progress" && (
          <div className="settings-subview-body">
            <section className="settings-card">
              <TitleCollection />
            </section>
            <SpeedrunRecords />
            <RankLadder />
          </div>
        )}

        {/* ---------- subview: Feedback ---------- */}
        {view === "feedback" && (
          <div className="settings-subview-body">
            <FeedbackBox />
          </div>
        )}
      </div>

      {signOutConfirmOpen && (
        <SignOutModal
          onCancel={() => setSignOutConfirmOpen(false)}
          onConfirm={() => {
            setSignOutConfirmOpen(false);
            signOut();
          }}
        />
      )}
    </div>
  );
}
