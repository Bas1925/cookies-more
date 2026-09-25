import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  boxLinePrice,
  boxCapacity,
  DELIVERY_FEE,
  getBoxFillings,
  getReadyBoxFillings,
  getProduct,
  isCustomizableReadyBox,
  readyBoxPicks,
  readyBoxCategoryMax,
  readyBoxProductMax,
} from "@/lib/data";
import {
  appendOrder,
  findOrderByCheckoutKey,
  rememberCheckoutKey,
} from "@/lib/orders-fs";
import { sendOrderPush } from "@/lib/push";
import { readCatalogFile } from "@/lib/catalog-fs";
import { isStoreBusy, requestDeadline } from "@/lib/blob-store";
import type { CartLine, Fulfillment, Order, OrderLine } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  lines?: CartLine[];
  fulfillment?: Fulfillment;
  customerName?: string;
  phone?: string;
  checkoutKey?: string;
}

const CHECKOUT_KEY = /^[A-Za-z0-9-]{8,64}$/;

function buildOrderLines(lines: CartLine[]): OrderLine[] | null {
  const result: OrderLine[] = [];
  for (const line of lines) {
    if (
      !line ||
      typeof line !== "object" ||
      !Number.isInteger(line.qty) ||
      line.qty < 1 ||
      line.qty > 50
    ) {
      return null;
    }

    if (line.kind === "item") {
      const product = getProduct(line.productId);
      if (!product || product.fillable || product.hidden) return null;
      result.push({
        kind: "item",
        productId: line.productId,
        name: product.name.en || product.id,
        nameLocalized: { ...product.name },
        qty: line.qty,
        unitPrice: product.price,
        lineTotal: product.price * line.qty,
      });
      continue;
    }

    if (line.kind === "box") {
      const box = getProduct(line.boxId);
      if (!box || box.hidden) return null;
      const readyMade = isCustomizableReadyBox(box);
      if (!box.fillable && !readyMade) return null;
      if (
        !line.contents ||
        typeof line.contents !== "object" ||
        Array.isArray(line.contents)
      ) {
        return null;
      }

      const allowed = new Map(
        (readyMade ? getReadyBoxFillings(box) : getBoxFillings()).map(
          (product) => [product.id, product],
        ),
      );
      const contents: Record<string, number> = {};
      const contentDetails: NonNullable<OrderLine["contentDetails"]> = [];
      let selectedCount = 0;
      const capacity = readyMade ? readyBoxPicks(box) : boxCapacity(box.id);

      for (const [productId, qty] of Object.entries(line.contents)) {
        const product = allowed.get(productId);
        if (!product || !Number.isInteger(qty) || qty < 1) return null;
        if (readyMade && qty > readyBoxProductMax(box, product)) return null;
        selectedCount += qty;
        if (selectedCount > capacity) return null;
        contents[productId] = qty;
        contentDetails.push({
          productId,
          name: { ...product.name },
          qty,
        });
      }

      if (selectedCount !== capacity) return null;

      if (readyMade) {
        const byCategory: Record<string, number> = {};
        for (const [productId, qty] of Object.entries(contents)) {
          const product = allowed.get(productId);
          if (!product) return null;
          byCategory[product.category] =
            (byCategory[product.category] ?? 0) + qty;
        }
        for (const [categoryId, qty] of Object.entries(byCategory)) {
          if (qty > readyBoxCategoryMax(box, categoryId)) return null;
        }
      }

      const unitPrice = boxLinePrice(line.boxId, contents);
      result.push({
        kind: "box",
        productId: line.boxId,
        name: box.name.en || box.id,
        nameLocalized: { ...box.name },
        qty: line.qty,
        unitPrice,
        lineTotal: unitPrice * line.qty,
        contents,
        contentDetails,
      });
      continue;
    }

    return null;
  }
  return result;
}

/** The customer's cart drawer retries this, and the checkout key dedupes. */
const busy = () =>
  NextResponse.json(
    { error: "The shop is busy right now — please try again" },
    { status: 503 },
  );

export async function POST(request: Request) {
  const { within } = requestDeadline();

  // Ensure server catalog snapshot is fresh before pricing.
  try {
    await within(readCatalogFile());
  } catch (error) {
    if (isStoreBusy(error)) return busy();
    throw error;
  }

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const checkoutKey =
    typeof body.checkoutKey === "string" && CHECKOUT_KEY.test(body.checkoutKey)
      ? body.checkoutKey
      : null;
  if (checkoutKey) {
    // A retry of a checkout that already went through — the first reply was
    // lost, not the order. Answer as if it just succeeded.
    const existing = await within(findOrderByCheckoutKey(checkoutKey)).catch(
      () => null,
    );
    if (existing) return NextResponse.json({ ok: true, order: existing });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (lines.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (lines.length > 40) {
    return NextResponse.json({ error: "Too many items" }, { status: 400 });
  }

  const customerName =
    typeof body.customerName === "string" ? body.customerName.trim() : "";
  const phone =
    typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  if (!customerName || customerName.length > 80) {
    return NextResponse.json({ error: "Invalid customer name" }, { status: 400 });
  }
  if (!/^\d{10}$/.test(phone)) {
    return NextResponse.json(
      { error: "Phone number must contain exactly 10 digits" },
      { status: 400 },
    );
  }

  const fulfillment: Fulfillment =
    body.fulfillment === "pickup" ? "pickup" : "delivery";

  const orderLines = buildOrderLines(lines);
  if (!orderLines) {
    return NextResponse.json({ error: "Invalid cart items" }, { status: 400 });
  }

  const subtotal = orderLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const deliveryFee =
    fulfillment === "delivery" && subtotal > 0 ? DELIVERY_FEE : 0;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  const order: Order = {
    id: `ord_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
    createdAt: new Date().toISOString(),
    customerName,
    phone,
    fulfillment,
    // Kept at zero rather than dropped: orders placed before discount codes
    // were removed still carry real values, and the admin reads these fields.
    discountCode: null,
    lines: orderLines,
    subtotal,
    discountAmount: 0,
    deliveryFee,
    total,
    source: "website",
    status: "placed",
  };

  try {
    // Key first: if the order write runs out of time here but lands in the
    // background, the customer's retry still finds it instead of placing a
    // second copy. A key pointing at an order that never landed is ignored.
    if (checkoutKey) {
      await within(rememberCheckoutKey(checkoutKey, order.id));
    }
    await within(appendOrder(order));

    // Awaited on purpose: the serverless function can be frozen the moment it
    // responds, so a fire-and-forget push would often never leave the box.
    // A push failure must never fail a paid-for order, hence the catch.
    // Bounded by the same deadline: once the order is saved, running out of
    // time costs the notification, never the customer's success screen.
    try {
      await within(sendOrderPush(order));
    } catch (pushError) {
      console.error("Order saved but push notification failed", pushError);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    if (isStoreBusy(error)) return busy();
    console.error(error);
    return NextResponse.json(
      { error: "Could not save order" },
      { status: 500 },
    );
  }
}
