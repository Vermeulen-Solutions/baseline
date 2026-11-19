import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { parseTemplate } from 'astro-eslint-parser';

const SCROLLED_SIZE_PROPERTY = /^(?:(?:padding|margin)(?:-(?:block|top|bottom)(?:-(?:start|end))?)?|gap|row-gap|font-size|line-height|(?:min-|max-)?(?:height|block-size)|border(?:-(?:top|bottom|block|block-start|block-end))?-width)$/;
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
  // The production CSS minifier folds `animation: x linear both` and `animation-timeline: view()` of one
  // rule into `animation: linear both x view()`, which browsers reject (the timeline is reset-only in the
  // shorthand): the animation name computes to none and the scroll-driven motion never runs on the
  // built site, while the unminified dev server shows it. Longhands survive minification.
  root.walkRules(rule => {
    const props = new Set();
    rule.each(node => { if (node.type === 'decl') props.add(node.prop.toLowerCase()); });
    if (props.has('animation') && props.has('animation-timeline')) add(rule, `animation shorthand with animation-timeline in one rule is folded by the minifier into a value browsers reject, so the motion never runs on the built site. Write animation-name, animation-timing-function and animation-fill-mode as longhands: ${rule.selector}`);
  });
  // The shell flips data-scrolled on a single scroll threshold. A size change keyed to it moves the
  // content below, scroll anchoring pulls scrollY back across the threshold and the state flips
  // every frame. Size belongs to [data-compact], which the shell sets with hysteresis.
  root.walkRules(/\[data-scrolled[\]=~|^\s]/, rule => {
    rule.each(node => {
      if (node.type === 'decl' && SCROLLED_SIZE_PROPERTY.test(node.prop)) add(node, `[data-scrolled] is paint-only; move ${node.prop} to [data-sticky-header][data-compact]: ${rule.selector}`);
    });
  });
  return issues;
}

/**
 * A sticky element only travels within its parent. A header nested in an element that carries
 * slot="header" sits in a wrapper exactly as tall as itself, so it can never stick. Bounded
 * source heuristic: lowercase wrapper elements only; components and <Fragment> are not inspected.
 */
export function inspectShellSlots(source, file = 'component.astro') {
  const issues = [];
  const text = source.replace(/<!--[\s\S]*?-->/g, comment => comment.replace(/[^\n]/g, ' '));
  for (const match of text.matchAll(/<([a-z][\w-]*)\b([^<>]*?\bslot\s*=\s*["']header["'][^<>]*)>/g)) {
    const [opening, name, attributes] = match;
    if (/(?<![\w-])data-sticky-header(?![\w-])/.test(attributes) || /\/\s*$/.test(attributes)) continue;
    const rest = text.slice(match.index + opening.length);
    let depth = 1, end = rest.length;
    for (const tag of rest.matchAll(new RegExp(`<(/?)${name}(?![\\w-])[^<>]*?(/?)>`, 'g'))) {
      if (tag[2]) continue;
      depth += tag[1] ? -1 : 1;
      if (depth === 0) { end = tag.index; break; }
    }
    if (/(?<![\w-])data-sticky-header(?![\w-])/.test(rest.slice(0, end))) issues.push({ file, line: text.slice(0, match.index).split('\n').length, message: `A sticky header inside <${name} slot="header"> cannot stick: the wrapper is only as tall as its content. Put slot="header" on the header or use <Fragment slot="header">.` });
  }
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
      if (filename.endsWith('.astro')) issues.push(...inspectShellSlots(source, file));
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

// Token guardrails (advisory). Agents reach for Tailwind's default vocabulary and raw values when a
// named token would do; these findings point at each one. A preceding comment containing
// "token-exempt: <reason>" (CSS) or a "token-exempt: <reason>" note on the same or previous line
// (markup) records a reviewed exception.
const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_UTILITY = '(?:bg|text|border(?:-[xytrblse])?|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|divide|placeholder|shadow|accent|caret)';
export const GUARDRAIL_CLASS_RULES = [
  { id: 'default-palette', re: new RegExp(`^${COLOR_UTILITY}-(?:${PALETTE})-\\d{2,3}(?:\\/\\d+)?$`), hint: 'Tailwind default palette; use a semantic colour (bg-surface, text-muted, border-border) or data-surface' },
  { id: 'default-palette', re: new RegExp(`^${COLOR_UTILITY}-(?:white|black)(?:\\/\\d+)?$`), hint: 'raw white/black; use a semantic colour token or data-surface' },
  { id: 'default-text-size', re: /^text-(?:xs|sm|base|lg|xl|[2-9]xl)$/, hint: 'Tailwind default type size; use text-body or text-step-*' },
  { id: 'default-radius', re: /^rounded(?:-[trblse]{1,2})?-(?:xs|sm|md|lg|xl|2xl|3xl|4xl)$/, hint: 'Tailwind default radius; use rounded-control or rounded-card' },
  { id: 'default-shadow', re: /^shadow-(?:2xs|xs|xl|2xl)$/, hint: 'Tailwind default shadow; use shadow-sm, shadow-md or shadow-lg (Baseline tokens)' },
  { id: 'numeric-spacing', re: /^(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end)-(?:[1-9]\d*(?:\.5)?|0\.5)$/, hint: 'numeric spacing multiplier; use a token utility (p-s, gap-content, py-section, gap-m)' },
  { id: 'arbitrary-value', re: /^[a-z][a-z0-9-]*-\[[^\]]+\]$|^\[[^\]]+\]$/, hint: 'arbitrary value; name it as a token or a component rule' },
  { id: 'registry-alias', re: /^(?:bg|text|border|ring|outline)-(?:background|foreground|primary(?:-foreground)?|secondary(?:-foreground)?|muted-foreground|accent(?:-foreground)?|card(?:-foreground)?|popover(?:-foreground)?|input|destructive(?:-foreground)?)$/, hint: 'registry (shadcn-style) alias vocabulary; transmute to Baseline tokens before promoting the component (src/styles/registry-aliases.css is for quarantine only)' },
];
const GAP_NAMES = new Set(['none', 'content', 'grid', 'container', 'section', 'section-m', '3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '3xs-2xs', '2xs-xs', 'xs-s', 's-m', 'm-l', 'l-xl', 'xl-2xl', '2xl-3xl', 's-l', 'l-2xl', 'xl-3xl']);
const SPACING_PROPERTY = /^(?:padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(?:-(?:block|inline|top|right|bottom|left)(?:-(?:start|end))?)?$/;
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(\s*(?!from\b)/i;
const EXEMPT = /token-exempt:\s*\S/;

/** Class names of one class attribute value or class:list expression, without variants or !. */
export function classTokens(text) {
  return String(text).split(/\s+/).filter(Boolean).map(name => name.replace(/^!|!$/g, '').split(':').pop().replace(/^-/, ''));
}

/** Advisory findings for utility classes and gap props in Astro markup. */
export function inspectMarkupGuardrails(source, file = 'component.astro') {
  const findings = [];
  const lines = String(source).split('\n');
  const exempt = index => EXEMPT.test(lines[index] || '') || EXEMPT.test(lines[index - 1] || '');
  lines.forEach((line, index) => {
    if (exempt(index)) return;
    for (const match of line.matchAll(/\bclass(?::list)?=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g)) {
      const values = match[3] !== undefined ? [...match[3].matchAll(/(["'`])((?:(?!\1).)*)\1/g)].map(m => m[2]) : [match[1] ?? match[2]];
      for (const name of values.flatMap(classTokens)) {
        const rule = GUARDRAIL_CLASS_RULES.find(candidate => candidate.re.test(name));
        if (rule) findings.push({ file, line: index + 1, rule: rule.id, message: `${name}: ${rule.hint}` });
      }
    }
    for (const match of line.matchAll(/<(Section|Container|Grid)\b[^>]*?\sgap=(?:"([^"]*)"|'([^']*)')/g)) {
      const value = (match[2] ?? match[3]).trim();
      if (value && !GAP_NAMES.has(value) && !/^var\(--(?:spacing|layout)-[a-z0-9-]+\)$/.test(value)) findings.push({ file, line: index + 1, rule: 'raw-gap', message: `<${match[1]} gap="${value}">: use a token name (content, grid, s, m …)` });
    }
  });
  return findings;
}

/** Removes var() and url() groups so fallbacks and data URIs are not read as raw values. */
function stripGroups(value) {
  let out = '', depth = 0;
  for (let i = 0; i < value.length; i++) {
    if (depth === 0 && /^(?:var|url)\(/i.test(value.slice(i, i + 4))) { depth = 1; i += value[i + 3] === '(' ? 3 : 2; continue; }
    if (depth) { if (value[i] === '(') depth++; else if (value[i] === ')') depth--; continue; }
    out += value[i];
  }
  return out;
}

/**
 * Advisory findings for raw colour, spacing and z-index values in author CSS. Spacing below 1rem
 * (16px) is the compact scale for control internals and is not reported. Custom property
 * declarations are where raw values belong (token definitions), so they are skipped, as is @theme.
 */
export function inspectCssGuardrails(css, { file = 'stylesheet.css', lineOffset = 0 } = {}) {
  const findings = [];
  let root;
  try { root = postcss.parse(css, { from: file }); } catch { return findings; }
  root.walkDecls(decl => {
    if (decl.prop.startsWith('--')) return;
    for (let node = decl.parent; node; node = node.parent) if (node.type === 'atrule' && (node.name === 'theme' || /keyframes$/.test(node.name))) return;
    const previous = decl.prev();
    if (previous?.type === 'comment' && EXEMPT.test(previous.text)) return;
    const value = stripGroups(decl.value);
    const at = { file, line: (decl.source?.start?.line || 1) + lineOffset };
    // Mask gradients use black and transparent as alpha, not as colour.
    if (!decl.prop.includes('mask') && COLOR_LITERAL.test(value)) findings.push({ ...at, rule: 'raw-color', message: `${decl.prop}: ${decl.value.slice(0, 60)}; use a colour token` });
    if (SPACING_PROPERTY.test(decl.prop)) {
      const raw = [...value.matchAll(/(?<![\w.-])(\d*\.?\d+)(px|rem)\b/g)].filter(([, number, unit]) => Number(number) >= (unit === 'px' ? 16 : 1));
      if (raw.length) findings.push({ ...at, rule: 'raw-spacing', message: `${decl.prop}: ${decl.value.slice(0, 60)}; use a spacing token (--spacing-s, --spacing-content …)` });
    }
    if (decl.prop === 'z-index' && /^-?\d+$/.test(decl.value.trim()) && decl.value.trim() !== '0') findings.push({ ...at, rule: 'raw-z-index', message: `z-index: ${decl.value}; use a layering token (--z-raised, --z-sticky …)` });
  });
  return findings;
}

// Closed token scales. A var() naming a member nobody defines is a typo or a retired name: it
// silently falls back (or resolves to Tailwind's default theme, which is not Baseline's vocabulary),
// so the component drifts from the theme without any error.
export const SCALE_TOKEN_PREFIXES = ['duration', 'ease', 'radius', 'shadow', 'z', 'focus-ring'];
// Documented site override hooks: deliberately undefined in the starter and always read with a
// fallback (docs/design-framework.md). Add a name here only together with its documentation.
export const SCALE_TOKEN_HOOKS = new Set(['--duration-normal']);
const SCALE_REFERENCE = new RegExp(String.raw`var\(\s*(--(?:${SCALE_TOKEN_PREFIXES.join('|')})-[\w-]+)`, 'g');

/** Custom property names declared anywhere in the given texts (CSS, style blocks, inline styles, scripts). */
export function definedCustomProperties(texts) {
  const names = new Set();
  for (const text of texts) {
    for (const match of String(text).matchAll(/(--[\w-]+)\s*:/g)) names.add(match[1]);
    for (const match of String(text).matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) names.add(match[1]);
  }
  return names;
}

/** Advisory findings for var() references to scale tokens (duration, ease, radius …) that are never defined. */
export function inspectTokenReferences(source, defined, { file = 'stylesheet.css' } = {}) {
  const findings = [];
  String(source).split('\n').forEach((line, index) => {
    for (const match of line.matchAll(SCALE_REFERENCE)) {
      if (!defined.has(match[1]) && !SCALE_TOKEN_HOOKS.has(match[1])) findings.push({ file, line: index + 1, rule: 'undefined-token', message: `${match[1]} is not defined in this project; use a token from the @theme scale (Tailwind's default theme is not Baseline vocabulary)` });
    }
  });
  return findings;
}

/** Advisory guardrail findings for the same source inputs check:css reads. */
export function inspectGuardrailTree(rootDir = process.cwd(), roots = ['src', 'profiles/static/project/src']) {
  const findings = [], seen = new Set();
  const sources = [];
  const visit = filename => {
    if (!fs.existsSync(filename) || seen.has(filename) || fs.lstatSync(filename).isSymbolicLink()) return;
    if (fs.statSync(filename).isDirectory()) { for (const name of fs.readdirSync(filename)) visit(path.join(filename, name)); return; }
    if (!/\.(?:astro|css)$/.test(filename)) return;
    seen.add(filename);
    const file = path.relative(rootDir, filename).replaceAll('\\', '/');
    const source = fs.readFileSync(filename, 'utf8');
    sources.push({ file, source });
    try {
      if (filename.endsWith('.astro')) findings.push(...inspectMarkupGuardrails(source, file));
      const inputs = filename.endsWith('.css') ? [{ css: source, file }] : astroStyleInputs(source, file);
      for (const input of inputs) findings.push(...inspectCssGuardrails(input.css, input));
    } catch { /* Parse errors are reported by the contract check itself. */ }
  };
  for (const dir of roots) visit(path.resolve(rootDir, dir));
  // Definitions may also live in scripts that write inline styles (--card-aspect, --vt-name …).
  const scripts = [];
  const collectScripts = filename => {
    if (!fs.existsSync(filename) || fs.lstatSync(filename).isSymbolicLink()) return;
    if (fs.statSync(filename).isDirectory()) { for (const name of fs.readdirSync(filename)) collectScripts(path.join(filename, name)); return; }
    if (/\.(?:ts|mjs|js)$/.test(filename)) scripts.push(fs.readFileSync(filename, 'utf8'));
  };
  for (const dir of roots) collectScripts(path.resolve(rootDir, dir));
  const defined = definedCustomProperties([...sources.map(item => item.source), ...scripts]);
  for (const { file, source } of sources) findings.push(...inspectTokenReferences(source, defined, { file }));
  return { files: seen.size, findings };
}
