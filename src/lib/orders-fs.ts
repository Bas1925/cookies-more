import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { tryGetStore } from "./blob-store";
import { isOrderStatus, type Order, type OrdersFile, type OrderStatus } from "./types";

const ORDERS_PATH = path.join(process.cwd(), "data", "orders.json");
const STORE_NAME = "orders";

function isOrder(item: unknown): item is Order {
  return (
    Boolean(item) &&
    typeof item === "object" &&
    typeof (item as Order).id === "string" &&
    typeof (item as Order).total === "number"
  );
}

function withStatus(order: Order): Order {
  return { ...order, status: isOrderStatus(order.status) ? order.status : "placed" };
}

function normalizeOrders(raw: unknown): OrdersFile {
  if (!raw || typeof raw !== "object") {
    return { orders: [] };
  }
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.orders)) {
    return { orders: [] };
  }
  return { orders: data.orders.filter(isOrder).map(withStatus) };
}

function newestFirst(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/* ---------------------------------------------------------------- *
 * Filesystem fallback — local dev only. On Netlify the filesystem is
 * read-only, which is why the blob paths below exist at all.
 * ---------------------------------------------------------------- */

async function readOrdersFromDisk(): Promise<OrdersFile> {
  try {
    const raw = await fs.readFile(ORDERS_PATH, "utf8");
    return normalizeOrders(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { orders: [] };
    }
    throw error;
  }
}

async function writeOrdersToDisk(file: OrdersFile): Promise<OrdersFile> {
  const normalized = normalizeOrders(file);
  await fs.mkdir(path.dirname(ORDERS_PATH), { recursive: true });
  await fs.writeFile(
    ORDERS_PATH,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );
  return normalized;
}

/* ---------------------------------------------------------------- *
 * Public API — blob-backed on Netlify, disk-backed locally.
 *
 * Each order is its own blob keyed by order id. Storing them in one
 * shared JSON document would mean read-modify-write on every checkout,
 * so two customers ordering at the same moment would silently drop one
 * of the orders.
 * ---------------------------------------------------------------- */

/**
 * Blob reads in flight at once. Firing one request per order all together
 * worked with a handful of orders, but a few hundred at once is what gets
 * throttled and pushes the page past Netlify's function time limit.
 */
const READ_CONCURRENCY = 16;

async function loadOrders(keys: string[]): Promise<Order[]> {
  const store = tryGetStore(STORE_NAME);
  if (!store) return [];
  const loaded: unknown[] = [];
  for (let i = 0; i < keys.length; i += READ_CONCURRENCY) {
    const batch = keys.slice(i, i + READ_CONCURRENCY);
    loaded.push(
      ...(await Promise.all(
        batch.map((key) => store.get(key, { type: "json" }).catch(() => null)),
      )),
    );
  }
  return newestFirst(loaded.filter(isOrder).map(withStatus));
}

export async function readOrdersFile(): Promise<OrdersFile> {
  const store = tryGetStore(STORE_NAME);
  if (!store) return readOrdersFromDisk();

  const { blobs } = await store.list();
  return { orders: await loadOrders(blobs.map((blob) => blob.key)) };
}

/** Order ids are `ord_<base36 ms>_<hex>`, so the key alone dates the order. */
function orderTimeFromKey(key: string): number | null {
  const match = /^ord_([0-9a-z]+)_/.exec(key);
  if (!match) return null;
  const ms = parseInt(match[1], 36);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Orders placed in the last `withinMs`. The admin's new-order check runs every
 * few seconds forever, so it lists keys (one request) and downloads only the
 * recent few, instead of every order the shop has ever taken.
 */
export async function readRecentOrders(withinMs: number): Promise<Order[]> {
  const store = tryGetStore(STORE_NAME);
  const since = Date.now() - withinMs;
  if (!store) {
    const file = await readOrdersFromDisk();
    return file.orders.filter((o) => new Date(o.createdAt).getTime() >= since);
  }

  const { blobs } = await store.list();
  const recent = blobs
    .map((blob) => blob.key)
    .filter((key) => (orderTimeFromKey(key) ?? 0) >= since);
  return loadOrders(recent);
}

/* ---------------------------------------------------------------- *
 * Checkout keys — so a customer who retries after a network error
 * does not place the same order twice. The browser sends one key per
 * attempt; the first order saved under it is returned on any repeat.
 * ---------------------------------------------------------------- */

const CHECKOUTS_STORE = "checkouts";

export async function findOrderByCheckoutKey(key: string): Promise<Order | null> {
  const checkouts = tryGetStore(CHECKOUTS_STORE);
  const store = tryGetStore(STORE_NAME);
  if (!checkouts || !store) return null;
  const record = (await checkouts.get(key, { type: "json" })) as
    | { orderId?: string }
    | null;
  if (!record?.orderId) return null;
  const order = await store.get(record.orderId, { type: "json" });
  return isOrder(order) ? withStatus(order) : null;
}

export async function rememberCheckoutKey(key: string, orderId: string) {
  const checkouts = tryGetStore(CHECKOUTS_STORE);
  if (!checkouts) return;
  await checkouts.setJSON(key, { orderId, at: new Date().toISOString() });
}

export async function appendOrder(order: Order): Promise<Order> {
  const store = tryGetStore(STORE_NAME);
  if (!store) {
    const file = await readOrdersFromDisk();
    file.orders.unshift(order);
    await writeOrdersToDisk(file);
    return order;
  }

  await store.setJSON(order.id, order);
  return order;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order | null> {
  const store = tryGetStore(STORE_NAME);
  if (!store) {
    const file = await readOrdersFromDisk();
    const order = file.orders.find((item) => item.id === orderId);
    if (!order) return null;
    order.status = status;
    order.statusUpdatedAt = new Date().toISOString();
    await writeOrdersToDisk(file);
    return order;
  }

  const existing = await store.get(orderId, { type: "json" });
  if (!isOrder(existing)) return null;

  const order: Order = {
    ...withStatus(existing),
    status,
    statusUpdatedAt: new Date().toISOString(),
  };
  await store.setJSON(orderId, order);
  return order;
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  const store = tryGetStore(STORE_NAME);
  if (!store) {
    const file = await readOrdersFromDisk();
    const remaining = file.orders.filter((order) => order.id !== orderId);
    if (remaining.length === file.orders.length) return false;
    await writeOrdersToDisk({ orders: remaining });
    return true;
  }

  const existing = await store.get(orderId, { type: "json" });
  if (!isOrder(existing)) return false;
  await store.delete(orderId);
  return true;
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun
  const diff = day === 0 ? 6 : day - 1; // Monday start
  x.setDate(x.getDate() - diff);
  return x;
}

export function summarizeOrders(orders: Order[]) {
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const weekStart = startOfWeek(now).getTime();

  let allTime = 0;
  let today = 0;
  let week = 0;
  let todayCount = 0;
  let weekCount = 0;

  for (const order of orders) {
    const t = new Date(order.createdAt).getTime();
    allTime += order.total;
    if (t >= weekStart) {
      week += order.total;
      weekCount += 1;
    }
    if (t >= todayStart) {
      today += order.total;
      todayCount += 1;
    }
  }

  return {
    orderCount: orders.length,
    revenueAll: allTime,
    revenueToday: today,
    revenueWeek: week,
    ordersToday: todayCount,
    ordersWeek: weekCount,
    averageOrder: orders.length ? allTime / orders.length : 0,
  };
}
