/**
 * A Content-Security-Policy computed from the page itself.
 *
 * Every inline <script> and <style> a public HTML response actually carries is hashed, so the
 * policy allows exactly those and nothing injected later, without 'unsafe-inline' for scripts.
 * Style attributes stay allowed (style-src-attr): Baseline sets layout values with them, and they
 * cannot run code.
 *
 * Off by default. CSP_MODE=report (build environment) sends Content-Security-Policy-Report-Only,
 * which blocks nothing: violations reach the browser console and `npm run check:quality`. Once
 * the reports are clean, CSP_MODE=enforce sends the same policy as Content-Security-Policy.
 * CSP_SOURCES adds origins, for example
 *   CSP_SOURCES="script-src https://static.cloudflareinsights.com; connect-src https://cloudflareinsights.com; frame-src https://www.youtube-nocookie.com"
 *
 * Skipped: the EmDash admin and API (/_emdash/*, whose editor needs eval), signed-in or editing
 * requests (the visual editor injects its own scripts), responses that already carry a policy (a
 * route, plugin or proxy wins), non-HTML, HEAD and bodiless responses.
 */

export type CspMode = 'off' | 'report' | 'enforce';

export function cspMode(value: unknown): CspMode {
  return value === 'report' || value === 'enforce' ? value : 'off';
}

// Script types a browser runs or treats as script-src content. JSON-LD and other data blocks are
// never executed and CSP ignores them.
const EXECUTED_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module', 'speculationrules', 'importmap']);

/** Inline script and style contents as the browser hashes them (CRLF and lone CR become LF). */
export function inlineBlocks(html: string): { scripts: string[]; styles: string[] } {
  const text = html.replace(/<!--[\s\S]*?-->/g, '');
  const scripts: string[] = [];
  const styles: string[] = [];
  for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = match[1];
    if (/\ssrc\s*=/i.test(attrs)) continue;
    const type = (/\stype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs)?.slice(1).find((v) => v !== undefined) ?? '').trim().toLowerCase();
    if (!EXECUTED_TYPES.has(type)) continue;
    scripts.push(match[2].replace(/\r\n?/g, '\n'));
  }
  for (const match of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) styles.push(match[1].replace(/\r\n?/g, '\n'));
  return { scripts, styles };
}

/** A CSP hash source ('sha256-…') for one inline block. */
export async function hashSource(content: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return `'sha256-${btoa(binary)}'`;
}

/** Extra sources: "directive source source; directive source". Refuses anything that could break the header. */
export function parseSources(value: unknown): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (typeof value !== 'string' || !value.trim()) return result;
  for (const part of value.split(';')) {
    const [directive, ...sources] = part.trim().split(/\s+/);
    if (!directive) continue;
    if (!/^[a-z][a-z-]*$/.test(directive)) throw new Error(`CSP_SOURCES: "${directive}" is not a directive name`);
    for (const source of sources) {
      if (!/^(?:'[a-z0-9+/=-]+'|[a-z][a-z0-9+.-]*:(?:\/\/[^\s,;'"]*)?|\*(?:\.[^\s,;'"]+)?|[a-z0-9.-]+\.[a-z]{2,}[^\s,;'"]*)$/i.test(source)) throw new Error(`CSP_SOURCES: "${source}" is not a source expression`);
    }
    result[directive] = [...(result[directive] ?? []), ...sources];
  }
  return result;
}

const BASE_POLICY: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'style-src-attr': ["'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'media-src': ["'self'", 'https:'],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
};

/** The policy text for a page's hashes plus the site's extra sources. */
export function buildPolicy(hashes: { scripts: string[]; styles: string[] }, extra: Record<string, string[]> = {}): string {
  const policy: Record<string, string[]> = {};
  for (const [directive, sources] of Object.entries(BASE_POLICY)) policy[directive] = [...sources];
  policy['script-src'].push(...hashes.scripts);
  policy['style-src'].push(...hashes.styles);
  for (const [directive, sources] of Object.entries(extra)) {
    // An explicit 'none' replaces the base list; anything else adds to it.
    policy[directive] = sources.includes("'none'") ? ["'none'"] : [...(policy[directive] ?? ["'self'"]), ...sources];
  }
  return Object.entries(policy).map(([directive, sources]) => `${directive} ${[...new Set(sources)].join(' ')}`).join('; ');
}

const SIGNED_IN = /(?:^|;\s*)(?:astro-session|emdash_session|emdash-edit-mode)=/;

export interface CspOptions {
  mode: CspMode;
  pathname: string;
  method: string;
  cookie?: string | null;
  extra?: Record<string, string[]>;
}

/** Whether a response gets a computed policy at all. */
export function cspApplies(response: Response, options: CspOptions): boolean {
  if (options.mode === 'off') return false;
  if (options.method !== 'GET') return false;
  if (options.pathname === '/_emdash' || options.pathname.startsWith('/_emdash/')) return false;
  if (options.cookie && SIGNED_IN.test(options.cookie)) return false;
  if (!response.body || response.status < 200 || response.status === 204 || (response.status >= 300 && response.status < 400)) return false;
  if (!/^text\/html\b/i.test(response.headers.get('content-type') ?? '')) return false;
  if (response.headers.has('content-security-policy') || response.headers.has('content-security-policy-report-only')) return false;
  return true;
}

/** The response with its computed policy, or the response unchanged when the policy does not apply. */
export async function withContentSecurityPolicy(response: Response, options: CspOptions): Promise<Response> {
  if (!cspApplies(response, options)) return response;
  const html = await response.text();
  const blocks = inlineBlocks(html);
  const hashes = {
    scripts: await Promise.all(blocks.scripts.map(hashSource)),
    styles: await Promise.all(blocks.styles.map(hashSource)),
  };
  const headers = new Headers(response.headers);
  headers.set(options.mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only', buildPolicy(hashes, options.extra));
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
