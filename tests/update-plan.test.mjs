import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, planUpdate, fingerprint } from '../scripts/update-plan.mjs';

// Portable: builds a throwaway upstream Git repository and a site directory; reads nothing else.
test('update:plan classifies upstream changes against a site as current, adoptable, site-modified, missing or removed', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'update-plan-'));
  try {
    const repo = path.join(dir, 'upstream'), site = path.join(dir, 'site');
    mkdirSync(path.join(repo, 'scripts'), { recursive: true }); mkdirSync(path.join(site, 'scripts'), { recursive: true });
    const git = (...args) => execFileSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args]).toString().trim();
    git('init', '-q');
    const put = (file, text) => writeFileSync(path.join(repo, file), text);
    put('scripts/a.mjs', 'a1\n'); put('scripts/b.mjs', 'b1\n'); put('scripts/c.mjs', 'c1\n'); put('scripts/gone.mjs', 'g\n'); put('scripts/same.mjs', 's1\n');
    git('add', '-A'); git('commit', '-qm', 'one'); const since = git('rev-parse', 'HEAD');
    put('scripts/a.mjs', 'a2\n'); put('scripts/b.mjs', 'b2\n'); put('scripts/c.mjs', 'c2\n'); put('scripts/new.mjs', 'n\n'); put('scripts/same.mjs', 's2\n');
    execFileSync('git', ['-C', repo, 'rm', '-q', 'scripts/gone.mjs']);
    git('add', '-A'); git('commit', '-qm', 'two');
    writeFileSync(path.join(site, 'scripts/a.mjs'), 'a1\r\n');      // old upstream bytes, CRLF checkout
    writeFileSync(path.join(site, 'scripts/b.mjs'), 'b1 plus local\n'); // local edit
    writeFileSync(path.join(site, 'scripts/same.mjs'), 's2\n');       // already current
    writeFileSync(path.join(site, 'scripts/gone.mjs'), 'g\n');        // removed upstream
    const plan = planUpdate({ repo, site, since });
    const state = file => plan.rows.find(row => row.path === file)?.state;
    assert.equal(state('scripts/a.mjs'), 'adoptable');
    assert.equal(state('scripts/b.mjs'), 'site-modified');
    assert.equal(state('scripts/c.mjs'), 'missing');
    assert.equal(state('scripts/new.mjs'), 'missing');
    assert.equal(state('scripts/same.mjs'), 'current');
    assert.equal(state('scripts/gone.mjs'), 'removed');
    assert.deepEqual(plan.counts, { current: 1, adoptable: 1, 'site-modified': 1, missing: 2, removed: 1 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('update:plan arguments and fingerprints', () => {
  assert.throws(() => parseArgs(['--since', 'abc']), /--site/);
  assert.throws(() => parseArgs(['--site', 'x']), /--since/);
  assert.equal(parseArgs(['--site', 'x', '--since', 'abc1234']).to, 'HEAD');
  assert.equal(fingerprint(Buffer.from('x\r\ny\n')), fingerprint(Buffer.from('x\ny\n')), 'line endings do not count as changes');
  assert.notEqual(fingerprint(Buffer.from([0, 13, 10])), fingerprint(Buffer.from([0, 10])), 'binary bytes are compared exactly');
});
