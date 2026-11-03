import { resolveFeedUrl, escapeXml } from './publication-feed.ts';

export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export interface SitemapAlternate {
  lang: string;
  url: string;
}

export interface SitemapItem {
  url: string;
  lastModified?: Date | string | number;
  changeFrequency?: ChangeFrequency;
  priority?: number;
  alternates?: SitemapAlternate[];
}

export interface SitemapOptions {
  siteUrl: string | URL;
  items: SitemapItem[];
}

/** Formats a Date as a W3C Datetime string (ISO-8601). */
export function formatW3cDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid date for sitemap.');
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Generates a compliant XML sitemap 0.9 document with xhtml alternate language support. */
export function generateSitemapXml(options: SitemapOptions): string {
  const { siteUrl, items } = options;

  const urlElements = items.map(item => {
    const loc = resolveFeedUrl(item.url, siteUrl);
    const lines = [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
    ];

    if (item.lastModified) {
      lines.push(`    <lastmod>${formatW3cDate(item.lastModified)}</lastmod>`);
    }

    if (item.changeFrequency) {
      lines.push(`    <changefreq>${escapeXml(item.changeFrequency)}</changefreq>`);
    }

    if (typeof item.priority === 'number' && Number.isFinite(item.priority)) {
      const clamped = Math.max(0.0, Math.min(1.0, item.priority));
      lines.push(`    <priority>${clamped.toFixed(1)}</priority>`);
    }

    if (item.alternates && Array.isArray(item.alternates)) {
      for (const alt of item.alternates) {
        const altUrl = resolveFeedUrl(alt.url, siteUrl);
        lines.push(`    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.lang)}" href="${escapeXml(altUrl)}"/>`);
      }
    }

    lines.push('  </url>');
    return lines.join('\n');
  });

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  if (urlElements.length > 0) {
    lines.push(...urlElements);
  }

  lines.push('</urlset>');
  return lines.join('\n') + '\n';
}
