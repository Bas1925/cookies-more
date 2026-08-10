"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Truck,
  Store,
  ShoppingBag,
  Loader2,
  PartyPopper,
} from "lucide-react";
import ProductThumb from "./ProductThumb";
import { useCart } from "@/lib/cart-context";
import { formatPrice, getProduct, HERO_PRODUCT_ID, boxLinePrice } from "@/lib/data";
import { useLanguage } from "@/lib/language-context";
import type { CartLine } from "@/lib/types";

type CheckoutState = "idle" | "processing" | "success" | "error";
type CustomerFieldError = "name" | "phone" | null;

export default function CartDrawer() {
  const {
    lines,
    isOpen,
    closeCart,
    totals,
    setLineQty,
    removeLine,
    fulfillment,
    setFulfillment,
    clearCart,
  } = useCart();

  const { t, lang } = useLanguage();
  const [checkout, setCheckout] = useState<CheckoutState>("idle");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerFieldError, setCustomerFieldError] =
    useState<CustomerFieldError>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close and reset transient checkout UI so the next open is fresh.
  const handleClose = useCallback(() => {
    closeCart();
    setCheckout("idle");
    setCustomerFieldError(null);
  }, [closeCart]);

  // Focus management + Escape to close.
  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  const isEmpty = lines.length === 0;

  const handleCheckout = () => {
    if (isEmpty || checkout === "processing") return;
    const cleanName = customerName.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanName) {
      setCustomerFieldError("name");
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setCustomerFieldError("phone");
      return;
    }
    setCustomerFieldError(null);
    setCheckout("processing");
    void (async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lines,
            fulfillment,
            customerName: cleanName,
            phone: cleanPhone,
          }),
        });
        if (!res.ok) {
          setCheckout("error");
          return;
        }
        setCheckout("success");
        window.setTimeout(() => {
          clearCart();
          setCustomerName("");
          setPhone("");
        }, 200);
      } catch {
        setCheckout("error");
      }
    })();
  };

  return (
    <div
      dir="ltr"
      className={`fixed inset-0 z-[150] ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      {/* Scrim. Deliberately NOT inside a scrolling element: a backdrop-filter
          nested in an overflow container drops out and repaints on iOS Safari,
          which reads as the drawer flickering in and out as it opens. */}
      <div
        className={`absolute inset-0 bg-chocolate/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel — this is the scroll container, so the scrim above stays put.
          Lenis otherwise hijacks wheel/touch here and forwards it to the page,
          which is scroll-locked while the bag is open, so nothing scrolls. */}
      <div
        dir={lang === "en" ? "ltr" : "rtl"}
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label={t("bag.title")}
        className={`cart-overlay-scroll absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto overscroll-contain bg-cream shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-w-xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-chocolate/10 bg-cream/95 px-6 py-5 backdrop-blur-md sm:py-3.5">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-chocolate">
            <ShoppingBag className="h-5 w-5 text-caramel" />
            {t("bag.title")}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            className="grid h-11 w-11 place-items-center rounded-full bg-chocolate/10 text-chocolate transition-colors hover:bg-chocolate/20 sm:h-10 sm:w-10"
            aria-label={t("bag.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {checkout === "success" ? (
          <SuccessState onClose={handleClose} />
        ) : isEmpty ? (
          <EmptyState onClose={handleClose} />
        ) : (
          <>
            <div className="flex-1 px-6 py-4 sm:py-3">
              <ul className="flex flex-col gap-4 sm:gap-3">
                {lines.map((line) => (
                  <CartLineRow
                    key={line.id}
                    line={line}
                    onQty={setLineQty}
                    onRemove={removeLine}
                  />
                ))}
              </ul>

              {/* Customer details */}
              <fieldset className="mt-6 rounded-3xl border border-chocolate/10 bg-white/70 p-4 sm:mt-4 sm:p-3">
                <legend className="px-1 text-sm font-semibold text-chocolate">
                  {t("bag.customerDetails")}
                </legend>
                <div className="mt-1 space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="mb-1.5 block text-sm font-semibold text-chocolate"
                    >
                      {t("bag.customerName")}
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      value={customerName}
                      onChange={(event) => {
                        setCustomerName(event.target.value);
                        if (customerFieldError === "name") {
                          setCustomerFieldError(null);
                        }
                      }}
                      maxLength={80}
                      autoComplete="name"
                      required
                      aria-invalid={customerFieldError === "name"}
                      aria-describedby={
                        customerFieldError === "name" ? "customer-name-error" : undefined
                      }
                      placeholder={t("bag.customerNamePlaceholder")}
                      className="min-h-12 w-full rounded-2xl border border-chocolate/15 bg-white px-4 text-base text-chocolate outline-none placeholder:text-chocolate/40 focus:border-caramel sm:min-h-10 sm:text-sm"
                    />
                    {customerFieldError === "name" && (
                      <p id="customer-name-error" role="alert" className="mt-1.5 text-sm font-medium text-strawberry">
                        {t("bag.nameRequired")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="mb-1.5 block text-sm font-semibold text-chocolate"
                    >
                      {t("bag.phone")}
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      inputMode="numeric"
                      dir="ltr"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                        if (customerFieldError === "phone") {
                          setCustomerFieldError(null);
                        }
                      }}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      autoComplete="tel"
                      required
                      aria-invalid={customerFieldError === "phone"}
                      aria-describedby={
                        customerFieldError === "phone" ? "customer-phone-error" : undefined
                      }
                      placeholder={t("bag.phonePlaceholder")}
                      className="min-h-12 w-full rounded-2xl border border-chocolate/15 bg-white px-4 text-left text-base text-chocolate outline-none placeholder:text-chocolate/40 focus:border-caramel sm:min-h-10 sm:text-sm"
                    />
                    {customerFieldError === "phone" && (
                      <p id="customer-phone-error" role="alert" className="mt-1.5 text-sm font-medium text-strawberry">
                        {t("bag.phoneInvalid")}
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                {/* Fulfillment */}
                <fieldset className="mt-6 sm:mt-4">
                  <legend className="mb-2 text-sm font-semibold text-chocolate sm:mb-1.5">
                    {t("bag.fulfillment")}
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <FulfillmentButton
                      active={fulfillment === "delivery"}
                      onClick={() => setFulfillment("delivery")}
                      icon={<Truck className="h-4 w-4" />}
                      label={t("bag.delivery")}
                    />
                    <FulfillmentButton
                      active={fulfillment === "pickup"}
                      onClick={() => setFulfillment("pickup")}
                      icon={<Store className="h-4 w-4" />}
                      label={t("bag.pickup")}
                    />
                  </div>
                </fieldset>
              </div>
            </div>

            {/* Summary + checkout */}
            {/* pb clears the iOS home indicator when the drawer is full-height */}
            <footer className="border-t border-chocolate/10 bg-cream-dark/40 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:py-3.5 sm:pb-3.5">
              <dl className="mb-4 space-y-1.5 text-sm sm:mb-3 sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0">
                <Row label={t("bag.subtotal")} value={totals.subtotal} />
                <Row
                  label={
                    fulfillment === "delivery" ? t("bag.delivery") : t("bag.pickup")
                  }
                  value={totals.deliveryFee}
                  freeWhenZero={fulfillment === "pickup"}
                />
                <div className="flex items-center justify-between border-t border-chocolate/10 pt-2.5 font-display text-lg font-semibold text-chocolate sm:border-s sm:border-t-0 sm:ps-3 sm:pt-0">
                  <dt>{t("bag.total")}</dt>
                  <dd>{formatPrice(totals.total)}</dd>
                </div>
              </dl>

              {checkout === "error" && (
                <p role="alert" className="mb-3 text-sm font-medium text-strawberry">
                  {t("bag.error")}
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkout === "processing"}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-caramel px-6 py-4 font-semibold text-cream shadow-lg shadow-caramel/30 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 sm:py-3"
              >
                {checkout === "processing" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> {t("bag.processing")}
                  </>
                ) : (
                  <>{t("bag.checkout")} · {formatPrice(totals.total)}</>
                )}
              </button>
              <p className="mt-2 text-center text-xs text-chocolate/45 sm:mt-1.5">
                {t("bag.paymentNote")}
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function CartLineRow({
  line,
  onQty,
  onRemove,
}: {
  line: CartLine;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const { t, L, lang } = useLanguage();

  const details = useMemo(() => {
    if (line.kind === "item") {
      const product = getProduct(line.productId);
      if (!product) return null;
      return {
        title: L(product.name),
        price: product.price,
        thumb: product,
        // English keeps the Arabic name as a subtitle; the RTL languages
        // already show it as the title.
        subtitle: lang === "en" ? product.name.ar : "",
        subtitleIsArabic: lang === "en",
      };
    }
    const box = getProduct(line.boxId);
    if (!box) return null;
    const parts = Object.entries(line.contents)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => {
        const product = getProduct(id);
        return product ? `${n}× ${L(product.name)}` : null;
      })
      .filter((part): part is string => part !== null);
    return {
      title: L(box.name),
      price: boxLinePrice(line.boxId, line.contents),
      thumb: box,
      subtitle: parts.join(", ") || t("bag.emptyBox"),
      subtitleIsArabic: false,
    };
  }, [line, L, t, lang]);

  // The line references something no longer on the menu — skip it rather
  // than render a broken row. Totals ignore it too.
  if (!details) return null;

  const { title, price, thumb, subtitle, subtitleIsArabic } = details;

  return (
    <li className="flex gap-3 rounded-3xl bg-white/70 p-3 sm:p-2.5">
      <ProductThumb
        product={thumb}
        className="h-16 w-16 shrink-0 sm:h-14 sm:w-14"
        rounded="rounded-2xl"
        sizes="64px"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-chocolate">
              {title}
            </p>
            {subtitle && (
              <p
                lang={subtitleIsArabic ? "ar" : undefined}
                dir={subtitleIsArabic ? "rtl" : undefined}
                className={`truncate text-xs text-chocolate/55 ${
                  subtitleIsArabic ? "font-arabic" : ""
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(line.id)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-chocolate/40 transition-colors hover:text-strawberry sm:h-8 sm:w-8"
            aria-label={t("bag.removeNamed", { name: title })}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between sm:mt-1">
          <QtyStepper
            qty={line.qty}
            onChange={(q) => onQty(line.id, q)}
            label={title}
          />
          <span className="font-semibold text-chocolate">
            {formatPrice(price * line.qty)}
          </span>
        </div>
      </div>
    </li>
  );
}

function QtyStepper({
  qty,
  onChange,
  label,
}: {
  qty: number;
  onChange: (qty: number) => void;
  label: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-1 rounded-full bg-cream-dark p-1">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        className="grid h-11 w-11 place-items-center rounded-full bg-white text-chocolate transition-colors hover:bg-caramel hover:text-cream sm:h-8 sm:w-8"
        aria-label={t("bag.decrease", { name: label })}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span
        className="w-6 text-center text-sm font-bold text-chocolate"
        aria-live="polite"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        className="grid h-11 w-11 place-items-center rounded-full bg-white text-chocolate transition-colors hover:bg-caramel hover:text-cream sm:h-8 sm:w-8"
        aria-label={t("bag.increase", { name: label })}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FulfillmentButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-colors sm:py-2.5 ${
        active
          ? "border-caramel bg-caramel/10 text-chocolate"
          : "border-chocolate/10 bg-white text-chocolate/60 hover:border-chocolate/25"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Row({
  label,
  value,
  accent,
  freeWhenZero,
}: {
  label: string;
  value: number;
  accent?: string;
  freeWhenZero?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-chocolate/70">
      <dt>{label}</dt>
      <dd className={accent}>
        {value === 0 && freeWhenZero
          ? "Free"
          : `${value < 0 ? "−" : ""}${formatPrice(Math.abs(value))}`}
      </dd>
    </div>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <HeroThumb />
      <h3 className="mt-6 font-display text-2xl font-semibold text-chocolate">
        {t("bag.emptyTitle")}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-chocolate/60">
        {t("bag.emptyText")}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 rounded-full bg-chocolate px-6 py-3 font-semibold text-cream transition-transform hover:-translate-y-0.5"
      >
        {t("bag.browse")}
      </button>
    </div>
  );
}

/** Signature product shot for the empty bag; silent if the id ever moves. */
function HeroThumb() {
  const product = getProduct(HERO_PRODUCT_ID);
  if (!product) return null;
  return (
    <ProductThumb
      product={product}
      className="h-24 w-24 shadow-lg ring-4 ring-cream-dark"
      sizes="96px"
    />
  );
}

function SuccessState({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div
      role="status"
      className="flex flex-1 flex-col items-center justify-center px-8 text-center"
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-pistachio/20 text-pistachio-dark">
        <PartyPopper className="h-12 w-12" />
      </div>
      <h3 className="mt-6 font-display text-3xl font-semibold text-chocolate">
        {t("bag.successTitle")}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-chocolate/60">
        {t("bag.successText")}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 rounded-full bg-caramel px-6 py-3 font-semibold text-cream transition-transform hover:-translate-y-0.5"
      >
        {t("bag.keepBrowsing")}
      </button>
    </div>
  );
}
