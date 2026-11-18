/**
 * Same-origin link prefetch through the browser's speculation rules.
 *
 * Chromium browsers fetch a likely next page ahead of the click and keep it in memory for that
 * navigation, whatever the page's Cache-Control says, so public HTML can stay `no-cache` (fresh
 * after every publish) and still open instantly. Other browsers ignore the block. It is JSON, not
 * script, and browsers already skip it under Data Saver or battery saver.
 *
 * Prefetch only, never prerender: a prerender runs the page (analytics, scripts) before the
 * visitor arrives and costs a full render on the server.
 */

/** 'moderate': after a short hover on desktop (on mobile, also links in view). 'conservative': only once a click or tap starts. */
export type PrefetchEagerness = 'off' | 'conservative' | 'moderate';

/** Paths never prefetched: Baseline and EmDash internals, APIs and admin screens. Same list as the ClientRouter warm-up. */
export const PREFETCH_EXCLUDED_PATHS = ['/_*', '/api/*', '/admin*'] as const;

/** Links never prefetched: opt-outs, reloads, downloads, other targets, and URLs with a query or fragment. */
export const PREFETCH_EXCLUDED_LINKS = [
  '[data-astro-prefetch="false"]',
  '[data-astro-prefetch="false"] a',
  '[data-astro-reload]',
  '[download]',
  '[target]:not([target="_self"])',
  '[href*="?"]',
  '[href*="#"]',
].join(', ');

/** The speculation rules JSON for an inline `<script type="speculationrules">`, or null when off. */
export function speculationRules(eagerness: PrefetchEagerness): string | null {
  if (eagerness !== 'moderate' && eagerness !== 'conservative') return null;
  const rules = {
    prefetch: [
      {
        source: 'document',
        where: {
          and: [
            { href_matches: '/*' },
            ...PREFETCH_EXCLUDED_PATHS.map((path) => ({ not: { href_matches: path } })),
            { not: { selector_matches: PREFETCH_EXCLUDED_LINKS } },
          ],
        },
        eagerness,
      },
    ],
  };
  // Escaped so the JSON can never close its own <script> element.
  return JSON.stringify(rules).replace(/</g, '\\u003c');
}
