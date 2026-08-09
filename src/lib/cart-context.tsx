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
import type { CartLine, Fulfillment } from "./types";
import { DELIVERY_FEE, DISCOUNT_CODES, getProduct, boxLinePrice } from "./data";

// v2: the menu moved from the demo flavors to the real catalogue, so any
// v1 cart holds product ids that no longer exist.
const STORAGE_KEY = "cookies-and-more-cart-v2";

interface StoredState {
  lines: CartLine[];
  fulfillment: Fulfillment;
  discountCode: string | null;
}

export type DiscountResult =
  | { ok: true; reason: "applied"; pct: number }
  | { ok: false; reason: "empty" | "invalid" };

export interface CartTotals {
  count: number;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
}

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  isHydrated: boolean;
  fulfillment: Fulfillment;
  discountCode: string | null;
  totals: CartTotals;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, qty?: number) => void;
  addBox: (boxId: string, contents: Record<string, number>) => void;
  setLineQty: (id: string, qty: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  setFulfillment: (f: Fulfillment) => void;
  /**
   * Returns a result the caller renders — the copy lives in the UI layer so
   * it can be translated, rather than being baked in here in English.
   */
  applyDiscount: (code: string) => DiscountResult;
  clearDiscount: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Drops anything that no longer resolves against the menu, so a stale or
 * hand-edited localStorage entry can't take the whole cart down.
 */
function pruneLines(lines: CartLine[]): CartLine[] {
  return lines.filter((line) => {
    if (!line || typeof line !== "object") return false;
    if (line.kind === "item") return Boolean(getProduct(line.productId));
    if (line.kind === "box") {
      // Only fill-your-own boxes belong in box lines; ready-made boxes are items.
      const box = getProduct(line.boxId);
      return Boolean(box?.fillable);
    }
    return false;
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [fulfillment, setFulfillmentState] = useState<Fulfillment>("delivery");
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  // Hydrate from localStorage after mount. Deferred to a microtask so the
  // initial committed render matches the server (empty cart), avoiding a
  // hydration mismatch; consumers gate on `isHydrated`.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StoredState>;
          if (Array.isArray(parsed.lines)) setLines(pruneLines(parsed.lines));
          if (
            parsed.fulfillment === "delivery" ||
            parsed.fulfillment === "pickup"
          )
            setFulfillmentState(parsed.fulfillment);
          if (typeof parsed.discountCode === "string")
            setDiscountCode(parsed.discountCode);
        }
      } catch {
        // Corrupt storage — start fresh, no crash.
      }
      setIsHydrated(true);
    });
  }, []);

  // Persist whenever state changes (after hydration).
  useEffect(() => {
    if (!isHydrated) return;
    const payload: StoredState = { lines, fulfillment, discountCode };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage full or unavailable — non-fatal.
    }
  }, [lines, fulfillment, discountCode, isHydrated]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    const root = document.documentElement;
    if (isOpen) root.classList.add("no-scroll");
    else root.classList.remove("no-scroll");
    return () => root.classList.remove("no-scroll");
  }, [isOpen]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((productId: string, qty = 1) => {
    if (!getProduct(productId)) return;
    setLines((prev) => {
      const existing = prev.find(
        (l) => l.kind === "item" && l.productId === productId,
      );
      if (existing && existing.kind === "item") {
        return prev.map((l) =>
          l.id === existing.id ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { kind: "item", id: makeId(), productId, qty }];
    });
    // The drawer deliberately does NOT open here — adding shouldn't interrupt
    // browsing. It opens only when the customer taps the bag.
  }, []);

  const addBox = useCallback(
    (boxId: string, contents: Record<string, number>) => {
      if (!getProduct(boxId)) return;
      setLines((prev) => [
        ...prev,
        { kind: "box", id: makeId(), boxId, contents, qty: 1 },
      ]);
    },
    [],
  );

  const setLineQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
    setDiscountCode(null);
  }, []);

  const setFulfillment = useCallback((f: Fulfillment) => {
    setFulfillmentState(f);
  }, []);

  const applyDiscount = useCallback((code: string): DiscountResult => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { ok: false, reason: "empty" };
    if (normalized in DISCOUNT_CODES) {
      setDiscountCode(normalized);
      return {
        ok: true,
        reason: "applied",
        pct: Math.round(DISCOUNT_CODES[normalized] * 100),
      };
    }
    return { ok: false, reason: "invalid" };
  }, []);

  const clearDiscount = useCallback(() => setDiscountCode(null), []);

  const totals = useMemo<CartTotals>(() => {
    let count = 0;
    let subtotal = 0;
    for (const line of lines) {
      if (line.kind === "item") {
        const product = getProduct(line.productId);
        if (!product) continue;
        count += line.qty;
        subtotal += product.price * line.qty;
        continue;
      }
      if (!getProduct(line.boxId)) continue;
      count += line.qty;
      subtotal += boxLinePrice(line.boxId, line.contents) * line.qty;
    }
    const rate = discountCode ? DISCOUNT_CODES[discountCode] ?? 0 : 0;
    const discountAmount = subtotal * rate;
    const deliveryFee =
      fulfillment === "delivery" && subtotal > 0 ? DELIVERY_FEE : 0;
    const total = Math.max(0, subtotal - discountAmount) + deliveryFee;
    return { count, subtotal, discountAmount, deliveryFee, total };
  }, [lines, discountCode, fulfillment]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      isOpen,
      isHydrated,
      fulfillment,
      discountCode,
      totals,
      openCart,
      closeCart,
      addItem,
      addBox,
      setLineQty,
      removeLine,
      clearCart,
      setFulfillment,
      applyDiscount,
      clearDiscount,
    }),
    [
      lines,
      isOpen,
      isHydrated,
      fulfillment,
      discountCode,
      totals,
      openCart,
      closeCart,
      addItem,
      addBox,
      setLineQty,
      removeLine,
      clearCart,
      setFulfillment,
      applyDiscount,
      clearDiscount,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
