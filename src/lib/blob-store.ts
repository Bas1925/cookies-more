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
const cache = new Map<string, Store | null>();

function blobsAvailable() {
  return Boolean(process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY);
}

export function tryGetStore(name: string): Store | null {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  let store: Store | null = null;
  if (blobsAvailable()) {
    try {
      // Strong consistency: an admin who just saved must see their own write
      // on the next request, and a placed order must never read back stale.
      store = getStore({ name, consistency: "strong" });
    } catch {
      store = null;
    }
  }

  cache.set(name, store);
  return store;
}
