"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, BellRing, Check, Send, Share, X } from "lucide-react";
import { formatPrice } from "@/lib/data";
import { useAdminLanguage } from "@/lib/admin-language-context";
import type { Order } from "@/lib/types";

interface OrderAlert {
  order: Order;
  count: number;
}

/**
 * `checking` until the browser has been probed. `needs-install` is the iPhone
 * case: Safari tabs have no Notification API at all, so the only fix is to add
 * the admin to the Home Screen and enable alerts from there.
 */
type Support = "checking" | "ready" | "needs-install" | "unsupported";
type Status = "off" | "on" | "blocked";
type Busy = "idle" | "working" | "sent" | "failed" | "server-off";

/** VAPID keys travel as base64url; `pushManager` wants raw bytes. */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports itself as a Mac, but it still has a touch screen.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's own flag — it predates display-mode and is still the reliable
    // signal for a Home Screen web app on iOS.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function NewOrderNotifier() {
  const router = useRouter();
  const { t } = useAdminLanguage();
  const seenOrderIds = useRef<Set<string> | null>(null);
  const checking = useRef(false);

  const [alert, setAlert] = useState<OrderAlert | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [support, setSupport] = useState<Support>("checking");
  const [status, setStatus] = useState<Status>("off");
  const [busy, setBusy] = useState<Busy>("idle");

  const openOrders = useCallback(() => {
    setAlert(null);
    setPanelOpen(false);
    setUnreadCount(0);
    router.push("/admin/orders");
    router.refresh();
  }, [router]);

  /** Push the current browser subscription up to the server. */
  const syncSubscription = useCallback(async (subscription: PushSubscription) => {
    const response = await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    return response.ok;
  }, []);

  // Probe the browser, register the worker, and re-sync an existing
  // subscription so a server that lost its copy starts ringing again.
  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      const hasApis =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!hasApis) {
        if (!cancelled) {
          setSupport(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        }
        return;
      }

      if (isIos() && !isStandalone()) {
        if (!cancelled) setSupport("needs-install");
        return;
      }

      if (!cancelled) setSupport("ready");

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (Notification.permission === "denied") {
          if (!cancelled) setStatus("blocked");
          return;
        }
        if (Notification.permission !== "granted") {
          if (!cancelled) setStatus("off");
          return;
        }

        const existing = await registration.pushManager.getSubscription();
        if (!existing) {
          if (!cancelled) setStatus("off");
          return;
        }
        const ok = await syncSubscription(existing);
        if (!cancelled) setStatus(ok ? "on" : "off");
      } catch (error) {
        console.error("Could not set up order alerts", error);
        if (!cancelled) setSupport("unsupported");
      }
    };

    void setup();
    return () => {
      cancelled = true;
    };
  }, [syncSubscription]);

  const enableAlerts = async () => {
    setBusy("working");
    try {
      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      if (permission === "denied") {
        setStatus("blocked");
        setBusy("idle");
        return;
      }
      if (permission !== "granted") {
        setBusy("idle");
        return;
      }

      const config = await fetch("/api/admin/push", { cache: "no-store" });
      const { configured, publicKey } = (await config.json()) as {
        configured?: boolean;
        publicKey?: string;
      };
      if (!configured || !publicKey) {
        setBusy("server-off");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const ok = await syncSubscription(subscription);
      setStatus(ok ? "on" : "off");
      setBusy(ok ? "idle" : "failed");
    } catch (error) {
      console.error("Could not enable order alerts", error);
      setBusy("failed");
    }
  };

  const disableAlerts = async () => {
    setBusy("working");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/admin/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
      setBusy("idle");
    } catch (error) {
      console.error("Could not turn off order alerts", error);
      setBusy("failed");
    }
  };

  const sendTest = async () => {
    setBusy("working");
    try {
      const response = await fetch("/api/admin/push/test", { method: "POST" });
      setBusy(response.ok ? "sent" : "failed");
    } catch {
      setBusy("failed");
    }
  };

  const checkForOrders = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const data = (await response.json()) as { orders?: Order[] };
      const orders = Array.isArray(data.orders) ? data.orders : [];

      if (seenOrderIds.current === null) {
        seenOrderIds.current = new Set(orders.map((order) => order.id));
        return;
      }

      const newOrders = orders.filter((order) => !seenOrderIds.current?.has(order.id));
      orders.forEach((order) => seenOrderIds.current?.add(order.id));
      if (newOrders.length === 0) return;

      // Only the in-app banner is raised here. The system notification comes
      // from the push in the service worker, so foreground orders would
      // otherwise announce themselves twice.
      setAlert({ order: newOrders[0], count: newOrders.length });
      setUnreadCount((count) => count + newOrders.length);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([180, 80, 180]);
      }
      router.refresh();
    } catch {
      // A temporary connection problem should not interrupt the admin.
    } finally {
      checking.current = false;
    }
  }, [router]);

  useEffect(() => {
    void checkForOrders();
    const interval = window.setInterval(() => void checkForOrders(), 10_000);
    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void checkForOrders();
    };
    window.addEventListener("focus", checkWhenVisible);
    document.addEventListener("visibilitychange", checkWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkWhenVisible);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [checkForOrders]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  const handleBell = () => {
    if (unreadCount > 0) {
      openOrders();
      return;
    }
    setBusy("idle");
    setPanelOpen((open) => !open);
  };

  const bellLabel = status === "on" ? t("notifications.enabled") : t("notifications.enable");

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={handleBell}
          title={bellLabel}
          aria-label={bellLabel}
          aria-expanded={panelOpen}
          className="relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-[#f3e6d4]/15 px-3 text-[#f3e6d4] ring-1 ring-[#f3e6d4]/30 transition-colors hover:bg-[#f3e6d4]/25 sm:px-3.5"
        >
          {status === "on" ? (
            <BellRing className="h-5 w-5" aria-hidden="true" />
          ) : status === "blocked" ? (
            <BellOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Bell className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="hidden text-xs font-bold xl:inline">{bellLabel}</span>
          {unreadCount > 0 && (
            <span className="absolute -end-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#f5c451] px-1 text-[0.65rem] font-black text-[#4a2218] ring-2 ring-[#964534]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {panelOpen && (
          <>
            <button
              type="button"
              aria-label={t("notifications.close")}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-[190] cursor-default"
            />
            <div
              role="dialog"
              aria-label={t("notifications.panelTitle")}
              className="absolute end-0 top-full z-[200] mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl bg-white p-4 text-[#4a2218] shadow-2xl ring-1 ring-[#964534]/20"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-base font-semibold">
                  {support === "needs-install"
                    ? t("notifications.installTitle")
                    : t("notifications.panelTitle")}
                </p>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label={t("notifications.close")}
                  className="-me-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#4a2218]/60 hover:bg-[#f3e6d4]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {support === "needs-install" ? (
                <p className="mt-2 flex gap-2 text-sm leading-relaxed text-[#4a2218]/80">
                  <Share className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t("notifications.installIos")}</span>
                </p>
              ) : support === "unsupported" ? (
                <p className="mt-2 text-sm text-[#4a2218]/80">
                  {t("notifications.unsupported")}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-[#4a2218]/80">
                    {status === "on"
                      ? t("notifications.statusOn")
                      : status === "blocked"
                        ? t("notifications.statusBlocked")
                        : t("notifications.statusOff")}
                  </p>

                  {busy === "server-off" && (
                    <p className="mt-2 rounded-xl bg-[#f3e6d4] px-3 py-2 text-xs font-semibold text-[#964534]">
                      {t("notifications.serverOff")}
                    </p>
                  )}
                  {busy === "failed" && (
                    <p className="mt-2 rounded-xl bg-[#f3e6d4] px-3 py-2 text-xs font-semibold text-[#964534]">
                      {t("notifications.failed")}
                    </p>
                  )}

                  {status !== "blocked" && (
                    <div className="mt-3 flex flex-col gap-2">
                      {status === "on" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void sendTest()}
                            disabled={busy === "working"}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#964534] px-3 text-sm font-bold text-[#f3e6d4] transition-colors hover:bg-[#a84d39] disabled:opacity-60"
                          >
                            {busy === "sent" ? (
                              <Check className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Send className="h-4 w-4" aria-hidden="true" />
                            )}
                            {busy === "working"
                              ? t("notifications.working")
                              : busy === "sent"
                                ? t("notifications.testSent")
                                : t("notifications.sendTest")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void disableAlerts()}
                            disabled={busy === "working"}
                            className="min-h-11 rounded-xl px-3 text-sm font-semibold text-[#964534] underline-offset-4 hover:underline disabled:opacity-60"
                          >
                            {t("notifications.turnOff")}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void enableAlerts()}
                          disabled={busy === "working" || support === "checking"}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#964534] px-3 text-sm font-bold text-[#f3e6d4] transition-colors hover:bg-[#a84d39] disabled:opacity-60"
                        >
                          <BellRing className="h-4 w-4" aria-hidden="true" />
                          {busy === "working"
                            ? t("notifications.working")
                            : t("notifications.turnOn")}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {alert && (
        <aside
          role="status"
          aria-live="assertive"
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[180] overflow-hidden rounded-3xl bg-[#4a2218] text-[#f3e6d4] shadow-2xl ring-1 ring-white/15 md:inset-x-auto md:bottom-6 md:end-6 md:w-[24rem]"
        >
          <div className="flex items-start gap-3 p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f5c451] text-[#4a2218]">
              <BellRing className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold">
                {alert.count === 1
                  ? t("notifications.newOrder")
                  : t("notifications.newOrders").replace("{count}", String(alert.count))}
              </p>
              <p className="mt-0.5 truncate text-sm text-[#f3e6d4]/75">
                {alert.order.customerName || t("notifications.unknownCustomer")}
                {" · "}
                {formatPrice(alert.order.total)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAlert(null)}
              aria-label={t("notifications.dismiss")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#f3e6d4]/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={openOrders}
            className="min-h-12 w-full border-t border-white/10 bg-[#964534] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#a84d39]"
          >
            {t("notifications.view")}
          </button>
        </aside>
      )}
    </>
  );
}
