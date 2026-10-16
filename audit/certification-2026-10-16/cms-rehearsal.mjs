// Local certification receipt driver. Run with cwd = the isolated clean checkout.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
const root = process.cwd(), report = path.resolve(root, '../../../audit/certification-2026-10-16');
assert.ok(root.endsWith(path.join('.emdash','checks','certification-clean')));
assert.equal(process.platform,'win32'); assert.ok(!process.env.CI);
assert.equal(process.versions.node,'24.21.0');
try { await fs.access(path.join(root,'data.db')); assert.ok(process.argv.includes('--resume-owned'),'Existing fixture DB requires explicit --resume-owned'); } catch(e) { if(e.code !== 'ENOENT') throw e; }
await fs.mkdir(report,{recursive:true});
const require = createRequire(path.join(root,'package.json'));
const { chromium, expect: baseExpect } = require('@playwright/test');
const expect=baseExpect.configure({timeout:30000});
const sharp = (await import(pathToFileURL(require.resolve('sharp')))).default;
const socket = createServer(); socket.listen(0,'127.0.0.1'); await once(socket,'listening');
const port = socket.address().port; await new Promise(resolve=>socket.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const env = Object.fromEntries(Object.entries(process.env).filter(([key])=>/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(key)));
Object.assign(env,{HOST:'127.0.0.1',PORT:String(port),EMDASH_ENCRYPTION_KEY:'emdash_enc_v1_'+randomBytes(32).toString('base64url')});
const logs=[]; let server,browser;
const slug='certified-components-'+Date.now(), publicPath='/'+slug;
const receipts={node:process.versions.node,workingDatabaseCopied:false,rootKind:'clean-clone',route:publicPath,checks:[]};
async function stop(){if(server && server.exitCode===null){const done=once(server,'exit');server.kill();await done;}server=undefined;}
async function launch(args,extra={}){
  server=spawn(process.execPath,args,{cwd:root,env:{...env,...extra},stdio:['ignore','pipe','pipe']});
  for(const stream of[server.stdout,server.stderr])stream.on('data',data=>logs.push(String(data)));
  const deadline=Date.now()+120000;
  while(Date.now()<deadline){if(server.exitCode!==null)throw Error('Owned server exited');try{const response=await fetch(origin+'/',{signal:AbortSignal.timeout(10000)});if(response.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
  throw Error('Owned server readiness timeout');
}
async function run(args){const child=spawn(process.execPath,args,{cwd:root,env,stdio:['ignore','pipe','pipe']});let text='';for(const stream of[child.stdout,child.stderr])stream.on('data',data=>text+=data);const[code]=await once(child,'exit');assert.equal(code,0,text);return text;}
try{
  await launch(['node_modules/astro/bin/astro.mjs','dev','--host','127.0.0.1','--port',String(port)]);
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}), page=await context.newPage();
  page.setDefaultTimeout(30000);
  await context.request.get(origin+'/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin');
  const api=async(url,options={})=>{const response=await context.request.fetch(origin+url,{...options,headers:{origin,referer:origin+'/','X-EmDash-Request':'1',...options.headers}});const result=await response.json();assert.ok(response.ok()&&result.success,JSON.stringify({url,status:response.status(),result}));return result.data;};
  const schema=await api('/_emdash/api/schema');
  const collections=schema.collections; assert.ok(Array.isArray(collections),JSON.stringify(Object.keys(schema)));
  for(const slug of['posts','pages']){const collection=collections.find(c=>c.slug===slug);assert.ok(collection);for(const field of['title','content'])assert.ok(collection.fields.some(f=>f.slug===field));}
  receipts.checks.push({name:'registered-schema',collections:collections.map(c=>({slug:c.slug,fields:c.fields.map(f=>f.slug)}))});
  const images=[];
  for(const [index,color]of['#345678','#876543'].entries()){
    const buffer=await sharp({create:{width:640,height:400,channels:3,background:color}}).png().toBuffer();
    const uploaded=await api('/_emdash/api/media',{method:'POST',multipart:{file:{name:`certification-${index}.png`,mimeType:'image/png',buffer},alt:`Certification image ${index}`,caption:`Media caption ${index}`}});
    const item=uploaded.item; assert.equal(item.width,640);assert.equal(item.height,400);
    images.push({_type:'image',_key:`image-${index}`,asset:{_type:'reference',_ref:item.id,url:item.url,provider:item.provider||'local'},alt:`Certification image ${index}`,caption:`Gallery caption ${index}`,width:640,height:400});
  }
  const span=(text,key)=>({_type:'span',_key:key,text,marks:[]});
  const table={_type:'table',_key:'cert-table',hasHeaderRow:true,rows:[['Heading A','Heading B'],['Value A','Value B']].map((row,r)=>({_type:'tableRow',_key:`row-${r}`,cells:row.map((text,c)=>({_type:'tableCell',_key:`cell-${r}-${c}`,isHeader:r===0,content:[span(text,`span-${r}-${c}`)]}))}))};
  const content=[{_type:'block',_key:'cert-intro',style:'normal',markDefs:[],children:[span('Certification original paragraph','intro-span')]},table,{_type:'gallery',_key:'cert-gallery',columns:2,images}];
  const created=await api('/_emdash/api/content/pages',{method:'POST',data:{slug,data:{title:'Certified components',content}}});
  const id=created.item.id, endpoint='/_emdash/api/content/pages/'+id;
  await api(endpoint+'/publish',{method:'POST',data:{}});
  const canonical=(await api(endpoint)).item.data.content;
  assert.deepEqual(canonical,content);
  const publicContext=await browser.newContext(), publicPage=await publicContext.newPage();
  const inspectPublic=async()=>{
    await publicPage.goto(origin+publicPath);
    await expect(publicPage.locator('h1')).toHaveText('Certified components');
    await expect(publicPage.locator('th')).toHaveText(['Heading A','Heading B']);
    await expect(publicPage.locator('td')).toHaveText(['Value A','Value B']);
    await expect(publicPage.locator('[data-photo-gallery] img')).toHaveCount(2);
    assert.deepEqual(await publicPage.locator('[data-photo-gallery] img').evaluateAll(items=>items.map(item=>item.alt)),['Certification image 0','Certification image 1']);
    await expect(publicPage.locator('[data-photo-gallery]')).toContainText('Gallery caption 0');
    await expect(publicPage.locator('[data-photo-gallery]')).toContainText('Gallery caption 1');
    await publicPage.locator('[data-photo-gallery]').scrollIntoViewIfNeeded();
    await expect.poll(()=>publicPage.locator('[data-photo-gallery] img').evaluateAll(items=>items.every(item=>item.complete&&item.naturalWidth>0))).toBe(true);
  };
  await inspectPublic();
  await publicPage.screenshot({path:path.join(report,'cms-public.png'),fullPage:true});
  receipts.checks.push({name:'public-canonical-table-gallery',passed:true,images:images.length,tableHeaderAndBody:true,captionOrder:true});
  await page.goto(origin+publicPath);
  await page.locator('.emdash-tb-toggle').click(); await page.waitForLoadState('load');
  await expect(page.locator('h1[data-emdash-ref]')).toBeVisible();
  await expect(page.locator('[data-emdash-table-block="true"]')).toContainText('Table (edit in admin)');
  const paragraph=page.locator('.tiptap p').filter({hasText:'Certification original paragraph'}).first();
  await expect(paragraph).toBeVisible();
  await paragraph.click(); await page.keyboard.press('Home'); await page.keyboard.press('Shift+End'); await page.keyboard.insertText('Certification edited paragraph');
  await page.locator('#emdash-toolbar').click({position:{x:20,y:20}});
  await expect.poll(async()=>JSON.stringify((await api(endpoint)).item.data.content),{timeout:30000}).toContain('Certification edited paragraph');
  const saved=(await api(endpoint)).item.data.content;
  assert.deepEqual(saved.find(block=>block._type==='table'),table);
  const savedGallery=saved.find(block=>block._type==='gallery');
  const {_key:originalGalleryKey,...originalGallery}=content[2],{_key:savedGalleryKey,...galleryData}=savedGallery;
  assert.ok(typeof savedGalleryKey==='string'&&savedGalleryKey.length>0);
  assert.deepEqual(galleryData,originalGallery); // Asset IDs, image keys, captions, dimensions and order remain exact.
  await page.reload(); await expect(page.locator('.tiptap')).toContainText('Certification edited paragraph');
  await page.screenshot({path:path.join(report,'cms-editor.png'),fullPage:true});
  await api(endpoint+'/publish',{method:'POST',data:{}});
  await publicPage.reload();await expect(publicPage.locator('.article-body')).toContainText('Certification edited paragraph');
  await inspectPublic();
  receipts.checks.push({name:'actual-inline-edit-save-reload-publish',passed:true,tableUnchanged:true,gallerySemanticDataUnchanged:true,galleryOuterKeyRegenerated:originalGalleryKey!==savedGalleryKey,tableEditMode:'read-only placeholder; admin owns table editing'});
  await browser.close();browser=undefined;await stop();
  receipts.schemaBudget=await run(['scripts/check-schema-budget.mjs']);
  await fs.writeFile(path.join(report,'schema-budget.log'),receipts.schemaBudget);
  const build=await run(['node_modules/astro/bin/astro.mjs','build']);await fs.writeFile(path.join(report,'cms-build.log'),build);
  await launch(['dist/server/entry.mjs'],{NODE_ENV:'production'});
  const response=await fetch(origin+publicPath);assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('Certification edited paragraph'));assert.ok(!html.includes('tweaks-panel'));assert.ok(html.includes('Value B')&&html.includes('Gallery caption 1'));
  assert.equal((await fetch(origin+'/_styleguide')).status,404);
  receipts.checks.push({name:'built-node-cms-content',passed:true,styleguideStatus:404,hud:false});
  receipts.locales={status:'not-applicable',reason:'Starter has no i18n configuration or translated collection fixture; multilingual readiness not certified.'};
  receipts.caching={status:'not-applicable',reason:'Astro route caching is disabled; shared-query hint coverage requires its own opt-in review.'};
  receipts.passed=true;
}finally{
  if(browser)await browser.close();await stop();
  await fs.writeFile(path.join(report,'cms-server.log'),logs.join(''));
  await fs.writeFile(path.join(report,'cms-rehearsal.json'),JSON.stringify({...receipts,serverStopped:true},null,2)+'\n');
}
console.log('Fresh registered schema, canonical table/gallery, actual inline save/reload/publish, physical budget and built Node rendering passed.');
