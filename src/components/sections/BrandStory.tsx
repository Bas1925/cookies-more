"use client";

import AnimatedHeading from "../AnimatedHeading";
import { FEATURE_IMAGE, INSET_IMAGE, PRODUCTS } from "@/lib/data";
import { useLanguage } from "@/lib/language-context";
import type { UIKey } from "@/lib/i18n";

const STATS: { value: string; key: UIKey }[] = [
  { value: String(PRODUCTS.length), key: "story.stat1" },
  { value: "9am", key: "story.stat2" },
  { value: "100%", key: "story.stat3" },
];

/**
 * Plain <img> (not next/image fill). Height capped so the photo stays on
 * screen with the copy at 100% zoom — the raw kinder shot is very tall and
 * was scrolling away above the fold in Chrome.
 */
export default function BrandStory() {
  const { t } = useLanguage();

  return (
    <section id="story" className="relative bg-cream py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 md:px-8 lg:grid-cols-2 lg:gap-16">
        <div className="relative w-full">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#e8dcc8] shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FEATURE_IMAGE}
              alt="A freshly baked Kinder cookie drizzled with milk and white chocolate"
              width={900}
              height={1125}
              decoding="async"
              fetchPriority="high"
              className="block w-full object-cover"
              style={{
                height: "min(70vh, 560px)",
                opacity: 1,
                visibility: "visible",
              }}
            />
          </div>
          <div className="absolute -bottom-4 -right-3 hidden w-40 overflow-hidden rounded-[1.75rem] border-4 border-cream bg-[#e8dcc8] shadow-xl sm:w-48 lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={INSET_IMAGE}
              alt="A chocolate cookie topped with a glossy hazelnut swirl"
              width={400}
              height={400}
              decoding="async"
              className="block aspect-square w-full object-cover"
              style={{ opacity: 1, visibility: "visible" }}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center gap-8 lg:gap-12">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-caramel">
              {t("story.eyebrow")}
            </span>
            <AnimatedHeading className="mt-3 font-display text-4xl font-semibold leading-[1.05] text-chocolate sm:text-5xl md:text-6xl">
              {t("story.title")}
            </AnimatedHeading>
          </div>

          <div className="space-y-5 text-lg leading-relaxed text-chocolate/70">
            <p>{t("story.p1")}</p>
            <p>{t("story.p2")}</p>
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-chocolate/10 pt-8">
            {STATS.map((stat) => (
              <div key={stat.key}>
                <dt className="font-display text-4xl font-semibold text-caramel">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-sm text-chocolate/60">
                  {t(stat.key)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
