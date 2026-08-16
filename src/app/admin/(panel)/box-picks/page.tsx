"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Catalog, Product, ReadyBoxAllow } from "@/lib/types";
import {
  isBoxCategoryAllowed,
  readyBoxCategoryMax,
  readyBoxPicks,
  readyBoxProductMax,
} from "@/lib/data";
import { useAdminLanguage } from "@/lib/admin-language-context";

function isPickableItem(product: Product) {
  return !product.fillable && product.category !== "boxes";
}

function cleanAllow(allow: ReadyBoxAllow | undefined): ReadyBoxAllow | undefined {
  if (!allow) return undefined;
  const categories = Array.isArray(allow.categories)
    ? allow.categories
    : undefined;
  const categoryMax = allow.categoryMax
    ? Object.fromEntries(
        Object.entries(allow.categoryMax).filter(
          ([, amount]) => typeof amount === "number" && amount >= 0,
        ),
      )
    : undefined;
  const productMax = allow.productMax
    ? Object.fromEntries(
        Object.entries(allow.productMax).filter(([, amount]) => amount === 0),
      )
    : undefined;
  const next: ReadyBoxAllow = {};
  if (categories) next.categories = categories;
  if (categoryMax && Object.keys(categoryMax).length > 0) {
    next.categoryMax = categoryMax;
  }
  if (productMax && Object.keys(productMax).length > 0) next.productMax = productMax;
  return Object.keys(next).length > 0 ? next : undefined;
}

export default function AdminBoxPicksPage() {
  const { lang, t } = useAdminLanguage();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [boxId, setBoxId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/catalog", { cache: "no-store" });
      if (!res.ok) {
        setError(t("products.loadFailed"));
        return;
      }
      const data = (await res.json()) as Catalog;
      setCatalog(data);
      setBoxId((current) => {
        if (current && data.products.some((product) => product.id === current)) {
          return current;
        }
        return (
          data.products.find(
            (product) => product.category === "boxes" && !product.fillable,
          )?.id ?? ""
        );
      });
    })();
  }, [t]);

  const readyBoxes = useMemo(
    () =>
      (catalog?.products ?? []).filter(
        (product) => product.category === "boxes" && !product.fillable,
      ),
    [catalog],
  );

  const box = readyBoxes.find((product) => product.id === boxId);

  const groups = useMemo(() => {
    if (!catalog) return [];
    return catalog.categories
      .map((category) => ({
        category,
        items: catalog.products.filter(
          (product) =>
            product.category === category.id &&
            isPickableItem(product) &&
            product.boxPick !== false &&
            category.boxPick !== false,
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [catalog]);

  const pickableCategoryIds = useMemo(
    () => groups.map((group) => group.category.id),
    [groups],
  );

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!catalog) return;
    setStatus(t("common.saving"));
    setError("");
    const payload: Catalog = {
      ...catalog,
      products: catalog.products.map((product) => ({
        ...product,
        boxPick: product.boxPick === false ? false : undefined,
        boxAllow:
          product.category === "boxes" && !product.fillable
            ? cleanAllow(product.boxAllow)
            : undefined,
      })),
    };
    const res = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || t("common.saveFailed"));
      setStatus("");
      return;
    }
    setCatalog(await res.json());
    setStatus(t("common.saved"));
  };

  const updateBox = (id: string, patch: Partial<Product>) => {
    if (!catalog) return;
    setCatalog({
      ...catalog,
      products: catalog.products.map((product) =>
        product.id === id ? { ...product, ...patch } : product,
      ),
    });
  };

  const setCategoryAllowed = (categoryId: string, enabled: boolean) => {
    if (!box) return;
    const current = box.boxAllow?.categories;
    const active = new Set(
      current && current.length > 0 ? current : pickableCategoryIds,
    );
    if (enabled) active.add(categoryId);
    else active.delete(categoryId);
    const next = pickableCategoryIds.filter((id) => active.has(id));
    const allOn = next.length === pickableCategoryIds.length;
    updateBox(box.id, {
      boxAllow: cleanAllow({
        ...box.boxAllow,
        categories: allOn ? undefined : next,
      }),
    });
  };

  const setCategoryMax = (categoryId: string, max: number) => {
    if (!box) return;
    const categoryMax = { ...box.boxAllow?.categoryMax };
    categoryMax[categoryId] = Math.max(0, Math.min(99, Math.floor(max) || 0));
    updateBox(box.id, {
      boxAllow: cleanAllow({
        ...box.boxAllow,
        categoryMax,
      }),
    });
  };

  const setProductOffered = (productId: string, offered: boolean) => {
    if (!box) return;
    const productMax = { ...box.boxAllow?.productMax };
    if (offered) delete productMax[productId];
    else productMax[productId] = 0;
    updateBox(box.id, {
      boxAllow: cleanAllow({
        ...box.boxAllow,
        productMax,
      }),
    });
  };

  const setGroupItems = (items: Product[], enabled: boolean) => {
    if (!box) return;
    const productMax = { ...box.boxAllow?.productMax };
    for (const item of items) {
      if (enabled) delete productMax[item.id];
      else productMax[item.id] = 0;
    }
    updateBox(box.id, {
      boxAllow: cleanAllow({
        ...box.boxAllow,
        productMax,
      }),
    });
  };

  if (!catalog) {
    return <p className="text-[#4a2218]/65">{error || t("common.loading")}</p>;
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {t("boxPicks.title")}
          </h1>
          <p className="mt-1 text-[#4a2218]/65">{t("boxPicks.subtitle")}</p>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-full bg-[#964534] px-5 py-2.5 text-sm font-semibold text-[#f3e6d4]"
        >
          {t("categories.saveAll")}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#964534] ring-1 ring-[#964534]/20"
        >
          {error}
        </p>
      )}
      {status && (
        <p role="status" aria-live="polite" className="text-sm font-semibold text-[#964534]">
          {status}
        </p>
      )}

      {readyBoxes.length > 0 && (
        <div
          role="tablist"
          aria-label={t("boxPicks.chooseBox")}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {readyBoxes.map((item) => {
            const selected = item.id === boxId;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setBoxId(item.id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ${
                  selected
                    ? "bg-[#964534] text-[#f3e6d4]"
                    : "bg-white text-[#4a2218] ring-1 ring-[#964534]/15"
                }`}
              >
                {item.name[lang] || item.name.en}
              </button>
            );
          })}
        </div>
      )}

      {box && (
        <>
          <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/10">
            <h2 className="font-display text-xl font-semibold">
              {box.name[lang] || box.name.en}
            </h2>
            {/* The total is the sum of the category numbers below, so there is
                nothing to keep in sync by hand. */}
            <p className="text-base font-semibold">
              {t("boxPicks.picks")}:{" "}
              <span className="text-[#964534]">{readyBoxPicks(box)}</span>
            </p>
            <p className="text-sm text-[#4a2218]/60">{t("boxPicks.picksHint")}</p>
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/10">
            <div>
              <h2 className="font-display text-xl font-semibold">
                {t("boxPicks.categories")}
              </h2>
              <p className="mt-1 text-sm text-[#4a2218]/65">
                {t("boxPicks.categoriesHint")}
              </p>
            </div>
            <ul className="space-y-2">
              {groups.map(({ category, items }) => {
                const allowed = isBoxCategoryAllowed(box, category.id);
                const max = readyBoxCategoryMax(box, category.id);
                const name = category.name[lang] || category.name.en;
                const offered = items.filter(
                  (item) => readyBoxProductMax(box, item) > 0,
                ).length;
                return (
                  <li
                    key={category.id}
                    className="flex flex-col gap-2 rounded-xl bg-[#f3e6d4]/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <label className="inline-flex min-h-12 items-center gap-3 text-sm font-semibold">
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={allowed}
                        onChange={(e) =>
                          setCategoryAllowed(category.id, e.target.checked)
                        }
                        aria-label={t("boxPicks.includeCategory", { name })}
                      />
                      <span className="min-w-0">
                        {name}
                        <span className="ms-2 font-normal text-[#4a2218]/55">
                          {t("boxPicks.offered", { count: offered })}
                        </span>
                      </span>
                    </label>
                    <label
                      className={`inline-flex items-center gap-2 text-xs font-semibold text-[#4a2218]/70 ${
                        allowed ? "" : "pointer-events-none opacity-40"
                      }`}
                    >
                      {t("boxPicks.max")}
                      <input
                        type="number"
                        min={0}
                        max={99}
                        disabled={!allowed}
                        value={allowed ? max : 0}
                        onChange={(e) =>
                          setCategoryMax(
                            category.id,
                            Math.max(0, Number(e.target.value) || 0),
                          )
                        }
                        aria-label={t("boxPicks.maxNamed", { name })}
                        className="min-h-11 w-20 rounded-xl border-2 border-[#964534]/15 bg-white px-2 text-sm outline-none focus:border-[#964534]"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold">
                {t("boxPicks.products")}
              </h2>
              <p className="mt-1 text-sm text-[#4a2218]/65">
                {t("boxPicks.productsHint")}
              </p>
            </div>
            {groups.every(({ category }) => !isBoxCategoryAllowed(box, category.id)) ? (
              <p className="rounded-2xl bg-white p-5 text-[#4a2218]/65 ring-1 ring-[#964534]/10">
                {t("boxPicks.empty")}
              </p>
            ) : (
              <ul className="space-y-4">
                {groups
                  .filter(({ category }) => isBoxCategoryAllowed(box, category.id))
                  .map(({ category, items }) => (
                    <li
                      key={category.id}
                      className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/10"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-display text-lg font-semibold">
                          {category.name[lang] || category.name.en}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setGroupItems(items, true)}
                            className="inline-flex min-h-10 items-center rounded-full px-3 text-xs font-semibold text-[#964534] ring-1 ring-[#964534]/20"
                          >
                            {t("boxPicks.allOn")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupItems(items, false)}
                            className="inline-flex min-h-10 items-center rounded-full px-3 text-xs font-semibold text-[#964534] ring-1 ring-[#964534]/20"
                          >
                            {t("boxPicks.allOff")}
                          </button>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {items.map((product) => {
                          const allowed = readyBoxProductMax(box, product) > 0;
                          const name = product.name[lang] || product.name.en;
                          return (
                            <li key={product.id}>
                              <label className="flex min-h-11 items-center gap-2 rounded-xl bg-[#f3e6d4]/50 px-3 py-2 text-sm font-semibold">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={allowed}
                                  onChange={(e) =>
                                    setProductOffered(
                                      product.id,
                                      e.target.checked,
                                    )
                                  }
                                  aria-label={t("boxPicks.allowItem", { name })}
                                />
                                <span className="min-w-0">
                                  {name}
                                  {product.hidden && (
                                    <span className="ms-2 font-normal text-[#4a2218]/50">
                                      {t("boxPicks.hiddenItem")}
                                    </span>
                                  )}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </>
      )}

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#964534] px-5 py-3 text-sm font-semibold text-[#f3e6d4] sm:w-auto"
      >
        {t("categories.saveAll")}
      </button>
    </form>
  );
}
