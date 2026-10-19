import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { testFiles } from '../scripts/run-tests.mjs';
import { npmInvocation, execNpmSync, spawnNpmSync } from '../scripts/process-runner.mjs';
import { exportD1Database } from '../scripts/d1-export.mjs';

test('test tiers are a disjoint exhaustive partition and stale inventories fail closed', () => {
  const unit = testFiles('unit'), rehearsal = testFiles('rehearsal');
  assert.equal(unit.some(file => rehearsal.includes(file)), false);
  assert.deepEqual([...unit, ...rehearsal].sort(), readdirSync('tests').filter(file => file.endsWith('.test.mjs')).map(file => `tests/${file}`).sort());
  assert.throws(() => testFiles('unknown'), /Use --tier/);
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-tier-'));
  try {
    writeFileSync(path.join(directory, 'test-tiers.json'), '{}');
    writeFileSync(path.join(directory, 'new.test.mjs'), '');
    assert.throws(() => testFiles('unit', directory), /inventory is stale/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('npm launcher preserves argv bytes, spaces and failure status without a shell', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline npm argv '));
  try {
    const cli = path.join(directory, 'npm-cli.js');
    writeFileSync(cli, 'if(process.argv.includes("--fail"))process.exitCode=7;else console.log(JSON.stringify(process.argv.slice(2)));');
    const env = { ...process.env, npm_execpath: cli };
    const args = ['exec', '--', 'spaces and "quotes"', 'a&b|c', '$(literal)', '%PATH%', ';echo untouched'];
    assert.equal(npmInvocation(args, { env }).command, process.execPath);
    assert.deepEqual(JSON.parse(execNpmSync(args, { env, encoding: 'utf8' })), args);
    const failed = spawnNpmSync(['--fail'], { env, encoding: 'utf8' });
    assert.equal(failed.status, 7);
    assert.throws(() => execNpmSync(['--fail'], { env, stdio: 'pipe' }), error => error.status === 7);
    // Official Unix prefix layout, exercised without a machine-specific executable.
    const bin = path.join(directory, 'bin'); mkdirSync(bin);
    const executable = path.join(bin, 'node'); writeFileSync(executable, '');
    assert.throws(() => npmInvocation([], { env: {}, execPath: executable }), /npm CLI unavailable/);
    const unixCLI = path.join(directory, 'lib/node_modules/npm/bin'); mkdirSync(unixCLI, { recursive: true });
    writeFileSync(path.join(unixCLI, 'npm-cli.js'), '');
    assert.equal(npmInvocation([], { env: {}, execPath: executable }).args[0], path.join(unixCLI, 'npm-cli.js'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('D1 export passes database/table names and SQL as argv without shell interpretation', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline D1 argv '));
  try {
    const database = 'db with spaces & punctuation', table = 'odd "table"; $literal', out = path.join(directory, 'export output.sql');
    const calls = [];
    exportD1Database({ database, out, remote: false }, args => {
      calls.push(args);
      assert.deepEqual(args.slice(0, 4), ['exec', '--yes', '--', 'wrangler']);
      assert.equal(args[6], database);
      if (args[5] === 'execute') return JSON.stringify([{ results: [{ type: 'table', name: table, sql: 'CREATE TABLE example(id TEXT)' }] }]);
      assert.equal(args[args.indexOf('--table') + 1], table);
      writeFileSync(args[args.indexOf('--output') + 1], 'CREATE TABLE example(id TEXT);');
    });
    assert.equal(calls.length, 2);
    assert.ok(calls.every(args => args.includes('--local')));
    assert.match(calls[0].at(-1), /^SELECT type, name/);
    assert.match(readFileSync(out, 'utf8'), /^PRAGMA foreign_keys = OFF;/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
