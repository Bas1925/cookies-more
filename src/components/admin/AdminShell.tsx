"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState, useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import AdminLanguageSwitcher from "./AdminLanguageSwitcher";
import NewOrderNotifier from "./NewOrderNotifier";
import { useAdminLanguage } from "@/lib/admin-language-context";
import type { AdminKey } from "@/lib/admin-i18n";

const NAV: Array<{ href: string; label: AdminKey; exact?: boolean }> = [
  { href: "/admin", label: "shell.dashboard", exact: true },
  { href: "/admin/orders", label: "shell.orders" },
  { href: "/admin/products", label: "shell.products" },
  { href: "/admin/categories", label: "shell.categories" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, dir, t } = useAdminLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useId();

  /**
   * "Have we hydrated yet" — false during the server render, true on the
   * client. useSyncExternalStore rather than setState-in-an-effect, which
   * triggers a cascading re-render (and trips react-hooks lint).
   */
  const navReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const isActive = (item: (typeof NAV)[number]) => {
    if (!navReady) return false;
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  };

  return (
    <div
      lang={lang}
      dir={dir}
      className={`admin-scope min-h-dvh bg-[#f3e6d4] text-[#4a2218] ${
        lang === "ar" ? "font-arabic" : ""
      }`}
    >
      <a href="#admin-main" className="skip-link">
        {t("shell.skip")}
      </a>

      <header className="sticky top-0 z-40 border-b border-[#964534]/20 bg-[#964534] text-[#f3e6d4]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-tight">
                Cookies & More
              </p>
              <p className="text-xs text-[#f3e6d4]/75">{t("shell.admin")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NewOrderNotifier />
            <AdminLanguageSwitcher />
            <button
              type="button"
              onClick={() => void logout()}
              className="hidden min-h-11 rounded-full bg-[#f3e6d4] px-4 py-2.5 text-sm font-semibold text-[#964534] sm:inline-flex sm:items-center"
            >
              {t("shell.logout")}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#f3e6d4]/15 text-[#f3e6d4] ring-1 ring-[#f3e6d4]/30 md:hidden"
              aria-expanded={menuOpen}
              aria-controls={navId}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="sr-only">
                {menuOpen ? t("shell.closeMenu") : t("shell.openMenu")}
              </span>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        <div
          id={navId}
          className={`border-t border-[#f3e6d4]/15 bg-[#853c2d] px-4 py-3 md:hidden ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          <nav aria-label={t("shell.nav")} className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`min-h-11 rounded-xl px-3 py-3 text-sm font-semibold ${
                    active
                      ? "bg-[#f3e6d4] text-[#964534]"
                      : "text-[#f3e6d4] hover:bg-[#f3e6d4]/10"
                  }`}
                >
                  {t(item.label)}
                </Link>
              );
            })}
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="min-h-11 rounded-xl px-3 py-3 text-sm font-semibold text-[#f3e6d4]/90 hover:bg-[#f3e6d4]/10"
            >
              {t("shell.viewShop")}
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-1 min-h-11 rounded-xl bg-[#f3e6d4] px-3 py-3 text-left text-sm font-semibold text-[#964534]"
            >
              {t("shell.logout")}
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:grid-cols-[220px_1fr] md:gap-6 md:py-6">
        <aside className="hidden h-fit rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#964534]/15 md:block">
          <nav aria-label={t("shell.nav")} className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`min-h-11 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#964534] text-[#f3e6d4]"
                      : "text-[#4a2218]/80 hover:bg-[#e8d4bc]"
                  }`}
                >
                  {t(item.label)}
                </Link>
              );
            })}
            <Link
              href="/"
              className="mt-2 min-h-11 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#964534] hover:bg-[#e8d4bc]"
            >
              {dir === "rtl" ? "→" : "←"} {t("shell.viewShop")}
            </Link>
          </nav>
        </aside>

        {/* Mobile horizontal tabs */}
        <nav
          aria-label={t("shell.sections")}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden"
        >
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ${
                  active
                    ? "bg-[#964534] text-[#f3e6d4]"
                    : "bg-white text-[#4a2218] ring-1 ring-[#964534]/15"
                }`}
              >
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <main id="admin-main" className="min-w-0" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
