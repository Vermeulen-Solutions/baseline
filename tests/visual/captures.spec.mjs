import { test, expect, prepare, noOverflow, styleguide, controls } from './helpers.mjs';
import { visualContract as contract } from './contract.mjs';

for (const route of contract.routes) test(`capture ${route.name}`, async ({ page }) => {
  await prepare(page, route, page.visualProblems);
  await noOverflow(page);
  await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
});

test('capture targeted controls and keyboard focus', async ({ page }) => {
  await prepare(page, styleguide, page.visualProblems);
  await expect(controls(page)).toHaveScreenshot('controls.png');
  await page.getByLabel('Name', { exact: true }).press('Tab');
  await expect(page.locator('#specimen-invalid')).toBeFocused();
  await expect(controls(page)).toHaveScreenshot('controls-focus.png');
});

test('behavior gallery opens, advances and restores keyboard focus', async ({ page }) => {
  await prepare(page, styleguide, page.visualProblems);
  const first = page.locator('[data-photo-gallery] a[data-lightbox]').first();
  await first.press('Enter');
  await expect(page.locator('.pswp--open')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.pswp__counter')).toHaveText(/^2\s*\/\s*2$/);
  await expect(page).toHaveScreenshot('gallery-open.png');
  await page.keyboard.press('Escape');
  await expect(page.locator('.pswp--open')).toHaveCount(0);
  await expect(first).toBeFocused();
});
