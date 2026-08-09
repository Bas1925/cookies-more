"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteLabels {
  title: string;
  hint: string;
  button: string;
  modalTitle: string;
  modalText: string;
  cancel: string;
  confirmAction: string;
  deleting: string;
  error: string;
}

export default function DeleteOrderButton({
  orderId,
  labels,
}: {
  orderId: string;
  labels: DeleteLabels;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(false);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!response.ok) throw new Error("Delete failed");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError(true);
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="mt-5 border-t border-dashed border-[#a5372f]/25 pt-4" aria-label={labels.title}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fff3f1] p-3 ring-1 ring-[#a5372f]/15">
          <div>
            <h3 className="text-sm font-bold text-[#7f2823]">{labels.title}</h3>
            <p className="mt-0.5 text-xs text-[#7f2823]/65">{labels.hint}</p>
            {error && (
              <p role="alert" className="mt-1 text-xs font-bold text-[#a5372f]">
                {labels.error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setError(false);
              setConfirmOpen(true);
            }}
            disabled={deleting}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#a5372f] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#872b25] disabled:cursor-wait disabled:opacity-65"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {labels.button}
          </button>
        </div>
      </section>

      {confirmOpen && (
        <div className="fixed inset-0 z-[200] grid place-items-center p-4">
          <button
            type="button"
            aria-label={labels.cancel}
            onClick={() => setConfirmOpen(false)}
            className="absolute inset-0 cursor-default bg-[#27110d]/65 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-order-title-${orderId}`}
            aria-describedby={`delete-order-text-${orderId}`}
            className="relative z-10 w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-2xl ring-1 ring-black/10 sm:p-8"
          >
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              aria-label={labels.cancel}
              className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[#f3e6d4] text-[#4a2218] transition-colors hover:bg-[#e8d4bc]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fff0ed] text-[#a5372f] ring-8 ring-[#fff8f6]">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2
              id={`delete-order-title-${orderId}`}
              className="mt-5 font-display text-2xl font-semibold text-[#4a2218]"
            >
              {labels.modalTitle}
            </h2>
            <p
              id={`delete-order-text-${orderId}`}
              className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#4a2218]/65"
            >
              {labels.modalText}
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="min-h-12 rounded-xl bg-[#f3e6d4] px-4 py-3 text-sm font-bold text-[#4a2218] transition-colors hover:bg-[#e8d4bc] disabled:opacity-65"
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a5372f] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#a5372f]/20 transition-colors hover:bg-[#872b25] disabled:cursor-wait disabled:opacity-65"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {deleting ? labels.deleting : labels.confirmAction}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
