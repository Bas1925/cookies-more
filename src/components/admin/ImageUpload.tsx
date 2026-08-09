"use client";

import { useId, useState } from "react";
import { useAdminLanguage } from "@/lib/admin-language-context";

export default function ImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const { t } = useAdminLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputId = useId();
  const errorId = useId();

  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || t("image.failed"));
        return;
      }
      onChange(data.url);
    } catch {
      setError(t("image.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3" aria-busy={busy}>
      <p className="text-sm font-semibold text-[#964534]" id={`${inputId}-label`}>
        {t("image.title")}
      </p>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt={t("image.current")}
          className="h-40 w-40 rounded-2xl object-cover ring-1 ring-[#964534]/20"
        />
      ) : (
        <div
          className="grid h-40 w-40 place-items-center rounded-2xl bg-[#e8d4bc] text-sm text-[#4a2218]/55"
          role="img"
          aria-label={t("image.noneLabel")}
        >
          {t("image.none")}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={inputId}
          className={`inline-flex min-h-11 cursor-pointer items-center rounded-full bg-[#964534] px-4 py-2.5 text-sm font-semibold text-[#f3e6d4] ${
            busy ? "opacity-60" : ""
          }`}
        >
          {busy ? t("image.uploading") : t("image.upload")}
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={busy}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#964534] ring-1 ring-[#964534]/25"
          >
            {t("image.remove")}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm font-semibold text-[#964534]">
          {error}
        </p>
      )}
    </div>
  );
}
