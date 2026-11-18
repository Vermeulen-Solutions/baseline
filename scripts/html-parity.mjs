#!/usr/bin/env node
// Rendered-HTML parity: did a change that should not alter the markup leave it alone?
//
//   npm run parity:html -- capture --base http://127.0.0.1:4321 --sitemap --out ../evidence/html-before
//   (update Baseline files, refactor a component, upgrade a dependency; rebuild and serve)
//   npm run parity:html -- capture --base http://127.0.0.1:4321 --sitemap --out ../evidence/html-after
//   npm run parity:html -- compare ../evidence/html-before ../evidence/html-after
//
// Screenshots (capture:routes) show what changed on screen; this shows which markup changed, so an
// update can be checked for silent differences in headings, links, attributes, metadata or JSON-LD
// that leave the pixels alone. Capture fetches each route's HTML twice; a route whose two responses
// differ after normalizing is marked non-deterministic and compared anyway, with that warning.
//
// Normalizing removes what changes on every build without changing the page: hashed asset names
// under /_astro/ (name.Ab12Cd34.css becomes name.css), Astro's scoped-style ids (data-astro-cid-*),
// island and server-island ids, nonces and integrity hashes, and whitespace between tags. Each tag
// goes on its own line so a diff names the element. --ignore <regex> (repeatable) replaces other
// changing text, for example a footer year or a build stamp, with [ignored].
//
// compare prints one unified diff per changed route and, with --out, writes them as .diff files.
// Exit 0 = identical, 2 = differences, 1 = error. Keep captures outside Git: they hold page content.
// Git Bash on Windows rewrites a lone "/" route: set MSYS_NO_PATHCONV=1.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseSitemap, sampleRoutes } from './audit-ui.mjs';
import { msysToNative } from './capture-routes.mjs';

export function parseArgs(argv) {
  const [mode, ...rest] = argv;
  const out = { mode, routes: [], samples: [], ignore: [], dirs: [] };
  if (mode === '--help' || mode === '-h' || mode === undefined) return { help: true };
  if (!['capture', 'compare'].includes(mode)) throw Error('First argument must be capture or compare');
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i], value = () => { const v = rest[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--base') out.base = value();
    else if (flag === '--routes') out.routes.push(...value().split(',').map(r => r.trim()).filter(Boolean));
    else if (flag === '--routes-file') out.routesFile = msysToNative(value());
    else if (flag === '--sitemap') out.sitemap = true;
    else if (flag === '--sample') { const [pattern, n] = value().split(/=(?=\d+$)/); out.samples.push({ pattern: new RegExp(pattern), keep: Number(n ?? 3) }); }
    else if (flag === '--ignore') out.ignore.push(value());
    else if (flag === '--out') out.out = msysToNative(value());
    else if (!flag.startsWith('--') && mode === 'compare') out.dirs.push(msysToNative(flag));
    else throw Error('Unknown option: ' + flag);
  }
  for (const pattern of out.ignore) { try { new RegExp(pattern, 'g'); } catch { throw Error(`--ignore "${pattern}" is not a regular expression`); } }
  if (mode === 'capture') {
    if (!out.base || !/^https?:\/\/[^/]+\/?$/.test(out.base)) throw Error('--base must be an http(s) origin, for example http://127.0.0.1:4321');
    if (!out.routes.length && !out.routesFile && !out.sitemap) throw Error('Give --routes, --routes-file or --sitemap');
    if (!out.out) throw Error('capture needs --out <folder>');
    for (const r of out.routes) {
      if (/^[A-Za-z]:[\\/]/.test(r)) throw Error(`Route "${r}" looks like a Windows path: Git Bash converted it. Re-run with MSYS_NO_PATHCONV=1.`);
      if (!r.startsWith('/')) throw Error(`Route "${r}" must start with /`);
    }
  } else if (out.dirs.length !== 2) throw Error('compare needs two capture folders: compare <before> <after>');
  return out;
}

// One file name per route: "/" is index, "/posts/hello/" is posts~hello, and a query keeps its text.
export function routeFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  return (clean ? clean.replace(/\//g, '~').replace(/[^A-Za-z0-9._~?=&-]/g, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).replace(/[?=&]/g, c => ({ '?': '@', '=': '+', '&': ',' })[c]) : 'index') + '.html';
}

export function normalizeHTML(html, ignore = []) {
  let text = String(html).replace(/\r\n?/g, '\n');
  for (const pattern of ignore) text = text.replace(new RegExp(pattern, 'g'), '[ignored]');
  text = text
    .replace(/(\/_astro\/[^"'\s?#)]*?)\.[A-Za-z0-9_-]{8}(\.[a-z0-9]+)(?=["'\s?#)])/g, '$1$2')
    .replace(/\sdata-astro-cid-[a-z0-9]+(?:="[^"]*")?/g, '')
    .replace(/(<astro-island\b[^>]*?)\suid="[^"]*"/g, '$1')
    .replace(/(<astro-island\b[^>]*?)\s(?:component-url|renderer-url|before-hydration-url)="([^"]*)"/g, (m, start, url) => `${start} url="${url}"`)
    .replace(/\s(?:nonce|integrity)="[^"]*"/g, '')
    .replace(/'sha(?:256|384|512)-[A-Za-z0-9+/=]+'/g, "'sha-hash'")
    .replace(/<!--\[if[\s\S]*?endif\]-->|<!--\s*-->/g, '');
  return text.replace(/>\s+</g, '><').replace(/></g, '>\n<').replace(/[ \t]+\n/g, '\n').trim() + '\n';
}

// A unified diff between two texts, labelled with the route.
export function diffText(route, before, after) {
  if (before === after) return '';
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'html-parity-'));
  try {
    fs.writeFileSync(path.join(temporary, 'a'), before);
    fs.writeFileSync(path.join(temporary, 'b'), after);
    const diff = spawnSync('git', ['diff', '--no-index', '--no-color', '--', 'a', 'b'], { cwd: temporary, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return diff.stdout.replace(/^diff --git a\/a b\/b\n(?:index [^\n]*\n)?/m, `diff ${route}\n`).replace(/^--- a\/a$/m, `--- before ${route}`).replace(/^\+\+\+ b\/b$/m, `+++ after ${route}`);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}

export async function capture(options, fetchImpl = fetch, progress = () => {}) {
  let routes = [...options.routes];
  if (options.routesFile) routes.push(...fs.readFileSync(options.routesFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s.startsWith('/')));
  if (options.sitemap) {
    const fetchMap = async p => parseSitemap(await (await fetchImpl(new URL(p, options.base))).text());
    const top = await fetchMap('/sitemap.xml');
    if (top.isIndex) for (const child of top.locs) routes.push(...(await fetchMap(child)).locs); else routes.push(...top.locs);
  }
  routes = sampleRoutes(routes, options.samples);
  if (!routes.length) throw Error('No routes to capture');
  fs.mkdirSync(options.out, { recursive: true });
  const records = [];
  for (const route of routes) {
    const get = async () => { const response = await fetchImpl(new URL(route, options.base), { redirect: 'manual', headers: { accept: 'text/html' } }); return { status: response.status, location: response.headers.get('location'), html: normalizeHTML(await response.text(), options.ignore) }; };
    const first = await get(), second = await get();
    const file = routeFile(route);
    fs.writeFileSync(path.join(options.out, file), first.html);
    records.push({ route, file, status: first.status, location: first.location, deterministic: first.html === second.html && first.status === second.status });
    progress(`${records.length}/${routes.length} ${route} ${first.status}${records.at(-1).deterministic ? '' : ' (changes between requests)'}`);
  }
  fs.writeFileSync(path.join(options.out, 'parity.json'), JSON.stringify({ base: options.base, ignore: options.ignore, routes: records }, null, 2) + '\n');
  return records;
}

export function compare(beforeDir, afterDir) {
  const read = dir => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'parity.json'), 'utf8')); } catch { throw Error(`${dir} has no parity.json: capture it first`); } };
  const before = read(beforeDir), after = read(afterDir);
  const byRoute = list => new Map(list.routes.map(r => [r.route, r]));
  const a = byRoute(before), b = byRoute(after);
  const results = [];
  for (const route of [...new Set([...a.keys(), ...b.keys()])]) {
    const x = a.get(route), y = b.get(route);
    if (!x || !y) { results.push({ route, state: x ? 'missing-after' : 'missing-before' }); continue; }
    const diff = diffText(route, fs.readFileSync(path.join(beforeDir, x.file), 'utf8'), fs.readFileSync(path.join(afterDir, y.file), 'utf8'));
    const status = x.status !== y.status || x.location !== y.location ? `status ${x.status}${x.location ? ` → ${x.location}` : ''} became ${y.status}${y.location ? ` → ${y.location}` : ''}` : null;
    results.push({ route, state: diff || status ? 'changed' : 'same', status, diff, unstable: !x.deterministic || !y.deterministic });
  }
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { console.log('Usage: npm run parity:html -- capture --base <origin> (--sitemap | --routes /,/about | --routes-file f) --out <folder> [--ignore <regex>]\n       npm run parity:html -- compare <before> <after> [--out <diff folder>]'); return; }
  if (options.mode === 'capture') {
    const records = await capture(options, fetch, line => process.stderr.write(line + '\n'));
    console.log(`Captured ${records.length} routes to ${options.out}.`);
    return;
  }
  const results = compare(...options.dirs);
  const changed = results.filter(r => r.state !== 'same');
  for (const r of changed) {
    console.log(`${r.state.padEnd(14)} ${r.route}${r.status ? `  (${r.status})` : ''}${r.unstable ? '  [changes between requests: compare with care]' : ''}`);
    if (r.diff) process.stdout.write(r.diff);
    if (options.out && r.diff) { fs.mkdirSync(options.out, { recursive: true }); fs.writeFileSync(path.join(options.out, routeFile(r.route).replace(/\.html$/, '.diff')), r.diff); }
  }
  console.log(`HTML parity: ${results.length - changed.length} of ${results.length} routes unchanged.`);
  if (changed.length) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
