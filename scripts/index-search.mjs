#!/usr/bin/env node
/**
 * Optional, profile-aware Pagefind post-build indexer.
 *
 *   npm run build && npm run search:index
 *   npm run search:index -- --source .emdash/snapshots/capture-<id>   (EmDash public export)
 *
 * Indexes only deliberately emitted public HTML: the static profiles' output,
 * EmDash prerendered client HTML, or an explicit anonymous SSR snapshot that is
 * newer than the release build. Server bundles, CMS/admin/setup routes, developer
 * fixtures, noindex pages and stale exports are refused or excluded. Pagefind is
 * an explicitly installed, exactly pinned devDependency of the site; nothing is
 * fetched or installed by this command.
 */
import fs from 'node:fs';
import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertReleaseArtifact } from './assert-release-artifact.mjs';

export const PAGEFIND_TESTED_VERSION = '1.6.0';
const CONFIG_RECEIPT = '.baseline-search.json';
const INDEX_RECEIPT = '.baseline-search-index.json';
const SNAPSHOT_MANIFEST = '.ssr-snapshot.json';

/** Path prefixes (relative to base) that are never public search content. */
export const ALWAYS_EXCLUDED_PREFIXES = Object.freeze([
  '/_emdash', '/_astro', '/_image', '/_server-islands', '/_styleguide', '/_primitives-fixture',
  '/_form-recovery', '/_fixtures', '/admin',
]);
const ERROR_PAGES = new Set(['/404', '/500']);

export class SearchIndexError extends Error {}

const fail = message => { throw new SearchIndexError(message); };

export function parseArgs(argv) {
  const args = { dist: 'dist', source: null, exclude: [], json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined || next.startsWith('--')) fail(`${arg} requires a value`);
      return next;
    };
    if (arg === '--dist') args.dist = value();
    else if (arg === '--source') args.source = value();
    else if (arg === '--exclude') args.exclude.push(normalizePrefix(value()));
    else if (arg === '--json') args.json = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else fail(`Unknown argument: ${arg}`);
  }
  return args;
}

function normalizePrefix(prefix) {
  const clean = '/' + String(prefix).trim().replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
  if (clean === '/' || clean.includes('..')) fail(`Invalid --exclude prefix "${prefix}"`);
  return clean;
}

/** Validates that the site declares Pagefind as an exact, explicitly selected devDependency. */
export function checkPagefindDeclaration(pkg) {
  const declared = pkg?.devDependencies?.pagefind;
  const install = `npm install --save-dev --save-exact pagefind@${PAGEFIND_TESTED_VERSION}`;
  if (pkg?.dependencies?.pagefind) fail(`pagefind must be a devDependency, not a runtime dependency. Move it with: ${install}`);
  if (!declared) fail(`Search indexing is optional and needs the Pagefind CLI installed explicitly:\n  ${install}`);
  if (!/^\d+\.\d+\.\d+$/.test(declared)) fail(`pagefind must be pinned to an exact version (found "${declared}"). Run: ${install}`);
  if (Number(declared.split('.')[0]) !== 1) fail(`pagefind ${declared} is unsupported; Baseline's search contract targets Pagefind 1.x (tested ${PAGEFIND_TESTED_VERSION}).`);
  return declared;
}

async function loadPagefind(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) fail(`No package.json in ${cwd}`);
  const declared = checkPagefindDeclaration(JSON.parse(await readFile(pkgPath, 'utf8')));
  // Pagefind exports an import-only entry and no ./package.json subpath, so
  // locate the site's own installation by walking node_modules from its root.
  let packageDir = null;
  for (let dir = path.resolve(cwd); ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', 'pagefind');
    if (fs.existsSync(path.join(candidate, 'package.json'))) { packageDir = candidate; break; }
    if (path.dirname(dir) === dir) break;
  }
  if (!packageDir) fail('pagefind is declared but not installed. Run npm ci (or npm install) first.');
  const manifest = JSON.parse(await readFile(path.join(packageDir, 'package.json'), 'utf8'));
  const installed = manifest.version;
  const target = manifest.exports?.['.']?.import ?? manifest.exports?.['.']?.default ?? manifest.main;
  const entry = typeof target === 'string' ? path.resolve(packageDir, target) : null;
  if (!entry || !inside(packageDir, entry) || !fs.existsSync(entry)) fail(`Cannot locate the pagefind ${installed} Node API entry in ${packageDir}.`);
  if (installed !== declared) fail(`Installed pagefind ${installed} does not match the pinned ${declared}. Run npm ci.`);
  return { pagefind: await import(pathToFileURL(entry).href), version: installed };
}

/** Maps an emitted HTML file (relative to the public directory) to its public route path, excluding base. */
export function routeForFile(relativeFile, trailingSlash = 'ignore') {
  const file = relativeFile.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!file.endsWith('.html')) return null;
  let route;
  if (file === 'index.html') route = '/';
  else if (file.endsWith('/index.html')) route = '/' + file.slice(0, -'index.html'.length);
  else route = '/' + file.slice(0, -'.html'.length);
  if (route !== '/' && route.endsWith('/') && trailingSlash === 'never') route = route.slice(0, -1);
  return route;
}

export function withBase(base, route) {
  const prefix = (base || '/').replace(/\/+$/, '');
  return (prefix + route) || '/';
}

/** Strips a base prefix from a captured URL path; returns null when outside base. */
export function withoutBase(base, urlPath) {
  const prefix = (base || '/').replace(/\/+$/, '');
  if (!prefix) return urlPath;
  if (urlPath === prefix) return '/';
  return urlPath.startsWith(prefix + '/') ? urlPath.slice(prefix.length) : null;
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find(v => v !== undefined);

export function documentLanguage(html) {
  const tag = html.match(/<html\b[^>]*>/i)?.[0];
  return (tag && attr(tag, 'lang')?.trim()) || null;
}

export function isNoindex(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = attr(tag, 'name')?.toLowerCase();
    if ((name === 'robots' || name === 'pagefind') && /\b(noindex|none)\b/i.test(attr(tag, 'content') ?? '')) return true;
  }
  return false;
}

/** Returns an exclusion reason for a route, or null when it is public content. */
export function exclusionReason(route, { bundlePath, exclude = [] } = {}) {
  const prefixes = [...ALWAYS_EXCLUDED_PREFIXES, ...(bundlePath ? ['/' + bundlePath] : []), ...exclude];
  const bare = route.length > 1 ? route.replace(/\/+$/, '') : route;
  if (ERROR_PAGES.has(bare)) return 'error-page';
  for (const prefix of prefixes) {
    if (bare === prefix || bare.startsWith(prefix + '/')) return `excluded-prefix:${prefix}`;
  }
  if (bare.split('/').some(segment => segment.startsWith('_') && segment.length > 1)) return 'underscore-route';
  return null;
}

function walkHtml(root, directory = root, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) walkHtml(root, full, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path.relative(root, full).replaceAll('\\', '/'));
  }
  return files.sort();
}

function inside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function collectBuildPages(publicDir, config) {
  const pages = [];
  for (const file of walkHtml(publicDir)) {
    const route = routeForFile(file, config.trailingSlash);
    if (route) pages.push({ route, read: () => readFile(path.join(publicDir, file), 'utf8'), origin: file });
  }
  return pages;
}

async function collectSnapshotPages(source, config, buildTime) {
  const manifestPath = path.join(source, SNAPSHOT_MANIFEST);
  if (!fs.existsSync(manifestPath)) fail(`${source} is not an anonymous SSR snapshot (missing ${SNAPSHOT_MANIFEST}). Create one with npm run audit:html against the fresh release build.`);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.resources)) fail(`Unrecognized ${SNAPSHOT_MANIFEST} format`);
  if (fs.existsSync(path.join(source, 'capture-error.txt'))) fail('Refusing a failed SSR capture (capture-error.txt present).');
  const captured = (await stat(manifestPath)).mtimeMs;
  if (captured < buildTime) fail('Refusing a stale public export: the SSR snapshot is older than the current release build. Capture it again with npm run audit:html.');
  const pages = [];
  for (const resource of manifest.resources) {
    if (resource.status !== 200 || !resource.file || resource.redirect) continue;
    const url = new URL(resource.url, 'http://snapshot.invalid');
    if (url.search) continue;
    const route = withoutBase(config.base, url.pathname);
    if (route === null) continue;
    const file = path.resolve(source, resource.file);
    if (!inside(source, file)) fail(`Snapshot resource escapes the snapshot directory: ${resource.file}`);
    pages.push({ route, read: () => readFile(file, 'utf8'), origin: resource.url });
  }
  return pages;
}

export async function indexSearch({ cwd = process.cwd(), dist = 'dist', source = null, exclude = [], pagefindLoader = loadPagefind } = {}) {
  const root = path.resolve(cwd);
  const artifact = path.resolve(root, dist);
  if (!fs.existsSync(artifact)) fail(`No build output at ${artifact}. Run npm run build first.`);
  // Fixture builds (developer specimens) never receive a deployable search index.
  await assertReleaseArtifact(artifact);
  const buildTime = (await stat(path.join(artifact, '.starter-build.json'))).mtimeMs;

  const configPath = path.join(artifact, CONFIG_RECEIPT);
  if (!fs.existsSync(configPath)) fail('Search is not configured for this build. Pass search: { engine: \'pagefind\', bundlePath: \'_pagefind\' } to baselineFeatures() in astro.config.mjs and rebuild.');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  if (config.version !== 1 || config.engine !== 'pagefind' || typeof config.bundlePath !== 'string') fail(`Unrecognized ${CONFIG_RECEIPT}; rebuild with the current Baseline integration.`);
  if (!config.bundlePath || /(^|\/)\.\.(\/|$)|^[a-z]:|\\/i.test(config.bundlePath)) fail(`Unsafe bundlePath "${config.bundlePath}"`);

  const publicDir = path.resolve(artifact, config.publicDir || '.');
  if (!inside(artifact, publicDir) || !fs.existsSync(publicDir)) fail(`Public output directory ${config.publicDir} is not inside the build output.`);
  if (config.output === 'server' && (publicDir === artifact)) fail('Server builds must expose a separate public client directory; refusing to index the server artifact.');
  const outputPath = path.resolve(publicDir, config.bundlePath);
  if (!inside(publicDir, outputPath) || outputPath === publicDir) fail(`bundlePath must name a subdirectory of the public output (got "${config.bundlePath}").`);

  let pages;
  let sourceKind;
  if (source) {
    if (config.output !== 'server') fail('--source is only for EmDash server builds; static profiles index their own emitted HTML.');
    const sourceDir = path.resolve(root, source);
    if (inside(artifact, sourceDir)) fail('The public export must live outside the build output.');
    pages = [...await collectBuildPages(publicDir, config), ...await collectSnapshotPages(sourceDir, config, buildTime)];
    sourceKind = 'prerendered+ssr-snapshot';
  } else {
    pages = await collectBuildPages(publicDir, config);
    sourceKind = config.output === 'server' ? 'prerendered' : 'static-output';
  }

  const excluded = [];
  const accepted = new Map();
  const languages = new Map();
  for (const page of pages) {
    let reason = exclusionReason(page.route, { bundlePath: config.bundlePath, exclude });
    let html;
    if (!reason) {
      html = await page.read();
      if (isNoindex(html)) reason = 'noindex';
    }
    if (reason) { excluded.push({ route: page.route, reason }); continue; }
    if (accepted.has(page.route)) continue;
    const lang = documentLanguage(html);
    languages.set(lang || 'unknown', (languages.get(lang || 'unknown') || 0) + 1);
    accepted.set(page.route, { url: withBase(config.base, page.route), html, lang });
  }

  if (accepted.size === 0) {
    if (config.output === 'server') fail('No public HTML to index. EmDash SSR routes are not indexed by scanning the build. Prerender public routes, or pass an explicit anonymous export: npm run audit:html, then npm run search:index -- --source <printed snapshot directory>.');
    fail('No public HTML pages found to index.');
  }

  const { pagefind, version } = await pagefindLoader(root);
  const warnings = [];
  try {
    const { errors, index } = await pagefind.createIndex({});
    if (errors?.length || !index) fail(`Pagefind could not create an index: ${errors?.join('; ')}`);
    for (const page of accepted.values()) {
      const added = await index.addHTMLFile({ url: page.url, content: page.html });
      if (added.errors?.length) fail(`Pagefind rejected ${page.url}: ${added.errors.join('; ')}`);
      if (!page.lang) warnings.push(`${page.url} has no <html lang>; Pagefind will index it as an unknown language.`);
    }
    // Remove a stale bundle only after every input was accepted.
    await rm(outputPath, { recursive: true, force: true });
    const written = await index.writeFiles({ outputPath });
    if (written.errors?.length) fail(`Pagefind could not write the bundle: ${written.errors.join('; ')}`);
  } finally {
    await pagefind.close?.();
  }

  if (!fs.existsSync(path.join(outputPath, 'pagefind.js'))) fail('Pagefind finished without writing pagefind.js.');
  const receipt = {
    version: 1,
    kind: 'search-index',
    engine: 'pagefind',
    pagefindVersion: version,
    profile: config.profile,
    base: config.base,
    bundlePath: config.bundlePath,
    bundleUrl: withBase(config.base, '/' + config.bundlePath + '/'),
    source: sourceKind,
    pages: accepted.size,
    languages: Object.fromEntries([...languages].sort()),
    excluded,
    warnings,
    indexedAt: new Date().toISOString(),
  };
  await writeFile(path.join(artifact, INDEX_RECEIPT), JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}

const HELP = `Usage: npm run search:index -- [--dist dist] [--source <ssr-snapshot-dir>] [--exclude /path]... [--json]

Builds a Pagefind index from the release build's public HTML after astro build.
Requires search in baselineFeatures() and an exact pagefind devDependency:
  npm install --save-dev --save-exact pagefind@${PAGEFIND_TESTED_VERSION}
EmDash: SSR routes are indexed only from an explicit anonymous export (--source).`;

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) { console.log(HELP); process.exit(0); }
    const receipt = await indexSearch(args);
    if (args.json) console.log(JSON.stringify(receipt, null, 2));
    else {
      console.log(`Indexed ${receipt.pages} public page(s) with Pagefind ${receipt.pagefindVersion} → ${receipt.bundleUrl} (${receipt.source}).`);
      console.log(`Languages: ${Object.entries(receipt.languages).map(([lang, n]) => `${lang} ${n}`).join(', ')}. Excluded: ${receipt.excluded.length}.`);
      for (const warning of receipt.warnings) console.warn(`Warning: ${warning}`);
    }
  } catch (error) {
    console.error(error instanceof SearchIndexError ? `search:index: ${error.message}` : error);
    process.exit(1);
  }
}
