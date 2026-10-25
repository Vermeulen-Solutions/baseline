import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Acorn } from '@phosphor-icons/react/dist/csr/Acorn';
import { startVisualSite } from './site.mjs';

if(process.platform!=='win32' || process.env.CI || process.env.GITHUB_ACTIONS==='true')throw new Error('Local Windows CMS editor rehearsal only');
const report=path.resolve('.emdash/visual/editor-rehearsal');
const block=(text,key,rest={})=>({_type:'block',_key:key,style:'normal',markDefs:[],children:[{_type:'span',_key:key+'-text',text,marks:[]}],...rest});
let browser,context,page,origin;
const errors=[];
const site=await startVisualSite(process.cwd(),report,{fixedClock:false,prepareStage:async({stage,origin:ownedOrigin})=>{
  origin=ownedOrigin;
  // Normal and fixture builds use different cache directories. Keep this
  // disposable session store stable across the harness rebuild, inside stage.
  const config=path.join(stage,'astro.config.mjs');let source=await fs.readFile(config,'utf8');
  source=source.replace('import { defineConfig } from "astro/config";','import { defineConfig, sessionDrivers } from "astro/config";');
  source=source.replace('  output: "server",','  output: "server",\n  session:{driver:sessionDrivers.fsLite({base:'+JSON.stringify(path.join(stage,'editor-sessions'))+'})},');
  await fs.writeFile(config,source);
  const target=path.join(stage,'seed/seed.json');const seed=JSON.parse(await fs.readFile(target,'utf8'));
  // Exercise the installed admin's lazy custom-icon catalog as well as the
  // named inline-editor icons optimized by the baseline build transform.
  seed.collections.find(collection=>collection.slug==='pages').icon='acorn';
  seed.content.pages.push({id:'spacing-editor',slug:'spacing-editor-rehearsal',status:'published',data:{title:'Spacing editor rehearsal',content:[block('Editable spacing paragraph','p'),block('Editorial heading','h',{style:'h2'}),block('First list item','li',{listItem:'bullet',level:1}),block('Nested list item','nested',{listItem:'bullet',level:2})]}},
    {id:'spacing-empty-editor',slug:'spacing-empty-editor',status:'published',data:{title:'Empty field rehearsal',content:[]}});
  await fs.writeFile(target,JSON.stringify(seed));
},onDevReady:async()=>{
  browser=await chromium.launch({channel:'chromium'});context=await browser.newContext({viewport:{width:1280,height:960}});page=await context.newPage();
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error' && !message.text().startsWith('Failed to load resource:'))errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400 && ['script','stylesheet','fetch','xhr'].includes(response.request().resourceType()))errors.push('HTTP '+response.status()+': '+response.url());});
  page.on('requestfailed',request=>{if(request.resourceType()==='script')errors.push('Script failed: '+request.url()+' '+request.failure()?.errorText);});
  await page.goto(origin+'/_emdash/api/setup/dev-bypass?redirect=/spacing-editor-rehearsal');
}}).catch(async error=>{await browser?.close();throw error;});
try {
  console.log('E01: built editor navigation');
  await page.goto(site.origin+'/spacing-editor-rehearsal');
  await expect(page.locator('#emdash-edit-toggle')).toBeAttached();
  await page.locator('label.emdash-tb-toggle').click();
  const editor=page.locator('main .emdash-inline-editor[contenteditable="true"]');
  await expect(editor).toBeVisible({timeout:20000});await expect(editor).toHaveCount(1);
  const reference=JSON.parse(await page.locator('main h1[data-emdash-ref]').getAttribute('data-emdash-ref'));
  expect(reference.collection).toBe('pages');const entryId=reference.id;
  await expect(editor.locator('ul ul')).toHaveCount(1);
  console.log('E01: editor hydrated; typing');
  await editor.click();await expect(editor).toBeFocused();
  await editor.press('Control+Home');await editor.press('End');
  await page.keyboard.insertText(' Saved through the live editor.');
  await expect(editor).toContainText('Saved through the live editor.');
  console.log('E01: typed; blur and save');
  const save=page.waitForResponse(r=>r.url().endsWith('/api/content/pages/'+entryId) && r.request().method()==='PUT' && r.request().postData()?.includes('Saved through the live editor.'),{timeout:15000});
  await page.locator('.site-header input[type="search"]').click();const saved=await save;expect(saved.status()).toBe(200);
  // Persistence is proved by the editor and anonymous reloads below. Avoid
  // making that proof depend on the browser protocol retaining a response body.
  await fs.writeFile(path.join(report,'save.json'),JSON.stringify({payload:saved.request().postDataJSON(),status:saved.status()},null,2));
  console.log('E01: saved; reloading');
  await page.reload();await expect(editor).toContainText('Saved through the live editor.');
  const publish=page.locator('#emdash-tb-publish');await expect(publish).toBeVisible();
  const published=page.waitForResponse(r=>r.url().includes('/visual-editing/content/pages/'+entryId+'/publish') && r.request().method()==='POST',{timeout:15000});
  await publish.click();expect((await published).status()).toBe(200);
  console.log('E01: published; anonymous render');
  // A separate anonymous context proves the published public render.
  const publicContext=await browser.newContext({viewport:{width:390,height:844}});const publicPage=await publicContext.newPage();
  await publicPage.goto(site.origin+'/spacing-editor-rehearsal');await expect(publicPage.locator('main')).toContainText('Saved through the live editor.');
  await expect(publicPage.locator('main [contenteditable]')).toHaveCount(0);await expect(publicPage.locator('main [data-editorial-content] > ul > li > ul')).toHaveCount(1);
  expect(await publicPage.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await publicPage.screenshot({path:path.join(report,'public.png'),fullPage:true});await publicContext.close();
  await page.goto(site.origin+'/posts/welcome');
  await expect(page.locator('#emdash-edit-toggle')).toBeAttached();
  const postReference=JSON.parse(await page.locator('main h1[data-emdash-ref]').getAttribute('data-emdash-ref'));
  expect(postReference.collection).toBe('posts');const postId=postReference.id;
  if(!await page.locator('#emdash-edit-toggle').isChecked())await page.locator('label.emdash-tb-toggle').click();
  await expect(editor).toBeVisible({timeout:20000});
  await expect(editor).toContainText('What to do next');
  await editor.click();await editor.press('Control+End');
  await page.keyboard.insertText(' Post body saved through the editor.');
  const postSave=page.waitForResponse(r=>r.url().endsWith('/api/content/posts/'+postId)&&r.request().method()==='PUT'&&r.request().postData()?.includes('Post body saved through the editor.'),{timeout:15000});
  await page.locator('.site-header input[type="search"]').click();const postSaved=await postSave;expect(postSaved.status()).toBe(200);
  await page.reload();await expect(editor).toContainText('Post body saved through the editor.');
  const postPublish=page.waitForResponse(r=>r.url().includes('/visual-editing/content/posts/'+postId+'/publish')&&r.request().method()==='POST',{timeout:15000});
  await page.locator('#emdash-tb-publish').click();expect((await postPublish).status()).toBe(200);
  const publicPostContext=await browser.newContext({viewport:{width:390,height:844}});const publicPostPage=await publicPostContext.newPage();
  await publicPostPage.goto(site.origin+'/posts/welcome');await expect(publicPostPage.locator('main')).toContainText('Post body saved through the editor.');
  await expect(publicPostPage.locator('main [contenteditable]')).toHaveCount(0);await publicPostContext.close();
  await page.goto(site.origin+'/spacing-empty-editor');await expect(editor).toBeVisible();await editor.click();
  console.log('E01: empty field');
  await expect(editor).toBeFocused();await page.screenshot({path:path.join(report,'empty-editor.png'),fullPage:true});
  console.log('E01: built admin navigation and custom icon');
  await page.goto(site.origin+'/_emdash/admin');
  await page.getByRole('button',{name:'Get Started',exact:true}).click();
  const pagesLink=page.locator('a[href="/_emdash/admin/content/pages"]').first();
  await expect(pagesLink).toBeVisible({timeout:30000});
  const expectedPath=renderToStaticMarkup(React.createElement(Acorn)).match(/<path[^>]*\sd="([^"]+)"/)?.[1];
  expect(expectedPath).toBeTruthy();
  await expect(pagesLink.locator('svg path').first()).toHaveAttribute('d',expectedPath);
  await pagesLink.click();await expect(page).toHaveURL(/\/_emdash\/admin\/content\/pages/);
  await expect(page.getByRole('heading',{name:'Pages',exact:true})).toBeVisible();
  await expect(page.getByText('Spacing editor rehearsal',{exact:true})).toBeVisible();
  await page.screenshot({path:path.join(report,'admin-pages.png'),fullPage:true});
  // Upload through the installed Media Library UI into the disposable site's
  // fresh local storage. This deliberately avoids an API substitute and never
  // touches the working site's database or media directory.
  const mediaLink=page.locator('a[href="/_emdash/admin/media"]').first();
  await expect(mediaLink).toBeVisible();await mediaLink.click();
  await expect(page.getByRole('heading',{name:'Media Library',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Upload Files',exact:true}).first().click();
  const uploadFile=path.join(report,'architecture-acceptance-6.png');
  await fs.writeFile(uploadFile,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p2sAAAAASUVORK5CYII=','base64'));
  const uploadInput=page.getByLabel('Browse files to upload');
  await uploadInput.setInputFiles(uploadFile);
  await expect(page.getByRole('button',{name:'Done',exact:true})).toBeVisible({timeout:30000});
  await expect(page.getByText('1 of 1 complete',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Done',exact:true}).click();
  await expect(page.getByRole('button',{name:'architecture-acceptance-6.png',exact:true})).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:'architecture-acceptance-6.png',exact:true}).click();
  const mediaDetails=page.getByRole('dialog',{name:'Media details'});
  await expect(mediaDetails).toBeVisible();
  const altText=mediaDetails.getByRole('textbox',{name:'Alt Text'});
  const caption=mediaDetails.getByRole('textbox',{name:'Caption'});
  await altText.fill('Synthetic architecture acceptance image');
  await caption.fill('Uploaded through the disposable admin UI.');
  const mediaUpdate=page.waitForResponse(response=>response.url().includes('/_emdash/api/media/')&&response.request().method()==='PUT',{timeout:15000});
  await mediaDetails.getByRole('button',{name:'Save',exact:true}).click();
  const mediaSaved=await mediaUpdate;expect(mediaSaved.status()).toBe(200);
  await page.reload();
  await expect(page.getByRole('button',{name:'architecture-acceptance-6.png',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'architecture-acceptance-6.png',exact:true}).click();
  await expect(mediaDetails.getByRole('textbox',{name:'Alt Text'})).toHaveValue('Synthetic architecture acceptance image');
  await expect(mediaDetails.getByRole('textbox',{name:'Caption'})).toHaveValue('Uploaded through the disposable admin UI.');
  await mediaDetails.getByRole('button',{name:'Close',exact:true}).click();
  await page.goto(site.origin+'/posts/welcome');
  if(!await page.locator('#emdash-edit-toggle').isChecked())await page.locator('label.emdash-tb-toggle').click();
  await expect(editor).toBeVisible({timeout:20000});
  await editor.locator('p').last().click();await editor.press('End');
  await editor.press('Enter');await page.keyboard.insertText('/image');
  await page.getByRole('button',{name:'Image',exact:true}).click();
  const mediaPicker=page.getByRole('dialog',{name:'Insert image'});
  await expect(mediaPicker).toBeVisible();
  await mediaPicker.getByRole('option',{name:path.basename(uploadFile),exact:true}).click();
  await expect(editor.locator('img')).toHaveCount(1);
  const postImageCaption=editor.locator('textarea[placeholder="Add a caption"]');
  await postImageCaption.fill('Uploaded through the disposable admin UI.');
  const postMediaSave=page.waitForResponse(r=>r.url().endsWith('/api/content/posts/'+postId)&&r.request().method()==='PUT',{timeout:15000});
  await page.locator('.site-header input[type="search"]').click();const postMediaSaved=await postMediaSave;expect(postMediaSaved.status()).toBe(200);
  await page.reload();await expect(editor.locator('img')).toHaveCount(1);
  await expect(editor.locator('textarea[placeholder="Add a caption"]')).toHaveValue('Uploaded through the disposable admin UI.');
  const postMediaPublish=page.waitForResponse(r=>r.url().includes('/visual-editing/content/posts/'+postId+'/publish')&&r.request().method()==='POST',{timeout:15000});
  await page.locator('#emdash-tb-publish').click();expect((await postMediaPublish).status()).toBe(200);
  const mediaPublicContext=await browser.newContext({viewport:{width:390,height:844}});const mediaPublicPage=await mediaPublicContext.newPage();
  await mediaPublicPage.goto(site.origin+'/posts/welcome');
  const publicImage=mediaPublicPage.locator('main img[alt="Synthetic architecture acceptance image"]');
  await expect(publicImage).toBeVisible();await expect(publicImage).toHaveJSProperty('naturalWidth',1);
  await expect(publicImage).toHaveAttribute('src',/\/_emdash\/api\/media\/file\//);
  await expect(publicImage).not.toHaveAttribute('srcset');
  await expect(mediaPublicPage.locator('main')).toContainText('Uploaded through the disposable admin UI.');
  await mediaPublicContext.close();
  expect(errors).toEqual([]);
  await fs.writeFile(path.join(report,'receipt.json'),JSON.stringify({case:'E01',freshSeed:true,workingContentTouched:false,entry:'pages/'+entryId,field:'content',postEntry:'posts/'+postId,postField:'content',seed:'supported disposable seed; dev session used by built editor; no API substitute for edits',pageUiSelected:true,pageUiTyped:true,pageBlurSaveStatus:saved.status(),pageEditorReload:true,pageUiPublish:true,pageAnonymousPublicReload:true,postUiSelected:true,postUiTyped:true,postBlurSaveStatus:postSaved.status(),postEditorReload:true,postUiPublish:true,postAnonymousPublicReload:true,mediaUiInsertedIntoPost:true,postMediaSaveStatus:postMediaSaved.status(),postMediaReload:true,postMediaPublish:true,anonymousPublicMediaRender:true,mediaAltAndCaptionRendered:true,mediaStorageEndpointLoaded:true,smallOriginalDecodedWidth:1,smallOriginalResponsiveCandidates:false,nestedListsRetained:true,emptyFieldSelectable:true,adminNavigation:true,customCatalogIcon:'acorn: rendered path matches the installed package component',mediaLibraryUpload:{via:'built admin file picker and upload queue',filename:path.basename(uploadFile),completed:true,visibleInLibrary:true,metadataEditViaUi:{altText:true,caption:true,saveStatus:mediaSaved.status(),reloadVerified:true},storage:'fresh disposable local storage'},scope:'Node/SQLite built inline editor for Page/Post, media insertion and public rendering; not provider/Workers certification'},null,2)+'\n');
  console.log('E01 actual inline editor Page/Post save/publish, Media Library upload/metadata edit and media insertion/public render passed.');
}catch(error){
  console.error('E01 failure:',error);
  await page.screenshot({path:path.join(report,'failure.png'),fullPage:true,timeout:5000}).catch(()=>{});
  await fs.writeFile(path.join(report,'failure.html'),await Promise.race([page.content().catch(()=>''),new Promise(resolve=>setTimeout(()=>resolve('Timed out obtaining diagnostic HTML'),5000))]));await fs.writeFile(path.join(report,'errors.json'),JSON.stringify(errors));
  const resources=await Promise.race([page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name)).catch(()=>[]),new Promise(resolve=>setTimeout(()=>resolve([]),5000))]);
  await fs.mkdir(path.join(report,'chunks'),{recursive:true});
  for(const resource of resources) {
    const url=new URL(resource);const name=path.basename(url.pathname);
    if(url.origin===site.origin && /^[\w.-]+\.js$/.test(name) && /vendor.*InlinePortableText/.test(name)) {
      const response=await page.request.get(resource);if(response.ok())await fs.writeFile(path.join(report,'chunks',name),await response.body());
    }
  }
  throw error;
}
finally{await context.close();await browser.close();await site.cleanup();}
