export interface RssFeedItem {
  title: string;
  link: string;
  description?: string;
  pubDate: Date | string | number;
  author?: string;
  guid?: string;
  categories?: string[];
}

export interface RssFeedOptions {
  title: string;
  description: string;
  siteUrl: string | URL;
  basePath?: string;
  channelLink?: string;
  feedPath?: string;
  language?: string;
  items: RssFeedItem[];
}

export interface PublicationEligibilityOptions {
  now?: Date;
  includeScheduled?: boolean;
}

/** Determines whether a content item is eligible for public feeds and sitemaps. */
export function isPublicationEligible(
  entry: { draft?: boolean; publishedAt?: Date | string | number | null },
  options: PublicationEligibilityOptions = {}
): boolean {
  if (!entry || entry.draft === true) return false;
  if (!entry.publishedAt) return false;
  const date = new Date(entry.publishedAt);
  if (!Number.isFinite(date.getTime())) return false;
  if (!options.includeScheduled) {
    const reference = options.now ? options.now.getTime() : Date.now();
    if (date.getTime() > reference) return false;
  }
  return true;
}

/** Escapes XML special characters and strips invalid XML 1.0 characters. */
export function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  // Strip unpaired / isolated surrogates
  str = str.replace(/(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/g, '');
  if (typeof str.toWellFormed === 'function') {
    str = str.toWellFormed();
  }
  // XML 1.0 5th edition Char grammar:
  // Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
  const clean = str.replace(/[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '');
  return clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Formats a Date as an RFC-822 / RFC-2822 date string required by RSS 2.0. */
export function formatRfc822Date(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid date for RSS feed.');
  return date.toUTCString();
}

/** Resolves and validates an absolute HTTP/HTTPS URL with deployment base path awareness without credentials. */
export function resolveFeedUrl(urlOrPath: string, siteUrl: string | URL, basePath = '/'): string {
  const base = typeof siteUrl === 'string' ? new URL(siteUrl) : new URL(siteUrl.href);
  const basePrefix = (base.pathname !== '/' ? base.pathname : (basePath || '/')).replace(/\/+$/, '');
  let resolved: URL;
  if (/^[a-z][a-z0-9+.-]*:/i.test(urlOrPath)) {
    resolved = new URL(urlOrPath);
  } else {
    const cleanPath = urlOrPath.replace(/^\/+/, '');
    const combined = basePrefix ? `${basePrefix}/${cleanPath}` : `/${cleanPath}`;
    resolved = new URL(combined, base.origin);
  }
  if (!['http:', 'https:'].includes(resolved.protocol) || resolved.username || resolved.password) {
    throw new Error('Feed URLs must use HTTP(S) without credentials.');
  }
  resolved.hash = '';
  return resolved.href;
}

/** Generates a compliant RSS 2.0 XML document. */
export function generateRssFeed(options: RssFeedOptions): string {
  const { title, description, siteUrl, basePath = '/', channelLink, feedPath = '/rss.xml', language, items } = options;
  const channelUrl = channelLink ? resolveFeedUrl(channelLink, siteUrl, basePath) : resolveFeedUrl('/', siteUrl, basePath);
  const feedUrl = resolveFeedUrl(feedPath, siteUrl, basePath);

  const channelItems = items.map(item => {
    const itemUrl = resolveFeedUrl(item.link, siteUrl, basePath);
    const guid = item.guid ? escapeXml(item.guid) : itemUrl;
    const isPermaLink = !item.guid || item.guid === itemUrl;
    const pubDateStr = formatRfc822Date(item.pubDate);
    const lines = [
      '    <item>',
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(itemUrl)}</link>`,
      `      <guid isPermaLink="${isPermaLink}">${escapeXml(guid)}</guid>`,
      `      <pubDate>${pubDateStr}</pubDate>`,
    ];
    if (item.description) {
      lines.push(`      <description>${escapeXml(item.description)}</description>`);
    }
    if (item.author) {
      lines.push(`      <author>${escapeXml(item.author)}</author>`);
    }
    if (item.categories) {
      for (const cat of item.categories) {
        lines.push(`      <category>${escapeXml(cat)}</category>`);
      }
    }
    lines.push('    </item>');
    return lines.join('\n');
  });

  const channelLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(channelUrl)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
  ];

  if (language) {
    channelLines.push(`    <language>${escapeXml(language)}</language>`);
  }

  if (channelItems.length > 0) {
    channelLines.push(...channelItems);
  }

  channelLines.push('  </channel>');
  channelLines.push('</rss>');
  return channelLines.join('\n') + '\n';
}
