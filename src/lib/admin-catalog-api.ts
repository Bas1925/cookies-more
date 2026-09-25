import type { Catalog } from "./types";

/**
 * Admin calls, hardened for Netlify.
 *
 * The server answers 503 "busy" before Netlify's time limit, and Netlify
 * itself can still answer with an HTML error page (502/503/504). Reading that
 * as JSON used to throw, leaving the admin on "Saving…" or a raw error. Every
 * admin write is safe to repeat (a PUT of the whole catalogue, a status set,
 * a delete, a fresh upload name), so one quiet retry covers a momentary
 * hiccup; if the server is still struggling the caller gets `busy` and shows
 * a calm message while the admin's edits stay on screen.
 */

export type AdminResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; busy: boolean; error?: string };

const TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 1_500;

function isServerBusy(status: number) {
  return status === 429 || status >= 500;
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function attempt<T>(url: string, init?: RequestInit): Promise<AdminResult<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...init,
      signal: controller.signal,
    });
    const data = (await readJson(res)) as (T & { error?: string }) | null;
    if (res.ok && data) return { ok: true, status: res.status, data };
    if (isServerBusy(res.status) || !data) {
      return { ok: false, status: res.status, busy: true };
    }
    return { ok: false, status: res.status, busy: false, error: data.error };
  } catch {
    // Network drop or our own timeout.
    return { ok: false, status: 0, busy: true };
  } finally {
    window.clearTimeout(timer);
  }
}

export async function adminRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<AdminResult<T>> {
  const first = await attempt<T>(url, init);
  if (first.ok || !first.busy) return first;
  await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS));
  return attempt<T>(url, init);
}

export type CatalogResult =
  | { ok: true; catalog: Catalog }
  | { ok: false; busy: boolean; error?: string };

function toCatalogResult(result: AdminResult<Catalog>): CatalogResult {
  return result.ok
    ? { ok: true, catalog: result.data }
    : { ok: false, busy: result.busy, error: result.error };
}

export async function loadCatalog(): Promise<CatalogResult> {
  return toCatalogResult(await adminRequest<Catalog>("/api/admin/catalog"));
}

export async function saveCatalog(catalog: Catalog): Promise<CatalogResult> {
  return toCatalogResult(
    await adminRequest<Catalog>("/api/admin/catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catalog),
    }),
  );
}
