import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditSite, strictFailure, markdownReport } from '../scripts/audit-site.mjs';
import { evidenceBinding } from '../scripts/audit-runtime-evidence.mjs';
import { sha256 } from '../scripts/audit-evidence.mjs';

function fixture(run) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-runtime-'));
  const root = path.join(parent, 'site'), evidence = path.join(parent, 'evidence');
  fs.mkdirSync(root); fs.mkdirSync(evidence);
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git('init', '-b', 'codex/pilot'); git('config', 'user.name', 'Synthetic fixture'); git('config', 'user.email', 'fixture@example.invalid');
  fs.writeFileSync(path.join(root, 'package.json'), '{}\n'); git('add', '.'); git('commit', '-m', 'Synthetic source');
  const png = Buffer.alloc(24); Buffer.from('89504e470d0a1a0a', 'hex').copy(png); png.writeUInt32BE(390, 16); png.writeUInt32BE(844, 20);
  fs.writeFileSync(path.join(evidence, 'capture.png'), png);
  const scope = state => ({ route: '/about', state, locale: 'en', viewport: { width: 390, height: 844 } });
  const editor = { route: '/about', locale: 'en', field: 'title', surface: 'emdash-inline' };
  const receipt = { ...editor, beforeSHA256: sha256('before'), submittedSHA256: sha256('after'), reloadedSHA256: sha256('after'), publicSHA256: sha256('after'), saveHTTPStatus: 200, restored: true };
  const bundle = { evidenceVersion: 1, capturedAt: new Date().toISOString(), runtime: 'node-sqlite', binding: evidenceBinding(root), expected: ['public', 'editor'].map(scope), captures: ['public', 'editor'].map(state => ({ ...scope(state), httpStatus: 200, ready: true, overflow: false, consoleErrors: 0, annotationCount: state === 'editor' ? 1 : 0, screenshot: { path: 'capture.png', sha256: sha256(png) } })), editors: [{ ...editor, receipt: { path: 'save.json', sha256: '' } }] };
  const save = () => {
    const bytes = Buffer.from(JSON.stringify(receipt)); fs.writeFileSync(path.join(evidence, 'save.json'), bytes);
    bundle.editors.forEach(item => item.receipt.sha256 = sha256(bytes));
    fs.writeFileSync(path.join(evidence, 'bundle.json'), JSON.stringify(bundle));
  };
  const audit = () => { save(); return auditSite({ root, evidence: path.join(evidence, 'bundle.json') }); };
  try { return run({ root, parent, evidence, bundle, receipt, save, audit, git }); }
  finally { assert.equal(path.dirname(parent), path.resolve(os.tmpdir())); assert.match(path.basename(parent), /^baseline-runtime-/); fs.rmSync(parent, { recursive: true, force: true }); }
}
const rule = (report, id) => report.rules.find(item => item.id === id);

test('hash-bound declared capture and editor round-trip evidence remains scoped, private and read-only', () => fixture(({ root, bundle, audit, git }) => {
  bundle.captures[0].viewport = { height: 844, width: 390 };
  const before = evidenceBinding(root), report = audit();
  assert.equal(report.schemaVersion, 2); assert.equal(rule(report, 'route-capture-evidence').status, 'pass');
  assert.equal(rule(report, 'route-capture-evidence').observed.captureFacts[0].route, '/about');
  assert.equal(rule(report, 'editor-save-reload').status, 'pass'); assert.equal(rule(report, 'visual-accessibility').status, 'unverified');
  assert.deepEqual(evidenceBinding(root), before); assert.equal(git('status', '--porcelain').toString(), '');
  assert.equal(JSON.stringify(report).includes(root), false); assert.match(markdownReport(report), /caller|supplied/i);
}));
test('annotations, API-only writes and partial captures cannot verify supported editor saves', () => fixture(({ bundle, receipt, audit }) => {
  bundle.editors = []; assert.equal(rule(audit(), 'editor-save-reload').status, 'unverified');
  bundle.captures.pop(); assert.equal(rule(audit(), 'route-capture-evidence').status, 'unverified');
  bundle.editors = [{ route: '/about', locale: 'en', field: 'title', surface: 'cms-api', receipt: { path: 'save.json', sha256: '' } }]; receipt.surface = 'cms-api';
  assert.equal(rule(audit(), 'editor-save-reload').status, 'unverified');
}));
test('reported overflow/errors and unsuccessful save or public reload are failures, never annotation passes', () => fixture(({ bundle, receipt, audit }) => {
  bundle.captures[0].overflow = true; assert.equal(rule(audit(), 'route-capture-evidence').status, 'fail');
  bundle.captures[0].overflow = false; receipt.publicSHA256 = sha256('old'); assert.equal(rule(audit(), 'editor-save-reload').status, 'fail');
  receipt.publicSHA256 = receipt.submittedSHA256; receipt.saveHTTPStatus = 409; assert.equal(rule(audit(), 'editor-save-reload').status, 'fail');
  receipt.saveHTTPStatus = 200; receipt.beforeSHA256 = receipt.submittedSHA256; assert.equal(rule(audit(), 'editor-save-reload').status, 'fail');
}));
test('stale revision, changed working bytes, timestamps and malformed matrices fail closed', () => fixture(({ root, bundle, audit }) => {
  const binding = structuredClone(bundle.binding); bundle.binding.revision = '0'.repeat(40); assert.equal(rule(audit(), 'route-capture-evidence').status, 'unverified');
  bundle.binding = binding; fs.writeFileSync(path.join(root, 'package.json'), '{"changed":true}'); assert.equal(rule(audit(), 'route-capture-evidence').status, 'unverified');
  bundle.binding = evidenceBinding(root); bundle.capturedAt = '2001-01-01'; assert.equal(rule(audit(), 'route-capture-evidence').status, 'unverified');
  bundle.capturedAt = new Date().toISOString(); bundle.expected.push(bundle.expected[0]); assert.equal(rule(audit(), 'route-capture-evidence').status, 'unverified');
}));
test('tampered, missing, linked and escaping artifacts remain required unknowns without exposing their contents', () => fixture(({ root, parent, evidence, bundle, save }) => {
  const run = () => auditSite({ root, evidence: path.join(evidence, 'bundle.json') });
  save(); fs.appendFileSync(path.join(evidence, 'capture.png'), 'private'); assert.equal(rule(run(), 'route-capture-evidence').status, 'unverified');
  bundle.captures[0].screenshot.path = '../private.png'; save(); assert.equal(rule(run(), 'route-capture-evidence').status, 'unverified');
  fs.mkdirSync(path.join(parent, 'external')); fs.symlinkSync(path.join(parent, 'external'), path.join(evidence, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  bundle.captures[0].screenshot.path = 'linked/capture.png'; save(); const report = run(); assert.equal(rule(report, 'route-capture-evidence').status, 'unverified');
  assert.equal(rule(report, 'route-capture-evidence').severity, 'required'); assert.equal(strictFailure(report), true);
}));

test('CLI imports evidence into validated JSON/Markdown and rejects duplicate flags without target writes', () => fixture(({ root, parent, evidence, save }) => {
  save(); const before = evidenceBinding(root), out = path.join(parent, 'report');
  const script = fileURLToPath(new URL('../scripts/audit-site.mjs', import.meta.url));
  execFileSync(process.execPath, [script, '--root', root, '--evidence', path.join(evidence, 'bundle.json'), '--out', out], { stdio: 'pipe' });
  const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json')));
  assert.equal(rule(report, 'editor-save-reload').status, 'pass'); assert.match(fs.readFileSync(path.join(out, 'report.md'), 'utf8'), /route-capture-evidence/);
  assert.throws(() => execFileSync(process.execPath, [script, '--root', root, '--evidence', 'missing.json', '--evidence', 'other.json'], { stdio: 'pipe' }), error => error.status === 2);
  assert.deepEqual(evidenceBinding(root), before);
}));
