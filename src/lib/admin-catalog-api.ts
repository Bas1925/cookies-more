import type { Catalog } from "./types";

/**
 * Catalog calls from the admin panel, hardened for Netlify.
 *
 * When a function runs past its time limit or the platform is busy, Netlify
 * answers with its own HTML error page (502/503/504), not our JSON. Reading
 * that as JSON threw, the save never finished, and the admin was left on
 * "Saving…" or a raw server error. A PUT sends the whole catalogue, so
 * repeating it is safe: one quiet retry covers a momentary hiccup, and if the
 * server is still struggling the caller gets `busy` to show a calm message while
 * the admin's edits stay on screen.
 */

export type CatalogResult =
  | { ok: true; catalog: Catalog }
  | { ok: false; busy: boolean; error?: string };

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

async function attempt(init?: RequestInit): Promise<CatalogResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/admin/catalog", {
      cache: "no-store",
      ...init,
      signal: controller.signal,
    });
    const data = (await readJson(res)) as (Catalog & { error?: string }) | null;
    if (res.ok && data) return { ok: true, catalog: data };
    if (isServerBusy(res.status) || !data) return { ok: false, busy: true };
    return { ok: false, busy: false, error: data.error };
  } catch {
    // Network drop or our own timeout.
    return { ok: false, busy: true };
  } finally {
    window.clearTimeout(timer);
  }
}

async function withRetry(init?: RequestInit): Promise<CatalogResult> {
  const first = await attempt(init);
  if (first.ok || !first.busy) return first;
  await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS));
  return attempt(init);
}

export function loadCatalog(): Promise<CatalogResult> {
  return withRetry();
}

export function saveCatalog(catalog: Catalog): Promise<CatalogResult> {
  return withRetry({
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(catalog),
  });
}
