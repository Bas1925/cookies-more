"use client";

import { useEffect, useRef, useState } from "react";
import ProductCard from "../ProductCard";
import AnimatedHeading from "../AnimatedHeading";
import { useCatalog } from "@/lib/catalog-context";
import { scrollToElement } from "@/lib/lenis";
import { useLanguage } from "@/lib/language-context";
import type { CategoryId } from "@/lib/types";

/** Opens on the store's signature category. */
const DEFAULT_CATEGORY: CategoryId = "cookies";

function categoryFromHash(
  hash: string,
  categoryIds: Set<string>,
): CategoryId | null {
  // Supports #shop, #shop-cookies, #shop-boxes, …
  const match = hash.match(/^#shop(?:-([a-z-]+))?$/);
  if (!match) return null;
  const id = match[1];
  if (!id) return DEFAULT_CATEGORY;
  return categoryIds.has(id) ? id : DEFAULT_CATEGORY;
}

/**
 * One category at a time. Showing all items at once meant a customer had to
 * scroll several screens to reach the next category and the same distance back
 * again; the chip bar sticks to the top instead, so switching is one click from
 * anywhere in the list and no category runs longer than about a screen.
 */
export default function ShopMenu() {
  const [active, setActive] = useState<CategoryId>(DEFAULT_CATEGORY);
  const barAnchorRef = useRef<HTMLDivElement>(null);
  const { t, L, lang } = useLanguage();
  const {
    categories,
    productsInCategory,
    shopProducts,
  } = useCatalog();

  const category = categories.find((c) => c.id === active) ?? categories[0];
  const items = category ? productsInCategory(category.id) : [];
  const catalogCount = shopProducts().length;

  const scrollToBar = () => {
    const anchor = barAnchorRef.current;
    if (!anchor) return;
    // Wait a frame so the new category list has laid out before measuring.
    requestAnimationFrame(() => scrollToElement(anchor));
  };

  const changeCategory = (next: CategoryId, opts?: { scroll?: boolean }) => {
    setActive(next);
    const nextHash = `#shop-${next}`;
    if (window.location.hash !== nextHash) {
      history.replaceState(null, "", nextHash);
    }
    if (opts?.scroll !== false) scrollToBar();
  };

  // Deep links from the flavor showcase / nav: #shop or #shop-cookies.
  useEffect(() => {
    const ids = new Set(categories.map((c) => c.id));
    const applyHash = (scroll: boolean) => {
      const next = categoryFromHash(window.location.hash, ids);
      if (!next) return;
      setActive(next);
      if (scroll) {
        // Let pinned ScrollTrigger / Lenis settle, then land on the bar.
        requestAnimationFrame(() => {
          requestAnimationFrame(scrollToBar);
        });
      }
    };

    applyHash(Boolean(window.location.hash.startsWith("#shop")));

    const onHashChange = () => applyHash(true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [categories]);

  return (
    <section id="shop" className="bg-cream-dark pb-16 md:pb-24">
      <div className="mx-auto max-w-7xl px-5 pt-12 md:px-8 md:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-brick">
            {t("menu.eyebrow")}
          </span>
          <AnimatedHeading className="mt-2 font-display text-4xl font-semibold leading-tight text-chocolate sm:text-5xl">
            {t("menu.title")}
          </AnimatedHeading>
          <p className="mt-3 text-chocolate/65">
            {t("menu.intro", { items: catalogCount })}
          </p>
        </div>
      </div>

      {/* Zero-height anchor sitting at the bar's unstuck position. */}
      <div ref={barAnchorRef} id="shop-categories" className="mt-8" />

      {/* Sticky category bar — 3-column grid on phones (no sideways swipe) */}
      <div className="sticky top-[var(--nav-h)] z-30 border-y border-brick/15 bg-cream/95 py-3 backdrop-blur-md">
        <div
          className="mx-auto grid max-w-7xl grid-cols-3 gap-2 px-5 md:flex md:flex-wrap md:justify-center md:gap-2 md:px-8"
          role="tablist"
          aria-label={t("menu.categories")}
        >
          {categories.map((option) => {
            const isActive = option.id === category?.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="menu-panel"
                onClick={() => changeCategory(option.id)}
                className={`flex min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-1.5 py-2 text-center text-xs font-semibold transition-colors sm:text-sm md:w-auto md:flex-row md:gap-2 md:rounded-full md:px-4 md:text-start ${
                  isActive
                    ? "border-brick bg-brick text-cream"
                    : "border-chocolate/12 bg-cream text-chocolate/70 hover:border-brick/40 hover:text-chocolate"
                }`}
              >
                <span className="leading-tight">{L(option.name)}</span>
                {lang === "en" && (
                  <span
                    lang="ar"
                    dir="rtl"
                    className="hidden font-arabic opacity-60 md:inline"
                  >
                    {option.name.ar}
                  </span>
                )}
                <span
                  className={`rounded-full px-1.5 text-[0.65rem] md:text-xs ${
                    isActive ? "bg-cream/20" : "bg-chocolate/8"
                  }`}
                >
                  {productsInCategory(option.id).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="menu-panel"
        role="tabpanel"
        aria-label={category ? L(category.name) : t("menu.title")}
        className="mx-auto max-w-7xl px-5 md:px-8"
      >
        {category && (
          <>
            <div className="mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-chocolate/10 pb-4">
              <h3 className="font-display text-3xl font-semibold text-chocolate">
                {L(category.name)}
              </h3>
              {lang === "en" && (
                <span
                  lang="ar"
                  dir="rtl"
                  className="font-arabic text-2xl text-caramel"
                >
                  {category.name.ar}
                </span>
              )}
              <p className="w-full text-sm text-chocolate/55 sm:w-auto sm:flex-1 sm:text-end">
                {L(category.blurb)}
              </p>
            </div>

            <ul
              key={category.id}
              className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4 xl:grid-cols-6"
            >
              {items.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>

            <p role="status" className="sr-only">
              {t("menu.showing", {
                count: items.length,
                category: L(category.name),
              })}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
