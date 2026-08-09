import Link from "next/link";
import { readCatalogFile } from "@/lib/catalog-fs";
import { readOrdersFile, summarizeOrders } from "@/lib/orders-fs";
import { formatPrice } from "@/lib/data";
import { getAdminTranslator } from "@/lib/admin-language";
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

function orderStatusKey(status: Order["status"]): AdminKey {
  switch (status) {
    case "confirmed":
      return "orders.statusConfirmed";
    case "preparing":
      return "orders.statusPreparing";
    case "ready":
      return "orders.statusReady";
    case "completed":
      return "orders.statusCompleted";
    default:
      return "orders.statusPlaced";
  }
}

export default async function AdminDashboardPage() {
  const { lang, t } = await getAdminTranslator();
  const [catalog, ordersFile] = await Promise.all([
    readCatalogFile(),
    readOrdersFile(),
  ]);
  const summary = summarizeOrders(ordersFile.orders);
  const recent = ordersFile.orders.slice(0, 8);
  const visibleProducts = catalog.products.filter((p) => !p.hidden).length;
  const fillable = catalog.products.filter((p) => p.fillable).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{t("dashboard.title")}</h1>
        <p className="mt-1 text-[#4a2218]/65">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <section aria-labelledby="money-heading" className="space-y-3">
        <h2 id="money-heading" className="text-sm font-bold uppercase tracking-wide text-[#964534]">
          {t("dashboard.money")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyCard
            label={t("dashboard.allTime")}
            value={formatPrice(summary.revenueAll)}
            hint={t(summary.orderCount === 1 ? "common.oneOrder" : "common.orders", { count: summary.orderCount })}
            emphasize
          />
          <MoneyCard
            label={t("dashboard.today")}
            value={formatPrice(summary.revenueToday)}
            hint={t(summary.ordersToday === 1 ? "common.oneOrder" : "common.orders", { count: summary.ordersToday })}
          />
          <MoneyCard
            label={t("dashboard.week")}
            value={formatPrice(summary.revenueWeek)}
            hint={t(summary.ordersWeek === 1 ? "common.oneOrder" : "common.orders", { count: summary.ordersWeek })}
          />
          <MoneyCard
            label={t("dashboard.average")}
            value={formatPrice(summary.averageOrder)}
            hint={t("dashboard.across")}
          />
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="recent-heading" className="text-sm font-bold uppercase tracking-wide text-[#964534]">
            {t("dashboard.recent")}
          </h2>
          <Link
            href="/admin/orders"
            className="min-h-11 inline-flex items-center text-sm font-semibold text-[#964534]"
          >
            {t("dashboard.viewAll")}
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-[#4a2218]/70 shadow-sm ring-1 ring-[#964534]/15">
            {t("dashboard.noOrders")}
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                products={catalog.products}
                lang={lang}
                t={t}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="catalog-heading" className="space-y-3">
        <h2 id="catalog-heading" className="text-sm font-bold uppercase tracking-wide text-[#964534]">
          {t("dashboard.catalog")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: t("dashboard.categories"), value: catalog.categories.length },
            { label: t("dashboard.products"), value: visibleProducts },
            { label: t("dashboard.boxSizes"), value: fillable },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/15"
            >
              <p className="text-sm font-semibold text-[#964534]">{card.label}</p>
              <p className="mt-2 font-display text-4xl font-semibold">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center rounded-full bg-[#964534] px-5 py-3 text-sm font-semibold text-[#f3e6d4]"
        >
          {t("dashboard.editProducts")}
        </Link>
        <Link
          href="/admin/categories"
          className="inline-flex min-h-11 items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#964534] ring-1 ring-[#964534]/25"
        >
          {t("dashboard.editCategories")}
        </Link>
        <Link
          href="/admin/orders"
          className="inline-flex min-h-11 items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#964534] ring-1 ring-[#964534]/25"
        >
          {t("dashboard.salesOrders")}
        </Link>
      </div>
    </div>
  );
}

function MoneyCard({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ring-1 ${
        emphasize
          ? "bg-[#964534] text-[#f3e6d4] ring-[#964534]"
          : "bg-white ring-[#964534]/15"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          emphasize ? "text-[#f3e6d4]/85" : "text-[#964534]"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
        {value}
      </p>
      <p
        className={`mt-1 text-xs ${
          emphasize ? "text-[#f3e6d4]/70" : "text-[#4a2218]/55"
        }`}
      >
        {hint}
      </p>
    </div>
  );
}

function OrderRow({
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
  const items = order.lines.reduce((n, line) => n + line.qty, 0);
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const boxSelections = order.lines
    .filter((line) => line.kind === "box")
    .map((line) => formatBoxSelection(line, productNames, lang))
    .filter(Boolean);
  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#964534]/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {formatPrice(order.total)}
            <span className="ms-2 text-sm font-medium text-[#4a2218]/55">
              · {t(order.fulfillment === "delivery" ? "common.delivery" : "common.pickup")}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-[#4a2218]/55">
            {formatWhen(order.createdAt, lang)} ·{" "}
            {t(items === 1 ? "common.oneItem" : "common.items", { count: items })}
            {order.discountCode ? ` · ${order.discountCode}` : ""}
          </p>
          {order.customerName && (
            <p className="mt-1 text-sm font-semibold text-[#4a2218]/75">
              {order.customerName}
              {order.phone ? (
                <span dir="ltr" className="ms-2 inline-block text-[#964534]">
                  {order.phone}
                </span>
              ) : null}
            </p>
          )}
          <p className="mt-1 truncate text-sm text-[#4a2218]/75">
            {order.lines
              .map((line) => {
                const catalogName = productNames.get(line.productId);
                return `${line.qty}× ${
                  line.nameLocalized?.[lang] ||
                  catalogName?.[lang] ||
                  catalogName?.en ||
                  line.name
                }`;
              })
              .join(", ")}
          </p>
          {boxSelections.length > 0 && (
            <p className="mt-1 text-xs text-[#4a2218]/60">
              {t("orders.customBox")}: {boxSelections.join(" · ")}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            order.status === "completed"
              ? "bg-[#dcebdc] text-[#285d3a]"
              : "bg-[#e8d4bc] text-[#964534]"
          }`}
        >
          {t(orderStatusKey(order.status))}
        </span>
      </div>
    </li>
  );
}

function formatBoxSelection(
  line: OrderLine,
  productNames: Map<string, Product["name"]>,
  lang: AdminLang,
) {
  if (line.contentDetails?.length) {
    return line.contentDetails
      .map((item) => `${item.qty}× ${item.name[lang] || item.name.en}`)
      .join(", ");
  }
  return Object.entries(line.contents || {})
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const name = productNames.get(id);
      return `${qty}× ${name?.[lang] || name?.en || id}`;
    })
    .join(", ");
}
