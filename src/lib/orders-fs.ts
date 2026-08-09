import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { isOrderStatus, type Order, type OrdersFile, type OrderStatus } from "./types";

const ORDERS_PATH = path.join(process.cwd(), "data", "orders.json");

function normalizeOrders(raw: unknown): OrdersFile {
  if (!raw || typeof raw !== "object") {
    return { orders: [] };
  }
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.orders)) {
    return { orders: [] };
  }
  const orders = data.orders
    .filter(
      (item): item is Order =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as Order).id === "string" &&
      typeof (item as Order).total === "number",
    )
    .map((order) => ({
      ...order,
      status: isOrderStatus(order.status) ? order.status : "placed",
    }));
  return { orders };
}

export async function readOrdersFile(): Promise<OrdersFile> {
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

export async function writeOrdersFile(file: OrdersFile): Promise<OrdersFile> {
  const normalized = normalizeOrders(file);
  await fs.mkdir(path.dirname(ORDERS_PATH), { recursive: true });
  await fs.writeFile(
    ORDERS_PATH,
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8",
  );
  return normalized;
}

export async function appendOrder(order: Order): Promise<Order> {
  const file = await readOrdersFile();
  file.orders.unshift(order);
  await writeOrdersFile(file);
  return order;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order | null> {
  const file = await readOrdersFile();
  const order = file.orders.find((item) => item.id === orderId);
  if (!order) return null;

  order.status = status;
  order.statusUpdatedAt = new Date().toISOString();
  await writeOrdersFile(file);
  return order;
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  const file = await readOrdersFile();
  const remainingOrders = file.orders.filter((order) => order.id !== orderId);
  if (remainingOrders.length === file.orders.length) return false;

  await writeOrdersFile({ orders: remainingOrders });
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
