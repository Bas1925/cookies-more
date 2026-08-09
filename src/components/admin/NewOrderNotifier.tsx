"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, X } from "lucide-react";
import { formatPrice } from "@/lib/data";
import type { Order } from "@/lib/types";

interface NotificationLabels {
  enable: string;
  enabled: string;
  blocked: string;
  newOrder: string;
  newOrders: string;
  unknownCustomer: string;
  view: string;
  dismiss: string;
}

interface OrderAlert {
  order: Order;
  count: number;
}

type DevicePermission = NotificationPermission | "unsupported";

export default function NewOrderNotifier({ labels }: { labels: NotificationLabels }) {
  const router = useRouter();
  const seenOrderIds = useRef<Set<string> | null>(null);
  const checking = useRef(false);
  const [alert, setAlert] = useState<OrderAlert | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] =
    useState<DevicePermission>("unsupported");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPermission(
        "Notification" in window ? Notification.permission : "unsupported",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const openOrders = useCallback(() => {
    setAlert(null);
    setUnreadCount(0);
    router.push("/admin/orders");
    router.refresh();
  }, [router]);

  const showDeviceNotification = useCallback(
    (orders: Order[]) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const newest = orders[0];
      const title =
        orders.length === 1
          ? labels.newOrder
          : labels.newOrders.replace("{count}", String(orders.length));
      const customer = newest.customerName || labels.unknownCustomer;
      try {
        const notification = new Notification(title, {
          body: `${customer} · ${formatPrice(newest.total)}`,
          tag: newest.id,
        });
        notification.onclick = () => {
          window.focus();
          openOrders();
          notification.close();
        };
      } catch {
        // Some mobile browsers only allow service-worker notifications.
        // The in-app alert below remains available on every device.
      }
    },
    [labels.newOrder, labels.newOrders, labels.unknownCustomer, openOrders],
  );

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

      setAlert({ order: newOrders[0], count: newOrders.length });
      setUnreadCount((count) => count + newOrders.length);
      showDeviceNotification(newOrders);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([180, 80, 180]);
      }
      router.refresh();
    } catch {
      // A temporary connection problem should not interrupt the admin.
    } finally {
      checking.current = false;
    }
  }, [router, showDeviceNotification]);

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

  const handleBell = async () => {
    if (unreadCount > 0) {
      openOrders();
      return;
    }
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      return;
    }
    setPermission(Notification.permission);
  };

  const bellLabel =
    permission === "granted"
      ? labels.enabled
      : permission === "denied"
        ? labels.blocked
        : labels.enable;

  return (
    <>
      <button
        type="button"
        onClick={() => void handleBell()}
        title={bellLabel}
        aria-label={bellLabel}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-[#f3e6d4]/15 px-3 text-[#f3e6d4] ring-1 ring-[#f3e6d4]/30 transition-colors hover:bg-[#f3e6d4]/25 sm:px-3.5"
      >
        {permission === "granted" ? (
          <BellRing className="h-5 w-5" aria-hidden="true" />
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
                  ? labels.newOrder
                  : labels.newOrders.replace("{count}", String(alert.count))}
              </p>
              <p className="mt-0.5 truncate text-sm text-[#f3e6d4]/75">
                {alert.order.customerName || labels.unknownCustomer}
                {" · "}
                {formatPrice(alert.order.total)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAlert(null)}
              aria-label={labels.dismiss}
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
            {labels.view}
          </button>
        </aside>
      )}
    </>
  );
}
