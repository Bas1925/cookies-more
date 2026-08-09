"use client";

import { FormEvent, useEffect, useState } from "react";
import LocalizedFields, {
  emptyLocalized,
} from "@/components/admin/LocalizedFields";
import type { Catalog, Category } from "@/lib/types";
import { useAdminLanguage } from "@/lib/admin-language-context";

export default function AdminCategoriesPage() {
  const { lang, t } = useAdminLanguage();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/catalog", { cache: "no-store" });
      if (!res.ok) {
        setError(t("products.loadFailed"));
        return;
      }
      setCatalog(await res.json());
    })();
  }, [t]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!catalog) return;
    setStatus(t("common.saving"));
    setError("");
    const res = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catalog),
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

  const updateCategory = (index: number, next: Category) => {
    if (!catalog) return;
    const prev = catalog.categories[index];
    const categories = catalog.categories.map((c, i) =>
      i === index ? next : c,
    );
    let products = catalog.products;
    if (prev && prev.id !== next.id) {
      products = catalog.products.map((p) =>
        p.category === prev.id ? { ...p, category: next.id } : p,
      );
    }
    setCatalog({ ...catalog, categories, products });
  };

  const addCategory = () => {
    if (!catalog) return;
    const id = `category-${Date.now().toString(36)}`;
    setCatalog({
      ...catalog,
      categories: [
        ...catalog.categories,
        {
          id,
          name: {
            en: "New category",
            ar: "فئة جديدة",
            he: "קטגוריה חדשה",
          },
          blurb: emptyLocalized(),
        },
      ],
    });
  };

  const removeCategory = (id: string) => {
    if (!catalog) return;
    const inUse = catalog.products.some((p) => p.category === id);
    if (inUse) {
      setError(t("categories.inUse"));
      return;
    }
    if (!confirm(t("categories.removeConfirm"))) return;
    setCatalog({
      ...catalog,
      categories: catalog.categories.filter((c) => c.id !== id),
    });
  };

  if (!catalog) {
    return <p className="text-[#4a2218]/65">{error || t("common.loading")}</p>;
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("categories.title")}</h1>
          <p className="mt-1 text-[#4a2218]/65">
            {t("categories.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addCategory}
            className="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#964534] ring-1 ring-[#964534]/25"
          >
            {t("categories.add")}
          </button>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full bg-[#964534] px-5 py-2.5 text-sm font-semibold text-[#f3e6d4]"
          >
            {t("categories.saveAll")}
          </button>
        </div>
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

      <ul className="space-y-4">
        {catalog.categories.map((category, index) => (
          <li
            key={category.id}
            className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/10"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <label className="block min-w-0 flex-1 text-sm font-semibold">
                {t("common.id")}
                <input
                  value={category.id}
                  onChange={(e) =>
                    updateCategory(index, {
                      ...category,
                      id: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]+/g, "-"),
                    })
                  }
                  className="mt-1 block w-full min-h-11 rounded-xl border-2 border-[#964534]/15 px-3 py-2.5 text-base outline-none focus:border-[#964534] sm:max-w-xs sm:text-sm"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(category.hidden)}
                    onChange={(e) =>
                      updateCategory(index, {
                        ...category,
                        hidden: e.target.checked,
                      })
                    }
                  />
                  {t("common.hidden")}
                </label>
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-[#964534] ring-1 ring-[#964534]/20"
                  aria-label={t("categories.removeNamed", {
                    name: category.name[lang] || category.name.en || category.id,
                  })}
                >
                  {t("common.remove")}
                </button>
              </div>
            </div>
            <LocalizedFields
              label={t("common.name")}
              value={category.name}
              onChange={(name) => updateCategory(index, { ...category, name })}
            />
            <LocalizedFields
              label={lang === "ar" ? "النص التعريفي" : "Blurb"}
              value={category.blurb}
              onChange={(blurb) =>
                updateCategory(index, { ...category, blurb })
              }
              multiline
            />
          </li>
        ))}
      </ul>
    </form>
  );
}
