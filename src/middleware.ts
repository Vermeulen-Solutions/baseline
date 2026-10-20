import { defineMiddleware } from 'astro:middleware';
import { normalizedPageLocation } from './lib/page-url';

export const onRequest = defineMiddleware(async (context, next) => {
  if (import.meta.env.NORMALIZE_PAGE_URLS === '1') {
    const location = normalizedPageLocation(context.url, context.request.method);
    if (location) return context.redirect(location, 301);
  }
  const response = await next();
  if (context.url.pathname === '/robots.txt' && response.status === 200) {
    // Native 1.3 route uses 24h browser caching. Cap it without replacing its body.
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
});
