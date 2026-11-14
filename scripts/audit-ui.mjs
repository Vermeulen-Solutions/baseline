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
// - low-contrast (only with --contrast): text whose computed colour against the composited solid
//   backgrounds behind it is under 4.5:1 (3:1 for large text). It catches a cascade slip that
//   token-pair checks cannot see. Text over images, gradients or pseudo-element grounds is skipped;
// - overflow-x, broken-image, http, console-error and failed-request.
// Exit 0 = clean, 2 = issues, 1 = error. Read-only: it never submits forms or clicks links.
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

export function parseArgs(argv) {
  const out = { widths: DEFAULT_WIDTHS, samples: [], hide: [], edge: 8, badge: 3, maxHover: 80, tabs: 45, routes: [], textScale: parseTextScale(DEFAULT_TEXT_SCALE), contrast: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--base') out.base = value();
    else if (flag === '--routes') out.routes.push(...value().split(',').map(r => r.trim()).filter(Boolean));
    else if (flag === '--routes-file') out.routesFile = msysToNative(value());
    else if (flag === '--sitemap') out.sitemap = true;
    else if (flag === '--widths') out.widths = value().split(',').map(Number);
    else if (flag === '--sample') { const [pattern, n] = value().split(/=(?=\d+$)/); out.samples.push({ pattern: new RegExp(pattern), keep: Number(n ?? 3) }); }
    else if (flag === '--hide') out.hide.push(...value().split(',').map(s => s.trim()).filter(Boolean));
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
  if (out.widths.some(w => !Number.isInteger(w) || w < 200 || w > 3840)) throw Error('--widths must be integers between 200 and 3840');
  for (const k of ['edge', 'badge', 'maxHover', 'tabs']) if (!Number.isFinite(out[k]) || out[k] < 0) throw Error(`--${k} must be a non-negative number`);
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
    if (r.right > vw + 1 || r.left < -1) off.push({ sig: sig(el), text, note: `spans ${Math.round(r.left)}..${Math.round(r.right)} of ${vw}px` });
    // Body text needs about four ems of width; large headings get by with a little over two.
    const font = parseFloat(cs.fontSize);
    if (el.textContent.trim().length > 12 && cs.display !== 'inline' && r.width < font * (font >= 40 ? 2.2 : 4)) squeezed.push({ sig: sig(el), text, note: `${Math.round(r.width)}px wide at ${Math.round(font)}px text` });
  }
  return { off: off.slice(0, 12), squeezed: squeezed.slice(0, 12) };
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
function contrastCheck() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const rgba = c => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
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

async function audit(options) {
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
  const browser = await chromium.launch(), issues = []; let audited = 0;
  const widest = Math.max(...options.widths);
  try {
    for (const width of options.widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const consoleErrors = [], failed = [];
      page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
      page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) failed.push(`${r.status()} ${r.url()}`); });
      const done = new Set();
      for (const route of routes) {
        consoleErrors.length = 0; failed.length = 0;
        let response;
        try { response = await page.goto(new URL(route, options.base).href, { waitUntil: 'networkidle', timeout: 60000 }); }
        catch (error) { issues.push({ kind: 'load-failed', sig: route, route, width, detail: error.message.split('\n')[0].slice(0, 100) }); continue; }
        const final = new URL(page.url()).pathname; if (done.has(final)) continue; done.add(final); audited++;
        const note = (kind, extra) => issues.push({ kind, route: final, width, ...extra });
        if (response && response.status() >= 400) note('http', { sig: String(response.status()) });
        if (options.hide.length) await page.addStyleTag({ content: `${options.hide.join(',')}{display:none!important}` }).catch(() => {});
        await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
        await page.waitForTimeout(300);
        for (const hit of await page.evaluate(edgeCheck, { min: options.edge, badge: options.badge })) note('edge-at-rest', hit);
        const overflow = await page.evaluate(() => { const w = document.documentElement.clientWidth; return document.documentElement.scrollWidth > w ? [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > w + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('[aria-hidden="true"]')).slice(0, 3).map(el => el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => '.' + c).join('')) : null; });
        if (overflow) note('overflow-x', { sig: overflow.join(' ') || 'document' });
        for (const src of await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).map(i => i.currentSrc || i.src).slice(0, 5))) note('broken-image', { sig: src.slice(-80) });
        for (const c of [...new Set(consoleErrors)]) note('console-error', { sig: c.slice(0, 140) });
        for (const f of [...new Set(failed)]) note('failed-request', { sig: f.slice(0, 160) });
        // Text fit at the normal size, measured per element so a clipping shell cannot hide it.
        const walkPage = () => page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
        const fit = await page.evaluate(textFitCheck);
        for (const hit of fit.off) note('text-offscreen', hit);
        for (const hit of fit.squeezed) note('text-squeezed', hit);
        // Enlarged text on phone widths: reload for each case so the cases do not compound.
        if (width <= 500 && options.textScale.length) {
          for (const scale of options.textScale) {
            try { await page.goto(new URL(route, options.base).href, { waitUntil: 'networkidle', timeout: 60000 }); } catch { continue; }
            if (options.hide.length) await page.addStyleTag({ content: `${options.hide.join(',')}{display:none!important}` }).catch(() => {});
            await page.evaluate(applyTextScale, scale); await walkPage(); await page.waitForTimeout(150);
            const scaled = await page.evaluate(textFitCheck), detail = `at ${scale.kind} ×${scale.factor}`;
            for (const hit of scaled.off) note('large-text-offscreen', { ...hit, detail });
            for (const hit of scaled.squeezed) note('large-text-squeezed', { ...hit, detail });
          }
          if (width === widest) { await page.goto(new URL(route, options.base).href, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {}); await walkPage(); }
        }
        if (options.contrast && width === widest) for (const hit of await page.evaluate(contrastCheck)) note('low-contrast', hit);
        if (width !== widest) continue;
        // Hover: every element matched by a :hover rule, hovered in turn.
        const count = await page.evaluate(max => {
          const bases = new Set();
          const walk = rules => { for (const r of rules) { if (r.cssRules && !r.selectorText) walk(r.cssRules); if (r.selectorText?.includes(':hover')) for (const part of r.selectorText.split(',')) { const b = part.split(':hover')[0].replace(/:is\($|:where\($/, '').trim().replace(/\s*[>+~]\s*$/, ''); if (b && !/[(:]$/.test(b)) bases.add(b); } } };
          for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch {} }
          const els = new Set();
          for (const b of bases) { try { document.querySelectorAll(b).forEach(e => { if (e.getBoundingClientRect().width > 30 && !e.closest('[data-audit-ignore]')) els.add(e); }); } catch {} }
          return [...els].slice(0, max).map((e, i) => (e.setAttribute('data-audit-hover', String(i)), i)).length;
        }, options.maxHover);
        for (let i = 0; i < count; i++) {
          const target = page.locator(`[data-audit-hover="${i}"]`);
          try { await target.scrollIntoViewIfNeeded({ timeout: 2000 }); await target.hover({ timeout: 2000, force: true }); } catch { continue; }
          await page.waitForTimeout(260);
          for (const hit of await page.evaluate(edgeCheck, { min: options.edge, badge: options.badge, scope: `[data-audit-hover="${i}"]` })) note('edge-on-hover', hit);
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
      }
      await context.close();
    }
  } finally { await browser.close(); }
  return { audited, entries: aggregate(issues) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: audit:ui -- --base <origin> (--routes /,/contact | --routes-file <file> | --sitemap) [--widths 390,768,1440] [--sample "^/news/.+=3"] [--hide "#dev-panel"] [--edge 8] [--badge 3] [--max-hover 80] [--tabs 45] [--text-scale root:1.6,root:2,text:1.5,text:2|off] [--contrast] [--out report.json]\nEnlarged-text checks run at widths up to 500px. Mark deliberate exceptions in markup with data-audit-ignore. Git Bash: MSYS_NO_PATHCONV=1 when a route is "/".');
    else {
      const { audited, entries } = await audit(options);
      if (options.out) writeFileSync(options.out, JSON.stringify({ base: options.base, audited, entries }, null, 1) + '\n');
      console.log(formatReport(entries, audited));
      if (entries.length) process.exitCode = 2;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
