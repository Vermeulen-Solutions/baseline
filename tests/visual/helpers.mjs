import { test as base, expect } from '@playwright/test';
import { visualContract as contract } from './contract.mjs';

export function observe(page) {
  const problems = [];
  page.on('pageerror', error => problems.push(`page exception: ${error.message}`));
  page.on('requestfailed', request => problems.push(`${request.resourceType()} request failed: ${new URL(request.url()).pathname}`));
  page.on('response', response => {
    if (response.status() >= 400 && response.request().resourceType() !== 'document') problems.push(`${response.request().resourceType()} HTTP ${response.status()}: ${new URL(response.url()).pathname}`);
  });
  return problems;
}
export async function settlePage(page, { scripts = true } = {}) {
  for (let y = 0, height = await page.evaluate(() => document.documentElement.scrollHeight); y < height; y += 600) {
    await page.evaluate(y => scrollTo(0, y), y);
    if (scripts) await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    else await page.screenshot(); // Native paint without scheduling blocked page-JS callbacks.
  }
  await page.evaluate(() => scrollTo(0, 0));
}
export async function prepare(page, route, problems = [], { scripts = true } = {}) {
  const response = await page.goto(process.env.VISUAL_ORIGIN + route.path, { waitUntil: 'load' });
  expect(response.status(), `route status ${route.path}`).toBe(route.status);
  await expect(page.locator('h1'), `route identity ${route.path}: setup/login pages are not fixtures`).toHaveText(route.heading);
  await expect(page.locator('main')).toContainText(route.text);
  if (route.name === 'styleguide') await expect(page.locator('[data-styleguide-ready]')).toHaveAttribute('data-fixture-version', String(contract.fixtureVersion));
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([document.fonts.load('400 16px "Noto Sans"'), document.fonts.load('700 16px "Noto Sans"')]);
  });
  expect(await page.evaluate(() => [...document.fonts].filter(font => font.family.replaceAll('"', '') === 'Noto Sans' && font.status === 'loaded').length), 'required local font faces').toBeGreaterThanOrEqual(2);
  await settlePage(page, { scripts });
  // Inert, display:none ticker clones are intentionally not fetched by native lazy loading.
  await expect.poll(() => page.evaluate(() => [...document.images].filter(image => !image.closest('.logo-ticker__duplicate[aria-hidden="true"][inert]')).every(image => image.complete)), { timeout: 10000, message: 'visible image loading' }).toBe(true);
  const broken = await page.evaluate(async () => {
    const result = [];
    for (const image of document.images) {
      if (image.closest('.logo-ticker__duplicate[aria-hidden="true"][inert]')) continue;
      try { await image.decode(); } catch { result.push(new URL(image.currentSrc || image.src).pathname); }
    }
    return result;
  });
  expect(problems, 'capture network/runtime readiness').toEqual([]);
  expect(broken, 'decoded image readiness').toEqual([]);
  await expect(page.locator('[data-emdash-ref]')).toHaveCount(0);
  await page.evaluate(() => scrollTo(0, 0));
}
export async function noOverflow(page) {
  const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
    outliers: [...document.querySelectorAll('h1,h2,h3,p,li,dt,dd,input,select,label')].filter(element => { const rect = element.getBoundingClientRect(); return rect.right > document.documentElement.clientWidth + 1 && !element.closest('pre,.emdash-table-wrapper,.logo-ticker__viewport'); }).slice(0, 8).map(element => ({ tag: element.tagName, text: element.textContent?.slice(0, 80), right: element.getBoundingClientRect().right })) }));
  expect(dimensions.scroll, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.client + 1);
  return dimensions;
}
export async function galleryCaptionsFit(page) {
  const captions = page.locator('.photo-caption');
  for (const caption of await captions.all()) {
    await caption.scrollIntoViewIfNeeded();
    const bounds = await caption.evaluate(element => ({ caption: element.getBoundingClientRect().bottom, item: element.parentElement.getBoundingClientRect().bottom }));
    expect(bounds.caption, 'Gallery caption must fit its item rather than overlap the next row').toBeLessThanOrEqual(bounds.item + 1);
  }
}
export const styleguide = contract.routes.find(route => route.name === 'styleguide');
export const controls = page => page.locator('section[aria-labelledby="controls"]');
export const test = base.extend({
  page: async ({ page }, use, info) => {
    if (info.config.updateSnapshots !== 'none' && (process.env.VISUAL_UPDATE !== '1' || process.env.CI)) throw new Error('Only local test:visual -- --update may update snapshots');
    await page.clock.setFixedTime(new Date(contract.date));
    const problems = observe(page);
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== process.env.VISUAL_ORIGIN) { problems.push('unexpected external request: ' + url.origin); await route.abort(); }
      else await route.continue();
    });
    page.visualProblems = problems;
    await use(page);
    await info.attach('browser-diagnostics', { body: JSON.stringify({ problems, browser: page.context().browser()?.version(), viewport: page.viewportSize() }), contentType: 'application/json' });
    if (!info.title.startsWith('sensitivity ')) expect(problems, 'complete browser-state runtime/network health').toEqual([]);
  },
});
export { expect };
