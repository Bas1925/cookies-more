"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

interface StatusLabels {
  label: string;
  placed: string;
  confirmed: string;
  preparing: string;
  ready: string;
  completed: string;
  saving: string;
  error: string;
}

export default function OrderStatusControl({
  orderId,
  initialStatus,
  labels,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  labels: StatusLabels;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const currentIndex = ORDER_STATUSES.indexOf(status);

  const updateStatus = async (nextStatus: OrderStatus) => {
    if (saving || nextStatus === status) return;
    const previousStatus = status;
    setStatus(nextStatus);
    setSaving(true);
    setError(false);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });
      if (!response.ok) throw new Error("Status update failed");
      router.refresh();
    } catch {
      setStatus(previousStatus);
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl bg-[#f3e6d4]/65 p-3 ring-1 ring-[#964534]/10">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#4a2218]">{labels.label}</p>
        <p aria-live="polite" className="text-xs font-semibold text-[#964534]">
          {saving ? labels.saving : error ? labels.error : labels[status]}
        </p>
      </div>
      <div
        role="group"
        aria-label={labels.label}
        className="grid grid-cols-2 gap-2 sm:grid-cols-5"
      >
        {ORDER_STATUSES.map((item, index) => {
          const isCurrent = item === status;
          const isPast = index < currentIndex;
          return (
            <button
              key={item}
              type="button"
              onClick={() => void updateStatus(item)}
              disabled={saving}
              aria-pressed={isCurrent}
              className={`min-h-11 rounded-xl px-2 py-2 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-70 ${
                isCurrent
                  ? item === "completed"
                    ? "bg-[#34734a] text-white"
                    : "bg-[#964534] text-[#f3e6d4]"
                  : isPast
                    ? "bg-[#dcebdc] text-[#285d3a]"
                    : "bg-white text-[#4a2218]/65 ring-1 ring-[#964534]/15 hover:text-[#964534]"
              }`}
            >
              {isPast ? "✓ " : ""}
              {labels[item]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
