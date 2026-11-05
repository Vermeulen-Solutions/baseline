#!/usr/bin/env node
// Classifies upstream changes for a reviewed existing-site update (found in a real-site rehearsal,
// where 178 changed paths had to be compared by hand). Run from a Baseline checkout:
//
//   npm run update:plan -- --site ../my-site --since <previously adopted sha> [--to <sha>] [--json]
//
// For every path changed upstream between --since and --to it reports one of:
//   current         the site already has the --to bytes
//   adoptable       the site still has an older upstream version (unchanged locally): safe to adopt
//   site-modified   the site's copy matches no upstream version in the range: review by hand
//   missing         the site does not have the path (new upstream file, or never adopted)
//   removed         deleted upstream; the site still has it
// Line endings are normalized before comparing. Read-only: nothing in the site or checkout changes.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { msysToNative } from './capture-routes.mjs';

const MAX_FILE = 8 * 1024 * 1024;
export const fingerprint = bytes => {
  const text = bytes.includes(0) ? bytes : Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'));
  return createHash('sha256').update(text).digest('hex');
};

export function parseArgs(argv) {
  const out = { to: 'HEAD', json: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--help' || flag === '-h') out.help = true;
    else if (flag === '--site') out.site = msysToNative(value());
    else if (flag === '--since') out.since = value();
    else if (flag === '--to') out.to = value();
    else if (flag === '--repo') out.repo = msysToNative(value());
    else if (flag === '--json') out.json = true;
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  if (!out.site) throw Error('--site <path to the site> is required');
  if (!out.since || !/^[\w./-]+$/.test(out.since)) throw Error('--since <previously adopted Baseline commit> is required');
  if (!/^[\w./-]+$/.test(out.to)) throw Error('--to must be a commit or ref');
  return out;
}

export function planUpdate({ repo = process.cwd(), site, since, to = 'HEAD' }) {
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { maxBuffer: 64 * 1024 * 1024 });
  const resolved = { since: git('rev-parse', '--verify', `${since}^{commit}`).toString().trim(), to: git('rev-parse', '--verify', `${to}^{commit}`).toString().trim() };
  const changed = git('diff', '--name-status', '--no-renames', resolved.since, resolved.to).toString().trim().split('\n').filter(Boolean).map(line => { const [status, ...rest] = line.split('\t'); return { status, path: rest.join('\t') }; });
  const blobAt = (commit, file) => { try { return git('show', `${commit}:${file}`); } catch { return null; } };
  const rows = [];
  for (const { status, path: file } of changed) {
    const local = path.join(site, file);
    const present = existsSync(local) && statSync(local).isFile();
    if (status === 'D') { if (present) rows.push({ path: file, state: 'removed' }); continue; }
    if (!present) { rows.push({ path: file, state: 'missing' }); continue; }
    if (statSync(local).size > MAX_FILE) { rows.push({ path: file, state: 'site-modified', note: 'too large to compare' }); continue; }
    const mine = fingerprint(readFileSync(local));
    const target = blobAt(resolved.to, file);
    if (target && fingerprint(target) === mine) { rows.push({ path: file, state: 'current' }); continue; }
    const history = [resolved.since, ...git('log', '--format=%H', `${resolved.since}..${resolved.to}`, '--', file).toString().trim().split('\n').filter(Boolean).reverse()];
    const match = history.find(commit => { const old = blobAt(commit, file); return old && fingerprint(old) === mine; });
    rows.push(match ? { path: file, state: 'adoptable', matches: match.slice(0, 7) } : { path: file, state: 'site-modified' });
  }
  const counts = Object.fromEntries(['current', 'adoptable', 'site-modified', 'missing', 'removed'].map(state => [state, rows.filter(row => row.state === state).length]));
  return { since: resolved.since, to: resolved.to, site: path.resolve(site), counts, rows };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: update:plan -- --site <site path> --since <adopted sha> [--to <sha>] [--repo <baseline checkout>] [--json]\nRead-only classification of upstream changes: current, adoptable, site-modified, missing, removed.');
    else {
      const plan = planUpdate({ ...options, repo: options.repo ?? process.cwd() });
      if (options.json) console.log(JSON.stringify(plan, null, 2));
      else {
        console.log(`Upstream ${plan.since.slice(0, 7)}..${plan.to.slice(0, 7)} against ${plan.site}`);
        console.log(Object.entries(plan.counts).map(([state, n]) => `${state} ${n}`).join(' · '));
        for (const state of ['adoptable', 'site-modified', 'removed', 'missing']) for (const row of plan.rows.filter(r => r.state === state)) console.log(`${state.padEnd(13)} ${row.path}${row.matches ? ` (site has ${row.matches})` : ''}${row.note ? ` (${row.note})` : ''}`);
      }
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
