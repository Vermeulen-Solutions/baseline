import memoryFactory from 'astro/cache/memory';

const IMMUTABLE_IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

function isImmutableMediaPath(pathname) {
  return pathname === '/_image' || pathname.startsWith('/_emdash/api/media/file/');
}

function getEdgeCache(customCache) {
  if (customCache) return customCache;
  return typeof caches !== 'undefined' && caches?.default ? caches.default : null;
}

/**
 * Cloudflare Worker + Node cache provider with pre-lookup private request bypass,
 * Workers Cache API (`caches.default`) storage for anonymous public HTML on `*.workers.dev`,
 * and immutable edge/browser caching for `/_image` and `/_emdash/api/media/file/*`.
 */
export default function cloudflareCacheProvider(config = {}) {
  const baseFactory = typeof config.baseProviderFactory === 'function' ? config.baseProviderFactory : memoryFactory;
  const provider = baseFactory(config);
  const resolveCache = () => getEdgeCache(config.edgeCache);

  return {
    ...provider,
    async onRequest(context, next) {
      const request = context.request;
      const url = new URL(request.url);
      const edgeCache = resolveCache();

      if ((request.method === 'GET' || request.method === 'HEAD') && isImmutableMediaPath(url.pathname)) {
        const cacheKey = new Request(url.toString(), { method: 'GET' });
        if (edgeCache) {
          try {
            const cached = await edgeCache.match(cacheKey);
            if (cached) {
              const headers = new Headers(cached.headers);
              headers.set('Cache-Control', IMMUTABLE_IMAGE_CACHE_CONTROL);
              headers.set('X-Astro-Cache', 'HIT');
              return new Response(request.method === 'HEAD' ? null : cached.body, {
                status: cached.status,
                statusText: cached.statusText,
                headers,
              });
            }
          } catch {}
        }
        const response = await next();
        if (response.status === 200) {
          const headers = new Headers(response.headers);
          headers.set('Cache-Control', IMMUTABLE_IMAGE_CACHE_CONTROL);
          headers.delete('CDN-Cache-Control');
          headers.delete('Cloudflare-CDN-Cache-Control');
          const cacheable = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
          if (edgeCache && request.method === 'GET') {
            try {
              await edgeCache.put(cacheKey, cacheable.clone());
            } catch {}
          }
          return cacheable;
        }
        return response;
      }

      if (
        request.method !== 'GET' ||
        request.headers.has('authorization') ||
        request.headers.has('cookie') ||
        url.search
      ) {
        return next();
      }

      const cacheKey = new Request(url.toString(), { method: 'GET' });
      if (edgeCache) {
        try {
          const cached = await edgeCache.match(cacheKey);
          if (cached) {
            const headers = new Headers(cached.headers);
            headers.set('X-Astro-Cache', 'HIT');
            headers.set('Cache-Control', 'no-cache');
            headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
            headers.delete('CDN-Cache-Control');
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers,
            });
          }
        } catch {}
      }

      const response = await provider.onRequest(context, next);

      if (edgeCache && response.status === 200 && !response.headers.has('set-cookie')) {
        const cdnControl = response.headers.get('CDN-Cache-Control') || response.headers.get('Cache-Control') || '';
        const maxAgeMatch = cdnControl.match(/max-age=(\d+)/);
        const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 0;
        if (maxAge > 0 && !cdnControl.includes('private') && !cdnControl.includes('no-store')) {
          const headers = new Headers(response.headers);
          const toStore = new Response(response.clone().body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
          toStore.headers.set('Cache-Control', `public, max-age=${maxAge}`);
          toStore.headers.delete('CDN-Cache-Control');
          toStore.headers.delete('Cloudflare-CDN-Cache-Control');
          try {
            await edgeCache.put(cacheKey, toStore);
          } catch {}

          const clientHeaders = new Headers(response.headers);
          clientHeaders.set('Cache-Control', 'no-cache');
          clientHeaders.set('Cloudflare-CDN-Cache-Control', 'no-store');
          clientHeaders.delete('CDN-Cache-Control');
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: clientHeaders,
          });
        }
      }

      return response;
    },
  };
}
