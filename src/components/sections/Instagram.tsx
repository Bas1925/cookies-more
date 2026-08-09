"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Camera, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedHeading from "../AnimatedHeading";
import { STORE } from "@/lib/data";
import { useCatalog } from "@/lib/catalog-context";
import { useLanguage } from "@/lib/language-context";

gsap.registerPlugin(ScrollTrigger);

const INSTAGRAM_IDS = [
  "cake-bento",
  "cookie-dubai",
  "cinnabon-8",
  "cake-red-velvet",
];

export default function Instagram() {
  const { t, L, lang } = useLanguage();
  const { getProduct } = useCatalog();
  const gallery = INSTAGRAM_IDS.map((id) => getProduct(id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p) && !p!.hidden,
  );
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-ig-tile]", {
        opacity: 0,
        y: 40,
        scale: 0.94,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="instagram"
      className="relative overflow-hidden bg-cream py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-caramel">
            {t("ig.eyebrow")}
          </span>
          <AnimatedHeading className="mt-2 font-display text-4xl font-semibold leading-tight text-chocolate sm:text-5xl md:text-6xl">
            {t("ig.title")}
          </AnimatedHeading>
          <p className="mt-4 text-chocolate/65">{t("ig.sub")}</p>

          <a
            href={STORE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-brick px-6 py-3.5 font-semibold text-cream transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Camera className="h-5 w-5 text-caramel" />
            <span dir="ltr">{STORE.handle}</span>
            <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
          </a>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {gallery.map((product) => (
            <li key={product.id} data-ig-tile>
              <a
                href={STORE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-[1.5rem] bg-cream-dark shadow-[0_18px_45px_-28px_rgba(59,33,23,0.55)]"
                aria-label={t("ig.openProfile", { name: L(product.name) })}
              >
                <Image
                  src={product.image as string}
                  alt={L(product.name)}
                  fill
                  sizes="(max-width: 640px) 46vw, (max-width: 768px) 44vw, 300px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ objectPosition: product.objectPosition ?? "center" }}
                />
                <div className="absolute inset-0 bg-chocolate/0 transition-colors duration-300 group-hover:bg-chocolate/45" />
                <span className="absolute inset-x-0 bottom-0 flex items-end gap-2 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg font-semibold text-cream">
                      {L(product.name)}
                    </span>
                    {lang === "en" && (
                      <span
                        lang="ar"
                        dir="rtl"
                        className="block truncate font-arabic text-sm text-cream/80"
                      >
                        {product.name.ar}
                      </span>
                    )}
                  </span>
                  <Camera className="ml-auto h-5 w-5 shrink-0 text-cream" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
