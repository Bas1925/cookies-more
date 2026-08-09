"use client";

import type { Localized } from "@/lib/types";
import { useAdminLanguage } from "@/lib/admin-language-context";
import type { AdminKey } from "@/lib/admin-i18n";

const LANGS: Array<{ key: keyof Localized; label: AdminKey }> = [
  { key: "en", label: "fields.english" },
  { key: "ar", label: "fields.arabic" },
  { key: "he", label: "fields.hebrew" },
];

export default function LocalizedFields({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
}) {
  const { t } = useAdminLanguage();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-[#964534]">{label}</legend>
      {LANGS.map((lang) => (
        <label key={lang.key} className="block text-xs font-semibold text-[#4a2218]/70">
          {t(lang.label)}
          {multiline ? (
            <textarea
              value={value[lang.key]}
              onChange={(e) =>
                onChange({ ...value, [lang.key]: e.target.value })
              }
              rows={2}
              className="mt-1 min-h-11 w-full rounded-xl border-2 border-[#964534]/15 bg-white px-3 py-2.5 text-base font-normal text-[#4a2218] outline-none focus:border-[#964534] sm:text-sm"
              dir={lang.key === "en" ? "ltr" : "rtl"}
            />
          ) : (
            <input
              value={value[lang.key]}
              onChange={(e) =>
                onChange({ ...value, [lang.key]: e.target.value })
              }
              className="mt-1 min-h-11 w-full rounded-xl border-2 border-[#964534]/15 bg-white px-3 py-2.5 text-base font-normal text-[#4a2218] outline-none focus:border-[#964534] sm:text-sm"
              dir={lang.key === "en" ? "ltr" : "rtl"}
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}

export function emptyLocalized(): Localized {
  return { en: "", ar: "", he: "" };
}
