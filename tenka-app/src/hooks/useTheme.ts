import { useCallback, useEffect, useState } from "react";

const BORDER_STYLE_KEY = "tebakAksara_choiceBorderStyle_v1";
const THEME_KEY = "tebakAksara_theme_v1";
const CUSTOM_ACCENT_KEY = "tebakAksara_customThemeAccent_v1";
const CUSTOM_TEXT_KEY = "tebakAksara_customThemeText_v1";
// text that sits ON TOP of colored/filled backgrounds (buttons, selected
// chips, quiz-correct fill) — kept separate from CUSTOM_TEXT_KEY, which is
// plain body text outside any colored background.
const CUSTOM_ON_ACCENT_KEY = "tebakAksara_customThemeOnAccent_v1";
// icon color — separate from body text so icons don't have to match --ink.
const CUSTOM_ICON_KEY = "tebakAksara_customThemeIcon_v1";
const CUSTOM_BG_KEY = "tebakAksara_customThemeBackground_v1";
const CUSTOM_QUIZ_CORRECT_KEY = "tebakAksara_customThemeQuizCorrect_v1";
const CUSTOM_QUIZ_WRONG_KEY = "tebakAksara_customThemeQuizWrong_v1";
const CUSTOM_VERMILLION_KEY = "tebakAksara_customThemeVermillion_v1";
const CUSTOM_GOLD_KEY = "tebakAksara_customThemeGold_v1";
const CUSTOM_MOSS_KEY = "tebakAksara_customThemeMoss_v1";
const CUSTOM_CHOICE_BG_KEY = "tebakAksara_customThemeChoiceBg_v1";
const CUSTOM_CHOICE_SELECTED_KEY = "tebakAksara_customThemeChoiceSelected_v1";

const DEFAULT_CUSTOM_ACCENT = "#2F5FDE";
const DEFAULT_CUSTOM_TEXT = "#16213E";
const DEFAULT_CUSTOM_ON_ACCENT = "#FFFFFF";
const DEFAULT_CUSTOM_ICON = "#16213E";
const DEFAULT_CUSTOM_BACKGROUND = "#EEF3FC";
const DEFAULT_CUSTOM_QUIZ_CORRECT = "#10B981";
const DEFAULT_CUSTOM_QUIZ_WRONG = "#DC2626";
const DEFAULT_CUSTOM_VERMILLION = "#2F5FDE";
const DEFAULT_CUSTOM_GOLD = "#F2A93C";
const DEFAULT_CUSTOM_MOSS = "#2F9E52";
// same as DEFAULT_CUSTOM_ACCENT: these two used to just piggyback on the
// accent color before they got their own pickers, so default to the same
// hex to keep a fresh custom theme looking like the default one.
const DEFAULT_CUSTOM_CHOICE_BG = "#2F5FDE";
const DEFAULT_CUSTOM_CHOICE_SELECTED = "#2F5FDE";

export const VALID_BORDER_STYLES = ["default", "custom"] as const;

export type BorderStyle = (typeof VALID_BORDER_STYLES)[number];
export type Theme = "light" | "dark";
export type CustomThemeColors = {
  accent: string;
  text: string;
  // text that sits ON TOP of colored/filled backgrounds (buttons, selected
  // chips, quiz-correct fill) — kept separate from `text`, which is plain
  // body text outside any colored background.
  onAccent: string;
  // icon color — separate from `text` so icons don't have to match --ink.
  icon: string;
  background: string;
  quizCorrect: string;
  quizWrong: string;
  vermillion: string;
  gold: string;
  moss: string;
  choiceBg: string;
  choiceSelected: string;
};

/** What the "Reset" button in the custom theme panel sets every field back
 * to. This is the app's default blue theme (the same hexes used as the
 * DEFAULT_CUSTOM_* fallbacks above), so hitting Reset always lands back on
 * the look the app ships with — not an arbitrary rainbow palette. */
const DEFAULT_RESET: CustomThemeColors = {
  accent: DEFAULT_CUSTOM_ACCENT,
  text: DEFAULT_CUSTOM_TEXT,
  onAccent: DEFAULT_CUSTOM_ON_ACCENT,
  icon: DEFAULT_CUSTOM_ICON,
  background: DEFAULT_CUSTOM_BACKGROUND,
  quizCorrect: DEFAULT_CUSTOM_QUIZ_CORRECT,
  quizWrong: DEFAULT_CUSTOM_QUIZ_WRONG,
  vermillion: DEFAULT_CUSTOM_VERMILLION,
  gold: DEFAULT_CUSTOM_GOLD,
  moss: DEFAULT_CUSTOM_MOSS,
  choiceBg: DEFAULT_CUSTOM_CHOICE_BG,
  choiceSelected: DEFAULT_CUSTOM_CHOICE_SELECTED,
};

const THEME_OVERRIDE_VARS = [
  "--paper",
  "--paper-dark",
  "--card",
  "--ink",
  "--ink-soft",
  "--on-accent",
  "--icon",
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
  "--choice-custom-bg",
  "--choice-select-bg",
];

// "default" theme in light mode: the blue palette from the design reference
// (Sine Deo dashboard). Deliberately does NOT set quiz-correct/quiz-wrong/
// quiz-correct-fill: those stay on the app's fixed green/red defaults from
// styles.css (defined once in :root / [data-theme="dark"]) so "correct"/
// "wrong" always read clearly. Only the "custom" theme (buildCustomVars,
// below) lets the user override them.
const DEFAULT_LIGHT_VARS: Record<string, string> = {
  "--paper": "#EEF3FC",
  "--paper-dark": "#E4ECFC",
  "--card": "#FFFFFF",
  "--ink": "#16213E",
  "--ink-soft": "#66748C",
  "--on-accent": "#FFFFFF",
  "--indigo": "#2F5FDE",
  "--indigo-deep": "#1E43B8",
  "--vermillion": "#2F5FDE",
  "--gold": "#F2A93C",
  "--moss": "#2F9E52",
  "--line": "rgba(20, 33, 66, 0.10)",
};

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
      };
}

/** Custom theme: paper/card/ink come straight from the user's own text &
 * background picks (via color-mix, so no hue math needed on them). Every
 * other themed color — vermillion/gold/moss, correct/wrong, and the answer-
 * choice background/selected-state colors — is its own independent pick
 * (colors, not colors.vermillion) rather than derived, so the swatch shown
 * in settings always matches what's actually rendered on the page, in both
 * dark and light mode. Only the correct-fill/selected-border shades are
 * still derived via color-mix, since those are just a darker tint of a
 * color the user already picked and don't need their own control. */
function buildCustomVars(
  colors: CustomThemeColors,
  _isDark: boolean,
): Record<string, string> {
  const {
    accent,
    text,
    onAccent,
    icon,
    background,
    quizCorrect,
    quizWrong,
    vermillion,
    gold,
    moss,
    choiceBg,
    choiceSelected,
  } = colors;
  return {
    "--paper": background,
    "--paper-dark": `color-mix(in srgb, ${background} 88%, black)`,
    "--card": `color-mix(in srgb, ${background} 90%, white)`,
    "--ink": text,
    "--ink-soft": `color-mix(in srgb, ${text} 65%, ${background})`,
    "--on-accent": onAccent,
    "--icon": icon,
    "--indigo": accent,
    "--indigo-deep": `color-mix(in srgb, ${accent} 82%, black)`,
    "--vermillion": vermillion,
    "--gold": gold,
    "--moss": moss,
    "--line": `color-mix(in srgb, ${text} 15%, transparent)`,
    "--quiz-correct": quizCorrect,
    "--quiz-wrong": quizWrong,
    "--quiz-correct-fill": `color-mix(in srgb, ${quizCorrect} 78%, black)`,
    "--quiz-correct-fill-text": `color-mix(in srgb, white 92%, ${quizCorrect})`,
    "--choice-custom-bg": choiceBg,
    "--choice-select-bg": choiceSelected,
  };
}

function applyThemeColorOverrides(
  style: BorderStyle,
  isDark: boolean,
  custom: CustomThemeColors,
): void {
  const root = document.documentElement.style;
  THEME_OVERRIDE_VARS.forEach((v) => root.removeProperty(v));

  const vars =
    style === "custom"
      ? buildCustomVars(custom, isDark)
      : isDark
        ? buildBwVars(true)
        : DEFAULT_LIGHT_VARS;

  Object.entries(vars).forEach(([k, v]) => root.setProperty(k, v));
}

function readStoredHex(key: string, fallback: string): string {
  const stored = localStorage.getItem(key);
  return stored && /^#[0-9a-fA-F]{6}$/.test(stored) ? stored : fallback;
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
      : "default";
  });

  const [customAccent, setCustomAccentState] = useState<string>(() =>
    readStoredHex(CUSTOM_ACCENT_KEY, DEFAULT_CUSTOM_ACCENT),
  );
  const [customText, setCustomTextState] = useState<string>(() =>
    readStoredHex(CUSTOM_TEXT_KEY, DEFAULT_CUSTOM_TEXT),
  );
  const [customOnAccent, setCustomOnAccentState] = useState<string>(() =>
    readStoredHex(CUSTOM_ON_ACCENT_KEY, DEFAULT_CUSTOM_ON_ACCENT),
  );
  const [customIcon, setCustomIconState] = useState<string>(() =>
    readStoredHex(CUSTOM_ICON_KEY, DEFAULT_CUSTOM_ICON),
  );
  const [customBackground, setCustomBackgroundState] = useState<string>(() =>
    readStoredHex(CUSTOM_BG_KEY, DEFAULT_CUSTOM_BACKGROUND),
  );
  const [customQuizCorrect, setCustomQuizCorrectState] = useState<string>(() =>
    readStoredHex(CUSTOM_QUIZ_CORRECT_KEY, DEFAULT_CUSTOM_QUIZ_CORRECT),
  );
  const [customQuizWrong, setCustomQuizWrongState] = useState<string>(() =>
    readStoredHex(CUSTOM_QUIZ_WRONG_KEY, DEFAULT_CUSTOM_QUIZ_WRONG),
  );
  const [customVermillion, setCustomVermillionState] = useState<string>(() =>
    readStoredHex(CUSTOM_VERMILLION_KEY, DEFAULT_CUSTOM_VERMILLION),
  );
  const [customGold, setCustomGoldState] = useState<string>(() =>
    readStoredHex(CUSTOM_GOLD_KEY, DEFAULT_CUSTOM_GOLD),
  );
  const [customMoss, setCustomMossState] = useState<string>(() =>
    readStoredHex(CUSTOM_MOSS_KEY, DEFAULT_CUSTOM_MOSS),
  );
  const [customChoiceBg, setCustomChoiceBgState] = useState<string>(() =>
    readStoredHex(CUSTOM_CHOICE_BG_KEY, DEFAULT_CUSTOM_CHOICE_BG),
  );
  const [customChoiceSelected, setCustomChoiceSelectedState] =
    useState<string>(() =>
      readStoredHex(CUSTOM_CHOICE_SELECTED_KEY, DEFAULT_CUSTOM_CHOICE_SELECTED),
    );

  const customColors: CustomThemeColors = {
    accent: customAccent,
    text: customText,
    onAccent: customOnAccent,
    icon: customIcon,
    background: customBackground,
    quizCorrect: customQuizCorrect,
    quizWrong: customQuizWrong,
    vermillion: customVermillion,
    gold: customGold,
    moss: customMoss,
    choiceBg: customChoiceBg,
    choiceSelected: customChoiceSelected,
  };

  const customDeps = [
    customAccent,
    customText,
    customOnAccent,
    customIcon,
    customBackground,
    customQuizCorrect,
    customQuizWrong,
    customVermillion,
    customGold,
    customMoss,
    customChoiceBg,
    customChoiceSelected,
  ];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    applyThemeColorOverrides(borderStyle, theme === "dark", customColors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, borderStyle, ...customDeps]);

  useEffect(() => {
    document.documentElement.setAttribute("data-choice-border", borderStyle);
    localStorage.setItem(BORDER_STYLE_KEY, borderStyle);
    applyThemeColorOverrides(borderStyle, theme === "dark", customColors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borderStyle, theme, ...customDeps]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    [],
  );
  const setBorderStyle = useCallback(
    (s: BorderStyle) => setBorderStyleState(s),
    [],
  );
  const setCustomAccent = useCallback((hex: string) => {
    setCustomAccentState(hex);
    localStorage.setItem(CUSTOM_ACCENT_KEY, hex);
  }, []);
  const setCustomText = useCallback((hex: string) => {
    setCustomTextState(hex);
    localStorage.setItem(CUSTOM_TEXT_KEY, hex);
  }, []);
  const setCustomOnAccent = useCallback((hex: string) => {
    setCustomOnAccentState(hex);
    localStorage.setItem(CUSTOM_ON_ACCENT_KEY, hex);
  }, []);
  const setCustomIcon = useCallback((hex: string) => {
    setCustomIconState(hex);
    localStorage.setItem(CUSTOM_ICON_KEY, hex);
  }, []);
  const setCustomBackground = useCallback((hex: string) => {
    setCustomBackgroundState(hex);
    localStorage.setItem(CUSTOM_BG_KEY, hex);
  }, []);
  const setCustomQuizCorrect = useCallback((hex: string) => {
    setCustomQuizCorrectState(hex);
    localStorage.setItem(CUSTOM_QUIZ_CORRECT_KEY, hex);
  }, []);
  const setCustomQuizWrong = useCallback((hex: string) => {
    setCustomQuizWrongState(hex);
    localStorage.setItem(CUSTOM_QUIZ_WRONG_KEY, hex);
  }, []);
  const setCustomVermillion = useCallback((hex: string) => {
    setCustomVermillionState(hex);
    localStorage.setItem(CUSTOM_VERMILLION_KEY, hex);
  }, []);
  const setCustomGold = useCallback((hex: string) => {
    setCustomGoldState(hex);
    localStorage.setItem(CUSTOM_GOLD_KEY, hex);
  }, []);
  const setCustomMoss = useCallback((hex: string) => {
    setCustomMossState(hex);
    localStorage.setItem(CUSTOM_MOSS_KEY, hex);
  }, []);
  const setCustomChoiceBg = useCallback((hex: string) => {
    setCustomChoiceBgState(hex);
    localStorage.setItem(CUSTOM_CHOICE_BG_KEY, hex);
  }, []);
  const setCustomChoiceSelected = useCallback((hex: string) => {
    setCustomChoiceSelectedState(hex);
    localStorage.setItem(CUSTOM_CHOICE_SELECTED_KEY, hex);
  }, []);

  // Resets every custom-theme field back to DEFAULT_RESET (the app's default
  // blue theme) and switches to the custom style so the result is
  // immediately visible.
  const resetCustomTheme = useCallback(() => {
    setCustomAccent(DEFAULT_RESET.accent);
    setCustomText(DEFAULT_RESET.text);
    setCustomOnAccent(DEFAULT_RESET.onAccent);
    setCustomIcon(DEFAULT_RESET.icon);
    setCustomBackground(DEFAULT_RESET.background);
    setCustomQuizCorrect(DEFAULT_RESET.quizCorrect);
    setCustomQuizWrong(DEFAULT_RESET.quizWrong);
    setCustomVermillion(DEFAULT_RESET.vermillion);
    setCustomGold(DEFAULT_RESET.gold);
    setCustomMoss(DEFAULT_RESET.moss);
    setCustomChoiceBg(DEFAULT_RESET.choiceBg);
    setCustomChoiceSelected(DEFAULT_RESET.choiceSelected);
    setBorderStyleState("custom");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    theme,
    setTheme,
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
  };
}
