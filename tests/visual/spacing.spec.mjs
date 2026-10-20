import { test, expect } from '@playwright/test';

test('behavior ID-only media resolves through its provider and gallery utilities override defaults', async ({ page }) => {
  await page.goto(process.env.VISUAL_ORIGIN + '/media-spacing-fixture');
  const image = page.locator('#id-only-media img');
  await expect(image).toHaveJSProperty('naturalWidth',400);
  await expect(image).toHaveAttribute('alt','ID-only local image');
  await expect(page.locator('#id-only-media a')).toHaveAttribute('href','#media-target');
  await expect(page.locator('#id-only-media figure figure')).toHaveCount(0);
  const boxes = await page.evaluate(() => {
    const figure=document.querySelector('#id-only-media figure').getBoundingClientRect();
    const img=document.querySelector('#id-only-media img').getBoundingClientRect();
    return {top:img.top-figure.top,width:img.width,height:img.height};
  });
  expect(Math.abs(boxes.top)).toBeLessThan(1);
  expect(boxes.width/boxes.height).toBeCloseTo(4/3,2);
  await page.locator('.photo-gallery').evaluate(el=>el.classList.add('mt-0','mb-0','p-4','gap-0'));
  await page.locator('.photo-gallery img').evaluate(el=>el.classList.add('max-w-full'));
  await expect(page.locator('.photo-gallery')).toHaveCSS('margin-top','0px');
  await expect(page.locator('.photo-gallery')).toHaveCSS('margin-bottom','0px');
  await expect(page.locator('.photo-gallery')).toHaveCSS('padding-top','16px');
  await expect(page.locator('.photo-gallery')).toHaveCSS('gap','0px');
  await expect(page.locator('.photo-gallery img')).toHaveCSS('max-width','100%');
});

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
