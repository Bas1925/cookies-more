"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import AdminLanguageSwitcher from "@/components/admin/AdminLanguageSwitcher";
import { useAdminLanguage } from "@/lib/admin-language-context";

export default function AdminLoginPage() {
  const router = useRouter();
  const { lang, dir, t } = useAdminLanguage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorId = useId();
  const passwordId = useId();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(t("login.wrongPassword"));
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      lang={lang}
      dir={dir}
      className={`grid min-h-dvh place-items-center bg-[#964534] px-4 py-8 ${
        lang === "ar" ? "font-arabic" : ""
      }`}
    >
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-sm rounded-3xl bg-[#f3e6d4] p-6 shadow-2xl sm:p-8"
        aria-labelledby="admin-login-title"
      >
        <div className="flex justify-end">
          <AdminLanguageSwitcher inverse />
        </div>
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1
            id="admin-login-title"
            className="mt-4 font-display text-2xl font-semibold text-[#4a2218]"
          >
            {t("login.title")}
          </h1>
          <p className="mt-1 text-sm text-[#4a2218]/65">
            {t("login.subtitle")}
          </p>
        </div>

        <label
          htmlFor={passwordId}
          className="mt-8 block text-sm font-semibold text-[#4a2218]"
        >
          {t("login.password")}
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border-2 border-[#964534]/20 bg-white px-4 py-3.5 text-base outline-none focus:border-[#964534]"
            autoComplete="current-password"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </label>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-3 text-sm font-semibold text-[#964534]"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="mt-6 min-h-12 w-full rounded-full bg-[#964534] px-5 py-3.5 font-semibold text-[#f3e6d4] disabled:opacity-60"
        >
          {loading ? t("login.signingIn") : t("login.signIn")}
        </button>
      </form>
    </div>
  );
}
