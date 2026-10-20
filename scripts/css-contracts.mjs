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
          if (imported?.startsWith('.')) {
            const target=path.resolve(path.dirname(filename),imported);
            if(!fs.existsSync(target))issues.push({file,line:(rule.source.start.line)+(input.lineOffset || 0),message:'Missing local author import: '+imported});
            else visit(target);
          }
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
  let count=0, twoSided=false, unknownEdges=false;
  const requiredMedia=new Set(), guardedMedia=new Set();
  root.walkRules(rule=>{
    let ast;
    try { ast=selectorParser().astSync(rule.selector); } catch { return; }
    const declarations=(rule.nodes || []).filter(n=>n.type==='decl');
    let generic=false, ownsFlow=false;
    const ownedMedia=new Set();
    for(const selector of ast.nodes) {
      const tokens=[];
      const collect=node=>{
        if(node.type==='pseudo' && [':not',':has'].includes(node.value))return;
        if(node.nodes)node.nodes.forEach(collect);else tokens.push(node);
      };
      collect(selector);
      const anchor=tokens.findIndex(n=>n.type==='class' && n.value==='flow' || n.type==='attribute' && n.attribute==='data-flow');
      const child=tokens.findIndex((n,i)=>i>anchor && n.type==='combinator' && n.value.trim()==='>');
      if(anchor<0)continue;
      // A class on the target or inside :not/:has is not a flow-owning ancestor.
      if(tokens.slice(0,anchor).some(n=>n.type==='combinator' && ['>','+','~'].includes(n.value.trim())))continue;
      ownsFlow=true;
      tokens.filter(n=>n.type==='tag' && ['img','figure','table','blockquote'].includes(n.value)).forEach(n=>ownedMedia.add(n.value));
      const adjacent=tokens.findIndex((n,i)=>i>child && n.type==='combinator' && ['+','~'].includes(n.value.trim()));
      if(child<0 || adjacent<0)continue;
      let hidden=0;selector.walkAttributes(n=>{if(n.attribute==='hidden')hidden++;});
      const universal=tokens.filter(n=>n.type==='universal').length;
      const tags=tokens.filter(n=>n.type==='tag');
      if(tags.length===0 && (universal>=2 || hidden>=2) && declarations.some(n=>['margin-block-start','margin-top'].includes(n.prop))) {
        generic=true;
        // Count historical physical-margin definitions for drift diagnostics,
        // but do not certify their writing-mode/edge behavior as logical flow.
        if(declarations.some(n=>n.prop==='margin-top'))unknownEdges=true;
      }
      const media=tokens.slice(child+1,adjacent).filter(n=>n.type==='tag' && ['img','figure','table','blockquote'].includes(n.value));
      if(tokens.slice(adjacent+1).some(n=>n.type==='universal') && declarations.some(n=>['margin-block-start','margin-block-end'].includes(n.prop) && /^0(?:px|rem|em)?$/.test(n.value.trim())))media.forEach(n=>guardedMedia.add(n.value));
    }
    if(generic)count++;
    if(ownsFlow && declarations.some(n=>['margin-block','margin-block-end','margin'].includes(n.prop) && !/^0(?:px)?$/.test(n.value.trim()))) {
      twoSided=true;if(!ownedMedia.size)unknownEdges=true;
      ownedMedia.forEach(tag=>requiredMedia.add(tag));
    }
  });
  const guard=twoSided && !unknownEdges && [...requiredMedia].every(tag=>guardedMedia.has(tag));
  return { verified:count>0 && !unknownEdges, flowRuleCount:count, flowDuplicateMarginGuard:!unknownEdges && (guard || (!twoSided && count===1)) };
}
