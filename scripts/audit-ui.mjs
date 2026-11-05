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
// - overflow-x, broken-image, http, console-error and failed-request.
// Exit 0 = clean, 2 = issues, 1 = error. Read-only: it never submits forms or clicks links.
// Git Bash on Windows rewrites a lone "/" route: set MSYS_NO_PATHCONV=1.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative } from './capture-routes.mjs';

export const DEFAULT_WIDTHS = [390, 768, 1440];

export function parseArgs(argv) {
  const out = { widths: DEFAULT_WIDTHS, samples: [], hide: [], edge: 8, badge: 3, maxHover: 80, tabs: 45, routes: [] };
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
    for (const e of list) lines.push(`  ${e.sig}${e.gap !== undefined ? ` (text ${e.gap}px from edge: L${e.left} R${e.right} T${e.top})` : ''}${e.text ? ` "${e.text}"` : ''}${e.detail ? ' ' + e.detail : ''} — ${e.where.length}×: ${e.where.slice(0, 3).join(', ')}`);
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
    if (options.help) console.log('Usage: audit:ui -- --base <origin> (--routes /,/contact | --routes-file <file> | --sitemap) [--widths 390,768,1440] [--sample "^/news/.+=3"] [--hide "#dev-panel"] [--edge 8] [--badge 3] [--max-hover 80] [--tabs 45] [--out report.json]\nMark deliberate exceptions in markup with data-audit-ignore. Git Bash: MSYS_NO_PATHCONV=1 when a route is "/".');
    else {
      const { audited, entries } = await audit(options);
      if (options.out) writeFileSync(options.out, JSON.stringify({ base: options.base, audited, entries }, null, 1) + '\n');
      console.log(formatReport(entries, audited));
      if (entries.length) process.exitCode = 2;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
