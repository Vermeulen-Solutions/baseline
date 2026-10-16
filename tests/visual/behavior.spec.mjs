import { chromium } from '@playwright/test';
import path from 'node:path';
import { test, expect, prepare, settlePage, noOverflow, galleryCaptionsFit, styleguide, observe } from './helpers.mjs';
import { visualContract as contract } from './contract.mjs';

const ticker = page => page.getByRole('region', { name: 'Synthetic partner ticker', exact: true });
async function assertSeam(root, rtl = false) {
  const result = await root.evaluate((element, rtl) => {
    const groups = [...element.querySelectorAll('ul')];
    const animations = groups.map(group => group.getAnimations()[0]);
    if (animations.some(animation => !animation)) throw new Error('Expected two actual CSS animations');
    return [0, .5, .999].map(phase => {
      animations.forEach(animation => { animation.pause(); animation.currentTime = Number(animation.effect.getTiming().duration) * phase; });
      const [a, b] = groups.map(group => group.getBoundingClientRect());
      const viewport = element.querySelector('.logo-ticker__viewport').getBoundingClientRect();
      const visibleItems = [...element.querySelectorAll('li')].filter(item => { const r = item.getBoundingClientRect(); return Math.min(r.right, viewport.right) - Math.max(r.left, viewport.left) > 1; }).length;
      return { phase, width: a.width, duplicateWidth: b.width, seam: Math.abs(rtl ? a.left - b.right : a.right - b.left), viewport: viewport.width, coverageStart: Math.min(a.left, b.left) - viewport.left, coverageEnd: Math.max(a.right, b.right) - viewport.right, visibleItems };
    });
  }, rtl);
  for (const frame of result) {
    // Transformed DOMRects can differ by ~0.0001px despite equal CSS widths.
    expect(frame.seam).toBeLessThan(1); expect(Math.abs(frame.width - frame.duplicateWidth)).toBeLessThan(.01); expect(frame.width + .01).toBeGreaterThanOrEqual(frame.viewport);
    expect(frame.coverageStart, 'Tracks must cover viewport start').toBeLessThanOrEqual(1);
    expect(frame.coverageEnd, 'Tracks must cover viewport end').toBeGreaterThanOrEqual(-1);
    expect(frame.visibleItems, 'Actual logo content must remain visible').toBeGreaterThan(0);
  }
  return result;
}

test('behavior ticker active motion, native stop, pause, RTL seam', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await prepare(page, styleguide, page.visualProblems);
  const root = ticker(page), group = root.locator('ul').first(), toggle = root.locator('input');
  await expect(toggle).toBeChecked();
  await page.mouse.move(0, 0);
  const start = await group.evaluate(element => getComputedStyle(element).transform);
  await expect.poll(() => group.evaluate(element => getComputedStyle(element).transform)).not.toBe(start);
  await root.hover();
  await expect.poll(() => group.evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused');
  await page.mouse.move(0, 0);
  await toggle.press('Space');
  await expect(toggle).not.toBeChecked();
  await expect(root.locator('ul[aria-hidden]')).toBeHidden();
  await toggle.press('Space');
  await expect.poll(() => group.evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused');
  await toggle.press('Tab');
  await expect.poll(() => group.evaluate(element => getComputedStyle(element).animationPlayState)).toBe('running');
  const seam = await assertSeam(root);
  await expect(root).toHaveScreenshot('ticker-active.png', { animations: 'allow' });
  const rtl = page.getByRole('region', { name: 'Single static RTL logo' });
  await rtl.locator('input').check();
  const rtlSeam = await assertSeam(rtl, true);
  await expect(rtl).toHaveScreenshot('ticker-rtl.png', { animations: 'allow' });
  await expect(root.locator('ul[aria-hidden]')).toHaveAttribute('inert', '');
  await expect(page.locator('#specimen-empty-logos-motion')).toHaveCount(0);
  await info.attach('seam-geometry', { body: JSON.stringify({ seam, rtlSeam }), contentType: 'application/json' });
});

test('behavior reduced motion and print preserve a single complete list', async ({ page }) => {
  await prepare(page, styleguide, page.visualProblems);
  const root = ticker(page);
  await expect(root.locator('input')).toBeHidden();
  await expect(root.locator('ul[aria-hidden]')).toBeHidden();
  expect(await root.locator('ul').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await expect(root).toHaveScreenshot('ticker-reduced.png');
  await page.emulateMedia({ media: 'print', reducedMotion: 'no-preference' });
  await expect(root.locator('input')).toBeHidden();
  await expect(root.locator('ul[aria-hidden]')).toBeHidden();
});

test('behavior no-JS native controls, ticker and gallery fallback', async ({ browser, page: scriptPage }, info) => {
  const instrument = async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('</head>', '<script>window.__visualDocumentScriptExecuted = true</script></head>') });
  };
  // addInitScript is privileged automation and runs even when document JS is disabled.
  await scriptPage.route('**/_styleguide', instrument);
  await scriptPage.goto(process.env.VISUAL_ORIGIN + '/_styleguide');
  expect(await scriptPage.evaluate(() => window.__visualDocumentScriptExecuted)).toBe(true);
  const context = await browser.newContext({ viewport: info.project.use.viewport, javaScriptEnabled: false, reducedMotion: 'no-preference', locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light', deviceScaleFactor: 1 });
  try {
    const page = await context.newPage(), problems = observe(page);
    await context.route('**/*', route => new URL(route.request().url()).origin === process.env.VISUAL_ORIGIN ? route.continue() : route.abort());
    await page.route('**/_styleguide', instrument);
    await prepare(page, styleguide, problems, { scripts: false });
    expect(await page.evaluate(() => typeof window.__visualDocumentScriptExecuted)).toBe('undefined');
    const root = ticker(page);
    await root.locator('input').press('Space');
    await expect(root.locator('input')).not.toBeChecked();
    await expect(root.locator('ul[aria-hidden]')).toBeHidden();
    await page.getByRole('checkbox', { name: 'Check this sample', exact: true }).press('Space');
    await expect(page.getByRole('checkbox', { name: 'Check this sample', exact: true })).toBeChecked();
    await expect(page.locator('[data-photo-gallery] a[data-lightbox]').first()).toHaveAttribute('href', /_astro\//);
    await noOverflow(page);
    await expect(page).toHaveScreenshot('styleguide-no-js.png', { fullPage: true });
    const [navigation] = await Promise.all([page.waitForNavigation(), page.locator('[data-photo-gallery] a[data-lightbox]').first().press('Enter')]);
    expect(navigation.status()).toBe(200);
    expect(navigation.headers()['content-type']).toContain('image/svg+xml');
    expect(problems, 'no-JS runtime/network health').toEqual([]);
  } finally { await context.close(); }
});

test('reflow 320px with text-spacing overrides and native keyboard controls', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-390', 'One explicit narrow placement');
  await page.setViewportSize({ width: 320, height: 900 });
  await prepare(page, styleguide, page.visualProblems);
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-block-end: 2em !important; }' });
  await settlePage(page);
  await noOverflow(page);
  await galleryCaptionsFit(page);
  await page.getByRole('combobox', { name: 'Selection' }).press('ArrowDown');
  await page.getByRole('radio', { name: 'First radio', exact: true }).press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Second radio', exact: true })).toBeChecked();
  await page.getByRole('link', { name: 'Required sample', exact: true }).press('Enter');
  await expect(page.locator('#specimen-invalid')).toBeFocused();
  await expect(page).toHaveScreenshot('text-spacing-320.png', { fullPage: true });
});

test('zoom actual Chromium page zoom at 200% and 400%', async ({}, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'Separate 1280px physical viewport for actual browser zoom');
  const extension = path.resolve('tests/visual/zoom-extension');
  const context = await chromium.launchPersistentContext('', { headless: true, channel: 'chromium', viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce', args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const page = await context.newPage(), problems = observe(page);
    await page.route('**/*', route => new URL(route.request().url()).origin === process.env.VISUAL_ORIGIN ? route.continue() : route.abort());
    await prepare(page, styleguide, problems);
    const measurements = [];
    for (const factor of [2, 4]) {
      const zoom = await worker.evaluate(async factor => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find(tab => tab.url?.includes('/_styleguide'));
        if (!tab) throw new Error('Owned zoom fixture tab missing');
        await chrome.tabs.setZoom(tab.id, factor);
        return chrome.tabs.getZoom(tab.id);
      }, factor);
      expect(zoom).toBeCloseTo(factor, 8);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1280 / factor);
      expect(await page.evaluate(() => devicePixelRatio)).toBeCloseTo(factor, 8);
      await settlePage(page);
      const dimensions = await noOverflow(page);
      await galleryCaptionsFit(page);
      measurements.push({ factor, innerWidth: await page.evaluate(() => innerWidth), dpr: await page.evaluate(() => devicePixelRatio), ...dimensions });
      await page.getByLabel('Name', { exact: true }).press('Tab');
      await expect(page.locator('#specimen-invalid')).toBeFocused();
      await expect(page).toHaveScreenshot(`zoom-${factor * 100}.png`, { fullPage: true });
    }
    await info.attach('actual-page-zoom', { body: JSON.stringify(measurements), contentType: 'application/json' });
    expect(problems, 'zoom runtime/network health').toEqual([]);
  } finally { await context.close(); }
});
