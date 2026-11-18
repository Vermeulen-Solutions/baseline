// Baseline-owned code in a built site: what is current, behind, edited or missing, and adopting it.
//
//   npm run site:files -- --site <path> [--files a,b] [--apply] [--json]
//
// Run from this Baseline checkout. Candidates are the files Baseline ships to the site's platform
// (profiles/file-inventory.json) under src/components, src/lib, src/layouts, src/dev, scripts and
// tests, minus what the site owns (Base.astro, pages, content, config, global.css). Skills are not
// handled here: sync:site-skills keeps their receipts and backups. Each file is compared with
// Baseline's committed HEAD, line endings ignored:
// - current: the site has Baseline's bytes;
// - behind: the site has a version Baseline once committed, or the version recorded the last time
//   this tool adopted it, so nobody edited it there and it can be replaced;
// - edited: the site changed it. It is never replaced; Baseline's version is written beside the
//   site's own under .baseline/incoming/<commit>/ to merge by hand;
// - missing: Baseline has it and the site does not. Adopted only when named with --files, because a
//   new file usually needs wiring;
// - blocked: the incoming version imports a local file or package the site does not have (and that
//   this run does not bring along).
// --apply copies the behind files (and the named missing ones), keeps each replaced original under
// .baseline/backups/<commit>/, and records every current or adopted file with its hash and commit in
// .baseline/owned-files.json, so the next run knows the site never touched them. Nothing else is
// written. Line endings follow Baseline's committed (LF) bytes; Git normalizes them on commit.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { argumentsOf, isMain } from './infrastructure-io.mjs';
import { ownershipOf } from './init-profile.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const RECEIPT = '.baseline/owned-files.json';
const CODE = /^(?:src\/(?:components|lib|layouts|dev)\/|scripts\/|tests\/)/;
const hash = value => createHash('sha256').update(value).digest('hex');
const lf = bytes => bytes.includes(0) ? bytes : Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'));
const git = (args, input) => execFileSync('git', ['-C', ROOT, ...args], { encoding: input === undefined ? 'buffer' : 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });

/** The site's platform: an EmDash dependency, else the static profile from baseline.config.json. */
export function platformOf(site) {
  const pkg = JSON.parse(fs.readFileSync(path.join(site, 'package.json'), 'utf8'));
  if ({ ...pkg.dependencies, ...pkg.devDependencies }.emdash) return 'emdash';
  const config = path.join(site, 'baseline.config.json');
  return fs.existsSync(config) && JSON.parse(fs.readFileSync(config, 'utf8')).platformProfile === 'static-sveltia' ? 'static-sveltia' : 'static';
}

/** Baseline source path → site target for every shipped code file of a platform. */
export function candidates(inventory, platform) {
  const result = [];
  for (const [source, record] of Object.entries(inventory.files)) {
    const kinds = platform === 'emdash' ? ['shared', 'emdash-only'] : ['shared', 'static-overlay', ...(platform === 'static-sveltia' ? ['static-sveltia-overlay'] : [])];
    if (!kinds.includes(record.disposition)) continue;
    if (platform !== 'emdash' && record.disposition === 'shared' && record.static !== 'copy') continue;
    const target = record.target ?? source;
    if (!CODE.test(target) || ownershipOf(target) !== 'shared') continue;
    result.push({ source, target });
  }
  return result.sort((a, b) => a.target.localeCompare(b.target));
}

function blobKnown(bytes) {
  const blob = git(['hash-object', '--stdin'], bytes.toString('utf8')).trim();
  try { return Boolean(git(['log', '-1', '--format=%H', `--find-object=${blob}`, 'HEAD']).toString().trim()); } catch { return false; }
}

/** Local imports and packages the incoming bytes need that the site lacks. */
export function missingImports(target, incoming, has, declared) {
  if (!/\.(?:astro|[cm]?js|ts|css)$/.test(target)) return [];
  const reasons = [];
  for (const [, specifier] of incoming.toString('utf8').matchAll(/(?:\b(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?|\bimport\s*\(\s*|@import\s+)["']([^"']+)["']/g)) {
    if (/^(?:node:|astro:|virtual:|https?:|data:|#|\/)/.test(specifier)) continue;
    if (specifier.startsWith('.')) {
      const relative = path.posix.normalize(path.posix.join(path.posix.dirname(target), specifier.split(/[?#]/)[0]));
      const options = path.posix.extname(relative) ? [relative] : [relative, ...['.ts', '.js', '.mjs', '.astro', '/index.ts', '/index.js'].map(ext => relative + ext)];
      if (!options.some(has)) reasons.push('local ' + specifier);
    } else {
      const name = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
      if (!declared.has(name)) reasons.push('package ' + name);
    }
  }
  return [...new Set(reasons)];
}

export function plan(site, { files = [] } = {}) {
  const inventory = JSON.parse(git(['show', 'HEAD:profiles/file-inventory.json']).toString('utf8'));
  const commit = git(['rev-parse', 'HEAD']).toString().trim();
  const platform = platformOf(site);
  const receiptFile = path.join(site, RECEIPT);
  const receipt = fs.existsSync(receiptFile) ? JSON.parse(fs.readFileSync(receiptFile, 'utf8')) : { schemaVersion: 1, files: {} };
  const pkg = JSON.parse(fs.readFileSync(path.join(site, 'package.json'), 'utf8'));
  const declared = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
  const all = candidates(inventory, platform);
  const unknown = files.filter(file => !all.some(entry => entry.target === file));
  if (unknown.length) throw Error('Not a Baseline-owned code file for this platform: ' + unknown.join(', '));
  const entries = all.map(({ source, target }) => {
    const incoming = git(['show', `HEAD:${source}`]);
    const local = path.join(site, target);
    if (!fs.existsSync(local)) return { source, target, status: 'missing', incoming };
    const current = lf(fs.readFileSync(local));
    if (current.equals(incoming)) return { source, target, status: 'current', incoming };
    const recorded = receipt.files?.[target]?.sha256 === hash(current);
    return { source, target, status: recorded || blobKnown(current) ? 'behind' : 'edited', incoming };
  });
  const adopting = new Set(entries.filter(entry => entry.status === 'behind' || entry.status === 'missing' && files.includes(entry.target)).map(entry => entry.target));
  const has = file => adopting.has(file) || fs.existsSync(path.join(site, file));
  // Blocking one file can block another that imports it, in any order: repeat until nothing changes.
  for (let changed = true; changed;) {
    changed = false;
    for (const entry of entries) {
      if (!adopting.has(entry.target)) continue;
      const needs = missingImports(entry.target, entry.incoming, has, declared);
      if (needs.length) { entry.status = 'blocked'; entry.needs = needs; adopting.delete(entry.target); changed = true; }
    }
  }
  return { site, platform, commit, entries, adopting: [...adopting].sort(), receipt };
}

export function apply(result) {
  const { site, commit, entries, adopting, receipt } = result;
  const short = commit.slice(0, 12);
  const write = (file, bytes) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); };
  const written = [];
  for (const entry of entries) {
    if (entry.status === 'edited') write(path.join(site, '.baseline/incoming', short, entry.target), entry.incoming);
    if (!adopting.includes(entry.target)) continue;
    const local = path.join(site, entry.target);
    if (fs.existsSync(local)) write(path.join(site, '.baseline/backups', short, entry.target), fs.readFileSync(local));
    write(local, entry.incoming); written.push(entry.target);
  }
  receipt.schemaVersion = 1;
  receipt.baseline = { repository: 'https://github.com/Vermeulen-Solutions/baseline', commit };
  receipt.files ??= {};
  for (const entry of entries) {
    if (entry.status === 'current' || written.includes(entry.target)) receipt.files[entry.target] = { source: entry.source, sha256: hash(entry.incoming), commit: entry.status === 'current' && receipt.files[entry.target]?.sha256 === hash(entry.incoming) ? receipt.files[entry.target].commit : commit };
  }
  receipt.files = Object.fromEntries(Object.entries(receipt.files).sort(([a], [b]) => a.localeCompare(b)));
  write(path.join(site, RECEIPT), JSON.stringify(receipt, null, 2) + '\n');
  return written;
}

function summary(result) {
  const groups = {};
  for (const entry of result.entries) (groups[entry.status] ??= []).push(entry.needs ? `${entry.target} (needs ${entry.needs.join(', ')})` : entry.target);
  return { site: result.site, platform: result.platform, baseline: result.commit, adopting: result.adopting, ...Object.fromEntries(Object.entries(groups).map(([status, list]) => [status, status === 'current' ? list.length : list])) };
}

if (isMain(import.meta.url)) {
  try {
    const args = argumentsOf(process.argv.slice(2), ['--site', '--files'], ['--apply', '--json', '--help']);
    if (args.help || !args.site) { console.log('site:files -- --site <path> [--files a,b] [--apply] [--json]'); process.exitCode = args.help ? 0 : 1; }
    else {
      const result = plan(path.resolve(args.site), { files: args.files ? args.files.split(',').map(file => file.trim()).filter(Boolean) : [] });
      const report = summary(result);
      if (args.apply) report.written = apply(result);
      console.log(args.json ? JSON.stringify(report, null, 2) : Object.entries(report).map(([key, value]) => `${key}: ${Array.isArray(value) ? (value.length ? '\n  ' + value.join('\n  ') : '-') : value}`).join('\n'));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
