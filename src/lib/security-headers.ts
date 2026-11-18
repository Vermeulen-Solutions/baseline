/**
 * Conservative response headers for every Baseline route. Each header is only added when the
 * response does not already carry it, so a route, plugin, EmDash itself or a site-specific
 * middleware stays in charge of its own policy. A reverse proxy can still override them.
 *
 * Deliberately absent: a script/style Content-Security-Policy (EmDash's editor and plugins need
 * their own sources, so a site owns that decision), HSTS (only the TLS terminator knows the
 * response is served over HTTPS) and Cross-Origin-Opener-Policy (it severs sign-in popups).
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
});

/** Pages may be framed by this origin only (the editor's preview); other sites cannot frame them. */
export const HTML_FRAME_POLICY = "frame-ancestors 'self'";

/** Which headers to add to a response; empty when nothing is missing or the response is exempt. */
export function missingSecurityHeaders(status: number, headers: Headers): Array<[string, string]> {
  // Informational and protocol-switch responses (the co-editing WebSocket upgrade) are never rewritten.
  if (status < 200 || status > 599 || headers.has('Upgrade')) return [];
  const missing: Array<[string, string]> = Object.entries(SECURITY_HEADERS).filter(([name]) => !headers.has(name));
  const isHtml = headers.get('Content-Type')?.toLowerCase().includes('text/html') ?? false;
  if (isHtml && !headers.has('Content-Security-Policy') && !headers.has('X-Frame-Options')) {
    missing.push(['Content-Security-Policy', HTML_FRAME_POLICY]);
  }
  return missing;
}

/** Returns the response with any missing security headers, copying it only when headers are immutable. */
export function withSecurityHeaders(response: Response): Response {
  const missing = missingSecurityHeaders(response.status, response.headers);
  if (!missing.length) return response;
  try {
    for (const [name, value] of missing) response.headers.set(name, value);
    return response;
  } catch {
    // Responses from fetch() or Response.redirect() have immutable headers.
    const headers = new Headers(response.headers);
    for (const [name, value] of missing) headers.set(name, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
}
