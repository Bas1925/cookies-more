import "server-only";

import webpush from "web-push";
import { deletePushSubscription, listPushSubscriptions } from "./push-subs";
import { formatPrice } from "./data";
import type { Order } from "./types";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const subject = process.env.VAPID_SUBJECT || "mailto:admin@cookiesandmore.local";

let configured = false;
if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch (error) {
    // A malformed key pair must not take checkout down with it.
    console.error("Invalid VAPID configuration — push disabled.", error);
  }
}

/** False when the VAPID env vars are missing, e.g. a fresh local checkout. */
export function isPushConfigured() {
  return configured;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Fan a payload out to every registered admin device. Failures are swallowed
 * per-subscription: one dead phone must not stop the others from ringing.
 */
async function broadcast(payload: PushPayload) {
  const subscriptions = await listPushSubscriptions();
  if (subscriptions.length === 0) return { sent: 0, removed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          body,
          { TTL: 60 * 60 * 12 },
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410 mean the browser threw the subscription away — drop ours too
        // so the list does not grow stale endpoints forever.
        if (status === 404 || status === 410) {
          await deletePushSubscription(subscription.endpoint).catch(() => {});
          removed += 1;
        } else {
          console.error("Push delivery failed", status, error);
        }
      }
    }),
  );

  return { sent, removed };
}

export async function sendOrderPush(order: Order) {
  if (!configured) return { sent: 0, removed: 0 };

  const customer = order.customerName?.trim() || "New customer";
  const itemCount = order.lines.reduce((sum, line) => sum + line.qty, 0);
  const kind = order.fulfillment === "pickup" ? "Pickup" : "Delivery";

  return broadcast({
    title: `New order · ${formatPrice(order.total)}`,
    body: `${customer} — ${itemCount} item${itemCount === 1 ? "" : "s"} · ${kind}`,
    url: "/admin/orders",
    tag: order.id,
  });
}

export async function sendTestPush() {
  if (!configured) return { sent: 0, removed: 0 };

  return broadcast({
    title: "Notifications are working 🍪",
    body: "This is how a new order will look.",
    url: "/admin/orders",
    tag: `test-${Date.now()}`,
  });
}
