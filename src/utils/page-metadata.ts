import type { BylineSummary } from 'emdash';
import type { CreatePublicPageContextInput } from 'emdash/page';

/** Default public origin only. Explicit editor canonicals stay in EmDash's resolver. */
export function resolvePublicSiteUrl(settingsUrl: string | null | undefined, configuredSite: URL | undefined, requestUrl: URL): string {
  const configured = settingsUrl?.trim() || configuredSite?.href;
  const url = configured ? new URL(configured) : requestUrl;
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('The public site URL must be an absolute HTTP(S) URL without credentials.');
  }
  return url.origin;
}

/** The request pathname cannot replace the configured origin (including a leading //). */
export function defaultCanonicalUrl(siteUrl: string, pathname: string): string {
  const url = new URL(siteUrl);
  url.pathname = pathname.replace(/\/$/, '') || '/';
  url.search = '';
  url.hash = '';
  return url.href;
}

/** Use hydrated entry facts; never infer an author or publication time from site identity. */
export function articleMetadata(entry: {
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  byline?: Pick<BylineSummary, 'displayName'> | null;
}): NonNullable<CreatePublicPageContextInput['articleMeta']> {
  const iso = (date?: Date | null) => date && Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
  return {
    publishedTime: iso(entry.publishedAt),
    modifiedTime: iso(entry.updatedAt),
    author: entry.byline?.displayName.trim() || undefined,
  };
}
