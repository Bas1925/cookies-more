"use client";

import { Plus, Check, ListChecks } from "lucide-react";
import { useCallback, useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import {
  formatPrice,
  isCustomizableReadyBox,
  readyBoxCategoryRules,
  readyBoxPicks,
} from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { useLanguage } from "@/lib/language-context";
import ReadyBoxPicker from "./ReadyBoxPicker";

function CardPhoto({ product, name }: { product: Product; name: string }) {
  if (product.image) {
    return (
      <Image
        src={product.image}
        alt={name}
        fill
        sizes="(max-width: 768px) 32vw, (max-width: 1280px) 18vw, 160px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ objectPosition: product.objectPosition ?? "center" }}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 grid place-items-center px-1.5 sm:px-3"
      style={{
        background: `linear-gradient(140deg, ${product.accent}, ${product.accent}cc)`,
      }}
    >
      <span className="text-center font-display text-xs font-semibold text-white/90 sm:text-base lg:text-lg">
        {name}
      </span>
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { categories } = useCatalog();
  const { t, L } = useLanguage();
  const [added, setAdded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const name = L(product.name);
  const customizable = isCustomizableReadyBox(product);
  const picks = customizable ? readyBoxPicks(product) : 0;
  const rules = customizable
    ? readyBoxCategoryRules(product).map((rule) => {
        const category = categories.find((item) => item.id === rule.id);
        return t("readyBox.cardRule", {
          name: category ? L(category.name) : rule.id,
          count: rule.max,
        });
      })
    : [];

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const markAdded = () => {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  const handleAdd = () => {
    if (customizable) {
      setPickerOpen(true);
      return;
    }
    addItem(product.id);
    markAdded();
  };

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-chocolate/8 bg-white shadow-[0_18px_50px_-24px_rgba(59,33,23,0.4)] transition-transform duration-300 hover:-translate-y-1.5 sm:rounded-2xl">
        {/* Square: the store's photos are a mix of portrait and landscape, and a
            4:3 crop cut the portrait ones off at the knees. */}
        <div className="relative aspect-square overflow-hidden bg-cream-dark">
          {customizable ? (
            <button
              type="button"
              onClick={handleAdd}
              className="absolute inset-0 text-start"
              aria-label={t("readyBox.chooseNamed", { name })}
            >
              <CardPhoto product={product} name={name} />
            </button>
          ) : (
            <CardPhoto product={product} name={name} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-chocolate/20 via-transparent to-transparent" />
        </div>

        <div className="flex flex-1 flex-col p-2 sm:p-3 lg:p-3.5">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-display text-[0.8rem] font-semibold leading-snug text-chocolate sm:text-base lg:text-lg">
              {name}
            </h3>
            <span className="shrink-0 font-display text-xs font-semibold text-caramel sm:text-sm lg:text-base">
              {formatPrice(product.price)}
            </span>
            {customizable && (
              <span className="text-[0.65rem] font-semibold text-chocolate/45 sm:text-xs">
                {t("readyBox.picksHint", { count: picks })}
                {rules.length > 0 && (
                  <span className="mt-0.5 block font-medium leading-snug">
                    {rules.join(" · ")}
                  </span>
                )}
              </span>
            )}
          </div>
          {/* Keeps the button pinned to the bottom on cards with less copy. */}
          <div className="flex-1" />

          <button
            type="button"
            onClick={handleAdd}
            className={`mt-2 flex min-h-11 w-full items-center justify-center gap-1 rounded-full px-1.5 py-2 text-[0.7rem] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:mt-3 sm:min-h-10 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm ${
              added
                ? "bg-pistachio text-cream"
                : "bg-brick text-cream hover:bg-caramel-dark"
            }`}
            aria-label={
              customizable
                ? t("readyBox.chooseNamed", { name })
                : t("product.addNamed", { name })
            }
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">{t("product.added")}</span>
              </>
            ) : customizable ? (
              <>
                <ListChecks className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate sm:hidden">
                  {t("readyBox.chooseShort")}
                </span>
                <span className="hidden truncate sm:inline">
                  {t("readyBox.choose")}
                </span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                {/* Short label on the 3-up mobile grid — the full Arabic one
                    doesn't fit a 106px card and was being clipped. */}
                <span className="truncate sm:hidden">
                  {t("product.addShort")}
                </span>
                <span className="hidden truncate sm:inline">
                  {t("product.add")}
                </span>
              </>
            )}
          </button>
        </div>
      </article>

      {pickerOpen && (
        <ReadyBoxPicker
          box={product}
          onClose={closePicker}
          onAdded={markAdded}
        />
      )}
    </>
  );
}
