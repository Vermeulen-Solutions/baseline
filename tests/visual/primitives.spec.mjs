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

test('behavior: full-frame gallery fit preserves mixed image proportions and the cover default', async ({ page, browser }, info) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.VISUAL_ORIGIN+'/gallery-fit-fixture');
  for (const section of ['#contained','#contained-grid']) {
    const gallery=page.locator(section+' .photo-gallery');
    await expect(gallery).toHaveAttribute('data-fit','contain');
    const images=gallery.locator('img');
    await expect(images).toHaveCount(5);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete',true);
      await expect(image).toHaveCSS('object-fit','contain');
      const geometry=await image.evaluate(img=>{const r=img.getBoundingClientRect();return {width:r.width,height:r.height,naturalWidth:img.naturalWidth,ratio:Number(img.getAttribute('width'))/Number(img.getAttribute('height'))};});
      expect(geometry.naturalWidth).toBeGreaterThan(0);
      expect(geometry.width).toBeGreaterThan(0);
      expect(Math.abs(geometry.width/geometry.height-geometry.ratio)).toBeLessThan(.01);
    }
  }
  const cover=page.locator('#covered .photo-gallery');
  expect(await cover.getAttribute('data-fit')).toBeNull();
  await expect(cover.locator('img').first()).toHaveCSS('object-fit','cover');
  const coverHeight=await cover.locator('a').first().evaluate(a=>({actual:a.getBoundingClientRect().height,expected:Math.min(260,Math.max(160,innerWidth*.38))}));
  expect(Math.abs(coverHeight.actual-coverHeight.expected)).toBeLessThan(.1);
  const nativeResponse=await page.goto(process.env.VISUAL_ORIGIN+'/media-spacing-fixture');
  expect(nativeResponse.status()).toBe(200);
  const nativeImage=page.locator('#native-field-media img');
  await expect.poll(()=>nativeImage.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
  expect(await nativeImage.evaluate(img=>img.naturalWidth)).toBeLessThanOrEqual(400);
  await expect(nativeImage).toHaveAttribute('width','400');
  await expect(nativeImage).toHaveAttribute('height','300');
  await expect(nativeImage).toHaveAttribute('alt','Native field round trip');
  await page.goto(process.env.VISUAL_ORIGIN+'/gallery-fit-fixture');
  const first=page.locator('#contained a[data-lightbox]').first();
  await first.hover();
  await expect(first.locator('img')).toHaveCSS('transform','none');
  await first.focus(); await first.press('Enter');
  await expect(page.locator('.pswp--open')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.pswp__counter')).toHaveText(/^2\s*\/\s*5$/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pswp--open')).toHaveCount(0);
  await expect(first).toBeFocused();
  await page.locator('#contained').screenshot({path:info.outputPath('contained-gallery.png'),style:'.photo-gallery-item { content-visibility: visible; }'});
  if (info.project.name==='chromium-390') {
    const context=await browser.newContext({javaScriptEnabled:false});
    try {
      const fallback=await context.newPage();
      await fallback.goto(process.env.VISUAL_ORIGIN+'/gallery-fit-fixture');
      const link=fallback.locator('#contained a').first();
      const href=await link.getAttribute('href');
      const fileResponse=fallback.waitForResponse(response=>response.url().endsWith(href));
      await Promise.all([fallback.waitForURL('**'+href),link.click()]);
      const original=await fileResponse;
      expect(original.status()).toBe(200);
      expect(original.headers()['content-type']).toMatch(/^image\//);
      expect(fallback.url()).toContain('/_emdash/api/media/file/');
    } finally { await context.close(); }
  }
  expect(errors).toEqual([]);
});
