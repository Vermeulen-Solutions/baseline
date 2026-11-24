// Edge cache for media on Cloudflare Workers: transformed `/_image` variants, original files under
// `/_emdash/api/media/file/*`, and plugin image routes ending in `/publicEventImage`.
//
// Media URLs are stable but not immutable: EmDash's "Replace original" writes new bytes under the same
// storage key, so every URL of that image stays the same. EmDash sends `public, max-age=0, must-revalidate`
// with validators for those files and purges its own route-cache tag on replace or delete. This cache
// therefore never overrides the header the visitor's browser receives, and keeps its edge copy for
// MEDIA_EDGE_MAX_AGE only: a replaced image shows everywhere within that time, while repeated requests
// within it skip the image transform. It never uses the in-isolate memory cache (Workers memory is small).

/** Seconds an edge copy of a media response is served before the origin is asked again. */
export const MEDIA_EDGE_MAX_AGE = 3600;

const ORIGIN_CACHE_CONTROL = 'X-Origin-Cache-Control';

export function isMediaPath(pathname) {
  return pathname === '/_image' || pathname.startsWith('/_emdash/api/media/file/') || pathname.endsWith('/publicEventImage');
}

/**
 * Serve a GET or HEAD media request from the edge cache, or from `next()` and store a copy.
 * `edgeCache` is `caches.default` (or a test double); without one the request passes through untouched.
 * `waitUntil`, when given, keeps the store alive after the response is returned.
 */
export async function serveMedia(request, next, { edgeCache, waitUntil } = {}) {
  if (!edgeCache || !['GET', 'HEAD'].includes(request.method)) return next();
  const key = new Request(request.url, { method: 'GET' });
  try {
    const cached = await edgeCache.match(key);
    if (cached) {
      const headers = new Headers(cached.headers);
      const origin = headers.get(ORIGIN_CACHE_CONTROL);
      if (origin) headers.set('Cache-Control', origin);
      else headers.delete('Cache-Control');
      headers.delete(ORIGIN_CACHE_CONTROL);
      headers.set('X-Astro-Cache', 'HIT');
      return new Response(request.method === 'HEAD' ? null : cached.body, { status: cached.status, statusText: cached.statusText, headers });
    }
  } catch {}

  const response = await next();
  if (response.status !== 200 || request.method !== 'GET') return response;
  const body = await response.arrayBuffer();
  const stored = new Headers(response.headers);
  const origin = response.headers.get('Cache-Control');
  if (origin) stored.set(ORIGIN_CACHE_CONTROL, origin);
  stored.set('Cache-Control', `public, max-age=${MEDIA_EDGE_MAX_AGE}`);
  stored.delete('CDN-Cache-Control');
  stored.delete('Cloudflare-CDN-Cache-Control');
  stored.delete('Set-Cookie');
  try {
    const put = edgeCache.put(key, new Response(body, { status: 200, statusText: response.statusText, headers: stored }));
    if (typeof waitUntil === 'function') waitUntil(put);
    else put?.catch?.(() => {});
  } catch {}
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
}
