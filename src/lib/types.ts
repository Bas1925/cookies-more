export type Lang = "en" | "ar" | "he";

/** A string in every language the site ships. */
export type Localized = Record<Lang, string>;

/** Category ids are free-form strings so the admin can add new ones. */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  /** `ar` is the category exactly as it appears on the store's order page. */
  name: Localized;
  blurb: Localized;
  /** When true, the category is hidden from the public shop. */
  hidden?: boolean;
}

export interface Product {
  id: string;
  category: CategoryId;
  /** `ar` is the item exactly as it appears on the store's order page. */
  name: Localized;
  /** Price in Israeli new shekels (₪). */
  price: number;
  /** Short descriptor shown under the name. */
  tagline?: Localized;
  /** Longer copy — only set where we have something real to say. */
  description?: Localized;
  /** Path to a product photo under /public. Omitted when there is no photo. */
  image?: string;
  /** CSS object-position for cropping the photo. Defaults to "center". */
  objectPosition?: string;
  /** Accent color — themes the fallback tile when there is no photo. */
  accent: string;
  /** How many cookies fit in this box (fillable boxes only). */
  slots?: number;
  /**
   * Extra shekels charged per piece when this cookie is packed into a box
   * (e.g. Dubai / Amsterdam). Ignored for stand-alone item sales.
   */
  boxExtra?: number;
  /**
   * Customer-filled box used only in Build a Box — hidden from the shop
   * menu so ready-made boxes can live there with their own prices.
   */
  fillable?: boolean;
  /** When true, the product is hidden from the public shop. */
  hidden?: boolean;
}

export interface Catalog {
  categories: Category[];
  products: Product[];
}

export type Fulfillment = "delivery" | "pickup";

export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "completed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

/**
 * Cart lines carry plain string ids rather than a union of known products:
 * they are rehydrated from localStorage, where an id can outlive a menu
 * change. Every lookup must tolerate an id that no longer exists.
 */
export type CartLine =
  | { kind: "item"; id: string; productId: string; qty: number }
  | {
      kind: "box";
      id: string;
      boxId: string;
      contents: Record<string, number>;
      qty: number;
    };

export interface ProcessStep {
  id: string;
  title: Localized;
  text: Localized;
}

/** Snapshot of a cart line at checkout time (names/prices freeze for history). */
export interface OrderLine {
  kind: "item" | "box";
  productId: string;
  /** English fallback kept for backwards compatibility with older orders. */
  name: string;
  /** Frozen translated name so order history survives later catalog edits. */
  nameLocalized?: Localized;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  /** Cookie counts inside a fill-your-own box. */
  contents?: Record<string, number>;
  /** Frozen cookie names and quantities selected by the customer. */
  contentDetails?: Array<{
    productId: string;
    name: Localized;
    qty: number;
  }>;
}

export interface Order {
  id: string;
  createdAt: string;
  /** Optional only so orders created before customer details were added still load. */
  customerName?: string;
  phone?: string;
  fulfillment: Fulfillment;
  discountCode: string | null;
  lines: OrderLine[];
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  source: "website";
  status: OrderStatus;
  statusUpdatedAt?: string;
}

export interface OrdersFile {
  orders: Order[];
}

/**
 * A browser push subscription belonging to an admin device. Mirrors the shape
 * of `PushSubscription.toJSON()`, which is what the browser hands us.
 */
export interface PushSubscriptionRecord {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}
