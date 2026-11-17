import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { htmlCacheKeyedPerBuild, undeclaredEmDashImports, versionAtLeast, workersAdapterStatus } from '../scripts/workers-rules.mjs';
import { assertSafeDestination, gitIgnoreStatus, oversizedStatements } from '../scripts/d1-export.mjs';
import { compareCounts, databaseHealth, findD1File, loadExport, pluginBundlePrefixes, tableCounts } from '../scripts/d1-rehearse.mjs';
import { checkLive, parseSitemap, reroot, stylesheetHrefs } from '../scripts/check-live.mjs';

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
