import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canvasSource, canvasPayload, generateCanvasKit, openDesignPayload, sampleCanvasTokens, tokenContextRisks } from '../scripts/canvas-kit.mjs';
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
  assert.equal(report.openDesign.ready,false);
  assert.deepEqual(report.openDesign.files,['open-design/open-design.json','open-design/DESIGN.md']);
  assert.ok(fs.existsSync(path.join(out,'open-design','open-design.json')));
  assert.ok(fs.existsSync(path.join(out,'open-design','DESIGN.md')));
  assert.ok(!fs.existsSync(path.join(out,'open-design','specimen.html')));
  const odDesignMd=fs.readFileSync(path.join(out,'open-design','DESIGN.md'),'utf8');
  assert.match(odDesignMd,/--spacing-container: clamp\(1rem, calc\(0\.6667rem \+ 1\.6667vi\), 2rem\)/);
  assert.match(odDesignMd,/Scene ready: `false`.*`--color-action`/);
}));

test('openDesignPayload emits DESIGN.md, open-design.json and a zero-JS specimen.html when all required tokens resolve', () => {
  const source = {
    inputs: [{ path: 'src/styles/global.css', sha256: 'abc123' }],
    declarations: [
      { name: '--color-page', expression: '#fffdf9', context: ':root' },
      { name: '--spacing-container', expression: 'clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)', context: ':root' }
    ],
    components: [{ name: 'Section', source: 'src/components/Section.astro', exists: true, props: [{ name: 'spacing' }] }],
    roles: {},
    contextClass: ''
  };
  const requiredTokens = [
    { name: '--color-page', status: 'resolved', type: 'color', value: [1, 0.992, 0.976, 1], computedColor: 'rgb(255, 253, 249)', resolvedExpression: '#fffdf9' },
    { name: '--color-surface', status: 'resolved', type: 'color', value: [0.95, 0.94, 0.92, 1], computedColor: 'rgb(242, 240, 235)', resolvedExpression: '#f2f0eb' },
    { name: '--color-text', status: 'resolved', type: 'color', value: [0.1, 0.1, 0.1, 1], computedColor: 'rgb(26, 26, 26)', resolvedExpression: '#1a1a1a' },
    { name: '--color-action', status: 'resolved', type: 'color', value: [0.8, 0.3, 0.1, 1], computedColor: 'rgb(204, 77, 26)', resolvedExpression: '#cc4d1a' },
    { name: '--color-on-action', status: 'resolved', type: 'color', value: [1, 1, 1, 1], computedColor: 'rgb(255, 255, 255)', resolvedExpression: '#ffffff' },
    { name: '--color-border', status: 'resolved', type: 'color', value: [0.85, 0.85, 0.85, 1], computedColor: 'rgb(217, 217, 217)', resolvedExpression: '#d9d9d9' },
    { name: '--spacing-container', status: 'resolved', type: 'length', value: 32, resolvedExpression: 'clamp(1rem, calc(0.6667rem + 1.6667vi), 2rem)' },
    { name: '--spacing-content', status: 'resolved', type: 'length', value: 24, resolvedExpression: '1.5rem' },
    { name: '--spacing-grid', status: 'resolved', type: 'length', value: 24, resolvedExpression: '1.5rem' },
    { name: '--radius-card', status: 'resolved', type: 'length', value: 12, resolvedExpression: '0.75rem' },
    { name: '--radius-control', status: 'resolved', type: 'length', value: 8, resolvedExpression: '0.5rem' },
    { name: '--text-step-0', status: 'resolved', type: 'length', value: 16, resolvedExpression: '1rem' },
    { name: '--text-step-1', status: 'resolved', type: 'length', value: 20, resolvedExpression: '1.25rem' },
    { name: '--text-step-2', status: 'resolved', type: 'length', value: 32, resolvedExpression: '2rem' },
    { name: '--font-display', status: 'resolved', type: 'font', value: 'Fraunces, serif', resolvedExpression: 'Fraunces, serif' },
    { name: '--font-body', status: 'resolved', type: 'font', value: 'Plus Jakarta Sans, sans-serif', resolvedExpression: 'Plus Jakarta Sans, sans-serif' },
    { name: '--font-accent', status: 'resolved', type: 'font', value: 'Instrument Serif, serif', resolvedExpression: 'Instrument Serif, serif' },
    { name: '--font-mono', status: 'resolved', type: 'font', value: 'JetBrains Mono, monospace', resolvedExpression: 'JetBrains Mono, monospace' }
  ];
  const sample390 = { width: 390, rootFontPx: 16, tokens: requiredTokens };
  const sample1440 = { width: 1440, rootFontPx: 16, tokens: requiredTokens };
  const payload390 = { sample: sample390, ...canvasPayload(source, sample390) };
  const payload1440 = { sample: sample1440, ...canvasPayload(source, sample1440) };
  const od = openDesignPayload(source, [payload390, payload1440]);
  assert.equal(od.ready, true);
  assert.equal(od.manifest.od.mode, 'design-system');
  assert.match(od.designMd, /clamp\(1rem, calc\(0\.6667rem \+ 1\.6667vi\), 2rem\)/);
  assert.match(od.html, /data-od-id="canvas-kit-specimen"/);
  assert.match(od.html, /letter-spacing:\s*0\.08em/);
});

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

test('registered properties keep inheritance descriptors and alias-dependent contexts are reported', () => fixture(async ({root,file}) => {
  fs.writeFileSync(file, '@property --space { syntax: "<length>"; inherits: false; initial-value: 4px; } :root { --space: 20px; --spacing-container: var(--space); } html[data-surface="dark"] { --space: 40px; } .card { --spacing-container: 12px; }');
  const source = canvasSource(root);
  assert.match(source.css, /inherits:\s*false/);
  assert.match(source.css, /initial-value:\s*4px/);
  const risks = tokenContextRisks(source, '--spacing-container');
  assert.ok(risks.some(risk => risk.name === '--space' && risk.contextPath.includes('html[data-surface="dark"]')));
  assert.ok(risks.some(risk => risk.name === '--spacing-container' && risk.contextPath.includes('.card')));
  assert.ok(risks.every(risk => risk.source === 'src/styles/global.css' && Number.isInteger(risk.line)));
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

// Full Chromium is intentionally local-only: profile/CI fast checks inject a sampler.
// Run this test explicitly with BASELINE_CANVAS_BROWSER_TESTS=1 after installing Chromium.
if (process.env.BASELINE_CANVAS_BROWSER_TESTS === '1') {
  test('real browser sampling rejects font-relative guesses, honors @property and reports alternative contexts', () => fixture(async ({root,file}) => {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ channel: 'chromium', headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      const emCss = ':root { --spacing-container: 2em } body { font-size: 20px }';
      fs.writeFileSync(file, emCss);
      const emSamples = await sampleCanvasTokens(canvasSource(root));
      await page.setContent(`<style>${emCss}</style><span style="margin-left:var(--spacing-container)">test</span>`);
      assert.equal(await page.locator('span').evaluate(element => getComputedStyle(element).marginLeft), '40px');
      assert.ok(emSamples.samples.every(sample => sample.tokens.find(token => token.name === '--spacing-container').status === 'unresolved'));
      assert.match(emSamples.samples[0].tokens[0].unresolvedReason, /font-relative/);

      const registeredCss = '@property --spacing-container { syntax:"<length>"; inherits:false; initial-value:4px } :root { --spacing-container:20px }';
      fs.writeFileSync(file, registeredCss);
      const registered = await sampleCanvasTokens(canvasSource(root));
      await page.setContent(`<style>${registeredCss}</style><span style="margin-left:var(--spacing-container)">test</span>`);
      assert.equal(await page.locator('span').evaluate(element => getComputedStyle(element).marginLeft), '4px');
      assert.ok(registered.samples.every(sample => sample.tokens.find(token => token.name === '--spacing-container').value === 4));

      fs.writeFileSync(file, ':root { --color-text:#111; --brand-radius:4px; --radius-card:var(--brand-radius) } html[data-surface="dark"] { --color-text:#fff } .card { --brand-radius:12px }');
      const contextual = await sampleCanvasTokens(canvasSource(root));
      for (const sample of contextual.samples) {
        assert.ok(sample.tokens.find(token => token.name === '--color-text').contextRisks.some(risk => risk.contextPath.includes('html[data-surface="dark"]')));
        assert.ok(sample.tokens.find(token => token.name === '--radius-card').contextRisks.some(risk => risk.contextPath.includes('.card')));
      }
    } finally { await browser.close(); }
  }));
}
