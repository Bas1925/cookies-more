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

export async function readOrdersFile(): Promise<OrdersFile> {
  const store = tryGetStore(STORE_NAME);
  if (!store) return readOrdersFromDisk();

  const { blobs } = await store.list();
  const loaded = await Promise.all(
    blobs.map((blob) =>
      store.get(blob.key, { type: "json" }).catch(() => null),
    ),
  );
  return { orders: newestFirst(loaded.filter(isOrder).map(withStatus)) };
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
