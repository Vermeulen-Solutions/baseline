// Optional local integration verification; not part of network-free npm test.
// Run after verify/build/fixtures:build in an independently installed generated site.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import { createServer as socketServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { skipLinkJourney, fieldErrorJourney, reducedMotionJourney, textSpacingJourney } from './journeys/public.mjs';
import { disclosureJourney, intrinsicLayoutJourney } from './journeys/composition.mjs';
import { assertReleaseArtifact } from '../scripts/assert-release-artifact.mjs';
import { parse } from 'parse5';
import sharp from 'sharp';

const option = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
const browserRequested = process.argv.includes('--browser') || process.argv.includes('--public-browser');
if (browserRequested && (process.env.CI || process.env.GITHUB_ACTIONS === 'true')) throw new Error('Browser verification is local-only; CI may run HTTP checks only');
if (!option('--root')) throw new Error('Use --root <generated-static-project> [--browser] [--screenshots <directory>]');
const root = path.resolve(option('--root'));
const expectedSite = option('--site-url') || process.env.SITE_URL;
const config = JSON.parse(await fs.readFile(path.join(root, 'baseline.config.json'), 'utf8'));
assert.ok(['static', 'static-sveltia'].includes(config.platformProfile));
const report = { platform: process.platform, independentDependencies: true, development: {}, production: {}, fixtures: {}, browser: 'not requested' };
assert.equal((await fs.lstat(path.join(root, 'node_modules'))).isSymbolicLink(), false, 'Verify an independent installation, not the baseline node_modules');
await assertReleaseArtifact(path.join(root, 'dist'));
await assert.rejects(assertReleaseArtifact(path.join(root, 'dist-fixtures')), /Refusing fixture-enabled/);

let child, browser;
const servers = [];
async function stopChild() {
  if (child && child.exitCode === null) {
    const stopped = once(child, 'exit');
    const timer = setTimeout(() => child.kill('SIGKILL'), 5000); timer.unref();
    child.kill(); try { await stopped; } finally { clearTimeout(timer); }
  }
  child = undefined;
}
async function images(origin, html) {
  const urls = [...new Set([...html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&')))];
  assert.ok(urls.length > 0);
  for (const url of urls) assert.equal((await fetch(new URL(url, origin))).status, 200, url);
  return urls.length;
}
async function staticServer(directory) {
  const base = path.resolve(directory);
  const types = { '.html': 'text/html', '.yml': 'text/yaml', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.gif': 'image/gif', '.woff2': 'font/woff2' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let target = path.resolve(base, '.' + pathname);
      if (!target.startsWith(base + path.sep) && target !== base) { response.writeHead(403); response.end(); return; }
      try { if ((await fs.stat(target)).isDirectory()) target = path.join(target, 'index.html'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      let bytes, status = 200;
      try { bytes = await fs.readFile(target); }
      catch (error) { if (error.code !== 'ENOENT') throw error; bytes = await fs.readFile(path.join(base, '404.html')); status = 404; target = '404.html'; }
      response.writeHead(status, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { response.writeHead(500); response.end(); }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening'); servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}

async function metadata(origin, route, html, { error = false } = {}) {
  const nodes = [];
  const walk = node => { nodes.push(node); for (const child of node.childNodes ?? []) walk(child); }; walk(parse(html));
  const attr = (node, key) => node.attrs?.find(a => a.name === key)?.value;
  const meta = key => nodes.filter(n => n.tagName === 'meta' && (attr(n, 'name') === key || attr(n, 'property') === key)).map(n => attr(n, 'content'));
  const canonical = nodes.filter(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical').map(n => attr(n, 'href'));
  const graphs = nodes.filter(n => n.tagName === 'script' && attr(n, 'type') === 'application/ld+json').map(n => JSON.parse(n.childNodes.map(n => n.value ?? '').join('')));
  assert.equal(nodes.filter(n => n.tagName === 'title').length, 1, route + ' title');
  assert.equal(meta('description').length, 1, route + ' description');
  const article = !error && route.startsWith('/posts/') && route !== '/posts/';
  assert.deepEqual(meta('og:type'), [article ? 'article' : 'website']);
  assert.deepEqual(meta('og:description'), meta('description'));
  assert.deepEqual(meta('twitter:description'), meta('description'));
  assert.deepEqual(meta('og:locale'), [], 'Language-only sample identity must not invent an OpenGraph territory');
  if (error) {
    assert.deepEqual(canonical, []); assert.deepEqual(graphs, []); assert.deepEqual(meta('robots'), ['noindex, nofollow']);
  } else if (expectedSite) {
    const expected = new URL(route, expectedSite).href;
    assert.deepEqual(canonical, [expected]); assert.deepEqual(meta('og:url'), [expected]); assert.deepEqual(meta('twitter:url'), [expected]);
    assert.equal(graphs.length, 1); assert.equal(graphs[0]['@type'], article ? 'BlogPosting' : 'WebSite');
    assert.equal(graphs[0].url, article ? expected : new URL('/', expectedSite).href);
    if (article) {
      assert.deepEqual(meta('article:published_time'), ['2026-01-01T00:00:00.000Z']);
      assert.equal(graphs[0].datePublished, meta('article:published_time')[0]);
      assert.ok(!('author' in graphs[0]) && !('dateModified' in graphs[0]), 'Do not invent absent Markdown fields');
      assert.equal(meta('og:image').length, 1); assert.deepEqual(meta('twitter:image'), meta('og:image'));
      assert.equal(graphs[0].image, meta('og:image')[0]);
      const imageURL = new URL(graphs[0].image);
      assert.equal(imageURL.origin, new URL(expectedSite).origin);
      const image = await fetch(origin + imageURL.pathname); assert.equal(image.status, 200, imageURL.pathname);
      const dimensions = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
      assert.deepEqual(meta('og:image:width'), [String(dimensions.width)]); assert.deepEqual(meta('og:image:height'), [String(dimensions.height)]);
      assert.deepEqual(meta('og:image:type'), ['image/jpeg']);
    }
  } else {
    assert.deepEqual(canonical, []); assert.deepEqual(meta('og:url'), []); assert.deepEqual(graphs, []);
  }
  assert.ok(!html.includes('PRIVATE METADATA DRAFT'), 'Draft content must stay out of public HTML');
  return { canonical, type: meta('og:type'), image: meta('og:image'), graphs };
}

try {
  const socket = socketServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(name)));
  child = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; child.stdout.on('data', chunk => { logs += chunk; }); child.stderr.on('data', chunk => { logs += chunk; });
  const development = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error('Dev server exited: ' + logs);
    try { if ((await fetch(development + '/_styleguide/')).status === 200) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, logs);
  const devHTML = await (await fetch(development + '/_styleguide/')).text();
  assert.ok(devHTML.includes('data-styleguide-ready') && devHTML.includes('native Markdown'));
  assert.ok(!devHTML.includes('data-emdash-ref=') && !devHTML.includes('/_emdash/'));
  report.development = { styleguide: 200, images: await images(development, devHTML), nativeMarkdown: true, writableCMSIdentities: false };
  await stopChild();
  const production = await staticServer(path.join(root, 'dist'));
  const fixtures = await staticServer(path.join(root, 'dist-fixtures'));
  for (const route of ['/', '/posts/', '/posts/welcome/']) {
    const response = await fetch(production + route); assert.equal(response.status, 200, route);
    const html = await response.text(); assert.ok(!html.includes('data-styleguide-ready'));
    const checkedMetadata = await metadata(production, route, html);
    const tracked = await fetch(production + route + '?utm_source=metadata-check');
    assert.equal(tracked.status, 200);
    assert.deepEqual(await metadata(production, route, await tracked.text()), checkedMetadata);
    report.production[route] = { status: 200, images: await images(production, html), metadata: checkedMetadata };
  }
  const missing = await fetch(production + '/missing-metadata-page/'); assert.equal(missing.status, 404);
  report.production.notFound = await metadata(production, '/missing-metadata-page/', await missing.text(), { error: true });
  const draft = await fetch(production + '/posts/metadata-draft/'); assert.equal(draft.status, 404);
  assert.ok(!(await draft.text()).includes('PRIVATE METADATA DRAFT'));
  report.production.draft = '404; excluded from public routes/listings';
  for (const method of ['GET', 'HEAD']) for (const suffix of ['', '/', '?fixtures=1']) {
    const response = await fetch(production + '/_styleguide' + suffix, { method, headers: { cookie: 'fixtures=1' } });
    assert.equal(response.status, 404); assert.ok(!(await response.text()).includes('data-styleguide-ready'));
  }
  report.production.styleguide = '404 for GET/HEAD, slash, query and cookie attempts';
  if (config.platformProfile === 'static-sveltia') {
    for (const asset of ['index.html', 'config.yml']) {
      const response = await fetch(production + '/admin/' + asset);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), await fs.readFile(path.join(root, 'public/admin', asset), 'utf8'));
    }
    report.production.admin = 'HTML and form config served unchanged';
  }
  const fixtureHTML = await (await fetch(fixtures + '/_styleguide/')).text();
  assert.ok(fixtureHTML.includes('data-styleguide-ready'));
  report.fixtures = { styleguide: 200, images: await images(fixtures, fixtureHTML), releaseRejected: true };
  const fixtureNodes = [];
  const collect = node => { fixtureNodes.push(node); for (const child of node.childNodes ?? []) collect(child); };
  collect(parse(fixtureHTML));
  const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
  const disclosures = fixtureNodes.filter(node => node.tagName === 'details');
  assert.equal(disclosures.length, 4, 'Native disclosure specimens rendered');
  for (const disclosure of disclosures) {
    const children = disclosure.childNodes.filter(node => node.tagName);
    assert.equal(children[0].tagName, 'summary');
    assert.ok(children[0].childNodes.length > 0);
    assert.equal(attr(children[0], 'aria-expanded'), undefined, 'Expanded state stays browser-owned');
    assert.equal(attr(disclosure, 'open'), undefined, 'No default-open policy');
    assert.ok(attr(children[1], 'class').split(/\s+/).includes('flow'));
  }
  assert.equal(disclosures.filter(node => attr(node, 'name') === 'specimen-composition-group').length, 2);
  assert.ok(fixtureHTML.includes('native Markdown'), 'Static native Markdown body fallback rendered');
  for (const id of ['specimen-cluster', 'specimen-sidebar-wide', 'specimen-sidebar-narrow', 'specimen-sidebar-single']) {
    assert.equal(fixtureNodes.filter(node => attr(node, 'id') === id).length, 1, id);
  }
  report.fixtures.composition = { nativeDisclosures: 4, firstSummary: true, defaultClosed: true, body: 'native Markdown', intrinsicRegions: 'rendered' };
  if (browserRequested) {
    browser = await chromium.launch({ headless: true });
    const observations = [];
    for (const width of [390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const errors = [], journeys = []; page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', request => errors.push('request failed: ' + request.url()));
      page.on('response', response => { if (response.status() >= 400) errors.push('HTTP ' + response.status() + ': ' + response.url()); });
      await page.route('**/*', route => {
        if ([production, fixtures].includes(new URL(route.request().url()).origin)) return route.continue();
        errors.push('external request: ' + route.request().url()); return route.abort();
      });
      for (const [origin, route] of [[production, '/'], [production, '/posts/welcome/'], [fixtures, '/_styleguide/']]) {
        const response = await page.goto(origin + route); assert.equal(response.status(), 200);
        await expect(page.locator('h1')).toHaveText(route === '/_styleguide/' ? 'Starter component styleguide' : 'Welcome');
        await page.evaluate(() => document.fonts.ready);
        // Load below-the-fold lazy specimens before judging image failures or captures.
        await page.locator('img').evaluateAll(async images => {
          images.forEach(image => { image.loading = 'eager'; });
          await Promise.all(images.map(image => image.decode().catch(() => {})));
        });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, `Overflow: ${width} ${route}`);
        assert.ok(await page.locator('h1').count());
        assert.equal(await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).length), 0);
        if (route === '/') journeys.push({ route, skip: await skipLinkJourney(page, page.locator('main a[href="/posts/welcome/"]').first()) });
        if (route === '/_styleguide/') journeys.push({ route,
          skip: await skipLinkJourney(page, page.getByRole('button', { name: 'Native button', exact: true })),
          composition: await disclosureJourney(page), layout: await intrinsicLayoutJourney(page),
          errors: await fieldErrorJourney(page), motion: await reducedMotionJourney(page),
          ...(width === 390 && { textSpacing: await textSpacingJourney(page, async () => ({ disclosure: await disclosureJourney(page), layout: await intrinsicLayoutJourney(page) })) }),
        });
        if (option('--screenshots') && width === 390) {
          await fs.mkdir(option('--screenshots'), { recursive: true });
          await page.screenshot({ path: path.join(option('--screenshots'), route === '/' ? 'home-390.png' : route.includes('welcome') ? 'post-390.png' : 'styleguide-390.png'), fullPage: true });
        }
        observations.push({ width, route, overflow: false, brokenImages: 0 });
      }
      observations.push({ width, journeys });
      assert.deepEqual(errors, []); await page.close();
    }
    report.browser = { observations, pageErrors: 0, keyboardFocus: 'passed' };
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 900 }, serviceWorkers: 'block' });
    try {
      const page = await context.newPage(), failures = [];
      page.on('pageerror', error => failures.push(error.message));
      page.on('requestfailed', request => failures.push('failed: ' + request.url()));
      await context.route('**/*', async route => {
        if (![production, fixtures].includes(new URL(route.request().url()).origin)) { failures.push('external request'); return route.abort(); }
        if (!route.request().isNavigationRequest()) return route.continue();
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace('</head>', '<script>window.__publicDocumentScriptRan=true</script></head>') });
      });
      assert.equal((await page.goto(production + '/')).status(), 200);
      const skip = await skipLinkJourney(page, page.locator('main a[href="/posts/welcome/"]').first());
      const [post] = await Promise.all([page.waitForNavigation(), page.locator('main a[href="/posts/welcome/"]').first().press('Enter')]);
      assert.equal(post.status(), 200); await expect(page.locator('h1')).toHaveText('Welcome');
      const image = page.locator('main img').first(); await expect(image).toBeVisible();
      assert.ok(await image.evaluate(element => element.complete && element.naturalWidth > 0));
      assert.equal((await page.goto(fixtures + '/_styleguide/')).status(), 200);
      await skipLinkJourney(page, page.getByRole('button', { name: 'Native button', exact: true }));
      const composition = await disclosureJourney(page), layout = await intrinsicLayoutJourney(page);
      await fieldErrorJourney(page);
      await page.getByRole('checkbox', { name: 'Check this sample', exact: true }).press('Space');
      await expect(page.getByRole('checkbox', { name: 'Check this sample', exact: true })).toBeChecked();
      assert.equal(await page.evaluate(() => typeof window.__publicDocumentScriptRan), 'undefined');
      assert.deepEqual(failures, []);
      report.browser.noJavaScript = { sentinelExecuted: false, skip, composition, layout, navigation: 200, nativeCheckbox: true, summaryFocus: true, nativeImage: true, pageErrors: 0 };
    } finally { await context.close(); }
    if (config.platformProfile === 'static-sveltia' && process.argv.includes('--browser')) {
      const admin = await browser.newPage();
      const errors = []; admin.on('pageerror', error => errors.push(error.message));
      await admin.goto(production + '/admin/');
      await admin.getByRole('button', { name: /Sign In.*Access Token/i }).waitFor({ timeout: 45000 });
      assert.deepEqual(errors, [], 'Pinned Sveltia runtime must accept the supplied configuration');
      report.adminBrowser = { pinnedBundleAndConfigLoaded: true, tokenSignInOffered: true, runtimeErrors: 0, credentialedPublishing: 'not tested' };
      await admin.close();
    }
  }
  if (option('--out')) await fs.writeFile(option('--out'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await stopChild();
  await browser?.close();
  for (const server of servers) await new Promise(resolve => server.close(resolve));
}
