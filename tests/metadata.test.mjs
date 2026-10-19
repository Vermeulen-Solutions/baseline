import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { getSeoMeta } from 'emdash';
import { createPublicPageContext, generateBaseSeoContributions, resolvePageMetadata, renderPageMetadata } from 'emdash/page';
import { articleMetadata, defaultCanonicalUrl, resolvePublicSiteUrl } from '../src/utils/page-metadata.ts';

const request = new URL('https://preview.example.test/base/posts/story?campaign=test#section');

test('public default origin prefers site settings then Astro.site, preserving path ownership at the caller', () => {
  const astroSite = new URL('https://astro.example.test/base/');
  assert.equal(resolvePublicSiteUrl(' https://public.example.test/base/ ', astroSite, request), 'https://public.example.test');
  assert.equal(resolvePublicSiteUrl(' ', astroSite, request), 'https://astro.example.test');
  assert.equal(resolvePublicSiteUrl(undefined, undefined, request), 'https://preview.example.test');
  const origin = resolvePublicSiteUrl('https://public.example.test', astroSite, request);
  const seo = getSeoMeta({ data: { title: 'Story' } }, { siteUrl: origin, path: request.pathname });
  assert.equal(seo.canonical, 'https://public.example.test/base/posts/story');
});

test('invalid configured public URLs do not silently fall back to the incoming host', () => {
  for (const value of ['/relative', 'not a URL', 'ftp://public.example.test', 'https://user:password@public.example.test']) {
    assert.throws(() => resolvePublicSiteUrl(value, undefined, request));
  }
  assert.equal(resolvePublicSiteUrl('http://localhost:4321/', undefined, request), 'http://localhost:4321');
});

test('default canonicals preserve path case/base without interpreting double-slash paths as another host', () => {
  assert.equal(defaultCanonicalUrl('https://public.example.test', '/'), 'https://public.example.test/');
  assert.equal(defaultCanonicalUrl('https://public.example.test', '/base/Posts/Story/'), 'https://public.example.test/base/Posts/Story');
  assert.equal(defaultCanonicalUrl('https://public.example.test', '//other.example.test/Story'), 'https://public.example.test//other.example.test/Story');
  assert.equal(defaultCanonicalUrl('https://public.example.test', request.pathname), 'https://public.example.test/base/posts/story');
});

test('article metadata uses real hydrated facts and omits unknown/invalid values', () => {
  assert.deepEqual(articleMetadata({ publishedAt: new Date('2026-01-02T03:04:05Z'), updatedAt: new Date('2026-02-03T04:05:06Z'), byline: { displayName: 'Guest Author' } }), {
    publishedTime: '2026-01-02T03:04:05.000Z', modifiedTime: '2026-02-03T04:05:06.000Z', author: 'Guest Author',
  });
  assert.deepEqual(articleMetadata({ publishedAt: null, updatedAt: new Date(NaN), byline: { displayName: '  ' } }), {
    publishedTime: undefined, modifiedTime: undefined, author: undefined,
  });
});

test('installed EmDash resolver retains cross-domain editor canonical and configured title separator', () => {
  const seo = getSeoMeta({ data: { title: 'Original story', seo: { title: 'Edited story', description: 'Edited description', canonical: 'https://syndication.example.test/Story/', noIndex: true } } }, {
    siteTitle: 'Example', titleSeparator: ' — ', siteUrl: 'https://public.example.test', path: '/base/posts/story',
  });
  assert.equal(seo.title, 'Edited story — Example');
  assert.equal(seo.ogTitle, 'Edited story');
  assert.equal(seo.description, 'Edited description');
  assert.equal(seo.canonical, 'https://syndication.example.test/Story/');
  assert.equal(seo.robots, 'noindex, nofollow');
});

test('installed page pipeline emits article facts and keeps ordinary content pages as websites when specified', () => {
  const common = { url: request, kind: 'content', canonical: 'https://public.example.test/base/posts/story', title: 'Story | Example', pageTitle: 'Story', siteName: 'Example', siteUrl: 'https://public.example.test' };
  const article = createPublicPageContext({ ...common, pageType: 'article', articleMeta: articleMetadata({ publishedAt: new Date('2026-01-02T00:00:00Z'), byline: { displayName: 'Guest Author' } }) });
  const resolved = resolvePageMetadata(generateBaseSeoContributions(article));
  const graph = JSON.parse(resolved.jsonld[0].json);
  assert.equal(graph['@type'], 'BlogPosting'); assert.equal(graph.headline, 'Story');
  assert.equal(graph.datePublished, '2026-01-02T00:00:00.000Z'); assert.equal(graph.author.name, 'Guest Author');
  assert.equal(graph.url, common.canonical);
  const page = resolvePageMetadata(generateBaseSeoContributions(createPublicPageContext({ ...common, pageType: 'website' })));
  assert.equal(JSON.parse(page.jsonld[0].json)['@type'], 'WebSite');
  assert.equal(JSON.parse(page.jsonld[0].json).url, 'https://public.example.test');
  assert.ok(!page.properties.some(p => p.property.startsWith('article:')));
});

test('installed plugin precedence produces one canonical/description/graph in parsed metadata', () => {
  const base = createPublicPageContext({ url: request, kind: 'custom', pageType: 'website', title: 'Page', siteName: 'Example', description: 'Base', canonical: 'https://public.example.test/page' });
  const final = resolvePageMetadata([
    { kind: 'meta', name: 'description', content: 'Plugin' },
    { kind: 'link', rel: 'canonical', href: 'https://plugin.example.test/page' },
    { kind: 'jsonld', id: 'primary', graph: { '@context': 'https://schema.org', '@type': 'WebPage', name: '</script><img src=x>' } },
    ...generateBaseSeoContributions(base),
  ]);
  const nodes = [];
  const walk = node => { nodes.push(node); (node.childNodes ?? []).forEach(walk); };
  walk(parse(`<html><head>${renderPageMetadata(final)}</head><body></body></html>`));
  const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
  assert.deepEqual(nodes.filter(n => n.tagName === 'meta' && attr(n, 'name') === 'description').map(n => attr(n, 'content')), ['Plugin']);
  assert.deepEqual(nodes.filter(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical').map(n => attr(n, 'href')), ['https://plugin.example.test/page']);
  assert.equal(nodes.filter(n => n.tagName === 'script').length, 1);
  assert.equal(nodes.filter(n => n.tagName === 'img').length, 0);
  assert.equal(JSON.parse(final.jsonld[0].json).name, '</script><img src=x>');
});

test('explicit null canonical and robots survive the CMS page context for error responses', () => {
  const page = createPublicPageContext({ url: request, kind: 'custom', pageType: 'website', title: 'Not found', canonical: null, seo: { robots: 'noindex, nofollow' } });
  const resolved = resolvePageMetadata(generateBaseSeoContributions(page));
  assert.deepEqual(resolved.links, []);
  assert.deepEqual(resolved.meta.find(m => m.name === 'robots'), { name: 'robots', content: 'noindex, nofollow' });
});
