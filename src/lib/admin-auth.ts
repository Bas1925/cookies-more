import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "cm_admin_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-only-change-me"
  );
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "cookiesadmin";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function verifyAdminPassword(password: string) {
  const expected = adminPassword();
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createAdminSession() {
  const payload = `ok:${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  if (!payload.startsWith("ok:")) return false;
  return true;
}

export { COOKIE_NAME };
