import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { tryGetStore } from "./blob-store";
import type { PushSubscriptionRecord } from "./types";

const SUBS_PATH = path.join(process.cwd(), "data", "push-subscriptions.json");
const STORE_NAME = "push-subscriptions";

/**
 * Push endpoints are long URLs, so they cannot be blob keys directly. The
 * digest is stable, which is what makes re-subscribing the same device an
 * overwrite instead of a duplicate notification.
 */
function keyFor(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex");
}

function isSubscription(item: unknown): item is PushSubscriptionRecord {
  if (!item || typeof item !== "object") return false;
  const sub = item as PushSubscriptionRecord;
  return (
    typeof sub.endpoint === "string" &&
    sub.endpoint.startsWith("https://") &&
    Boolean(sub.keys) &&
    typeof sub.keys.p256dh === "string" &&
    typeof sub.keys.auth === "string"
  );
}

/** Accepts the raw `PushSubscription.toJSON()` shape sent by the browser. */
export function normalizeSubscription(raw: unknown): PushSubscriptionRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const keys = (input.keys ?? {}) as Record<string, unknown>;
  const candidate = {
    endpoint: typeof input.endpoint === "string" ? input.endpoint : "",
    expirationTime:
      typeof input.expirationTime === "number" ? input.expirationTime : null,
    keys: {
      p256dh: typeof keys.p256dh === "string" ? keys.p256dh : "",
      auth: typeof keys.auth === "string" ? keys.auth : "",
    },
    createdAt: new Date().toISOString(),
  };
  return isSubscription(candidate) ? candidate : null;
}

/* ---------------------------------------------------------------- *
 * Filesystem fallback — local dev only, same split as orders-fs.
 * ---------------------------------------------------------------- */

async function readFromDisk(): Promise<PushSubscriptionRecord[]> {
  try {
    const raw = await fs.readFile(SUBS_PATH, "utf8");
    const parsed = JSON.parse(raw) as { subscriptions?: unknown };
    return Array.isArray(parsed.subscriptions)
      ? parsed.subscriptions.filter(isSubscription)
      : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeToDisk(subscriptions: PushSubscriptionRecord[]) {
  await fs.mkdir(path.dirname(SUBS_PATH), { recursive: true });
  await fs.writeFile(
    SUBS_PATH,
    `${JSON.stringify({ subscriptions }, null, 2)}\n`,
    "utf8",
  );
}

/* ---------------------------------------------------------------- *
 * Public API — blob-backed on Netlify, disk-backed locally.
 * ---------------------------------------------------------------- */

export async function listPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const store = tryGetStore(STORE_NAME);
  if (!store) return readFromDisk();

  const { blobs } = await store.list();
  const loaded = await Promise.all(
    blobs.map((blob) => store.get(blob.key, { type: "json" }).catch(() => null)),
  );
  return loaded.filter(isSubscription);
}

export async function savePushSubscription(
  subscription: PushSubscriptionRecord,
): Promise<void> {
  const store = tryGetStore(STORE_NAME);
  if (!store) {
    const existing = await readFromDisk();
    const others = existing.filter(
      (item) => item.endpoint !== subscription.endpoint,
    );
    await writeToDisk([...others, subscription]);
    return;
  }

  await store.setJSON(keyFor(subscription.endpoint), subscription);
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const store = tryGetStore(STORE_NAME);
  if (!store) {
    const existing = await readFromDisk();
    const remaining = existing.filter((item) => item.endpoint !== endpoint);
    if (remaining.length !== existing.length) await writeToDisk(remaining);
    return;
  }

  await store.delete(keyFor(endpoint));
}
