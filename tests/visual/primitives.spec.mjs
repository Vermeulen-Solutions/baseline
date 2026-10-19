import { test, expect } from '@playwright/test';

test('behavior: malformed CMS media and native disclosure state remain usable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(process.env.VISUAL_ORIGIN + '/primitive-edge');
  expect(response.status()).toBe(200);
  await expect(page.locator('.editorial-image')).toHaveCount(3);
  await expect(page.locator('.image-fallback').first()).toHaveCSS('aspect-ratio', '1.33333 / 1');
  await expect(page.locator('.photo-gallery')).toHaveCount(2);
  await expect(page.locator('.photo-gallery').first()).toHaveAttribute('data-layout', 'justified');
  const summary = page.locator('#edge-panel > summary');
  await expect(summary).toHaveAttribute('aria-controls', 'edge-panel-body');
  await expect(summary).toHaveAttribute('aria-expanded', 'false');
  await summary.press('Enter');
  await expect(summary).toHaveAttribute('aria-expanded', 'true');
  await summary.press('Space');
  await expect(summary).toHaveAttribute('aria-expanded', 'false');
  expect(errors).toEqual([]);
});
