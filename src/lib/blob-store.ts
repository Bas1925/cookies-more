import "server-only";

import { getStore, type Store } from "@netlify/blobs";

/**
 * Netlify Blobs is only wired up inside the Netlify runtime, where the
 * platform injects the store credentials. Running `next dev` locally there is
 * no blobs context, so every caller falls back to the filesystem and keeps
 * editing `data/*.json` the way it always has.
 *
 * Returns null when blobs are unavailable — callers must handle that branch.
 */
function blobsAvailable() {
  return Boolean(process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY);
}

/**
 * Netlify kills a function at its time limit and shows its own error page,
 * which our pages and the admin cannot catch or explain. Every request gives
 * up on storage before that, so it can answer "busy" itself and the caller can
 * retry. Anything that tripped this may still finish in the background; every
 * write we make is safe to repeat.
 */
export const REQUEST_BUDGET_MS = 8_000;

export class StoreBusyError extends Error {
  constructor() {
    super("Storage is busy — try again in a moment");
    this.name = "StoreBusyError";
  }
}

export function isStoreBusy(error: unknown): error is StoreBusyError {
  return error instanceof StoreBusyError;
}

/** Rejects with StoreBusyError if `work` is not done by `deadline` (epoch ms). */
export function beforeDeadline<T>(work: Promise<T>, deadline: number): Promise<T> {
  const ms = deadline - Date.now();
  if (ms <= 0) return Promise.reject(new StoreBusyError());
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    work,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new StoreBusyError()), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/** One request's budget: `within(work)` shares a single deadline across calls. */
export function requestDeadline(budgetMs = REQUEST_BUDGET_MS) {
  const deadline = Date.now() + budgetMs;
  return {
    within: <T,>(work: Promise<T>) => beforeDeadline(work, deadline),
    remaining: () => deadline - Date.now(),
  };
}

/**
 * Built fresh on every call — never cache the Store. It captures the access
 * token of the request that created it, and a warm function outlives that
 * token: on Sep 24 the admin's poll kept one instance alive for over an hour,
 * its cached store's token expired ("Failed to decode token: Token expired"),
 * and every save and page failed until the instance was recycled.
 * getStore() is cheap; it only reads the current request's context.
 */
export function tryGetStore(name: string): Store | null {
  if (!blobsAvailable()) return null;
  try {
    // Strong consistency: an admin who just saved must see their own write
    // on the next request, and a placed order must never read back stale.
    return getStore({ name, consistency: "strong" });
  } catch {
    return null;
  }
}
