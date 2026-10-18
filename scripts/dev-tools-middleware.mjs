/** Reserved production path: never let a CMS catch-all resolve a styleguide slug. */
export function onRequest({ url }, next) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return next(); }
  if (pathname.replace(/\/+$/, '') === '/_styleguide') {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  }
  return next();
}
