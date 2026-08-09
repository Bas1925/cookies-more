"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Package } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedHeading from "../AnimatedHeading";
import HeroCookie from "../HeroCookie";
import Logo from "../Logo";
import { useLanguage } from "@/lib/language-context";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const cookieWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const cookieWrap = cookieWrapRef.current;
    if (!section || !cookieWrap) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) return;

      gsap.to(cookieWrap, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex h-dvh min-h-dvh max-h-dvh flex-col overflow-hidden bg-brick text-cream"
    >
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute left-1/2 top-[42%] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(243,230,212,0.14),transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(74,34,24,0.18),transparent_45%,rgba(74,34,24,0.28))]" />
      </div>

      <div className="relative z-10 flex h-full w-full items-center justify-center px-5 pb-5 pt-16 sm:px-8 sm:pb-8 sm:pt-24 lg:px-10 lg:pt-28">
        {/*
          The grid inherits the page direction, so in Arabic/Hebrew the whole
          hero mirrors: copy moves to the right column, cookie to the left.
          Pinning it to dir="ltr" used to hold the columns in place while the
          text alignment still flipped, which left the copy jammed against the
          cookie instead of hugging the outer edge. Logical utilities
          (text-start, justify-start) handle both directions on their own.
        */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-5 sm:gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-14">
          <div className="min-w-0 w-full text-center lg:text-start">
            <div className="mb-4 flex justify-center lg:mb-5 lg:justify-start">
              <Logo className="scale-110 sm:scale-125 lg:scale-125" />
            </div>

            {/* No dir="ltr" here: SplitType writes `text-align: start` on each
                line, and `start` resolves against the element's own direction —
                pinning it LTR left the title hugging the inner edge in Arabic
                while the rest of the column hugged the outer one. "Cookies &
                More" is a pure Latin run, so bidi keeps it in order anyway. */}
            <AnimatedHeading
              as="h1"
              immediate
              delay={0.1}
              className="max-w-full font-display text-[clamp(2.2rem,6vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-cream lg:text-[clamp(2.75rem,4vw,3.75rem)]"
            >
              {t("hero.title")}
            </AnimatedHeading>

            {/* lg:mx-0 puts the block at the inline-start edge, which is the
                left in English and the right in Arabic/Hebrew. */}
            <p className="mx-auto mt-3 max-w-md text-[0.95rem] text-cream/80 sm:mt-4 sm:text-lg lg:mx-0 lg:max-w-md lg:text-lg xl:text-xl">
              {t("hero.sub")}
            </p>

            <div className="mt-5 flex flex-row flex-wrap items-center justify-center gap-2.5 sm:mt-6 sm:gap-3 lg:mt-7 lg:justify-start">
              <a
                href="#shop-cookies"
                className="group flex min-h-11 items-center gap-2 rounded-full bg-cream px-5 py-3 text-sm font-semibold text-brick shadow-lg shadow-chocolate/25 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:min-h-12 sm:px-7 sm:text-base"
              >
                {t("hero.shop")}
                {/* The glyph points along the reading direction, so mirror it
                    in RTL — the one thing that genuinely is directional. */}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 sm:h-5 sm:w-5" />
              </a>
              <a
                href="#build"
                className="group flex min-h-11 items-center gap-2 rounded-full border-2 border-cream/40 bg-transparent px-5 py-3 text-sm font-semibold text-cream transition-colors hover:border-cream hover:bg-cream/10 sm:min-h-12 sm:px-7 sm:text-base"
              >
                <Package className="h-4 w-4 transition-transform group-hover:-rotate-12 sm:h-5 sm:w-5" />
                {t("nav.buildBox")}
              </a>
            </div>
          </div>

          <div className="relative flex min-w-0 w-full items-center justify-center lg:justify-end">
            <div
              ref={cookieWrapRef}
              className="relative aspect-square w-[min(88vw,23rem,50dvh)] sm:w-[min(72%,25rem,48dvh)] lg:w-[min(100%,28rem,52dvh)]"
            >
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(74,34,24,0.45),transparent_65%)] blur-2xl" />
              <HeroCookie className="animate-spin-slower relative h-full w-full drop-shadow-[0_28px_36px_rgba(74,34,24,0.45)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
