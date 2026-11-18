#!/usr/bin/env node
// Rendered UI audit for padding, hover, focus and page health (found in a real-site rehearsal:
// padding defects that only appear on hover reached production twice).
//
//   npm run audit:ui -- --base http://127.0.0.1:4321 --sitemap --out ../evidence/ui-audit.json
//   npm run audit:ui -- --base https://preview.example.workers.dev --routes /,/contact --widths 1440
//
// For every route and width it reports:
// - edge-at-rest: a boxed element (border on three sides, a background, or a shadow with a border)
//   whose own text comes within --edge px of its edge (--badge px for compact tags under 36px tall);
// - edge-on-hover: the same check after hovering each element matched by a :hover rule (at the
//   widest width only), so a hover border or glow around unpadded content is caught;
// - focus-invisible: a control reached with Tab that shows no outline, ring or underline on itself
//   or on one of its six nearest ancestors (cards that outline with :has(:focus-visible) count as visible);
// - text-offscreen / text-squeezed: text whose box leaves the viewport, or a column narrowed to a
//   few characters per line. Measured on the elements themselves, because a shell that clips
//   (overflow-x: clip or hidden) reports no document overflow while headings and buttons are cut off;
// - large-text-offscreen / large-text-squeezed: the same two checks at widths up to 500px with
//   enlarged text, as phone users set it: a larger root size (root:1.6, root:2) and text-only
//   scaling where boxes keep their size (text:1.5, text:2). Change with --text-scale, or "off".
//   Found on a real site: 20 of 20 cases failed while every normal-size check passed;
// - large-text-header-wrapped: with enlarged text the links and buttons of the page header sit on
//   more rows than at the normal size. Letting header controls wrap keeps them on screen, so the
//   off-screen check passes, but a header that folds onto two rows is a defect on a phone (found
//   on a real site after its other enlarged-text checks were all green);
// - low-contrast (only with --contrast): text whose computed colour against the composited solid
//   backgrounds behind it is under 4.5:1 (3:1 for large text). It catches a cascade slip that
//   token-pair checks cannot see. Text over images, gradients or pseudo-element grounds is skipped;
// - hover-low-contrast (only with --contrast): the same measurement on every hovered element and
//   its descendants, for text that was readable at rest. Found on a real site: a link that turned
//   yellow on a white card passed every rest-state check;
// - image-clipped: an image whose box is over 15% larger than the nearest clipping frame around
//   it, so only part of the picture shows. Found on a real site: portraits cut to the top of the
//   head by a leftover min-height after a restyle. object-fit crops are measured separately:
// - image-cover-cropped: a photograph shown with object-fit: cover whose frame hides more than
//   --crop percent (15) of it on one side, worked out from its natural size, its box and
//   object-position. Found on a real site: a fixed-height frame hid the top 27% of group photos
//   on tablets. Images meant to be cropped (backgrounds, textures) take data-audit-crop-ok;
// - decoration-overlap: a ::before/::after border, outline or glyph that reaches outside its host
//   and comes within 4px of text or a control outside it. Found on a real site: a dashed outline
//   drawn with a negative inset ran into the buttons above its figure at tablet widths only;
// - empty-band (at widths of 1024px and up): a gap between the content of two consecutive blocks of
//   <main> on the same ground with no rule between them that is clearly above one section step, as
//   when the end padding of one section stacks on the start padding of the next. The limit is 1.5
//   times the page's own resolved --spacing-section (a same-ground join pays one step), or 160px
//   on a page without that token; --band <px> sets a fixed limit instead;
// - overflow-x, broken-image, http, console-error and failed-request.
// --open-details opens every closed <details> outside the header and navigation before measuring, so
// folded content (accordions, phone folds) is checked too. Run one pass with it at phone widths.
// --widths auto adds one width on each side of the breakpoints in the site's stylesheets (read
// from the first five routes) to the given or default widths. Found on a real site: two defects
// lived only between about 600 and 990px, where no default width looked.
// Exit 0 = clean, 2 = issues, 1 = error. Read-only: it never submits forms or clicks links.
// Progress goes to stderr, one line per route and width, and --out is rewritten after every route
// ("partial": true until the run completes), so an interrupted run keeps what it measured. With the
// default enlarged-text cases a phone width takes about half a minute per route: where a time
// limit applies, audit about ten routes per run.
// Git Bash on Windows rewrites a lone "/" route: set MSYS_NO_PATHCONV=1.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative } from './capture-routes.mjs';

export const DEFAULT_WIDTHS = [390, 768, 1440];

export const DEFAULT_TEXT_SCALE = 'root:1.6,root:2,text:1.5,text:2';

// "root:1.6,text:2" -> [{ kind: 'root', factor: 1.6 }, { kind: 'text', factor: 2 }]; "off" -> [].
export function parseTextScale(value) {
  if (value === 'off') return [];
  return String(value).split(',').map(part => {
    const [kind, raw] = part.trim().split(':'), factor = Number(raw);
    if (!['root', 'text'].includes(kind) || !Number.isFinite(factor) || factor <= 1 || factor > 4) throw Error(`--text-scale takes "off" or a list such as ${DEFAULT_TEXT_SCALE} (factors above 1, up to 4); got "${part}"`);
    return { kind, factor };
  });
}

// Breakpoint edges in the media queries of a page: for each, the first width at which the wider
// layout applies (min-width: 768px and max-width: 767px both give 768). em and rem count as 16px,
// as media queries do. Returns [{ edge, count }] sorted by edge; print-only queries are skipped.
export function parseBreakpoints(mediaTexts) {
  const edges = new Map(), px = (n, unit) => Number(n) * (unit === 'px' ? 1 : 16);
  const add = edge => { if (Number.isFinite(edge) && edge > 200 && edge <= 3840) edges.set(edge, (edges.get(edge) ?? 0) + 1); };
  // width >= v and width > v (and their mirrors) start the wider side at v; <= and < end the narrower one there.
  const edgeOf = (op, v) => op === '>=' || op === '<' ? Math.ceil(v) : Math.floor(v) + 1;
  const flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
  for (const text of mediaTexts) for (const query of String(text).split(',')) {
    if (/\bprint\b/.test(query) && !/\bnot\s+print\b/.test(query)) continue;
    for (const m of query.matchAll(/(min|max)-width\s*:\s*([\d.]+)(px|r?em)\b/g)) add(edgeOf(m[1] === 'min' ? '>=' : '<=', px(m[2], m[3])));
    for (const m of query.matchAll(/(?<![-\w])width\s*(<=|>=|<|>)\s*([\d.]+)(px|r?em)\b/g)) add(edgeOf(m[1], px(m[2], m[3])));
    for (const m of query.matchAll(/([\d.]+)(px|r?em)\s*(<=|>=|<|>)\s*width(?![-\w])/g)) add(edgeOf(flip[m[3]], px(m[1], m[2])));
  }
  return [...edges].map(([edge, count]) => ({ edge, count })).sort((a, b) => a.edge - b.edge);
}

// The widths for --widths auto: the given widths plus one width on each side of the most used
// breakpoints (at most `max`; edges closer than `merge` px count as one).
export function autoWidths(base, edges, { max = 6, merge = 24 } = {}) {
  const chosen = [];
  for (const { edge } of [...edges].sort((a, b) => b.count - a.count || a.edge - b.edge)) {
    if (chosen.length >= max) break;
    if (!chosen.some(e => Math.abs(e - edge) < merge)) chosen.push(edge);
  }
  const widths = new Set(base);
  for (const edge of chosen) { widths.add(edge - 1); widths.add(edge); }
  return { widths: [...widths].filter(w => w >= 200 && w <= 3840).sort((a, b) => a - b), edges: chosen.sort((a, b) => a - b) };
}

// The offsets, in px, of an image's left and top edges inside its box for a computed
// object-position, where freeX/freeY are the box size minus the displayed image size.
export function objectPosition(value, freeX, freeY) {
  const tokens = String(value).trim().match(/calc\((?:[^()]|\([^()]*\))*\)|\S+/g) ?? [];
  const keyword = { left: ['x', 0], right: ['x', 100], top: ['y', 0], bottom: ['y', 100], center: [null, 50] };
  const length = (t, free) => t.endsWith('%') ? free * parseFloat(t) / 100 : /^-?[\d.]+px$/.test(t) ? parseFloat(t) : free / 2;
  const at = (t, free) => t in keyword ? free * keyword[t][1] / 100 : length(t, free);
  if (tokens.length === 4) {
    // Edge offsets: "right 10px bottom 20%".
    const out = { x: freeX / 2, y: freeY / 2 };
    for (const [k, off] of [[tokens[0], tokens[1]], [tokens[2], tokens[3]]]) {
      const axis = keyword[k]?.[0]; if (!axis) continue;
      const free = axis === 'x' ? freeX : freeY, d = length(off, free);
      out[axis] = k === 'left' || k === 'top' ? d : free - d;
    }
    return [out.x + 0, out.y + 0];
  }
  let [x = 'center', y = 'center'] = tokens;
  if (tokens.length === 1 && keyword[x]?.[0] === 'y') [x, y] = ['center', x];
  else if (keyword[x]?.[0] === 'y' || keyword[y]?.[0] === 'x') [x, y] = [y, x];
  return [at(x, freeX) + 0, at(y, freeY) + 0];
}

// The share (0 to 1) of a photograph that object-fit: cover hides on each side of its box.
export function coverCrop({ naturalWidth, naturalHeight, width, height, position = '50% 50%' }) {
  const scale = Math.max(width / naturalWidth, height / naturalHeight), dw = naturalWidth * scale, dh = naturalHeight * scale;
  const [x, y] = objectPosition(position, width - dw, height - dh);
  const share = (hidden, size) => Math.max(0, Math.min(1, hidden / size));
  return { top: share(-y, dh), right: share(x + dw - width, dw), bottom: share(y + dh - height, dh), left: share(-x, dw) };
}

// A decoration (a ::before/::after box) that reaches outside its host, and the text or controls
// outside the host it touches (within `margin` px). For a drawn outline or border, content inside
// the ring (`inner`) is not touched; a pseudo-element with text has no inner area. `clip` is the box
// its host and ancestors with overflow clipping leave visible: only that part can be drawn, so a
// decoration that a clipping footer cuts off at its edge does not touch the content beyond it.
export function decorationHits({ rect: drawn, inner, host, clip }, obstacles, margin = 4) {
  const rect = clip ? { left: Math.max(drawn.left, clip.left), right: Math.min(drawn.right, clip.right), top: Math.max(drawn.top, clip.top), bottom: Math.min(drawn.bottom, clip.bottom) } : drawn;
  if (rect.right <= rect.left || rect.bottom <= rect.top) return { outside: 0, hits: [] };
  const outside = Math.max(host.left - rect.left, rect.right - host.right, host.top - rect.top, rect.bottom - host.bottom);
  if (outside <= 2) return { outside: Math.max(0, Math.round(outside)), hits: [] };
  const near = (a, b) => a.left < b.right + margin && a.right > b.left - margin && a.top < b.bottom + margin && a.bottom > b.top - margin;
  const inRing = r => inner && r.left >= inner.left + margin && r.right <= inner.right - margin && r.top >= inner.top + margin && r.bottom <= inner.bottom - margin;
  return { outside: Math.round(outside), hits: obstacles.filter(o => near(rect, o.rect) && !inRing(o.rect)) };
}

// Gaps between the content of consecutive page blocks on the same ground, with no rule between
// them. Blocks: [{ sig, top, bottom, ground, edgeTop, edgeBottom, ignored }] in page order, top
// and bottom null for a block without content (measured across, unless its ground differs).
export function emptyBands(blocks, threshold) {
  const out = []; let prev = null;
  for (const block of blocks) {
    if (block.ignored) { prev = null; continue; }
    if (block.top == null) { if (prev && (block.ground !== prev.ground || block.edgeTop || block.edgeBottom)) prev = null; continue; }
    if (prev && prev.ground === block.ground && !prev.edgeBottom && !block.edgeTop) {
      const gap = block.top - prev.bottom;
      if (gap > threshold) out.push({ sig: `${prev.sig} → ${block.sig}`, gap: Math.round(gap) });
    }
    prev = block;
  }
  return out;
}

// A same-ground join pays one section step; half a step more allows for the content's own
// leading and margins. Pages without --spacing-section keep the earlier fixed limit.
export const BAND_STEP_FACTOR = 1.5;
export const BAND_FALLBACK_PX = 160;
export function bandThreshold({ band = null, sectionStep = 0 } = {}) {
  if (Number.isFinite(band)) return { limit: band, basis: 'fixed' };
  if (Number.isFinite(sectionStep) && sectionStep > 0) return { limit: Math.round(sectionStep * BAND_STEP_FACTOR), basis: 'section-step', step: Math.round(sectionStep) };
  return { limit: BAND_FALLBACK_PX, basis: 'fallback' };
}

export function parseArgs(argv) {
  const out = { widths: DEFAULT_WIDTHS, autoWidths: false, samples: [], hide: [], edge: 8, badge: 3, maxHover: 80, tabs: 45, routes: [], textScale: parseTextScale(DEFAULT_TEXT_SCALE), contrast: false, crop: 15, band: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--base') out.base = value();
    else if (flag === '--routes') out.routes.push(...value().split(',').map(r => r.trim()).filter(Boolean));
    else if (flag === '--routes-file') out.routesFile = msysToNative(value());
    else if (flag === '--sitemap') out.sitemap = true;
    else if (flag === '--widths') {
      const parts = value().split(',').map(s => s.trim()).filter(Boolean);
      out.autoWidths = parts.includes('auto');
      const numbers = parts.filter(p => p !== 'auto').map(Number);
      out.widths = numbers.length || !out.autoWidths ? numbers : DEFAULT_WIDTHS;
    }
    else if (flag === '--crop') out.crop = Number(value());
    else if (flag === '--band') out.band = Number(value());
    else if (flag === '--sample') { const [pattern, n] = value().split(/=(?=\d+$)/); out.samples.push({ pattern: new RegExp(pattern), keep: Number(n ?? 3) }); }
    else if (flag === '--hide') out.hide.push(...value().split(',').map(s => s.trim()).filter(Boolean));
    else if (flag === '--open-details') out.openDetails = true;
    else if (flag === '--edge') out.edge = Number(value());
    else if (flag === '--badge') out.badge = Number(value());
    else if (flag === '--max-hover') out.maxHover = Number(value());
    else if (flag === '--tabs') out.tabs = Number(value());
    else if (flag === '--text-scale') out.textScale = parseTextScale(value());
    else if (flag === '--contrast') out.contrast = true;
    else if (flag === '--out') out.out = msysToNative(value());
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  if (!out.base || !/^https?:\/\//.test(out.base)) throw Error('--base must be an http(s) origin, for example http://127.0.0.1:4321');
  if (!out.routes.length && !out.routesFile && !out.sitemap) throw Error('Give --routes, --routes-file or --sitemap');
  for (const r of out.routes) {
    if (/^[A-Za-z]:[\\/]/.test(r)) throw Error(`Route "${r}" looks like a Windows path: Git Bash converted it. Re-run with MSYS_NO_PATHCONV=1.`);
    if (!r.startsWith('/')) throw Error(`Route "${r}" must start with /`);
  }
  if (!out.widths.length || out.widths.some(w => !Number.isInteger(w) || w < 200 || w > 3840)) throw Error('--widths must be integers between 200 and 3840, optionally with "auto"');
  if (!Number.isFinite(out.crop) || out.crop <= 0 || out.crop >= 100) throw Error('--crop must be a percentage between 0 and 100');
  for (const k of ['edge', 'badge', 'maxHover', 'tabs']) if (!Number.isFinite(out[k]) || out[k] < 0) throw Error(`--${k} must be a non-negative number`);
  if (out.band !== null && (!Number.isFinite(out.band) || out.band < 0)) throw Error('--band must be a non-negative number');
  return out;
}

// <loc> entries of a sitemap or sitemap index, as paths (hosts are rewritten to the audited origin).
export function parseSitemap(xml) {
  const locs = [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
  const isIndex = /<sitemapindex[\s>]/.test(xml);
  return { isIndex, locs: locs.map(loc => { try { const u = new URL(loc); return isIndex ? u.pathname + u.search : u.pathname; } catch { return loc; } }) };
}

// Keeps every route that matches no sample pattern, and the first `keep` routes of each pattern
// (one template = one sample; for example news articles).
export function sampleRoutes(routes, samples = []) {
  const unique = [...new Set(routes)];
  const kept = unique.filter(r => !samples.some(s => s.pattern.test(r)));
  for (const s of samples) kept.push(...unique.filter(r => s.pattern.test(r) && !samples.some(o => o !== s && samples.indexOf(o) < samples.indexOf(s) && o.pattern.test(r))).slice(0, s.keep));
  return kept;
}

// One entry per distinct problem, with every route/width it appears on.
export function aggregate(issues) {
  const map = new Map();
  for (const issue of issues) {
    const key = [issue.kind, issue.sig, issue.detail ?? ''].join('|');
    const entry = map.get(key) ?? { ...issue, key, where: [] };
    entry.where.push(`${issue.width} ${issue.route}`);
    map.set(key, entry);
  }
  return [...map.values()];
}

export function formatReport(entries, audited) {
  const lines = [`UI audit: ${audited} route/width combinations, ${entries.length} distinct issue(s).`];
  const byKind = Object.groupBy ? Object.groupBy(entries, e => e.kind) : entries.reduce((a, e) => ((a[e.kind] ??= []).push(e), a), {});
  for (const [kind, list] of Object.entries(byKind)) {
    lines.push('', `== ${kind}: ${list.length}`);
    for (const e of list) lines.push(`  ${e.sig}${e.gap !== undefined ? ` (text ${e.gap}px from edge: L${e.left} R${e.right} T${e.top})` : ''}${e.text ? ` "${e.text}"` : ''}${e.detail ? ' ' + e.detail : ''}${e.note ? ` [${e.note}]` : ''} — ${e.where.length}×: ${e.where.slice(0, 3).join(', ')}`);
  }
  return lines.join('\n');
}

// Splits a selector list at top-level commas, so ":is(.a, .b):hover" stays one selector.
export function splitSelectors(text) {
  const out = []; let depth = 0, quote = '', start = 0; const str = String(text);
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) { out.push(str.slice(start, i).trim()); start = i + 1; }
  }
  out.push(str.slice(start).trim());
  return out.filter(Boolean);
}

// The elements to hover for the :hover rules of a page. For ".card:hover .title" that is ".card";
// when the part before ":hover" is not a complete selector (":is(.a:hover, .b) span"), the whole
// selector with ":hover" removed is used instead.
export function hoverBases(selectorTexts) {
  const bases = new Set();
  for (const text of selectorTexts) for (const selector of splitSelectors(text)) {
    if (!selector.includes(':hover')) continue;
    const prefix = selector.slice(0, selector.indexOf(':hover')).trim().replace(/\s*[>+~]\s*$/, '');
    const balanced = (prefix.match(/\(/g) || []).length === (prefix.match(/\)/g) || []).length;
    const base = prefix && balanced && !/[(:]$/.test(prefix) ? prefix : selector.replaceAll(':hover', '').trim();
    if (base && !/:(?:not|is|where|has)\(\s*\)/.test(base)) bases.add(base);
  }
  return [...bases];
}

// Rows occupied by a set of boxes: a box starts a new row when it begins at or below the bottom
// of the current one (4px tolerance), so controls of different heights on one line count once.
export function countRows(boxes) {
  let rows = 0, bottom = -Infinity;
  for (const box of [...boxes].sort((a, b) => a.top - b.top)) {
    if (box.top >= bottom - 4) { rows++; bottom = box.bottom; } else bottom = Math.max(bottom, box.bottom);
  }
  return rows;
}

export const progressLine = (done, total, width, route, findings) => `[${done}/${total}] ${width} ${route}: ${findings} finding${findings === 1 ? '' : 's'}`;

// Runs in the page. With `scope`, only that element, its descendants and three ancestors are measured.
function edgeCheck({ min, badge, scope }) {
  const out = [];
  const alpha = c => { const m = String(c).match(/rgba?\(([^)]+)\)|oklab\(([^)]+)\)|oklch\(([^)]+)\)/); if (!m) return c === 'transparent' ? 0 : 1; const parts = (m[1] || m[2] || m[3]).split(/[ ,/]+/).filter(Boolean); return parts.length > 3 ? parseFloat(parts[parts.length - 1]) : 1; };
  const sides = s => ['Top', 'Right', 'Bottom', 'Left'].filter(k => parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none' && alpha(s['border' + k + 'Color']) > 0.05);
  const boxed = el => { if (['HTML', 'BODY', 'MAIN'].includes(el.tagName)) return null; const s = getComputedStyle(el), b = sides(s); const bg = alpha(s.backgroundColor) > 0.04 || s.backgroundImage.includes('gradient'); const shadow = s.boxShadow !== 'none' && !/^(rgba\(0, 0, 0, 0\)|oklab\(0 0 0 \/ 0\)|transparent)/.test(s.boxShadow); return b.length >= 3 || bg || (shadow && b.length >= 1) ? { b } : null; };
  const skip = /^(IMG|PICTURE|SVG|VIDEO|IFRAME|INPUT|TEXTAREA|SELECT|BUTTON|HTML|BODY|MAIN|HEADER|FOOTER|NAV|UL|OL|LI)$/;
  let candidates;
  if (scope) { const el = document.querySelector(scope); if (!el) return out; const up = []; let p = el.parentElement; for (let i = 0; i < 3 && p; i++, p = p.parentElement) up.push(p); candidates = [el, ...el.querySelectorAll('*'), ...up]; }
  else candidates = [...document.querySelectorAll('body *')];
  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20 || (skip.test(el.tagName) && !(el.tagName === 'A' && boxed(el)))) continue;
    if (el.closest('[data-audit-ignore]') || getComputedStyle(el).visibility === 'hidden') continue;
    if (!boxed(el)) continue;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    let minL = 1e9, minR = 1e9, minT = 1e9, n, texts = 0;
    while ((n = walker.nextNode()) && texts < 40) {
      let p = n.parentElement, nested = false; while (p && p !== el) { if (boxed(p)) { nested = true; break; } p = p.parentElement; } if (nested) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const t of range.getClientRects()) { if (!t.width) continue; texts++; minL = Math.min(minL, t.left - r.left); minR = Math.min(minR, r.right - t.right); minT = Math.min(minT, t.top - r.top); }
    }
    if (!texts) continue;
    const gap = Math.min(minL, minR, minT);
    if (gap < (r.height < 36 ? badge : min)) out.push({ sig: el.tagName.toLowerCase() + [...el.classList].slice(0, 3).map(c => '.' + c).join(''), gap: Math.round(gap), left: Math.round(minL), right: Math.round(minR), top: Math.round(minT), text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50) });
  }
  return out;
}

// Runs in the page. Text that leaves the viewport, and columns squeezed to a few characters.
// Skips fixed and hidden elements, screen-reader-only text, and content inside its own
// horizontal scroll box (code blocks, wide tables), where sideways scrolling is the design.
function textFitCheck() {
  const vw = document.documentElement.clientWidth, off = [], squeezed = [];
  const sig = el => el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => '.' + c).join('');
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    if (el.closest('[data-audit-ignore], [aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    let scroller = /auto|scroll/.test(cs.overflowX);
    for (let a = el.parentElement; a && a !== document.body && !scroller; a = a.parentElement) scroller = /auto|scroll/.test(getComputedStyle(a).overflowX);
    if (scroller) continue;
    const text = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
    // The text itself, not only the box: a no-wrap line or a long word overflows its own box while
    // the box stays on screen. An element that clips its own text (an ellipsis) is left alone.
    let left = r.left, right = r.right;
    if (!/hidden|clip/.test(cs.overflowX)) for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const t of range.getClientRects()) if (t.width) { left = Math.min(left, t.left); right = Math.max(right, t.right); }
    }
    if (right > vw + 1 || left < -1) off.push({ sig: sig(el), text, note: `spans ${Math.round(left)}..${Math.round(right)} of ${vw}px` });
    // Body text needs about four ems of width; large headings get by with a little over two.
    const font = parseFloat(cs.fontSize);
    if (el.textContent.trim().length > 12 && cs.display !== 'inline' && r.width < font * (font >= 40 ? 2.2 : 4)) squeezed.push({ sig: sig(el), text, note: `${Math.round(r.width)}px wide at ${Math.round(font)}px text` });
  }
  return { off: off.slice(0, 12), squeezed: squeezed.slice(0, 12) };
}

// Runs in the page. The visible links, buttons and fields of the page header, as boxes.
function bannerBoxes() {
  const banner = document.querySelector('body > header, [role="banner"]') ?? document.querySelector('header');
  if (!banner) return null;
  const area = banner.getBoundingClientRect(), boxes = [];
  for (const el of banner.querySelectorAll('a[href], button, summary, input, select, [role="button"]')) {
    if (el.closest('[data-audit-ignore], [aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || r.bottom <= area.top || r.top >= area.bottom + 1) continue;
    boxes.push({ top: r.top, bottom: r.bottom });
  }
  return { sig: 'header' + [...banner.classList].slice(0, 2).map(c => '.' + c).join(''), boxes };
}

// Runs in the page. Enlarged text as phone users set it: "root" scales rem-based layout with the
// text; "text" multiplies every computed font size and leaves boxes sized in px as they are.
function applyTextScale({ kind, factor }) {
  if (kind === 'root') { const style = document.createElement('style'); style.textContent = `html{font-size:${factor * 100}% !important}`; document.head.append(style); return; }
  const els = [...document.querySelectorAll('body *')], sizes = els.map(el => parseFloat(getComputedStyle(el).fontSize));
  els.forEach((el, i) => { if (sizes[i]) el.style.setProperty('font-size', `${sizes[i] * factor}px`, 'important'); });
}

// Runs in the page. Computed text colour against the solid backgrounds composited behind it.
// A canvas resolves any colour syntax (oklch, color-mix) to sRGB. Text over an image or gradient
// is skipped, and grounds painted by pseudo-elements or shadows are not seen: check those by eye.
function contrastCheck({ scope } = {}) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const rgba = c => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const out = [];
  const root = scope ? document.querySelector(scope) : null;
  for (const el of scope ? (root ? [root, ...root.querySelectorAll('*')] : []) : document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    if (el.closest('[data-audit-ignore], [aria-hidden="true"]')) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const layers = []; let unknown = false;
    for (let a = el; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.backgroundImage !== 'none') { unknown = true; break; } const c = rgba(s.backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 0.999) break; } }
    if (unknown) continue;
    let ground = [255, 255, 255, 1]; for (const layer of layers.reverse()) ground = over(layer, ground);
    const ink = over(rgba(cs.color), ground);
    const [hi, lo] = [lum(ink), lum(ground)].sort((x, y) => y - x), ratio = (hi + 0.05) / (lo + 0.05);
    const size = parseFloat(cs.fontSize), need = size >= 24 || (parseInt(cs.fontWeight, 10) >= 700 && size >= 18.66) ? 3 : 4.5;
    if (ratio < need - 0.05) out.push({ sig: el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => '.' + c).join(''), text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), detail: `needs ${need}:1`, note: `${ratio.toFixed(2)}:1` });
  }
  return out.slice(0, 20);
}

// Runs in the page. An image larger than the clipping frame around it shows only part of itself.
// Cropping through object-fit happens inside the image box and is not reported.
function imageClipCheck() {
  const out = [];
  for (const img of document.images) {
    const r = img.getBoundingClientRect();
    if (r.width < 24 || r.height < 24 || img.closest('[data-audit-ignore], [aria-hidden="true"]')) continue;
    let frame = img.parentElement;
    for (let i = 0; i < 3 && frame && frame !== document.body; i++, frame = frame.parentElement) {
      const s = getComputedStyle(frame);
      if (!/hidden|clip/.test(s.overflowX + ' ' + s.overflowY)) continue;
      const f = frame.getBoundingClientRect();
      const overlaps = r.left < f.right && r.right > f.left && r.top < f.bottom && r.bottom > f.top;
      if (f.width >= 24 && f.height >= 24 && overlaps && (r.width > f.width * 1.15 || r.height > f.height * 1.15)) out.push({ sig: 'img in ' + frame.tagName.toLowerCase() + [...frame.classList].slice(0, 2).map(c => '.' + c).join(''), text: (img.alt || img.currentSrc.split('/').pop() || '').slice(0, 40), note: `image ${Math.round(r.width)}x${Math.round(r.height)} in a ${Math.round(f.width)}x${Math.round(f.height)} frame` });
      break;
    }
  }
  return out.slice(0, 12);
}

// Runs in the page. The media query texts of every readable stylesheet, imports and nested rules included.
function mediaQueryTexts() {
  const out = [];
  const walk = rules => { for (const rule of rules) { try {
    if (rule instanceof CSSMediaRule) out.push(rule.media.mediaText);
    if (rule instanceof CSSImportRule) { if (rule.media.mediaText) out.push(rule.media.mediaText); if (rule.styleSheet) walk(rule.styleSheet.cssRules); }
    if (rule.cssRules) walk(rule.cssRules);
  } catch {} } };
  for (const sheet of document.styleSheets) { try { if (sheet.media?.mediaText) out.push(sheet.media.mediaText); walk(sheet.cssRules); } catch {} }
  return out;
}

// Runs in the page. Content images shown with object-fit: cover, with what is needed to compute
// how much of them the frame hides. Mark images meant to be cropped with data-audit-crop-ok. Empty bands are measured against 1.5 times the page's own --spacing-section (160px without it); --band sets a fixed limit.
function coverImages() {
  const out = [];
  for (const img of document.images) {
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) continue;
    if (img.closest('[data-audit-ignore], [data-audit-crop-ok], [aria-hidden="true"]')) continue;
    const s = getComputedStyle(img);
    if (s.objectFit !== 'cover' || s.display === 'none' || s.visibility === 'hidden') continue;
    const r = img.getBoundingClientRect();
    const width = r.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) - parseFloat(s.borderLeftWidth) - parseFloat(s.borderRightWidth);
    const height = r.height - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom) - parseFloat(s.borderTopWidth) - parseFloat(s.borderBottomWidth);
    if (width < 48 || height < 48) continue;
    const frame = img.parentElement?.tagName === 'PICTURE' ? img.parentElement.parentElement : img.parentElement;
    const sig = el => el ? el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => '.' + c).join('') : '';
    out.push({ sig: 'img in ' + sig(frame), text: (img.alt || (img.currentSrc || img.src).split('/').pop() || '').slice(0, 40), naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, width, height, position: s.objectPosition });
    if (out.length >= 60) break;
  }
  return out;
}

// Runs in the page. ::before/::after boxes that paint a border, an outline or text: the hosts are
// marked with data-audit-pseudo so their pseudo-elements can be measured through DevTools.
function pseudoCandidates() {
  const out = [], alpha = c => { const m = String(c).match(/\/\s*([\d.]+%?)\s*\)|rgba\([^)]*,\s*([\d.]+)\s*\)/); if (!m) return c === 'transparent' ? 0 : 1; const v = m[1] ?? m[2]; return v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); };
  let index = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('[data-audit-ignore]')) continue;
    let mine = null;
    for (const pseudo of ['before', 'after']) {
      const s = getComputedStyle(el, '::' + pseudo);
      if (s.content === 'none' || s.content === 'normal' || s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) continue;
      const borders = ['Top', 'Right', 'Bottom', 'Left'].map(k => parseFloat(s['border' + k + 'Width']) > 0 && !/none|hidden/.test(s['border' + k + 'Style']) && alpha(s['border' + k + 'Color']) > 0.05 ? parseFloat(s['border' + k + 'Width']) : 0);
      const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && alpha(s.outlineColor) > 0.05 ? { width: parseFloat(s.outlineWidth), offset: parseFloat(s.outlineOffset) || 0 } : null;
      const text = /^["'].*\S.*["']$/.test(s.content);
      if (!borders.some(Boolean) && !outline && !text) continue;
      if (mine === null) { mine = index++; el.setAttribute('data-audit-pseudo', String(mine)); }
      out.push({ i: mine, pseudo, borders, outline, text });
    }
    if (out.length >= 200) break;
  }
  return out;
}

// Runs in the page. For decorations placed relative to their host, the text lines and controls
// outside the host near them. Coordinates are those of getBoundingClientRect.
function decorationObstacles(decos) {
  const sig = el => el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => '.' + c).join('');
  const box = r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
  const all = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  for (let n; (n = walker.nextNode());) {
    const parent = n.parentElement; if (!parent || parent.closest('[data-audit-ignore], [aria-hidden="true"]')) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width >= 2 && r.height >= 2) all.push({ node: n, sig: sig(parent), text: n.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), rect: box(r) });
  }
  for (const el of document.querySelectorAll('a[href], button, input, select, textarea, summary, [role="button"]')) {
    if (el.closest('[data-audit-ignore], [aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    all.push({ node: el, sig: sig(el), text: (el.textContent || el.getAttribute('aria-label') || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 30), rect: box(r) });
  }
  return decos.map(d => {
    const host = document.querySelector(`[data-audit-pseudo="${d.i}"]`); if (!host) return null;
    const h = host.getBoundingClientRect(), dx = h.left - d.hostBox.left, dy = h.top - d.hostBox.top;
    const shift = r => r && { left: r.left + dx, right: r.right + dx, top: r.top + dy, bottom: r.bottom + dy };
    const rect = shift(d.rect), inner = shift(d.inner), m = 8;
    // What the host and its overflow-clipping ancestors leave visible, per axis.
    const clip = { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
    for (let el = host; el && el !== document.documentElement; el = el.parentElement) {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      if (s.overflowX !== 'visible') { clip.left = Math.max(clip.left, r.left); clip.right = Math.min(clip.right, r.right); }
      if (s.overflowY !== 'visible') { clip.top = Math.max(clip.top, r.top); clip.bottom = Math.min(clip.bottom, r.bottom); }
    }
    const obstacles = all.filter(o => !host.contains(o.node) && !(o.node.nodeType === 1 && o.node.contains(host)) && o.rect.left < rect.right + m && o.rect.right > rect.left - m && o.rect.top < rect.bottom + m && o.rect.bottom > rect.top - m).slice(0, 10).map(({ sig, text, rect }) => ({ sig, text, rect }));
    return { ...d, sig: sig(host) + '::' + d.pseudo, rect, inner, host: box(h), clip, obstacles };
  }).filter(Boolean);
}

// Runs in the page. The top-level blocks of the main content (through single-child wrappers), with
// the vertical extent of their content and the ground they stand on.
function bandBlocks() {
  const main = document.querySelector('main, [role="main"]'); if (!main) return [];
  const alpha = c => { const m = String(c).match(/\/\s*([\d.]+%?)\s*\)|rgba\([^)]*,\s*([\d.]+)\s*\)/); if (!m) return c === 'transparent' ? 0 : 1; const v = m[1] ?? m[2]; return v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); };
  const shown = el => { const s = getComputedStyle(el), r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && s.position !== 'absolute' && s.position !== 'fixed' && r.height > 0; };
  let parent = main;
  for (let kids = [...parent.children].filter(shown); kids.length === 1 && kids[0].children.length; kids = [...parent.children].filter(shown)) parent = kids[0];
  const ground = el => { for (let a = el; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.backgroundImage !== 'none') return 'image ' + s.backgroundImage.slice(0, 80); if (alpha(s.backgroundColor) > 0) return s.backgroundColor; } return 'none'; };
  const edge = (s, side) => parseFloat(s[`border${side}Width`]) > 0 && !/none|hidden/.test(s[`border${side}Style`]) && alpha(s[`border${side}Color`]) > 0.05;
  const media = /^(IMG|SVG|VIDEO|CANVAS|IFRAME|INPUT|SELECT|TEXTAREA|BUTTON|HR|svg)$/;
  return [...parent.children].filter(shown).map(block => {
    const s = getComputedStyle(block), own = ground(block);
    let top = Infinity, bottom = -Infinity;
    const take = r => { if (r.width < 2 || r.height < 2) return; top = Math.min(top, r.top + scrollY); bottom = Math.max(bottom, r.bottom + scrollY); };
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: n => {
      if (n.nodeType === 3) return n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      const cs = getComputedStyle(n); return cs.display === 'none' || cs.visibility === 'hidden' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    } });
    for (let n; (n = walker.nextNode());) {
      if (n.nodeType === 3) { const range = document.createRange(); range.selectNodeContents(n); for (const r of range.getClientRects()) take(r); continue; }
      const cs = getComputedStyle(n);
      const painted = ['Top', 'Right', 'Bottom', 'Left'].some(k => edge(cs, k)) || cs.backgroundImage !== 'none' || (alpha(cs.backgroundColor) > 0 && cs.backgroundColor !== own) || (cs.boxShadow !== 'none' && !/^(rgba\(0, 0, 0, 0\)|transparent)/.test(cs.boxShadow));
      if (media.test(n.tagName) || painted) take(n.getBoundingClientRect());
    }
    // Sections often share their classes: the first heading tells the joins apart.
    const heading = block.querySelector('h1, h2, h3, h4')?.textContent.trim().replace(/\s+/g, ' ').slice(0, 24);
    return { sig: block.tagName.toLowerCase() + [...block.classList].slice(0, 2).map(c => '.' + c).join('') + (heading ? ` "${heading}"` : ''), top: top === Infinity ? null : top, bottom: top === Infinity ? null : bottom, ground: own, edgeTop: edge(s, 'Top'), edgeBottom: edge(s, 'Bottom'), ignored: !!block.closest('[data-audit-ignore]') };
  });
}

// Runs in the page. The resolved --spacing-section of the main content in px (0 when unset).
function sectionStep() {
  const host = document.querySelector('main, [role="main"]') || document.body;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;inline-size:0;block-size:0;padding:0;padding-block-start:var(--spacing-section, 0px)';
  host.append(probe);
  const px = parseFloat(getComputedStyle(probe).paddingBlockStart) || 0;
  probe.remove();
  return px;
}

// Pseudo-element boxes through the DevTools protocol (the page cannot measure them itself), as
// decorations with their host's box in the same coordinates.
// Opens every closed <details> outside the page header and navigation (a menu opened over the page
// would be measured as a defect of its own). Returns how many it opened.
export function openFolds() {
  let opened = 0;
  for (const details of document.querySelectorAll('details:not([open])')) {
    if (details.closest('header, nav, [role="banner"], [role="navigation"]')) continue;
    details.open = true;
    opened++;
  }
  return opened;
}

async function measureDecorations(page, candidates) {
  if (!candidates.length) return [];
  const cdp = await page.context().newCDPSession(page);
  try {
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: false });
    const hosts = new Map(), stack = [root];
    while (stack.length) {
      const node = stack.pop(), attrs = node.attributes ?? [];
      const at = attrs.indexOf('data-audit-pseudo');
      if (at >= 0 && at % 2 === 0) hosts.set(Number(attrs[at + 1]), node);
      stack.push(...(node.children ?? []));
    }
    const quadBox = q => { const xs = [q[0], q[2], q[4], q[6]], ys = [q[1], q[3], q[5], q[7]]; return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) }; };
    const boxOf = async nodeId => { try { return quadBox((await cdp.send('DOM.getBoxModel', { nodeId })).model.border); } catch { return null; } };
    const out = [];
    for (const c of candidates) {
      const host = hosts.get(c.i), pseudo = host?.pseudoElements?.find(p => p.pseudoType === c.pseudo);
      if (!pseudo) continue;
      const [hostBox, border] = [await boxOf(host.nodeId), await boxOf(pseudo.nodeId)];
      if (!hostBox || !border) continue;
      const grow = (r, d) => ({ left: r.left - d, right: r.right + d, top: r.top - d, bottom: r.bottom + d });
      const reach = c.outline ? Math.max(0, c.outline.offset + c.outline.width) : 0, rect = grow(border, reach);
      const [bt, br, bb, bl] = c.borders;
      const inner = c.text ? null : c.borders.some(Boolean) ? { left: border.left + bl, right: border.right - br, top: border.top + bt, bottom: border.bottom - bb } : grow(border, c.outline.offset);
      if (decorationHits({ rect, inner, host: hostBox }, []).outside > 2) out.push({ i: c.i, pseudo: c.pseudo, rect, inner, hostBox });
    }
    return out;
  } finally { await cdp.detach().catch(() => {}); }
}

export async function audit(options, hooks = {}) {
  let chromium;
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(base)('@playwright/test')); break; } catch {} }
  if (!chromium) throw Error('audit:ui needs @playwright/test and an installed Chromium (npx playwright install chromium).');
  let routes = [...options.routes];
  if (options.routesFile) routes.push(...readFileSync(options.routesFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s.startsWith('/')));
  if (options.sitemap) {
    const fetchMap = async p => parseSitemap(await (await fetch(new URL(p, options.base))).text());
    const top = await fetchMap('/sitemap.xml');
    if (top.isIndex) for (const child of top.locs) routes.push(...(await fetchMap(child)).locs); else routes.push(...top.locs);
  }
  routes = sampleRoutes(routes, options.samples);
  if (!routes.length) throw Error('No routes to audit');
  const browser = await chromium.launch(), issues = []; let audited = 0, step = 0;
  // Hover, focus and contrast run at the widest given width and enlarged text at the given phone
  // widths, so the widths added by --widths auto only add the per-width checks.
  const widest = Math.max(...options.widths), phoneWidths = new Set(options.widths.filter(w => w <= 500));
  let widths = options.widths, breakpoints = [];
  try {
    if (options.autoWidths) {
      const page = await browser.newPage({ viewport: { width: options.widths[0], height: 900 } }), texts = [];
      for (const route of routes.slice(0, 5)) {
        try { await page.goto(new URL(route, options.base).href, { waitUntil: 'load', timeout: 60000 }); texts.push(...await page.evaluate(mediaQueryTexts)); } catch {}
      }
      await page.close();
      ({ widths, edges: breakpoints } = autoWidths(options.widths, parseBreakpoints(texts)));
      hooks.widths?.({ widths, breakpoints });
    }
    const total = routes.length * widths.length;
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const consoleErrors = [], failed = [];
      page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
      page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) failed.push(`${r.status()} ${r.url()}`); });
      const done = new Set();
      for (const route of routes) {
        consoleErrors.length = 0; failed.length = 0;
        const before = issues.length, report = () => hooks.progress?.({ done: ++step, total, width, route, findings: issues.length - before, issues, audited });
        let response;
        try { response = await page.goto(new URL(route, options.base).href, { waitUntil: 'networkidle', timeout: 60000 }); }
        catch (error) { issues.push({ kind: 'load-failed', sig: route, route, width, detail: error.message.split('\n')[0].slice(0, 100) }); report(); continue; }
        const final = new URL(page.url()).pathname; if (done.has(final)) { report(); continue; } done.add(final); audited++;
        const note = (kind, extra) => issues.push({ kind, route: final, width, ...extra });
        if (response && response.status() >= 400) note('http', { sig: String(response.status()) });
        if (options.hide.length) await page.addStyleTag({ content: `${options.hide.join(',')}{display:none!important}` }).catch(() => {});
        // Content inside a closed <details> is never laid out, so its defects stay hidden until a
        // visitor opens it (found on a real site: a table caption one word wide inside a phone fold).
        if (options.openDetails) await page.evaluate(openFolds).catch(() => {});
        await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
        await page.waitForTimeout(300);
        for (const hit of await page.evaluate(edgeCheck, { min: options.edge, badge: options.badge })) note('edge-at-rest', hit);
        const overflow = await page.evaluate(() => { const w = document.documentElement.clientWidth; return document.documentElement.scrollWidth > w ? [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > w + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('[aria-hidden="true"]')).slice(0, 3).map(el => el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => '.' + c).join('')) : null; });
        if (overflow) note('overflow-x', { sig: overflow.join(' ') || 'document' });
        for (const src of await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).map(i => i.currentSrc || i.src).slice(0, 5))) note('broken-image', { sig: src.slice(-80) });
        for (const hit of await page.evaluate(imageClipCheck)) note('image-clipped', hit);
        for (const img of await page.evaluate(coverImages)) {
          const hidden = coverCrop(img), sides = Object.keys(hidden).filter(side => hidden[side] * 100 > options.crop);
          if (sides.length) note('image-cover-cropped', { sig: img.sig, text: img.text, detail: sides.join('+'), note: `${sides.map(side => `${Math.round(hidden[side] * 100)}% hidden at the ${side}`).join(', ')}; image ${img.naturalWidth}x${img.naturalHeight} in a ${Math.round(img.width)}x${Math.round(img.height)} frame` });
        }
        const decorations = await measureDecorations(page, await page.evaluate(pseudoCandidates)).catch(() => []);
        for (const d of decorations.length ? await page.evaluate(decorationObstacles, decorations) : []) {
          const { outside, hits } = decorationHits(d, d.obstacles);
          // A link and its own text line are one obstacle.
          for (const hit of hits.filter((h, i) => hits.findIndex(o => o.sig === h.sig) === i).slice(0, 3)) note('decoration-overlap', { sig: d.sig, detail: `touches ${hit.sig}`, text: hit.text, note: `reaches ${outside}px outside its host` });
        }
        await page.evaluate(() => document.querySelectorAll('[data-audit-pseudo]').forEach(el => el.removeAttribute('data-audit-pseudo')));
        if (width >= 1024) {
          const threshold = bandThreshold({ band: options.band, sectionStep: await page.evaluate(sectionStep).catch(() => 0) });
          const basis = threshold.basis === 'section-step' ? `${BAND_STEP_FACTOR} × the ${threshold.step}px section step` : threshold.basis === 'fixed' ? '--band' : 'no --spacing-section on the page';
          for (const band of emptyBands(await page.evaluate(bandBlocks), threshold.limit)) note('empty-band', { sig: band.sig, note: `${band.gap}px without content (limit ${threshold.limit}px: ${basis})` });
        }
        for (const c of [...new Set(consoleErrors)]) note('console-error', { sig: c.slice(0, 140) });
        for (const f of [...new Set(failed)]) note('failed-request', { sig: f.slice(0, 160) });
        // Text fit at the normal size, measured per element so a clipping shell cannot hide it.
        const walkPage = () => page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
        const fit = await page.evaluate(textFitCheck);
        for (const hit of fit.off) note('text-offscreen', hit);
        for (const hit of fit.squeezed) note('text-squeezed', hit);
        // Enlarged text on phone widths: reload for each case so the cases do not compound.
        if (phoneWidths.has(width) && options.textScale.length) {
          const headerAtRest = await page.evaluate(bannerBoxes), rowsAtRest = headerAtRest ? countRows(headerAtRest.boxes) : 0;
          for (const scale of options.textScale) {
            try { await page.goto(new URL(route, options.base).href, { waitUntil: 'networkidle', timeout: 60000 }); } catch { continue; }
            if (options.hide.length) await page.addStyleTag({ content: `${options.hide.join(',')}{display:none!important}` }).catch(() => {});
            await page.evaluate(applyTextScale, scale); await walkPage(); await page.waitForTimeout(150);
            const scaled = await page.evaluate(textFitCheck), detail = `at ${scale.kind} ×${scale.factor}`;
            for (const hit of scaled.off) note('large-text-offscreen', { ...hit, detail });
            for (const hit of scaled.squeezed) note('large-text-squeezed', { ...hit, detail });
            const header = rowsAtRest ? await page.evaluate(bannerBoxes) : null, rows = header ? countRows(header.boxes) : 0;
            if (rows > rowsAtRest) note('large-text-header-wrapped', { sig: header.sig, detail, note: `controls on ${rows} rows, ${rowsAtRest} at the normal size` });
          }
          if (width === widest) { await page.goto(new URL(route, options.base).href, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await walkPage(); }
        }
        const lowAtRest = new Set();
        if (options.contrast && width === widest) for (const hit of await page.evaluate(contrastCheck)) { lowAtRest.add(hit.sig + '|' + hit.text); note('low-contrast', hit); }
        if (width !== widest) { report(); continue; }
        // Hover: every element matched by a :hover rule, hovered in turn.
        const hoverSelectors = await page.evaluate(() => {
          const found = [];
          const walk = rules => { for (const r of rules) { if (r.cssRules && !r.selectorText) walk(r.cssRules); if (r.selectorText?.includes(':hover')) found.push(r.selectorText); } };
          for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch {} }
          return found;
        });
        const count = await page.evaluate(({ bases, max }) => {
          const els = new Set();
          for (const b of bases) { try { document.querySelectorAll(b).forEach(e => { if (e.getBoundingClientRect().width > 30 && !e.closest('[data-audit-ignore]')) els.add(e); }); } catch {} }
          return [...els].slice(0, max).map((e, i) => (e.setAttribute('data-audit-hover', String(i)), i)).length;
        }, { bases: hoverBases(hoverSelectors), max: options.maxHover });
        for (let i = 0; i < count; i++) {
          const target = page.locator(`[data-audit-hover="${i}"]`);
          try { await target.scrollIntoViewIfNeeded({ timeout: 2000 }); await target.hover({ timeout: 2000, force: true }); } catch { continue; }
          await page.waitForTimeout(260);
          for (const hit of await page.evaluate(edgeCheck, { min: options.edge, badge: options.badge, scope: `[data-audit-hover="${i}"]` })) note('edge-on-hover', hit);
          // Text that was readable at rest and is not while hovered (a hover colour on the wrong ground).
          if (options.contrast) for (const hit of await page.evaluate(contrastCheck, { scope: `[data-audit-hover="${i}"]` })) if (!lowAtRest.has(hit.sig + '|' + hit.text)) note('hover-low-contrast', hit);
        }
        await page.mouse.move(0, 0);
        // Keyboard focus: Tab through, wait for transitions, require a visible indicator.
        await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
        const misses = new Set();
        for (let t = 0; t < options.tabs; t++) {
          await page.keyboard.press('Tab'); await page.waitForTimeout(250);
          const miss = await page.evaluate(() => {
            const el = document.activeElement; if (!el || el === document.body) return null;
            const shows = node => { const s = getComputedStyle(node); return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow !== 'none' && !/^(rgba\(0, 0, 0, 0\)|oklab\(0 0 0 \/ 0\))/.test(s.boxShadow)) || s.textDecorationLine.includes('underline'); };
            let node = el; for (let i = 0; i < 7 && node; i++, node = node.parentElement) if (shows(node)) return null;
            return el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => '.' + c).join('') + (el.name ? `[name=${el.name}]` : '') + ` "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`;
          });
          if (miss) misses.add(miss);
        }
        for (const m of misses) note('focus-invisible', { sig: m });
        report();
      }
      await context.close();
    }
  } finally { await browser.close(); }
  return { audited, widths, breakpoints, entries: aggregate(issues) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: audit:ui -- --base <origin> (--routes /,/contact | --routes-file <file> | --sitemap) [--widths 390,768,1440|auto|auto,320,390,1440] [--sample "^/news/.+=3"] [--hide "#dev-panel"] [--open-details] [--edge 8] [--badge 3] [--max-hover 80] [--tabs 45] [--text-scale root:1.6,root:2,text:1.5,text:2|off] [--contrast] [--crop 15] [--band <px>] [--out report.json]\n"auto" adds one width on each side of the site\'s own breakpoints to the given (or default) widths. Enlarged-text checks run at the given widths up to 500px; hover, focus and contrast at the widest given width. Mark images meant to be cropped with data-audit-crop-ok. --contrast also measures hovered elements. Progress is printed to stderr and --out is rewritten after every route, so an interrupted run keeps its findings; allow about half a minute per route and phone width. Mark deliberate exceptions in markup with data-audit-ignore. Git Bash: MSYS_NO_PATHCONV=1 when a route is "/".');
    else {
      let chosen = options.widths;
      const { audited, widths, breakpoints, entries } = await audit(options, {
        widths: ({ widths, breakpoints }) => { chosen = widths; console.error(`Widths: ${widths.join(', ')} (breakpoints ${breakpoints.length ? breakpoints.join(', ') : 'none found'})`); },
        progress: ({ done, total, width, route, findings, issues, audited: sofar }) => {
          console.error(progressLine(done, total, width, route, findings));
          if (options.out) writeFileSync(options.out, JSON.stringify({ base: options.base, widths: chosen, audited: sofar, partial: true, entries: aggregate(issues) }, null, 1) + '\n');
        },
      });
      if (options.out) writeFileSync(options.out, JSON.stringify({ base: options.base, widths, breakpoints, audited, entries }, null, 1) + '\n');
      console.log(formatReport(entries, audited));
      if (entries.length) process.exitCode = 2;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
