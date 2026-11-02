/** Request-owned evidence only. The feed SDK remains the protocol validator. */
export interface PublicFeedCacheState {
  startedAt: number;
  feeds: { ok: true; cache?: any }[];
  boundaries: string[];
  failed: boolean;
}
export interface PublicFeedCacheOptions { tags: string[]; maxAge: number; swr: 0 }
export type PublicFeedCacheResolver = (feeds: readonly { ok: true; cache?: any }[], options: { maxAge: number; now: number; boundaries: readonly string[] }) => false | PublicFeedCacheOptions;

export function createPublicFeedCacheState(now = Date.now()): PublicFeedCacheState {
  return { startedAt: now, feeds: [], boundaries: [], failed: !Number.isFinite(now) };
}

export function recordPublicFeed(state: PublicFeedCacheState | undefined, feed: { ok: boolean; cache?: unknown }, boundaries: readonly string[] = []): void {
  if (!state) return;
  if (feed.ok !== true) { state.failed = true; return; }
  try {
    state.feeds.push(structuredClone({ ok: true, cache: feed.cache }));
    state.boundaries.push(...boundaries);
  } catch { state.failed = true; }
}

/** Call after all HTML rendering, inside the host's final eligible-response guard. */
export function finalizePublicFeedCache(state: PublicFeedCacheState | undefined, resolve: PublicFeedCacheResolver, maxAge: number, now = Date.now()): false | PublicFeedCacheOptions {
  if (!state || state.failed || !state.feeds.length || !Number.isFinite(now) || now < state.startedAt || !Number.isFinite(maxAge) || maxAge < 1) return false;
  try {
    const pageExpiry = state.startedAt + maxAge * 1000;
    const result = resolve(state.feeds, { maxAge, now, boundaries: [...state.boundaries, new Date(pageExpiry).toISOString()] });
    if (!result || result.swr !== 0 || !Number.isInteger(result.maxAge) || result.maxAge < 1 || result.maxAge > Math.floor((pageExpiry - now) / 1000) ||
      !Array.isArray(result.tags) || !result.tags.length || !result.tags.every(tag => typeof tag === 'string' && tag.length > 0 && !/[\r\n,]/.test(tag))) return false;
    return { tags: [...new Set(result.tags)], maxAge: result.maxAge, swr: 0 };
  } catch { return false; }
}
