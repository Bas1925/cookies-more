import { NextResponse } from "next/server";
import { readCatalogFile } from "@/lib/catalog-fs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await readCatalogFile();
    return NextResponse.json(catalog);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to read catalog" },
      { status: 500 },
    );
  }
}
