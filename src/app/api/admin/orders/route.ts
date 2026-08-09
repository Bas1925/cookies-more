import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  deleteOrder,
  readOrdersFile,
  summarizeOrders,
  updateOrderStatus,
} from "@/lib/orders-fs";
import { isOrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const file = await readOrdersFile();
    const summary = summarizeOrders(file.orders);
    return NextResponse.json({ orders: file.orders, summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to read orders" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { orderId?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.orderId !== "string" || !isOrderStatus(body.status)) {
    return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(body.orderId, body.status);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not update order status" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { orderId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.orderId !== "string" || !body.orderId) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  try {
    const deleted = await deleteOrder(body.orderId);
    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not delete order" },
      { status: 500 },
    );
  }
}
