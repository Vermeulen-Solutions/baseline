// Research prototype for issue #29. Read-only; deliberately outside shipped checks.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseTemplate } from 'astro-eslint-parser';
import postcss from 'postcss';
import { parse } from 'parse5';

const colorProperty = /(?:color|background|border|outline|shadow|fill|stroke)/i;
const hex = /#[\da-f]{3,8}(?![\w-])/gi;
const literal = attribute => attribute?.value?.type === 'Literal' ? attribute.value.value : undefined;
const positive = value => /^(?:\d+\.?\d*|\.\d+)$/.test(String(value)) && Number(value) > 0;

// This bounded experiment excludes strings and URLs; it is not a CSS value grammar.
const hasHex = value => [...String(value).replace(/url\([^)]*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gi, '').matchAll(hex)]
  .some(match => [4, 5, 7, 9].includes(match[0].length));

function declarations(css, emit) {
  postcss.parse(css).walkDecls(decl => {
    if (colorProperty.test(decl.prop) && hasHex(decl.value)) emit(decl);
  });
}

export function inspectAstro(source, file = 'input.astro') {
  const findings = [];
  const add = (offset, rule, message, severity = 'warning') => findings.push({
    file, line: source.slice(0, offset).split('\n').length, rule, severity, message,
  });
  try {
    const parsed = parseTemplate(source);
    parsed.walk(parsed.result.ast, node => {
      if (node.type !== 'JSXElement') return;
      const opening = node.openingElement, name = opening.name?.name;
      const attrs = new Map(opening.attributes.filter(attr => attr.type === 'JSXAttribute').map(attr => [attr.name.name, attr]));
      const spread = opening.attributes.some(attr => attr.type === 'JSXSpreadAttribute');
      if (name === 'style' && node.closingElement) {
        const start = opening.end;
        declarations(source.slice(start, node.closingElement.start), decl => {
          add(start + decl.source.start.offset, 'literal-color', 'Literal color in component CSS; review its semantic token role.');
        });
      }
      for (const key of ['style', 'fill', 'stroke', 'color', 'class']) {
        const attr = attrs.get(key), value = literal(attr);
        if (value === undefined) {
          if (attr) add(attr.start, 'dynamic-value', `Cannot resolve ${key} without rendering.`, 'deferred');
          continue;
        }
        if (key === 'style') declarations(`x{${value}}`, () => add(attr.start, 'literal-color', 'Literal inline color; review its semantic token role.'));
        else if (key === 'class' ? /\[[^\]]*#[\da-f]{3,8}\]/i.test(String(value)) : hasHex(value)) {
          add(attr.start, 'literal-color', `Literal color in ${key}; review its semantic token role.`);
        }
      }
      if (name !== 'img') return; // Astro Image/ResponsiveImage dimensions require rendered output.
      const width = attrs.get('width'), height = attrs.get('height'), style = attrs.get('style');
      if (spread || [width, height, style].some(attr => attr && literal(attr) === undefined)) {
        add(opening.start, 'image-dimensions', 'Dynamic image sizing requires rendered verification.', 'deferred');
      } else {
        const ratio = String(literal(style) ?? '').match(/(?:^|;)\s*aspect-ratio\s*:\s*([\d.]+)(?:\s*\/\s*([\d.]+))?\s*(?:;|$)/i);
        if (!(positive(literal(width)) && positive(literal(height))) && !(ratio && positive(ratio[1]) && positive(ratio[2] ?? 1))) {
          add(opening.start, 'image-dimensions', 'Native img lacks positive literal width/height or a positive inline aspect-ratio.');
        }
      }
    });
  } catch (error) {
    findings.push({ file, line: error.lineNumber ?? error.line ?? 1, rule: 'parse', severity: 'error', message: error.message });
  }
  return findings;
}

// Use complete rendered HTML, never the order of headings in an Astro fragment.
// Browser visibility, slots, CSS order and interactive states remain outside this scan.
export function inspectHeadingOutline(html, file = 'rendered.html') {
  const findings = [];
  let previous = 0;
  const walk = node => {
    if (/^h[1-6]$/.test(node.tagName ?? '')) {
      const level = Number(node.tagName[1]);
      if (previous && level > previous + 1) findings.push({ file, line: node.sourceCodeLocation?.startLine ?? 1,
        rule: 'heading-order', severity: 'warning', message: `Rendered outline jumps from h${previous} to h${level}.` });
      previous = level;
    }
    for (const child of node.childNodes ?? []) walk(child);
  };
  walk(parse(html, { sourceCodeLocationInfo: true }));
  return findings;
}

export function scanFiles(inputs) {
  const started = performance.now(), findings = [], files = [];
  const visit = input => {
    const stat = fs.lstatSync(input);
    if (stat.isSymbolicLink()) throw new Error(`Refusing linked input: ${input}`);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(input).sort()) {
        if (!['node_modules', 'dist', '.git', '.astro'].includes(name)) visit(path.join(input, name));
      }
    } else if (/\.(?:astro|html)$/.test(input)) {
      const source = fs.readFileSync(input, 'utf8');
      files.push(input);
      findings.push(...(input.endsWith('.astro') ? inspectAstro(source, input) : inspectHeadingOutline(source, input)));
    }
  };
  for (const input of inputs) visit(input);
  return { prototype: true, files: files.length, elapsedMs: Number((performance.now() - started).toFixed(2)), findings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const inputs = process.argv.slice(2);
  if (!inputs.length) throw new Error('Pass explicit .astro/.html files or source directories. No files are modified.');
  const report = scanFiles(inputs);
  console.log(JSON.stringify(report, null, 2));
  // Warnings are research observations; only parse failures block the prototype.
  if (report.findings.some(finding => finding.severity === 'error')) process.exitCode = 1;
}
