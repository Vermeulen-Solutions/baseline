import { test, expect, prepare, styleguide, noOverflow } from './helpers.mjs';
import { disclosureJourney, intrinsicLayoutJourney } from '../journeys/composition.mjs';
import { focusVisible } from '../journeys/public.mjs';

test('behavior native disclosure keyboard, grouping and fragment reveal', async ({ page }, info) => {
  await prepare(page, styleguide, page.visualProblems);
  await info.attach('native-disclosure', { body: JSON.stringify(await disclosureJourney(page)), contentType: 'application/json' });
  await noOverflow(page);
});

test('behavior native disclosure reveals a target from a directly loaded fragment', async ({ page }) => {
  await prepare(page, styleguide, page.visualProblems);
  const details = page.locator('#specimen-disclosure');
  const target = page.locator('#disclosure-reveal-target');
  await expect(details).not.toHaveAttribute('open', '');
  const targetUrl = new URL(page.url());
  targetUrl.hash = 'disclosure-reveal-target';
  await page.goto(targetUrl.href);
  await expect(page).toHaveURL(/#disclosure-reveal-target$/);
  await expect(details).toHaveAttribute('open', '');
  await expect(target).toBeVisible();
  await expect(target).toBeInViewport();
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
  await focusVisible(focused);
  await expect(details).toHaveAttribute('open', '');
  await expect(target).toBeVisible();
});

test('reflow intrinsic composition in wide/narrow/RTL hosts', async ({ page }, info) => {
  await prepare(page, styleguide, page.visualProblems);
  await info.attach('intrinsic-composition', { body: JSON.stringify(await intrinsicLayoutJourney(page)), contentType: 'application/json' });
  const region = page.locator('section[aria-labelledby="composition"]');
  await expect(region).toHaveScreenshot('composition.png');
  await page.locator('#specimen-disclosure > summary').press('Enter');
  await page.locator('#disclosure-dark > summary').press('Enter');
  await expect(region).toHaveScreenshot('composition-open.png');
  await noOverflow(page);
});
