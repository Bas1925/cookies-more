"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Catalog, Category, CategoryId, Product } from "./types";
import {
  getBoxes,
  getBoxFillings,
  getReadyBoxFillings,
  getCategories,
  getProduct,
  productsInCategory,
  SEED_CATALOG,
  setCatalogSnapshot,
  shopProducts,
} from "./catalog-store";

interface CatalogContextValue {
  categories: Category[];
  products: Product[];
  boxes: Product[];
  boxFillings: Product[];
  readyBoxFillings: Product[];
  ready: boolean;
  refresh: () => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  shopProducts: () => Product[];
  productsInCategory: (id: CategoryId) => Product[];
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  // Always start from the static seed so SSR HTML matches the client's first
  // paint. Live data is loaded after mount via /api/catalog (the server
  // in-memory snapshot can already differ from the seed after admin edits).
  const [catalog, setCatalog] = useState<Catalog>(() => ({
    categories: SEED_CATALOG.categories,
    products: SEED_CATALOG.products,
  }));
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  const apply = useCallback((next: Catalog) => {
    setCatalogSnapshot(next);
    setCatalog(next);
    setTick((n) => n + 1);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Catalog;
      apply(data);
    } finally {
      setReady(true);
    }
  }, [apply]);

  useEffect(() => {
    void refresh();
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const value = useMemo<CatalogContextValue>(() => {
    void tick;
    return {
      categories: getCategories(),
      products: catalog.products,
      boxes: getBoxes(),
      boxFillings: getBoxFillings(),
      readyBoxFillings: getReadyBoxFillings(),
      ready,
      refresh,
      getProduct,
      shopProducts,
      productsInCategory,
    };
  }, [catalog, ready, refresh, tick]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
