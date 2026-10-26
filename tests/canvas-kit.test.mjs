import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canvasSource, canvasPayload, generateCanvasKit } from '../scripts/canvas-kit.mjs';
import { auditDesignTokens } from '../scripts/design-system.mjs';
import { ruleActionability } from '../scripts/audit-actionability.mjs';

async function fixture(run) {
  const parent=fs.mkdtempSync(path.join(os.tmpdir(),'baseline-canvas-kit-')),root=path.join(parent,'site');
  fs.mkdirSync(path.join(root,'src/styles'),{recursive:true});
  fs.writeFileSync(path.join(root,'package.json'),'{}');
  const css='@import "tailwindcss"; @theme { --color-page: #fffdf9; --font-body: Arial, sans-serif; --spacing-container: clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem); } :root { --color-elevated: color-mix(in oklch, var(--color-page) 90%, black); } body { background-image:url(https://example.invalid/no-fetch); }';
  const file=path.join(root,'src/styles/global.css');fs.writeFileSync(file,css);
  try { await run({parent,root,file,css}); }
  finally { assert.equal(path.dirname(parent),path.resolve(os.tmpdir()));assert.ok(path.basename(parent).startsWith('baseline-canvas-kit-'));fs.rmSync(parent,{recursive:true,force:true}); }
}

test('canvas export samples inert source, retains exact expressions and refuses incomplete scenes without inventing values', () => fixture(async ({parent,root,file,css}) => {
  const out=path.join(parent,'kit');let calls=0;
  const report=await generateCanvasKit({root,out,sampler:async source=>{
    calls++; assert.doesNotMatch(source.css,/@import|@theme|background-image/);
    assert.match(source.css,/color-mix/);
    return {browserVersion:'injected unit sampler, not browser evidence',samples:[{width:390,rootFontPx:16,tokens:[{name:'--spacing-container',status:'resolved',type:'length',value:17.16693,resolvedExpression:'clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)'}]}]};
  }});
  assert.equal(calls,1);assert.equal(fs.readFileSync(file,'utf8'),css);
  assert.equal(report.samples[0].sceneReady,false);assert.ok(report.samples[0].missing.includes('--color-action'));
  assert.ok(!fs.existsSync(path.join(out,'390.jsx')));
  const tokens=JSON.parse(fs.readFileSync(path.join(out,'390.tokens.json')));
  assert.equal(tokens.site390['spacing-container'].$extensions['dev.openpencil'].expression,'clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)');
  assert.equal(tokens.site390['spacing-container'].$extensions['dev.openpencil'].codeSyntax.WEB,'var(--spacing-container)');
}));

test('existing/in-target/linked/imported outputs or inputs refuse before a browser is launched', () => fixture(async ({parent,root,file}) => {
  let called=false;const sampler=async()=>{called=true;throw Error('must not run')};
  await assert.rejects(generateCanvasKit({root,out:root,sampler}),/already exists/);
  await assert.rejects(generateCanvasKit({root,out:path.join(root,'new-kit'),sampler}),/outside/);
  const alias=path.join(parent,'linked');fs.symlinkSync(root,alias,process.platform==='win32'?'junction':'dir');
  await assert.rejects(generateCanvasKit({root:alias,out:path.join(parent,'kit'),sampler}),/Linked/);
  fs.appendFileSync(file,'\n@import "./brand.css";');assert.throws(()=>canvasSource(root),/Additional CSS imports/);
  assert.equal(called,false);
}));

test('source drift during sampling refuses publication, and no target configuration is executed', () => fixture(async ({parent,root,file}) => {
  fs.writeFileSync(path.join(root,'astro.config.mjs'),'throw new Error("target code must never execute");');
  await assert.rejects(generateCanvasKit({root,out:path.join(parent,'kit'),sampler:async()=>{
    fs.appendFileSync(file,'\n/* concurrent edit */');return {browserVersion:'test',samples:[]};
  }}),/Source changed/);
  assert.equal(fs.existsSync(path.join(parent,'kit')),false);
}));

test('explicit legacy-role mapping keeps ordered source identity and never renames the site theme', () => fixture(async ({root,file,css}) => {
  fs.writeFileSync(path.join(root,'src/styles/brand.css'),':root { --brand-canvas:#f5c65d; }');
  const source=canvasSource(root,{styles:['src/styles/global.css','src/styles/brand.css'],roles:{'--color-page':'--brand-canvas'},contextClass:'site-design'});
  assert.equal(source.roles['--color-page'],'--brand-canvas');
  assert.deepEqual(source.inputs.slice(0,2).map(input=>input.path),['src/styles/global.css','src/styles/brand.css']);
  const payload=canvasPayload(source,{width:390,rootFontPx:16,tokens:[{name:'--color-page',sourceName:'--brand-canvas',status:'resolved',type:'color',value:[1,0.8,0.3,1]}]});
  assert.equal(payload.tokens.site390['color-page'].$extensions['dev.openpencil'].codeSyntax.WEB,'var(--brand-canvas)');
  assert.match(payload.tokens.site390['color-page'].$description,/#f5c65d/);
  assert.equal(fs.readFileSync(file,'utf8'),css);
  assert.throws(()=>canvasSource(root,{roles:{'--color-page':'#fff'}}),/Invalid explicit/);
}));

test('canvas scenes refuse mismatched required token types and unresolved font stacks', () => {
  const source = { declarations: [] };
  const sample = { width: 390, rootFontPx: 16, tokens: [
    { name: '--color-page', status: 'resolved', type: 'length', value: 12 },
    { name: '--spacing-container', status: 'resolved', type: 'color', value: [1, 1, 1, 1] },
    { name: '--font-body', status: 'unresolved', type: 'font', value: '12px' }
  ] };
  const payload = canvasPayload(source, sample);
  assert.ok(payload.missing.includes('--color-page'));
  assert.ok(payload.missing.includes('--spacing-container'));
  assert.ok(payload.missing.includes('--font-body'));
  assert.equal(payload.jsx, null);
});

test('unknown audit rules and token failures require judgment/review, not automatic remediation', () => {
  assert.equal(ruleActionability({id:'future-rule',status:'fail'}),'review_required');
  assert.equal(ruleActionability({id:'schema-prebuild',status:'warning',remediation:'schema-budget-prebuild@1'}),'bounded_recipe');
  assert.equal(ruleActionability({id:'schema-prebuild',status:'unverified',remediation:'schema-budget-prebuild@1'}),'verification_required');
  const report=auditDesignTokens('@theme { --text-step-0: clamp(1rem, calc(0.5rem + 2vi), 2rem); }');
  assert.ok(report.diagnostics.some(item=>item.status==='fail' && item.actionability==='review_required'));
  assert.ok(report.diagnostics.some(item=>item.status==='advisory' && item.actionability==='design_judgment'));
  assert.ok(report.diagnostics.every(item=>item.actionability!=='mechanical_safe'));
});
