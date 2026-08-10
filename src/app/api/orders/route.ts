import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  boxLinePrice,
  boxCapacity,
  DELIVERY_FEE,
  getBoxFillings,
  getProduct,
} from "@/lib/data";
import { appendOrder } from "@/lib/orders-fs";
import { sendOrderPush } from "@/lib/push";
import { readCatalogFile } from "@/lib/catalog-fs";
import type { CartLine, Fulfillment, Order, OrderLine } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CheckoutBody {
  lines?: CartLine[];
  fulfillment?: Fulfillment;
  customerName?: string;
  phone?: string;
}

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
      if (!box?.fillable || box.hidden) return null;
      if (
        !line.contents ||
        typeof line.contents !== "object" ||
        Array.isArray(line.contents)
      ) {
        return null;
      }

      const allowed = new Map(getBoxFillings().map((product) => [product.id, product]));
      const contents: Record<string, number> = {};
      const contentDetails: NonNullable<OrderLine["contentDetails"]> = [];
      let selectedCount = 0;

      for (const [productId, qty] of Object.entries(line.contents)) {
        const product = allowed.get(productId);
        if (!product || !Number.isInteger(qty) || qty < 1) return null;
        selectedCount += qty;
        if (selectedCount > boxCapacity(box.id)) return null;
        contents[productId] = qty;
        contentDetails.push({
          productId,
          name: { ...product.name },
          qty,
        });
      }

      if (selectedCount !== boxCapacity(box.id)) return null;

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

export async function POST(request: Request) {
  // Ensure server catalog snapshot is fresh before pricing.
  await readCatalogFile();

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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
    await appendOrder(order);

    // Awaited on purpose: the serverless function can be frozen the moment it
    // responds, so a fire-and-forget push would often never leave the box.
    // A push failure must never fail a paid-for order, hence the catch.
    try {
      await sendOrderPush(order);
    } catch (pushError) {
      console.error("Order saved but push notification failed", pushError);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not save order" },
      { status: 500 },
    );
  }
}
