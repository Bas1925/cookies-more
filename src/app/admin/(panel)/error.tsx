"use client";

import { useAdminLanguage } from "@/lib/admin-language-context";

// A panel page that could not load its data in time lands here instead of on
// Netlify's own error page. The nav in AdminShell stays usable around it, and
// "Try again" re-fetches the page rather than reloading the whole app.
export default function AdminPanelError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { t } = useAdminLanguage();
  return (
    <div
      role="alert"
      className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-[#964534]/15"
    >
      <h1 className="font-display text-2xl font-semibold text-[#4a2218]">
        {t("common.busyTitle")}
      </h1>
      <p className="mt-2 text-[#4a2218]/70">{t("common.serverBusy")}</p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#964534] px-6 font-semibold text-white transition-colors hover:bg-[#7d3a2c]"
      >
        {t("common.tryAgain")}
      </button>
    </div>
  );
}
