import { useCallback, useEffect, useState } from "react";

const BORDER_STYLE_KEY = "tebakAksara_choiceBorderStyle_v1";
const THEME_KEY = "tebakAksara_theme_v1";

export const VALID_BORDER_STYLES = [
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
] as const;

export type BorderStyle = (typeof VALID_BORDER_STYLES)[number];
export type Theme = "light" | "dark";

const THEME_HUES: Record<string, number> = {
  pink: 330,
  purple: 265,
  cyan: 189,
  blue: 217,
  green: 142,
  yellow: 42,
  orange: 24,
  rose: 5,
  teal: 175,
};

const THEME_OVERRIDE_VARS = [
  "--paper",
  "--paper-dark",
  "--card",
  "--ink",
  "--ink-soft",
  "--indigo",
  "--indigo-deep",
  "--vermillion",
  "--gold",
  "--moss",
  "--line",
  "--quiz-correct",
  "--quiz-wrong",
  "--quiz-correct-fill",
  "--quiz-correct-fill-text",
  "--match-selecting",
  "--match-selecting-bg",
  "--match-selecting-text",
];

function hsl(h: number, s: number, l: number): string {
  return `hsl(${((h % 360) + 360) % 360}, ${s}%, ${l}%)`;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${((h % 360) + 360) % 360}, ${s}%, ${l}%, ${a})`;
}

function buildBwVars(isDark: boolean): Record<string, string> {
  return isDark
    ? {
        "--paper": "#10161D",
        "--paper-dark": "#0B0F14",
        "--card": "#1A222B",
        "--ink": "#EDF1F5",
        "--ink-soft": "#8A96A3",
        "--indigo": "#3EC6FF",
        "--indigo-deep": "#1FA8DE",
        "--vermillion": "#4C7CE8",
        "--gold": "#FFD166",
        "--moss": "#6EE7A0",
        "--line": "rgba(237, 241, 245, 0.09)",
        "--quiz-correct": "#10B981",
        "--quiz-wrong": "#F2685C",
        "--quiz-correct-fill": "#14475D",
        "--quiz-correct-fill-text": "#CFEFFC",
        "--match-selecting": "#3EC6FF",
        "--match-selecting-bg": "#1A222B",
        "--match-selecting-text": "#3EC6FF",
      }
    : {
        "--paper": "#EAF0F5",
        "--paper-dark": "#DCE6ED",
        "--card": "#F6FAFC",
        "--ink": "#16202A",
        "--ink-soft": "#55636F",
        "--indigo": "#0E8FC0",
        "--indigo-deep": "#0B6E97",
        "--vermillion": "#1D4ED8",
        "--gold": "#C98A1C",
        "--moss": "#2F9E5D",
        "--line": "rgba(22, 32, 42, 0.13)",
        "--quiz-correct": "#10B981",
        "--quiz-wrong": "#B23A2E",
        "--quiz-correct-fill": "#1D5B72",
        "--quiz-correct-fill-text": "#ECF9FE",
        "--match-selecting": "#0E8FC0",
        "--match-selecting-bg": "#F6FAFC",
        "--match-selecting-text": "#0E8FC0",
      };
}

function applyThemeColorOverrides(style: BorderStyle, isDark: boolean): void {
  const root = document.documentElement.style;
  if (style === "bw") {
    THEME_OVERRIDE_VARS.forEach((v) => root.removeProperty(v));
    Object.entries(buildBwVars(isDark)).forEach(([k, v]) =>
      root.setProperty(k, v),
    );
    return;
  }

  if (style === "rainbow" || !(style in THEME_HUES)) {
    THEME_OVERRIDE_VARS.forEach((v) => root.removeProperty(v));
    return;
  }

  const h = THEME_HUES[style];
  const wrong = h + 180;
  THEME_OVERRIDE_VARS.forEach((v) => root.removeProperty(v));

  const vars = isDark
    ? {
        "--paper": hsl(h, 22, 12),
        "--paper-dark": hsl(h, 22, 15),
        "--card": hsl(h, 20, 17),
        "--ink": hsl(h, 14, 92),
        "--ink-soft": hsl(h, 14, 72),
        "--indigo": hsl(h, 75, 68),
        "--indigo-deep": hsl(h, 75, 78),
        "--vermillion": hsl(h + 12, 72, 64),
        "--gold": hsl(h + 28, 82, 66),
        "--moss": hsl(h + 45, 55, 60),
        "--line": hsla(h, 20, 85, 0.16),
        "--quiz-correct": hsl(h, 65, 60),
        "--quiz-wrong": hsl(wrong, 65, 62),
        "--quiz-correct-fill": hsl(h, 55, 26),
        "--match-selecting": hsl(h + 45, 55, 55),
      }
    : {
        "--paper": hsl(h, 22, 88),
        "--paper-dark": hsl(h, 25, 82),
        "--card": hsl(h, 28, 93),
        "--ink": hsl(h, 12, 15),
        "--ink-soft": hsl(h, 10, 38),
        "--indigo": hsl(h, 62, 42),
        "--indigo-deep": hsl(h, 66, 32),
        "--vermillion": hsl(h + 12, 70, 47),
        "--gold": hsl(h + 28, 75, 52),
        "--moss": hsl(h + 45, 45, 36),
        "--line": hsla(h, 20, 20, 0.16),
        "--quiz-correct": hsl(h, 58, 34),
        "--quiz-wrong": hsl(wrong, 58, 40),
        "--quiz-correct-fill": hsl(h, 55, 26),
        "--match-selecting": hsl(h + 45, 45, 38),
      };

  Object.entries(vars).forEach(([k, v]) => root.setProperty(k, v));
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  const [borderStyle, setBorderStyleState] = useState<BorderStyle>(() => {
    const stored = localStorage.getItem(BORDER_STYLE_KEY);
    return VALID_BORDER_STYLES.includes(stored as BorderStyle)
      ? (stored as BorderStyle)
      : "bw";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    applyThemeColorOverrides(borderStyle, theme === "dark");
  }, [theme, borderStyle]);

  useEffect(() => {
    document.documentElement.setAttribute("data-choice-border", borderStyle);
    localStorage.setItem(BORDER_STYLE_KEY, borderStyle);
    applyThemeColorOverrides(borderStyle, theme === "dark");
  }, [borderStyle, theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    [],
  );
  const setBorderStyle = useCallback(
    (s: BorderStyle) => setBorderStyleState(s),
    [],
  );

  return { theme, setTheme, toggleTheme, borderStyle, setBorderStyle };
}
