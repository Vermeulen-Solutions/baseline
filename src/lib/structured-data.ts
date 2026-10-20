import type { CreatePublicPageContextInput } from 'emdash/page';

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

export function organizationGraph(name: string, siteUrl: string, logo?: string) {
  const url = httpUrl(siteUrl, siteUrl);
  if (!name.trim() || !url) return undefined;
  return {
    '@context': 'https://schema.org', '@type': 'Organization',
    '@id': `${new URL(url).origin}/#organization`, name: name.trim(), url,
    ...(logo && httpUrl(logo, url) ? { logo: httpUrl(logo, url) } : {}),
  };
}

export function taxonomyRobots(entryCount: number): string | undefined {
  return entryCount === 0 ? 'noindex, follow' : undefined;
}
