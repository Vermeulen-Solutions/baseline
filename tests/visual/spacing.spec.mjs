import { test, expect } from '@playwright/test';

test('layered automatic spacing yields to Tailwind utility overrides', async ({ page }) => {
  const response = await page.goto(process.env.VISUAL_ORIGIN + '/spacing-fixture');
  expect(response.status()).toBe(200);

  const values = await page.evaluate(() => {
    const read = (selector, property) =>
      getComputedStyle(document.querySelector(selector))[property];

    return {
      flowDefault: parseFloat(read('#flow-default', 'marginTop')),
      flowOverride: parseFloat(read('#flow p.mt-0', 'marginTop')),
      sectionDefault: parseFloat(read('#default-section', 'paddingTop')),
      sectionOverride: parseFloat(read('#override-section', 'paddingTop')),
      containerGap: parseFloat(read('#default-section > div + div', 'marginTop')),
      gridDefault: parseFloat(read('#default-grid', 'gap')),
      gridOverride: parseFloat(read('#override-grid', 'gap')),
      nonePadding: parseFloat(read('#none-section', 'paddingTop')),
      noneGap: parseFloat(read('#none-section > div + div', 'marginTop')),
    };
  });

  expect(values.flowDefault).toBeGreaterThan(0);
  expect(values.flowOverride).toBe(0);
  expect(values.sectionDefault).toBeGreaterThan(0);
  expect(values.sectionOverride).toBe(0);
  expect(values.containerGap).toBeGreaterThan(0);
  expect(values.gridDefault).toBeGreaterThan(0);
  expect(values.gridOverride).toBe(0);
  expect(values.nonePadding).toBe(0);
  expect(values.noneGap).toBe(0);
});
