import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { resolveStaticMetadata, routePath, withBasePath } from '../src/lib/metadata.ts';
import { serializeJsonLd } from '../src/lib/json-ld.ts';

const site = { title: 'Example', description: 'Site description', language: 'en-GB' };
const context = (overrides = {}) => ({ siteUrl: new URL('https://public.example.test'), url: new URL('https://build-preview.example.test/Posts/Story/?utm=test#part'), routing: { base: '/', trailingSlash: 'always', build: { format: 'directory' } }, ...overrides });

test('one resolved model keeps public canonical, article schema and dates in agreement', () => {
  const page = resolveStaticMetadata({ title: 'Story', pageType: 'article', description: 'A story', publishedAt: new Date('2026-01-01T00:00:00Z') }, site, context());
  assert.equal(page.title, 'Story — Example'); assert.equal(page.pageTitle, 'Story');
  assert.equal(page.canonical, 'https://public.example.test/Posts/Story/');
  assert.equal(page.graphs[0].url, page.canonical); assert.equal(page.graphs[0].mainEntityOfPage['@id'], page.canonical);
  assert.equal(page.graphs[0]['@type'], 'BlogPosting');
  assert.equal(page.graphs[0].datePublished, page.article.publishedTime);
  assert.equal(page.graphs[0].inLanguage, 'en-GB');
  assert.equal(page.openGraphLocale, 'en_GB');
  assert.equal(resolveStaticMetadata({ title: 'Language without territory' }, { ...site, language: 'en' }, context()).openGraphLocale, undefined);
  assert.ok(!('author' in page.graphs[0]) && !('publisher' in page.graphs[0]) && !('dateModified' in page.graphs[0]));
});

test('website identity has a public base URL and does not duplicate an identical site title', () => {
  const routing = { base: '/studio/', trailingSlash: 'always', build: { format: 'directory' } };
  const page = resolveStaticMetadata({ title: 'Example' }, site, context({ routing, url: new URL('https://preview.test/studio/Posts/'), siteUrl: new URL('https://public.example.test/studio/') }));
  assert.equal(page.title, 'Example'); assert.equal(page.canonical, 'https://public.example.test/studio/Posts/');
  assert.equal(page.graphs[0]['@type'], 'WebSite'); assert.equal(page.graphs[0].url, 'https://public.example.test/studio/');
  assert.equal(routePath('/Posts/', routing), '/studio/Posts/');
  assert.equal(withBasePath('/studio/Posts/?q=x#part', routing.base), '/studio/Posts/?q=x#part');
  assert.equal(withBasePath('/downloads/file.pdf#part', routing.base), '/studio/downloads/file.pdf#part');
  assert.equal(withBasePath('/studio?q=x#part', routing.base), '/studio?q=x#part');
});

test('default canonical policy respects build-generated file paths, slash policy and case', () => {
  const never = { base: '/base', trailingSlash: 'never', build: { format: 'directory' } };
  assert.equal(routePath('/base/Posts/Story/', never), '/base/Posts/Story');
  assert.equal(routePath('/Posts/Story.html', { ...never, build: { format: 'file' } }), '/base/Posts/Story.html');
  assert.equal(routePath('/Posts/Story/', { ...never, build: { format: 'file' } }), '/base/Posts/Story.html');
  assert.equal(routePath('/Posts/?edition=2#section', { ...never, build: { format: 'file' } }), '/base/Posts.html?edition=2#section');
  assert.equal(routePath('/downloads/guide.pdf#part', never), '/base/downloads/guide.pdf#part');
  assert.equal(routePath('/Posts/Story.html', { ...never, build: { format: 'preserve' } }), '/base/Posts/Story.html');
  const double = resolveStaticMetadata({ title: 'Double slash' }, site, context({ url: new URL('https://preview.test//foreign.test/Story') }));
  assert.equal(new URL(double.canonical).origin, 'https://public.example.test');
  assert.equal(resolveStaticMetadata({ title: 'Root' }, site, context({ url: new URL('https://preview.test/') })).canonical, 'https://public.example.test/');
});

test('explicit canonical retains its origin, path case and meaningful query independently of defaults', () => {
  const page = resolveStaticMetadata({ title: 'Story', pageType: 'article', canonical: 'https://syndication.example.test/Story?edition=2#fragment' }, site, context());
  assert.equal(page.canonical, 'https://syndication.example.test/Story?edition=2');
  assert.equal(page.graphs[0].url, page.canonical);
  assert.equal(resolveStaticMetadata({ title: 'Relative', canonical: 'selected' }, site, context()).canonical, 'https://public.example.test/selected');
});

test('one fallback image supplies graph and social values without inventing type or dimensions', () => {
  const page = resolveStaticMetadata({ title: 'Story', pageType: 'article' }, { ...site, image: { src: '/assets/cover.webp', alt: 'Actual cover', width: 900, height: 600, mimeType: 'image/webp' } }, context());
  assert.equal(page.image.url, 'https://public.example.test/assets/cover.webp');
  assert.equal(page.graphs[0].image, page.image.url); assert.equal(page.image.mimeType, 'image/webp');
  const unknown = resolveStaticMetadata({ title: 'Other', image: { src: 'https://images.example.test/cover' } }, site, context());
  assert.equal(unknown.image.width, undefined); assert.equal(unknown.image.height, undefined); assert.equal(unknown.image.mimeType, undefined);
  const omitted = resolveStaticMetadata({ title: 'Other', image: null }, { ...site, image: { src: '/cover.png' } }, context());
  assert.equal(omitted.image, undefined);
});

test('known authors/modified dates are optional facts; missing or invalid dates are omitted', () => {
  const page = resolveStaticMetadata({ title: 'Story', pageType: 'article', publishedAt: new Date(NaN), modifiedAt: new Date('2026-02-03T04:05:06Z'), author: 'Guest' }, site, context());
  assert.ok(!('datePublished' in page.graphs[0]));
  assert.equal(page.graphs[0].dateModified, '2026-02-03T04:05:06.000Z');
  assert.deepEqual(page.graphs[0].author, { '@type': 'Person', name: 'Guest' });
});

test('an unconfigured public URL never falls back to the static build or preview hostname', () => {
  const page = resolveStaticMetadata({ title: 'Local', pageType: 'article', image: { src: '/cover.jpg' } }, site, context({ siteUrl: undefined }));
  assert.equal(page.canonical, undefined); assert.equal(page.image, undefined); assert.deepEqual(page.graphs, []);
  assert.ok(!JSON.stringify(page).includes('build-preview.example.test'));
});

test('404 policy omits canonical/schema while retaining robots and meaningful metadata', () => {
  const page = resolveStaticMetadata({ title: 'Not Found', canonical: null, robots: 'noindex, nofollow' }, site, context());
  assert.equal(page.canonical, undefined); assert.deepEqual(page.graphs, []); assert.equal(page.robots, 'noindex, nofollow');
});

test('invalid URL schemes, credentials, image facts and inconsistent deploy base fail explicitly', () => {
  for (const canonical of ['javascript:alert(1)', 'https://user:password@public.test/', '//other.test/path']) assert.throws(() => resolveStaticMetadata({ title: 'Invalid', canonical }, site, context()));
  assert.throws(() => resolveStaticMetadata({ title: 'Invalid' }, site, context({ siteUrl: new URL('ftp://public.test/') })));
  assert.throws(() => resolveStaticMetadata({ title: 'Invalid' }, site, context({ siteUrl: new URL('https://public.test/wrong-base') })));
  for (const image of [{ src: '/cover', width: -1 }, { src: '/cover', mimeType: 'text/html' }]) assert.throws(() => resolveStaticMetadata({ title: 'Invalid', image }, site, context()));
});

test('JSON-LD serialization preserves adversarial text in exactly one inert script node', () => {
  const graph = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: '</script><img src=x onerror=alert(1)><script>alert(2)</script><!-- & " \u2028 \u2029' };
  const html = parse(`<html><head><script type="application/ld+json">${serializeJsonLd(graph)}</script></head><body></body></html>`);
  const nodes = [];
  const walk = node => { nodes.push(node); (node.childNodes ?? []).forEach(walk); }; walk(html);
  const scripts = nodes.filter(n => n.tagName === 'script');
  assert.equal(scripts.length, 1); assert.equal(nodes.filter(n => n.tagName === 'img').length, 0);
  assert.deepEqual(JSON.parse(scripts[0].childNodes.map(n => n.value ?? '').join('')), graph);
});
