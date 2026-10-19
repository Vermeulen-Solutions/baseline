import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { testFiles } from '../scripts/run-tests.mjs';
import { npmInvocation, execNpmSync, spawnNpmSync } from '../scripts/process-runner.mjs';
import { exportD1Database } from '../scripts/d1-export.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { diagnose, shellCheck, supportsNode } from '../scripts/doctor.mjs';
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

const scriptPath = name => fileURLToPath(new URL(`../scripts/${name}`, import.meta.url));
const runGate = (name, args = [], options = {}) => spawnSync(process.execPath, [scriptPath(name), ...args], { encoding: 'utf8', ...options });

test('doctor evaluates the declared Node alternatives without semver dependencies', () => {
  const range = JSON.parse(readFileSync('package.json', 'utf8')).engines.node;
  for (const version of ['22.22.3', '22.23.0', '24.16.0', '24.21.0', '26.3.0', '27.0.0']) assert.equal(supportsNode(version, range), true, version);
  for (const version of ['20.20.0', '22.22.2', '23.99.0', '24.15.9', '25.0.0', '26.2.9', '26.3.0-rc.1']) assert.equal(supportsNode(version, range), false, version);
  assert.equal(supportsNode('24.21.0', '>=24'), null);
  assert.equal(supportsNode('24.21.0', undefined), null);
  assert.equal(supportsNode('0.2.9', '^0.2.3'), true);
  assert.equal(supportsNode('0.3.0', '^0.2.3'), false);
  assert.equal(supportsNode('0.0.4', '^0.0.3'), false);
});

test('doctor distinguishes known Windows launchers from unobservable outer launchers', () => {
  assert.equal(shellCheck('linux', {}).status, 'pass');
  assert.equal(shellCheck('win32', { npm_execpath: 'C:\\npm.cmd' }).status, 'pass');
  assert.match(shellCheck('win32', { npm_execpath: 'C:\\npm.ps1' }).message, /execution policy/);
  assert.equal(shellCheck('win32', { npm_config_script_shell: 'pwsh.exe' }).status, 'warn');
  const unknown = shellCheck('win32', { npm_execpath: 'C:\\npm-cli.js', ComSpec: 'C:\\cmd.exe' });
  assert.equal(unknown.status, 'warn');
  assert.match(unknown.message, /not observable/);
});

test('doctor probes SQLite and workspace without residue, bounds Git and reports critical failures', async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-doctor-'));
  try {
    writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ engines: { node: '^24.16.0' } }));
    writeFileSync(path.join(directory, 'astro.config.mjs'), '');
    const options = { cwd: directory, version: '24.21.0', platform: 'linux', gitStatus: (command, args, options) => {
      assert.equal(command, 'git'); assert.ok(args.includes('--no-optional-locks'));
      assert.ok(options.timeout > 0 && options.timeout <= 200);
      assert.equal(options.windowsHide, true); assert.equal(options.shell, undefined);
      return { status: 0, stdout: '' };
    } };
    const report = await diagnose(options);
    assert.equal(report.status, 'pass');
    assert.ok(report.checks.every(check => check.status === 'pass'));
    assert.deepEqual(readdirSync(path.join(directory, '.emdash')), []);
    const dirty = await diagnose({ ...options, gitStatus: () => ({ status: 0, stdout: ' M example.txt\n' }) });
    assert.equal(dirty.status, 'warn'); assert.match(dirty.checks.find(check => check.id === 'git').message, /dirty/);
    const missingGit = await diagnose({ ...options, gitStatus: () => ({ status: null, error: { code: 'ENOENT' } }) });
    assert.equal(missingGit.status, 'warn');
    const failed = await diagnose({ ...options, version: '25.0.0', loadSQLite: () => { throw Error('Unavailable SQLite'); } });
    assert.equal(failed.status, 'fail');
    assert.equal(failed.checks.filter(check => check.status === 'fail').length, 2);
    const probeDirectory = path.join(directory, '.emdash');
    assert.equal(path.dirname(path.resolve(probeDirectory)), directory);
    rmSync(probeDirectory, { recursive: true }); writeFileSync(probeDirectory, 'blocked');
    assert.equal((await diagnose(options)).checks.find(check => check.id === 'workspace').status, 'fail');
  } finally { assert.equal(path.dirname(directory), path.resolve(os.tmpdir())); rmSync(directory, { recursive: true, force: true }); }
});

test('doctor CLI emits parseable JSON, honors NO_COLOR and uses exit 0 for warnings and 1 for failures', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-doctor-cli-'));
  try {
    const invalid = runGate('doctor.mjs', ['--json', '--unknown'], { cwd: directory });
    assert.equal(invalid.status, 1); assert.equal(JSON.parse(invalid.stdout).checks[0].id, 'arguments');
    assert.deepEqual(readdirSync(directory), []);
    const missing = runGate('doctor.mjs', ['--json'], { cwd: directory });
    assert.equal(missing.status, 1); assert.equal(JSON.parse(missing.stdout).status, 'fail');
    writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ engines: { node: JSON.parse(readFileSync('package.json', 'utf8')).engines.node } }));
    writeFileSync(path.join(directory, 'astro.config.mjs'), '');
    const json = runGate('doctor.mjs', ['--json'], { cwd: directory });
    assert.equal(json.status, 0, json.stdout + json.stderr);
    const report = JSON.parse(json.stdout);
    assert.equal(report.schemaVersion, 1); assert.ok(Number.isFinite(report.durationMs));
    assert.ok(report.checks.some(check => check.id === 'sqlite' && check.status === 'pass'));
    const plain = runGate('doctor.mjs', [], { cwd: directory, env: { ...process.env, NO_COLOR: '' } });
    assert.equal(plain.status, 0); assert.match(plain.stdout, /\[PASS\] sqlite/); assert.doesNotMatch(plain.stdout, /\x1b\[/);
    assert.deepEqual(readdirSync(path.join(directory, '.emdash')), []);
  } finally { assert.equal(path.dirname(directory), path.resolve(os.tmpdir())); rmSync(directory, { recursive: true, force: true }); }
});

test('schema gate reports physical overflow names/counts and closes a read-only failing database', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-schema-diagnostics-'));
  try {
    const file = path.join(directory, 'wide.sqlite'), db = new DatabaseSync(file);
    const columns = Array.from({ length: 50 }, (_, i) => `c${i} TEXT`).join(',');
    db.exec(`CREATE TABLE ec_wide(${columns}, legacy_extra TEXT, generated_extra TEXT AS(c0) VIRTUAL); CREATE TABLE ec_valid(${columns});`);
    db.close();
    const before = readFileSync(file), result = runGate('check-schema-budget.mjs', [file]);
    assert.equal(result.status, 1, result.stderr);
    for (const expected of ['Expected vs Received', 'ec_wide', 'Expected: <= 50', 'Received: 52', '"legacy_extra"', '"generated_extra"', 'Recheck: npm run check:schema-budget']) assert.ok(result.stderr.includes(expected), result.stderr);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
    assert.deepEqual(readFileSync(file), before);
    const malformed = runGate('check-schema-budget.mjs', ['file:%broken']);
    assert.equal(malformed.status, 1); assert.match(malformed.stderr, /Remediation:/); assert.doesNotMatch(malformed.stderr, /\n\s+at /);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('art gate shows invalid fields and required-structure diff with source lines', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-record-diagnostics-'));
  try {
    const missing = runGate('check-art-direction.mjs', ['--require-record'], { cwd: directory });
    assert.equal(missing.status, 1); assert.match(missing.stderr, /no real Art Direction Record found/);
    assert.match(missing.stderr, /Recheck:/);
    writeFileSync(path.join(directory, 'AGENTS.md'), '# Project\n## Art Direction Record\n- **Aesthetic Lane:** TBD\n');
    const result = runGate('check-art-direction.mjs', ['--require-record'], { cwd: directory });
    assert.equal(result.status, 1);
    for (const expected of ['Expected vs Received', '- AGENTS.md:3:', '+ - **Typography Pairing:**', 'Narrative Metaphor must', 'Token Physics needs a concrete Canvas', 'Recheck: npm run check:art-direction']) assert.ok(result.stderr.includes(expected), result.stderr);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('token gate reports failing scoped pairs, actual/minimum contrast and keeps JSON machine-readable', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-token-diagnostics-'));
  try {
    const file = path.join(directory, 'tokens.css');
    const css = readFileSync('src/styles/global.css', 'utf8').replace(/--color-text:\s*[^;]+;/, '--color-text: #ffffff;');
    writeFileSync(file, css);
    const result = runGate('design-system.mjs', ['--css', file]);
    assert.equal(result.status, 1);
    for (const expected of ['Expected vs Received', 'default:text-on-page', '--color-text on --color-page', 'Expected: >= 4.5:1', 'Received:', file + ':', 'Remediation:']) assert.ok(result.stderr.includes(expected), result.stderr);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
    const json = runGate('design-system.mjs', ['--css', file, '--json']);
    const report = JSON.parse(json.stdout);
    assert.equal(json.status, 1); assert.equal(report.valid, false);
    assert.equal(report.contrast.find(pair => pair.id === 'default:focus-on-page').minimum, 3);
    assert.equal(report.contrast.find(pair => pair.id === 'default:text-on-page').status, 'fail');
    assert.equal(json.stderr, '');
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
      assert.deepEqual(args.slice(0, 3), ['exec', '--', 'wrangler']);
      assert.equal(args[5], database);
      if (args[4] === 'execute') return JSON.stringify([{ results: [{ type: 'table', name: table, sql: 'CREATE TABLE example(id TEXT)' }] }]);
      assert.equal(args[args.indexOf('--table') + 1], table);
      writeFileSync(args[args.indexOf('--output') + 1], 'CREATE TABLE example(id TEXT);');
    });
    assert.equal(calls.length, 2);
    assert.ok(calls.every(args => args.includes('--local')));
    assert.match(calls[0].at(-1), /^SELECT type, name/);
    assert.match(readFileSync(out, 'utf8'), /^PRAGMA foreign_keys = OFF;/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('D1 partial export is cleaned after failure and JSONC autodetection preserves URL strings', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-D1-cleanup-'));
  try {
    let temporary;
    const out = path.join(directory, 'output.sql');
    assert.throws(() => exportD1Database({ database: 'synthetic', out }, args => {
      if (args[4] === 'execute') return JSON.stringify([{ results: [] }]);
      temporary = args[args.indexOf('--output') + 1]; writeFileSync(temporary, 'partial');
      throw Error('simulated export failure');
    }), /simulated export failure/);
    assert.equal(existsSync(temporary), false); assert.equal(existsSync(out), false);
    writeFileSync(path.join(directory, 'wrangler.jsonc'), '// synthetic config\n{"docs":"https://example.invalid/", "d1_databases":[{"database_name":"fixture-db"}],}\n');
    const harness = path.join(directory, 'probe.mjs');
    writeFileSync(harness, `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport {exportD1Database} from ${JSON.stringify(new URL('../scripts/d1-export.mjs', import.meta.url).href)};\nexportD1Database({out:'fixture.sql'}, args => {assert.equal(args[5],'fixture-db'); if(args[4]==='execute')return JSON.stringify([{results:[]}]); fs.writeFileSync(args[args.indexOf('--output')+1],'-- synthetic export');});\n`);
    const detected = spawnSync(process.execPath, [harness], { cwd: directory, encoding: 'utf8' });
    assert.equal(detected.status, 0, detected.stdout + detected.stderr);
    assert.equal(readdirSync(directory).some(file => file.startsWith('.temp-d1-export-')), false);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('operational CLI failures are stack-free, exit 1 and do not create output before validation', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-cli-hygiene-'));
  try {
    for (const [script, args] of [
      ['d1-export.mjs', ['--unknown']], ['register-site.mjs', ['--input']],
      ['verify-profiles.mjs', ['--profile', 'unknown']], ['styleguide-fixtures.mjs', ['unknown']],
      ['check-script-syntax.mjs', []], ['check-ci-fast.mjs', []],
    ]) {
      const result = runGate(script, args, { cwd: directory });
      assert.equal(result.status, 1, script + ': ' + result.stderr);
      assert.doesNotMatch(result.stderr, /\n\s+at /, script);
      assert.ok(result.stderr.trim(), script);
      assert.deepEqual(readdirSync(directory), [], script + ' must validate before writing');
    }
    const database = path.join(directory, 'users.sqlite'), db = new DatabaseSync(database);
    db.exec('CREATE TABLE users(id TEXT, email TEXT, role TEXT)'); db.close();
    const before = readFileSync(database);
    const token = runGate('create-mcp-token.mjs', ['--db=' + database, '--user=missing']);
    assert.equal(token.status, 1, token.stderr); assert.match(token.stderr, /User "missing" not found/);
    assert.doesNotMatch(token.stderr, /\n\s+at /); assert.doesNotMatch(token.stdout, /ec_pat_/);
    assert.deepEqual(readFileSync(database), before);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
