#!/usr/bin/env node
// Route quality gates: the numbers a page can quietly lose while every functional check passes.
//
//   npm run check:quality -- --base http://127.0.0.1:4321 --sitemap
//   npm run check:quality -- --base http://127.0.0.1:4321 --routes /,/about --out ../evidence/quality.json
//   npm run check:quality -- --base http://127.0.0.1:4321 --sitemap --init     # write page-budget.json
//
// Run it against a built site (astro preview, wrangler dev, or a preview deployment), never the dev
// server: dev pages carry unbundled scripts and are much heavier than what ships.
//
// For every route it checks, in a fresh browser context so nothing comes from the cache:
// - weight (at the phone width, before any scrolling): the HTML document, all inline <style> blocks,
//   the scripts, the images, any single image and the largest-contentful-paint image when it is a
//   picture, against page-budget.json. Sizes are decoded kilobytes (the host compresses on the wire);
// - fonts: at most `fontPreloads` font preloads, each a woff2 under `fontFileKB`;
// - layout-shift: the largest session window of layout shifts (shifts under a second apart, at most
//   five seconds long, ignoring shifts right after input: how the browser scores CLS) while the page
//   loads and is scrolled to the end, at the phone and desktop widths. Chromium only;
// - first-viewport-hidden: an h1 or media element on the first screen that starts transparent
//   (opacity under 0.5 on itself or an ancestor) or clipped shut straight after load. It waits for a
//   script or transition before it can paint, which delays the largest paint and can leave a blank
//   first screen;
// - island: an <astro-island> (hydrated framework component) on a route the budget does not allow;
// - json-ld: a JSON-LD block that does not parse, or a route missing the schema.org types its budget
//   lists under `jsonLd`;
// - target-size (WCAG 2.2 SC 2.5.8, phone width): a control smaller than 24 by 24 CSS px whose
//   24px circle reaches another control. Links inside a sentence are exempt, as in the criterion;
// - focus-obscured (WCAG 2.2 SC 2.4.11): a control reached with Tab that is entirely covered (by a
//   sticky header, a cookie bar, a floating button) or entirely off screen, at both widths;
// - csp-violation: anything the page's Content-Security-Policy blocks or, in report-only mode,
//   would block (CSP_MODE in src/lib/content-security-policy.ts), at the phone width.
// Sideways overflow, invisible focus rings, broken images and console errors belong to audit:ui.
//
// THE BUDGET FILE. page-budget.json at the site root is the site's own: Baseline never ships or syncs
// it, and this script works without it on the defaults below. `limits` overrides defaults for every
// route, `pages["/gallery"]` overrides single keys for one route (with the reason in "_why"),
// `jsonLd` lists the schema.org types a route must carry ({ "/": ["Organization"] }) and `islands`
// lists the routes that may hydrate components. `--init` measures the routes and writes the file:
// each limit is the median route plus 25% (never below what the defaults allow), and a route above
// that gets its own entry with a "_why" to fill in. Tighten the numbers over time; a budget far above
// reality never fails.
//
// Exit 0 = within budget, 2 = issues, 1 = error. Read-only: it never submits forms or clicks links.
// Elements inside [data-quality-ignore] are skipped by the first-viewport, target and focus checks.
// Git Bash on Windows rewrites a lone "/" route: set MSYS_NO_PATHCONV=1.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseSitemap, sampleRoutes } from './audit-ui.mjs';
import { msysToNative } from './capture-routes.mjs';

export const DEFAULT_LIMITS = Object.freeze({
  htmlKB: 150,
  inlineCssKB: 40,
  scriptKB: 120,
  imagesKB: 600,
  imageKB: 400,
  lcpImageKB: 250,
  fontPreloads: 3,
  fontFileKB: 120,
  layoutShift: 0.05,
});
const LIMIT_KEYS = Object.keys(DEFAULT_LIMITS);
export const PHONE = Object.freeze({ width: 390, height: 844 });
export const DESKTOP = Object.freeze({ width: 1440, height: 900 });
export const BUDGET_FILE = 'page-budget.json';

export function parseArgs(argv) {
  const out = { routes: [], samples: [], tabs: 40, budget: BUDGET_FILE, init: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--base') out.base = value();
    else if (flag === '--routes') out.routes.push(...value().split(',').map(r => r.trim()).filter(Boolean));
    else if (flag === '--routes-file') out.routesFile = msysToNative(value());
    else if (flag === '--sitemap') out.sitemap = true;
    else if (flag === '--sample') { const [pattern, n] = value().split(/=(?=\d+$)/); out.samples.push({ pattern: new RegExp(pattern), keep: Number(n ?? 3) }); }
    else if (flag === '--budget') out.budget = msysToNative(value());
    else if (flag === '--tabs') out.tabs = Number(value());
    else if (flag === '--init') out.init = true;
    else if (flag === '--out') out.out = msysToNative(value());
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  if (!out.base || !/^https?:\/\/[^/]+\/?$/.test(out.base)) throw Error('--base must be an http(s) origin, for example http://127.0.0.1:4321');
  if (!out.routes.length && !out.routesFile && !out.sitemap) throw Error('Give --routes, --routes-file or --sitemap');
  for (const r of out.routes) {
    if (/^[A-Za-z]:[\\/]/.test(r)) throw Error(`Route "${r}" looks like a Windows path: Git Bash converted it. Re-run with MSYS_NO_PATHCONV=1.`);
    if (!r.startsWith('/')) throw Error(`Route "${r}" must start with /`);
  }
  if (!Number.isInteger(out.tabs) || out.tabs < 0 || out.tabs > 500) throw Error('--tabs must be a whole number from 0 to 500');
  return out;
}

const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Reads and validates a budget. Unknown limit keys are refused so a typo cannot silently fall back
// to a default; keys starting with "_" are comments.
export function parseBudget(text, source = BUDGET_FILE) {
  let data;
  try { data = JSON.parse(text); } catch (error) { throw Error(`${source} is not valid JSON: ${error.message}`); }
  if (!plainObject(data)) throw Error(`${source} must hold a JSON object`);
  const limitsOf = (object, where) => {
    if (object === undefined) return {};
    if (!plainObject(object)) throw Error(`${where} must be an object`);
    const limits = {};
    for (const [key, value] of Object.entries(object)) {
      if (key.startsWith('_')) continue;
      if (!LIMIT_KEYS.includes(key)) throw Error(`${where}.${key} is not a known limit (${LIMIT_KEYS.join(', ')})`);
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw Error(`${where}.${key} must be a non-negative number`);
      limits[key] = value;
    }
    return limits;
  };
  for (const key of Object.keys(data)) if (!key.startsWith('_') && !['limits', 'pages', 'jsonLd', 'islands'].includes(key)) throw Error(`${source}: unknown key "${key}"`);
  const pages = {};
  if (data.pages !== undefined) {
    if (!plainObject(data.pages)) throw Error(`${source}: pages must be an object`);
    for (const [route, entry] of Object.entries(data.pages)) {
      if (!route.startsWith('/')) throw Error(`${source}: page "${route}" must start with /`);
      pages[normalRoute(route)] = limitsOf(entry, `pages["${route}"]`);
    }
  }
  const jsonLd = {};
  if (data.jsonLd !== undefined) {
    if (!plainObject(data.jsonLd)) throw Error(`${source}: jsonLd must be an object`);
    for (const [route, types] of Object.entries(data.jsonLd)) {
      if (!Array.isArray(types) || types.some(t => typeof t !== 'string' || !t)) throw Error(`${source}: jsonLd["${route}"] must be a list of type names`);
      jsonLd[normalRoute(route)] = types;
    }
  }
  if (data.islands !== undefined && (!Array.isArray(data.islands) || data.islands.some(r => typeof r !== 'string' || !r.startsWith('/')))) throw Error(`${source}: islands must be a list of routes`);
  return { limits: limitsOf(data.limits, 'limits'), pages, jsonLd, islands: (data.islands ?? []).map(normalRoute) };
}

// Routes compare without a trailing slash (except the root), so "/about" and "/about/" match.
export function normalRoute(route) {
  const pathOnly = String(route).split(/[?#]/)[0] || '/';
  return pathOnly.length > 1 ? pathOnly.replace(/\/+$/, '') : '/';
}

export function limitsFor(budget, route) {
  return { ...DEFAULT_LIMITS, ...(budget?.limits ?? {}), ...(budget?.pages?.[normalRoute(route)] ?? {}) };
}

// The largest session window, as Chromium scores cumulative layout shift.
export function largestShiftWindow(shifts) {
  let best = 0, current = 0, windowStart = -Infinity, last = -Infinity;
  for (const shift of [...shifts].sort((a, b) => a.startTime - b.startTime)) {
    if (shift.hadRecentInput) continue;
    if (shift.startTime - last > 1000 || shift.startTime - windowStart > 5000) { current = 0; windowStart = shift.startTime; }
    current += shift.value;
    last = shift.startTime;
    best = Math.max(best, current);
  }
  return Math.round(best * 10000) / 10000;
}

// schema.org types anywhere in a JSON-LD value (@graph, nested objects, type lists).
export function jsonLdTypes(value, found = new Set()) {
  if (Array.isArray(value)) for (const item of value) jsonLdTypes(item, found);
  else if (plainObject(value)) {
    const type = value['@type'];
    for (const t of Array.isArray(type) ? type : [type]) if (typeof t === 'string') found.add(t.replace(/^https?:\/\/schema\.org\//, ''));
    for (const [key, child] of Object.entries(value)) if (key !== '@type') jsonLdTypes(child, found);
  }
  return found;
}

// WCAG 2.5.8 spacing exception: an undersized target passes when a 24px circle centred on it
// intersects no other target and no other undersized target's circle.
export function crowdedTargets(targets, min = 24) {
  const small = t => t.width < min - 0.5 || t.height < min - 0.5;
  const centre = t => ({ x: t.x + t.width / 2, y: t.y + t.height / 2 });
  const distanceToRect = (p, r) => Math.hypot(Math.max(r.x - p.x, 0, p.x - (r.x + r.width)), Math.max(r.y - p.y, 0, p.y - (r.y + r.height)));
  const failures = [];
  targets.forEach((target, i) => {
    if (!small(target)) return;
    const c = centre(target);
    const neighbour = targets.find((other, j) => j !== i && (distanceToRect(c, other) < min / 2 || (small(other) && Math.hypot(c.x - centre(other).x, c.y - centre(other).y) < min)));
    if (neighbour) failures.push({ ...target, neighbour: neighbour.sig });
  });
  return failures;
}

const kb = bytes => Math.round(bytes / 102.4) / 10;
const median = values => { const s = [...values].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
const roundUp = (value, step) => Math.ceil(value / step) * step;

// Weight issues for one route's measurements against its limits.
export function weightIssues(route, m, limits) {
  const issues = [];
  const over = (kind, value, limit, detail) => { if (value > limit) issues.push({ kind, route, value, limit, detail }); };
  over('html-weight', m.htmlKB, limits.htmlKB, 'HTML document, decoded KB');
  over('inline-css-weight', m.inlineCssKB, limits.inlineCssKB, 'inline <style> blocks together, KB');
  over('script-weight', m.scriptKB, limits.scriptKB, 'scripts loaded, decoded KB');
  over('images-weight', m.imagesKB, limits.imagesKB, 'images loaded before scrolling, decoded KB');
  if (m.largestImage) over('image-weight', m.largestImage.kb, limits.imageKB, m.largestImage.url);
  if (m.lcpImage) over('lcp-image-weight', m.lcpImage.kb, limits.lcpImageKB, m.lcpImage.url);
  over('font-preloads', m.fontPreloads.length, limits.fontPreloads, m.fontPreloads.map(f => f.url).join(', '));
  for (const font of m.fontPreloads) {
    if (!/\.woff2(?:[?#]|$)/i.test(font.url)) issues.push({ kind: 'font-preload-format', route, value: font.url, limit: 'woff2', detail: 'preload only woff2 fonts' });
    if (font.kb > limits.fontFileKB) issues.push({ kind: 'font-preload-weight', route, value: font.kb, limit: limits.fontFileKB, detail: font.url });
  }
  return issues;
}

// A budget written from measurements: the median route plus 25% (never below the defaults), with an
// entry for each route above that.
export function initBudget(measurements, existing = null) {
  const step = { htmlKB: 10, inlineCssKB: 5, scriptKB: 10, imagesKB: 50, imageKB: 50, lcpImageKB: 25 };
  const valueOf = (m, key) => key === 'imageKB' ? m.largestImage?.kb ?? 0 : key === 'lcpImageKB' ? m.lcpImage?.kb ?? 0 : m[key];
  const limits = { ...DEFAULT_LIMITS };
  for (const key of Object.keys(step)) limits[key] = Math.max(DEFAULT_LIMITS[key], roundUp(median(measurements.map(m => valueOf(m, key))) * 1.25, step[key]));
  const pages = {};
  for (const m of measurements) {
    const own = {};
    for (const key of Object.keys(step)) { const value = valueOf(m, key); if (value > limits[key]) own[key] = roundUp(value * 1.25, step[key]); }
    if (Object.keys(own).length) pages[m.route] = { _why: `Set by --init from what this page weighed (${Object.entries(own).map(([k]) => `${k} ${valueOf(m, k)}`).join(', ')}). Say why it must be heavier, or make it lighter.`, ...own };
  }
  return {
    _comment: 'The site\'s own page budget for npm run check:quality (decoded KB; layoutShift is a CLS score). limits apply to every route, pages override keys for one route with the reason in _why, jsonLd lists the schema.org types a route must carry, islands lists routes that may hydrate components. Tighten it over time.',
    limits,
    pages: { ...(existing?.pages ?? {}), ...pages },
    jsonLd: existing?.jsonLd ?? {},
    islands: existing?.islands ?? [],
  };
}

export function formatIssue(issue) {
  const where = issue.width ? `${issue.route} @${issue.width}` : issue.route;
  const amount = issue.limit !== undefined ? ` ${issue.value} > ${issue.limit}` : issue.value !== undefined ? ` ${issue.value}` : '';
  return `${issue.kind.padEnd(22)} ${where}${amount}${issue.detail ? `  (${issue.detail})` : ''}`;
}

// ---------------------------------------------------------------------------------------------
// In-page measurements. Each runs inside the browser and returns plain data.

function observeLayout() {
  window.__qualityShifts = [];
  window.__qualityLcp = null;
  window.__qualityCsp = [];
  document.addEventListener('securitypolicyviolation', e => {
    const source = e.sourceFile ? `${e.sourceFile.replace(/^https?:\/\/[^/]+/, '')}:${e.lineNumber}` : '';
    window.__qualityCsp.push({ disposition: e.disposition, directive: e.effectiveDirective, blocked: e.blockedURI || 'inline', source });
  });
  try {
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.__qualityShifts.push({ value: e.value, startTime: e.startTime, hadRecentInput: e.hadRecentInput }); }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => { const all = list.getEntries(); const e = all[all.length - 1]; if (e) window.__qualityLcp = { url: e.url || '', element: e.element ? e.element.tagName.toLowerCase() : '' }; }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
}

function firstViewportHidden() {
  const ignored = el => el.closest('[data-quality-ignore], dialog:not([open]), [aria-hidden="true"], [inert]');
  const sig = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  const out = [];
  for (const el of document.querySelectorAll('h1, img, picture, video, canvas, iframe')) {
    if (ignored(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const s = getComputedStyle(node);
      // Clipped shut: an inset of half or more from one side pair, or a zero circle.
      const clipped = /^inset\(\s*(?:[5-9]\d|100)%|^circle\(\s*0(?:px|%)?[\s)]/.test(s.clipPath || '');
      if (Number(s.opacity) < 0.5 || clipped) { out.push({ sig: sig(el), cause: node === el ? (clipped ? 'clip-path' : `opacity ${s.opacity}`) : `${clipped ? 'clip-path' : `opacity ${s.opacity}`} on ${sig(node)}` }); break; }
    }
  }
  return out;
}

function targetBoxes() {
  const sig = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '') + (el.textContent?.trim() ? ` "${el.textContent.trim().slice(0, 24)}"` : el.getAttribute('aria-label') ? ` [${el.getAttribute('aria-label').slice(0, 24)}]` : '');
  const inSentence = el => {
    if (el.tagName !== 'A' || getComputedStyle(el).display !== 'inline') return false;
    const block = el.parentElement?.closest('p, li, dd, td, blockquote, figcaption, label') ?? el.parentElement;
    if (!block) return false;
    const own = (el.textContent ?? '').trim().length;
    return (block.textContent ?? '').trim().length > own + 3;
  };
  const out = [];
  for (const el of document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="tab"]')) {
    if (el.closest('[data-quality-ignore], [aria-hidden="true"], [inert]')) continue;
    if (el.closest('details:not([open])') && !(el.tagName === 'SUMMARY' && el.parentElement?.tagName === 'DETAILS')) continue;
    if (el.matches('input[type="checkbox"], input[type="radio"]') && el.labels?.length) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (inSentence(el)) continue;
    out.push({ sig: sig(el), x: r.x + scrollX, y: r.y + scrollY, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 });
  }
  return out;
}

function focusedVisibility() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement || el.closest('[data-quality-ignore]')) return null;
  const sig = el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '') + (el.textContent?.trim() ? ` "${el.textContent.trim().slice(0, 24)}"` : '');
  let points = 0, seen = 0, cover = '';
  for (const r of el.getClientRects()) {
    const x0 = Math.max(0, r.left), x1 = Math.min(innerWidth, r.right), y0 = Math.max(0, r.top), y1 = Math.min(innerHeight, r.bottom);
    if (x1 - x0 < 1 || y1 - y0 < 1) continue;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      points++;
      const hit = document.elementFromPoint(x0 + (x1 - x0) * (i + 0.5) / 5, y0 + (y1 - y0) * (j + 0.5) / 5);
      if (hit && (hit === el || el.contains(hit) || hit.contains(el))) seen++;
      else if (hit && !cover) cover = hit.tagName.toLowerCase() + (hit.id ? '#' + hit.id : hit.classList.length ? '.' + [...hit.classList].slice(0, 2).join('.') : '');
    }
  }
  return { sig, points, seen, cover };
}

// ---------------------------------------------------------------------------------------------

async function loadChromium() {
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { return createRequire(base)('@playwright/test').chromium; } catch {} }
  throw Error('check:quality needs @playwright/test and an installed Chromium (npx playwright install chromium).');
}

async function settle(page, ms = 600) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(ms);
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.round(innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise(r => setTimeout(r, 400));
  });
}

async function tabThrough(page, route, width, tabs, issues) {
  const seen = new Set();
  for (let i = 0; i < tabs; i++) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(focusedVisibility);
    if (!state) { if (i > 0) break; continue; }
    if (seen.has(state.sig)) break;
    seen.add(state.sig);
    if (state.seen === 0) issues.push({ kind: 'focus-obscured', route, width, value: state.sig, detail: state.points ? `covered by ${state.cover || 'another element'}` : 'off screen' });
  }
}

// Measures one route at the phone width (weight, fonts, JSON-LD, islands, first viewport, targets,
// focus, layout shift), then at the desktop width (first viewport, focus, layout shift).
export async function measureRoute(browser, base, route, { tabs = 40 } = {}) {
  const url = new URL(route, base).href;
  const issues = [];
  const measurement = { route };
  for (const viewport of [PHONE, DESKTOP]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const responses = [];
    page.on('response', response => responses.push(response));
    await page.addInitScript(observeLayout);
    let documentResponse;
    try { documentResponse = await page.goto(url, { waitUntil: 'load', timeout: 60000 }); }
    catch (error) { issues.push({ kind: 'load-failed', route, width: viewport.width, value: String(error.message).split('\n')[0] }); await context.close(); continue; }
    if (!documentResponse || documentResponse.status() >= 400) { issues.push({ kind: 'http', route, width: viewport.width, value: documentResponse?.status() ?? 'no response' }); await context.close(); continue; }
    for (const hidden of await page.evaluate(firstViewportHidden)) issues.push({ kind: 'first-viewport-hidden', route, width: viewport.width, value: hidden.sig, detail: hidden.cause });
    await settle(page);
    if (viewport === PHONE) {
      const sizes = await Promise.all(responses.map(async r => {
        let bytes = 0;
        try { bytes = (await r.body()).length; } catch {}
        return { url: r.url(), type: r.request().resourceType(), status: r.status(), bytes };
      }));
      const ok = sizes.filter(s => s.status >= 200 && s.status < 300 && !s.url.startsWith('data:'));
      const images = ok.filter(s => s.type === 'image');
      const largest = images.reduce((a, b) => (b.bytes > (a?.bytes ?? -1) ? b : a), null);
      const page_ = await page.evaluate(() => ({
        inlineCss: [...document.querySelectorAll('style')].reduce((n, s) => n + (s.textContent?.length ?? 0), 0),
        fontPreloads: [...document.querySelectorAll('link[rel~="preload"][as="font"]')].map(l => l.href),
        islands: document.querySelectorAll('astro-island').length,
        jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent ?? ''),
        lcp: window.__qualityLcp,
      }));
      const sizeOf = href => ok.find(s => s.url === href)?.bytes ?? 0;
      const lcpUrl = page_.lcp?.url && !page_.lcp.url.startsWith('data:') ? page_.lcp.url : null;
      Object.assign(measurement, {
        htmlKB: kb(Buffer.byteLength(await documentResponse.text().catch(() => ''))),
        inlineCssKB: kb(page_.inlineCss),
        scriptKB: kb(ok.filter(s => s.type === 'script').reduce((n, s) => n + s.bytes, 0)),
        imagesKB: kb(images.reduce((n, s) => n + s.bytes, 0)),
        largestImage: largest ? { url: largest.url, kb: kb(largest.bytes) } : null,
        lcpImage: lcpUrl ? { url: lcpUrl, kb: kb(sizeOf(lcpUrl)) } : null,
        fontPreloads: page_.fontPreloads.map(href => ({ url: href, kb: kb(sizeOf(href)) })),
        islands: page_.islands,
      });
      const types = new Set();
      page_.jsonLd.forEach((text, index) => {
        try { jsonLdTypes(JSON.parse(text), types); } catch (error) { issues.push({ kind: 'json-ld', route, value: `block ${index + 1} does not parse`, detail: String(error.message).slice(0, 80) }); }
      });
      measurement.jsonLdTypes = [...types].sort();
      // Report-only violations fire the same event, so a site can clear them before enforcing.
      for (const v of await page.evaluate(() => window.__qualityCsp ?? [])) issues.push({ kind: 'csp-violation', route, value: `${v.directive} ${v.blocked}`, detail: `${v.disposition === 'report' ? 'report-only' : 'blocked'}${v.source ? ` at ${v.source}` : ''}` });
      for (const target of crowdedTargets(await page.evaluate(targetBoxes))) issues.push({ kind: 'target-size', route, width: viewport.width, value: `${target.sig} ${target.width}x${target.height}`, detail: `24px circle reaches ${target.neighbour}` });
    }
    await page.evaluate(() => scrollTo(0, 0));
    await tabThrough(page, route, viewport.width, tabs, issues);
    await page.evaluate(() => { document.activeElement?.blur?.(); scrollTo(0, 0); });
    await scrollThrough(page);
    const shift = largestShiftWindow(await page.evaluate(() => window.__qualityShifts ?? []));
    measurement[viewport === PHONE ? 'layoutShiftPhone' : 'layoutShiftDesktop'] = shift;
    await context.close();
  }
  return { measurement, issues };
}

// Issues that depend on the budget, added to the browser findings.
export function budgetIssues(measurement, budget) {
  const limits = limitsFor(budget, measurement.route);
  const issues = measurement.htmlKB === undefined ? [] : weightIssues(measurement.route, measurement, limits);
  for (const [key, width] of [['layoutShiftPhone', PHONE.width], ['layoutShiftDesktop', DESKTOP.width]]) {
    if (measurement[key] > limits.layoutShift) issues.push({ kind: 'layout-shift', route: measurement.route, width, value: measurement[key], limit: limits.layoutShift });
  }
  if (measurement.islands > 0 && !budget?.islands?.includes(normalRoute(measurement.route))) issues.push({ kind: 'island', route: measurement.route, value: `${measurement.islands} <astro-island>`, detail: 'hydrated component on a route the budget does not list under islands' });
  const required = budget?.jsonLd?.[normalRoute(measurement.route)] ?? [];
  const missing = required.filter(t => !measurement.jsonLdTypes?.includes(t));
  if (missing.length) issues.push({ kind: 'json-ld', route: measurement.route, value: `missing ${missing.join(', ')}`, detail: `found ${measurement.jsonLdTypes?.join(', ') || 'none'}` });
  return issues;
}

export async function checkQuality(options, hooks = {}) {
  const chromium = await loadChromium();
  let routes = [...options.routes];
  if (options.routesFile) routes.push(...readFileSync(options.routesFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s.startsWith('/')));
  if (options.sitemap) {
    const fetchMap = async p => parseSitemap(await (await fetch(new URL(p, options.base))).text());
    const top = await fetchMap('/sitemap.xml');
    if (top.isIndex) for (const child of top.locs) routes.push(...(await fetchMap(child)).locs); else routes.push(...top.locs);
  }
  routes = sampleRoutes(routes, options.samples);
  if (!routes.length) throw Error('No routes to check');
  const budgetPath = options.budget ?? BUDGET_FILE;
  const budget = existsSync(budgetPath) ? parseBudget(readFileSync(budgetPath, 'utf8'), budgetPath) : null;
  const browser = await chromium.launch();
  const measurements = [], issues = [];
  try {
    for (const [index, route] of routes.entries()) {
      const result = await measureRoute(browser, options.base, route, { tabs: options.tabs });
      measurements.push(result.measurement);
      issues.push(...result.issues, ...(options.init ? [] : budgetIssues(result.measurement, budget)));
      hooks.progress?.(`${index + 1}/${routes.length} ${route}`);
    }
  } finally { await browser.close(); }
  const written = options.init ? initBudget(measurements.filter(m => m.htmlKB !== undefined), budget) : null;
  return { routes, budget: budget ? budgetPath : null, measurements, issues, written };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run check:quality -- --base http://127.0.0.1:4321 (--sitemap | --routes /,/about | --routes-file routes.txt) [--sample "^/posts/=3"] [--budget page-budget.json] [--tabs 40] [--init] [--out report.json]');
    return;
  }
  const result = await checkQuality(options, { progress: line => process.stderr.write(line + '\n') });
  if (options.out) writeFileSync(options.out, JSON.stringify({ base: options.base, ...result }, null, 2) + '\n');
  if (result.written) {
    const target = options.budget ?? BUDGET_FILE;
    writeFileSync(target, JSON.stringify(result.written, null, 2) + '\n');
    console.log(`Wrote ${target} from ${result.measurements.length} routes. Fill in each "_why", then commit it.`);
  }
  const unique = [...new Map(result.issues.map(i => [formatIssue(i), i])).values()];
  console.log(`Quality: ${result.routes.length} routes${result.budget ? ` against ${result.budget}` : ' on the default limits'}, ${unique.length} issue${unique.length === 1 ? '' : 's'}.`);
  for (const issue of unique) console.log('  ' + formatIssue(issue));
  if (unique.length) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
