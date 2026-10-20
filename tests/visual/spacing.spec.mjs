import { test, expect } from '@playwright/test';

test('V02-V05 real primitives isolate nested modes, merge attributes and own each gap once',async({page})=>{
  await page.goto(process.env.VISUAL_ORIGIN+'/structural-spacing-fixture');
  const data=await page.evaluate(()=>{
    const css=id=>getComputedStyle(document.getElementById(id));
    const ref=css('reference');
    const modes=Object.fromEntries(['section','content','none'].flatMap(p=>['section','content','none'].map(c=>[p+'-'+c,parseFloat(css(p+'-'+c).paddingTop)])));
    const box=id=>document.getElementById(id).getBoundingClientRect();
    return {modes,regular:parseFloat(ref.paddingTop),compact:parseFloat(ref.paddingBottom),grid:parseFloat(ref.gap),
      adjacent:box('adjacent-two').top-box('adjacent-one').bottom, stack:css('stack').gap,
      scoped:css('scoped-child').paddingTop,local:css('local').gap,independent:css('local-child').paddingTop,
      custom:css('custom').display,customGap:css('custom').gap,breakout:css('breakout').display,
      prop:css('grid-prop').gap,utility:css('grid-utility').gap,container:css('container-prop').gap,raw:parseFloat(css('raw-grid').gap)};
  });
  for(const [pair,value] of Object.entries(data.modes))expect(value,pair).toBeCloseTo(pair.endsWith('none')?0:pair.endsWith('content')?data.compact:data.regular,1);
  expect(data.adjacent).toBeCloseTo(0,1);expect(parseFloat(data.stack)).toBeCloseTo(data.compact,1);
  expect(data.scoped).toBe('17px');expect(data.local).toBe('0px');expect(parseFloat(data.independent)).toBeCloseTo(data.regular,1);
  expect(data.custom).toBe('block');expect(data.customGap).toBe('normal');expect(data.breakout).toBe('grid');
  expect(data.prop).toBe('13px');expect(data.utility).toBe('0px');expect(data.container).toBe('11px');expect(data.raw).toBeCloseTo(data.grid,1);
  await expect(page.locator('#grid-prop')).toHaveAttribute('aria-label','grid attributes');
  await expect(page.locator('#grid-prop')).toHaveCSS('color','rgb(1, 2, 3)');
  await expect(page.locator('#container-prop')).toHaveClass(/kept/);
});

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
  await expect(page.locator('#id-only-media figure')).toHaveCSS('margin-top','0px');
  await page.locator('.photo-gallery').evaluate(el=>el.classList.add('mt-0','mb-0','p-4','gap-0'));
  await page.locator('.photo-gallery img').evaluate(el=>el.classList.add('max-w-full'));
  await expect(page.locator('.photo-gallery')).toHaveCSS('margin-top','0px');
  await expect(page.locator('.photo-gallery')).toHaveCSS('margin-bottom','0px');
  await expect(page.locator('.photo-gallery')).toHaveCSS('padding-top','16px');
  await expect(page.locator('.photo-gallery')).toHaveCSS('gap','0px');
  await expect(page.locator('.photo-gallery img')).toHaveCSS('max-width','100%');
});

test('V07/V12 public listings align and article metadata occupies a separate block',async({page})=>{
  for(const route of ['/','/posts','/category/general','/tag/starter']) {
    await page.goto(process.env.VISUAL_ORIGIN+route);
    const result=await page.evaluate(()=>{
      const h=document.querySelector('main h1').getBoundingClientRect();
      const list=document.querySelector('main .collection-list');
      const item=list.querySelector('li');
      return {h:h.left,list:list.getBoundingClientRect().left,item:item.getBoundingClientRect().left,role:list.getAttribute('role'),padding:getComputedStyle(list).paddingInlineStart};
    });
    expect(result.list,route).toBeCloseTo(result.h,1);expect(result.item,route).toBeCloseTo(result.h,1);expect(result.padding).toBe('0px');expect(result.role).toBe('list');
  }
  await page.goto(process.env.VISUAL_ORIGIN+'/posts/welcome');
  const bounds=await page.evaluate(()=>{const h=document.querySelector('main h1').getBoundingClientRect(),time=document.querySelector('main time').getBoundingClientRect(),body=document.querySelector('.article-body').getBoundingClientRect();return {titleBottom:h.bottom,dateTop:time.top,dateBottom:time.bottom,bodyTop:body.top};});
  expect(bounds.dateTop).toBeGreaterThan(bounds.titleBottom);expect(bounds.bodyTop).toBeGreaterThan(bounds.dateBottom);
});

test('V08-V13 editorial controls stay local, nested flows reset calculations and empty content emits no layout item',async({page})=>{
  await page.goto(process.env.VISUAL_ORIGIN+'/editorial-spacing-fixture');
  const read=async(selector,property)=>page.locator(selector).first().evaluate((el,p)=>getComputedStyle(el)[p],property);
  await expect(page.locator('#controls')).toHaveAttribute('data-editorial-content','');
  expect(parseFloat(await read('#controls > ul','paddingInlineStart'))).toBeGreaterThan(0);
  expect(parseFloat(await read('#controls ul ul','paddingInlineStart'))).toBeGreaterThan(0);
  for(const [variable,selector] of [['--heading-spacing','#controls > h2'],['--list-spacing','#controls > ul'],['--figure-spacing','#controls > figure'],['--blockquote-spacing','#controls > blockquote'],['--flow-space','#controls > p:last-child'],['--list-item-spacing','#controls > ul > li + li']]) {
    await page.locator('#controls').evaluate((el,key)=>el.style.setProperty(key,'67px'),variable);
    await expect(page.locator(selector).first(),variable).toHaveCSS('margin-top','67px');
    await page.locator('#controls').evaluate((el,key)=>el.style.removeProperty(key),variable);
  }
  expect(await read('#hidden-first > p:not([hidden])','marginTop')).toBe('0px');
  expect(await read('#only-media > figure','marginTop')).toBe('0px');expect(await read('#only-media > figure','marginBottom')).toBe('0px');
  for(const selector of ['#composites .card img','#composites [data-logo-ticker] img','#composites .photo-gallery img','#only-media img'])expect(await read(selector,'marginTop'),selector).toBe('0px');
  expect(await read('#composites [data-logo-ticker] ul','paddingInlineStart')).toBe('0px');
  const nested=await read('#nested-flow p + p','marginTop'),inside=await read('#editorial-disclosure .flow p + p','marginTop');expect(nested).toBe(inside);
  await expect(page.locator('#empty-layout > *')).toHaveCount(2);
  await expect(page.locator('#cms-optout > p')).toHaveText('Wrapperless CMS');await expect(page.locator('#static-optout > p')).toHaveText('Wrapperless native');
  for(const id of ['cms-attributed','static-attributed']){await expect(page.locator('#'+id)).toHaveClass('custom');await expect(page.locator('#'+id)).not.toHaveAttribute('data-editorial-content');}
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
