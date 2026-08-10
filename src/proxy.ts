import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Renamed from middleware.ts: Next 16 deprecated the `middleware` file
// convention in favour of `proxy`. Same behaviour, new name.

const COOKIE_NAME = "cm_admin_session";

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-only-change-me"
  );
}

async function sign(value: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isAuthed(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !payload.startsWith("ok:")) return false;
  const expected = await sign(payload);
  if (expected.length !== sig.length) return false;
  let ok = true;
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== sig[i]) ok = false;
  }
  return ok;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The admin web manifest must stay readable without a session: iOS re-fetches
  // it when installing to the Home Screen and later on its own schedule, and a
  // redirect to the HTML login page reads as a broken manifest — which silently
  // costs the app its name, icon and standalone launch. It holds no secrets.
  if (pathname === "/admin/manifest.webmanifest") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/login")) {
    if (await isAuthed(request)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!(await isAuthed(request))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
