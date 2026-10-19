import { test, expect, prepare, styleguide, noOverflow } from './helpers.mjs';
import { disclosureJourney, intrinsicLayoutJourney } from '../journeys/composition.mjs';

test('behavior native disclosure keyboard, grouping and fragment reveal', async ({ page }, info) => {
  await prepare(page, styleguide, page.visualProblems);
  await info.attach('native-disclosure', { body: JSON.stringify(await disclosureJourney(page)), contentType: 'application/json' });
  await noOverflow(page);
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
