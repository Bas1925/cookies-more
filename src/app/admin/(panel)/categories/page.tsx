"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Plus, Trash2, X } from "lucide-react";
import LocalizedFields, {
  emptyLocalized,
} from "@/components/admin/LocalizedFields";
import type { Catalog, Category, Localized } from "@/lib/types";
import { useAdminLanguage } from "@/lib/admin-language-context";

function hasName(name: Localized) {
  return Boolean(name.en.trim() || name.ar.trim() || name.he.trim());
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueId(name: Localized, used: Set<string>) {
  const base =
    slugify(name.en) ||
    slugify(name.ar) ||
    slugify(name.he) ||
    `category-${Date.now().toString(36)}`;
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function displayName(category: Category, lang: "en" | "ar") {
  return category.name[lang] || category.name.en || category.id;
}

export default function AdminCategoriesPage() {
  const { lang, t } = useAdminLanguage();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [draftName, setDraftName] = useState<Localized>(emptyLocalized());
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [focusId, setFocusId] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const addNameRef = useRef<HTMLInputElement>(null);
  const newCardRef = useRef<HTMLLIElement>(null);

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

  useEffect(() => {
    if (!focusId) return;
    newCardRef.current?.focus();
    newCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId]);

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
    if (!hasName(draftName)) {
      setError(t("categories.nameRequired"));
      addNameRef.current?.focus();
      return;
    }
    const id = uniqueId(
      draftName,
      new Set(catalog.categories.map((category) => category.id)),
    );
    setCatalog({
      ...catalog,
      categories: [
        ...catalog.categories,
        {
          id,
          name: {
            en: draftName.en.trim() || draftName.he.trim() || draftName.ar.trim(),
            ar: draftName.ar.trim() || draftName.en.trim() || draftName.he.trim(),
            he: draftName.he.trim() || draftName.en.trim() || draftName.ar.trim(),
          },
          blurb: emptyLocalized(),
        },
      ],
    });
    setDraftName(emptyLocalized());
    setError("");
    setStatus(t("categories.added"));
    setFocusId(id);
  };

  const removeCategory = (id: string, moveTo?: string) => {
    if (!catalog) return;
    if (catalog.categories.length <= 1) {
      setError(t("categories.last"));
      return;
    }
    const inUse = catalog.products.some((p) => p.category === id);
    const products = inUse
      ? catalog.products.map((p) =>
          p.category === id && moveTo ? { ...p, category: moveTo } : p,
        )
      : catalog.products;
    if (products.some((p) => p.category === id)) {
      setError(t("categories.needMove"));
      return;
    }
    setCatalog({
      ...catalog,
      categories: catalog.categories.filter((c) => c.id !== id),
      products,
    });
    setPendingRemove(null);
    setError("");
    setStatus(t("categories.removed"));
    addNameRef.current?.focus();
  };

  if (!catalog) {
    return <p className="text-[#4a2218]/65">{error || t("common.loading")}</p>;
  }

  const pending = catalog.categories.find((c) => c.id === pendingRemove);

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">
              {t("categories.title")}
            </h1>
            <p className="mt-1 text-[#4a2218]/65">{t("categories.subtitle")}</p>
          </div>
          <button
            type="submit"
            form="save-categories"
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
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-semibold text-[#964534]"
          >
            {status}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCategory();
          }}
          aria-labelledby="add-category-title"
          className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-2 ring-[#964534]/20"
        >
          <div>
            <h2
              id="add-category-title"
              className="font-display text-xl font-semibold"
            >
              {t("categories.addTitle")}
            </h2>
            <p className="mt-1 text-sm text-[#4a2218]/65">
              {t("categories.addHint")}
            </p>
          </div>
          <LocalizedFields
            label={t("common.name")}
            value={draftName}
            onChange={setDraftName}
            firstInputRef={addNameRef}
          />
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#964534] px-5 py-3 text-sm font-semibold text-[#f3e6d4] sm:w-auto"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("categories.addAction")}
          </button>
        </form>

        <form
          id="save-categories"
          onSubmit={(e) => void save(e)}
          className="space-y-4"
        >
        <ul className="space-y-4" aria-label={t("categories.list")}>
          {catalog.categories.map((category, index) => {
            const count = catalog.products.filter(
              (p) => p.category === category.id,
            ).length;
            const name = displayName(category, lang);
            return (
              <li
                key={category.id}
                ref={focusId === category.id ? newCardRef : undefined}
                tabIndex={focusId === category.id ? -1 : undefined}
                className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/10 outline-none focus-visible:ring-2 focus-visible:ring-[#964534]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold">
                      {name}
                    </h2>
                    <p className="mt-0.5 text-sm text-[#4a2218]/60">
                      {count === 0
                        ? t("categories.emptyCount")
                        : t("categories.itemCount", { count })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setPendingRemove(category.id);
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-[#a5372f] ring-1 ring-[#a5372f]/25"
                    aria-label={t("categories.removeNamed", { name })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t("common.remove")}
                  </button>
                </div>
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
                  <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={category.boxPick !== false}
                      onChange={(e) =>
                        updateCategory(index, {
                          ...category,
                          boxPick: e.target.checked ? undefined : false,
                        })
                      }
                    />
                    {t("categories.boxPick")}
                  </label>
                </div>
                <LocalizedFields
                  label={t("common.name")}
                  value={category.name}
                  onChange={(nameValue) =>
                    updateCategory(index, { ...category, name: nameValue })
                  }
                />
                <LocalizedFields
                  label={lang === "ar" ? "النص التعريفي" : "Blurb"}
                  value={category.blurb}
                  onChange={(blurb) =>
                    updateCategory(index, { ...category, blurb })
                  }
                  multiline
                />
                <details className="rounded-xl bg-[#f3e6d4]/50 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-semibold text-[#4a2218]/75">
                    {t("categories.advanced")}
                  </summary>
                  <label className="mt-3 block text-sm font-semibold">
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
                      className="mt-1 block w-full min-h-11 rounded-xl border-2 border-[#964534]/15 bg-white px-3 py-2.5 text-base outline-none focus:border-[#964534] sm:max-w-xs sm:text-sm"
                    />
                  </label>
                  <p className="mt-2 text-xs text-[#4a2218]/55">
                    {t("categories.advancedHint")}
                  </p>
                </details>
              </li>
            );
          })}
        </ul>
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#964534] px-5 py-3 text-sm font-semibold text-[#f3e6d4] sm:w-auto"
          >
            {t("categories.saveAll")}
          </button>
        </form>
      </div>

      {pending && (
        <RemoveCategoryDialog
          category={pending}
          destinations={catalog.categories.filter((c) => c.id !== pending.id)}
          productCount={
            catalog.products.filter((p) => p.category === pending.id).length
          }
          onCancel={() => setPendingRemove(null)}
          onConfirm={(moveTo) => removeCategory(pending.id, moveTo)}
        />
      )}
    </>
  );
}

function RemoveCategoryDialog({
  category,
  destinations,
  productCount,
  onCancel,
  onConfirm,
}: {
  category: Category;
  destinations: Category[];
  productCount: number;
  onCancel: () => void;
  onConfirm: (moveTo?: string) => void;
}) {
  const { lang, t } = useAdminLanguage();
  const titleId = useId();
  const textId = useId();
  const selectId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const [moveTo, setMoveTo] = useState("");
  const [localError, setLocalError] = useState("");
  const name = displayName(category, lang);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    root
      ?.querySelector<HTMLElement>("select, button")
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onCancel]);

  const confirm = () => {
    if (productCount > 0 && !moveTo) {
      setLocalError(t("categories.needMove"));
      return;
    }
    onConfirm(moveTo || undefined);
  };

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-4">
      <button
        type="button"
        aria-label={t("categories.cancel")}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[#27110d]/65 backdrop-blur-sm"
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className="relative z-10 w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-black/10 sm:p-8"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("categories.cancel")}
          className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[#f3e6d4] text-[#4a2218]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <h2
          id={titleId}
          className="pe-10 font-display text-2xl font-semibold text-[#4a2218]"
        >
          {t("categories.removeTitle", { name })}
        </h2>
        <p id={textId} className="mt-2 text-sm leading-6 text-[#4a2218]/65">
          {productCount === 0
            ? t("categories.removeEmpty")
            : t("categories.removeWithItems", { count: productCount })}
        </p>
        {productCount > 0 && (
          <label
            htmlFor={selectId}
            className="mt-4 block text-sm font-semibold text-[#4a2218]"
          >
            {t("categories.moveTo")}
            <select
              id={selectId}
              value={moveTo}
              onChange={(e) => {
                setMoveTo(e.target.value);
                setLocalError("");
              }}
              className="mt-2 min-h-12 w-full rounded-xl border-2 border-[#964534]/15 bg-[#f3e6d4]/40 px-3 text-base outline-none focus:border-[#964534]"
            >
              <option value="">{t("categories.movePlaceholder")}</option>
              {destinations.map((option) => (
                <option key={option.id} value={option.id}>
                  {displayName(option, lang)}
                </option>
              ))}
            </select>
          </label>
        )}
        {localError && (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#a5372f]">
            {localError}
          </p>
        )}
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-xl bg-[#f3e6d4] px-4 py-3 text-sm font-bold text-[#4a2218]"
          >
            {t("categories.cancel")}
          </button>
          <button
            type="button"
            onClick={confirm}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a5372f] px-4 py-3 text-sm font-bold text-white"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t("categories.confirmRemove")}
          </button>
        </div>
      </section>
    </div>
  );
}
