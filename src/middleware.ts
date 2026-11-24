import { defineMiddleware } from 'astro:middleware';
import type { APIContext, MiddlewareNext } from 'astro';
import { normalizedPageLocation } from './lib/page-url';
import { robotsCacheControl } from './lib/robots-cache';
import { withSecurityHeaders } from './lib/security-headers';
import { isMediaPath, serveMedia } from './lib/media-edge-cache.mjs';
import { cspMode, parseSources, withContentSecurityPolicy } from './lib/content-security-policy';

const handle = async (context: APIContext, next: MiddlewareNext): Promise<Response> => {
  if (import.meta.env.NORMALIZE_PAGE_URLS === '1') {
    const location = normalizedPageLocation(context.url, context.request.method);
    if (location) return context.redirect(location, 301);
  }
  // Media keeps EmDash's browser header (images can be replaced under the same URL); on Workers an edge
  // copy saves the transform for up to an hour (src/lib/media-edge-cache.mjs).
  if (isMediaPath(context.url.pathname) && ['GET', 'HEAD'].includes(context.request.method)) {
    const edgeCache = typeof caches !== 'undefined' && (caches as any).default ? (caches as any).default : null;
    const ctx = (context.locals as any)?.runtime?.ctx;
    const waitUntil = typeof ctx?.waitUntil === 'function' ? ctx.waitUntil.bind(ctx) : undefined;
    return serveMedia(context.request, next, { edgeCache, waitUntil });
  }
  const response = await next();
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
