/**
 * Analytics and consent, configured in one place and handed to the browser as JSON.
 *
 * Tiers (see new-site-workflow/references/trust-and-measurement.md):
 * - Cloudflare Web Analytics (PUBLIC_CF_BEACON_TOKEN): cookie-free, loads without a banner.
 * - Google Analytics 4 (PUBLIC_GA_ID) or Google Tag Manager (PUBLIC_GTM_ID): need the visitor's
 *   consent. `consent-mode` (the default) loads the tag with every Google Consent Mode v2 type
 *   denied, so only cookieless pings go out until the visitor agrees; `strict` does not load the tag
 *   at all until then.
 * Tags load only on PUBLIC_ANALYTICS_HOSTS (comma-separated production hostnames), never on
 * previews, staging or local builds. Bump `version` to ask every visitor again.
 */

export type ConsentMode = 'consent-mode' | 'strict';
export type ConsentCategory = 'analytics' | 'marketing';

/** Google Consent Mode v2 storage types each category grants. */
export const CATEGORY_TYPES: Record<ConsentCategory, string[]> = {
  analytics: ['analytics_storage'],
  marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
};

export interface AnalyticsInput {
  gaId?: string | null;
  gtmId?: string | null;
  cloudflareToken?: string | null;
  /** Production hostnames; tags load nowhere else. Empty means nowhere (safe default). */
  hosts?: string[] | string | null;
  mode?: ConsentMode;
  version?: number;
  /** Categories the banner offers; analytics alone by default. */
  categories?: ConsentCategory[];
}

const GA = /^G-[A-Z0-9]{4,20}$/;
const GTM = /^GTM-[A-Z0-9]{4,12}$/;
const TOKEN = /^[a-f0-9]{32}$/i;

const list = (value: AnalyticsInput['hosts']) =>
  (Array.isArray(value) ? value : String(value ?? '').split(','))
    .map(host => host.trim().toLowerCase())
    .filter(host => /^[a-z0-9.-]+$/.test(host));

/** The browser's configuration, or null when nothing is configured (render nothing). */
export function analyticsConfig(input: AnalyticsInput) {
  const gaId = input.gaId && GA.test(input.gaId) ? input.gaId : null;
  const gtmId = input.gtmId && GTM.test(input.gtmId) ? input.gtmId : null;
  const cloudflareToken = input.cloudflareToken && TOKEN.test(input.cloudflareToken) ? input.cloudflareToken : null;
  if (!gaId && !gtmId && !cloudflareToken) return null;
  const categories = (input.categories?.length ? input.categories : ['analytics']).filter((c): c is ConsentCategory => c in CATEGORY_TYPES);
  return {
    gaId,
    gtmId,
    cloudflareToken,
    hosts: list(input.hosts),
    mode: input.mode === 'strict' ? 'strict' as const : 'consent-mode' as const,
    version: Number.isInteger(input.version) && (input.version as number) > 0 ? input.version as number : 1,
    storageKey: 'baseline-consent',
    categories,
    types: Object.fromEntries(categories.map(c => [c, CATEGORY_TYPES[c]])),
    needsConsent: Boolean(gaId || gtmId),
  };
}

export type AnalyticsConfig = NonNullable<ReturnType<typeof analyticsConfig>>;

/** Consent Mode values for a set of granted categories; everything else stays denied. */
export function consentState(granted: Partial<Record<ConsentCategory, boolean>>) {
  const state: Record<string, 'granted' | 'denied'> = {};
  for (const [category, types] of Object.entries(CATEGORY_TYPES)) {
    for (const type of types) state[type] = granted[category as ConsentCategory] ? 'granted' : 'denied';
  }
  return state;
}

/** A stored choice, or null when it is missing, malformed or from an older consent version. */
export function readStoredChoice(raw: string | null, version: number): Partial<Record<ConsentCategory, boolean>> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== version || typeof parsed.categories !== 'object') return null;
    return Object.fromEntries(Object.keys(CATEGORY_TYPES).map(c => [c, parsed.categories[c] === true]));
  } catch { return null; }
}

/** `data-track-*` attributes as event parameters: prefix dropped, dashes to underscores, numbers as numbers. */
export function trackParams(attributes: Iterable<{ name: string; value: string }>) {
  const params: Record<string, string | number> = {};
  for (const { name, value } of attributes) {
    if (!name.startsWith('data-track-')) continue;
    const key = name.slice('data-track-'.length).replace(/-/g, '_');
    if (key) params[key] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  }
  return params;
}
