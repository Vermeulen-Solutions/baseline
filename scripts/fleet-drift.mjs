// Site changes to Baseline-owned files: what a site improved that Baseline has never had.
//
//   npm run fleet:drift -- --config <private fleet.json> --out <private folder> [--site <id>]
//
// For every site in the fleet list it reads the Baseline-owned skills (not the EmDash or Impeccable
// mirrors, whose fixes belong upstream) and the pinned helpers (standards-distribution.mjs), and sorts
// each file it finds:
// - known: the file equals a version Baseline has had at some commit (the site is current, behind, or
//   synced from an unreleased commit). Nothing to do here; fleet:status reports lag;
// - changed: Baseline has the path, but never with this content. The site changed it locally;
// - added: Baseline never had the path (a reference or helper a site wrote for itself).
// Changed and added files are candidates to bring back into Baseline. For each one it writes a
// patch against Baseline's copy at the site's adopted release (fleet.json "adopted.standards"), or
// at this checkout when the site records none or the release lacks the file, and a DRIFT.md that
// lists them per site.
//
// It never opens a pull request and never writes into Baseline or a site. Patches carry site content,
// and Baseline is public: --out must be outside this checkout, and a person or agent decides what
// belongs in Baseline and rewrites it without client names. Line endings are compared as LF, so a
// Windows checkout's CRLF copy of an unchanged file counts as known. No network.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { argumentsOf, isMain } from './infrastructure-io.mjs';
import { loadFleet } from './fleet-status.mjs';
import { PINNED_TOOLS } from './standards-distribution.mjs';
import { sources } from './skill-sync.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const SKILLS = '.agents/skills';
const IGNORED = [/(^|\/)node_modules\//, /(^|\/)\.DS_Store$/, /^\.agents\/skills\/[^/]+\/scripts\/bin\//];

// Bytes as fileHash in standards-distribution.mjs sees them: UTF-8 text with CRLF as LF, else raw.
export function normalizedText(bytes) {
  if (bytes.includes(0)) return null;
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes).replaceAll('\r\n', '\n'); }
  catch { return null; }
}
export function contentHash(bytes) {
  const text = normalizedText(bytes);
  return createHash('sha256').update(text ?? bytes).digest('hex');
}

// Skills Baseline writes itself: everything under .agents/skills except the upstream mirrors.
export function ownedSkills(baselineRoot = root) {
  const mirrors = new Set([...sources.emdash.skills, 'impeccable']);
  return fs.readdirSync(path.join(baselineRoot, SKILLS), { withFileTypes: true }).filter(e => e.isDirectory() && !mirrors.has(e.name)).map(e => e.name).sort();
}

// Every content hash each path has had in Baseline's history, from one `git log --raw` and one
// `git cat-file --batch` pass. -m includes merge commits, where a conflict resolution can create a version.
export function historyHashes(baselineRoot, pathspecs) {
  const raw = execFileSync('git', ['-C', baselineRoot, 'log', '--all', '-m', '--format=', '--raw', '--no-abbrev', '--no-renames', '--', ...pathspecs], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const blobsByPath = new Map();
  for (const line of raw.split('\n')) {
    const match = /^:\d+ \d+ ([0-9a-f]{40}) ([0-9a-f]{40}) \w+\t(.+)$/.exec(line);
    if (!match) continue;
    const [, before, after, file] = match;
    const set = blobsByPath.get(file) ?? new Set();
    for (const blob of [before, after]) if (!/^0+$/.test(blob)) set.add(blob);
    blobsByPath.set(file, set);
  }
  const blobs = [...new Set([...blobsByPath.values()].flatMap(set => [...set]))];
  const hashes = new Map();
  if (blobs.length) {
    const out = execFileSync('git', ['-C', baselineRoot, 'cat-file', '--batch'], { input: blobs.join('\n') + '\n', maxBuffer: 1024 * 1024 * 1024 });
    let offset = 0;
    while (offset < out.length) {
      const end = out.indexOf(10, offset);
      const [sha, type, size] = out.subarray(offset, end).toString('utf8').split(' ');
      if (type !== 'blob') { offset = end + 1; continue; }
      const start = end + 1, length = Number(size);
      hashes.set(sha, contentHash(out.subarray(start, start + length)));
      offset = start + length + 1;
    }
  }
  const result = new Map();
  for (const [file, set] of blobsByPath) result.set(file, new Set([...set].map(blob => hashes.get(blob)).filter(Boolean)));
  return result;
}

function walkFiles(dir, base, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name), rel = path.posix.join(base, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) walkFiles(full, rel, out);
    else if (!IGNORED.some(rule => rule.test(rel))) out.push(rel);
  }
  return out;
}

// Sorts one site's copies of Baseline-owned files into known, changed and added.
export function classifySite(siteDir, history, skills, tools = PINNED_TOOLS) {
  const files = [...skills.flatMap(skill => walkFiles(path.join(siteDir, SKILLS, skill), `${SKILLS}/${skill}`)), ...tools.filter(tool => fs.existsSync(path.join(siteDir, tool)))];
  const result = { known: [], changed: [], added: [] };
  for (const file of files.sort()) {
    const known = history.get(file);
    if (!known) { result.added.push(file); continue; }
    (known.has(contentHash(fs.readFileSync(path.join(siteDir, file)))) ? result.known : result.changed).push(file);
  }
  return result;
}

// Baseline's copy of a path at a release's certified commit, or at this checkout.
function baselineCopy(baselineRoot, file, commit) {
  if (commit) {
    const shown = spawnSync('git', ['-C', baselineRoot, 'show', `${commit}:${file}`], { maxBuffer: 64 * 1024 * 1024 });
    if (shown.status === 0) return { bytes: shown.stdout, from: commit.slice(0, 12) };
  }
  const local = path.join(baselineRoot, file);
  return fs.existsSync(local) ? { bytes: fs.readFileSync(local), from: 'checkout' } : { bytes: Buffer.alloc(0), from: 'none' };
}

// A unified diff from Baseline's copy to the site's, both as LF text, labelled with the real path.
export function patchFor(file, baselineBytes, siteBytes) {
  const before = normalizedText(baselineBytes), after = normalizedText(siteBytes);
  if (before === null || after === null) return `Binary file ${file} differs\n`;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-drift-'));
  try {
    fs.writeFileSync(path.join(temporary, 'a'), before);
    fs.writeFileSync(path.join(temporary, 'b'), after);
    const diff = spawnSync('git', ['diff', '--no-index', '--no-color', '--', 'a', 'b'], { cwd: temporary, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return diff.stdout.replace(/^diff --git a\/a b\/b$/m, `diff --git a/${file} b/${file}`).replace(/^--- a\/a$/m, `--- a/${file}`).replace(/^\+\+\+ b\/b$/m, `+++ b/${file}`);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}

export function releaseCommit(baselineRoot, version) {
  if (!version) return null;
  try { return JSON.parse(fs.readFileSync(path.join(baselineRoot, 'standards/baselines', `${version}.json`), 'utf8')).certification?.sourceCommit ?? null; }
  catch { return null; }
}

const inside = (child, parent) => { const rel = path.relative(parent, child); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); };

export function fleetDrift({ config, out, site: only = null, baselineRoot = root }) {
  const outDir = path.resolve(out);
  if (inside(outDir, path.resolve(baselineRoot))) throw new Error('--out must be outside the Baseline checkout: patches carry site content and Baseline is public');
  const sites = loadFleet(path.resolve(config)).filter(site => !only || site.id === only);
  if (only && !sites.length) throw new Error(`no site with id ${only}`);
  for (const site of sites) if (inside(outDir, site.path)) throw new Error(`--out must be outside the site checkout of ${site.id}`);
  const skills = ownedSkills(baselineRoot);
  const history = historyHashes(baselineRoot, [SKILLS, ...PINNED_TOOLS]);
  const report = [];
  for (const site of sites) {
    if (!fs.existsSync(site.path)) { report.push({ id: site.id, missing: true }); continue; }
    const classified = classifySite(site.path, history, skills);
    const commit = releaseCommit(baselineRoot, site.record?.adopted?.standards);
    const patches = [];
    for (const file of [...classified.changed, ...classified.added]) {
      const base = baselineCopy(baselineRoot, file, commit);
      const target = path.join(outDir, site.id, `${file}.patch`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, patchFor(file, base.bytes, fs.readFileSync(path.join(site.path, file))));
      patches.push({ file, against: base.from, patch: path.relative(outDir, target).replaceAll('\\', '/') });
    }
    report.push({ id: site.id, adopted: site.record?.adopted?.standards ?? null, known: classified.known.length, changed: classified.changed, added: classified.added, patches });
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'DRIFT.md'), formatDrift(report));
  return report;
}

export function formatDrift(report) {
  const lines = ['# Site changes to Baseline-owned files', '', 'Generated by `npm run fleet:drift`. Each patch shows what a site changed in a Baseline-owned skill or helper, against Baseline\'s copy at the site\'s adopted release. Decide per patch: bring the improvement into Baseline (rewritten without client names, with a change note), or record it as a deliberate site difference. Patches carry site content: keep this folder private.', ''];
  for (const site of report) {
    lines.push(`## ${site.id}`, '');
    if (site.missing) { lines.push('Checkout not found.', ''); continue; }
    lines.push(`Adopted release: ${site.adopted ?? 'not recorded (compared with the Baseline checkout)'}. ${site.known} file${site.known === 1 ? '' : 's'} match a Baseline version.`, '');
    if (!site.patches.length) { lines.push('No local changes.', ''); continue; }
    lines.push('| File | Kind | Compared with | Patch |', '| --- | --- | --- | --- |');
    for (const p of site.patches) lines.push(`| \`${p.file}\` | ${site.added.includes(p.file) ? 'added' : 'changed'} | ${p.against} | [patch](${p.patch.split('/').map(encodeURIComponent).join('/')}) |`);
    lines.push('');
  }
  return lines.join('\n');
}

if (isMain(import.meta.url)) {
  try {
    const args = argumentsOf(process.argv.slice(2), ['--config', '--out', '--site'], []);
    if (!args.config || !args.out) throw new Error('Usage: npm run fleet:drift -- --config <private fleet.json> --out <private folder> [--site <id>]');
    const report = fleetDrift({ config: args.config, out: args.out, site: args.site ?? null });
    for (const site of report) console.log(site.missing ? `${site.id}: checkout not found` : `${site.id}: ${site.changed.length} changed, ${site.added.length} added, ${site.known} known`);
    console.log(`Wrote ${path.join(path.resolve(args.out), 'DRIFT.md')}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
