// Optional local integration verification; not part of network-free npm test.
// Run after verify/build/fixtures:build in an independently installed generated site.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import { createServer as socketServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { assertReleaseArtifact } from '../scripts/assert-release-artifact.mjs';

const option = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
if (!option('--root')) throw new Error('Use --root <generated-static-project> [--browser] [--screenshots <directory>]');
const root = path.resolve(option('--root'));
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
  const types = { '.html': 'text/html', '.yml': 'text/yaml', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
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
    try { if ((await fetch(development + '/_styleguide')).status === 200) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, logs);
  const devHTML = await (await fetch(development + '/_styleguide')).text();
  assert.ok(devHTML.includes('data-styleguide-ready') && devHTML.includes('native Markdown'));
  assert.ok(!devHTML.includes('data-emdash-ref=') && !devHTML.includes('/_emdash/'));
  report.development = { styleguide: 200, images: await images(development, devHTML), nativeMarkdown: true, writableCMSIdentities: false };
  await stopChild();
  const production = await staticServer(path.join(root, 'dist'));
  const fixtures = await staticServer(path.join(root, 'dist-fixtures'));
  for (const route of ['/', '/posts/', '/posts/welcome/']) {
    const response = await fetch(production + route); assert.equal(response.status, 200, route);
    const html = await response.text(); assert.ok(!html.includes('data-styleguide-ready'));
    report.production[route] = { status: 200, images: await images(production, html) };
  }
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
  if (process.argv.includes('--browser')) {
    browser = await chromium.launch({ headless: true });
    const observations = [];
    for (const width of [390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      for (const [origin, route] of [[production, '/'], [production, '/posts/welcome/'], [fixtures, '/_styleguide/']]) {
        await page.goto(origin + route); await page.evaluate(() => document.fonts.ready);
        // Load below-the-fold lazy specimens before judging image failures or captures.
        await page.locator('img').evaluateAll(async images => {
          images.forEach(image => { image.loading = 'eager'; });
          await Promise.all(images.map(image => image.decode().catch(() => {})));
        });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, `Overflow: ${width} ${route}`);
        assert.ok(await page.locator('h1').count());
        assert.equal(await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).length), 0);
        if (route === '/_styleguide/') {
          await page.getByLabel('Name', { exact: true }).press('Tab');
          assert.equal(await page.locator('#specimen-invalid').evaluate(element => element === document.activeElement), true);
        }
        if (option('--screenshots') && width === 390) {
          await fs.mkdir(option('--screenshots'), { recursive: true });
          await page.screenshot({ path: path.join(option('--screenshots'), route === '/' ? 'home-390.png' : route.includes('welcome') ? 'post-390.png' : 'styleguide-390.png'), fullPage: true });
        }
        observations.push({ width, route, overflow: false, brokenImages: 0 });
      }
      assert.deepEqual(errors, []); await page.close();
    }
    report.browser = { observations, pageErrors: 0, keyboardFocus: 'passed' };
    if (config.platformProfile === 'static-sveltia') {
      const admin = await browser.newPage();
      const errors = []; admin.on('pageerror', error => errors.push(error.message));
      await admin.goto(production + '/admin/');
      await admin.getByRole('button', { name: /Sign In.*Access Token/i }).waitFor({ timeout: 45000 });
      assert.deepEqual(errors, [], 'Pinned Sveltia runtime must accept the supplied configuration');
      report.adminBrowser = { pinnedBundleAndConfigLoaded: true, tokenSignInOffered: true, runtimeErrors: 0, credentialedPublishing: 'not tested' };
      await admin.close();
    }
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await stopChild();
  await browser?.close();
  for (const server of servers) await new Promise(resolve => server.close(resolve));
}
