import { test, expect, noOverflow } from './helpers.mjs';

// The expressive layer demo (/_expressive and /_expressive-detail, development and fixture builds
// only). The harness emulates reduced motion everywhere (playwright.config.mjs), so screenshots show
// scroll-driven states at rest; the transition tests switch motion back on for themselves.
const demo = (path = '') => process.env.VISUAL_ORIGIN + '/_expressive' + path;

async function open(page, path = '') {
  const response = await page.goto(demo(path), { waitUntil: 'load' });
  expect(response.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-expressive-demo]')).toBeVisible();
}

async function recordReveal(page) {
  await page.addInitScript(() => {
    window.__reveal = [];
    // Every value the direction takes: a short transition can finish (and clear it) before a frame.
    window.__directions = [];
    new MutationObserver(() => {
      const value = document.documentElement?.getAttribute('data-vt-direction');
      if (value) window.__directions.push(value);
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-vt-direction'] });
    window.__heroNames = [];
    new MutationObserver((records) => {
      for (const record of records) {
        const name = record.target instanceof HTMLElement && record.target.matches('[data-vt-hero-media]') ? record.target.style.viewTransitionName : '';
        if (name) window.__heroNames.push(name);
      }
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['style'] });
    addEventListener('pagereveal', (event) => {
      const root = document.documentElement;
      requestAnimationFrame(() => window.__reveal.push({
        transition: Boolean(event.viewTransition),
        direction: window.__directions.at(-1) ?? null,
        hero: window.__heroNames.at(-1) ?? '',
        arrive: [...document.querySelectorAll('[data-arrive]')].map((el) => getComputedStyle(el).viewTransitionName),
      }));
    });
  });
}

test('behavior expressive cross-document transition: direction, picked-row morph and arrival', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'Navigation behaviour is width-independent; the preview needs a fine pointer.');
  // The harness emulates reduced motion for stable screenshots; this test needs motion allowed.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await recordReveal(page);
  // Chromium skips a cross-document transition when the next page takes too long to arrive (as on a
  // busy test machine); that is the browser's choice, not the script's. Require one real transition
  // in three attempts, and check every value when it runs.
  let reveal = null;
  for (let attempt = 0; attempt < 3 && !reveal?.transition; attempt++) {
    await open(page);
    const row = page.locator('.index-list__row').nth(1);
    await row.hover();
    await expect(row.locator('.index-list__preview')).toHaveCSS('opacity', '1');
    await row.locator('a').click();
    await page.waitForURL(/_expressive-detail/);
    await expect.poll(() => page.evaluate(() => window.__reveal.length)).toBeGreaterThan(0);
    reveal = await page.evaluate(() => window.__reveal.at(-1));
  }
  expect(reveal).toEqual({ transition: true, direction: 'forward', hero: 'hero-media', arrive: ['match-element', 'match-element', 'match-element'] });
  await expect.poll(() => page.evaluate(() => document.documentElement.hasAttribute('data-vt-direction'))).toBe(false);
  await expect.poll(() => page.locator('[data-vt-hero-media]').evaluate((el) => el.style.viewTransitionName)).toBe('');

  // Back by a link marked data-vt-direction="back", then by history: both run the other way.
  const directionAfter = async (navigate, url) => {
    await page.evaluate(() => { window.__reveal = []; });
    await navigate();
    await page.waitForURL(url);
    await expect.poll(() => page.evaluate(() => window.__reveal.length)).toBeGreaterThan(0);
    const last = await page.evaluate(() => window.__reveal.at(-1));
    return last.transition ? last.direction : 'back (no transition)';
  };
  expect(await directionAfter(() => page.locator('a[data-vt-direction="back"]').click(), /_expressive\/?$/)).toMatch(/^back/);
  expect(await directionAfter(() => page.goBack(), /_expressive-detail/)).toMatch(/^back/);
});

test('behavior expressive transitions stand down with reduced motion', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'Width-independent.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await recordReveal(page);
  await page.locator('.media-stage a.btn').click();
  await page.waitForURL(/_expressive-detail/);
  await expect.poll(() => page.evaluate(() => window.__reveal.at(-1))).toEqual({ transition: false, direction: null, hero: '', arrive: ['none', 'none', 'none'] });
});

test('behavior expressive styles under ClientRouter', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'Width-independent.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page, '?router');
  await page.evaluate(() => {
    window.__seen = [];
    new MutationObserver(() => {
      const root = document.documentElement;
      if (root.matches(':active-view-transition')) window.__seen.push({ direction: root.getAttribute('data-vt-direction'), style: root.getAttribute('data-transition-style'), arrive: getComputedStyle(document.querySelector('[data-arrive]')).viewTransitionName });
    }).observe(document.documentElement, { attributes: true, subtree: true, childList: true });
  });
  await page.locator('.index-list__row').first().locator('a').click();
  await page.waitForURL(/_expressive-detail\/?\?router/);
  await expect.poll(() => page.evaluate(() => window.__seen.at(-1))).toEqual({ direction: 'forward', style: 'lift', arrive: 'match-element' });
});

test('reflow expressive layer: bleed without sideways scroll, heading on the first screen, fitted line wraps when enlarged', async ({ page }, info) => {
  await open(page);
  await noOverflow(page);
  const heading = await page.locator('.media-stage h1').boundingBox();
  const viewport = page.viewportSize();
  expect(heading.y + heading.height, 'the stage heading is on the first screen').toBeLessThanOrEqual(viewport.height);
  const stage = await page.locator('.media-stage').boundingBox();
  expect(Math.round(stage.width)).toBeGreaterThanOrEqual(viewport.width - 20);

  // Browser zoom (desktop): at 500% zoom the page is a fifth as wide in CSS pixels. The fitted line must be
  // at least twice its 100% size there (its rem floor), and wrap rather than overflow.
  if (info.project.name !== 'chromium-1440') return;
  const at100 = await page.locator('#statement').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  await page.setViewportSize({ width: Math.round(viewport.width / 5), height: viewport.height });
  const at500 = await page.locator('#statement').evaluate((el) => ({ size: parseFloat(getComputedStyle(el).fontSize), fits: el.scrollWidth <= el.clientWidth + 1 }));
  expect(at500.size * 5, 'zoom can double the fitted line').toBeGreaterThanOrEqual(at100 * 2 - 0.5);
  expect(at500.fits, 'the fitted line wraps instead of overflowing').toBe(true);
  await page.setViewportSize(viewport);
  await noOverflow(page);
});

test('behavior expressive index keyboard focus shows the row and its preview', async ({ page }, info) => {
  await open(page);
  const link = page.locator('.index-list__row a').first();
  await link.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  const row = page.locator('.index-list__row').first();
  expect(await row.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
  const preview = row.locator('.index-list__preview');
  if (info.project.name === 'chromium-1440') await expect(preview).toHaveCSS('opacity', '1');
});

test('behavior expressive content without JavaScript', async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: info.project.use.viewport });
  const page = await context.newPage();
  await page.goto(demo(), { waitUntil: 'load' });
  await expect(page.locator('.media-stage h1')).toBeVisible();
  await expect(page.locator('.index-list__row')).toHaveCount(3);
  for (const frame of await page.locator('[data-reveal="frame"]').all()) await expect(frame).toBeVisible();
  await noOverflow(page);
  await context.close();
});

test('capture expressive layer at rest', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  for (const [selector, name] of [['.media-stage', 'expressive-stage.png'], ['section[aria-labelledby="statement"]', 'expressive-statement.png'], ['section[aria-labelledby="shapes"]', 'expressive-shapes.png'], ['section[aria-labelledby="index"]', 'expressive-index.png'], ['section[aria-labelledby="tones"]', 'expressive-tones.png']]) {
    const region = page.locator(selector).first();
    await region.scrollIntoViewIfNeeded();
    // Lazy images load once in view; wait for the ones in this region.
    await expect.poll(() => region.evaluate((el) => [...el.querySelectorAll('img')].filter((img) => img.getClientRects().length).every((img) => img.complete && img.naturalWidth > 0))).toBe(true);
    await expect(region).toHaveScreenshot(name);
  }
});
