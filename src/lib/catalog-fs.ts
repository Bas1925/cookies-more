import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import type { Catalog, Category, Product } from "./types";
import { setCatalogSnapshot } from "./catalog-store";

const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.json");

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
      fillable: Boolean(p.fillable) || undefined,
      slots: p.slots ? Number(p.slots) : undefined,
      boxExtra: p.boxExtra ? Number(p.boxExtra) : undefined,
      image: p.image || undefined,
    };
  });

  return { categories, products };
}

export async function readCatalogFile(): Promise<Catalog> {
  const raw = await fs.readFile(CATALOG_PATH, "utf8");
  const catalog = normalizeCatalog(JSON.parse(raw));
  setCatalogSnapshot(catalog);
  return catalog;
}

export async function writeCatalogFile(catalog: Catalog): Promise<Catalog> {
  const normalized = normalizeCatalog(catalog);
  await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true });
  await fs.writeFile(
    CATALOG_PATH,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );
  setCatalogSnapshot(normalized);
  return normalized;
}

export function catalogPath() {
  return CATALOG_PATH;
}
