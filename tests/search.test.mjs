import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  resolveSearchBundleUrl,
  resolveSearchLabels,
  formatResultCount,
  matchSearchShortcut,
  isEditableTarget,
  parseExcerpt,
  safeResultHref,
  isOutsideRect,
} from '../src/lib/search.ts';
import {
  parseArgs,
  checkPagefindDeclaration,
  routeForFile,
  withBase,
  withoutBase,
  isNoindex,
  documentLanguage,
  exclusionReason,
  indexSearch,
  PAGEFIND_TESTED_VERSION,
} from '../scripts/index-search.mjs';

const key = (overrides = {}) => ({ key: 'k', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, defaultPrevented: false, target: { tagName: 'BODY' }, ...overrides });

test('bundle URL derives from capabilities.base and bundlePath, never a hardcoded root', () => {
  assert.equal(resolveSearchBundleUrl({ base: '/', search: false }), null);
  assert.equal(resolveSearchBundleUrl({ base: '/', search: { engine: 'pagefind', bundlePath: '_pagefind' } }), '/_pagefind/');
  assert.equal(resolveSearchBundleUrl({ base: '/docs', search: { engine: 'pagefind', bundlePath: 'assets/search/' } }), '/docs/assets/search/');
  assert.throws(() => resolveSearchBundleUrl({ base: '/', search: { engine: 'pagefind', bundlePath: '../x' } }));
  assert.throws(() => resolveSearchBundleUrl({ base: '/', search: { engine: 'pagefind', bundlePath: 'https://cdn.example/pf' } }));
});

test('labels merge per key and result counts use the page language plural rules', () => {
  const labels = resolveSearchLabels({ title: 'Rechercher', results: { one: '{count} résultat', other: '{count} résultats pour « {query} »' } });
  assert.equal(labels.title, 'Rechercher');
  assert.equal(labels.close, 'Close');
  assert.equal(formatResultCount(labels, 1, 'thé', 'fr'), '1 résultat');
  // French treats 0 as "one"; English as "other".
  assert.equal(formatResultCount(labels, 0, 'thé', 'fr'), '0 résultat');
  assert.equal(formatResultCount(labels, 3, 'thé', 'fr'), '3 résultats pour « thé »');
  assert.equal(formatResultCount(resolveSearchLabels(), 0, 'tea', 'en'), '0 results for “tea”.');
  assert.equal(formatResultCount(resolveSearchLabels(), 2, 'tea', 'not a tag!!'), '2 results for “tea”.');
});

test('shortcuts respect editable targets, composition and already-handled events', () => {
  assert.equal(matchSearchShortcut(key({ ctrlKey: true })), 'modifier');
  assert.equal(matchSearchShortcut(key({ metaKey: true, key: 'K' })), 'modifier');
  assert.equal(matchSearchShortcut(key({ ctrlKey: true, shiftKey: true })), null);
  assert.equal(matchSearchShortcut(key({ ctrlKey: true, defaultPrevented: true })), null);
  assert.equal(matchSearchShortcut(key({ ctrlKey: true, isComposing: true })), null);
  assert.equal(matchSearchShortcut(key({ ctrlKey: true, keyCode: 229 })), null);
  assert.equal(matchSearchShortcut(key({ key: '/' })), null, 'slash is opt-in');
  assert.equal(matchSearchShortcut(key({ key: '/' }), { slash: true }), 'slash');
  for (const target of [{ tagName: 'TEXTAREA' }, { tagName: 'SELECT' }, { tagName: 'INPUT', type: 'search' }, { tagName: 'DIV', isContentEditable: true }, { tagName: 'SPAN', closest: () => ({}) }]) {
    assert.equal(isEditableTarget(target), true);
    assert.equal(matchSearchShortcut(key({ ctrlKey: true, target })), null);
    assert.equal(matchSearchShortcut(key({ key: '/', target }), { slash: true }), null);
  }
  assert.equal(isEditableTarget({ tagName: 'INPUT', type: 'checkbox' }), false);
});

test('excerpts become inert text segments; only <mark> is honored', () => {
  assert.deepEqual(parseExcerpt('A <mark>tea</mark> &amp; <mark>cake</mark> &lt;b&gt;'), [
    { text: 'A ', mark: false }, { text: 'tea', mark: true }, { text: ' & ', mark: false }, { text: 'cake', mark: true }, { text: ' <b>', mark: false },
  ]);
  const hostile = parseExcerpt('<img src=x onerror=alert(1)><mark>x</mark><script>bad()</script>');
  assert.deepEqual(hostile, [{ text: 'x', mark: true }, { text: 'bad()', mark: false }]);
  assert.ok(hostile.every(segment => !segment.text.includes('<')));
  assert.deepEqual(parseExcerpt('&#x3C;&#60;&#xD800;'), [{ text: '<<&#xD800;', mark: false }]);
});

test('result URLs must be same-origin http(s)', () => {
  const page = 'https://example.test/docs/fr/';
  assert.equal(safeResultHref('/docs/fr/a/', page), 'https://example.test/docs/fr/a/');
  assert.equal(safeResultHref('javascript:alert(1)', page), null);
  assert.equal(safeResultHref('https://evil.test/', page), null);
  assert.equal(safeResultHref('//evil.test/x', page), null);
  assert.equal(safeResultHref('', page), null);
  assert.equal(safeResultHref(42, page), null);
});

test('indexer arguments, pinning and route mapping', () => {
  assert.deepEqual(parseArgs(['--dist', 'out', '--exclude', 'private/', '--json']), { dist: 'out', source: null, exclude: ['/private'], json: true, help: false });
  assert.throws(() => parseArgs(['--exclude', '/']));
  assert.throws(() => parseArgs(['--nope']));
  assert.throws(() => checkPagefindDeclaration({}), /optional/);
  assert.throws(() => checkPagefindDeclaration({ devDependencies: { pagefind: '^1.6.0' } }), /exact/);
  assert.throws(() => checkPagefindDeclaration({ dependencies: { pagefind: '1.6.0' } }), /devDependency/);
  assert.throws(() => checkPagefindDeclaration({ devDependencies: { pagefind: '2.0.0' } }), /1\.x/);
  assert.equal(checkPagefindDeclaration({ devDependencies: { pagefind: PAGEFIND_TESTED_VERSION } }), PAGEFIND_TESTED_VERSION);

  assert.equal(routeForFile('index.html'), '/');
  assert.equal(routeForFile('posts/welcome/index.html'), '/posts/welcome/');
  assert.equal(routeForFile('posts/welcome/index.html', 'never'), '/posts/welcome');
  assert.equal(routeForFile('about.html'), '/about');
  assert.equal(routeForFile('feed.xml'), null);
  assert.equal(withBase('/docs', '/fr/'), '/docs/fr/');
  assert.equal(withBase('/', '/'), '/');
  assert.equal(withoutBase('/docs', '/docs/fr/'), '/fr/');
  assert.equal(withoutBase('/docs', '/other/'), null);
});

test('private, developer and error routes are excluded; noindex and lang are read from HTML', () => {
  const options = { bundlePath: '_pagefind', exclude: ['/members'] };
  for (const route of ['/_emdash/admin/', '/admin/', '/_styleguide/', '/_primitives-fixture/', '/_pagefind/', '/404', '/members/a/', '/posts/_draft/']) {
    assert.ok(exclusionReason(route, options), route);
  }
  for (const route of ['/', '/posts/welcome/', '/administration-guide/', '/fr/']) assert.equal(exclusionReason(route, options), null, route);
  assert.equal(isNoindex('<meta name="robots" content="noindex, follow">'), true);
  assert.equal(isNoindex("<meta content='none' name='ROBOTS'>"), true);
  assert.equal(isNoindex('<meta name="description" content="noindex mentioned">'), false);
  assert.equal(documentLanguage('<html dir="rtl" lang="ar">'), 'ar');
  assert.equal(documentLanguage('<html>'), null);
});

function fixtureBuild({ output = 'static', profile = 'static', base = '/', fixtures = false, search = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-search-'));
  const dist = path.join(root, 'dist');
  const publicDir = output === 'server' ? path.join(dist, 'client') : dist;
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(dist, '.starter-build.json'), JSON.stringify({ version: 1, profile: fixtures ? 'test-fixtures' : 'release', deployable: !fixtures }));
  if (search) fs.writeFileSync(path.join(dist, '.baseline-search.json'), JSON.stringify({ version: 1, engine: 'pagefind', bundlePath: '_pagefind', base, trailingSlash: 'ignore', profile, output, publicDir: output === 'server' ? 'client' : '.' }));
  const page = (rel, html) => { fs.mkdirSync(path.dirname(path.join(publicDir, rel)), { recursive: true }); fs.writeFileSync(path.join(publicDir, rel), html); };
  return { root, dist, publicDir, page };
}

function fakePagefind() {
  const added = [];
  const loader = async () => ({
    version: PAGEFIND_TESTED_VERSION,
    pagefind: {
      createIndex: async () => ({ errors: [], index: {
        addHTMLFile: async file => { added.push(file); return { errors: [], file: { url: file.url } }; },
        writeFiles: async ({ outputPath }) => { fs.mkdirSync(outputPath, { recursive: true }); fs.writeFileSync(path.join(outputPath, 'pagefind.js'), ''); return { errors: [], outputPath }; },
      } }),
      close: async () => null,
    },
  });
  return { added, loader };
}

test('static build: indexes emitted public HTML under base, excludes private pages, writes readiness receipt', async () => {
  const { root, dist, publicDir, page } = fixtureBuild({ base: '/docs' });
  page('index.html', '<html lang="en"><body>Home</body></html>');
  page('fr/index.html', '<html lang="fr"><body>Accueil</body></html>');
  page('private/index.html', '<html lang="en"><head><meta name="robots" content="noindex"></head></html>');
  page('admin/index.html', '<html><body>Sveltia</body></html>');
  page('404.html', '<html lang="en"><body>Missing</body></html>');
  page('_pagefind/stale.html', '<html></html>');
  const { added, loader } = fakePagefind();
  const receipt = await indexSearch({ cwd: root, pagefindLoader: loader });
  assert.deepEqual(added.map(file => file.url).sort(), ['/docs/', '/docs/fr/']);
  assert.deepEqual(receipt.languages, { en: 1, fr: 1 });
  assert.equal(receipt.bundleUrl, '/docs/_pagefind/');
  assert.deepEqual(receipt.excluded.map(e => e.reason).sort(), ['error-page', 'excluded-prefix:/_pagefind', 'excluded-prefix:/admin', 'noindex']);
  assert.ok(fs.existsSync(path.join(publicDir, '_pagefind/pagefind.js')));
  assert.equal(fs.existsSync(path.join(publicDir, '_pagefind/stale.html')), false, 'stale bundle files are replaced');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dist, '.baseline-search-index.json'), 'utf8')).kind, 'search-index');
});

test('refuses fixture builds, unconfigured search and EmDash SSR without an explicit export', async () => {
  const { loader } = fakePagefind();
  const fixture = fixtureBuild({ fixtures: true });
  fixture.page('index.html', '<html lang="en"></html>');
  await assert.rejects(indexSearch({ cwd: fixture.root, pagefindLoader: loader }), /fixture/i);

  const unconfigured = fixtureBuild({ search: false });
  unconfigured.page('index.html', '<html lang="en"></html>');
  await assert.rejects(indexSearch({ cwd: unconfigured.root, pagefindLoader: loader }), /not configured/);

  const cms = fixtureBuild({ output: 'server', profile: 'emdash' });
  fs.mkdirSync(path.join(cms.dist, 'server'), { recursive: true });
  fs.writeFileSync(path.join(cms.dist, 'server/entry.mjs'), '');
  await assert.rejects(indexSearch({ cwd: cms.root, pagefindLoader: loader }), /explicit anonymous export/);
  await assert.rejects(indexSearch({ cwd: unconfigured.root, source: 'x', pagefindLoader: loader }), /not configured/);
});

test('EmDash: indexes a fresh anonymous SSR snapshot and refuses stale or failed exports', async () => {
  const cms = fixtureBuild({ output: 'server', profile: 'emdash' });
  const snapshot = path.join(cms.root, '.emdash/snapshots/capture-1');
  fs.mkdirSync(snapshot, { recursive: true });
  fs.writeFileSync(path.join(snapshot, 'page-0.html'), '<html lang="en"><body>Home</body></html>');
  fs.writeFileSync(path.join(snapshot, 'page-1.html'), '<html lang="en"><body>Post</body></html>');
  fs.writeFileSync(path.join(snapshot, 'page-2.html'), '<html lang="en"><body>Not found</body></html>');
  const resources = [
    { url: '/', status: 200, file: 'page-0.html' },
    { url: '/posts/welcome', status: 200, file: 'page-1.html' },
    { url: '/posts?page=2', status: 200, file: 'page-1.html' },
    { url: '/missing', status: 404, file: 'page-2.html' },
    { url: '/_emdash/admin', status: 302, redirect: '/_emdash/login' },
  ];
  fs.writeFileSync(path.join(snapshot, '.ssr-snapshot.json'), JSON.stringify({ version: 1, origin: 'http://127.0.0.1:1', resources }));
  const { added, loader } = fakePagefind();
  const receipt = await indexSearch({ cwd: cms.root, source: snapshot, pagefindLoader: loader });
  assert.deepEqual(added.map(file => file.url), ['/', '/posts/welcome']);
  assert.equal(receipt.source, 'prerendered+ssr-snapshot');
  assert.ok(fs.existsSync(path.join(cms.publicDir, '_pagefind/pagefind.js')), 'bundle is served from dist/client');

  const old = new Date(Date.now() - 60_000);
  fs.utimesSync(path.join(snapshot, '.ssr-snapshot.json'), old, old);
  await assert.rejects(indexSearch({ cwd: cms.root, source: snapshot, pagefindLoader: loader }), /stale/);
  fs.utimesSync(path.join(snapshot, '.ssr-snapshot.json'), new Date(), new Date());
  fs.writeFileSync(path.join(snapshot, 'capture-error.txt'), 'deadline');
  await assert.rejects(indexSearch({ cwd: cms.root, source: snapshot, pagefindLoader: loader }), /failed SSR capture/);
});

test('without a pinned pagefind devDependency the real loader explains the opt-in install', async () => {
  const { root, page } = fixtureBuild();
  page('index.html', '<html lang="en"></html>');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'site', devDependencies: {} }));
  await assert.rejects(indexSearch({ cwd: root }), /npm install --save-dev --save-exact pagefind@/);
});

test('light-dismiss fallback treats only positions beyond the dialog box as outside', () => {
  const rect = { left: 100, right: 300, top: 50, bottom: 250 };
  assert.equal(isOutsideRect({ clientX: 200, clientY: 150 }, rect), false);
  assert.equal(isOutsideRect({ clientX: 100, clientY: 50 }, rect), false);
  assert.equal(isOutsideRect({ clientX: 300, clientY: 250 }, rect), false);
  assert.equal(isOutsideRect({ clientX: 99, clientY: 150 }, rect), true);
  assert.equal(isOutsideRect({ clientX: 301, clientY: 150 }, rect), true);
  assert.equal(isOutsideRect({ clientX: 200, clientY: 49 }, rect), true);
  assert.equal(isOutsideRect({ clientX: 200, clientY: 251 }, rect), true);
});

test('search dialog uses native light dismiss with a guarded position-based fallback', () => {
  const component = fs.readFileSync(new URL('../src/components/SearchDialog.astro', import.meta.url), 'utf8');
  const controller = fs.readFileSync(new URL('../src/lib/search.ts', import.meta.url), 'utf8');
  assert.match(component, /<dialog[^>]*closedby="any"/);
  assert.match(controller, /'closedBy' in HTMLDialogElement\.prototype/);
  assert.doesNotMatch(controller, /event\.target === dialog/);
});

