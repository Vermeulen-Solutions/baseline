import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { setupHooks, preCommitHook } from '../scripts/setup-hooks.mjs';

test('native pre-commit hook installs idempotently, executes in order and propagates failures', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline hooks space '));
  const git = args => spawnSync('git', args, { cwd: directory, encoding: 'utf8', windowsHide: true });
  try {
    assert.equal(git(['init']).status, 0);
    const target = setupHooks(directory);
    assert.equal(readFileSync(target, 'utf8'), preCommitHook);
    assert.equal(setupHooks(directory), target);
    if (process.platform !== 'win32') assert.equal(statSync(target).mode & 0o777, 0o755);
    writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ scripts: { doctor: 'node gate.cjs doctor', 'verify:fast': 'node gate.cjs fast' } }));
    writeFileSync(path.join(directory, 'gate.cjs'), 'const fs=require("node:fs");const gate=process.argv[2];fs.appendFileSync("order.txt",gate+"\\n");if(process.env.HOOK_FAIL===gate)process.exitCode=2;');
    for (const failure of ['', 'doctor', 'fast']) {
      writeFileSync(path.join(directory, 'order.txt'), '');
      const result = spawnSync('git', ['hook', 'run', 'pre-commit'], { cwd: directory, encoding: 'utf8', windowsHide: true, env: { ...process.env, HOOK_FAIL: failure } });
      assert.equal(result.status === 0, !failure, result.stdout + result.stderr);
      assert.equal(readFileSync(path.join(directory, 'order.txt'), 'utf8'), failure === 'doctor' ? 'doctor\n' : 'doctor\nfast\n');
    }
    writeFileSync(target, '#!/bin/sh\n# existing owner\n');
    assert.throws(() => setupHooks(directory), /Existing pre-commit hook preserved/);
    assert.equal(readFileSync(target, 'utf8'), '#!/bin/sh\n# existing owner\n');
    assert.equal(git(['config', 'core.hooksPath', 'custom-hooks']).status, 0);
    assert.throws(() => setupHooks(directory), /core.hooksPath/);
    assert.equal(existsSync(path.join(directory, 'custom-hooks')), false);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('hook setup refuses a non-Git directory before creating files', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-hooks-no-git-'));
  try { assert.throws(() => setupHooks(directory)); assert.deepEqual(readdirSync(directory), []); }
  finally { rmSync(directory, { recursive: true, force: true }); }
});
