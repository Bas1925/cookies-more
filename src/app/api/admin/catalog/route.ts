import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readCatalogFile, writeCatalogFile } from "@/lib/catalog-fs";
import { isStoreBusy, requestDeadline } from "@/lib/blob-store";
import type { Catalog } from "@/lib/types";

export const dynamic = "force-dynamic";

const busy = () => NextResponse.json({ error: "busy" }, { status: 503 });

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const catalog = await requestDeadline().within(readCatalogFile());
    return NextResponse.json(catalog);
  } catch (error) {
    if (isStoreBusy(error)) return busy();
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

  let catalog: Catalog;
  try {
    catalog = await requestDeadline().within(writeCatalogFile(body));
  } catch (error) {
    if (isStoreBusy(error)) return busy();
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save catalog",
      },
      { status: 400 },
    );
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return NextResponse.json(catalog);
}
