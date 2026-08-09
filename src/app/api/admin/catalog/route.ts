import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readCatalogFile, writeCatalogFile } from "@/lib/catalog-fs";
import type { Catalog } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Catalog;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const catalog = await writeCatalogFile(body);
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json(catalog);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save catalog",
      },
      { status: 400 },
    );
  }
}
