"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang, Localized } from "./types";
import { pick } from "./data";
import { DEFAULT_LANG, dirOf, isLang, translate, type UIKey } from "./i18n";

const STORAGE_KEY = "cookies-and-more-lang";

interface LanguageContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  /** Chrome copy by key, with `{placeholder}` substitution. */
  t: (key: UIKey, vars?: Record<string, string | number>) => string;
  /** Localized values carried on the data (product names, taglines…). */
  L: (value: Localized | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Restore after mount so the server render and first client render agree.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isLang(stored)) setLangState(stored);
      } catch {
        // Storage unavailable — stay on the default.
      }
    });
  }, []);

  // Keep the document in step so screen readers, fonts and text direction
  // all follow the choice.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dirOf(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal — the choice just won't survive a reload.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: dirOf(lang),
      setLang,
      t: (key, vars) => translate(key, lang, vars),
      L: (localized) => pick(localized, lang),
    }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
