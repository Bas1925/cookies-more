"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { NAV_LINKS } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { useLanguage } from "@/lib/language-context";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

export default function Navbar() {
  const pathname = usePathname();
  const { openCart, totals, isHydrated } = useCart();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on Escape and lock scroll while open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [menuOpen]);

  const bagCount = isHydrated ? totals.count : 0;
  const homeHref = pathname === "/" ? "#top" : "/#top";
  const sectionHref = (href: string) => (pathname === "/" ? href : `/${href}`);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[120] transition-all duration-300 ${
          scrolled
            ? "bg-cream shadow-[0_6px_30px_-12px_rgba(74,34,24,0.35)]"
            : "bg-cream/95"
        }`}
      >
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8"
          aria-label="Primary"
        >
          <a href={homeHref} className="rounded-lg" aria-label={t("nav.home")}>
            <Logo />
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={sectionHref(link.href)}
                  className="group relative text-sm font-semibold text-chocolate/80 transition-colors hover:text-chocolate"
                >
                  {t(`nav.${link.key}` as const)}
                  <span className="absolute -bottom-1 start-0 h-0.5 w-0 bg-caramel transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={openCart}
              className="group relative flex min-h-11 items-center gap-2 rounded-full bg-brick px-4 py-2.5 text-sm font-semibold text-cream transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              aria-label={`${t("cart.open")}, ${bagCount}`}
            >
              <ShoppingBag className="h-4 w-4 transition-transform group-hover:-rotate-12" />
              <span className="hidden sm:inline">{t("cart.bag")}</span>
              <span
                className="grid min-w-5 place-items-center rounded-full bg-caramel px-1.5 text-xs font-bold text-cream"
                aria-hidden="true"
              >
                {bagCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-11 w-11 place-items-center rounded-full bg-brick text-cream md:hidden"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Compact panel — sized to its links, not a full empty cream sheet */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[140] md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-[#4a2218]/75 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
          aria-label={t("nav.closeMenu")}
          tabIndex={menuOpen ? 0 : -1}
        />
        <div
          className={`absolute end-3 top-3 flex w-[min(calc(100%-1.5rem),20rem)] flex-col rounded-3xl bg-[#f3e6d4] p-4 shadow-2xl ring-1 ring-[#964534]/15 transition-all duration-300 ease-out sm:end-4 sm:top-4 ${
            menuOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-95 opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          aria-hidden={!menuOpen}
        >
          <div className="flex items-center justify-between gap-3">
            <Logo />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#964534] text-[#f3e6d4]"
              aria-label={t("nav.closeMenu")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={sectionHref(link.href)}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-2xl bg-white px-4 py-3.5 font-display text-xl font-semibold text-[#4a2218] shadow-sm ring-1 ring-[#964534]/15 transition-colors hover:bg-[#e8d4bc]"
                  tabIndex={menuOpen ? 0 : -1}
                >
                  {t(`nav.${link.key}` as const)}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              openCart();
            }}
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#964534] px-5 py-3.5 font-semibold text-[#f3e6d4]"
            tabIndex={menuOpen ? 0 : -1}
          >
            <ShoppingBag className="h-5 w-5" />
            {t("cart.bag")} ({bagCount})
          </button>
        </div>
      </div>
    </>
  );
}
