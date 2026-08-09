"use client";

import { Languages } from "lucide-react";
import { useAdminLanguage } from "@/lib/admin-language-context";
import type { AdminLang } from "@/lib/admin-i18n";

const OPTIONS: Array<{ id: AdminLang; short: string }> = [
  { id: "en", short: "EN" },
  { id: "ar", short: "ع" },
];

export default function AdminLanguageSwitcher({
  inverse = false,
}: {
  inverse?: boolean;
}) {
  const { lang, setLang, t } = useAdminLanguage();

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={`flex items-center gap-0.5 rounded-full p-1 ${
        inverse ? "bg-[#964534]/10" : "bg-[#f3e6d4]/15"
      }`}
    >
      <Languages
        className={`mx-1 h-4 w-4 ${inverse ? "text-[#964534]" : "text-[#f3e6d4]/75"}`}
        aria-hidden="true"
      />
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          lang={option.id}
          title={
            option.id === "en"
              ? t("language.english")
              : t("language.arabic")
          }
          aria-pressed={lang === option.id}
          onClick={() => setLang(option.id)}
          className={`min-h-9 min-w-9 rounded-full px-2 text-xs font-bold transition-colors ${
            lang === option.id
              ? inverse
                ? "bg-[#964534] text-[#f3e6d4]"
                : "bg-[#f3e6d4] text-[#964534]"
              : inverse
                ? "text-[#4a2218]/65"
                : "text-[#f3e6d4]/80"
          }`}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}
