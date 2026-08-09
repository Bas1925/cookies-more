import type { Catalog, Category, CategoryId, Product } from "./types";
import seed from "../../data/catalog.json";

const BOX_EXCLUDED_COOKIE_IDS = new Set([
  "cookie-bites",
  "cookie-mini",
  "cookie-mini-8",
]);

let categories: Category[] = seed.categories as Category[];
let products: Product[] = seed.products as Product[];

export function getCatalogSnapshot(): Catalog {
  return { categories, products };
}

export function setCatalogSnapshot(next: Catalog) {
  categories = next.categories;
  products = next.products;
}

export function getCategories(opts?: { includeHidden?: boolean }): Category[] {
  if (opts?.includeHidden) return categories;
  return categories.filter((c) => !c.hidden);
}

export function getProducts(opts?: { includeHidden?: boolean }): Product[] {
  if (opts?.includeHidden) return products;
  return products.filter((p) => !p.hidden);
}

export function getCategory(id: CategoryId): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function shopProducts(): Product[] {
  return getProducts().filter((p) => !p.fillable);
}

export function productsInCategory(category: CategoryId): Product[] {
  return shopProducts().filter((p) => p.category === category);
}

export function getBoxes(): Product[] {
  return getProducts().filter((p) => p.fillable);
}

export function getBoxFillings(): Product[] {
  return getProducts().filter(
    (p) =>
      p.category === "cookies" &&
      !p.hidden &&
      !p.fillable &&
      !BOX_EXCLUDED_COOKIE_IDS.has(p.id),
  );
}

export function boxCapacity(boxId: string): number {
  return getProduct(boxId)?.slots ?? 6;
}

export function boxExtrasTotal(contents: Record<string, number>): number {
  let extra = 0;
  for (const [id, n] of Object.entries(contents)) {
    if (n <= 0) continue;
    const product = getProduct(id);
    if (product?.boxExtra) extra += product.boxExtra * n;
  }
  return extra;
}

export function boxLinePrice(
  boxId: string,
  contents: Record<string, number>,
): number {
  const box = getProduct(boxId);
  if (!box) return 0;
  return box.price + boxExtrasTotal(contents);
}

/** Seed snapshot used for SSR / first paint before the live API refresh. */
export const SEED_CATALOG: Catalog = {
  categories: seed.categories as Category[],
  products: seed.products as Product[],
};
