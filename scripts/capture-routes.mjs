#!/usr/bin/env node
// Before/after route evidence for updates and visual work (found in a real-site rehearsal).
//
//   npm run capture:routes -- --base http://127.0.0.1:4321 --routes /,/contact --out ../evidence/before
//   npm run capture:routes -- --base http://127.0.0.1:4321 --routes /,/contact --out ../evidence/after
//   npm run capture:routes -- --compare ../evidence/before ../evidence/after
//
// Each capture walks the page so lazy media loads, waits for fonts and decoded images, uses
// reduced motion, and saves a full page plus viewport frames at scroll positions (fixed
// backgrounds and sticky layers only render truthfully in viewport frames). Every route is
// captured twice; a route whose two captures differ is reported as non-deterministic so a
// comparison does not mistake random content for a regression. Keep evidence outside Git.
// Git Bash on Windows rewrites a lone "/" argument into a Windows path: set MSYS_NO_PATHCONV=1.
// That also stops Git Bash converting directory arguments, so /c/... directories are translated
// to C:/... here. Concept overlays for a refinement: --css <file[,file]> injects stylesheets into
// every capture (use one --out per variant) and --click <selector[,selector]> clicks controls
// such as a rotation's pause button first. --compare reports the bounding box of differing pixels.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_WIDTHS = [390, 768, 1440];

// Git Bash with MSYS_NO_PATHCONV=1 leaves "/c/Users/..." untouched, and Node on Windows would
// write it to C:\c\Users\... Translate MSYS drive paths for directory arguments.
export function msysToNative(p, platform = process.platform) {
  const match = platform === 'win32' && /^\/([A-Za-z])(\/|$)(.*)$/.exec(p);
  return match ? `${match[1].toUpperCase()}:/${match[3]}` : p;
}

export function parseArgs(argv) {
  const out = { widths: DEFAULT_WIDTHS, frames: [0, 900, 1800], repeat: 2, hide: [], css: [], click: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--base') out.base = value();
    else if (flag === '--routes') out.routes = value().split(',').map(r => r.trim()).filter(Boolean);
    else if (flag === '--widths') out.widths = value().split(',').map(Number);
    else if (flag === '--frames') out.frames = value().split(',').map(Number);
    else if (flag === '--repeat') out.repeat = Number(value());
    else if (flag === '--hide') out.hide = value().split(',').map(s => s.trim()).filter(Boolean);
    else if (flag === '--css') out.css = value().split(',').map(s => msysToNative(s.trim())).filter(Boolean);
    else if (flag === '--click') out.click = value().split(',').map(s => s.trim()).filter(Boolean);
    else if (flag === '--out') out.out = msysToNative(value());
    else if (flag === '--compare') { out.compare = [msysToNative(value()), msysToNative(value())]; }
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help || out.compare) return out;
  if (!out.base || !/^https?:\/\//.test(out.base)) throw Error('--base must be an http(s) origin, for example http://127.0.0.1:4321');
  if (!out.routes?.length) throw Error('--routes needs a comma-separated list such as /,/contact');
  for (const r of out.routes) {
    if (/^[A-Za-z]:[\\/]/.test(r)) throw Error(`Route "${r}" looks like a Windows path: Git Bash converted it. Re-run with MSYS_NO_PATHCONV=1.`);
    if (!r.startsWith('/')) throw Error(`Route "${r}" must start with /`);
  }
  if (!out.out) throw Error('--out <directory> is required (keep evidence outside the repository or gitignore it)');
  for (const file of out.css) if (!existsSync(file)) throw Error(`--css file not found: ${file}`);
  if (out.widths.some(w => !Number.isInteger(w) || w < 200 || w > 3840)) throw Error('--widths must be integers between 200 and 3840');
  if (out.frames.some(y => !Number.isInteger(y) || y < 0)) throw Error('--frames must be non-negative integers');
  if (!Number.isInteger(out.repeat) || out.repeat < 1 || out.repeat > 3) throw Error('--repeat must be 1, 2 or 3');
  return out;
}

export const routeSlug = route => route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/[^A-Za-z0-9._-]+/g, '_') || 'home';
export const shotName = (route, width, kind) => `${routeSlug(route)}-${width}-${kind}.png`;
export const sha = buffer => createHash('sha256').update(buffer).digest('hex');

// A route is deterministic when every repeated capture of every shot has the same hash.
export function summarize(records) {
  const byKey = new Map();
  for (const r of records) { const key = `${r.route}|${r.width}|${r.kind}`; (byKey.get(key) ?? byKey.set(key, []).get(key)).push(r); }
  return [...byKey.values()].map(group => ({ ...group[0], sha: group[0].sha, deterministic: group.every(r => r.sha === group[0].sha) }));
}

// Bounding box of pixels that differ between two PNGs (sizes may differ: the extra area counts).
export async function diffBox(fileA, fileB, threshold = 16) {
  const { default: sharp } = await import('sharp');
  const [a, b] = await Promise.all([fileA, fileB].map(file => sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  const w = Math.max(a.info.width, b.info.width), h = Math.max(a.info.height, b.info.height);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  const px = (img, x, y) => x < img.info.width && y < img.info.height ? (y * img.info.width + x) * 4 : -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = px(a, x, y), j = px(b, x, y);
    const differs = i < 0 || j < 0 || Math.abs(a.data[i] - b.data[j]) > threshold || Math.abs(a.data[i + 1] - b.data[j + 1]) > threshold || Math.abs(a.data[i + 2] - b.data[j + 2]) > threshold;
    if (differs) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  }
  return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, sizes: [`${a.info.width}x${a.info.height}`, `${b.info.width}x${b.info.height}`] };
}

// Compares two summary.json files: identical, changed, non-deterministic (either side), missing.
export function compareSummaries(before, after) {
  const key = r => `${r.route}|${r.width}|${r.kind}`, a = new Map(before.map(r => [key(r), r])), b = new Map(after.map(r => [key(r), r]));
  const result = { identical: [], changed: [], nondeterministic: [], missing: [] };
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(k), y = b.get(k);
    if (!x || !y) result.missing.push(k);
    else if (!x.deterministic || !y.deterministic) result.nondeterministic.push(k);
    else (x.sha === y.sha ? result.identical : result.changed).push(k);
  }
  return result;
}

async function capture(options) {
  const { createRequire } = await import('node:module');
  // Prefer the target site's Playwright; fall back to this tooling checkout's (run from Baseline against any site).
  let chromium;
  for (const base of [path.join(process.cwd(), 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(base)('@playwright/test')); break; } catch {} }
  if (!chromium) throw Error('capture:routes needs @playwright/test and an installed Chromium (npx playwright install chromium).');
  mkdirSync(options.out, { recursive: true });
  const browser = await chromium.launch(), records = [];
  try {
    for (const width of options.widths) {
      const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      for (const route of options.routes) for (let run = 0; run < options.repeat; run++) {
        const response = await page.goto(new URL(route, options.base).href, { waitUntil: 'networkidle', timeout: 90000 });
        if (options.hide.length) await page.addStyleTag({ content: `${options.hide.join(',')}{display:none!important}` });
        for (const file of options.css) await page.addStyleTag({ content: readFileSync(file, 'utf8') });
        for (const selector of options.click) { const target = page.locator(selector).first(); if (await target.count()) await target.click(); }
        await page.evaluate(async () => {
          await document.fonts.ready;
          for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
          document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
          await Promise.all([...document.images].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; setTimeout(r, 8000); })));
          await Promise.all([...document.images].map(img => img.decode().catch(() => null)));
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(500);
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        const shots = [['full', () => page.screenshot({ fullPage: true })]];
        for (const y of options.frames) if (y === 0 || y < height) shots.push([`frame-${y}`, async () => { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(250); return page.screenshot(); }]);
        for (const [kind, take] of shots) {
          const buffer = await take();
          const first = records.find(r => r.route === route && r.width === width && r.kind === kind);
          if (run === 0) writeFileSync(path.join(options.out, shotName(route, width, kind)), buffer);
          // Keep a differing repeat so --compare can show where a non-deterministic page changes.
          else if (first && first.sha !== sha(buffer)) writeFileSync(path.join(options.out, shotName(route, width, kind).replace(/\.png$/, `-run${run + 1}.png`)), buffer);
          records.push({ route, width, kind, status: response?.status() ?? null, height, overflowX, sha: sha(buffer) });
        }
      }
      await context.close();
    }
  } finally { await browser.close(); }
  const summary = summarize(records);
  writeFileSync(path.join(options.out, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log('Usage: capture:routes -- --base <origin> --routes /,/contact --out <dir> [--widths 390,768,1440] [--frames 0,900,1800] [--repeat 2] [--hide "#dev-panel"] [--css overlay.css] [--click "[data-pause]"]\n       capture:routes -- --compare <before-dir> <after-dir>\nGit Bash: prefix with MSYS_NO_PATHCONV=1 when a route is "/".');
    } else if (options.compare) {
      const [a, b] = options.compare.map(dir => { const file = path.join(dir, 'summary.json'); if (!existsSync(file)) throw Error('No summary.json in ' + dir); return JSON.parse(readFileSync(file, 'utf8')); });
      const result = compareSummaries(a, b);
      console.log(`identical ${result.identical.length} · changed ${result.changed.length} · non-deterministic ${result.nondeterministic.length} · missing ${result.missing.length}`);
      const fileFor = (dir, key, suffix = '') => { const [route, width, kind] = key.split('|'); return path.join(dir, shotName(route, Number(width), kind).replace(/\.png$/, `${suffix}.png`)); };
      const describe = box => box ? ` (differs at x=${box.x} y=${box.y}, ${box.width}x${box.height}; sizes ${box.sizes.join(' → ')})` : '';
      for (const k of ['changed', 'nondeterministic', 'missing']) for (const item of result[k]) {
        let box = null;
        try {
          if (k === 'changed') box = await diffBox(fileFor(options.compare[0], item), fileFor(options.compare[1], item));
          if (k === 'nondeterministic') for (const dir of options.compare) { const second = fileFor(dir, item, '-run2'); if (existsSync(second)) { box = await diffBox(fileFor(dir, item), second); break; } }
        } catch { box = null; }
        console.log(`${k}: ${item}${describe(box)}`);
      }
      if (result.changed.length || result.missing.length) process.exitCode = 2;
    } else {
      const summary = await capture(options);
      for (const r of summary) console.log(`${r.width} ${r.status} ${r.route} ${r.kind}${r.overflowX ? ' OVERFLOW-X' : ''}${r.deterministic ? '' : ' NON-DETERMINISTIC'}`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
