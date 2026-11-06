// Evidence-only reconstruction helper. Writes authored MCP fences, never native .bl/.ds files.
// This deliberately preserves measured source geometry as fixed frames. It is not
// an automatic responsive layout or a claim about design authoring from a brief.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(await fs.readFile(path.join(root, 'source-sample-1440.json'), 'utf8'));
const roles = Object.fromEntries(Object.entries(sample.roles).filter(([key]) => key.startsWith('--color-')).map(([key, value]) => [key.slice(8), value.srgb]));
roles.white = '#ffffff';
roles.black = '#000000';
roles.headlineEnd = JSON.parse(await fs.readFile(path.join(root, 'extra-colors.json'), 'utf8')).headlineEnd;
const num = value => Number(value.toFixed(3));
const q = JSON.stringify;
const sampled = new Map();
function token(kind, value) {
  const key = `sample.${kind}.v${String(num(value)).replace('-', 'minus').replace('.', '_')}`;
  sampled.set(key, num(value));
  return '$' + key;
}
const opacity = value => token('opacity', value);
const hex = rgba => '#' + rgba.slice(0, 3).map(value => value.toString(16).padStart(2, '0')).join('');
function paint(rgba) {
  const color = hex(rgba), role = Object.entries(roles).find(([, value]) => value.toLowerCase() === color)?.[0];
  const key = role ?? 'sample' + color.slice(1);
  if (!role) roles[key] = color;
  const ref = '$color.' + key;
  return rgba[3] === 255 ? ref : `solid(${ref},o(${opacity(rgba[3] / 255)}))`;
}
function weight(value) { return '$font.weight.w' + value; }
const weights = new Set([400, 500, 600, 650, 700]);
const font = style => style.fontFamily === 'mono' ? '$font.family.mono' : '$font.family.sans';
const name = node => q(node.name.slice(0, 100));
const lines = [];
function line(depth, value) { lines.push('  '.repeat(depth) + value); }

function gridSvg(w, h) {
  const segments = [];
  for (let x = 0; x <= w; x += 60) segments.push(`M${x} 0V${h}`);
  for (let y = 0; y <= h; y += 60) segments.push(`M0 ${y}H${w}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${segments.join('')}" fill="none" stroke="white" stroke-opacity="0.035" stroke-width="1"/></svg>`;
}

function emit(node, depth, isRoot = false) {
  const s = node.style;
  weights.add(s.weight);
  const isGlow = node.name.startsWith('glow ');
  let fills = s.background[3] ? [paint(s.background)] : [];
  if (isRoot) fills = ['$color.page'];
  if (isGlow) {
    const color = node.name.includes('--a') ? '$color.action' : '$color.secondary';
    fills = [`radial(solid(${color},o(${opacity(node.name.includes('--a') ? 0.14 : 0.12)})),stop(solid(${color},o(${opacity(0)})),0.62))`];
  }
  if (node.name === 'specimen__shell') fills.push(`radial(cx(80),cy(0),rx(120),ry(120),solid($color.action,o(${opacity(0.1)})),stop(solid($color.action,o(${opacity(0)})),0.55))`);
  if (s.blur && fills.length) fills.push('blur(' + s.blur + ')');
  const size = isRoot ? [Math.round(node.w), sample.width === Math.round(node.w) ? 4459 : 6497] : [num(node.w), num(node.h)];
  let props = `fr${isRoot ? '' : ` p(${num(node.x)},${num(node.y)})`} s(${size}) f[${fills.map(value => '(' + value + ')').join(',')}]`;
  if (isRoot) props += ' clip';
  if (s.radii.some(Boolean)) props += ` rd(${s.radii.map(v => token('radius', v)).join(',')})`;
  const border = s.borders.find(b => b.width > 0);
  if (border) props += ` st[(${paint(border.color)},w(${s.borders.map(b => token('stroke', b.width)).join(',')}),pos(i))]`;
  if (s.overflow === 'hidden') props += ' clip';
  if (s.opacity !== 1) props += ` o(${opacity(s.opacity)})`;
  if (isGlow) props += ' eblur(120)';
  if (node.name === 'shell') props += ` shadow($color.black,o(${opacity(0.9)}),y(40),blur(120),sp(-40))`;
  if (node.name.includes('button--action')) props += ` shadow($color.action,o(${opacity(0.28)}),blur(34))`;
  if (node.name === 'cursor-tag') props += ` shadow($color.action,o(${opacity(0.55)}),y(18),blur(40),sp(-12))`;
  if (node.name === 'receipt') props += ` shadow($color.black,o(${opacity(0.55)}),y(30),blur(80),sp(-40))`;
  line(depth, `${props} ${name(node)} #${node.ref}`);
  if (node.name === 'shell') line(depth + 1, `svg(${gridSvg(num(node.w), num(node.h))}) p(0,0) s(${num(node.w)},${num(node.h)}) "60px source grid" #${node.ref}-grid`);
  if (node.textBlock) emitText(node, depth + 1);
  for (const child of node.children) emit(child, depth + 1);
}

function emitText(node, depth) {
  const s = node.style;
  const [pt, pr, pb, pl] = s.padding;
  const [bt, br, bb, bl] = s.borders.map(b => b.width);
  const x = pl + bl, y = pt + bt;
  const w = node.w - x - pr - br;
  const h = node.h - y - pb - bb;
  const center = /brand__mark|step__num/.test(node.name);
  // Token-bound tracking is em-like in Brilliant; bare ls(N) is pixels.
  const extras = [`lh(${token('leading', s.lineHeight)})`, `ls(${token('tracking', s.letterSpacing / s.fontSize)})`];
  if (s.italic) extras.push('italic');
  if (center || s.textAlign === 'center') extras.push('align(c)');
  if (center) extras.push('valign(c)');
  if (s.textAlign === 'right') extras.push('align(r)');
  if (s.textTransform === 'uppercase') extras.push('case(upper)');
  const text = node.textBlock.text;
  const intrinsic = !center && !text.includes('\n') && (s.display.startsWith('inline') || node.href || node.h <= s.lineHeight * s.fontSize + 2);
  line(depth, `t(${q(text)},${font(s)},${token('type', s.fontSize)},${weight(s.weight)},${extras.join(',')}) p(${num(x)},${num(y)}) s(${intrinsic ? 'hug' : num(w)},${center ? num(h) : 'hug'}) f[(${paint(s.color)})] ${q(node.name + ' copy')} #${node.ref}-text`);
  const spans = [];
  const occurrences = new Map();
  for (const run of node.textBlock.runs) {
    const value = text.slice(run.start, run.end), rs = run.style;
    const mods = [];
    if (rs.weight !== s.weight) { weights.add(rs.weight); mods.push('w(' + weight(rs.weight) + ')'); }
    if (rs.italic !== s.italic) mods.push(rs.italic ? 'i' : '-i');
    if (rs.fontFamily !== s.fontFamily) mods.push('f(' + font(rs) + ')');
    if (JSON.stringify(rs.color) !== JSON.stringify(s.color)) mods.push(paint(rs.color));
    if (node.tag === 'h1' && rs.italic) {
      const p = mods.findIndex(m => m.startsWith('$color.') || m.startsWith('#'));
      if (p >= 0) mods.splice(p, 1);
      mods.push('linear(100,stop($color.action,0),stop($color.headlineEnd,0.72))');
    }
    if (!mods.length || !value) continue;
    const before = text.slice(0, run.start);
    const index = before.split(value).length - 1;
    const key = value + ':' + index;
    if (occurrences.has(key)) continue;
    occurrences.set(key, true);
    spans.push(`(${q(value)},${index},${mods.join(',')})`);
  }
  if (node.href) spans.push(`(${q(text)},link(${q(node.href)}))`);
  if (spans.length) line(depth + 1, 'spans[' + spans.join(',') + ']');
}

for (const width of [1440, 390]) {
  const tree = JSON.parse(await fs.readFile(path.join(root, `native-source-tree-${width}.json`), 'utf8'));
  lines.push('```bl', 'file("Native reconstruction.bl")', `// source reconstruction ${width}`);
  emit(tree, 0, true);
  lines.push('```');
}
function dsColor(value) {
  if (!value.startsWith('rgba(')) return value;
  const [r, g, b, a] = value.match(/[\d.]+/g).map(Number);
  // Brilliant's eight-digit native colour order is AARRGGBB, unlike CSS.
  return '#' + [Math.round(a * 255), r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
}
const ds = ['```ds', 'file("Styles/default.ds")', ...Object.entries(roles).map(([key, value]) => `color.${key}: ${dsColor(value)}`), 'font.family.sans: "Segoe UI Variable"', 'font.family.mono: "Cascadia Mono"', ...[...weights].sort((a, b) => a - b).map(value => `font.weight.w${value}: ${value}`), ...[...sampled].map(([key, value]) => `${key}: ${value}`), '```'].join('\n');
await fs.writeFile(path.join(root, 'native-design-system.txt'), ds + '\n');
await fs.writeFile(path.join(root, 'native-authoring.txt'), lines.join('\n') + '\n');
console.log(JSON.stringify({rows: lines.length, weights: [...weights], roles: Object.keys(roles)}));
