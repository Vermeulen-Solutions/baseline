#!/usr/bin/env node
// Baseline adaptation of OpenDesign's source-only artifact lint. See docs/artifact-lint.md
// and THIRD_PARTY_NOTICES.md. No app, daemon, browser, network or artifact writes.
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import postcss from 'postcss';

const RANK = { p0: 0, p1: 1, p2: 2, none: 9 };
const FILLER = /\b(?:feature\s+(?:one|two|three|1|2|3)|lorem\s+ipsum|dolor\s+sit\s+amet|placeholder\s+text|sample\s+content)\b/i;
const METRIC = /\b(?:10[×x]\s+(?:faster|better|easier)|100[×x]\s+(?:faster|better)|99\.\d+%\s+uptime|zero[- ]downtime|3[×x]\s+more\s+(?:productive|efficient))\b/i;
const PLACEHOLDER_HOSTS = new Set(['images.unsplash.com', 'placehold.co', 'placekitten.com', 'via.placeholder.com', 'picsum.photos', 'loremflickr.com']);
const INERT = new Set(['script', 'style', 'template', 'noscript', 'code', 'pre', 'svg']);
const clip = value => value.replace(/\s+/g, ' ').trim().slice(0, 200);
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;

// Detectors return evidence, never modify source. P2 signals require judgement.
export const RULES = [
  { id: 'filler-copy', severity: 'P1', message: 'Placeholder copy appears in page content.', fix: 'Replace it with representative brief-derived copy or remove the unfinished section. Label intentional specimens in the review record.', detector: c => c.textHits(FILLER) },
  { id: 'invented-metric', severity: 'P2', message: 'A quantified claim needs source verification; this match does not establish fabrication.', fix: 'Record the real source and permitted use, or remove the claim. Do not invent replacement proof.', detector: c => c.textHits(METRIC) },
  { id: 'external-image', severity: 'P2', message: 'An image uses a stock or placeholder service; availability and permitted use need review.', fix: 'Verify the actual image/source, then prepare a durable local or CMS copy through media:prepare. Preserve approved imagery.', detector: c => c.nodes.filter(n => n.tagName === 'img').flatMap(n => {
    const sources = [attr(n, 'src'), ...(attr(n, 'srcset') ?? '').split(',').map(s => s.trim().split(/\s+/)[0])];
    return sources.some(src => { try { return PLACEHOLDER_HOSTS.has(new URL(src, 'https://artifact.invalid').hostname); } catch { return false; } }) ? [c.nodeHit(n)] : [];
  }) },
  { id: 'all-caps-no-tracking', severity: 'P2', message: 'An uppercase declaration lacks verifiable tracking of at least 0.06em in the same declaration block.', fix: 'Inspect computed tracking, inheritance and every theme. Usually use the approved tracking token around 0.08em; preserve deliberate brand typography.', detector: c => c.blocks.flatMap(b => {
    const decl = b.declarations;
    if (decl.get('text-transform')?.value.toLowerCase() !== 'uppercase') return [];
    const spacing = c.resolve(decl.get('letter-spacing')?.value ?? '');
    const em = /^([\d.]+)em$/i.exec(spacing);
    if (em && Number(em[1]) >= 0.06) return [];
    const px = /^([\d.]+)px$/i.exec(spacing), size = /^([\d.]+)px$/i.exec(c.resolve(decl.get('font-size')?.value ?? ''));
    if (px && size && Number(size[1]) > 0 && Number(px[1]) >= Number(size[1]) * 0.06) return [];
    return [{ offset: b.offset, snippet: clip(b.source) }];
  }) },
  { id: 'raw-hex', severity: 'P2', message: 'More than twelve literal hex colours occur outside custom-property declarations.', fix: 'Review semantic role mapping in all embedded styles and inline declarations. Keep canonical values in the site tokens; preserve justified SVG/asset colours.', detector: c => {
    const hits = c.blocks.flatMap(b => [...b.declarations.values()].filter(d => !d.prop.startsWith('--')).flatMap(d => {
      const value = d.value.replace(/url\([^)]*\)|"[^"]*"|'[^']*'/gi, '');
      return [...value.matchAll(/#(?:[a-f\d]{8}|[a-f\d]{6}|[a-f\d]{4}|[a-f\d]{3})\b/gi)].map(m => ({ offset: b.offset, snippet: clip(`${d.prop}: ${m[0]}`) }));
    }));
    return hits.length > 12 ? [{ ...hits[0], snippet: `${hits.length} literals; ${hits.slice(0, 6).map(h => h.snippet).join('; ')}` }] : [];
  } },
  { id: 'accent-overuse', severity: 'P2', message: 'More than six inline declarations use the action/accent colour; inspect the visible action hierarchy.', fix: 'Review each viewport and state before demoting secondary uses to text/muted roles. A source count is not a count of visible accents.', detector: c => {
    const blocks = c.blocks.filter(b => b.inline && [...b.declarations.values()].some(d => !d.prop.startsWith('--') && /var\(\s*--(?:color-action|accent)\s*[,)]/.test(d.value)));
    return blocks.length > 6 ? [{ offset: blocks[0].offset, snippet: `${blocks.length} inline blocks use the action/accent role` }] : [];
  } },
  { id: 'missing-section-anchor', severity: 'P2', message: 'An OpenDesign section lacks a comment anchor.', fix: 'For an OpenDesign artifact, add a nonempty data-od-id or data-screen-label. Ordinary HTML and Astro sections need no OpenDesign attributes.', detector: c => c.opendesign ? c.nodes.filter(n => n.tagName === 'section' && !attr(n, 'data-od-id')?.trim() && !attr(n, 'data-screen-label')?.trim()).map(n => c.nodeHit(n)) : [] },
];

/** Inspect embedded CSS/inline styles and content; external CSS, cascade and pixels are unmeasured. */
export function inspectArtifact(html, { opendesign = false } = {}) {
  const document = parse(html, { sourceCodeLocationInfo: true });
  const nodes = [], text = [], blocks = [], tokens = new Map();
  const walk = (node, inert = false) => {
    const skip = inert || INERT.has(node.tagName) || attr(node, 'hidden') !== undefined || attr(node, 'aria-hidden') === 'true';
    if (node.tagName) nodes.push(node);
    if (node.nodeName === '#text' && !skip && node.value.trim()) text.push(node);
    for (const child of node.childNodes ?? []) walk(child, skip);
  };
  walk(document);
  const addCss = (source, offset, inline = false) => {
    const css = postcss.parse(inline ? `x{${source}}` : source);
    const addBlock = container => {
      const declarations = new Map();
      for (const d of container.nodes ?? []) if (d.type === 'decl') {
        const prop = d.prop.startsWith('--') ? d.prop : d.prop.toLowerCase();
        const previous = declarations.get(prop);
        if (!previous?.important || d.important) declarations.set(prop, d);
      }
      if (!declarations.size) return;
      blocks.push({ source: container.toString(), offset: offset + (inline ? 0 : container.source.start.offset), inline, declarations });
      // Only unconditional :root/html/body defaults. Other scopes/themes stay unresolved.
      let conditional = false;
      for (let parent = container.parent; parent; parent = parent.parent) if (parent.type === 'atrule') conditional = true;
      if (!inline && !conditional && /^(?::root|html|body)$/.test(container.selector?.trim() ?? '')) {
        for (const [key, d] of declarations) if (key.startsWith('--')) tokens.set(key, d.value);
      }
    };
    css.walkRules(addBlock);
    // @theme token blocks also supply canonical defaults for source-only resolution.
    css.walkAtRules('theme', rule => { for (const d of rule.nodes ?? []) if (d.type === 'decl' && d.prop.startsWith('--')) tokens.set(d.prop, d.value); });
  };
  for (const node of nodes) {
    if (node.tagName === 'style') addCss((node.childNodes ?? []).map(n => n.value ?? '').join(''), node.sourceCodeLocation.startTag.endOffset);
    if (attr(node, 'style') !== undefined) addCss(attr(node, 'style'), node.sourceCodeLocation.attrs.style.startOffset, true);
  }
  const context = {
    nodes, blocks, opendesign,
    textHits: pattern => text.flatMap(n => { const match = pattern.exec(n.value); return match ? [{ offset: n.sourceCodeLocation.startOffset, snippet: clip(n.value) }] : []; }),
    nodeHit: n => ({ offset: n.sourceCodeLocation.startOffset, snippet: clip(html.slice(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.startTag.endOffset)) }),
    resolve: value => {
      let out = value;
      for (let i = 0; i < 8; i++) {
        const next = out.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (full, name, fallback) => tokens.get(name) ?? fallback ?? full);
        if (next === out) break;
        out = next;
      }
      return out.trim();
    },
  };
  return RULES.flatMap(rule => rule.detector(context).map(hit => ({ id: rule.id, severity: rule.severity, line: html.slice(0, hit.offset).split('\n').length, snippet: hit.snippet, message: rule.message, fix: rule.fix }))).sort((a, b) => a.line - b.line || a.id.localeCompare(b.id));
}

export const summarize = findings => Object.fromEntries(['p0', 'p1', 'p2'].map(s => [s, findings.filter(f => f.severity.toLowerCase() === s).length]));
export const exceedsThreshold = (findings, failOn) => failOn !== 'none' && findings.some(f => RANK[f.severity.toLowerCase()] <= RANK[failOn]);
export function renderAgentMessage(findings) {
  if (!findings.length) return '';
  return ['<artifact-lint>', 'Review these source signals; correct confirmed defects in the current artifact and verify its rendered result.', ...findings.map(f => `[${f.severity}] ${f.id} (line ${f.line}): ${f.message}\n  Fix: ${f.fix}\n  Evidence: ${f.snippet}`), '</artifact-lint>'].join('\n');
}

export function parseArgs(argv) {
  const out = { files: [], failOn: 'p1', json: false, opendesign: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--json') out.json = true;
    else if (flag === '--opendesign') out.opendesign = true;
    else if (flag === '--agent-message') out.agentMessage = true;
    else if (flag === '--fail-on') { out.failOn = argv[++i]?.toLowerCase(); if (!Object.hasOwn(RANK, out.failOn)) throw Error('--fail-on must be p0, p1, p2 or none'); }
    else if (flag.startsWith('-') && flag !== '-') throw Error(`Unknown option: ${flag}`);
    else out.files.push(flag);
  }
  if (out.files.includes('-') && out.files.length > 1) throw Error('Stdin must be the only input');
  if (!out.files.length) out.files.push('audit/visual-concepts');
  return out;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: design:artifact-check -- [file.html|directory|- ...] [--fail-on p0|p1|p2|none] [--json] [--agent-message] [--opendesign]\nDefault: audit/visual-concepts, recursively. Source-only checks; no scripts executed or external assets fetched. Exit: 0 below threshold, 1 findings, 2 input/error.');
    return;
  }
  const files = new Set();
  const collect = target => {
    if (target === '-') { files.add('-'); return; }
    const stat = lstatSync(target);
    if (stat.isSymbolicLink()) throw Error(`Symlink input is unsupported: ${target}`);
    if (stat.isDirectory()) for (const name of readdirSync(target).sort()) collect(path.join(target, name));
    else if (/\.html?$/i.test(target)) files.add(path.resolve(target));
  };
  options.files.forEach(collect);
  if (!files.size) throw Error('No .html/.htm artifacts found');
  const results = [...files].sort().map(file => {
    const source = readFileSync(file === '-' ? 0 : file, 'utf8');
    if (!source.trim()) throw Error(`Empty artifact: ${file}`);
    const findings = inspectArtifact(source, options);
    return { file: file === '-' ? 'stdin' : file, counts: summarize(findings), findings, agentMessage: renderAgentMessage(findings) };
  });
  const findings = results.flatMap(r => r.findings), ok = !exceedsThreshold(findings, options.failOn);
  const report = { ok, failOn: options.failOn, coverage: 'source-only: embedded CSS, inline styles and HTML content; no external assets, cascade, contrast or clipping measurement', counts: summarize(findings), results };
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Artifact preflight: ${results.length} file(s), ${findings.length} finding(s), failing at ${options.failOn}.\n${report.coverage}`);
    for (const result of results) {
      console.log(`\n${result.file}`);
      for (const f of result.findings) console.log(`${f.severity} ${f.id} (line ${f.line}): ${f.message}\n  ${f.snippet}\n  Fix: ${f.fix}`);
      if (options.agentMessage && result.agentMessage) console.log(result.agentMessage);
    }
  }
  if (!ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(`design:artifact-check: ${error.message}`); process.exitCode = 2; }
}
