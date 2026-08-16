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

export function isBoxCategoryAllowed(box: Product, categoryId: string): boolean {
  const list = box.boxAllow?.categories;
  if (list === undefined) return true;
  return list.includes(categoryId);
}

/** Categories the customer can pick from in this box, with the admin max. */
export function readyBoxCategoryRules(box: Product): Array<{
  id: string;
  max: number;
}> {
  const fillings = getReadyBoxFillings(box);
  return getCategories()
    .filter((category) => fillings.some((product) => product.category === category.id))
    .map((category) => ({
      id: category.id,
      max: readyBoxCategoryMax(box, category.id),
    }));
}

/** How many pieces from this category one ready-made box may hold. */
export function readyBoxCategoryMax(box: Product, categoryId: string): number {
  if (!isBoxCategoryAllowed(box, categoryId)) return 0;
  const override = box.boxAllow?.categoryMax?.[categoryId];
  if (typeof override === "number" && override >= 0) {
    return Math.min(99, Math.floor(override));
  }
  return readyBoxPicks(box);
}

/** Whether this product is offered in the box. Quantity is limited by the category. */
export function readyBoxProductMax(box: Product, product: Product): number {
  if (product.boxPick === false) return 0;
  if (box.boxAllow?.productMax?.[product.id] === 0) return 0;
  return readyBoxCategoryMax(box, product.category);
}

/** Everything a ready-made box can hold — the full shop, minus other boxes. */
export function getReadyBoxFillings(box?: Product): Product[] {
  const blockedCategories = new Set(
    categories.filter((category) => category.boxPick === false).map((c) => c.id),
  );
  return shopProducts().filter((p) => {
    if (isReadyMadeBox(p) || p.boxPick === false) return false;
    if (blockedCategories.has(p.category)) return false;
    if (box && !isBoxCategoryAllowed(box, p.category)) return false;
    if (box && readyBoxProductMax(box, p) <= 0) return false;
    return true;
  });
}

export function boxCapacity(boxId: string): number {
  return getProduct(boxId)?.slots ?? 6;
}

const READY_BOX_PICKS: Record<string, number> = {
  "box-small": 3,
  "box-medium": 5,
  "box-large": 7,
};

/** Shop boxes the kitchen packs — not the fill-your-own sizes. */
export function isReadyMadeBox(product: Product | undefined): boolean {
  return Boolean(product && product.category === "boxes" && !product.fillable);
}

/** How many flavors a ready-made box lets the customer check. */
export function readyBoxPicks(product: Product): number {
  if (product.slots && product.slots > 0) return product.slots;
  return READY_BOX_PICKS[product.id] ?? 0;
}

export function isCustomizableReadyBox(product: Product | undefined): boolean {
  return Boolean(product && isReadyMadeBox(product) && readyBoxPicks(product) > 0);
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
  // Ready-made boxes keep the menu price; only fill-your-own adds premiums.
  if (!box.fillable) return box.price;
  return box.price + boxExtrasTotal(contents);
}

/** Seed snapshot used for SSR / first paint before the live API refresh. */
export const SEED_CATALOG: Catalog = {
  categories: seed.categories as Category[],
  products: seed.products as Product[],
};
