import type { CreatePublicPageContextInput } from 'emdash/page';
import { openingHoursSpecification, type OpeningHours } from './opening-hours.ts';

export type { OpeningHours } from './opening-hours.ts';

function httpUrl(value: string, siteUrl: string): string | undefined {
  try {
    const url = new URL(value, siteUrl);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

/** Additive graphs only: EmDash retains ownership of WebSite/BlogPosting. */
export function breadcrumbGraph(breadcrumbs: CreatePublicPageContextInput['breadcrumbs'], siteUrl: string) {
  if (!breadcrumbs || breadcrumbs.length < 2) return undefined;
  const items = breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem', position: index + 1, name: crumb.name.trim(), item: httpUrl(crumb.url, siteUrl),
  }));
  if (items.some(item => !item.name || !item.item)) return undefined;
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

/** Facts about the business that EmDash settings do not hold, set once in astro.config.mjs. */
export interface OrganizationDetails {
  /** A more specific schema.org type, e.g. 'LocalBusiness', 'ProfessionalService', 'Dentist', or a list. */
  type?: string | string[];
  telephone?: string;
  email?: string;
  address?: { streetAddress?: string; postalCode?: string; addressLocality?: string; addressRegion?: string; addressCountry?: string };
  /** Places served, as names ('Geneva', 'Switzerland'). */
  areaServed?: string[];
  /** Profile URLs beyond the social settings, e.g. the Google Business Profile. */
  sameAs?: string[];
  priceRange?: string;
  /** Regular opening hours, on the 24-hour clock; the Hours component renders the same list. */
  openingHours?: OpeningHours[];
}


// EmDash's social settings hold usernames ("Your Instagram username"). A full URL is kept as is; a
// handle becomes the profile URL where the platform's address is unambiguous. LinkedIn is left out
// unless given as a URL: a handle cannot tell a person's page from a company's.
const PROFILE_BASE: Record<string, (handle: string) => string> = {
  twitter: handle => `https://x.com/${handle}`,
  github: handle => `https://github.com/${handle}`,
  facebook: handle => `https://www.facebook.com/${handle}`,
  instagram: handle => `https://www.instagram.com/${handle}`,
  youtube: handle => `https://www.youtube.com/@${handle}`,
};

export function socialProfiles(social: Record<string, unknown> | null | undefined): string[] {
  const urls: string[] = [];
  for (const [platform, raw] of Object.entries(social ?? {})) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const value = raw.trim();
    if (/^https?:\/\//i.test(value)) { const url = httpUrl(value, value); if (url) urls.push(url); continue; }
    const handle = value.replace(/^@/, '');
    if (PROFILE_BASE[platform] && /^[A-Za-z0-9._-]{1,100}$/.test(handle)) urls.push(PROFILE_BASE[platform](handle));
  }
  return [...new Set(urls)];
}

const schemaType = (value: unknown): value is string => typeof value === 'string' && /^[A-Z][A-Za-z]{1,60}$/.test(value);
const text = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value.trim() : undefined;

export function organizationGraph(name: string, siteUrl: string, logo?: string, details: OrganizationDetails & { social?: Record<string, unknown> | null } = {}) {
  const url = httpUrl(siteUrl, siteUrl);
  if (!name.trim() || !url) return undefined;
  const types = [details.type ?? 'Organization'].flat().filter(schemaType);
  const sameAs = [...new Set([...socialProfiles(details.social), ...(details.sameAs ?? []).map(value => httpUrl(value, url)).filter((value): value is string => Boolean(value))])];
  const address = Object.fromEntries(Object.entries(details.address ?? {}).map(([key, value]) => [key, text(value)]).filter(([, value]) => value));
  const areaServed = (details.areaServed ?? []).map(text).filter(Boolean);
  return {
    '@context': 'https://schema.org', '@type': types.length === 1 ? types[0] : types.length ? types : 'Organization',
    '@id': `${new URL(url).origin}/#organization`, name: name.trim(), url,
    ...(logo && httpUrl(logo, url) ? { logo: httpUrl(logo, url) } : {}),
    ...(text(details.telephone) ? { telephone: text(details.telephone) } : {}),
    ...(text(details.email) ? { email: text(details.email) } : {}),
    ...(Object.keys(address).length ? { address: { '@type': 'PostalAddress', ...address } } : {}),
    ...(areaServed.length ? { areaServed: areaServed.map(place => ({ '@type': 'Place', name: place })) } : {}),
    ...(text(details.priceRange) ? { priceRange: text(details.priceRange) } : {}),
    ...(openingHoursSpecification(details.openingHours).length ? { openingHoursSpecification: openingHoursSpecification(details.openingHours) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function taxonomyRobots(entryCount: number): string | undefined {
  return entryCount === 0 ? 'noindex, follow' : undefined;
}
