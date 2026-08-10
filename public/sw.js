/* Service worker for admin order notifications.
 *
 * iOS only ever shows a web notification from here — the page-level
 * `new Notification()` constructor does not exist on iPhone, which is why
 * every alert has to go through `registration.showNotification()`.
 */

const ORDERS_URL = "/admin/orders";

// Take over as soon as a new worker is deployed, so a stale copy never keeps
// handling pushes after the notification payload shape changes.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }

  // The subscription is `userVisibleOnly`, so a push that shows nothing risks
  // the browser revoking it. Always fall back to a generic title.
  const title = payload.title || "New order";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon.png",
    tag: payload.tag || "new-order",
    renotify: Boolean(payload.tag),
    vibrate: [180, 80, 180],
    data: { url: payload.url || ORDERS_URL },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || ORDERS_URL;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          // Reuse the installed admin app if it is already running rather than
          // stacking up windows every time an order lands.
          if (new URL(client.url).pathname.startsWith("/admin") && "focus" in client) {
            client.navigate(target).catch(() => {});
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
