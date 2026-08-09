"use client";

import { useEffect, useRef } from "react";
import {
  CookingPot,
  Cookie,
  Flame,
  PackageCheck,
  Bike,
  type LucideIcon,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedHeading from "../AnimatedHeading";
import { PROCESS_STEPS } from "@/lib/data";
import { useLanguage } from "@/lib/language-context";

gsap.registerPlugin(ScrollTrigger);

const ICONS: Record<string, LucideIcon> = {
  mix: CookingPot,
  shape: Cookie,
  bake: Flame,
  pack: PackageCheck,
  deliver: Bike,
};

const ACCENTS = ["#c87941", "#e96a70", "#a85f2e", "#78966b", "#3b2117"];

export default function Process() {
  const { t, L } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const line = lineRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");

      steps.forEach((step) => {
        const target = prefersReduced
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 60 };
        gsap.set(step, target);
        if (prefersReduced) return;
        gsap.to(step, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: step,
            start: "top 82%",
            once: true,
          },
        });
      });

      // Progress line grows as you scroll through the steps.
      if (line && !prefersReduced) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "top center",
            scrollTrigger: {
              trigger: section,
              start: "top 60%",
              end: "bottom 80%",
              scrub: true,
            },
          },
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-cream-dark/50 py-20 md:py-28"
    >
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-caramel">
            {t("process.eyebrow")}
          </span>
          <AnimatedHeading className="mt-2 font-display text-4xl font-semibold leading-tight text-chocolate sm:text-5xl md:text-6xl">
            {t("process.title")}
          </AnimatedHeading>
        </div>

        <div className="relative mt-16">
          {/* Track + animated progress line (desktop) */}
          <div className="absolute start-[27px] top-2 hidden h-[calc(100%-2rem)] w-1 rounded bg-chocolate/10 md:block">
            <div
              ref={lineRef}
              className="h-full w-full origin-top rounded bg-gradient-to-b from-caramel via-strawberry to-chocolate"
            />
          </div>

          <ol className="space-y-8">
            {PROCESS_STEPS.map((step, i) => {
              const Icon = ICONS[step.id] ?? Cookie;
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <li
                  key={step.id}
                  data-step
                  className="relative flex gap-5 md:gap-8"
                >
                  <div
                    className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-cream shadow-lg"
                    style={{ backgroundColor: accent }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 rounded-3xl bg-cream p-6 shadow-[0_14px_40px_-24px_rgba(59,33,23,0.5)]">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-sm font-bold text-caramel">
                        {t("process.step", { n: i + 1 })}
                      </span>
                      <h3 className="font-display text-2xl font-semibold text-chocolate">
                        {L(step.title)}
                      </h3>
                    </div>
                    <p className="mt-2 leading-relaxed text-chocolate/65">
                      {L(step.text)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
