import { listenLoopback } from '../../scripts/loopback-port.mjs';
// Local historical static upgrade rehearsal. Never targets a client checkout.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import { chromium, expect } from '@playwright/test';
import { initProfile, planProfile } from '../../scripts/init-profile.mjs';
import { stageBaseline, applyBaseline } from '../../scripts/sync-baseline.mjs';
import { spawnNpmSync } from '../../scripts/process-runner.mjs';

if(process.platform!=='win32' || process.env.CI || process.env.GITHUB_ACTIONS==='true')throw new Error('Local Windows upgrade rehearsal only');
const source=process.cwd(), report=path.resolve('.emdash/visual/spacing-upgrade');
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'baseline-spacing-upgrade-'));
const historical=path.join(temporary,'historical'),root=path.join(temporary,'site'),donor=path.join(temporary,'donor');
const hash=value=>createHash('sha256').update(value).digest('hex');
const revision=execFileSync('git',['rev-parse','c3d965c'],{cwd:source,encoding:'utf8'}).trim();
const log=[], receipt={historicalRevision:revision,profile:'static',independentInstall:true,workingClientTouched:false};
let browser;
async function npm(args){console.log('Upgrade: npm '+args.join(' '));const result=spawnNpmSync(args,{cwd:root,encoding:'utf8',timeout:300000});log.push(result.stdout??'',result.stderr??'');assert.ifError(result.error);assert.equal(result.status,0,(result.stdout??'').slice(-3000)+(result.stderr??'').slice(-3000));}
async function refreshGate(){const p=path.join(root,'audit/design-gate-exceptions.json'),gate=JSON.parse(await fs.readFile(p,'utf8'));for(const entry of gate){try{entry.sha256=hash((await fs.readFile(path.join(root,entry.path),'utf8')).replaceAll('\r\n','\n'));}catch(e){if(e.code!=='ENOENT')throw e;}}await fs.writeFile(p,JSON.stringify(gate,null,2)+'\n');}
async function capture(label){
  const base=path.join(root,'dist'), types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
  const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let target=path.resolve(base,'.'+pathname);assert.ok(target===base||target.startsWith(base+path.sep));if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');res.setHeader('Content-Type',types[path.extname(target)]??'application/octet-stream');res.end(await fs.readFile(target));}catch{res.writeHead(404);res.end();}});
  await listenLoopback(server);const origin='http://127.0.0.1:'+server.address().port,result=[];
  const context=await browser.newContext();
  try{for(const width of [390,768,1440])for(const route of ['/','/posts/welcome/']){
    const page=await context.newPage();page.setDefaultTimeout(15000);await page.setViewportSize({width,height:900});const response=await page.goto(origin+route);assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('main')).toBeVisible();assert.ok(await page.locator('main').innerText());
    if(label==='activated' && route==='/posts/welcome/')await expect(page.locator('main [data-editorial-content] ol')).toHaveCSS('list-style-type','decimal');
    const geometry=await page.evaluate(()=>({policy:document.documentElement.dataset.spacingPolicy??'legacy',overflow:document.documentElement.scrollWidth>innerWidth,calibrated:getComputedStyle(document.documentElement).getPropertyValue('--radius-card').trim(),items:[...document.querySelectorAll('main,main section,main .container,main h1,main h2,main p')].map(el=>{const r=el.getBoundingClientRect();return [el.tagName,r.x,r.y,r.width,r.height].map(v=>typeof v==='number'?Math.round(v*100)/100:v);})}));
    assert.equal(geometry.overflow,false);assert.equal(geometry.calibrated,'1rem');result.push({width,route,...geometry});await page.screenshot({path:path.join(report,label+'-'+width+'-'+(route==='/'?'home':'post')+'.png'),fullPage:true});await page.close();
  }}finally{await context.close();await new Promise(resolve=>server.close(resolve));}
  await fs.writeFile(path.join(report,label+'.json'),JSON.stringify(result,null,2));return result;
}
try{
  await fs.mkdir(report,{recursive:true});
  execFileSync('git',['clone','--shared','--no-checkout',source,historical],{stdio:'pipe'});
  execFileSync('git',['-C',historical,'checkout','--detach',revision],{stdio:'pipe'});
  execFileSync(process.execPath,[path.join(historical,'scripts/init-profile.mjs'),'--profile','static','--out',root],{cwd:historical,stdio:'pipe'});
  const cssPath=path.join(root,'src/styles/global.css');let css=await fs.readFile(cssPath,'utf8');
  css=css.replace(/--radius-card:\s*[^;]+;/,'--radius-card: 1rem;').replace(/--spacing-grid:\s*[^;]+;/,'--spacing-grid: clamp(1.4rem, calc(1rem + 2vi), 2.6rem);');await fs.writeFile(cssPath,css);await refreshGate();
  await npm(['install','--no-audit','--no-fund']);await npm(['run','verify']);await npm(['run','build']);
  assert.equal((await fs.lstat(path.join(root,'node_modules'))).isSymbolicLink(),false);
  browser=await chromium.launch({channel:'chromium'});const before=await capture('before');
  assert.ok(before.every(x=>x.policy==='legacy'));
  const oldManaged=JSON.parse(await fs.readFile(path.join(root,'.baseline/managed-files.json'),'utf8'));
  const backup=new Map();for(const target of [...Object.keys(oldManaged.files),'.baseline/managed-files.json','package-lock.json'])backup.set(target,await fs.readFile(path.join(root,target)));
  // Reviewed self-contained helper adoption precedes any proposal. It adds no module.
  const helper='scripts/sync-baseline.mjs',newHelper=await fs.readFile(path.join(source,helper));await fs.writeFile(path.join(root,helper),newHelper);oldManaged.files[helper].sha256=hash(newHelper);await fs.writeFile(path.join(root,'.baseline/managed-files.json'),JSON.stringify(oldManaged,null,2)+'\n');
  const incomingCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();
  const staged=await stageBaseline({root,commit:incomingCommit,readSource:relative=>fs.readFile(path.join(source,relative))});const applied=await applyBaseline({root,commit:incomingCommit});
  receipt.incomingSource={commit:incomingCommit,workingTreeBytes:true,proposals:staged.entries.map(({target,incomingHash})=>({target,sha256:incomingHash}))};
  for(const target of ['src/components/Section.astro','src/components/Container.astro','src/components/Grid.astro','scripts/design-system.mjs','src/styles/global.css'])assert.ok(applied.conflicts.includes(target),target);
  assert.equal(await fs.readFile(cssPath,'utf8'),css);assert.deepEqual(await fs.readFile(path.join(root,'src/layouts/Base.astro')),backup.get('src/layouts/Base.astro'));assert.deepEqual(await fs.readFile(path.join(root,'package.json')),backup.get('package.json'));
  await npm(['run','build']);assert.deepEqual(await capture('bounded-update'),before);receipt.boundedUpdate={conflicts:applied.conflicts,migrations:applied.migrations,geometryUnchanged:true,clientBaseAndPackagePreserved:true};
  // Explicit additive fixture migration: donor source is review material, never
  // a client replacement. Retain existing content/settings and every theme value.
  await initProfile({profile:'static',out:donor});const plan=await planProfile({profile:'static',out:path.join(temporary,'unused')});
  const donorManaged=JSON.parse(await fs.readFile(path.join(donor,'.baseline/managed-files.json'),'utf8'));
  receipt.migrationSource={commit:plan.config.source.commit,workingTreeBytes:true,files:Object.fromEntries(Object.entries(donorManaged.files).map(([target,record])=>[target,record.sha256]))};
  const oldTree=postcss.parse(css),nextTree=postcss.parse(await fs.readFile(path.join(donor,'src/styles/global.css'),'utf8'));
  const scope=node=>node.parent.type==='atrule'&&node.parent.name==='theme'?'theme':node.parent.type==='rule'?node.parent.selector:null;
  const values=new Map();oldTree.walkDecls(decl=>{const key=scope(decl);if(['theme',':root','[data-surface="dark"]','[data-surface="light"]'].includes(key))values.set(key+'|'+decl.prop,decl.value);});
  nextTree.walkDecls(decl=>{const value=values.get(scope(decl)+'|'+decl.prop);if(value!==undefined)decl.value=value;});
  for(const [target]of Object.entries(donorManaged.files)){
    if(target==='src/styles/global.css'||target==='baseline.config.json'||target==='audit/design-gate-exceptions.json'||target==='AGENTS.md'||target==='package.json'||/^(src\/content|src\/config|public\/admin)/.test(target))continue;
    const file=path.join(root,target);await fs.mkdir(path.dirname(file),{recursive:true});await fs.copyFile(path.join(donor,target),file);
  }
  const merged=nextTree.toString();await fs.writeFile(cssPath,merged);
  const installedConfig=JSON.parse(backup.get('baseline.config.json'));
  installedConfig.checks=plan.config.checks;
  installedConfig.generatorVersion=plan.config.generatorVersion;
  await fs.writeFile(path.join(root,'baseline.config.json'),JSON.stringify(installedConfig,null,2)+'\n');
  assert.deepEqual(installedConfig.source,JSON.parse(backup.get('baseline.config.json')).source,'Generation provenance is retained');
  const oldPackage=JSON.parse(backup.get('package.json')),newPackage=JSON.parse(await fs.readFile(path.join(donor,'package.json'),'utf8'));
  await fs.writeFile(path.join(root,'package.json'),JSON.stringify({...oldPackage,scripts:{...oldPackage.scripts,...newPackage.scripts},devDependencies:{...oldPackage.devDependencies,...newPackage.devDependencies}},null,2)+'\n');
  // The synthetic client routes are unchanged starter examples; current routes
  // above were deliberately reviewed as part of activation, not bounded sync.
  const gate=JSON.parse(await fs.readFile(path.join(donor,'audit/design-gate-exceptions.json'),'utf8'));await fs.writeFile(path.join(root,'audit/design-gate-exceptions.json'),JSON.stringify(gate,null,2)+'\n');await refreshGate();
  for(const [target,record]of Object.entries(donorManaged.files))record.sha256=hash(await fs.readFile(path.join(root,target)));
  donorManaged.sourceCommit=oldManaged.sourceCommit;
  donorManaged.sourceTreeDirty=oldManaged.sourceTreeDirty;
  donorManaged.lastMigration={commit:plan.config.source.commit,workingTreeBytes:true,kind:'reviewed automatic spacing fixture migration'};
  donorManaged.note='Historical generation identity retained; reviewed synthetic spacing migration records exact file hashes; not a real client receipt.';await fs.writeFile(path.join(root,'.baseline/managed-files.json'),JSON.stringify(donorManaged,null,2)+'\n');
  await npm(['install','--no-audit','--no-fund']);await npm(['run','verify']);await npm(['run','build']);await npm(['run','check:dev-tools']);
  const activated=await capture('activated');assert.ok(activated.every(x=>x.policy==='automatic-v2'));
  const savedTree=postcss.parse(await fs.readFile(cssPath,'utf8'));const savedValues=new Map();savedTree.walkDecls(decl=>savedValues.set(scope(decl)+'|'+decl.prop,decl.value));
  for(const [key,value]of values)assert.equal(savedValues.get(key),value,'Preserved calibrated value '+key);
  receipt.reviewedMigration={explicitInventory:true,generationProvenancePreserved:true,checksExplicitlyMigrated:true,independentInstall:true,verify:true,build:true,releaseIsolation:true,allCalibratedValuesPreserved:values.size,activation:true,nativeEditorialMarkers:true,browserWidths:[390,768,1440],routes:['/','/posts/welcome/']};
  for(const target of Object.keys(donorManaged.files))if(!backup.has(target))await fs.unlink(path.join(root,target));
  for(const [target,bytes]of backup){await fs.mkdir(path.dirname(path.join(root,target)),{recursive:true});await fs.writeFile(path.join(root,target),bytes);}
  await npm(['ci','--no-audit','--no-fund']);await npm(['run','verify']);await npm(['run','build']);assert.deepEqual(await capture('rollback'),before);receipt.rollback={completeSourceAndCallerRollback:true,verify:true,build:true,geometryRestored:true};
  receipt.sourceWorkingTreeDirty=plan.sourceTreeDirty;receipt.scope='Historical generated static fixture, root working-tree incoming bytes identified by receipt; no Sveltia live login, Workers/provider or external client certification';
  await fs.writeFile(path.join(report,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log('Historical spacing upgrade, explicit migration, calibrated-token preservation and rollback passed.');
}finally{
  await browser?.close();await fs.mkdir(report,{recursive:true});await fs.writeFile(path.join(report,'commands.log'),log.join('\n'));
  assert.equal(path.dirname(temporary),path.resolve(os.tmpdir()));assert.ok(path.basename(temporary).startsWith('baseline-spacing-upgrade-'));await fs.rm(temporary,{recursive:true,force:true});
}
