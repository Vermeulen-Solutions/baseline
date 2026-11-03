import test from 'node:test';
import assert from 'node:assert/strict';
import { SaxesParser } from 'saxes';
import { generateRssFeed, isPublicationEligible, escapeXml, resolveFeedUrl } from '../src/lib/publication-feed.ts';
import { generateSitemapXml, formatW3cDate } from '../src/lib/sitemap.ts';

// Saxes validates XML well-formedness and namespace handling (not full XSD schema validation).
function parseXmlString(xml) {
  return new Promise((resolve, reject) => {
    const parser = new SaxesParser({ xmlns: true });
    const events = [];
    const elements = [];

    parser.on('opentag', node => {
      elements.push({ name: node.name, local: node.local, uri: node.uri, attributes: node.attributes });
      events.push({ type: 'open', node });
    });
    parser.on('text', text => events.push({ type: 'text', text }));
    parser.on('cdata', text => events.push({ type: 'cdata', text }));
    parser.on('closetag', node => events.push({ type: 'close', node }));
    parser.on('error', err => reject(err));
    parser.on('end', () => resolve({ events, elements }));

    parser.write(xml).close();
  });
}

test('isPublicationEligible respects draft flags and scheduled publication dates', () => {
  const past = new Date('2026-01-01T00:00:00Z');
  const future = new Date('2026-12-31T00:00:00Z');
  const reference = new Date('2026-06-01T00:00:00Z');

  // Published in past
  assert.equal(isPublicationEligible({ draft: false, publishedAt: past }, { now: reference }), true);
  // Default draft false
  assert.equal(isPublicationEligible({ publishedAt: past }, { now: reference }), true);
  // Explicit draft
  assert.equal(isPublicationEligible({ draft: true, publishedAt: past }, { now: reference }), false);
  // Future scheduled post
  assert.equal(isPublicationEligible({ draft: false, publishedAt: future }, { now: reference }), false);
  // Future scheduled post with includeScheduled: true
  assert.equal(isPublicationEligible({ draft: false, publishedAt: future }, { now: reference, includeScheduled: true }), true);
  // Missing or invalid date
  assert.equal(isPublicationEligible({ draft: false, publishedAt: null }), false);
  assert.equal(isPublicationEligible({ draft: false, publishedAt: 'not-a-date' }), false);
});

test('escapeXml escapes entities, preserves emoji, and filters XML 1.0 disallowed characters', async () => {
  const dirty = 'Special & characters <tag> "quoted" \'single\' \x00\x08\x1F \uFFFE \uFFFF \uD800 🚀 emoji';
  const clean = escapeXml(dirty);
  assert.ok(clean.includes('&amp;'));
  assert.ok(clean.includes('&lt;tag&gt;'));
  assert.ok(clean.includes('&quot;quoted&quot;'));
  assert.ok(clean.includes('&apos;single&apos;'));
  assert.ok(clean.includes('🚀'));
  assert.ok(!clean.includes('\uFFFE'));
  assert.ok(!clean.includes('\uFFFF'));
  assert.ok(!clean.includes('\uD800'));

  // Assert parseable without error
  await parseXmlString(`<root>${clean}</root>`);

  assert.equal(escapeXml(null), '');
  assert.equal(escapeXml(undefined), '');
});

test('resolveFeedUrl resolves base paths and rejects credentials and unsafe schemes', () => {
  // Site URL with subpath
  const siteUrlWithBase = 'https://example.com/blog/';
  assert.equal(resolveFeedUrl('/posts/story/', siteUrlWithBase), 'https://example.com/blog/posts/story/');
  assert.equal(resolveFeedUrl('posts/story/', siteUrlWithBase), 'https://example.com/blog/posts/story/');
  assert.equal(resolveFeedUrl('/', siteUrlWithBase), 'https://example.com/blog/');

  // Origin-only siteUrl with routing.base parameter
  const originSiteUrl = 'https://example.com';
  assert.equal(resolveFeedUrl('/posts/story/', originSiteUrl, '/blog/'), 'https://example.com/blog/posts/story/');
  assert.equal(resolveFeedUrl('/', originSiteUrl, '/blog/'), 'https://example.com/blog/');
  // Ensure already-prefixed inputs from routePath/postUrl do not double-prepend base
  assert.equal(resolveFeedUrl('/blog/', originSiteUrl, '/blog/'), 'https://example.com/blog/');
  assert.equal(resolveFeedUrl('/blog/rss.xml', originSiteUrl, '/blog/'), 'https://example.com/blog/rss.xml');
  assert.equal(resolveFeedUrl('/blog/posts/welcome/', originSiteUrl, '/blog/'), 'https://example.com/blog/posts/welcome/');
  assert.equal(resolveFeedUrl('/rss.xml', originSiteUrl, '/blog/'), 'https://example.com/blog/rss.xml');
  assert.equal(resolveFeedUrl('https://other.com/ext#fragment', originSiteUrl), 'https://other.com/ext');

  assert.throws(() => resolveFeedUrl('javascript:alert(1)', originSiteUrl), /HTTP\(S\)/);
  assert.throws(() => resolveFeedUrl('https://user:pass@example.com/path', originSiteUrl), /credentials/);
});

test('generateRssFeed produces strictly valid, parseable RSS 2.0 XML with atom self-link', async () => {
  const xml = generateRssFeed({
    title: 'Baseline Feed & News',
    description: 'Updates & articles from <Baseline>',
    siteUrl: 'https://example.com',
    language: 'en-US',
    items: [
      {
        title: 'First Article & Highlights',
        link: '/posts/first/',
        description: 'Introduction to <modern> web performance & design.',
        pubDate: new Date('2026-02-15T10:00:00Z'),
        author: 'editor@example.com (Editor)',
        categories: ['Architecture', 'Performance'],
      },
      {
        title: 'Second Article',
        link: '/posts/second/',
        pubDate: new Date('2026-03-01T12:00:00Z'),
      },
    ],
  });

  // Verify parseable XML without throwing
  const parsed = await parseXmlString(xml);
  assert.ok(parsed.elements.length > 0);

  const rssTag = parsed.elements.find(e => e.local === 'rss');
  assert.ok(rssTag);

  const channelTag = parsed.elements.find(e => e.local === 'channel');
  assert.ok(channelTag);

  const atomLink = parsed.elements.find(e => e.local === 'link' && e.uri === 'http://www.w3.org/2005/Atom');
  assert.ok(atomLink);
  const hrefAttr = atomLink.attributes.href?.value ?? atomLink.attributes.href;
  assert.equal(hrefAttr, 'https://example.com/rss.xml');

  // Verify items
  const items = parsed.elements.filter(e => e.local === 'item');
  assert.equal(items.length, 2);

  assert.ok(xml.includes('<title>Baseline Feed &amp; News</title>'));
  assert.ok(xml.includes('<description>Updates &amp; articles from &lt;Baseline&gt;</description>'));
  assert.ok(xml.includes('<pubDate>Sun, 15 Feb 2026 10:00:00 GMT</pubDate>'));
  assert.ok(xml.includes('<category>Architecture</category>'));
});

test('generateSitemapXml produces strictly valid Sitemap 0.9 with xhtml alternates and priority bounds', async () => {
  const xml = generateSitemapXml({
    siteUrl: 'https://example.com',
    items: [
      {
        url: '/',
        lastModified: '2026-03-01',
        changeFrequency: 'daily',
        priority: 1.5, // Should clamp to 1.0
        alternates: [
          { lang: 'en', url: '/' },
          { lang: 'nl', url: '/nl/' },
        ],
      },
      {
        url: '/posts/first/',
        lastModified: new Date('2026-02-15T10:00:00Z'),
        changeFrequency: 'weekly',
        priority: -0.5, // Should clamp to 0.0
      },
    ],
  });

  const parsed = await parseXmlString(xml);
  const urlset = parsed.elements.find(e => e.local === 'urlset');
  assert.ok(urlset);
  assert.equal(urlset.uri, 'http://www.sitemaps.org/schemas/sitemap/0.9');

  const urls = parsed.elements.filter(e => e.local === 'url');
  assert.equal(urls.length, 2);

  // Check clamped priorities
  assert.ok(xml.includes('<priority>1.0</priority>'));
  assert.ok(xml.includes('<priority>0.0</priority>'));

  // Check lastmod formatting
  assert.ok(xml.includes('<lastmod>2026-03-01</lastmod>'));
  assert.ok(xml.includes('<lastmod>2026-02-15</lastmod>'));

  // Check alternate links
  assert.ok(xml.includes('<xhtml:link rel="alternate" hreflang="nl" href="https://example.com/nl/"/>'));
});

test('generateSitemapXml enforces host scope for <loc> while allowing cross-domain alternates', () => {
  // Reject <loc> pointing to foreign host
  assert.throws(() => {
    generateSitemapXml({
      siteUrl: 'https://example.com',
      items: [{ url: 'https://other-domain.test/external-page' }],
    });
  }, /Sitemap <loc> must belong to the site origin/);

  // Allow cross-domain alternates
  const xml = generateSitemapXml({
    siteUrl: 'https://example.com',
    items: [
      {
        url: '/page/',
        alternates: [
          { lang: 'fr', url: 'https://example.fr/page/' },
        ],
      },
    ],
  });
  assert.ok(xml.includes('<loc>https://example.com/page/</loc>'));
  assert.ok(xml.includes('<xhtml:link rel="alternate" hreflang="fr" href="https://example.fr/page/"/>'));
});
