import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { contractDigest, declarations, validateManifest, validateObservations, validateMigrationReport } from '../standards/schemas/migration-acceptance.mjs';
import { migrationReport, migrationMarkdown } from '../scripts/migration-report.mjs';
import { localEvidenceVerifier, parseMigrationArgs, readContractJSON } from '../scripts/migration-verify.mjs';

const fixture = fileURLToPath(new URL('./fixtures/migration-acceptance/', import.meta.url));
const script = fileURLToPath(new URL('../scripts/migration-verify.mjs', import.meta.url));
const load = name => JSON.parse(fs.readFileSync(path.join(fixture, name + '.json'), 'utf8'));
const runOptions = { runId: 'test-run', generatedAt: '2026-10-18T16:00:00.000Z' };
const evaluate = (manifest = load('manifest'), observations = null, scope = 'full', verifyArtifact = localEvidenceVerifier(fixture)) => migrationReport(manifest, observations, { ...runOptions, scope, verifyArtifact });
function rebound(bundle, manifest) {
  return { ...bundle, manifestSHA256: contractDigest(manifest), sourceCaptureSHA256: manifest.sourceCapture.sha256, targetRevision: manifest.targetRevision };
}
function allFacts(manifest) {
  const bundle = rebound(load('observations'), manifest), evidence = bundle.checks[0].evidence;
  bundle.checks = declarations(manifest, 'full').filter(check => !(check.category === 'url' && check.id.endsWith(':excluded'))).map(check => ({ id: check.id, status: 'pass', reason: 'Synthetic complete evidence attestation.', observed: check.expectation, evidence }));
  return bundle;
}
function scratch(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-migration-contract-'));
  try { return run(directory); }
  finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.match(path.basename(directory), /^baseline-migration-contract-/);
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
function invoke(directory, args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: directory, encoding: 'utf8', timeout: 15000 });
}

test('reference manifest, bound observations and JSON/Markdown reports implement the version-1 contract', () => {
  const manifest = load('manifest'), observations = load('observations'), report = load('report');
  assert.deepEqual(validateManifest(manifest), []);
  assert.deepEqual(validateObservations(observations, manifest), []);
  assert.deepEqual(validateMigrationReport(report, manifest), []);
  assert.equal(report.exitCode, 0); assert.equal(report.coverage.urls.excluded, 1);
  assert.equal(migrationMarkdown(report), fs.readFileSync(path.join(fixture, 'report.md'), 'utf8'));
  assert.deepEqual(evaluate(manifest, observations, 'url').checks, report.checks);
  assert.equal(contractDigest(manifest), contractDigest(Object.fromEntries(Object.entries(manifest).reverse())));
});

test('origins must be explicit exact HTTP origins; canonicals cannot silently adopt preview', () => {
  for (const key of ['sourceOrigin', 'targetOrigin', 'productionOrigin', 'allowedAssetOrigins']) {
    const manifest = load('manifest'); delete manifest[key]; assert.ok(validateManifest(manifest).length, key);
  }
  for (const value of ['https://preview.example.test/', 'https://preview.example.test/path', 'ftp://preview.example.test', 'https://user:secret@preview.example.test', 'https://PREVIEW.example.test', 'https://preview.example.test:443']) {
    const manifest = load('manifest'); manifest.targetOrigin = value; assert.ok(validateManifest(manifest).length, value);
  }
  const manifest = load('manifest'); manifest.urls[0].expected.canonical.value = manifest.targetOrigin + '/'; assert.ok(validateManifest(manifest).length);
  manifest.urls[0].expected.canonical.value = null; assert.deepEqual(validateManifest(manifest), []);
  manifest.allowedAssetOrigins.push(manifest.allowedAssetOrigins[0]); assert.ok(validateManifest(manifest).length);
});

test('duplicate source/request identities and silently normalized or ambiguous URLs are refused', () => {
  for (const change of [
    m => m.urls.push(structuredClone(m.urls[0])),
    m => m.urls[4].sourceUrl = m.urls[0].sourceUrl,
    m => m.urls[4].requestPath = m.urls[0].requestPath,
    m => m.urls[4].sourceUrl = 'https://legacy.example.test/a/../',
    m => m.urls[4].sourceUrl = 'https://other.example.test/',
    m => m.urls[4].sourceUrl += '#anchor',
    m => m.urls[4].requestPath = '//other.example.test/',
    m => m.urls[4].requestPath = '/bad%ZZ/',
    m => m.urls.push({ ...structuredClone(m.urls[4]), id: 'encoded-alias', sourceUrl: 'https://legacy.example.test/fr/%61-propos/', requestPath: '/different/' }),
  ]) { const manifest = load('manifest'); change(manifest); assert.ok(validateManifest(manifest).length); }
});

test('query order/values and trailing slashes are preserved; fragments have independent HTML expectations', () => {
  const manifest = load('manifest'), query = manifest.urls.find(entry => entry.id === 'query-search');
  const distinct = structuredClone(query); distinct.id = 'query-reordered';
  distinct.sourceUrl = 'https://legacy.example.test/search/?sort=recent&q=alpha%20beta'; distinct.requestPath = '/search/?sort=recent&q=alpha%20beta';
  manifest.urls.push(distinct); assert.deepEqual(validateManifest(manifest), []);
  assert.equal(manifest.urls.at(-1).requestPath, '/search/?sort=recent&q=alpha%20beta');
  manifest.urls[0].requestPath = '/home'; assert.ok(validateManifest(manifest).length);
  manifest.policies.trailingSlash = 'preserve'; assert.deepEqual(validateManifest(manifest), []);
  manifest.urls.at(-2).expected.fragments.value.push('installation'); assert.ok(validateManifest(manifest).length);
});

test('dispositions cannot mix fields, waive removal status or exclude without an explicit reason', () => {
  for (const change of [
    m => m.urls[0].expected.redirects = [{ status: 301, path: '/other/' }],
    m => m.urls[1].expected.redirects = [],
    m => m.urls[1].expected.redirects[0].path = '/old-news/',
    m => m.urls[2].expected.status = 200,
    m => m.urls[2].expected.title = { value: 'Gone', required: true },
    m => delete m.urls[3].reason,
    m => m.urls[3].reason = '   ',
    m => m.urls[3].requestPath = '/private-preview/',
    m => m.urls[0].disposition = ['retained', 'redirected'],
  ]) { const manifest = load('manifest'); change(manifest); assert.ok(validateManifest(manifest).length); }
});

test('full scope must declare required content/editor parity and reject unsupported schema fields/versions', () => {
  for (const change of [
    m => m.manifestVersion = 3,
    m => m.unknown = true,
    m => m.acceptanceChecks = [],
    m => m.acceptanceChecks[1].required = false,
    m => m.policies.query = 'ignore',
    m => m.urls[0].expected.title.required = 'true',
    m => m.urls[0].expected.robots.value = ['index', 'noindex'],
    m => m.inventories = { source: { reference: 'source', sha256: 'unknown' } },
  ]) { const manifest = load('manifest'); change(manifest); assert.ok(validateManifest(manifest).length); }
});

test('missing required evidence never passes; URL scope explicitly removes content/editor from its result', () => {
  assert.equal(evaluate().exitCode, 2);
  assert.equal(evaluate(load('manifest'), null, 'url').exitCode, 2);
  const url = evaluate(load('manifest'), load('observations'), 'url'); assert.equal(url.exitCode, 0);
  const outside = url.checks.filter(check => check.category !== 'url');
  assert.equal(outside.length, 2); assert.ok(outside.every(check => check.status === 'not-applicable' && !check.required));
  assert.equal(evaluate(load('manifest'), load('observations')).exitCode, 2);
});

test('required unknowns take precedence over failures while confirmed failures are retained', () => {
  const manifest = load('manifest'), observations = load('observations'); observations.checks[0].status = 'fail';
  const partial = evaluate(manifest, observations);
  assert.equal(partial.exitCode, 2); assert.equal(partial.result, 'unverified'); assert.equal(partial.coverage.checks.fail, 1);
  const complete = allFacts(manifest); complete.checks[0].status = 'fail';
  assert.equal(evaluate(manifest, complete).exitCode, 1);
  complete.checks[0].status = 'pass'; assert.equal(evaluate(manifest, complete).exitCode, 0);
});

test('observations cannot weaken required checks using advisory/not-applicable or reserved-looking IDs', () => {
  const manifest = load('manifest'); manifest.acceptanceChecks[0].id = 'excluded';
  const observations = allFacts(manifest);
  for (const status of ['advisory', 'not-applicable', 'unverified']) {
    observations.checks[0].status = status; const report = evaluate(manifest, observations);
    assert.equal(report.exitCode, 2); assert.equal(report.checks[0].status, 'unverified');
  }
  assert.equal(evaluate(manifest).checks.find(check => check.id === 'acceptance:excluded').status, 'unverified');
});

test('optional failures remain visible without changing the required-check exit policy', () => {
  const manifest = load('manifest'); manifest.urls[0].expected.title.required = false;
  const observations = rebound(load('observations'), manifest);
  observations.checks.find(check => check.id === 'url:home:title').status = 'fail';
  const report = evaluate(manifest, observations, 'url');
  assert.equal(report.exitCode, 0); assert.equal(report.coverage.checks.fail, 1);
  observations.checks.find(check => check.id === 'url:home:title').status = 'not-applicable';
  assert.equal(evaluate(manifest, observations, 'url').checks.find(check => check.id === 'url:home:title').status, 'unverified');
});

test('unknown, duplicate, stale-bound and unsubstantiated observation declarations are rejected', () => {
  const manifest = load('manifest');
  for (const change of [
    o => o.manifestSHA256 = '0'.repeat(64),
    o => o.sourceCaptureSHA256 = '0'.repeat(64),
    o => o.targetRevision = 'other',
    o => o.checks.push(structuredClone(o.checks[0])),
    o => o.checks[0].id = 'url:invented:status',
    o => o.checks[0].required = false,
    o => o.checks[0].evidence = [],
    o => o.checks[0].observed = null,
    o => o.checks[0].evidence[0].path = '../private.json',
    o => o.checks[0].evidence[0].path = 'C:/private.json',
  ]) { const bundle = load('observations'); change(bundle); assert.ok(validateObservations(bundle, manifest).length); }
});

test('missing or altered artifact bytes cannot substantiate a pass', () => {
  const manifest = load('manifest'), observations = load('observations');
  observations.checks[0].evidence[0].sha256 = '0'.repeat(64);
  const changed = evaluate(manifest, observations, 'url'); assert.equal(changed.exitCode, 2); assert.equal(changed.checks[0].status, 'unverified');
  assert.equal(evaluate(manifest, load('observations'), 'url', () => false).exitCode, 2);
  assert.equal(migrationReport(manifest, load('observations'), { ...runOptions, scope: 'url' }).exitCode, 2);
});

test('report validation binds complete declarations, severity, coverage and outcome to the paired manifest', () => {
  const manifest = load('manifest');
  for (const change of [
    r => r.checks.pop(),
    r => r.checks[0].required = false,
    r => r.checks[0].status = 'unverified',
    r => r.checks[0].evidence = [],
    r => r.binding.targetRevision = 'other',
    r => r.coverage.urls.total = 999,
    r => r.mode = 'none',
    r => r.reportVersion = 2,
    r => r.checks[0] = null,
  ]) { const report = load('report'); change(report); assert.ok(validateMigrationReport(report, manifest).length); }
  const partial = evaluate(manifest, null); partial.exitCode = 0; partial.result = 'pass'; assert.ok(validateMigrationReport(partial, manifest).length);
});

test('validators refuse malformed/non-JSON structures without throwing', () => {
  const manifest = load('manifest');
  for (const value of [null, [], {}, 1, 'bad', { ...manifest, policies: null }, { ...manifest, urls: [null] }, { ...manifest, acceptanceChecks: [null, null] }]) assert.ok(validateManifest(value).length);
  for (const value of [null, [], {}, load('manifest')]) {
    assert.ok(validateObservations(value, manifest).length); assert.ok(validateMigrationReport(value, manifest).length);
  }
  const cycle = {}; cycle.self = cycle; assert.ok(validateManifest(cycle).length);
});

test('strict JSON reading rejects duplicate/escaped keys, trailing data and comments', () => scratch(directory => {
  const file = path.join(directory, 'manifest.json');
  for (const input of ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{} {}', '{/* comment */}', '{"a":1,}']) {
    fs.writeFileSync(file, input); assert.throws(() => readContractJSON(file));
  }
}));

test('CLI flags reject duplicates, unknown target/strict switches and invalid scopes', () => {
  assert.deepEqual(parseMigrationArgs(['--help']), { help: true });
  assert.equal(parseMigrationArgs(['--manifest', 'fixture.json']).scope, 'full');
  for (const args of [[], ['--manifest'], ['--manifest','a','--manifest','b'], ['--manifest','a','--strict'], ['--manifest','a','--target','https://other.test'], ['--manifest','a','--scope','anything'], ['--manifest','a','--format','yaml'], ['--help','--scope','url']]) assert.throws(() => parseMigrationArgs(args));
});

test('CLI emits scoped JSON/Markdown, uses ignored defaults and refuses existing destinations', () => scratch(directory => {
  execFileSync('git', ['init', '-q'], { cwd: directory });
  fs.writeFileSync(path.join(directory, '.gitignore'), '.emdash/migration-acceptance/\n');
  const args = ['--manifest', path.join(fixture,'manifest.json'), '--observations', path.join(fixture,'observations.json'), '--scope','url'];
  const success = invoke(directory, args); assert.equal(success.status, 0, success.stderr);
  const report = JSON.parse(success.stdout); assert.equal(report.exitCode, 0);
  const out = path.join(directory,'.emdash/migration-acceptance',report.run.id);
  assert.ok(fs.existsSync(path.join(out,'report.json'))); assert.ok(fs.existsSync(path.join(out,'report.md')));
  execFileSync('git',['check-ignore',out],{cwd:directory,stdio:'pipe'});
  const existing = invoke(directory,[...args,'--out',out]); assert.equal(existing.status,2);
  const markdown = invoke(directory,[...args,'--format','markdown','--out',path.join(directory,'sanitized-example')]);
  assert.equal(markdown.status,0); assert.match(markdown.stdout,/outside this result/); assert.equal(fs.existsSync(path.join(directory,'sanitized-example/report.json')),false);
  const full = invoke(directory,['--manifest',path.join(fixture,'manifest.json'),'--observations',path.join(fixture,'observations.json'),'--out',path.join(directory,'unknown')]);
  assert.equal(full.status,2); assert.equal(JSON.parse(full.stdout).result,'unverified');
}));

test('CLI refuses malformed inputs before output and linked evidence is required-unverified', () => scratch(directory => {
  const file = path.join(directory,'bad.json'), out = path.join(directory,'no-output');
  fs.writeFileSync(file,'{"manifestVersion":1,"manifestVersion":1}');
  assert.equal(invoke(directory,['--manifest',file,'--out',out]).status,2); assert.equal(fs.existsSync(out),false);
  fs.cpSync(fixture,path.join(directory,'fixture'),{recursive:true});
  const local = path.join(directory,'fixture'), artifacts = path.join(local,'artifacts');
  fs.renameSync(artifacts,path.join(directory,'outside'));
  fs.symlinkSync(path.join(directory,'outside'),artifacts,process.platform==='win32'?'junction':'dir');
  const linked = invoke(directory,['--manifest',path.join(local,'manifest.json'),'--observations',path.join(local,'observations.json'),'--scope','url','--out',path.join(directory,'linked-report')]);
  assert.equal(linked.status,2); assert.equal(JSON.parse(linked.stdout).result,'unverified');
}));
