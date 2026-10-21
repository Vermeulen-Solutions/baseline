import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

// Run against a fresh production build with its local preview already running.
const origin = process.env.WORKSHOPS_PREVIEW_URL || 'http://127.0.0.1:45882';
const draftMarkers = ['Winter planning clinic', 'winter-planning-clinic', 'A working session for planning the next quarter.'];
const files = await fs.readdir('dist', { recursive: true });
for (const file of files.filter(file => /\.(html|js|mjs|json|xml|txt)$/.test(file))) {
  const content = await fs.readFile(path.join('dist', file), 'utf8');
  for (const marker of draftMarkers) assert.ok(!content.includes(marker), `${file} exposes ${marker}`);
}
assert.ok(files.includes(path.join('workshops', 'index.html')) || files.includes('workshops/index.html'));

const browser = await chromium.launch();
const results = [];
try {
  for (const width of [320, 390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`${origin}/workshops/`);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').textContent(), 'Workshops');
    assert.equal(await page.locator('main article').count(), 1);
    const article = page.locator('main article#clear-project-briefs');
    assert.equal(await article.locator('h2').textContent(), 'Clear project briefs');
    assert.equal(await article.locator('time').getAttribute('datetime'), '2026-11-12');
    assert.equal(await article.locator('time').textContent(), '12 November 2026');
    assert.ok((await article.textContent()).includes('Northline Studio'));
    assert.ok((await article.textContent()).includes('Learn how to turn an initial conversation into a useful project brief.'));
    const action = article.getByRole('link', { name: 'Ask about a place', exact: true });
    assert.equal(await action.getAttribute('href'), 'mailto:hello@northline.example.test');
    assert.equal(await page.locator('main form, main script').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
    const focus = await page.locator(':focus').evaluate(node => ({ style: getComputedStyle(node).outlineStyle, width: getComputedStyle(node).outlineWidth }));
    assert.notEqual(focus.style, 'none');
    assert.notEqual(focus.width, '0px');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'main-content');
    await page.goto(`${origin}/workshops/`);
    let reached = false;
    for (let step = 0; step < 15; step++) {
      await page.keyboard.press('Tab');
      if (await page.locator(':focus').textContent() === 'Ask about a place') { reached = true; break; }
    }
    assert.ok(reached, 'email action is reachable in natural keyboard order');
    assert.equal(await action.evaluate(node => node.matches(':focus-visible') && getComputedStyle(node).outlineStyle !== 'none'), true);
    await page.screenshot({ path: `audit/workshops-${width}.png`, fullPage: true });
    await page.addStyleTag({ content: 'p { line-height: 1.5 !important; margin-bottom: 2em !important; } * { letter-spacing: .12em !important; word-spacing: .16em !important; }' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `text spacing at ${width}`);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `200% text at ${width}`);
    results.push({ width, content: 'pass', overflow: false, keyboard: 'pass', textSpacingAndResize: 'pass' });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  for (const route of ['/', '/services/', '/about/', '/contact/', '/posts/', '/posts/welcome/']) {
    assert.equal((await page.goto(`${origin}${route}`)).status(), 200, route);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Workshops', exact: true }).getAttribute('href'), '/workshops/');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route);
  }
  const images = await page.locator('main img').evaluateAll(nodes => nodes.map(node => ({ loaded: node.complete && node.naturalWidth > 0, alt: node.alt })));
  assert.ok(images.length > 0 && images.every(image => image.loaded && image.alt));
  await page.goto(origin);
  const nav = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Workshops', exact: true });
  await nav.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(`${origin}/workshops/`);
  for (const route of ['/_styleguide/', '/workshops/winter-planning-clinic/', '/workshops/clear-project-briefs/']) {
    assert.equal((await page.goto(`${origin}${route}`)).status(), 404, route);
  }
  await page.close();
  console.log(JSON.stringify({ results, publicDraftScan: 'pass', existingRoutes: 'pass', nativePostImage: 'pass', navigationKeyboardActivation: 'pass', noWorkshopDetailsOrProductionStyleguide: 'pass' }, null, 2));
} finally {
  await browser.close();
}
