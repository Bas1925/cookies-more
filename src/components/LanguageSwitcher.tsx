"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { LANGUAGES } from "@/lib/i18n";

/**
 * Three languages is few enough that a segmented control beats a dropdown —
 * every option is one tap, and the active one is always visible.
 */
export default function LanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full bg-chocolate/8 p-1 ${className}`}
      role="group"
      aria-label={t("nav.language")}
    >
      {/* The icon is a nicety; on a phone the bar needs the width for the
          three labels, the cart and the menu button. */}
      <Languages
        className="mx-1 hidden h-4 w-4 shrink-0 text-chocolate/45 sm:block"
        aria-hidden="true"
      />
      {LANGUAGES.map((option) => (
        <button
          key={option.id}
          type="button"
          lang={option.id}
          onClick={() => setLang(option.id)}
          aria-pressed={lang === option.id}
          title={option.label}
          className={`min-h-11 min-w-9 rounded-full px-2 text-xs font-bold transition-colors sm:min-h-0 sm:min-w-8 sm:py-1 ${
            lang === option.id
              ? "bg-chocolate text-cream"
              : "text-chocolate/60 hover:text-chocolate"
          }`}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}
