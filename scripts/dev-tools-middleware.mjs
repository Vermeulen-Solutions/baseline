/** Reserved production paths: never let a CMS catch-all resolve a developer fixture. */
export function onRequest({ url }, next) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return next(); }
  if (['/_styleguide', '/_form-recovery'].includes(pathname.replace(/\/+$/, ''))) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  }
  return next();
}
