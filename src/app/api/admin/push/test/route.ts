import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPushConfigured, sendTestPush } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Fires a sample notification so the admin can confirm the phone rings. */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push is not configured on the server" },
      { status: 503 },
    );
  }

  try {
    const result = await sendTestPush();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not send test notification" },
      { status: 500 },
    );
  }
}
