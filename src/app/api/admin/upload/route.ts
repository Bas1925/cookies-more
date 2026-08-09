import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { tryGetStore } from "@/lib/blob-store";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, WebP, or GIF" },
      { status: 400 },
    );
  }

  if (file.size > 6 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image must be under 6MB" },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}${EXT[file.type]}`;

  // On Netlify the filesystem is read-only, so uploads live in blob storage
  // and are served back by app/uploads/[name]/route.ts.
  const store = tryGetStore("uploads");
  if (store) {
    await store.set(name, bytes);
  } else {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(bytes));
  }

  return NextResponse.json({ url: `/uploads/${name}` });
}
