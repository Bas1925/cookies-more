"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedHeading from "../AnimatedHeading";
import { SHOWCASE_PRODUCTS } from "@/lib/data";
import { useLanguage } from "@/lib/language-context";

gsap.registerPlugin(ScrollTrigger);

/**
 * Cinematic flavor showcase — images only.
 * Shopping lives in the Shop section below; this gallery is for looking.
 */
export default function FeaturedFlavors() {
  const { t, L, lang, dir } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".flavor-panel");

      if (!prefersReduced) {
        gsap.from(panels, {
          autoAlpha: 0,
          y: 40,
          scale: 0.96,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        });
      }

      const media = gsap.matchMedia();

      media.add("(min-width: 1024px)", () => {
        if (prefersReduced) return;

        const getScrollDistance = () =>
          Math.max(0, track.scrollWidth - window.innerWidth);

        /**
         * The track is `width: max-content`, so in LTR it starts at the left
         * edge and overflows right — we pull it left to reveal later panels.
         * Under `dir="rtl"` it starts flush right and overflows *left*, so the
         * same negative x drives every panel off-screen. Mirror the sign.
         */
        const sign = dir === "rtl" ? 1 : -1;

        const tween = gsap.to(track, {
          x: () => sign * getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getScrollDistance()}`,
            pin: true,
            scrub: 0.45,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        return () => {
          tween.kill();
        };
      });

      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }, section);

    return () => ctx.revert();
    // Re-armed on a direction change: the pinned scroll runs the opposite way
    // in RTL, and the headings resize when the language swaps, so the pin
    // distance has to be measured again.
  }, [dir, lang]);

  return (
    <section
      ref={sectionRef}
      id="flavors"
      className="flavors-section bg-cream"
      aria-label="Flavor showcase"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-caramel">
              {t("showcase.eyebrow")}
            </span>
            <AnimatedHeading className="mt-2 max-w-xl font-display text-3xl font-semibold leading-tight text-chocolate sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              {t("showcase.title")}
            </AnimatedHeading>
            <p className="mt-2 text-sm text-chocolate/50">
              {t("showcase.note")}
            </p>
          </div>
          <p className="max-w-xs text-sm text-chocolate/60 md:text-base">
            {t("showcase.scroll")}
          </p>
        </div>
      </div>

      <div ref={trackRef} className="flavors-track">
        {SHOWCASE_PRODUCTS.map((product) => (
          <figure key={product.id} className="flavor-panel">
            <a
              href="#shop-cookies"
              className="relative block h-full w-full overflow-hidden rounded-[1.75rem] bg-cream-dark shadow-[0_24px_60px_-28px_rgba(59,33,23,0.45)] outline-offset-4 transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-caramel"
              aria-label={t("showcase.openInMenu", { name: L(product.name) })}
            >
              <Image
                src={product.image as string}
                alt=""
                fill
                sizes="(max-width: 1024px) 80vw, 42vw"
                className="object-cover"
                style={{ objectPosition: product.objectPosition ?? "center" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-chocolate/75 via-chocolate/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-xl font-semibold leading-tight text-cream">
                  {L(product.name)}
                </p>
                {lang === "en" && (
                  <p
                    lang="ar"
                    dir="rtl"
                    className="mt-0.5 font-arabic text-sm text-cream/80"
                  >
                    {product.name.ar}
                  </p>
                )}
                {product.tagline && (
                  <p className="mt-1 text-xs text-cream/70">
                    {L(product.tagline)}
                  </p>
                )}
                <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-caramel">
                  {t("showcase.shopCta")}
                </p>
              </figcaption>
            </a>
          </figure>
        ))}
        {/* End spacer so the last panel can settle comfortably in frame */}
        <div className="hidden w-[8vw] shrink-0 lg:block" aria-hidden="true" />
      </div>
    </section>
  );
}
