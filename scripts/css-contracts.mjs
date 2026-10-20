import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { parseTemplate } from 'astro-eslint-parser';

export const LAYER_ORDER = 'theme, base, vendor, astro, components, utilities';

export function astroStyleInputs(source, file = 'component.astro') {
  const parsed = parseTemplate(source);
  const inputs = [];
  parsed.walk(parsed.result.ast, node => {
    if (node.type === 'JSXElement' && node.openingElement.name?.name === 'style' && node.closingElement) {
      const start = node.openingElement.end;
      inputs.push({ css: source.slice(start, node.closingElement.start), lineOffset: source.slice(0,start).split('\n').length - 1, file });
    }
  });
  return inputs;
}

export function inspectAuthorCSS(css, { file = 'stylesheet.css', lineOffset = 0 } = {}) {
  const issues = [];
  let root;
  const add = (node, message) => issues.push({ file, line: (node?.source?.start?.line || 1) + lineOffset, message });
  try { root = postcss.parse(css, { from:file }); }
  catch (error) { return [{ file, line:(error.line || 1) + lineOffset, message:error.reason || error.message }]; }
  root.walkAtRules('layer', node => {
    if (node.nodes && !node.params.trim()) add(node,'Anonymous author layers are not allowed. Use base or components.');
  });
  root.walkRules(rule => {
    const layers = [];
    for (let node = rule.parent; node; node = node.parent) {
      if (node.type !== 'atrule') continue;
      if (/^(?:-\w+-)?keyframes$/.test(node.name) || node.name === 'theme') return;
      if (node.name === 'layer') layers.unshift(node.params.trim());
    }
    const outer = layers[0]?.split('.')[0];
    if (!['base','components'].includes(outer) || layers.some(x=>!x)) add(rule,`Author selector must belong to base or components: ${rule.selector}`);
  });
  return issues;
}

export function inspectSourceTree(rootDir = process.cwd(), roots = ['src','profiles/static/project/src']) {
  const issues = [], files = new Set();
  const visit = filename => {
    if (!fs.existsSync(filename)) return;
    if (fs.lstatSync(filename).isSymbolicLink()) { issues.push({file:filename,line:1,message:'Linked source inputs require explicit review.'}); return; }
    if (fs.statSync(filename).isDirectory()) { for (const name of fs.readdirSync(filename)) visit(path.join(filename,name)); return; }
    if (!/\.(?:astro|css)$/.test(filename) || files.has(filename)) return;
    files.add(filename);
    const file = path.relative(rootDir,filename).replaceAll('\\','/');
    const source = fs.readFileSync(filename,'utf8');
    try {
      const inputs = filename.endsWith('.css') ? [{css:source,file}] : astroStyleInputs(source,file);
      for (const input of inputs) {
        issues.push(...inspectAuthorCSS(input.css,input));
        postcss.parse(input.css).walkAtRules('import',rule=>{
          const imported = rule.params.match(/^(?:url\(\s*)?["']([^"']+)["']/)?.[1];
          if (imported?.startsWith('.')) visit(path.resolve(path.dirname(filename),imported));
        });
      }
    } catch(error) { issues.push({file,line:error.lineNumber || 1,message:error.message}); }
  };
  for (const dir of roots) visit(path.resolve(rootDir,dir));
  return { files:files.size, issues };
}

export function analyzeFlow(css) {
  let root;
  try { root = postcss.parse(css); } catch { return { verified:false, flowRuleCount:0, flowDuplicateMarginGuard:false }; }
  let count=0, guard=false, twoSided=false, bases=0;
  root.walkRules(rule=>{
    let ast;
    try { ast=selectorParser().astSync(rule.selector); } catch { return; }
    let flow=false, adjacent=false, child=false, universal=0, tags=0, hidden=0;
    ast.walkClasses(n=>{if(n.value==='flow')flow=true;});
    ast.walkAttributes(n=>{if(n.attribute==='data-flow')flow=true;if(n.attribute==='hidden')hidden++;});
    if(!flow)return;
    ast.walkCombinators(n=>{if(n.value.trim()==='>')child=true;if(['+','~'].includes(n.value.trim()))adjacent=true;});
    ast.walkUniversals(()=>universal++);ast.walkTags(()=>tags++);
    const declarations=(rule.nodes || []).filter(n=>n.type==='decl');
    const hasStart=declarations.some(n=>n.prop==='margin-block-start');
    if(child && adjacent && tags===0 && (universal>=2 || hidden>=2) && hasStart) count++;
    if(child && adjacent && tags>0 && declarations.some(n=>n.prop==='margin-block-start' && /^0(?:px|rem|em)?$/.test(n.value.trim())))guard=true;
    if(child && adjacent && declarations.some(n=>n.prop==='margin-block-end' && /^0(?:px|rem|em)?$/.test(n.value.trim())))guard=true;
    if(declarations.some(n=>['margin-block','margin-block-end','margin'].includes(n.prop) && !/^0(?:px)?$/.test(n.value.trim())))twoSided=true;
    if(rule.selector.trim()==='.flow')bases++;
  });
  if(bases>1)count=Math.max(2,count);
  return { verified:true, flowRuleCount:count, flowDuplicateMarginGuard:guard || (!twoSided && count===1) };
}
