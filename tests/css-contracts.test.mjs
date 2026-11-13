import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectAuthorCSS, inspectSourceTree, inspectShellSlots, astroStyleInputs, analyzeFlow } from '../scripts/css-contracts.mjs';

test('a sticky header nested in an element slot wrapper is reported; direct and Fragment slots are not', () => {
  const wrapped = '---\nimport SiteShell from "./SiteShell.astro";\n---\n<SiteShell>\n  <div slot="header">\n    <p class="notice">Notice</p>\n    <div class="inner"><header class="site-header" data-sticky-header>Site</header></div>\n  </div>\n  <slot />\n</SiteShell>\n';
  const issues = inspectShellSlots(wrapped, 'src/layouts/Base.astro');
  assert.equal(issues.length, 1);
  assert.equal(issues[0].line, 5);
  assert.equal(issues[0].file, 'src/layouts/Base.astro');
  assert.match(issues[0].message, /<div slot="header"> cannot stick.*<Fragment slot="header">/);
  assert.equal(inspectShellSlots("<section class='bar' slot='header'><div><header data-sticky-header /></div></section>").length, 1);
  for (const source of [
    '<SiteShell><header slot="header" class="site-header" data-sticky-header>Site</header></SiteShell>',
    '<SiteShell><Fragment slot="header"><p>Notice</p><header data-sticky-header>Site</header></Fragment></SiteShell>',
    '<SiteShell><div slot="header"><header class="site-header">Static header</header></div><div data-sticky-header-note></div></SiteShell>',
    '<SiteShell><div slot="header"><p>Notice</p></div><header data-sticky-header>Outside the wrapper</header></SiteShell>',
    '<SiteShell><div slot="header"><div>Nested</div></div><div><header data-sticky-header>Later sibling tree</header></div></SiteShell>',
    '<SiteShell><div slot="footer"><header data-sticky-header>Other slot</header></div></SiteShell>',
    '<!-- <div slot="header"><header data-sticky-header></header></div> -->',
  ]) assert.deepEqual(inspectShellSlots(source), [], source);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-slots-'));
  try {
    fs.mkdirSync(path.join(dir, 'src/layouts'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src/layouts/Base.astro'), wrapped);
    const report = inspectSourceTree(dir, ['src']);
    assert.deepEqual(report.issues.map(issue => [issue.file, issue.line]), [['src/layouts/Base.astro', 5]]);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('M01-M03/M05 CSS parsing handles strings, comments, at-rules and anonymous/wrong layers',()=>{
  assert.equal(inspectAuthorCSS('@layer components { .x::after { content:"}"; } } .outside {color:red}').length,1);
  for(const css of ['@layer { .x {color:red} }','@layer utilities {.x{color:red}}','@layer vendor {.x{color:red}}','.x{color:red'])assert.ok(inspectAuthorCSS(css).length,css);
  for(const css of ['/* .fake{} */ @layer components { @media(width>1px) {.x {content:"{"}} }','@keyframes a {to{opacity:0}} @font-face{font-family:x;src:url(x)} @property --x{syntax:"*";inherits:false} @layer base{p{margin:0}}'])assert.deepEqual(inspectAuthorCSS(css),[]);
  assert.ok(inspectAuthorCSS('@layer components { .x {').length);
});

test('Astro parsing ignores style-looking script strings and comments and preserves source locations',()=>{
  const source='---\nconst fake="<style>.bad{}</style>";\n---\n<!-- <style>.fake{}</style> -->\n<script>const fake="<style>.script{}</style>";</script>\n<style>\n.outside { color:red }\n</style>';
  const inputs=astroStyleInputs(source,'test.astro');assert.equal(inputs.length,1);
  assert.equal(inspectAuthorCSS(inputs[0].css,inputs[0])[0].line,7);
});

test('M04/M06 standalone imports, new CSS files and static overlays are included without inspecting package CSS',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'spacing-css-'));
  try {
    fs.mkdirSync(path.join(dir,'src'),{recursive:true});fs.mkdirSync(path.join(dir,'profiles/static/project/src'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src/main.css'),'@import "../outside.css"; @import "vendor/style.css" layer(vendor);');
    fs.writeFileSync(path.join(dir,'outside.css'),'.outside{color:red}');
    fs.writeFileSync(path.join(dir,'profiles/static/project/src/overlay.astro'),'<style>.overlay{color:red}</style>');
    let r=inspectSourceTree(dir);assert.equal(r.issues.length,2);assert.equal(r.files,3);
    fs.writeFileSync(path.join(dir,'src/new.css'),'.new{color:red}');r=inspectSourceTree(dir);assert.equal(r.issues.length,3);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('M07-M10 flow audit recognizes real selectors and both guarded and one-sided strategies',()=>{
  const base=':where(.flow,[data-flow]) > :where(* + *) {margin-block-start:var(--spacing-content)}';
  const media=':where(.flow,[data-flow]) :where(figure) {margin-block:2rem}';
  const fake='.flow-legacy > :where(img) + * {margin-block-start:0}';
  assert.equal(analyzeFlow(base+media+fake).flowDuplicateMarginGuard,false);
  assert.equal(analyzeFlow(base).flowDuplicateMarginGuard,true);
  assert.equal(analyzeFlow(base+media+':where(.flow) > :where(figure) + * {margin-block-start:0}').flowDuplicateMarginGuard,true);
  assert.equal(analyzeFlow(base+base).flowRuleCount,2);
  const physical=analyzeFlow('.flow > * + * {margin-top:1rem}');
  assert.equal(physical.flowRuleCount,1);assert.equal(physical.verified,false);assert.equal(physical.flowDuplicateMarginGuard,false);
  assert.equal(analyzeFlow('@layer base{'+base+'}@layer components{'+base+'}').flowRuleCount,2);
  assert.equal(analyzeFlow(base+media+':not(.flow) > img + * {margin-block-start:0}').flowDuplicateMarginGuard,false);
  assert.equal(analyzeFlow(base+media+'.flow-legacy > img + *, .flow {margin-block-start:0}').flowDuplicateMarginGuard,false);
  assert.equal(analyzeFlow(base+media+'.flow > figure + .partial {margin-block-start:0}').flowDuplicateMarginGuard,false);
  assert.equal(analyzeFlow(base+'.flow > * {margin-block:2rem}').verified,false);
  assert.equal(analyzeFlow('.other:has(.flow) > * + * {margin-block-start:2rem}').verified,false);
  assert.equal(analyzeFlow('/* .flow > * + * {margin-block-start:2rem} */').verified,false);
  assert.equal(analyzeFlow('/* '+base+' */').flowRuleCount,0);
  assert.equal(analyzeFlow('@layer components {').verified,false);
});

test('data-scrolled stays paint-only: size changes keyed to the single scroll threshold are rejected', () => {
  const messages = css => inspectAuthorCSS(`@layer components { ${css} }`).map(issue => issue.message);
  for (const css of [
    '[data-sticky-header][data-scrolled] { padding-block: 0.5rem }',
    ':where([data-sticky-header][data-scrolled]) .site-nav { min-block-size: 3rem }',
    '.site-header[data-scrolled] .site-logo { height: 2rem }',
    '[data-scrolled] { font-size: 0.9rem; border-block-end-width: 0 }',
  ]) assert.ok(messages(css).some(message => message.includes('[data-scrolled] is paint-only')), css);
  assert.equal(messages('[data-scrolled] { font-size: 0.9rem; border-block-end-width: 0 }').length, 2);
  for (const css of [
    '[data-sticky-header][data-scrolled] { background: red; border-block-end-color: blue; box-shadow: none; padding-inline: 1rem }',
    '[data-sticky-header][data-compact] { padding-block: 0.5rem }',
    '[data-sticky-header][data-compact] .site-nav { min-block-size: 3rem }',
    '[data-scrolled-marker] { padding-block: 0 }',
  ]) assert.deepEqual(messages(css), [], css);
});
