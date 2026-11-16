import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RETIRED, findRetired } from '../scripts/retired-paths.mjs';
import { diagnose, retiredCheck } from '../scripts/doctor.mjs';
import { planUpdate } from '../scripts/update-plan.mjs';

const safe = file => typeof file === 'string' && !file.includes('\\') && !file.includes(':') && !file.split('/').some(part => !part || part === '.' || part === '..');
const tempSite = () => mkdtempSync(path.join(os.tmpdir(), 'baseline-retired-'));
const put = (root, file, text) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text); };

test('every retirement names its commit, safe relative paths and removal steps, once', () => {
  const seen = new Set();
  for (const entry of RETIRED) {
    assert.match(entry.commit, /^[0-9a-f]{7,40}$/);
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(entry.title.trim() && entry.removal.trim().length > 40, entry.commit);
    for (const file of [...entry.paths, ...entry.mounts.map(m => m.file)]) assert.ok(safe(file), file);
    for (const file of entry.paths) { assert.ok(!seen.has(file), `listed twice: ${file}`); seen.add(file); }
    for (const mount of entry.mounts) assert.ok(mount.text.trim(), mount.file);
  }
});

test('this checkout and every profile manifest are free of what Baseline retired', () => {
  // The starter itself must pass its own check; a retired path must not come back through a manifest.
  assert.deepEqual(findRetired(process.cwd()), []);
  const manifests = readdirSync('profiles/manifests').filter(f => f.endsWith('.json')).map(f => readFileSync(path.join('profiles/manifests', f), 'utf8'));
  for (const file of RETIRED.flatMap(entry => entry.paths)) {
    assert.ok(!existsSync(file), `retired file is back: ${file}`);
    assert.ok(!manifests.some(text => text.includes(`"${file}"`)), `a profile manifest ships ${file}`);
  }
});

test('a site keeps retired files, mounts, scripts and dependencies until they are removed', () => {
  const site = tempSite();
  try {
    assert.deepEqual(findRetired(site), []);
    put(site, 'src/components/TweaksBar.astro', '<div />');
    put(site, 'src/layouts/Base.astro', 'import TweaksBar from "../components/TweaksBar.astro";\n{import.meta.env.DEV && <TweaksBar />}');
    put(site, 'package.json', JSON.stringify({ scripts: { 'tokens:generate': 'node scripts/generate-token-catalog.mjs', build: 'astro build' }, devDependencies: { '@google/design.md': '0.4.0' } }));
    const found = findRetired(site).map(hit => [hit.commit, hit.kind, hit.path]);
    assert.deepEqual(found, [
      ['adc6c203', 'file', 'src/components/TweaksBar.astro'],
      ['adc6c203', 'mount', 'src/layouts/Base.astro'],
      ['adc6c203', 'script', 'package.json'],
      ['0be2eb28', 'dependency', 'package.json'],
    ]);
    const check = retiredCheck(site, { findRetired });
    assert.equal(check.status, 'warn');
    assert.match(check.message, /4 retired item\(s\).*Development Tweaks panel \(Dev HUD\) \(adc6c203\)/);
    assert.match(check.message, /script "tokens:generate" runs scripts\/generate-token-catalog\.mjs/);
    assert.equal(retiredCheck(site, null), null, 'no list installed: no check');
  } finally { rmSync(site, { recursive: true, force: true }); }
});

test('doctor warns about retired files without failing, and passes a clean site', async () => {
  const site = tempSite();
  try {
    put(site, 'package.json', JSON.stringify({ engines: { node: '^24.16.0' } }));
    put(site, 'astro.config.mjs', '');
    const options = { cwd: site, version: '24.21.0', platform: 'linux', gitStatus: () => ({ status: 0, stdout: '' }) };
    assert.equal((await diagnose(options)).checks.find(check => check.id === 'retired').status, 'pass');
    put(site, 'docs/dev-hud.md', '# HUD');
    const report = await diagnose(options);
    assert.equal(report.status, 'warn');
    assert.match(report.checks.find(check => check.id === 'retired').message, /docs\/dev-hud\.md/);
    // A site without the list (an older copy) gets no retired check rather than an error.
    const older = await diagnose({ ...options, loadRetired: () => { throw Error('not installed'); } });
    assert.equal(older.checks.some(check => check.id === 'retired'), false);
  } finally { rmSync(site, { recursive: true, force: true }); }
});

test('update:plan reports retired files whatever the range, and a retired deletion in range as retired', () => {
  const dir = tempSite();
  try {
    const repo = path.join(dir, 'upstream'), site = path.join(dir, 'site');
    mkdirSync(repo); mkdirSync(site);
    const git = (...args) => execFileSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args]).toString().trim();
    git('init', '-q');
    put(repo, 'scripts/old.mjs', 'o\n'); put(repo, 'scripts/keep.mjs', 'k1\n');
    git('add', '-A'); git('commit', '-qm', 'one'); const since = git('rev-parse', 'HEAD');
    put(repo, 'scripts/keep.mjs', 'k2\n'); execFileSync('git', ['-C', repo, 'rm', '-q', 'scripts/old.mjs']);
    git('add', '-A'); git('commit', '-qm', 'two');
    put(site, 'scripts/keep.mjs', 'k1\n'); put(site, 'scripts/old.mjs', 'o\n'); put(site, 'src/legacy.astro', 'x');
    const retired = [
      { commit: 'aaaaaaa', date: '2026-01-01', title: 'Old helper', paths: ['scripts/old.mjs'], mounts: [], dependencies: [], removal: 'Delete it.' },
      { commit: 'bbbbbbb', date: '2025-01-01', title: 'Legacy page', paths: ['src/legacy.astro'], mounts: [], dependencies: [], removal: 'Delete it.' },
    ];
    const plan = planUpdate({ repo, site, since, retired });
    const row = file => plan.rows.find(r => r.path === file);
    assert.equal(row('scripts/keep.mjs').state, 'adoptable');
    assert.equal(row('scripts/old.mjs').state, 'retired', 'deleted in range and listed: retired, not removed');
    assert.match(row('scripts/old.mjs').note, /retired in aaaaaaa: Old helper/);
    assert.equal(row('src/legacy.astro').state, 'retired', 'retired before --since, still reported');
    assert.equal(plan.counts.retired, 2);
    assert.equal(plan.counts.removed, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
