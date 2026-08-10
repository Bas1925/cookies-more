import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPushConfigured } from "@/lib/push";
import {
  deletePushSubscription,
  normalizeSubscription,
  savePushSubscription,
} from "@/lib/push-subs";

export const dynamic = "force-dynamic";

/**
 * The public VAPID key is served at runtime rather than inlined as a
 * NEXT_PUBLIC_ build-time constant, so setting the key on Netlify starts
 * working immediately instead of only after the next rebuild.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { subscription?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subscription = normalizeSubscription(body.subscription);
  if (!subscription) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  try {
    await savePushSubscription(subscription);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not save subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.endpoint !== "string" || !body.endpoint) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  try {
    await deletePushSubscription(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not remove subscription" },
      { status: 500 },
    );
  }
}
