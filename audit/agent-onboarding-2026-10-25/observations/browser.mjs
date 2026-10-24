import { chromium } from '@playwright/test';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const [origin, fixture, output] = process.argv.slice(2);
const parsed = new URL(origin);
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname));
const routes = [
  { path: '/', heading: 'Practical workshops for clearer teamwork.', copy: ['Short, hands-on sessions for people who lead small teams.'] },
  { path: '/workshops/', heading: 'Upcoming workshops', copy: ['Clear project briefs', 'Leave with a clear brief and manageable next steps.', 'Better team check-ins', 'Make space for useful updates, questions and decisions.'] },
  { path: '/contact/', heading: 'Find the right workshop', copy: ['Email us to ask a question or reserve a place.'] },
];
await mkdir(output, { recursive: true });
const report = { reviewerKind: 'agent-operated mechanical/browser observations', platform: process.platform, origin, fixture, routes: [], pageErrors: [], externalRequests: [], limitations: ['No email sent, editor authentication, deployment, screen-reader or physical-device acceptance.'] };
let browser;
try {
  browser = await chromium.launch({ headless: true });
  report.chromium = browser.version();
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.protocol.startsWith('http') && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) report.externalRequests.push(url.href);
    });
    for (const route of routes) {
      const response = await page.goto(new URL(route.path, origin).href, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, route.path);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('main').count(), 1);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal((await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim(), route.heading);
      const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
      for (const supplied of route.copy) assert.ok(text.includes(supplied), supplied);
      assert.ok(text.includes('Fieldnote Workshops'));
      assert.ok(!text.includes('My Site') && !text.includes('Welcome to Baseline'));
      const navigation = await page.locator('header a').evaluateAll(links => links.map(link => ({text: link.textContent.trim(), href: link.getAttribute('href')})));
      const normalizePath = value => new URL(value, origin).pathname.replace(/\/+$/, '') || '/';
      for (const target of ['/', '/workshops/', '/contact/']) assert.ok(navigation.some(link => link.href && normalizePath(link.href) === normalizePath(target)), `navigation ${target}`);
      const mailto = await page.locator('a[href^="mailto:"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
      if (route.path !== '/') assert.ok(mailto.length > 0, 'email journey');
      for (const href of mailto) assert.equal(decodeURIComponent(href.split('?')[0]), 'mailto:workshops@fieldnote.example.test');
      const geometry = await page.evaluate(() => ({viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth}));
      assert.ok(geometry.scroll <= geometry.viewport + 1, `${route.path} overflow at ${width}`);
      const dates = await page.locator('time').evaluateAll(items => items.map(item => ({datetime: item.getAttribute('datetime'), text: item.textContent.trim()})));
      if (route.path === '/workshops/') for (const date of ['2026-11-12', '2026-11-26']) assert.ok(dates.some(item => item.datetime?.startsWith(date)), date);
      const screenshot = `${route.path === '/' ? 'home' : route.path.split('/')[1]}-${width}.png`;
      await page.screenshot({path: path.join(output, screenshot), fullPage: true});
      await page.keyboard.press('Tab');
      const firstFocus = await page.evaluate(() => ({tag: document.activeElement.tagName, href: document.activeElement.getAttribute('href'), text: document.activeElement.textContent.trim()}));
      assert.ok(firstFocus.href?.startsWith('#'), 'first Tab reaches skip link');
      await page.keyboard.press('Enter');
      const skipTarget = await page.evaluate(() => ({tag: document.activeElement.tagName, id: document.activeElement.id}));
      assert.equal(skipTarget.tag, 'MAIN', 'skip link targets main');
      report.routes.push({path: route.path, width, status: response.status(), title: await page.title(), navigation, mailto, dates, geometry, firstFocus, skipTarget, screenshot});
    }
    await page.close();
  }
  for (const pathname of ['/not-a-real-page/', '/_styleguide/']) {
    const response = await fetch(new URL(pathname, origin));
    assert.equal(response.status, 404, pathname);
  }
  await assert.rejects(access(path.join(fixture, 'dist', 'server')));
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.externalRequests, []);
  report.status = 'pass';
} catch (error) {
  report.status = 'fail'; report.error = error.stack; process.exitCode = 1;
} finally {
  await browser?.close();
  await writeFile(path.join(output, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({status: report.status, chromium: report.chromium, routeObservations: report.routes.length, error: report.error}, null, 2));
}
