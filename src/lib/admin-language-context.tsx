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
import { useRouter } from "next/navigation";
import {
  ADMIN_LANG_COOKIE,
  adminDir,
  adminTranslate,
  type AdminKey,
  type AdminLang,
} from "./admin-i18n";

interface AdminLanguageValue {
  lang: AdminLang;
  dir: "ltr" | "rtl";
  setLang: (lang: AdminLang) => void;
  t: (key: AdminKey, vars?: Record<string, string | number>) => string;
}

const AdminLanguageContext = createContext<AdminLanguageValue | null>(null);

export function AdminLanguageProvider({
  initialLang,
  children,
}: {
  initialLang: AdminLang;
  children: ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = adminDir(lang);
  }, [lang]);

  const setLang = useCallback(
    (next: AdminLang) => {
      setLangState(next);
      document.cookie = `${ADMIN_LANG_COOKIE}=${next}; path=/admin; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  const value = useMemo<AdminLanguageValue>(
    () => ({
      lang,
      dir: adminDir(lang),
      setLang,
      t: (key, vars) => adminTranslate(key, lang, vars),
    }),
    [lang, setLang],
  );

  return (
    <AdminLanguageContext.Provider value={value}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  const value = useContext(AdminLanguageContext);
  if (!value) {
    throw new Error("useAdminLanguage must be used inside AdminLanguageProvider");
  }
  return value;
}
