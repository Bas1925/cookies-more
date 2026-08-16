import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import type { Catalog, Category, Product, ReadyBoxAllow } from "./types";
import { setCatalogSnapshot } from "./catalog-store";
import { tryGetStore } from "./blob-store";
import seed from "../../data/catalog.json";

const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.json");
const STORE_NAME = "catalog";
const CATALOG_KEY = "catalog";

function normalizeBoxAllow(raw: unknown): ReadyBoxAllow | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as ReadyBoxAllow;
  const hasCategories = Array.isArray(value.categories);
  const categories = hasCategories
    ? value.categories.filter((id): id is string => typeof id === "string" && id.length > 0)
    : undefined;
  const categoryMax: Record<string, number> = {};
  if (value.categoryMax && typeof value.categoryMax === "object") {
    for (const [id, amount] of Object.entries(value.categoryMax)) {
      const n = Math.floor(Number(amount));
      if (id && Number.isFinite(n) && n >= 0) categoryMax[id] = n;
    }
  }
  const productMax: Record<string, number> = {};
  if (value.productMax && typeof value.productMax === "object") {
    for (const [id, amount] of Object.entries(value.productMax)) {
      const n = Math.floor(Number(amount));
      if (id && Number.isFinite(n) && n >= 0) productMax[id] = n;
    }
  }
  const allow: ReadyBoxAllow = {};
  if (hasCategories) allow.categories = categories;
  if (Object.keys(categoryMax).length > 0) allow.categoryMax = categoryMax;
  if (Object.keys(productMax).length > 0) allow.productMax = productMax;
  return Object.keys(allow).length > 0 ? allow : undefined;
}

function isLocalized(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.en === "string" &&
    typeof v.ar === "string" &&
    typeof v.he === "string"
  );
}

function normalizeCatalog(raw: unknown): Catalog {
  if (!raw || typeof raw !== "object") {
    throw new Error("Catalog must be an object");
  }
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.categories) || !Array.isArray(data.products)) {
    throw new Error("Catalog needs categories[] and products[]");
  }

  const categories: Category[] = data.categories.map((item, i) => {
    const c = item as Category;
    if (!c?.id || !isLocalized(c.name) || !isLocalized(c.blurb)) {
      throw new Error(`Invalid category at index ${i}`);
    }
    return {
      id: String(c.id),
      name: c.name,
      blurb: c.blurb,
      hidden: Boolean(c.hidden),
      boxPick: c.boxPick === false ? false : undefined,
    };
  });

  const products: Product[] = data.products.map((item, i) => {
    const p = item as Product;
    if (!p?.id || !p.category || !isLocalized(p.name) || typeof p.price !== "number") {
      throw new Error(`Invalid product at index ${i}`);
    }
    return {
      ...p,
      id: String(p.id),
      category: String(p.category),
      price: Number(p.price),
      accent: p.accent || "#964534",
      hidden: Boolean(p.hidden),
      boxPick: p.boxPick === false ? false : undefined,
      boxAllow: normalizeBoxAllow(p.boxAllow),
      fillable: Boolean(p.fillable) || undefined,
      slots: p.slots ? Number(p.slots) : undefined,
      boxExtra: p.boxExtra ? Number(p.boxExtra) : undefined,
      image: p.image || undefined,
    };
  });

  return { categories, products };
}

export async function readCatalogFile(): Promise<Catalog> {
  const store = tryGetStore(STORE_NAME);

  // Until an admin saves for the first time there is no blob, so fall back to
  // the catalogue committed alongside the code.
  const raw = store
    ? ((await store.get(CATALOG_KEY, { type: "json" })) ?? seed)
    : JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));

  const catalog = normalizeCatalog(raw);
  setCatalogSnapshot(catalog);
  return catalog;
}

export async function writeCatalogFile(catalog: Catalog): Promise<Catalog> {
  const normalized = normalizeCatalog(catalog);
  const store = tryGetStore(STORE_NAME);

  if (store) {
    await store.setJSON(CATALOG_KEY, normalized);
  } else {
    await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true });
    await fs.writeFile(
      CATALOG_PATH,
      `${JSON.stringify(normalized, null, 2)}\n`,
      "utf8",
    );
  }

  setCatalogSnapshot(normalized);
  return normalized;
}
