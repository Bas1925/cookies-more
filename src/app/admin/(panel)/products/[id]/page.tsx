"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";
import LocalizedFields, {
  emptyLocalized,
} from "@/components/admin/LocalizedFields";
import type { Catalog, Localized, Product } from "@/lib/types";
import { useAdminLanguage } from "@/lib/admin-language-context";

function blankProduct(id: string): Product {
  return {
    id,
    category: "cookies",
    name: emptyLocalized(),
    price: 0,
    accent: "#964534",
    tagline: emptyLocalized(),
  };
}

export default function AdminProductEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { lang, t } = useAdminLanguage();
  const isNew = params.id === "new";

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
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
      if (isNew) {
        setProduct(blankProduct(`item-${Date.now().toString(36)}`));
      } else {
        const found = data.products.find((p) => p.id === params.id);
        if (!found) {
          setError(t("editor.notFound"));
          return;
        }
        setProduct({
          ...found,
          tagline: found.tagline ?? emptyLocalized(),
          description: found.description ?? emptyLocalized(),
        });
      }
    })();
  }, [isNew, params.id, t]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!catalog || !product) return;
    setStatus(t("common.saving"));
    setError("");

    const cleaned: Product = {
      ...product,
      price: Number(product.price) || 0,
      tagline: hasAnyText(product.tagline) ? product.tagline : undefined,
      description: hasAnyText(product.description)
        ? product.description
        : undefined,
      fillable: product.fillable || undefined,
      slots: product.fillable ? Number(product.slots) || 6 : undefined,
      boxExtra: product.boxExtra ? Number(product.boxExtra) : undefined,
      hidden: product.hidden || undefined,
    };

    const products = isNew
      ? [...catalog.products, cleaned]
      : catalog.products.map((p) => (p.id === cleaned.id ? cleaned : p));

    const res = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...catalog, products }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || t("common.saveFailed"));
      setStatus("");
      return;
    }

    setStatus(t("common.saved"));
    // Clear it so a stale "Saved" doesn't linger while you keep editing.
    window.setTimeout(() => setStatus(""), 2500);
    if (isNew) {
      router.replace(`/admin/products/${cleaned.id}`);
    }
    router.refresh();
  };

  const remove = async () => {
    if (!catalog || !product || isNew) return;
    const productName = product.name[lang] || product.name.en || product.id;
    if (!confirm(t("editor.deleteConfirm", { name: productName }))) return;
    const products = catalog.products.filter((p) => p.id !== product.id);
    const res = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...catalog, products }),
    });
    if (!res.ok) {
      setError(t("editor.deleteFailed"));
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  if (!product || !catalog) {
    return <p className="text-[#4a2218]/65">{error || t("common.loading")}</p>;
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-6 pb-24 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[#964534]"
          >
            {t("editor.back")}
          </Link>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {isNew
              ? t("editor.new")
              : product.name[lang] || product.name.en || product.id}
          </h1>
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          {!isNew && (
            <button
              type="button"
              onClick={() => void remove()}
              className="inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#964534] ring-1 ring-[#964534]/25"
            >
              {t("common.delete")}
            </button>
          )}
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full bg-[#964534] px-5 py-2.5 text-sm font-semibold text-[#f3e6d4]"
          >
            {t("common.save")}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/10">
          <label className="block text-sm font-semibold">
            {t("editor.productId")}
            <input
              value={product.id}
              disabled={!isNew}
              onChange={(e) =>
                setProduct({
                  ...product,
                  id: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-"),
                })
              }
              className="mt-1 w-full rounded-xl border-2 border-[#964534]/15 px-3 py-2 text-sm outline-none focus:border-[#964534] disabled:bg-[#f3e6d4]"
              required
            />
          </label>

          <LocalizedFields
            label={t("common.name")}
            value={product.name}
            onChange={(name) => setProduct({ ...product, name })}
          />
          <LocalizedFields
            label={t("common.tagline")}
            value={product.tagline ?? emptyLocalized()}
            onChange={(tagline) => setProduct({ ...product, tagline })}
          />
          <LocalizedFields
            label={t("common.description")}
            value={product.description ?? emptyLocalized()}
            onChange={(description) => setProduct({ ...product, description })}
            multiline
          />
        </div>

        <div className="space-y-5">
          <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/10">
            <label className="block text-sm font-semibold">
              {t("common.category")}
              <select
                value={product.category}
                onChange={(e) =>
                  setProduct({ ...product, category: e.target.value })
                }
                className="mt-1 w-full rounded-xl border-2 border-[#964534]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#964534]"
              >
                {catalog.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[lang] || c.name.en}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold">
              {t("common.price")}
              <input
                type="number"
                min={0}
                step={1}
                value={product.price}
                onChange={(e) =>
                  setProduct({ ...product, price: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-xl border-2 border-[#964534]/15 px-3 py-2 text-sm outline-none focus:border-[#964534]"
                required
              />
            </label>

            <label className="block text-sm font-semibold">
              {t("editor.accent")}
              <input
                type="color"
                value={product.accent || "#964534"}
                onChange={(e) =>
                  setProduct({ ...product, accent: e.target.value })
                }
                className="mt-1 h-10 w-full cursor-pointer rounded-xl border-2 border-[#964534]/15 bg-white"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={Boolean(product.hidden)}
                onChange={(e) =>
                  setProduct({ ...product, hidden: e.target.checked })
                }
              />
              {t("editor.hidden")}
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={Boolean(product.fillable)}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    fillable: e.target.checked,
                    slots: e.target.checked ? product.slots || 6 : undefined,
                  })
                }
              />
              {t("editor.fillable")}
            </label>

            {product.fillable && (
              <label className="block text-sm font-semibold">
                {t("editor.slots")}
                <input
                  type="number"
                  min={1}
                  value={product.slots ?? 6}
                  onChange={(e) =>
                    setProduct({ ...product, slots: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-xl border-2 border-[#964534]/15 px-3 py-2 text-sm outline-none focus:border-[#964534]"
                />
              </label>
            )}

            <label className="block text-sm font-semibold">
              {t("editor.surcharge")}
              <input
                type="number"
                min={0}
                step={1}
                value={product.boxExtra ?? 0}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    boxExtra: Number(e.target.value) || undefined,
                  })
                }
                className="mt-1 w-full rounded-xl border-2 border-[#964534]/15 px-3 py-2 text-sm outline-none focus:border-[#964534]"
              />
            </label>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/10">
            <ImageUpload
              value={product.image}
              onChange={(image) => setProduct({ ...product, image })}
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#964534]/15 bg-[#f3e6d4]/95 px-4 py-3 backdrop-blur md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={() => void remove()}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-[#964534] ring-1 ring-[#964534]/25"
            >
              {t("common.delete")}
            </button>
          )}
          <button
            type="submit"
            className="inline-flex min-h-12 flex-[2] items-center justify-center rounded-full bg-[#964534] px-5 text-sm font-semibold text-[#f3e6d4]"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </form>
  );
}

function hasAnyText(value?: Localized) {
  if (!value) return false;
  return Boolean(value.en || value.ar || value.he);
}
