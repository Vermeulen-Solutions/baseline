import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { applyTokenOverrides, resolveSpacing, auditDesignTokens, stylesheetDigest } from '../scripts/design-system.mjs';

const css=fs.readFileSync('src/styles/global.css','utf8');
test('T01/T06 exact token scope, ambiguity, no-op and narrow context targeting',()=>{
  for(const update of [{root:{'--layout-contaner-gap':'0'}},{theme:{'--layout-container-gap':'0'}},{wrong:{x:'0'}}])assert.throws(()=>applyTokenOverrides(css,update),/Unknown/);
  assert.throws(()=>applyTokenOverrides(css.replace('--layout-grid-gap:','--layout-grid-gap: 0; --layout-grid-gap:'),{root:{'--layout-grid-gap':'0'}}),/Duplicate/);
  assert.equal(applyTokenOverrides(css,{root:{'--layout-grid-gap':'var(--spacing-grid)'}}),css);
  const next=applyTokenOverrides(css,{root:{'--layout-grid-gap':'0'}});
  assert.equal(next,css.replace('--layout-grid-gap: var(--spacing-grid);','--layout-grid-gap: 0;'));
  assert.equal(auditDesignTokens(next).valid,true);
});

test('font source refusal precedes CSS and companion-file writes, and a corrected exact-case path previews cleanly',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'font-token-cli-'));
  const script=path.resolve('scripts/design-system.mjs');
  try {
    fs.writeFileSync(path.join(dir,'baseline.config.json'),JSON.stringify({foundation:'static'}));
    fs.mkdirSync(path.join(dir,'public/fonts'),{recursive:true});
    fs.mkdirSync(path.join(dir,'audit'));
    fs.copyFileSync('node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff2',path.join(dir,'public/fonts/Fixture.woff2'));
    const candidate=applyTokenOverrides(css,{theme:{'--font-body':'"Fixture Sans", sans-serif'}})+'\n@import "/fonts/faces.css";\n';
    const face='@font-face { font-family: "Fixture Sans"; src: url("fixture.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }\n';
    fs.writeFileSync(path.join(dir,'public/fonts/faces.css'),face);
    fs.writeFileSync(path.join(dir,'global.css'),candidate);
    fs.writeFileSync(path.join(dir,'AGENTS.md'),'preserved context\n');
    fs.writeFileSync(path.join(dir,'audit/design-gate-exceptions.json'),'[]\n');
    const files=['global.css','AGENTS.md','audit/design-gate-exceptions.json','public/fonts/faces.css'];
    const snapshot=()=>files.map(file=>fs.readFileSync(path.join(dir,file),'utf8'));
    const before=snapshot();
    const run=(...args)=>spawnSync(process.execPath,[script,'--css','global.css',...args],{cwd:dir,encoding:'utf8'});
    const refused=run('--set','--radius-card=1rem','--write','--write-record','--write-calibration','--json');
    assert.equal(refused.status,1,refused.stderr+refused.stdout);
    assert.equal(JSON.parse(refused.stdout).fontLoading.preflight.valid,false);
    assert.ok(JSON.parse(refused.stdout).fontLoading.preflight.errors.length>0);
    assert.deepEqual(snapshot(),before);
    assert.equal(fs.existsSync(path.join(dir,'audit/component-calibration.md')),false);
    fs.writeFileSync(path.join(dir,'public/fonts/faces.css'),face.replace('fixture.woff2','Fixture.woff2'));
    const corrected=snapshot();
    const preview=run('--set','--radius-card=1rem','--json');
    assert.equal(preview.status,0,preview.stderr+preview.stdout);
    const result=JSON.parse(preview.stdout);
    assert.equal(result.mode,'preview'); assert.equal(result.fontLoading.preflight.valid,true);
    assert.deepEqual(result.fontLoading.missingFamilies,[]);
    assert.ok(result.fontLoading.preflight.faces.some(face=>face.family==='fixture sans' && face.source==='public/fonts/faces.css'));
    assert.deepEqual(snapshot(),corrected);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});

test('T02 bounded spacing resolution reports dependency failures and supported arithmetic',()=>{
  const map={'--a':'calc(var(--b) * 0.5)','--b':'clamp(1rem, calc(1rem + 2vi), 3rem)'};
  assert.equal(resolveSpacing('--a',map,{viewportSizePx:800}).px,16);
  assert.deepEqual(resolveSpacing('--a',map).dependencies,['--a','--b']);
  assert.equal(resolveSpacing('--a',{'--a':'0'}).px,0);
  assert.equal(resolveSpacing('--a',{'--a':'var(--missing, 2rem)'}).px,32);
  for(const [input,pattern] of [['var(--missing)',/Missing/],['var(--a)',/cycle/],['-1rem',/nonnegative/],['min(2rem, 3rem)',/Unverified/]])assert.throws(()=>resolveSpacing('--a',{'--a':input}),pattern);
});

test('T03-T05 CLI validates before writes and binds calibration to the saved candidate',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'spacing-token-'));
  const script=path.resolve('scripts/design-system.mjs');
  try {
    fs.writeFileSync(path.join(dir,'baseline.config.json'),JSON.stringify({foundation:'static'}));
    fs.writeFileSync(path.join(dir,'global.css'),css);
    fs.writeFileSync(path.join(dir,'AGENTS.md'),'original record\n');
    fs.mkdirSync(path.join(dir,'audit'));fs.writeFileSync(path.join(dir,'audit/design-gate-exceptions.json'),'[]\n');
    const run=(...args)=>spawnSync(process.execPath,[script,'--css','global.css',...args],{cwd:dir,encoding:'utf8'});
    const before=()=>['global.css','AGENTS.md','audit/design-gate-exceptions.json'].map(p=>fs.readFileSync(path.join(dir,p),'utf8'));
    const original=before();
    const bad=run('--set','--root:--layout-grid-gap=-1rem','--init-client','--write-calibration');
    assert.equal(bad.status,1,bad.stdout+bad.stderr);assert.deepEqual(before(),original);
    assert.equal(run('--set','--root:--layout-grid-gap=0','--write-calibration').status,1);
    assert.deepEqual(before(),original);assert.equal(fs.existsSync(path.join(dir,'audit/component-calibration.md')),false);
    const preview=run('--set','--root:--layout-grid-gap=0','--json');assert.equal(preview.status,0,preview.stderr);
    assert.equal(JSON.parse(preview.stdout).mode,'preview');assert.deepEqual(before(),original);
    const saved=run('--set','--root:--layout-grid-gap=0','--write','--write-calibration','--json');assert.equal(saved.status,0,saved.stderr);
    assert.equal(JSON.parse(saved.stdout).mode,'saved');assert.equal(JSON.parse(saved.stdout).valid,true);
    const candidate=fs.readFileSync(path.join(dir,'global.css'),'utf8');
    assert.ok(fs.readFileSync(path.join(dir,'audit/component-calibration.md'),'utf8').includes(stylesheetDigest(candidate)));
    const cal=path.join(dir,'audit/component-calibration.md');
    fs.writeFileSync(cal,fs.readFileSync(cal,'utf8').split('## Component Specimens To Verify')[0]);
    const refreshed=run('--write-calibration','--json');assert.equal(refreshed.status,0,refreshed.stderr);
    assert.equal(JSON.parse(refreshed.stdout).sha256,stylesheetDigest(candidate));
    assert.equal(fs.readFileSync(cal,'utf8').match(/^## Token Calibration$/gm)?.length,1,'EOF calibration does not append duplicates');
    assert.match(run('--set','--root:--layout-grid-gap=0','--write').stdout,/No-op/);
    assert.equal(JSON.parse(run('--set','--root:--layout-grid-gap=0','--write','--json').stdout).mode,'no-op');
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
