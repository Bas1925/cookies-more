import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = body.password ?? "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
