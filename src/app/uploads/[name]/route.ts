import { NextResponse } from "next/server";
import { tryGetStore } from "@/lib/blob-store";

// Serves admin-uploaded product images out of Netlify Blobs. Locally the
// files still land in public/uploads and Next's static handler answers first,
// so this route only ever runs on Netlify.
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  // Keys are generated server-side as `<timestamp>-<hex><ext>`; anything else
  // is someone poking at the endpoint.
  if (!/^[\w-]+\.(jpg|png|webp|gif)$/.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const store = tryGetStore("uploads");
  if (!store) return new NextResponse("Not found", { status: 404 });

  const data = await store.get(name, { type: "arrayBuffer" });
  if (!data) return new NextResponse("Not found", { status: 404 });

  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return new NextResponse(data, {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      // Filenames are content-unique, so they can be cached indefinitely.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
