"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Clock, MapPin } from "lucide-react";
import Logo from "../Logo";
import { NAV_LINKS, STORE } from "@/lib/data";
import { useLanguage } from "@/lib/language-context";

export default function Footer() {
  const pathname = usePathname();
  const { t, L } = useLanguage();
  const year = new Date().getFullYear();
  const sectionHref = (href: string) => (pathname === "/" ? href : `/${href}`);

  return (
    <footer className="bg-brick px-5 pb-8 pt-16 text-cream md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 border-b border-cream/10 pb-12 md:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-cream/60">
              {t("footer.blurb")}
            </p>
            <ul className="mt-6 flex gap-3">
              <li>
                <a
                  href={STORE.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-caramel"
                >
                  <Camera className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <nav aria-label={t("footer.explore")}>
            <h3 className="font-display text-lg font-semibold">
              {t("footer.explore")}
            </h3>
            {/* -my on the list offsets the padding that gives each link a
                comfortable touch height without loosening the visual rhythm. */}
            <ul className="mt-2 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={sectionHref(link.href)}
                    className="flex min-h-11 items-center text-cream/60 transition-colors hover:text-cream"
                  >
                    {t(`nav.${link.key}` as const)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Follow */}
          <div>
            <h3 className="font-display text-lg font-semibold">
              {t("footer.follow")}
            </h3>
            <a
              href={STORE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4 flex items-center gap-3 rounded-2xl bg-cream/5 p-3 ring-1 ring-cream/10 transition-colors hover:bg-cream/10"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-caramel text-cream">
                <Camera className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wide text-cream/50">
                  Instagram
                </span>
                <span
                  dir="ltr"
                  className="block truncate font-semibold text-cream"
                >
                  {STORE.handle}
                </span>
              </span>
            </a>
            <ul className="mt-4 space-y-3 text-sm text-cream/60">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-caramel" />
                {L(STORE.area)}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-caramel" />
                {L(STORE.hours)}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm text-cream/50 md:flex-row">
          <p>
            © {year} {t("footer.rights")}
          </p>
          <Link
            href="/privacy"
            className="flex min-h-11 items-center font-semibold text-cream/70 underline decoration-cream/25 underline-offset-4 transition-colors hover:text-cream"
          >
            {t("footer.privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
