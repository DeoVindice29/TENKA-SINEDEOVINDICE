import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { I18N, LANG_KEY, type Lang, type I18NEntry } from "./I18N";

type LangContextValue = {
  lang: Lang;
  setLang: (l: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tf: (entry: string | I18NEntry | null | undefined) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

function getStoredLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === "id" || stored === "en" ? stored : "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  const setLang = useCallback((l: string) => {
    const next: Lang = l === "id" ? "id" : "en";
    localStorage.setItem(LANG_KEY, next);
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  // t() — untuk key string di I18N, dgn var substitution {nama}
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const entry = I18N[key];
      let str = entry ? entry[lang] || entry.en : key;
      if (vars) {
        Object.keys(vars).forEach((k) => {
          str = str.split(`{${k}}`).join(String(vars[k]));
        });
      }
      return str;
    },
    [lang]
  );

  // tf() — untuk data bilingual {en, id} (dipakai di data kanji/kotoba/bunpo)
  const tf = useCallback(
    (entry: string | I18NEntry | null | undefined) => {
      if (entry == null) return "";
      if (typeof entry === "string") return entry;
      return entry[lang] || entry.en || entry.id || "";
    },
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t, tf }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}