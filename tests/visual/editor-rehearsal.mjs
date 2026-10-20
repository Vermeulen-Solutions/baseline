import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { startVisualSite } from './site.mjs';

if(process.platform!=='win32' || process.env.CI || process.env.GITHUB_ACTIONS==='true')throw new Error('Local Windows CMS editor rehearsal only');
const report=path.resolve('.emdash/visual/editor-rehearsal');
const block=(text,key,rest={})=>({_type:'block',_key:key,style:'normal',markDefs:[],children:[{_type:'span',_key:key+'-text',text,marks:[]}],...rest});
let browser,context,page,origin;
const errors=[];
const site=await startVisualSite(process.cwd(),report,{prepareStage:async({stage,origin:ownedOrigin})=>{
  origin=ownedOrigin;
  const target=path.join(stage,'seed/seed.json');const seed=JSON.parse(await fs.readFile(target,'utf8'));
  seed.content.pages.push({id:'spacing-editor',slug:'spacing-editor-rehearsal',status:'published',data:{title:'Spacing editor rehearsal',content:[block('Editable spacing paragraph','p'),block('Editorial heading','h',{style:'h2'}),block('First list item','li',{listItem:'bullet',level:1}),block('Nested list item','nested',{listItem:'bullet',level:2})]}},
    {id:'spacing-empty-editor',slug:'spacing-empty-editor',status:'published',data:{title:'Empty field rehearsal',content:[]}});
  await fs.writeFile(target,JSON.stringify(seed));
},onDevReady:async()=>{
  browser=await chromium.launch({channel:'chromium'});context=await browser.newContext({viewport:{width:1280,height:960}});page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/_emdash/api/setup/dev-bypass?redirect=/spacing-editor-rehearsal');
}}).catch(async error=>{await browser?.close();throw error;});
try {
  await page.goto(site.origin+'/spacing-editor-rehearsal');
  await expect(page.locator('#emdash-edit-toggle')).toBeAttached();
  await page.locator('label.emdash-tb-toggle').click();
  const editor=page.locator('main .emdash-inline-editor[contenteditable="true"]');
  await expect(editor).toBeVisible({timeout:20000});await expect(editor).toHaveCount(1);
  const reference=JSON.parse(await page.locator('main h1[data-emdash-ref]').getAttribute('data-emdash-ref'));
  expect(reference.collection).toBe('pages');const entryId=reference.id;
  await expect(editor.locator('ul ul')).toHaveCount(1);
  const target=editor.locator('p').first();await target.click();await target.press('End');await target.pressSequentially(' Saved through the live editor.');
  const save=page.waitForResponse(r=>r.url().endsWith('/api/content/pages/'+entryId) && r.request().method()==='PUT');
  await page.locator('#emdash-toolbar .emdash-tb-logo').click();const saved=await save;expect(saved.status()).toBe(200);
  await page.reload();await expect(editor).toContainText('Saved through the live editor.');
  const publish=page.locator('#emdash-tb-publish');await expect(publish).toBeVisible();
  const published=page.waitForResponse(r=>r.url().includes('/visual-editing/content/pages/'+entryId+'/publish') && r.request().method()==='POST');
  await publish.click();expect((await published).status()).toBe(200);
  // A separate anonymous context proves the published public render.
  const publicContext=await browser.newContext({viewport:{width:390,height:844}});const publicPage=await publicContext.newPage();
  await publicPage.goto(site.origin+'/spacing-editor-rehearsal');await expect(publicPage.locator('main')).toContainText('Saved through the live editor.');
  await expect(publicPage.locator('main [contenteditable]')).toHaveCount(0);await expect(publicPage.locator('main [data-editorial-content] > ul > li > ul')).toHaveCount(1);
  expect(await publicPage.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await publicPage.screenshot({path:path.join(report,'public.png'),fullPage:true});await publicContext.close();
  await page.goto(site.origin+'/spacing-empty-editor');await expect(editor).toBeVisible();await editor.click();
  await expect(editor).toBeFocused();await page.screenshot({path:path.join(report,'empty-editor.png'),fullPage:true});
  expect(errors).toEqual([]);
  await fs.writeFile(path.join(report,'receipt.json'),JSON.stringify({case:'E01',freshSeed:true,workingContentTouched:false,entry:'pages/'+entryId,field:'content',seed:'supported disposable seed; dev session used by built editor; no API substitute for edit',uiSelected:true,uiTyped:true,blurSaveStatus:saved.status(),editorReload:true,uiPublish:true,anonymousPublicReload:true,nestedListsRetained:true,emptyFieldSelectable:true,scope:'Node/SQLite built inline editor; not provider/Workers certification'},null,2)+'\n');
  console.log('E01 actual inline editor selection, typing, save, reload, publish, anonymous render and empty field passed.');
}catch(error){await page.screenshot({path:path.join(report,'failure.png'),fullPage:true}).catch(()=>{});await fs.writeFile(path.join(report,'failure.html'),await page.content().catch(()=>''));await fs.writeFile(path.join(report,'errors.json'),JSON.stringify(errors));throw error;}
finally{await context.close();await browser.close();await site.cleanup();}
