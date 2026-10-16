import { test, expect } from '@playwright/test';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const reference = path.resolve('tests/visual/baselines/win32/chromium-390/home.png');
const control = (page,id) => page.locator('#tweaks-reference-'+id);
async function open(page) {
  await page.goto(process.env.VISUAL_ORIGIN+'/_styleguide');
  await expect(page.locator('#tweaks-panel')).toHaveAttribute('data-initialized','true');
  await page.evaluate(async()=>{
    await document.fonts.ready;
    for(let y=0;y<document.documentElement.scrollHeight;y+=600) {scrollTo(0,y);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}
    await Promise.all([...document.images].filter(image=>!image.closest('[inert]')).map(image=>image.decode()));
    scrollTo(0,0);
  });
  await page.keyboard.press('t'); await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','true');
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    window.__hudAudit={created:[],revoked:[],storage:[]};
    const create=URL.createObjectURL, revoke=URL.revokeObjectURL;
    URL.createObjectURL=function(blob){const url=create.call(URL,blob);window.__hudAudit.created.push(url);return url;};
    URL.revokeObjectURL=function(url){window.__hudAudit.revoked.push(url);return revoke.call(URL,url);};
    const set=Storage.prototype.setItem; Storage.prototype.setItem=function(...args){window.__hudAudit.storage.push(args[0]);return set.apply(this,args);};
  });
});

test('reference alignment, scrolling, DPR/scale, memory lifecycle and local-only requests',async({page},info)=>{
  await open(page);
  const requests=[]; const listener=request=>{if(/^https?:/.test(request.url()))requests.push({method:request.method(),url:request.url()});};
  page.on('request',listener);
  await control(page,'file').setInputFiles(reference);
  await expect(control(page,'status')).toContainText('390×844 bitmap');
  const image=page.locator('#tweaks-reference-overlay img');
  await expect(image).toBeVisible();
  await control(page,'x').fill('10'); await control(page,'y').fill('20');
  await expect.poll(()=>image.evaluate(e=>e.getBoundingClientRect().left)).toBe(10);
  await page.evaluate(()=>scrollTo(0,300));
  await expect.poll(()=>image.evaluate(e=>Math.round(e.getBoundingClientRect().top))).toBe(-280);
  await control(page,'mode').selectOption('viewport');
  await expect.poll(()=>image.evaluate(e=>e.getBoundingClientRect().top)).toBe(20);
  await control(page,'dpr').fill('2'); await expect.poll(()=>image.evaluate(e=>e.getBoundingClientRect().width)).toBe(195);
  await control(page,'scale').fill('2'); await expect.poll(()=>image.evaluate(e=>e.getBoundingClientRect().width)).toBe(390);
  await expect(control(page,'status')).toContainText('Viewport/DPR mismatch');
  await control(page,'opacity').fill('0.3'); await expect(image).toHaveCSS('opacity','0.3');
  await control(page,'alignment').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowDown');
  await expect(control(page,'x')).toHaveValue('11'); await expect(control(page,'y')).toHaveValue('30');
  const originalWidth=await image.evaluate(e=>e.getBoundingClientRect().width);
  await page.setViewportSize({width:320,height:900});
  await expect.poll(()=>image.evaluate(e=>e.getBoundingClientRect().width)).toBe(originalWidth);
  expect(await page.locator('#tweaks-content').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await control(page,'alignment').focus(); await page.keyboard.press('o'); await expect(image).toBeHidden();
  await page.keyboard.press('o'); await expect(image).toBeVisible();
  await control(page,'reset').click(); await expect(control(page,'x')).toHaveValue('0'); await expect(control(page,'scale')).toHaveValue('1');
  // Replace through the local drop target rather than a remote URL.
  const bytes=await readFile(reference);
  await page.evaluate(bytes=>{const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array(bytes)],'local.png',{type:'image/png'}));document.querySelector('#tweaks-reference-drop').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));},[...bytes]);
  await expect.poll(()=>page.evaluate(()=>window.__hudAudit.created.length)).toBe(2);
  await expect.poll(()=>page.evaluate(()=>window.__hudAudit.revoked.length)).toBe(1);
  await page.screenshot({path:info.outputPath('reference-overlay.png')});
  await page.locator('#tweaks-close-btn').evaluate(e=>e.click());
  await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','false');
  expect(await page.evaluate(()=>window.__hudAudit.created.every(url=>window.__hudAudit.revoked.includes(url)))).toBe(true);
  expect(await page.evaluate(()=>window.__hudAudit.storage)).toEqual([]);
  expect(requests).toEqual([]);
  await info.attach('reference-audit',{body:JSON.stringify({network:requests,urls:await page.evaluate(()=>({created:window.__hudAudit.created.length,revoked:window.__hudAudit.revoked.length})),storageWrites:0}),contentType:'application/json'});
});

test('reference rejects invalid/oversized headers, decoder failures and remote drops',async({page})=>{
  await open(page);
  for(const [name,mimeType,buffer,message] of [
    ['vector.svg','image/svg+xml',Buffer.from('<svg/>'),'valid PNG'],
    ['large.png','image/png',Buffer.alloc(10*1024*1024+1),'10 MiB'],
    ['fake.png','image/png',(await readFile(reference)).subarray(0,24),'decode'],
  ]) {
    await control(page,'file').setInputFiles({name,mimeType,buffer});
    await expect(control(page,'status')).toContainText(new RegExp(message,'i'));
  }
  await page.evaluate(()=>{const transfer=new DataTransfer();transfer.setData('text/uri-list','https://example.invalid/reference.png');document.querySelector('#tweaks-reference-drop').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));});
  await expect(control(page,'status')).toContainText('exactly one');
  for(const format of ['jpeg','webp']) {
    const buffer=await sharp(await readFile(reference)).toFormat(format).toBuffer();
    await control(page,'file').setInputFiles({name:'local.'+format,mimeType:'image/'+format,buffer});
    await expect(control(page,'status')).toContainText('390×844 bitmap');
    await expect(page.locator('#tweaks-reference-overlay img')).toBeVisible();
  }
  await control(page,'clear').click();
  expect(await page.evaluate(()=>window.__hudAudit.created.every(url=>window.__hudAudit.revoked.includes(url)))).toBe(true);
});

test('public ownership, unsupported markers, entry context and UI text stay read-only',async({page},info)=>{
  await open(page); await page.keyboard.press('p');
  const details=page.locator('#tweaks-ownership-details');
  await expect(page.locator('#tweaks-ownership-status')).toContainText('No markers observed');
  await page.locator('h1').hover({position:{x:5,y:5}}); await expect(details).toContainText('Unannotated / unknown');
  await page.locator('h1').evaluate(e=>e.setAttribute('data-emdash-ref','unsupported-future-format'));
  await expect(page.locator('#tweaks-ownership-status')).toContainText('1 unsupported');
  await page.locator('h1').hover({position:{x:5,y:5}}); await expect(details).toContainText('Unsupported annotation');
  await expect(details).not.toContainText('unsupported-future-format');
  await page.locator('h1').evaluate(e=>e.removeAttribute('data-emdash-ref'));
  await expect(page.locator('#tweaks-ownership-status')).toContainText('No markers observed');
  await page.getByRole('link',{name:'Text link',exact:true}).hover(); await expect(details).toContainText('UI dictionary');
  await expect(page.locator('[data-ownership-kind="unannotated"]')).toHaveCount(1);
  await page.screenshot({path:info.outputPath('ownership-public.png')});
});

test('real disposable EmDash edit annotations can be inspected without claiming save verification',async({page,context},info)=>{
  await context.request.get(process.env.VISUAL_ORIGIN+'/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin');
  await page.goto(process.env.VISUAL_ORIGIN+'/about');
  await expect(page.locator('.emdash-tb-toggle')).toBeVisible();
  await Promise.all([page.waitForNavigation(),page.locator('.emdash-tb-toggle').click()]);
  await expect(page.locator('h1[data-emdash-ref]')).toHaveCount(1);
  await page.locator('#tweaks-toggle-btn').click(); await page.locator('#tweaks-ownership-btn').click();
  await expect(page.locator('#tweaks-ownership-status')).toContainText('field annotations');
  const original=await page.locator('h1').getAttribute('data-emdash-ref');
  await page.locator('h1').hover({position:{x:5,y:5}});
  await expect(page.locator('#tweaks-ownership-details')).toContainText('field: title');
  await expect(page.locator('#tweaks-ownership-details')).toContainText('saveability are unverified');
  await expect(page.locator('#tweaks-ownership-details')).toContainText('Not supplied');
  await expect(page.locator('#tweaks-ownership-details')).toBeInViewport();
  if (page.viewportSize().width <= 960) {
    const footer=await page.locator('#tweaks-export-btn').boundingBox(), toolbar=await page.locator('#emdash-toolbar').boundingBox();
    expect(footer.y+footer.height).toBeLessThan(toolbar.y);
  }
  await page.screenshot({path:info.outputPath('ownership-real-annotation.png')});
  expect(await page.locator('h1').getAttribute('data-emdash-ref')).toBe(original);
  const reference=JSON.parse(original); delete reference.field;
  await page.locator('article').evaluate((element,reference)=>{element.setAttribute('data-emdash-ref',JSON.stringify(reference));const p=document.createElement('p');p.id='hud-ui-dictionary';p.textContent='UI dictionary specimen';element.append(p);},reference);
  await page.locator('#hud-ui-dictionary').hover({position:{x:5,y:5}});
  await expect(page.locator('#tweaks-ownership-details')).toContainText('Unannotated / unknown');
  await expect(page.locator('#tweaks-ownership-details')).toContainText('Entry context: pages');
  await page.locator('#hud-ui-dictionary').evaluate(element=>element.remove());
  await expect(page.locator('#tweaks-ownership-details')).toContainText('no longer available');
});

test('T/B/G/O/P, modal/composition/input guards, reset, swap and reload lifecycle',async({page})=>{
  await open(page);
  await page.keyboard.press('b'); await expect(page.locator('#tweaks-compare-btn')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('g'); await expect(page.locator('#tweaks-grid-btn')).toHaveAttribute('aria-pressed','true');
  const checkGrid=async()=>{
    await expect.poll(()=>page.evaluate(()=>{
      const index=Number(document.querySelector('#tweaks-grid-target').value), target=[...document.querySelectorAll('.container-shell, .site-main')][index];
      const rect=target.getBoundingClientRect(),style=getComputedStyle(target),overlay=document.querySelector('#tweaks-grid-overlay').getBoundingClientRect();
      const left=rect.left+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.borderLeftWidth)||0);
      const width=rect.width-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0)-(parseFloat(style.borderLeftWidth)||0)-(parseFloat(style.borderRightWidth)||0);
      return Math.max(Math.abs(left-overlay.left),Math.abs(width-overlay.width));
    })).toBeLessThan(.02);
  };
  await checkGrid(); await page.locator('#tweaks-grid-columns').selectOption('10'); await expect(page.locator('#tweaks-grid-overlay span')).toHaveCount(10);
  const rtl=await page.evaluate(()=>[...document.querySelectorAll('.container-shell, .site-main')].findIndex(e=>getComputedStyle(e).direction==='rtl'));
  expect(rtl).toBeGreaterThanOrEqual(0); await page.locator('#tweaks-grid-target').selectOption(String(rtl)); await checkGrid();
  await expect(page.locator('#tweaks-grid-status')).toContainText('rtl');
  const viewport=page.viewportSize(); await page.setViewportSize({width:320,height:900}); await checkGrid(); await page.setViewportSize(viewport); await checkGrid();
  await page.locator('#tweaks-compare-btn').focus();
  await page.keyboard.press('o'); await page.keyboard.press('p');
  for(const id of ['ownership','reference','grid']) { await page.keyboard.press('Escape'); await expect(page.locator('#tweaks-'+id+'-btn')).toHaveAttribute('aria-pressed','false'); }
  await page.keyboard.press('Escape'); await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','false');
  await page.locator('#specimen-name').pressSequentially('topbg'); await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','false');
  await page.locator('#specimen-note').pressSequentially('topbg'); await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','false');
  await page.locator('h1').evaluate(e=>{e.setAttribute('tabindex','-1');e.focus();});
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'t',isComposing:true,bubbles:true})));
  await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','false');
  await page.evaluate(()=>{const modal=document.createElement('dialog');modal.id='hud-test-modal';modal.textContent='Editor dialog';document.body.append(modal);modal.showModal();});
  await page.keyboard.press('t'); await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','false');
  await page.evaluate(()=>document.querySelector('#hud-test-modal').remove());
  await page.locator('#tweaks-toggle-btn').click();
  await page.locator('#tweak-density-scale').fill('1.1');
  await page.evaluate(()=>{navigator.clipboard.writeText=async value=>{window.__hudExport=value;};});
  await page.locator('#tweaks-export-btn').click();
  await expect.poll(()=>page.evaluate(()=>window.__hudExport||'')).toContain('--spacing-grid');
  expect(await page.evaluate(()=>window.__hudExport)).not.toContain('blob:');
  await control(page,'file').setInputFiles(reference); await expect(control(page,'btn')).toHaveAttribute('aria-pressed','true');
  await page.locator('#tweaks-reset-btn').click(); await expect(control(page,'btn')).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--spacing-grid'))).toBe('');
  await control(page,'file').setInputFiles(reference); await expect(control(page,'btn')).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>document.dispatchEvent(new Event('astro:before-swap')));
  await expect(page.locator('#tweaks-reference-overlay, #tweaks-grid-overlay, #tweaks-ownership-overlay')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__hudAudit.created.every(url=>window.__hudAudit.revoked.includes(url)))).toBe(true);
  await page.evaluate(()=>{document.dispatchEvent(new Event('astro:page-load'));document.dispatchEvent(new Event('astro:page-load'));});
  await expect(page.locator('#tweaks-grid-target option')).toHaveCount(await page.locator('.container-shell, .site-main').count());
  await page.locator('#tweaks-toggle-btn').click(); // New initialization must have one toggle handler.
  await page.keyboard.press('g'); await expect(page.locator('#tweaks-grid-btn')).toHaveAttribute('aria-pressed','true');
  await page.reload(); await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#tweaks-grid-overlay, #tweaks-reference-overlay, #tweaks-ownership-overlay')).toHaveCount(0);
  await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
  await page.locator('#tweaks-toggle-btn').click(); await expect(page.locator('#tweaks-toggle-btn')).toHaveAttribute('aria-expanded','true');
});
