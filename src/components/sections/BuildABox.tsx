"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Check, ArrowRight, RotateCcw } from "lucide-react";
import { gsap } from "gsap";
import ProductThumb from "../ProductThumb";
import AnimatedHeading from "../AnimatedHeading";
import {
  boxCapacity,
  boxExtrasTotal,
  boxLinePrice,
  formatPrice,
} from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { useLanguage } from "@/lib/language-context";

export default function BuildABox() {
  const { addBox } = useCart();
  const { t, L, lang } = useLanguage();
  const { boxes, boxFillings, getProduct } = useCatalog();
  const [boxId, setBoxId] = useState(boxes[0]?.id ?? "build-box-small");
  const [contents, setContents] = useState<Record<string, number>>({});
  const [justAdded, setJustAdded] = useState(false);
  const slotsRef = useRef<HTMLUListElement>(null);
  const prevFilledRef = useRef(0);
  const buildSectionRef = useRef<HTMLElement>(null);
  const boxPanelRef = useRef<HTMLDivElement>(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const ghosts = boxFillings.filter((p) => p.image);
  /**
   * Falls back when the stored id goes stale — the catalog is editable, so a
   * box can disappear under us. Deriving it here rather than correcting the
   * state in an effect: `boxId` is read nowhere else, so the fallback alone
   * is enough and it avoids a cascading re-render.
   */
  const box = getProduct(boxId) ?? boxes[0];
  const capacity = box ? boxCapacity(box.id) : 6;

  const filled = useMemo(
    () => Object.values(contents).reduce((sum, n) => sum + n, 0),
    [contents],
  );

  const extras = useMemo(() => boxExtrasTotal(contents), [contents]);
  const total = useMemo(
    () => (box ? boxLinePrice(box.id, contents) : 0),
    [box, contents],
  );
  const isFull = filled === capacity;
  const remaining = capacity - filled;

  // Flatten contents into an ordered list of product ids for the slots.
  const slots = useMemo(() => {
    const arr: string[] = [];
    for (const product of boxFillings) {
      const n = contents[product.id] ?? 0;
      for (let i = 0; i < n; i++) arr.push(product.id);
    }
    return arr;
  }, [contents, boxFillings]);

  // Pop-in animation whenever an item lands in a slot.
  useEffect(() => {
    const list = slotsRef.current;
    if (!list) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      prevFilledRef.current = filled;
      return;
    }
    if (filled > prevFilledRef.current) {
      const nodes = list.querySelectorAll("[data-slot-filled]");
      const last = nodes[nodes.length - 1];
      if (last) {
        gsap.fromTo(
          last,
          { scale: 0, rotate: -30 },
          { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(2)" },
        );
      }
    }
    prevFilledRef.current = filled;
  }, [filled]);

  const selectBox = (nextId: string) => {
    setBoxId(nextId);
    const nextCap = boxCapacity(nextId);
    setContents((prev) => {
      let totalCount = Object.values(prev).reduce((s, n) => s + n, 0);
      if (totalCount <= nextCap) return prev;
      // Trim newest extras when switching to a smaller box.
      const trimmed: Record<string, number> = { ...prev };
      for (let i = boxFillings.length - 1; i >= 0 && totalCount > nextCap; i--) {
        const id = boxFillings[i].id;
        const n = trimmed[id] ?? 0;
        if (n <= 0) continue;
        const drop = Math.min(n, totalCount - nextCap);
        if (drop >= n) delete trimmed[id];
        else trimmed[id] = n - drop;
        totalCount -= drop;
      }
      return trimmed;
    });
  };

  const changeQty = (id: string, delta: number) => {
    setContents((prev) => {
      const current = prev[id] ?? 0;
      const next = current + delta;
      if (next < 0) return prev;
      if (delta > 0) {
        const totalCount = Object.values(prev).reduce((s, n) => s + n, 0);
        if (totalCount >= capacity) return prev;
      }
      const updated = { ...prev, [id]: next };
      if (next === 0) delete updated[id];
      return updated;
    });
  };

  const reset = () => setContents({});

  /**
   * On a phone the box sits above the cookie list, so once you start picking
   * you lose sight of what's in it. Watch the panel and, while it's off
   * screen, mirror its state into a bar pinned to the bottom of the viewport.
   */
  useEffect(() => {
    const panel = boxPanelRef.current;
    const section = buildSectionRef.current;
    if (!panel || !section) return;

    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const panelRect = panel.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        setShowMobileSummary(
          panelRect.bottom <= 0 && sectionRect.bottom > window.innerHeight * 0.2,
        );
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleAddBox = () => {
    if (!isFull || !box) return;
    addBox(box.id, contents);
    setJustAdded(true);
    setContents({});
    window.setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <section
      ref={buildSectionRef}
      id="build"
      className="relative overflow-hidden bg-brick py-16 text-cream md:py-24"
    >
      {/* Scattered cookies instead of the empty outlined rings this used to
          draw — same placement, actual product photography. */}
      {ghosts.length > 0 && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {[
            { pos: "left-[6%] top-[14%] h-40 w-40", rotate: -12 },
            { pos: "right-[8%] top-[26%] h-28 w-28", rotate: 18 },
            { pos: "bottom-[8%] left-[16%] h-32 w-32", rotate: 8 },
          ].map((deco, i) => (
            <div
              key={deco.pos}
              className={`absolute hidden opacity-[0.13] md:block ${deco.pos}`}
              style={{ rotate: `${deco.rotate}deg` }}
            >
              <ProductThumb
                product={ghosts[i % ghosts.length]}
                className="h-full w-full"
                sizes="160px"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-cream">
            {t("box.eyebrow")}
          </span>
          <AnimatedHeading className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            {t("box.title")}
          </AnimatedHeading>
          <p className="mt-4 text-cream/70">{t("box.sub")}</p>
        </div>

        <div
          className="mx-auto mt-10 grid max-w-4xl grid-cols-3 gap-2 sm:gap-4"
          role="group"
          aria-label={t("box.size")}
        >
          {boxes.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectBox(option.id)}
              aria-pressed={box?.id === option.id}
              className={`relative flex min-w-0 flex-col items-center rounded-[1.5rem] border-2 p-2.5 transition-all duration-300 sm:p-4 ${
                box?.id === option.id
                  ? "-translate-y-1 border-cream bg-cream/20 shadow-xl shadow-chocolate/40 ring-2 ring-cream/25 sm:ring-4"
                  : "border-cream/15 bg-cream/5 opacity-70 hover:-translate-y-0.5 hover:border-cream/40 hover:opacity-100"
              }`}
            >
              {box?.id === option.id && (
                <span
                  aria-hidden="true"
                  className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-cream text-brick shadow-md"
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
              <div aria-hidden="true" className="mb-3 w-full">
                <ProductThumb
                  product={option}
                  className="aspect-square w-full"
                  rounded="rounded-xl"
                  sizes="(max-width: 640px) 30vw, 240px"
                />
              </div>
              <span className="font-display text-sm font-semibold leading-tight sm:text-base lg:text-lg">
                {L(option.name)}
              </span>
              {lang === "en" && (
                <span
                  lang="ar"
                  dir="rtl"
                  className="mt-1 line-clamp-2 font-arabic text-xs text-cream/70"
                >
                  {option.name.ar}
                </span>
              )}
              <span className="mt-1 text-xs text-cream/70">
                {t("box.slots", { count: option.slots ?? 6 })}
              </span>
              <span className="mt-2 rounded-full bg-cream px-3 py-1 text-xs font-bold text-brick shadow-sm">
                {formatPrice(option.price)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
          {/* Left: live box + slots + total */}
          <div
            ref={boxPanelRef}
            className="flex flex-col rounded-[2.5rem] bg-cream/5 p-5 backdrop-blur-sm ring-1 ring-cream/10 md:p-6 lg:p-8"
          >
            {/* The box itself */}
            <div className="flex-1 rounded-[2rem] bg-chocolate/55 p-5 ring-1 ring-cream/15">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-cream/80" aria-live="polite">
                  {filled === 0
                    ? t("box.empty")
                    : t("box.filled", { count: filled, capacity })}
                </span>
                {filled > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-1 text-cream/50 transition-colors hover:text-cream"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> {t("box.reset")}
                  </button>
                )}
              </div>
              <ul ref={slotsRef} className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: capacity }).map((_, i) => {
                  const productId = slots[i];
                  const product = productId ? getProduct(productId) : undefined;
                  return (
                    <li
                      key={i}
                      className="relative grid aspect-square place-items-center rounded-2xl bg-cream/5"
                    >
                      {product ? (
                        <span
                          data-slot-filled
                          className="block h-full w-full p-1"
                        >
                          <ProductThumb
                            product={product}
                            className="h-full w-full"
                            rounded="rounded-xl"
                            sizes="64px"
                          />
                        </span>
                      ) : (
                        ghosts.length > 0 ? (
                          <span
                            aria-hidden="true"
                            className="block h-full w-full p-1 opacity-20 grayscale"
                          >
                            <ProductThumb
                              product={ghosts[i % ghosts.length]}
                              className="h-full w-full"
                              rounded="rounded-xl"
                              sizes="64px"
                            />
                          </span>
                        ) : null
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Total + add */}
            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <span className="text-cream/70">
                    {box ? L(box.name) : "—"}
                  </span>
                  {extras > 0 && (
                    <p className="mt-1 text-xs font-semibold text-cream">
                      {t("box.extrasNote", { amount: formatPrice(extras) })}
                    </p>
                  )}
                </div>
                <span className="font-display text-3xl font-semibold">
                  {formatPrice(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddBox}
                disabled={!isFull}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold transition-all duration-200 ${
                  justAdded
                    ? "bg-pistachio text-cream"
                    : isFull
                      ? "bg-caramel text-cream shadow-lg shadow-caramel/30 hover:-translate-y-0.5"
                      : "cursor-not-allowed bg-cream/15 text-cream/50"
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="h-5 w-5" /> {t("box.added")}
                  </>
                ) : isFull ? (
                  <>
                    {t("box.add")}
                    <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                  </>
                ) : (
                  t("box.needFull", { count: remaining })
                )}
              </button>
            </div>
          </div>

          {/* Right: cookie picker */}
          <div className="rounded-[2.5rem] bg-cream/5 p-5 backdrop-blur-sm ring-1 ring-cream/10 md:p-6 lg:p-8">
            <h3 className="mb-4 font-display text-2xl font-semibold">
              {t("box.choose")}
            </h3>
            {/* Only a scroll region from `md` up, where it sits beside the box.
                On a phone a 544px window holding 2500px of list is a trap:
                a thumb swipe scrolls the list instead of the page. */}
            <ul className="grid grid-cols-1 gap-3 md:max-h-[44rem] md:overflow-y-auto md:pe-1 2xl:grid-cols-2">
              {boxFillings.map((product) => {
                const qty = contents[product.id] ?? 0;
                const canAdd = remaining > 0;
                const premium = product.boxExtra ?? 0;
                return (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 rounded-2xl bg-cream/5 p-3 ring-1 ring-cream/10"
                  >
                    <ProductThumb
                      product={product}
                      className="h-14 w-14 shrink-0"
                      rounded="rounded-xl"
                      sizes="56px"
                    />
                    <div className="min-w-0 flex-1">
                      {/* Wraps rather than truncates: the 44px steppers leave
                          ~103px here, and longer Arabic/Hebrew names ("עוגיית
                          אמסטרדם") were losing their last word to an ellipsis. */}
                      <p className="line-clamp-2 font-semibold leading-snug">
                        {L(product.name)}
                      </p>
                      {lang === "en" && (
                        <p
                          lang="ar"
                          dir="rtl"
                          className="truncate font-arabic text-xs text-cream/60"
                        >
                          {product.name.ar}
                        </p>
                      )}
                      {premium > 0 && (
                        <p className="mt-1 inline-flex rounded-full bg-cream/12 px-2 py-0.5 text-[0.7rem] font-bold text-cream ring-1 ring-cream/20">
                          {t("box.premium", { amount: formatPrice(premium) })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-cream/10 p-1">
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, -1)}
                        disabled={qty === 0}
                        className="grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-caramel disabled:opacity-30 sm:h-9 sm:w-9"
                        aria-label={t("box.removeOne", {
                          name: L(product.name),
                        })}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span
                        className="w-6 text-center font-bold"
                        aria-live="polite"
                      >
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, 1)}
                        disabled={!canAdd}
                        className="grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-caramel disabled:opacity-30 sm:h-9 sm:w-9"
                        aria-label={t("box.addOne", { name: L(product.name) })}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Live box summary, pinned while the real box is scrolled away. */}
      <div
        aria-hidden={!showMobileSummary}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-cream/15 bg-chocolate/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 lg:hidden ${
          showMobileSummary ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-cream/75">
                {filled === 0
                  ? t("box.empty")
                  : t("box.filled", { count: filled, capacity })}
              </span>
              <span className="font-display text-lg font-semibold text-cream">
                {formatPrice(total)}
              </span>
            </div>

            {/* Progress toward a full box, plus the cookies already in it. */}
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-cream/15">
              <div
                className="h-full rounded-full bg-caramel transition-[width] duration-300"
                style={{
                  width: `${Math.min(100, (filled / Math.max(1, capacity)) * 100)}%`,
                }}
              />
            </div>

            {slots.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {slots.slice(0, 10).map((productId, i) => {
                  const product = getProduct(productId);
                  if (!product) return null;
                  return (
                    <li key={`${productId}-${i}`}>
                      <ProductThumb
                        product={product}
                        className="h-7 w-7"
                        rounded="rounded-md"
                        sizes="28px"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddBox}
            disabled={!isFull}
            /* Capped, and allowed to wrap: the Arabic "add N more" label runs
               ~200px and was crowding the count and thumbnails out. */
            className={`min-h-12 max-w-[52%] shrink rounded-full px-4 text-center text-xs font-semibold leading-tight transition-colors sm:max-w-none sm:shrink-0 sm:px-5 sm:text-sm ${
              justAdded
                ? "bg-pistachio text-cream"
                : isFull
                  ? "bg-caramel text-cream"
                  : "cursor-not-allowed bg-cream/15 text-cream/50"
            }`}
          >
            {justAdded
              ? t("box.added")
              : isFull
                ? t("box.add")
                : t("box.needFull", { count: remaining })}
          </button>
        </div>
      </div>
    </section>
  );
}
