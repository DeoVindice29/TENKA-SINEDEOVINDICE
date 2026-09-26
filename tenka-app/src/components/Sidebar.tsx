import type { ComponentType } from "react";
import { useUI, type Screen } from "@/state/UIContext";
import { useLang } from "@/i18n/LangContext";
import { useState, useEffect } from "react";
import { useAuth } from "@/state/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useRankIndex } from "@/hooks/useRankIndex";
import { RANK_LEVELS } from "@/data/ranks";
import { SIDEBAR_QUOTES, type SidebarQuote } from "@/data/sidebarQuotes";
import navArt from "@/assets/hero-sidebar.webp";

type IconProps = { className?: string };

function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5V5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6.2" y="5.5" width="14" height="10" rx="2" transform="rotate(8 13.2 10.5)" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="8" width="14" height="10" rx="2" fill="var(--card, #fff)" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PracticeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3.5h9L20 8v12.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3.5V8a1 1 0 0 0 1 1h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 13h8M8 16.5h8M8 9.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20V4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 20v-6m4.5 6V8m4.5 12v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.92 2.92l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V19.6a2.06 2.06 0 1 1-4.12 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.92-2.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H4.4a2.06 2.06 0 1 1 0-4.12h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.92-2.92l.06.06a1.7 1.7 0 0 0 1.87.34H10.6A1.7 1.7 0 0 0 11.63 3H11.7a2.06 2.06 0 1 1 4.12 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.92 2.92l-.06.06a1.7 1.7 0 0 0-.34 1.87v.07a1.7 1.7 0 0 0 1.56 1.03h.09a2.06 2.06 0 1 1 0 4.12h-.09a1.7 1.7 0 0 0-1.56 1.03Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type NavItem = {
  key: Screen;
  labelKey: string;
  icon: ComponentType<IconProps>;
  matches: (s: Screen) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "start",
    labelKey: "nav.home",
    icon: HomeIcon,
    matches: (s) =>
      s === "start" ||
      s === "quiz" ||
      s === "match" ||
      s === "results" ||
      s === "conquest-story" ||
      s === "n4",
  },
  {
    key: "learn",
    labelKey: "nav.learn",
    icon: BookIcon,
    matches: (s) => s === "learn",
  },
  {
    key: "flashdeck",
    labelKey: "nav.flashcard",
    icon: CardsIcon,
    matches: (s) => s === "flashdeck" || s === "flashcard",
  },
  {
    key: "practice",
    labelKey: "nav.practice",
    icon: PracticeIcon,
    matches: (s) => s === "practice",
  },
  {
    key: "statistik",
    labelKey: "nav.statistik",
    icon: ChartIcon,
    matches: (s) => s === "statistik",
  },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  onOpenSettings: (view?: "profile") => void;
  // dipanggil pas ikon sakura di kartu promo diklik — bukan navigasi URL,
  // biar tetap satu SPA dan admin panel aslinya (dgn login Google +
  // cek is_admin di server) yang nentuin siapa yang beneran bisa masuk.
  onOpenAdmin: () => void;
};

export default function Sidebar({ open, onClose, onOpenSettings, onOpenAdmin }: SidebarProps) {
  const { screen, setScreen } = useUI();
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const legacy = useProfile();
  const rankIndex = useRankIndex();
  const [brokenPhoto, setBrokenPhoto] = useState<string | null>(null);
  // nama & foto ngikut profil akun (Supabase); localStorage lama cuma fallback
  const photo = profile?.avatar_url || legacy.photo || "";
  const showPhoto = Boolean(photo) && brokenPhoto !== photo;

  // kartu promo di bawah sidebar gonta-ganti kutipan/tips setiap 6 detik:
  // teks lama geser ke kanan sambil menghilang, teks baru masuk dari kiri.
  // Keduanya dirender bertumpuk (yang lama absolute di atas yang baru)
  // selama masa transisi, lalu yang lama di-unmount.
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [prevQuote, setPrevQuote] = useState<SidebarQuote | null>(null);
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(true);

  useEffect(() => {
    if (SIDEBAR_QUOTES.length <= 1) return;
    const rotate = setTimeout(() => {
      setPrevQuote(SIDEBAR_QUOTES[quoteIndex]);
      setExiting(false);
      setEntered(false);
      setQuoteIndex((quoteIndex + 1) % SIDEBAR_QUOTES.length);
      // dua rAF: pastikan browser sempat "commit" posisi awal (rest utk yg
      // lama, offset kiri utk yg baru) sebelum kelas transisinya dipasang,
      // biar transition-nya benar-benar keplay bukan cuma lompat langsung.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setExiting(true);
          setEntered(true);
        });
      });
    }, 6000);
    return () => clearTimeout(rotate);
  }, [quoteIndex]);

  useEffect(() => {
    if (!prevQuote) return;
    const clear = setTimeout(() => setPrevQuote(null), 320);
    return () => clearTimeout(clear);
  }, [prevQuote]);

  const quote = SIDEBAR_QUOTES[quoteIndex] ?? SIDEBAR_QUOTES[0];

  const rank = RANK_LEVELS[rankIndex] ?? RANK_LEVELS[0];
  const displayName =
    profile?.username?.trim() || legacy.nickname?.trim() || "Traveler";

  const go = (s: Screen) => {
    setScreen(s);
    onClose();
  };

  const openProfileSettings = () => {
    onOpenSettings("profile");
    onClose();
  };

  return (
    <>
      <div
        className={`sidebar-scrim ${open ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? "open" : ""}`} id="app-sidebar">
        <div
          className="sidebar-identity sidebar-identity--clickable"
          role="button"
          tabIndex={0}
          title={t("sidebar.identity.editHint")}
          onDoubleClick={openProfileSettings}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openProfileSettings();
            }
          }}
        >
          <span className="sidebar-identity-icon">
            {showPhoto ? (
              <img src={photo} alt="" onError={() => setBrokenPhoto(photo)} />
            ) : (
              <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="20" width="52" height="6" rx="1" fill="currentColor" />
                <rect x="10" y="29" width="44" height="5" rx="1" fill="currentColor" />
                <rect x="14" y="20" width="6" height="34" rx="1" fill="currentColor" />
                <rect x="44" y="20" width="6" height="34" rx="1" fill="currentColor" />
              </svg>
            )}
          </span>
          <span className="sidebar-identity-text">
            <strong>{displayName}</strong>
            <small>
              <span className="sidebar-rank-emoji">{rank.emoji}</span>
              {rank.subtitle} · {rank.title}
            </small>
          </span>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.matches(screen);
            return (
              <button
                key={item.key}
                type="button"
                className={`sidebar-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => go(item.key)}
              >
                <Icon className="sidebar-nav-icon" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-nav-item sidebar-settings-item"
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
          >
            <GearIcon className="sidebar-nav-icon" />
            <span>{t("nav.settings")}</span>
          </button>

          <div className="sidebar-promo">
            <svg
              className="sidebar-promo-sakura"
              viewBox="0 0 24 24"
              role="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={onOpenAdmin}
            >
              <g fill="#F7A8BC">
                <ellipse cx="12" cy="6.2" rx="3.6" ry="4.6" />
                <ellipse cx="12" cy="6.2" rx="3.6" ry="4.6" transform="rotate(72 12 12)" />
                <ellipse cx="12" cy="6.2" rx="3.6" ry="4.6" transform="rotate(144 12 12)" />
                <ellipse cx="12" cy="6.2" rx="3.6" ry="4.6" transform="rotate(216 12 12)" />
                <ellipse cx="12" cy="6.2" rx="3.6" ry="4.6" transform="rotate(288 12 12)" />
              </g>
              <circle cx="12" cy="12" r="2.2" fill="#E5677F" />
            </svg>
            <div className="sidebar-promo-quote-wrap">
              {prevQuote && (
                <p className={`sidebar-promo-quote sidebar-promo-quote--exit ${exiting ? "is-exiting" : ""}`}>
                  {prevQuote.lines[lang].map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < prevQuote.lines[lang].length - 1 && <br />}
                    </span>
                  ))}
                </p>
              )}
              <p className={`sidebar-promo-quote sidebar-promo-quote--enter ${entered ? "is-entered" : ""}`}>
                {quote.lines[lang].map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < quote.lines[lang].length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
            <img className="sidebar-promo-art" src={navArt} alt="" aria-hidden="true" />
          </div>
        </div>
      </aside>
    </>
  );
}
