"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Catalog, Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { useAdminLanguage } from "@/lib/admin-language-context";

export default function AdminProductsPage() {
  const { lang, t } = useAdminLanguage();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
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

  const products = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    return catalog.products.filter((p) => {
      if (filter !== "all" && p.category !== filter) return false;
      if (!q) return true;
      // Match any language plus the id, so the shop's Arabic/Hebrew names
      // are searchable too — not just the English ones.
      return [p.name.en, p.name.ar, p.name.he, p.id]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(q));
    });
  }, [catalog, filter, query]);

  if (!catalog) {
    return <p className="text-[#4a2218]/65">{error || t("common.loading")}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("products.title")}</h1>
          <p className="mt-1 text-[#4a2218]/65">
            {t("products.subtitle")}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center rounded-full bg-[#964534] px-5 py-2.5 text-sm font-semibold text-[#f3e6d4]"
        >
          {t("products.new")}
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-[#964534]">
          {error}
        </p>
      )}

      <label className="block">
        <span className="text-sm font-semibold">{t("products.search")}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("products.searchPlaceholder")}
          className="mt-1 min-h-12 w-full rounded-xl border-2 border-[#964534]/15 bg-white px-4 outline-none focus:border-[#964534]"
        />
      </label>

      <div
        role="group"
        aria-label={t("products.filter")}
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={t("products.all")}
        />
        {catalog.categories.map((c) => (
          <FilterChip
            key={c.id}
            active={filter === c.id}
            onClick={() => setFilter(c.id)}
            label={c.name[lang] || c.name.en}
          />
        ))}
      </div>

      <p role="status" className="text-sm text-[#4a2218]/60">
        {t("products.count", {
          shown: products.length,
          total: catalog.products.length,
        })}
      </p>

      {products.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-center text-[#4a2218]/65 ring-1 ring-[#964534]/10">
          {t("products.none")}
        </p>
      ) : (
        <ul className="space-y-2" aria-label={t("products.list")}>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ${
        active
          ? "bg-[#964534] text-[#f3e6d4]"
          : "bg-white text-[#4a2218] ring-1 ring-[#964534]/15"
      }`}
    >
      {label}
    </button>
  );
}

function ProductRow({ product }: { product: Product }) {
  const { lang, t } = useAdminLanguage();
  const productName = product.name[lang] || product.name.en || product.id;
  const label = `${productName}, ${formatPrice(product.price)}`;
  return (
    <li>
      <Link
        href={`/admin/products/${product.id}`}
        aria-label={t("products.edit", { label })}
        className="flex min-h-16 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#964534]/10 transition-colors hover:bg-[#fffaf2]"
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
            style={{ background: product.accent }}
            aria-hidden="true"
          >
            —
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{productName}</p>
          <p className="text-xs text-[#4a2218]/55">
            {product.category}
            {product.fillable ? ` · ${t("products.buildBox")}` : ""}
            {product.hidden ? ` · ${t("products.hidden")}` : ""}
          </p>
        </div>
        <p className="shrink-0 font-display text-lg font-semibold text-[#964534]">
          {formatPrice(product.price)}
        </p>
      </Link>
    </li>
  );
}
