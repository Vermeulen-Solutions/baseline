import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { htmlCacheKeyedPerBuild, undeclaredEmDashImports, versionAtLeast, workersAdapterStatus } from '../scripts/workers-rules.mjs';
import { assertSafeDestination, gitIgnoreStatus, oversizedStatements } from '../scripts/d1-export.mjs';
import { compareCounts, databaseHealth, findD1File, loadExport, pluginBundlePrefixes, tableCounts } from '../scripts/d1-rehearse.mjs';
import { checkLive, coldUrl, measureTiming, median, parseSitemap, reroot, sitemapAlternates, stylesheetHrefs } from '../scripts/check-live.mjs';

// Portable: throwaway folders, a stubbed `git` and a stubbed fetch; no network, Wrangler or CMS.
const scratch = prefix => mkdtempSync(path.join(os.tmpdir(), prefix));
const put = (root, file, text) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text); };

test('Workers rules: adapter minimum on EmDash 1.5, per-build HTML cache keys, declared @emdash-cms imports', () => {
  assert.equal(workersAdapterStatus('1.5.0', '14.3.3'), 'fail');
  assert.equal(workersAdapterStatus('1.5.0', '14.4.8'), 'pass');
  assert.equal(workersAdapterStatus('1.4.0', '14.3.3'), 'pass', 'the rule starts with EmDash 1.5');
  assert.equal(workersAdapterStatus(undefined, '14.4.8'), 'unverified');
  assert.equal(versionAtLeast('^14.4.0', '14.4.0'), true);
  const dir = scratch('delivery-rules-');
  try {
    assert.equal(htmlCacheKeyedPerBuild(dir), null);
    put(dir, 'src/lib/cloudflare-cache-provider.mjs', "const cacheKey = new Request(url.toString(), { method: 'GET' });");
    assert.equal(htmlCacheKeyedPerBuild(dir), false);
    // Retaining the previous builds' assets on deploy also keeps cached HTML working.
    put(dir, 'package.json', JSON.stringify({ scripts: { 'assets:retain': 'node scripts/retain-build-assets.mjs', test: 'npm run assets:retain' } }));
    assert.equal(htmlCacheKeyedPerBuild(dir), false, 'a retention script nobody runs on build or deploy does not count');
    put(dir, 'package.json', JSON.stringify({ scripts: { 'deploy:worker': 'npm run assets:retain -- --assets dist/client/_astro && wrangler deploy' } }));
    assert.equal(htmlCacheKeyedPerBuild(dir), true);
    put(dir, 'package.json', '{}');
    put(dir, 'src/lib/cloudflare-cache-provider.mjs', 'export const toEdgeCacheKey = (url, buildId) => url + buildId;');
    assert.equal(htmlCacheKeyedPerBuild(dir), true);
    // A plugin admin page importing the admin package that only EmDash declares.
    put(dir, 'src/plugins/staff/admin.tsx', "import { useCurrentUser } from '@emdash-cms/admin';\nimport { Button } from \"@emdash-cms/blocks/react\";\nimport x from 'emdash';");
    assert.deepEqual(undeclaredEmDashImports(dir, new Set(['emdash', '@emdash-cms/blocks'])), [{ name: '@emdash-cms/admin', file: 'src/plugins/staff/admin.tsx' }]);
    assert.deepEqual(undeclaredEmDashImports(dir, new Set(['emdash', '@emdash-cms/blocks', '@emdash-cms/admin'])), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('D1 export refuses destinations Git would track and reports statements D1 cannot load', () => {
  const git = answers => (command, args) => args[0] === 'rev-parse' ? { status: answers.inside ? 0 : 128, stdout: answers.inside ? 'true\n' : '' } : { status: answers.ignored ? 0 : 1, stdout: '' };
  assert.equal(gitIgnoreStatus('x/backup.sql', git({ inside: true, ignored: true })), 'ignored');
  assert.equal(gitIgnoreStatus('x/backup.sql', git({ inside: true, ignored: false })), 'tracked');
  assert.equal(gitIgnoreStatus('x/backup.sql', git({ inside: false })), 'outside');
  assert.throws(() => assertSafeDestination('x/backup.sql', git({ inside: true, ignored: false })), /not ignored by Git/);
  assert.doesNotThrow(() => assertSafeDestination('x/backup.sql', git({ inside: false })));
  const big = `INSERT INTO "ec_galleries" VALUES ('${'x'.repeat(100_001)}');`;
  assert.deepEqual(oversizedStatements([big, 'INSERT INTO "small" VALUES (1);']), [{ table: 'ec_galleries', bytes: Buffer.byteLength(big) }]);
});

test('rehearsal: loads past the D1 statement limit, finds plugin bundles and compares row counts', () => {
  const dir = scratch('delivery-rehearse-');
  try {
    const d1 = path.join(dir, 'v3', 'd1', 'miniflare-D1DatabaseObject');
    mkdirSync(d1, { recursive: true });
    writeFileSync(path.join(d1, 'metadata.sqlite'), '');
    assert.equal(findD1File(dir), null);
    const file = path.join(d1, 'abc.sqlite');
    new DatabaseSync(file).close();
    assert.equal(findD1File(dir), file);
    const sql = `PRAGMA defer_foreign_keys = TRUE;
CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parent(id));
CREATE TABLE parent (id INTEGER PRIMARY KEY, body TEXT);
CREATE TABLE _emdash_migrations (name TEXT PRIMARY KEY);
CREATE TABLE _plugin_state (plugin_id TEXT, version TEXT, status TEXT, source TEXT, marketplace_version TEXT);
INSERT INTO child VALUES (1, 1);
INSERT INTO parent VALUES (1, '${'y'.repeat(120_000)}');
INSERT INTO _emdash_migrations VALUES ('091_example');
INSERT INTO _plugin_state VALUES ('r_abc', '1.2.0', 'active', 'registry', NULL), ('m_def', '0.1.0', 'active', 'marketplace', '0.2.0'), ('off', '1.0.0', 'inactive', 'registry', NULL), ('own', '1.0.0', 'active', 'config', NULL);`;
    const loaded = loadExport(file, sql);
    assert.deepEqual([loaded.integrity, loaded.foreignKeyViolations, loaded.migrations, loaded.counts.parent], ['ok', 0, 1, 1], 'a child row inserted before its parent loads, as in D1 with deferred keys');
    const db = new DatabaseSync(file);
    const states = db.prepare('SELECT * FROM _plugin_state').all();
    db.exec("INSERT INTO _emdash_migrations VALUES ('092_example'); CREATE TABLE fresh (id INTEGER); DELETE FROM child;");
    const after = tableCounts(db);
    assert.equal(databaseHealth(db).lastMigration, '092_example');
    db.close();
    assert.deepEqual(pluginBundlePrefixes(states).map(item => item.prefix), ['registry/r_abc/1.2.0', 'marketplace/m_def/0.2.0']);
    const diff = compareCounts(loaded.counts, after);
    assert.deepEqual(diff.lostRows, ['child']);
    assert.deepEqual(diff.added, [{ table: 'fresh', rows: 0 }]);
    assert.deepEqual(diff.changed.map(item => item.table).sort(), ['_emdash_migrations', 'child']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('live check follows sitemap indexes on the checked origin and fails a missing stylesheet', async () => {
  assert.deepEqual(parseSitemap('<sitemapindex><sitemap><loc>https://prod.example/sitemap-pages.xml</loc></sitemap></sitemapindex>'), { index: true, locs: ['https://prod.example/sitemap-pages.xml'] });
  assert.equal(reroot('https://prod.example/a/b?x=1', 'https://staging.example'), 'https://staging.example/a/b?x=1');
  assert.deepEqual(stylesheetHrefs('<link rel="stylesheet" href="/_astro/a.css"><link rel="preload" href="/f.woff2"><link href="/b.css" rel="stylesheet">', 'https://s.example/p/'), ['https://s.example/_astro/a.css', 'https://s.example/b.css']);
  const site = {
    '/_emdash/api/health': { status: 200, body: '{"success":true,"data":{"version":"1.5.0"}}' },
    '/sitemap.xml': { status: 200, body: '<sitemapindex><sitemap><loc>https://prod.example/sitemap-pages.xml</loc></sitemap></sitemapindex>' },
    '/sitemap-pages.xml': { status: 200, body: '<urlset><url><loc>https://prod.example/</loc></url><url><loc>https://prod.example/old</loc></url></urlset>' },
    '/': { status: 200, body: '<link rel="stylesheet" href="/_astro/new.css">' },
    '/old': { status: 301, location: '/new/' },
    '/new/': { status: 200, body: '<link rel="stylesheet" href="/_astro/old.css">' },
    '/_astro/new.css': { status: 200, body: '' },
    '/_astro/old.css': { status: 404, body: '' },
    '/robots.txt': { status: 200, body: '' },
  };
  const fetcher = async url => site[new URL(url).pathname] ?? { status: 404, body: '' };
  const report = await checkLive({ origin: 'https://staging.example' }, fetcher);
  assert.equal(report.health.version, '1.5.0');
  assert.deepEqual(report.redirects.map(item => [new URL(item.from).pathname, new URL(item.to).pathname, item.targetStatus]), [['/old', '/new/', 200]]);
  assert.equal(report.ok, false);
  assert.deepEqual(report.failures, ['Stylesheet https://staging.example/_astro/old.css (used by https://staging.example/old) answered 404']);
});

test('live check warns about search-facing problems by path and fails them only with --strict-seo', async () => {
  const sitemap = '<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    + '<url><loc>https://prod.example/fr/</loc><xhtml:link rel="alternate" hreflang="fr" href="https://prod.example/fr/"/><xhtml:link rel="alternate" hreflang="en" href="https://prod.example/en/"/></url>'
    + '<url><loc>https://prod.example/en/</loc><xhtml:link rel="alternate" hreflang="fr" href="https://prod.example/fr/"/><xhtml:link rel="alternate" hreflang="en" href="https://prod.example/en/"/></url>'
    + '<url><loc>https://prod.example/twice/</loc></url><url><loc>https://prod.example/slug</loc></url></urlset>';
  assert.deepEqual(sitemapAlternates(sitemap).get('https://prod.example/fr/').map(link => link.hreflang), ['fr', 'en']);
  const head = (canonical, links = '', descriptions = 1) => `<link rel="canonical" href="${canonical}">${'<meta name="description" content="x">'.repeat(descriptions)}${links}`;
  const pair = '<link rel="alternate" hreflang="fr" href="https://prod.example/fr/"><link rel="alternate" hreflang="en" href="https://prod.example/en/">';
  const site = {
    '/_emdash/api/health': { status: 404, body: '' },
    '/sitemap.xml': { status: 200, body: sitemap },
    // Always fetched, though not listed: not judged for search-facing problems.
    '/': { status: 302, location: '/fr/' },
    // Same paths on the production host are fine: only paths are compared.
    '/fr/': { status: 200, body: head('https://prod.example/fr/', pair) },
    // Head links built from a CMS URL pattern instead of the real route.
    '/en/': { status: 200, body: head('https://staging.example/en/', pair.replace('/fr/', '/fr-cms/')) },
    '/twice/': { status: 200, body: head('https://staging.example/twice', '<link rel="alternate" hreflang="fr" href="/twice/"><link rel="alternate" hreflang="fr" href="/other/">', 2) },
    '/slug': { status: 301, location: '/real/' },
    '/real/': { status: 200, body: head('https://staging.example/real/') },
    '/robots.txt': { status: 200, body: '' },
  };
  const fetcher = async url => site[new URL(url).pathname] ?? { status: 404, body: '' };
  const report = await checkLive({ origin: 'https://staging.example' }, fetcher);
  assert.equal(report.ok, true, 'warnings alone do not fail the default check');
  assert.deepEqual(report.warnings, [
    'https://staging.example/en/ declares hreflang en=/en/ fr=/fr-cms/; the sitemap lists en=/en/ fr=/fr/',
    'https://staging.example/twice/ names https://staging.example/twice as canonical',
    'https://staging.example/twice/ has 2 meta descriptions',
    'https://staging.example/twice/ repeats hreflang fr',
    'The sitemap lists https://staging.example/slug, which redirects (301) to https://staging.example/real/',
  ]);
  assert.equal((await checkLive({ origin: 'https://staging.example', strictSeo: true }, fetcher)).ok, false);
});

test('live timing separates cold renders from warm cache answers and never times a non-200', async () => {
  assert.equal(median([]), null);
  assert.equal(median([30, 10, 20]), 20);
  assert.equal(median([40, 10, 20, 30]), 25);
  assert.equal(coldUrl('https://site.example/about?x=1', 'abc'), 'https://site.example/about?x=1&check-live-cold=abc');
  const seen = [];
  const timer = async url => {
    seen.push(url);
    const cold = url.includes('check-live-cold=');
    if (url.includes('/blocked')) return { ms: 5, status: 403, cache: null, placement: null };
    return { ms: cold ? (url.endsWith('t2') ? 900 : 700) : 80, status: 200, cache: cold ? 'MISS' : 'HIT', placement: cold ? null : 'remote-DFW' };
  };
  let tokens = 0;
  const result = await measureTiming(['https://site.example/', 'https://site.example/blocked'], { samples: 3, timer, token: () => `t${tokens++}` });
  const home = result.pages[0];
  assert.equal(home.coldMs, 700, 'median of 700, 700, 900');
  assert.equal(home.warmMs, 80);
  assert.deepEqual(home.cache, ['HIT']);
  assert.deepEqual(home.placement, ['remote-DFW']);
  assert.equal(new Set(seen.filter(url => url.includes('check-live-cold=')).map(url => url.split('check-live-cold=')[1])).size, 6, 'every cold sample has its own token');
  assert.deepEqual(result.pages[1], { url: 'https://site.example/blocked', coldMs: null, warmMs: null, cache: [], placement: [] });
  assert.equal(result.problems.length, 6, 'each blocked sample is reported');
  assert.equal(result.coldMedianMs, 700);
  assert.equal(result.warmMedianMs, 80);
  assert.deepEqual(result.slowestCold.map(item => item.url), ['https://site.example/']);
});
