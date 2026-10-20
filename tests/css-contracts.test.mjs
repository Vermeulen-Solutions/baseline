import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectAuthorCSS, inspectSourceTree, astroStyleInputs, analyzeFlow } from '../scripts/css-contracts.mjs';

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
