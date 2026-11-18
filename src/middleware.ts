import { defineMiddleware } from 'astro:middleware';
import type { APIContext, MiddlewareNext } from 'astro';
import { normalizedPageLocation } from './lib/page-url';
import { robotsCacheControl } from './lib/robots-cache';
import { withSecurityHeaders } from './lib/security-headers';
import { cspMode, parseSources, withContentSecurityPolicy } from './lib/content-security-policy';

const IMMUTABLE_MEDIA_CACHE = 'public, max-age=31536000, immutable';

const handle = async (context: APIContext, next: MiddlewareNext): Promise<Response> => {
  if (import.meta.env.NORMALIZE_PAGE_URLS === '1') {
    const location = normalizedPageLocation(context.url, context.request.method);
    if (location) return context.redirect(location, 301);
  }
  const isMediaRoute = ['GET', 'HEAD'].includes(context.request.method) &&
    (context.url.pathname === '/_image' ||
      context.url.pathname.startsWith('/_emdash/api/media/file/') ||
      context.url.pathname.endsWith('/publicEventImage'));
  const edgeCache = typeof caches !== 'undefined' && (caches as any).default ? (caches as any).default : null;
  if (isMediaRoute && edgeCache && context.request.method === 'GET') {
    try {
      const cached = await edgeCache.match(context.request.url);
      if (cached) {
        const headers = new Headers(cached.headers);
        headers.set('Cache-Control', IMMUTABLE_MEDIA_CACHE);
        headers.delete('CDN-Cache-Control');
        headers.delete('Cloudflare-CDN-Cache-Control');
        headers.set('X-Astro-Cache', 'HIT');
        return new Response(cached.body, { status: cached.status, statusText: cached.statusText, headers });
      }
    } catch {}
  }
  const response = await next();
  if (isMediaRoute && response.status === 200) {
    const body = edgeCache && context.request.method === 'GET' ? await response.arrayBuffer() : response.body;
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', IMMUTABLE_MEDIA_CACHE);
    headers.delete('CDN-Cache-Control');
    headers.delete('Cloudflare-CDN-Cache-Control');
    const out = new Response(body, { status: response.status, statusText: response.statusText, headers });
    if (edgeCache && context.request.method === 'GET') {
      try {
        const putPromise = edgeCache.put(context.request.url, out.clone());
        const waitUntil = (context.locals as any)?.runtime?.ctx?.waitUntil;
        if (typeof waitUntil === 'function') waitUntil(putPromise);
        else putPromise.catch(() => {});
      } catch {}
    }
    return out;
  }
  if (context.url.pathname === '/robots.txt' && response.status === 200) {
    // Cap the native 24h cache without replacing the body; keep the staging no-store (see robots-cache.ts).
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', robotsCacheControl(response.headers.get('Cache-Control')));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  if (['GET', 'HEAD'].includes(context.request.method) && response.status === 200 && response.headers.get('content-type')?.includes('text/html') && !response.headers.has('Cache-Control') && !response.headers.has('Set-Cookie') && !context.url.pathname.startsWith('/_') && !context.url.pathname.startsWith('/api/')) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-cache');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
};

// Every response leaves with the baseline security headers it does not already set (src/lib/security-headers.ts).
// Off unless the build sets CSP_MODE=report or enforce (see src/lib/content-security-policy.ts).
const CSP_MODE = cspMode(import.meta.env.CSP_MODE);
const CSP_EXTRA = parseSources(import.meta.env.CSP_SOURCES);

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await withContentSecurityPolicy(await handle(context, next), {
    mode: CSP_MODE,
    pathname: context.url.pathname,
    method: context.request.method,
    cookie: context.request.headers.get('cookie'),
    extra: CSP_EXTRA,
  });
  return withSecurityHeaders(response);
});
