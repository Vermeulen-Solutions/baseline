// Explicit local, disposable CMS rehearsal; never an automatic CI/browser dependency.
import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import { chromium } from '@playwright/test';
import { createTransport, csrfInterceptor, devBypassInterceptor } from 'emdash/client';
import { startVisualSite } from './visual/site.mjs';

assert.ok(!process.env.CI && !process.env.GITHUB_ACTIONS, 'Metadata browser rehearsal is local-only');
const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = process.argv.includes('--baseline');
const outIndex = process.argv.indexOf('--out');
assert.ok(outIndex >= 0 && process.argv[outIndex + 1], 'Use --out <receipt.json> [--baseline]');
const out = path.resolve(process.argv[outIndex + 1]);
const reportDir = path.resolve('.emdash/metadata', baseline ? 'before' : 'after');
const publicOrigin = 'https://public.example.test';
const receipt = { version: 1, mode: baseline ? 'baseline' : 'verification', publicOrigin, scope: 'Owned local Node/SQLite production build; synthetic API editor write and native plugin; isolated Chromium JS inventory', sourceSHA256: {}, routes: {}, javascript: {} };
let site, browser, origin;

function inspect(html) {
  const nodes = [];
  function walk(node) { nodes.push(node); for (const child of node.childNodes ?? []) walk(child); }
  walk(parse(html));
  const attr = (node, key) => node.attrs?.find(a => a.name === key)?.value;
  const meta = key => nodes.filter(n => n.tagName === 'meta' && (attr(n, 'name') === key || attr(n, 'property') === key)).map(n => attr(n, 'content'));
  return {
    titles: nodes.filter(n => n.tagName === 'title').map(n => n.childNodes.map(n => n.value ?? '').join('')),
    description: meta('description'), canonical: nodes.filter(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical').map(n => attr(n, 'href')),
    type: meta('og:type'), ogUrl: meta('og:url'), robots: meta('robots'),
    published: meta('article:published_time'), modified: meta('article:modified_time'), author: meta('article:author'),
    graphs: nodes.filter(n => n.tagName === 'script' && attr(n, 'type') === 'application/ld+json').map(n => JSON.parse(n.childNodes.map(n => n.value ?? '').join(''))),
  };
}

try {
  site = await startVisualSite(root, reportDir, {
    releaseOnly: true,
    async prepareStage({ stage, origin: stagedOrigin }) {
      origin = stagedOrigin;
      for (const file of ['src/layouts/SiteShell.astro', 'src/layouts/Base.astro', 'src/pages/posts/[slug].astro', 'src/pages/[slug].astro', 'src/pages/404.astro', 'src/utils/page-metadata.ts']) {
        try { receipt.sourceSHA256[file] = createHash('sha256').update((await readFile(path.join(stage, file), 'utf8')).replaceAll('\r\n', '\n')).digest('hex'); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      const seedPath = path.join(stage, 'seed/seed.json');
      const seed = JSON.parse(await readFile(seedPath, 'utf8'));
      seed.settings.url = publicOrigin;
      seed.bylines = [{ id: 'metadata-author', slug: 'metadata-author', displayName: 'Synthetic Author', isGuest: true }];
      seed.content.posts.push({ id: 'metadata-editor', slug: 'metadata-editor', status: 'published', data: { title: 'Editorial fixture', excerpt: 'Original excerpt' }, bylines: [{ byline: 'metadata-author' }] });
      await writeFile(seedPath, JSON.stringify(seed));
      await cp(path.join(root, 'tests/metadata/fixture-plugin.mjs'), path.join(stage, 'metadata-fixture-plugin.mjs'));
      for (const [file, target] of [['Plugin.astro', 'metadata-plugin.astro'], ['Shell.astro', 'metadata-shell.astro']]) await cp(path.join(root, 'tests/metadata', file), path.join(stage, 'src/pages', target));
      const configPath = path.join(stage, 'astro.config.mjs');
      const config = await readFile(configPath, 'utf8');
      assert.ok(config.includes('site: siteUrl,') && config.includes('emdash({'));
      await writeFile(configPath, config.replace('site: siteUrl,', 'site: "https://astro-fallback.example.test",').replace('emdash({', `emdash({ plugins: [{ id: 'baseline-metadata-fixture', version: '1.0.0', entrypoint: ${JSON.stringify(path.join(stage, 'metadata-fixture-plugin.mjs').replaceAll('\\', '/'))} }],`));
    },
    async onDevReady() {
      await fetch(origin + '/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin');
      const transport = createTransport({ interceptors: [csrfInterceptor(), devBypassInterceptor(origin)] });
      const response = await transport.fetch(new Request(origin + '/_emdash/api/content/posts/metadata-editor', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seo: { title: 'Editor SEO title', description: 'Editor description wins', canonical: 'https://editor.example.test/selected', noIndex: true } }) }));
      assert.equal(response.status, 200, await response.text());
    },
  });
  const cases = ['/', '/posts', '/posts/welcome?tracking=ignored', '/about', '/posts/metadata-editor', '/metadata-plugin', '/metadata-shell', '/metadata-shell?owner=platform', '/missing-metadata-page'];
  for (const route of cases) {
    const response = await fetch(site.origin + route);
    const html = await response.text();
    const data = { status: response.status, ...inspect(html) };
    receipt.routes[route] = data;
    if (baseline) continue;
    assert.equal(response.status, route === '/missing-metadata-page' ? 404 : 200, route);
    assert.equal(data.titles.length, 1, route + ' document title');
    assert.equal(data.description.length, 1, route + ' description');
    if (route.startsWith('/metadata-shell')) {
      assert.deepEqual(data.canonical, [route.includes('?') ? 'https://platform.example.test/preferred' : 'https://shell.example.test/original']);
      assert.deepEqual(data.description, [route.includes('?') ? 'Platform description' : 'Shell description']);
    } else if (route === '/missing-metadata-page') {
      assert.deepEqual(data.canonical, []);
      assert.deepEqual(data.robots, ['noindex, nofollow']);
    } else if (route === '/metadata-plugin') {
      assert.deepEqual(data.description, ['Plugin description wins']);
      assert.deepEqual(data.canonical, ['https://plugin.example.test/preferred']);
      assert.deepEqual(data.graphs.map(g => g['@type']), ['WebPage']);
    } else {
      const editor = route === '/posts/metadata-editor';
      const expected = editor ? 'https://editor.example.test/selected' : publicOrigin + route.split('?')[0];
      assert.deepEqual(data.canonical, [expected], route);
      assert.deepEqual(data.ogUrl, [expected], route);
      const article = route.startsWith('/posts/');
      assert.deepEqual(data.type, [article ? 'article' : 'website'], route);
      assert.deepEqual(data.graphs.map(g => g['@type']), [article ? 'BlogPosting' : 'WebSite'], route);
      if (article) {
        assert.equal(data.published.length, 1); assert.equal(data.modified.length, 1);
        assert.equal(data.graphs[0].url, expected);
        assert.equal(data.graphs[0].datePublished, data.published[0]);
        if (editor) {
          assert.deepEqual(data.description, ['Editor description wins']); assert.deepEqual(data.author, ['Synthetic Author']);
          assert.equal(data.graphs[0].author.name, 'Synthetic Author');
          assert.deepEqual(data.robots, ['noindex, nofollow']);
          assert.equal(data.titles[0], 'Editor SEO title | My Site');
        } else assert.deepEqual(data.author, [], 'No fabricated sample author');
      } else assert.equal(data.graphs[0].url, publicOrigin);
    }
  }
  browser = await chromium.launch({ headless: true });
  for (const route of ['/', '/posts/welcome']) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage(), responses = [], external = [], errors = [];
    await context.route('**/*', request => {
      if (new URL(request.request().url()).origin === site.origin) return request.continue();
      external.push(request.request().url()); return request.abort();
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.request().resourceType() === 'script') responses.push(response); });
    await page.goto(site.origin + route); await page.waitForLoadState('networkidle');
    const scripts = await Promise.all(responses.map(async response => {
      const bytes = await response.body(), sizes = await response.request().sizes();
      return { path: new URL(response.url()).pathname, decodedBytes: bytes.length, transferredBodyBytes: sizes.responseBodySize, sha256: createHash('sha256').update(bytes).digest('hex') };
    }));
    assert.deepEqual(errors, [], 'No page JS errors'); assert.deepEqual(external, [], 'No external requests');
    receipt.javascript[route] = { freshContext: true, scripts, decodedBytes: scripts.reduce((n, s) => n + s.decodedBytes, 0), transferredBodyBytes: scripts.reduce((n, s) => n + s.transferredBodyBytes, 0) };
    await context.close();
  }
  receipt.status = 'passed';
} catch (error) { receipt.status = 'failed'; receipt.error = error.message; throw error; }
finally {
  await browser?.close(); await site?.cleanup();
  receipt.cleanup = 'Owned server/temp tree removed; dependency junction unlinked; no working DB/media/env copied';
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(receipt, null, 2) + '\n');
}
console.log(JSON.stringify({ status: receipt.status, mode: receipt.mode, routes: Object.keys(receipt.routes).length, receipt: out }));
