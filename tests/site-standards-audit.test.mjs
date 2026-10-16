import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { auditSite, strictFailure, writeReports, STANDARD } from '../scripts/audit-site.mjs';
const script = new URL('../scripts/audit-site.mjs', import.meta.url);
const baselineFile = new URL('../standards/baselines/0.1.1.json', import.meta.url);
function fixture(fn) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-audit-test-'));
  const root = path.join(parent, 'target'); fs.mkdirSync(root);
  try { return fn(root, parent); }
  finally { assert.equal(path.dirname(parent), path.resolve(os.tmpdir())); assert.match(path.basename(parent), /^baseline-audit-test-/); fs.rmSync(parent, { recursive: true, force: true }); }
}
function current(root) {
  const profile = JSON.parse(fs.readFileSync(baselineFile)).runtimeProfiles['node-sqlite'];
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ engines: { node: profile.nodeEngineRange }, scripts: { audit: 'node malicious-target.mjs' } }));
  fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ packages: Object.fromEntries(Object.entries(profile.dependencies).map(([name, value]) => [`node_modules/${name}`, { version: value.replace(/^\^/, '') }])) }));
  fs.writeFileSync(path.join(root, '.env'), 'EXAMPLE_PRIVATE_VALUE=do-not-report-this\n');
  fs.writeFileSync(path.join(root, 'astro.config.mjs'), 'throw Error("target config must never execute")');
}
function tree(root) { return fs.readdirSync(root, { recursive: true, withFileTypes: true }).filter(item => item.isFile()).map(item => { const absolute = path.join(item.parentPath, item.name); return [path.relative(root, absolute), createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')]; }).sort(([a], [b]) => a.localeCompare(b)); }
const rule = (r, id) => r.rules.find(item => item.id === id);

test('offline pinned baseline works without private history; diagnosis cannot execute target code or leak env/paths', () => fixture(root => {
  current(root); const before = tree(root); const report = auditSite({ root });
  assert.equal(report.standards.sha256, STANDARD.sha256);
  assert.equal(rule(report, 'dependency:astro').status, 'pass');
  assert.equal(rule(report, 'physical-schema').status, 'unverified');
  assert.equal(strictFailure(report), true);
  assert.equal(JSON.stringify(report).includes(root), false);
  assert.equal(JSON.stringify(report).includes('do-not-report-this'), false);
  assert.deepEqual(tree(root), before);
}));
test('degraded, malformed and absent evidence stay warnings/unverified; altered baseline is refused', () => fixture((root, parent) => {
  current(root); const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'))); lock.packages['node_modules/astro'].version = '5.0.0'; fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify(lock));
  assert.equal(rule(auditSite({ root }), 'dependency:astro').status, 'warning');
  fs.writeFileSync(path.join(root, 'package-lock.json'), 'not json');
  assert.equal(rule(auditSite({ root }), 'package-evidence').status, 'unverified');
  const changed = path.join(parent, 'altered.json'); fs.writeFileSync(changed, fs.readFileSync(baselineFile, 'utf8') + '\n');
  assert.throws(() => auditSite({ root, standardsFile: changed }), /digest mismatch/);
  assert.equal(rule(auditSite({ root, dbSnapshot: path.join(parent, 'missing.sqlite') }), 'physical-schema').status, 'unverified');
  assert.equal(rule(auditSite({ root, runtime: 'cloudflare-d1-r2' }), 'runtime-profile').status, 'unverified');
}));
test('snapshot schema includes generated columns, detects 51 columns and leaves original DB bytes/tree unchanged', () => fixture((root, parent) => {
  current(root); const snapshot = path.join(root, 'offline.sqlite'); let db = new DatabaseSync(snapshot);
  db.exec('CREATE TABLE ec_example (id TEXT, title TEXT, generated TEXT AS (title) VIRTUAL)'); db.close();
  const before = tree(root); const report = auditSite({ root, dbSnapshot: snapshot });
  assert.deepEqual(rule(report, 'physical-schema').observed.physicalWidths, [3]); assert.deepEqual(tree(root), before);
  db = new DatabaseSync(snapshot); db.exec(`CREATE TABLE ec_wide (${Array.from({ length: 51 }, (_, i) => `c${i} TEXT`).join(',')})`); db.close();
  const secondBefore = tree(root), failed = auditSite({ root, dbSnapshot: snapshot });
  assert.equal(rule(failed, 'physical-schema').status, 'fail'); assert.equal(strictFailure(failed), true); assert.deepEqual(tree(root), secondBefore);
  fs.writeFileSync(snapshot + '-wal', 'active sidecar'); const sidecarBefore = tree(root);
  assert.equal(rule(auditSite({ root, dbSnapshot: snapshot }), 'physical-schema').status, 'unverified'); assert.deepEqual(tree(root), sidecarBefore);
  writeReports(report, path.join(parent, 'report'), root); assert.ok(fs.existsSync(path.join(parent, 'report/report.md')));
}));
test('reports refuse target paths, existing directories and a symlink back into the target', () => fixture((root, parent) => {
  current(root); const report = auditSite({ root });
  assert.throws(() => writeReports(report, path.join(root, 'audit/new'), root), /outside/);
  assert.throws(() => writeReports(report, parent, root), /already exists/);
  const alias = path.join(parent, 'alias'); fs.symlinkSync(root, alias, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => writeReports(report, path.join(alias, 'new'), root), /outside/);
}));
test('normalized skill drift never becomes an upstream/membership pass and linked evidence is refused', () => fixture((root, parent) => {
  current(root); fs.mkdirSync(path.join(root, '.agents/skills/new-site-workflow'), { recursive: true }); fs.mkdirSync(path.join(root, '.emdash'));
  fs.writeFileSync(path.join(root, '.agents/skills/new-site-workflow/SKILL.md'), '# Local\r\n');
  const expected = createHash('sha256').update('# Local\n').digest('hex');
  fs.writeFileSync(path.join(root, '.emdash/site-skills.json'), JSON.stringify({ files: { 'new-site-workflow/SKILL.md': expected } }));
  assert.equal(rule(auditSite({ root }), 'skills:site').status, 'unverified');
  fs.writeFileSync(path.join(root, '.agents/skills/new-site-workflow/SKILL.md'), '# Different\n');
  assert.equal(rule(auditSite({ root }), 'skills:site').status, 'unverified'); // Incomplete legacy manifest cannot establish membership.
  const external = path.join(parent, 'external'); fs.mkdirSync(external); fs.writeFileSync(path.join(external, 'site-skills.json'), '{}');
  fs.renameSync(path.join(root, '.emdash'), path.join(root, 'old-metadata')); fs.symlinkSync(external, path.join(root, '.emdash'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(rule(auditSite({ root }), 'skills:site').status, 'unverified');
}));
test('CLI strict policy fails required unknowns, rejects malformed flags and records Git state without mutations', () => fixture((root) => {
  current(root); execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', 'package.json', 'package-lock.json', 'astro.config.mjs'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'], { cwd: root });
  fs.appendFileSync(path.join(root, 'astro.config.mjs'), '\n'); const before = tree(root);
  const result = spawnSync(process.execPath, [fileURLToPath(script), '--root', root, '--strict'], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr); assert.equal(JSON.parse(result.stdout).target.git.trackedDirty, true); assert.deepEqual(tree(root), before);
  assert.equal(spawnSync(process.execPath, [fileURLToPath(script), '--root'], { encoding: 'utf8' }).status, 2);
}));
