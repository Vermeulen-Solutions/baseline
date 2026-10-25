import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { availableLoopbackPort } from '../../scripts/loopback-port.mjs';
const [root, phase, output] = process.argv.slice(2);
assert.ok(['before', 'after'].includes(phase));
const port = await availableLoopbackPort();
const origin = `http://127.0.0.1:${port}`;
const report = { phase, platform: process.platform, observations: [], pageErrors: [], externalRequests: [], resource: {} };
await fs.mkdir(output, { recursive: true });
let server, browser;
try {
  server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port)], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  report.resource.pid = server.pid;
  let log = '';
  for (const stream of [server.stdout, server.stderr]) stream.on('data', data => { log = (log + String(data)).slice(-4000); });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    assert.equal(server.exitCode, null, log);
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, log);
  browser = await chromium.launch({ headless: true });
  report.chromium = browser.version();
  const routes = [['/', 'Notes for clearer teamwork'], ['/posts/', 'Posts'], ['/posts/welcome/', 'A clearer brief'], ['/posts/check-ins/', 'Make room in a check-in']];
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => report.pageErrors.push(e.message));
    page.on('request', request => { if (new URL(request.url()).origin !== origin) report.externalRequests.push(request.url()); });
    for (const [route, title] of routes) {
      const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('main').count(), 1);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('h1').innerText(), title);
      const text = await page.locator('main').innerText();
      assert.ok(!text.includes('Private planning note'));
      const labels = text.match(/\b\d+ min read\b/g) ?? [];
      assert.deepEqual(labels, phase === 'after' && route === '/posts/welcome/' ? ['5 min read'] : []);
      const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(geometry.scroll <= geometry.viewport + 1, `${route} overflow at ${width}`);
      const images = await page.locator('main img').evaluateAll(items => items.map(i => ({ alt: i.alt, complete: i.complete, width: i.naturalWidth })));
      for (const image of images) assert.ok(image.complete && image.width > 0, image.alt);
      const nav = await page.locator('header a').evaluateAll(items => items.map(i => ({ text: i.textContent.trim(), href: i.getAttribute('href') })));
      assert.deepEqual(nav.map(n => n.href), ['/', '/', '/posts/']);
      await page.keyboard.press('Tab');
      assert.ok((await page.evaluate(() => document.activeElement.getAttribute('href')))?.startsWith('#'));
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'MAIN');
      const observation = { route, width, title: await page.title(), text, geometry, images, nav };
      if ([375, 1440].includes(width) && ['/posts/', '/posts/welcome/'].includes(route)) {
        observation.screenshot = `${route === '/posts/' ? 'listing' : 'detail'}-${width}.png`;
        await page.screenshot({ path: path.join(output, observation.screenshot), fullPage: true });
      }
      report.observations.push(observation);
    }
    await page.close();
  }
  for (const route of ['/posts/draft-planning/', '/_styleguide/']) assert.equal((await fetch(origin + route)).status, 404, route);
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.externalRequests, []);
  if (phase === 'after') {
    const before = JSON.parse(await fs.readFile(path.join(output, '../before/browser.json'), 'utf8'));
    for (const current of report.observations.filter(o => o.route !== '/posts/welcome/')) {
      const previous = before.observations.find(o => o.route === current.route && o.width === current.width);
      for (const key of ['title', 'text', 'geometry', 'images', 'nav']) assert.deepEqual(current[key], previous[key], `${current.route}: ${key}`);
    }
    report.referencePagesPreserved = true;
  }
  report.status = 'pass';
} catch (error) { report.status = 'fail'; report.error = error.stack; process.exitCode = 1; }
finally {
  await browser?.close(); report.resource.browserClosed = true;
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = once(server, 'exit');
    const timer = setTimeout(() => server.kill('SIGKILL'), 5000); timer.unref(); server.kill();
    try { await exited; } finally { clearTimeout(timer); }
  }
  report.resource.serverStopped = !server || server.exitCode !== null || server.signalCode !== null;
  await fs.writeFile(path.join(output, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ phase, status: report.status, observations: report.observations.length, error: report.error, resource: report.resource }));
}
