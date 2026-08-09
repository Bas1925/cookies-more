import { readOrdersFile, summarizeOrders } from "@/lib/orders-fs";
import { readCatalogFile } from "@/lib/catalog-fs";
import { formatPrice } from "@/lib/data";
import { getAdminTranslator } from "@/lib/admin-language";
import OrderStatusControl from "@/components/admin/OrderStatusControl";
import DeleteOrderButton from "@/components/admin/DeleteOrderButton";
import type { AdminKey, AdminLang } from "@/lib/admin-i18n";
import type { Order, OrderLine, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatWhen(iso: string, lang: AdminLang) {
  try {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-IL" : "en-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminOrdersPage() {
  const { lang, t } = await getAdminTranslator();
  const [file, catalog] = await Promise.all([
    readOrdersFile(),
    readCatalogFile(),
  ]);
  const summary = summarizeOrders(file.orders);
  const activeOrders = file.orders.filter((order) => order.status !== "completed");
  const completedOrders = file.orders.filter((order) => order.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("orders.title")}</h1>
        <p className="mt-1 text-[#4a2218]/65">
          {t("orders.subtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("orders.totalEarned")} value={formatPrice(summary.revenueAll)} />
        <Stat label={t("shell.orders")} value={String(summary.orderCount)} />
        <Stat label={t("orders.active")} value={String(activeOrders.length)} />
        <Stat
          label={t("orders.average")}
          value={formatPrice(summary.averageOrder)}
        />
      </div>

      {file.orders.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl bg-white p-6 text-sm text-[#4a2218]/70 shadow-sm ring-1 ring-[#964534]/15"
        >
          {t("orders.none")}
        </div>
      ) : (
        <div className="space-y-8">
          <OrderGroup
            title={t("orders.active")}
            emptyText={t("orders.noActive")}
            orders={activeOrders}
            products={catalog.products}
            lang={lang}
            t={t}
          />
          <OrderGroup
            title={t("orders.completed")}
            emptyText={t("orders.noCompleted")}
            orders={completedOrders}
            products={catalog.products}
            lang={lang}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

function OrderGroup({
  title,
  emptyText,
  orders,
  products,
  lang,
  t,
}: {
  title: string;
  emptyText: string;
  orders: Order[];
  products: Product[];
  lang: AdminLang;
  t: (key: AdminKey, vars?: Record<string, string | number>) => string;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-2xl font-semibold text-[#4a2218]">{title}</h2>
        <span className="rounded-full bg-[#964534] px-2.5 py-1 text-xs font-bold text-[#f3e6d4]">
          {orders.length}
        </span>
      </div>
      {orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-[#4a2218]/60 ring-1 ring-[#964534]/10">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-3" aria-label={title}>
          {orders.map((order) => (
            <li
              key={order.id}
              className={`rounded-2xl p-4 shadow-sm ring-1 sm:p-5 ${
                order.status === "completed"
                  ? "bg-[#f1f8f1] ring-[#34734a]/20"
                  : "bg-white ring-[#964534]/10"
              }`}
            >
              <OrderCard order={order} products={products} lang={lang} t={t} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/15">
      <p className="text-sm font-semibold text-[#964534]">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

function OrderCard({
  order,
  products,
  lang,
  t,
}: {
  order: Order;
  products: Product[];
  lang: AdminLang;
  t: (key: AdminKey, vars?: Record<string, string | number>) => string;
}) {
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  return (
    <article aria-labelledby={`order-${order.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id={`order-${order.id}`}
            className="font-display text-2xl font-semibold text-[#964534]"
          >
            {formatPrice(order.total)}
          </h2>
          <p className="mt-1 text-sm text-[#4a2218]/60">
            {formatWhen(order.createdAt, lang)} ·{" "}
            {t(order.fulfillment === "delivery" ? "common.delivery" : "common.pickup")}
            {order.discountCode
              ? ` · ${t("orders.code", { code: order.discountCode })}`
              : ""}
          </p>
        </div>
        <span className="rounded-full bg-[#e8d4bc] px-3 py-1.5 text-xs font-semibold text-[#964534]">
          {t("orders.websiteOrder")}
        </span>
      </div>

      <div className="mt-4 grid gap-2 rounded-2xl bg-[#f3e6d4]/55 p-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-[#4a2218]/55">{t("orders.customer")}</p>
          <p className="mt-0.5 font-bold text-[#4a2218]">
            {order.customerName || t("orders.customerUnknown")}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#4a2218]/55">{t("orders.phone")}</p>
          {order.phone ? (
            <a
              href={`tel:${order.phone}`}
              dir="ltr"
              className="mt-0.5 inline-block font-bold text-[#964534] underline decoration-[#964534]/30 underline-offset-2"
            >
              {order.phone}
            </a>
          ) : (
            <p className="mt-0.5 font-bold text-[#4a2218]">
              {t("orders.customerUnknown")}
            </p>
          )}
        </div>
      </div>

      <OrderStatusControl
        orderId={order.id}
        initialStatus={order.status}
        labels={{
          label: t("orders.status"),
          placed: t("orders.statusPlaced"),
          confirmed: t("orders.statusConfirmed"),
          preparing: t("orders.statusPreparing"),
          ready: t("orders.statusReady"),
          completed: t("orders.statusCompleted"),
          saving: t("orders.statusSaving"),
          error: t("orders.statusError"),
        }}
      />

      <ul className="mt-4 space-y-2 border-t border-[#964534]/10 pt-4">
        {order.lines.map((line, i) => (
          <li
            key={`${order.id}-${i}`}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <span className="min-w-0">
              <span className="font-semibold">
                {line.qty}× {line.nameLocalized?.[lang] ||
                  productNames.get(line.productId)?.[lang] ||
                  productNames.get(line.productId)?.en ||
                  line.name}
              </span>
              {line.kind === "box" && line.contents && (
                <BoxSelection
                  line={line}
                  productNames={productNames}
                  lang={lang}
                  t={t}
                />
              )}
              {line.qty > 1 && (
                <span className="mt-0.5 block text-xs text-[#4a2218]/55">
                  {formatPrice(line.unitPrice)} {t("orders.each")}
                </span>
              )}
            </span>
            <span className="shrink-0 font-semibold">
              {formatPrice(line.lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-[#4a2218]/55">{t("common.subtotal")}</dt>
          <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
        </div>
        <div>
          <dt className="text-[#4a2218]/55">{t("common.discount")}</dt>
          <dd className="font-semibold">
            {order.discountAmount
              ? `−${formatPrice(order.discountAmount)}`
              : formatPrice(0)}
          </dd>
        </div>
        <div>
          <dt className="text-[#4a2218]/55">{t("common.delivery")}</dt>
          <dd className="font-semibold">{formatPrice(order.deliveryFee)}</dd>
        </div>
        <div>
          <dt className="text-[#4a2218]/55">{t("common.total")}</dt>
          <dd className="font-semibold text-[#964534]">
            {formatPrice(order.total)}
          </dd>
        </div>
      </dl>

      <DeleteOrderButton
        orderId={order.id}
        labels={{
          title: t("orders.deleteTitle"),
          hint: t("orders.deleteHint"),
          button: t("orders.deleteButton"),
          modalTitle: t("orders.deleteModalTitle"),
          modalText: t("orders.deleteModalText"),
          cancel: t("orders.deleteCancel"),
          confirmAction: t("orders.deleteConfirmAction"),
          deleting: t("orders.deleting"),
          error: t("orders.deleteError"),
        }}
      />
    </article>
  );
}

function BoxSelection({
  line,
  productNames,
  lang,
  t,
}: {
  line: OrderLine;
  productNames: Map<string, Product["name"]>;
  lang: AdminLang;
  t: (key: AdminKey, vars?: Record<string, string | number>) => string;
}) {
  const choices = line.contentDetails?.length
    ? line.contentDetails.map((item) => ({
        id: item.productId,
        qty: item.qty,
        name: item.name[lang] || item.name.en,
      }))
    : Object.entries(line.contents || {})
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const name = productNames.get(id);
          return {
            id,
            qty,
            name:
              name?.[lang] ||
              name?.en ||
              t("orders.unknownProduct", { id }),
          };
        });

  return (
    <span className="mt-2 block rounded-xl bg-[#f3e6d4]/70 p-3 text-xs text-[#4a2218]/75">
      <span className="block font-bold text-[#964534]">
        {t("orders.customBox")}
      </span>
      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        {choices.map((choice) => (
          <span key={choice.id}>
            {choice.qty}× {choice.name}
          </span>
        ))}
      </span>
    </span>
  );
}
