"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Minus, Plus, X } from "lucide-react";
import ProductThumb from "./ProductThumb";
import {
  formatPrice,
  getReadyBoxFillings,
  readyBoxCategoryMax,
  readyBoxCategoryRules,
  readyBoxPicks,
} from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { useLanguage } from "@/lib/language-context";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import type { Product } from "@/lib/types";

export default function ReadyBoxPicker({
  box,
  onClose,
  onAdded,
}: {
  box: Product;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { addBox } = useCart();
  const { categories, readyBoxFillings } = useCatalog();
  const { t, L, lang } = useLanguage();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [contents, setContents] = useState<Record<string, number>>({});
  const [justAdded, setJustAdded] = useState(false);

  const capacity = readyBoxPicks(box);
  const selectedCount = useMemo(
    () => Object.values(contents).reduce((sum, qty) => sum + qty, 0),
    [contents],
  );
  const remaining = capacity - selectedCount;
  const isFull = remaining === 0;
  const name = L(box.name);

  const fillings = useMemo(
    () => getReadyBoxFillings(box),
    [box, readyBoxFillings],
  );
  const groups = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: fillings.filter((product) => product.category === category.id),
        }))
        .filter((group) => group.items.length > 0),
    [categories, fillings],
  );
  const rules = useMemo(() => readyBoxCategoryRules(box), [box, fillings]);
  // One thumbnail per piece, in menu order, so the strip mirrors the box.
  const picked = useMemo(
    () =>
      fillings.flatMap((product) =>
        Array.from({ length: contents[product.id] ?? 0 }, () => product),
      ),
    [fillings, contents],
  );

  useEffect(() => {
    lockScroll();
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [onClose]);

  const countInCategory = (
    categoryId: string,
    map: Record<string, number> = contents,
  ) =>
    fillings
      .filter((product) => product.category === categoryId)
      .reduce((sum, product) => sum + (map[product.id] ?? 0), 0);

  const changeQty = (product: Product, delta: number) => {
    const categoryMax = readyBoxCategoryMax(box, product.category);
    setContents((prev) => {
      const current = prev[product.id] ?? 0;
      const usedInCategory = countInCategory(product.category, prev);
      if (delta > 0 && selectedCount >= capacity) return prev;
      if (delta > 0 && usedInCategory >= categoryMax) return prev;
      const next = Math.max(0, current + delta);
      if (next === current) return prev;
      const copy = { ...prev };
      if (next === 0) delete copy[product.id];
      else copy[product.id] = next;
      return copy;
    });
  };

  const handleAdd = () => {
    if (!isFull || justAdded) return;
    addBox(box.id, contents);
    setJustAdded(true);
    window.setTimeout(() => {
      onAdded();
      onClose();
    }, 700);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[140]" role="presentation">
      <div
        className="absolute inset-0 bg-chocolate/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-labelledby="ready-box-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-2xl sm:inset-0 sm:m-auto sm:h-auto sm:max-h-[min(46rem,90dvh)] sm:w-full sm:max-w-lg sm:rounded-[2rem] lg:max-h-[min(52rem,92dvh)] lg:max-w-4xl"
      >
        <header className="shrink-0 border-b border-chocolate/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-3 sm:pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brick">
                {name}
              </p>
              <h2
                id="ready-box-title"
                className="mt-1 font-display text-2xl font-semibold text-chocolate"
              >
                {t("readyBox.title")}
              </h2>
              <p className="mt-1 text-sm text-chocolate/60">
                {t(rules.length > 0 ? "readyBox.sub" : "readyBox.subPlain", {
                  count: capacity,
                  name,
                })}
              </p>
              {rules.length > 0 && (
                <ul
                  className="mt-3 flex flex-wrap gap-1.5"
                  aria-label={t("readyBox.rules")}
                >
                  {rules.map((rule) => {
                    const category = categories.find((item) => item.id === rule.id);
                    const categoryName = category ? L(category.name) : rule.id;
                    return (
                      <li
                        key={rule.id}
                        className="rounded-full bg-brick/10 px-2.5 py-1 text-xs font-semibold text-brick"
                      >
                        {t("readyBox.maxOf", {
                          count: rule.max,
                          name: categoryName,
                        })}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-chocolate/10 text-chocolate transition-colors hover:bg-chocolate/20"
              aria-label={t("readyBox.close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {groups.map(({ category, items }) => {
            const categoryMax = readyBoxCategoryMax(box, category.id);
            const usedInCategory = countInCategory(category.id);
            const categoryFull = usedInCategory >= categoryMax;
            return (
            <section key={category.id} aria-labelledby={`ready-box-cat-${category.id}`}>
              <h3
                id={`ready-box-cat-${category.id}`}
                className="mb-2 flex flex-wrap items-baseline justify-between gap-2 font-display text-sm font-semibold text-brick"
              >
                <span>{L(category.name)}</span>
                {/* The admin sets this per category, so it always shows here —
                    beside the items it governs, not stacked in the header. */}
                <span className="font-sans text-xs font-semibold text-chocolate/55">
                  {t("readyBox.maxOf", {
                    count: categoryMax,
                    name: L(category.name),
                  })}
                </span>
              </h3>
              {categoryFull && (
                <p className="mb-2 text-xs font-semibold text-chocolate/50">
                  {t("readyBox.categoryFull", { name: L(category.name) })}
                </p>
              )}
              {/* Two columns once there is room — a 512px column on a wide
                  desktop meant four visible items and five screens of scroll. */}
              <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
                {items.map((product) => {
                  const qty = contents[product.id] ?? 0;
                  const canAdd = remaining > 0 && !categoryFull;
                  return (
                    <li key={product.id}>
                      <div
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 ${
                          qty > 0
                            ? "bg-brick/10 ring-brick/40"
                            : "bg-white/70 ring-chocolate/10"
                        }`}
                      >
                        <ProductThumb
                          product={product}
                          className="pointer-events-none h-12 w-12 shrink-0"
                          rounded="rounded-xl"
                          sizes="48px"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold leading-snug text-chocolate">
                            {L(product.name)}
                          </span>
                          {lang === "en" && (
                            <span
                              lang="ar"
                              dir="rtl"
                              className="block truncate font-arabic text-xs text-chocolate/50"
                            >
                              {product.name.ar}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1 rounded-full bg-cream p-1 ring-1 ring-chocolate/10">
                          <button
                            type="button"
                            onClick={() => changeQty(product, -1)}
                            disabled={qty === 0}
                            className="grid h-11 w-11 place-items-center rounded-full text-chocolate transition-colors hover:bg-brick/10 disabled:opacity-30"
                            aria-label={t("box.removeOne", {
                              name: L(product.name),
                            })}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span
                            className="w-6 text-center font-bold text-chocolate"
                            aria-live="polite"
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQty(product, 1)}
                            disabled={!canAdd}
                            className="grid h-11 w-11 place-items-center rounded-full text-chocolate transition-colors hover:bg-brick/10 disabled:opacity-30"
                            aria-label={t("box.addOne", {
                              name: L(product.name),
                            })}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
            );
          })}
        </div>

        {/* Live box summary, sitting with the button it gates — the same
            shape as the Build a Box bar. */}
        <footer className="shrink-0 border-t border-chocolate/10 bg-cream px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold text-chocolate" aria-live="polite">
              {isFull
                ? t("readyBox.full")
                : t("readyBox.picked", { count: selectedCount, capacity })}
            </span>
            <span className="font-display text-lg font-semibold text-caramel">
              {formatPrice(box.price)}
            </span>
          </div>

          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-chocolate/10">
            <div
              className="h-full rounded-full bg-brick transition-[width] duration-300"
              style={{
                width: `${Math.min(100, (selectedCount / Math.max(1, capacity)) * 100)}%`,
              }}
            />
          </div>

          {picked.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1" aria-label={t("readyBox.inBox")}>
              {picked.slice(0, 12).map((product, i) => (
                <li key={`${product.id}-${i}`}>
                  <ProductThumb
                    product={product}
                    className="h-7 w-7"
                    rounded="rounded-md"
                    sizes="28px"
                  />
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isFull}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold transition-all duration-200 ${
              justAdded
                ? "bg-pistachio text-cream"
                : isFull
                  ? "bg-brick text-cream hover:-translate-y-0.5 hover:bg-caramel-dark"
                  : "cursor-not-allowed bg-chocolate/10 text-chocolate/40"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-5 w-5" /> {t("box.added")}
              </>
            ) : isFull ? (
              t("box.add")
            ) : (
              t("readyBox.need", { count: remaining })
            )}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
