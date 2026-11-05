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
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_WIDTHS = [390, 768, 1440];

export function parseArgs(argv) {
  const out = { widths: DEFAULT_WIDTHS, frames: [0, 900, 1800], repeat: 2, hide: [] };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--base') out.base = value();
    else if (flag === '--routes') out.routes = value().split(',').map(r => r.trim()).filter(Boolean);
    else if (flag === '--widths') out.widths = value().split(',').map(Number);
    else if (flag === '--frames') out.frames = value().split(',').map(Number);
    else if (flag === '--repeat') out.repeat = Number(value());
    else if (flag === '--hide') out.hide = value().split(',').map(s => s.trim()).filter(Boolean);
    else if (flag === '--out') out.out = value();
    else if (flag === '--compare') { out.compare = [value(), value()]; }
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
          if (run === 0) writeFileSync(path.join(options.out, shotName(route, width, kind)), buffer);
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
      console.log('Usage: capture:routes -- --base <origin> --routes /,/contact --out <dir> [--widths 390,768,1440] [--frames 0,900,1800] [--repeat 2] [--hide "#dev-panel"]\n       capture:routes -- --compare <before-dir> <after-dir>\nGit Bash: prefix with MSYS_NO_PATHCONV=1 when a route is "/".');
    } else if (options.compare) {
      const [a, b] = options.compare.map(dir => { const file = path.join(dir, 'summary.json'); if (!existsSync(file)) throw Error('No summary.json in ' + dir); return JSON.parse(readFileSync(file, 'utf8')); });
      const result = compareSummaries(a, b);
      console.log(`identical ${result.identical.length} · changed ${result.changed.length} · non-deterministic ${result.nondeterministic.length} · missing ${result.missing.length}`);
      for (const k of ['changed', 'nondeterministic', 'missing']) for (const item of result[k]) console.log(`${k}: ${item}`);
      if (result.changed.length || result.missing.length) process.exitCode = 2;
    } else {
      const summary = await capture(options);
      for (const r of summary) console.log(`${r.width} ${r.status} ${r.route} ${r.kind}${r.overflowX ? ' OVERFLOW-X' : ''}${r.deterministic ? '' : ' NON-DETERMINISTIC'}`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
