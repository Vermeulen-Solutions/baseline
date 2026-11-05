import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, parseSitemap, sampleRoutes, aggregate, formatReport } from '../scripts/audit-ui.mjs';

// Portable: argument, sitemap, sampling and reporting logic only; no browser is launched.
test('audit:ui arguments need an origin and a route source, and reject Git Bash path conversion', () => {
  assert.throws(() => parseArgs(['--routes', '/']), /--base/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321']), /--routes, --routes-file or --sitemap/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'C:/Program Files/Git/']), /MSYS_NO_PATHCONV=1/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--sitemap', '--widths', '100']), /--widths/);
  const options = parseArgs(['--base', 'http://127.0.0.1:4321', '--sitemap', '--sample', '^/news/.+=2', '--hide', '#dev-panel']);
  assert.deepEqual(options.widths, [390, 768, 1440]);
  assert.equal(options.samples[0].keep, 2);
  assert.ok(options.samples[0].pattern.test('/news/a'));
  assert.deepEqual(options.hide, ['#dev-panel']);
});

test('sitemaps and sitemap indexes become paths on the audited origin', () => {
  const index = parseSitemap('<sitemapindex><sitemap><loc>https://example.org/sitemap-pages.xml</loc></sitemap></sitemapindex>');
  assert.equal(index.isIndex, true);
  assert.deepEqual(index.locs, ['/sitemap-pages.xml']);
  const pages = parseSitemap('<urlset><url><loc>https://example.org/</loc></url><url><loc> https://example.org/about/ </loc></url></urlset>');
  assert.deepEqual(pages.locs, ['/', '/about/']);
});

test('sampling keeps every unmatched route and a few of each template', () => {
  const routes = ['/', '/about/', '/news/a', '/news/b', '/news/c', '/news/a', '/en/news/x', '/en/news/y'];
  const kept = sampleRoutes(routes, [{ pattern: /^\/news\/.+/, keep: 2 }, { pattern: /^\/en\/news\/.+/, keep: 1 }]);
  assert.deepEqual(kept, ['/', '/about/', '/news/a', '/news/b', '/en/news/x']);
});

test('issues aggregate per problem with every place they occur', () => {
  const entries = aggregate([
    { kind: 'edge-on-hover', sig: 'article.card', route: '/', width: 1440, gap: 0, left: 0, right: 40, top: 12, text: 'Story' },
    { kind: 'edge-on-hover', sig: 'article.card', route: '/news/', width: 1440, gap: 0, left: 0, right: 40, top: 12, text: 'Story' },
    { kind: 'http', sig: '404', route: '/old', width: 390 },
  ]);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0].where, ['1440 /', '1440 /news/']);
  const report = formatReport(entries, 9);
  assert.match(report, /9 route\/width combinations, 2 distinct issue/);
  assert.match(report, /== edge-on-hover: 1/);
});
