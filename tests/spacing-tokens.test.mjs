import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { applyTokenOverrides, resolveSpacing, auditDesignTokens, stylesheetDigest } from '../scripts/design-system.mjs';

const css=fs.readFileSync('src/styles/global.css','utf8');
// A site's global.css imports its sibling stylesheets (./site.css): copy the folder, then replace global.css.
const copyStyles=dir=>fs.cpSync('src/styles',dir,{recursive:true});
// These tests exercise the token tool, not the site's choice of faces. A site loads its own typeface from its
// package.json or its layout, which the temporary folder does not have, so the tool would refuse the stylesheet
// for a reason that has nothing to do with the test. The font roles go back to system stacks here.
const SYSTEM_FACES={'--font-body':'ui-sans-serif, system-ui, sans-serif','--font-display':'ui-sans-serif, system-ui, sans-serif','--font-mono':'ui-monospace, Menlo, Consolas, "Liberation Mono", monospace','--font-accent':'Georgia, Cambria, "Times New Roman", Times, serif'};
const declares=(sheet,name)=>sheet.split('\n').some(line=>line.trim().startsWith(name+':'));
const withSystemFaces=sheet=>applyTokenOverrides(sheet,{theme:Object.fromEntries(Object.entries(SYSTEM_FACES).filter(([name])=>declares(sheet,name)))});
const plain=withSystemFaces(css);
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
    copyStyles(dir);
    fs.mkdirSync(path.join(dir,'public/fonts'),{recursive:true});
    fs.mkdirSync(path.join(dir,'audit'));
    fs.copyFileSync('node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff2',path.join(dir,'public/fonts/Fixture.woff2'));
    const candidate=applyTokenOverrides(plain,{theme:{'--font-body':'"Fixture Sans", sans-serif'}})+'\n@import "/fonts/faces.css";\n';
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
    copyStyles(dir);
    fs.writeFileSync(path.join(dir,'global.css'),plain);
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

test('layout gap props accept token names and keep raw lengths for compatibility', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/lib/layout-style.ts', import.meta.url), 'utf8');
  // The helper is TypeScript; check the mapping table and its pass-through rule from source.
  assert.match(source, /if \(gap === 'none'\) return '0px';/);
  assert.match(source, /GAP_TOKENS\.has\(gap\) \? `var\(--spacing-\$\{gap\}\)` : gap/);
  for (const name of ['content', 'grid', 'container', 'section', 'section-m', '3xs', 's', '3xl', 'xl-3xl']) assert.ok(source.includes(`'${name}'`), name);
  for (const file of ['Section', 'Container', 'Grid']) assert.match(readFileSync(new URL(`../src/components/${file}.astro`, import.meta.url), 'utf8'), /gap\?: LayoutGap;/, file);
});

test('--init-client keeps a record that holds the site World; --write-record still replaces it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'record-guard-'));
  const script = path.resolve('scripts/design-system.mjs');
  try {
    fs.writeFileSync(path.join(dir, 'baseline.config.json'), JSON.stringify({ foundation: 'static' }));
    copyStyles(dir);
    fs.writeFileSync(path.join(dir, 'global.css'), css);
    fs.mkdirSync(path.join(dir, 'audit')); fs.writeFileSync(path.join(dir, 'audit/design-gate-exceptions.json'), '[]\n');
    const record = '# Site\n\n## Art Direction Record\n- **Aesthetic Lane:** Custom\n- **World:**\n  - Objects: the service sticker\n\n## Implementation rules\n';
    fs.writeFileSync(path.join(dir, 'AGENTS.md'), record);
    const run = (...args) => spawnSync(process.execPath, [script, '--css', 'global.css', ...args], { cwd: dir, encoding: 'utf8' });
    const init = run('--lane', 'neutral', '--init-client');
    assert.equal(init.status, 0, init.stderr);
    assert.match(init.stdout, /Kept the site's ## Art Direction Record/);
    assert.equal(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), record);
    assert.equal(run('--lane', 'neutral', '--write', '--write-record').status, 0);
    assert.doesNotMatch(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), /the service sticker/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a dark ground: the seed refuses it and says how, the surface values can be set in one command, and a failing pair says where its colours come from', async () => {
  const { generateSeededPalette } = await import('../scripts/design-system.mjs');
  // The seeded palette is a light one; a dark canvas used to come back as a pale page without a word.
  assert.throws(() => generateSeededPalette({ accent: '#ff6b57', canvas: '#1c1210' }), /makes a light ground and #1c1210 is dark.*--color-page=<ground>.*--surface-light-/s);
  assert.ok(generateSeededPalette({ accent: '#1B4332', canvas: '#FAF8F5' }).theme['--color-page']);
  const dark = { '--color-page': '#1c1210', '--color-surface': '#2a1c18', '--color-text': '#f6e7e0', '--color-muted': '#c9b0a6', '--color-border': '#4a3530', '--color-action': '#ff6b57', '--color-on-action': '#1c0b08', '--color-focus': '#ffb3a6' };
  // A light section on a dark theme falls back to white with the accent as its link: the message says so.
  const failing = auditDesignTokens(applyTokenOverrides(plain, { theme: dark, root: { '--surface-light-bg': '#ffffff', '--surface-light-link': '#ff6b57' } }));
  const message = failing.errors.find((error) => error.includes('light:link-on-surface'));
  assert.match(message, /takes its ground from --surface-light-bg.*its link from --surface-light-link.*--root:--surface-light-link=.*This site's theme is dark/s);
  // The values a surface block reads with a fallback are added to :root when the site has not set them yet.
  const saved = applyTokenOverrides(plain, { theme: dark, root: { '--surface-light-bg': '#f3e6dc', '--surface-light-link': '#9c2b1b' } });
  assert.match(saved, /--surface-light-link: #9c2b1b;/);
  assert.equal(auditDesignTokens(saved).errors.some((error) => error.includes('light:link-on-surface')), false);
  assert.equal(applyTokenOverrides(saved, { root: { '--surface-light-link': '#8a2415' } }).match(/--surface-light-link:/g).length, 1);
  // Any other unknown name in :root is still refused.
  assert.throws(() => applyTokenOverrides(plain, { root: { '--surface-light-glow': '#fff' } }), /Unknown token in root/);
});
