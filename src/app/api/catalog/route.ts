import { NextResponse } from "next/server";
import { readCatalogFile } from "@/lib/catalog-fs";
import { isStoreBusy, requestDeadline } from "@/lib/blob-store";

export const dynamic = "force-dynamic";

/**
 * Every shop visit asks for this. Netlify's CDN keeps a copy for a few
 * seconds and keeps serving the last good copy while it refreshes, so a
 * crowd of customers costs one storage read, and a slow moment in storage
 * never reaches them. Admin edits show on the shop within ~15s.
 */
const SHOP_CACHE = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "Netlify-CDN-Cache-Control":
    "public, durable, s-maxage=15, stale-while-revalidate=600",
};

export async function GET() {
  try {
    const catalog = await requestDeadline().within(readCatalogFile());
    return NextResponse.json(catalog, { headers: SHOP_CACHE });
  } catch (error) {
    if (!isStoreBusy(error)) console.error(error);
    return NextResponse.json(
      { error: "Failed to read catalog" },
      { status: isStoreBusy(error) ? 503 : 500 },
    );
  }
}
