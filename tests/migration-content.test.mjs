import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { contractDigest, declarations, resultOf, sha256, validateManifest, validateMigrationReport, validateObservations } from '../standards/schemas/migration-acceptance.mjs';
import { inventoryTotals, validateContentInventory, validateContentMapping } from '../standards/schemas/migration-content.mjs';
import { readContentInventory, reconcileContent } from '../scripts/migration-content.mjs';
import { runMigration } from '../scripts/migration-verify.mjs';
import { migrationMarkdown } from '../scripts/migration-report.mjs';

const fixture = fileURLToPath(new URL('./fixtures/migration-content/', import.meta.url));
const load = name => JSON.parse(fs.readFileSync(path.join(fixture, name + '.json'), 'utf8'));
const sample = () => ({ source: load('source'), target: load('target'), mapping: load('mapping'), manifest: load('manifest') });
const evaluate = data => reconcileContent(data.source, data.target, data.mapping, data.manifest);
const outcome = r => resultOf(r.checks.map(c => ({ ...c, required: true })));
const codes = r => r.summary.findings.map(f => f.code);
const refresh = d => { d.source.coverage = inventoryTotals(d.source.entities); d.target.coverage = inventoryTotals(d.target.entities); return d; };
function expected(e) { const { requiredFields: _required, title, ...rest } = e; return { ...rest, titleSHA256: contractDigest(title) }; }

test('versioned normalized fixtures, mappings and count-only JSON/Markdown reports validate', () => {
  const d = sample();
  assert.deepEqual(validateContentInventory(d.source, 'source'), []);
  assert.deepEqual(validateContentInventory(d.target, 'target'), []);
  assert.deepEqual(validateContentMapping(d.mapping), []);
  assert.deepEqual(validateManifest(d.manifest), []);
  assert.equal(outcome(evaluate(d)).exitCode, 0);
  const report = load('report');
  assert.deepEqual(validateMigrationReport(report, d.manifest), []);
  assert.equal(migrationMarkdown(report), fs.readFileSync(path.join(fixture, 'report.md'), 'utf8'));
  assert.equal(report.exitCode, 0);
});

test('explicit merge changes totals deliberately while preserving fields and media', () => {
  const d = sample(), e = structuredClone(d.source.entities[0]); e.id = 'wp-extra'; d.source.entities.push(e);
  d.mapping.rules[0].kind = 'merge'; d.mapping.rules[0].sources.push(e.id);
  d.mapping.rules[0].fieldLinks.push({ ...d.mapping.rules[0].fieldLinks[0], sourceId: e.id });
  assert.equal(outcome(evaluate(refresh(d))).exitCode, 0);
  assert.notEqual(d.source.entities.length, d.target.entities.length);
});

test('explicit split distributes source fields to multiple target entries', () => {
  const d = sample(), e = structuredClone(d.target.entities[0]); e.id = 'target-split'; e.slug = 'second-part'; e.translationGroup = null;
  d.target.entities.push(e); const r = d.mapping.rules[0]; r.kind = 'split'; r.relationships = 'replace'; r.reason = 'Reviewed split gives the second part its own translation membership.'; r.targets.push(expected(e));
  assert.equal(outcome(evaluate(refresh(d))).exitCode, 0);
});

test('source deletion, missing target and unaccounted extra source entities are confirmed failures', () => {
  for (const change of [d => d.source.entities.shift(), d => d.target.entities.shift(), d => { const e = structuredClone(d.source.entities[0]); e.id = 'wp-new'; d.source.entities.push(e); }]) {
    const d = sample(); change(d); refresh(d);
    assert.equal(outcome(evaluate(d)).exitCode, 1);
  }
});

test('equal aggregate totals with substituted target IDs fail entity identity', () => {
  const d = sample(); d.target.entities[0].id = 'wrong-private-id';
  const r = evaluate(d);
  assert.deepEqual(r.summary.target, r.summary.expectedTarget);
  assert.equal(outcome(r).exitCode, 1);
  assert.ok(codes(r).includes('missing-target')); assert.ok(codes(r).includes('unexpected-target'));
});

test('slug changes require mapped expectations; raw draft/private/future transformations are explicit', () => {
  const d = sample(); d.target.entities[0].slug = 'changed-without-rule';
  assert.equal(outcome(evaluate(d)).exitCode, 1);
  d.mapping.rules[0].targets[0].slug = 'changed-without-rule';
  assert.equal(outcome(evaluate(d)).exitCode, 0);
  for (const [source, target] of [['draft', 'draft'], ['private', 'draft'], ['future', 'scheduled']]) {
    const d = sample(); d.source.entities[0].status = source; d.target.entities[0].status = target; d.mapping.rules[0].targets[0].status = target;
    assert.equal(outcome(evaluate(refresh(d))).exitCode, 0);
    d.target.entities[0].status = 'published'; refresh(d);
    assert.equal(outcome(evaluate(d)).exitCode, 1);
  }
});

test('duplicate assignments, contradictory cardinality, URL IDs and missing exclusion reasons are invalid', () => {
  for (const change of [m => m.rules.push(structuredClone(m.rules[0])), m => m.rules[0].kind = 'merge', m => m.rules[0].sources[0] = 'https://legacy.example.test/page', m => m.rules[0].reason = '', m => { m.rules[0].kind = 'exclude'; m.rules[0].targets = []; m.rules[0].fieldLinks = []; m.rules[0].reason = ''; }]) {
    const d = sample(); change(d.mapping); assert.ok(validateContentMapping(d.mapping).length);
    assert.equal(outcome(evaluate(d)).exitCode, 2);
  }
  const d = sample(); d.mapping.rules[1].targets[0].id = d.mapping.rules[0].targets[0].id;
  assert.ok(validateContentMapping(d.mapping).length);
});

test('documented exclusions account for source records without requiring target rows', () => {
  const d = sample(), r = d.mapping.rules[1]; r.kind = 'exclude'; r.targets = []; r.fieldLinks = []; r.reason = 'Synthetic obsolete article intentionally omitted.';
  d.target.entities.splice(1, 1);
  assert.equal(outcome(evaluate(refresh(d))).exitCode, 0);
});

test('broken parents, unexpected translation groups, duplicate locales and cycles fail', () => {
  for (const change of [d => d.target.entities[1].parentId = 'missing-parent', d => d.target.entities[1].translationGroup = 'wrong-group', d => { d.target.entities[1].translationGroup = d.target.entities[0].translationGroup; d.target.entities[1].locale = d.target.entities[0].locale; }, d => { d.target.entities[0].parentId = d.target.entities[1].id; d.target.entities[1].parentId = d.target.entities[0].id; }]) {
    const d = sample(); change(d); refresh(d); assert.equal(outcome(evaluate(d)).exitCode, 1);
  }
  const d = sample(); d.source.entities[0].locale = null;
  assert.equal(outcome(evaluate(d)).exitCode, 2);
});

test('missing media catalog entries, lost attachment mappings and unresolved media fail', () => {
  for (const change of [d => d.target.media.splice(0), d => d.target.media[0].resolved = false, d => d.target.entities[0].mediaIds.splice(0), d => d.mapping.media.splice(0)]) {
    const d = sample(); change(d); assert.equal(outcome(evaluate(d)).exitCode, 1);
  }
  const d = sample(); d.target.entities[0].mediaIds = null;
  assert.equal(outcome(evaluate(d)).exitCode, 2);
});

test('required source/target fields and preservation links detect unavailable and changed data', () => {
  const d = sample(); d.target.entities[0].fields.content = contractDigest('different editorial value');
  assert.equal(outcome(evaluate(d)).exitCode, 1);
  d.target.entities[0].fields.content = null;
  assert.equal(outcome(evaluate(d)).exitCode, 2);
  const a = sample(); delete a.source.entities[0].fields.content;
  assert.equal(outcome(evaluate(a)).exitCode, 1);
  const b = sample(); b.mapping.rules[0].fieldLinks = [];
  assert.equal(outcome(evaluate(b)).exitCode, 1);
});

test('declared SEO compares titles, descriptions, canonical production origin and noindex', () => {
  for (const [field, value] of [['title', 'Wrong SEO'], ['description', 'Wrong description'], ['canonical', 'https://preview.example.test/en/example/'], ['noindex', true]]) {
    const d = sample(); d.target.entities[0].seo[field] = value;
    assert.equal(outcome(evaluate(d)).exitCode, 1);
  }
  const d = sample(); d.target.entities[0].seo = null;
  assert.equal(outcome(evaluate(d)).exitCode, 2);
  const a = sample(); a.mapping.seoPolicy = { fields: ['canonical'], canonical: 'explicit' };
  a.mapping.rules[0].targets[0].seo.canonical = 'https://preview.example.test/en/example/';
  assert.ok(codes(evaluate(a)).includes('seo-canonical-policy'));
});

test('incomplete inputs and declared coverage mismatch take precedence over retained failures', () => {
  for (const change of [d => d.source.complete = false, d => d.target.complete = false, d => d.source.coverage[0].total++, d => d.target.binding = 'stale-revision', d => d.source.entities[0].title = null, d => d.source.entities[0].slug = null, d => d.source = undefined, d => d.mapping = undefined]) {
    const d = sample(); change(d); const r = evaluate(d); assert.equal(outcome(r).exitCode, 2);
  }
  const d = sample(); d.source.complete = false; d.target.entities[0].slug = 'wrong';
  const r = evaluate(d); assert.equal(outcome(r).exitCode, 2);
  assert.ok(r.checks.some(c => c.status === 'fail'));
});

test('installed WxrPost JSON projection and ContentItem snapshot adapters retain stable identity and raw statuses', () => {
  const d = sample(), e = d.source.entities[0];
  const wrapper = { snapshotVersion: 1, format: 'wordpress-wxr-json/1', binding: d.source.binding, complete: true, coverage: d.source.coverage, media: d.source.media, records: [{ record: { id: 42, postType: 'page', status: 'future', postName: 'example', title: 'Example', postParent: 0, locale: 'en', content: 'Example content' }, evidence: { parentId: null, mediaIds: [], seo: null, requiredFields: ['content'] } }] };
  const s = readContentInventory(wrapper, 'source');
  assert.deepEqual(validateContentInventory(s, 'source'), []); assert.equal(s.entities[0].id, '42'); assert.equal(s.entities[0].status, 'future');
  wrapper.format = 'emdash-content-items/1'; wrapper.binding = d.target.binding;
  wrapper.records[0].record = { id: 'target-42', type: 'pages', slug: 'example', status: 'scheduled', locale: 'en', translationGroup: null, data: { title: 'Example', content: 'Example content' }, seo: { title: null, description: null, canonical: null, noIndex: true } };
  const t = readContentInventory(wrapper, 'target');
  assert.deepEqual(validateContentInventory(t, 'target'), []); assert.equal(t.entities[0].seo.noindex, true);
  assert.equal(t.entities[0].fields.content, s.entities[0].fields.content);
  s.coverage = inventoryTotals(s.entities); t.coverage = inventoryTotals(t.entities);
  const mapped = { ...d.mapping, rules: [{ id: 'snapshot-rule', kind: 'one-to-one', sources: ['42'], targets: [expected(t.entities[0])], reason: 'Reviewed synthetic snapshot conversion.', relationships: 'preserve', fieldLinks: [{ sourceId: '42', sourceField: 'content', targetId: 'target-42', targetField: 'content', mode: 'preserve', reason: 'Preserve synthetic field.' }] }], media: [], translationGroups: [], seoPolicy: { fields: [], canonical: 'explicit' } };
  assert.equal(outcome(reconcileContent(s, t, mapped, d.manifest)).exitCode, 0);
  wrapper.records[0].record.liveData = {}; assert.throws(() => readContentInventory(wrapper, 'target'));
  assert.throws(() => readContentInventory({ version: '1', content: {} }, 'target'));
  assert.equal(e.id.startsWith('http'), false);
});

async function scratch(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-migration-content-'));
  try { return await run(dir); }
  finally { assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir())); assert.match(path.basename(dir), /^baseline-migration-content-/); fs.rmSync(dir, { recursive: true, force: true }); }
}
async function bundle(dir, mutate = () => {}) {
  const d = sample(); mutate(d);
  const write = (name, value) => { const bytes = JSON.stringify(value, null, 2) + '\n'; fs.writeFileSync(path.join(dir, name + '.json'), bytes); return sha256(bytes); };
  for (const k of ['source', 'target', 'mapping']) d.manifest.inventories[k] = { reference: k + '.json', sha256: write(k, d[k]) };
  write('manifest', d.manifest);
  const evidence = 'Synthetic HTTP/editor attestation only.\n'; fs.writeFileSync(path.join(dir, 'proof.txt'), evidence);
  const observations = { observationsVersion: 3, manifestSHA256: contractDigest(d.manifest), sourceCaptureSHA256: d.manifest.sourceCapture.sha256, targetRevision: d.manifest.targetRevision, capturedAt: '2026-10-18T18:00:00.000Z', checks: declarations(d.manifest, 'full').filter(c => c.category !== 'content' && !c.id.endsWith(':excluded')).map(c => ({ id: c.id, status: 'pass', reason: 'Synthetic offline evidence.', observed: 'Synthetic check passed.', evidence: [{ path: 'proof.txt', sha256: sha256(evidence) }] })) };
  write('observations', observations);
  return { manifest: path.join(dir, 'manifest.json'), observations: path.join(dir, 'observations.json'), scope: 'full', format: 'both', out: path.join(dir, 'output') };
}

test('CLI combines offline HTTP/editor proofs with fresh inventory evidence, safely replays and redacts IDs/bodies', async () => scratch(async dir => {
  const options = await bundle(dir); const { report, out } = await runMigration(options);
  assert.equal(report.exitCode, 0); assert.deepEqual(validateMigrationReport(report, load('manifest')), []);
  const combined = JSON.parse(fs.readFileSync(path.join(out, 'observations.json')));
  assert.deepEqual(validateObservations(combined, load('manifest')), []);
  assert.equal((await runMigration({ ...options, observations: path.join(out, 'observations.json'), out: path.join(dir, 'replayed') })).report.exitCode, 0);
  const outputs = fs.readFileSync(path.join(out, 'report.json'), 'utf8') + fs.readFileSync(path.join(out, 'report.md'), 'utf8') + fs.readFileSync(path.join(out, 'content-evidence/reconciliation.json'), 'utf8');
  for (const secret of ['wp-101', 'emdash-private-101', 'Synthetic private editorial title', 'Example content']) assert.ok(!outputs.includes(secret), secret);
}));

test('CLI missing, altered, linked, incomplete or escaping inventory inputs remain unverified with partial findings', async () => {
  for (const action of ['missing', 'hash', 'incomplete', 'escaping']) await scratch(async dir => {
    const options = await bundle(dir, d => { if (action === 'incomplete') d.source.complete = false; d.target.entities[0].slug = 'wrong'; });
    if (action === 'missing') fs.unlinkSync(path.join(dir, 'source.json'));
    if (action === 'hash') fs.appendFileSync(path.join(dir, 'source.json'), ' ');
    if (action === 'escaping') {
      const m = JSON.parse(fs.readFileSync(options.manifest)); m.inventories.source.reference = '../source.json'; fs.writeFileSync(options.manifest, JSON.stringify(m));
      const o = JSON.parse(fs.readFileSync(options.observations)); o.manifestSHA256 = contractDigest(m); fs.writeFileSync(options.observations, JSON.stringify(o));
    }
    const { report } = await runMigration(options); assert.equal(report.exitCode, 2);
    assert.ok(report.content.findings.some(f => f.state === 'unverified'));
    if (action === 'incomplete') assert.ok(report.checks.some(c => c.status === 'fail'));
  });
});

test('URL-only scope never reads inventories, and full scope cannot infer editor acceptance', async () => scratch(async dir => {
  const options = await bundle(dir); fs.unlinkSync(path.join(dir, 'source.json'));
  const { report } = await runMigration({ ...options, scope: 'url' });
  assert.equal(report.exitCode, 0); assert.equal(report.content, null);
  assert.match(migrationMarkdown(report), /content, editor and provider parity were not assessed/);
  for (const c of report.checks.filter(c => c.category !== 'url')) assert.equal(c.status, 'not-applicable');
  const o = JSON.parse(fs.readFileSync(options.observations)); o.checks = o.checks.filter(c => c.category !== 'editor' && !c.id.startsWith('acceptance:')); fs.writeFileSync(options.observations, JSON.stringify(o));
  const full = await runMigration({ ...options, out: path.join(dir, 'full') }); assert.equal(full.report.exitCode, 2);
}));

test('v3 live HTTP and offline inventories coexist without certifying editor acceptance', async () => scratch(async dir => {
  const server = http.createServer((_req, res) => { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><title>Example</title><p>Example</p>'); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const options = await bundle(dir), m = load('manifest');
    m.targetOrigin = `http://127.0.0.1:${server.address().port}`;
    m.urls = [{ id: 'live-example', sourceUrl: m.sourceOrigin + '/example/', locale: 'en', disposition: 'retained', requestPath: '/example/', expected: { status: 200 } }];
    fs.writeFileSync(options.manifest, JSON.stringify(m));
    const { report } = await runMigration({ ...options, observations: undefined });
    assert.equal(report.mode, 'http-collected'); assert.equal(report.exitCode, 2);
    assert.ok(report.checks.filter(c => c.category === 'url' || c.category === 'content').every(c => c.status === 'pass'));
    assert.ok(report.checks.some(c => c.category === 'editor' && c.status === 'unverified'));
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}));

test('linked inventory inputs are unverified, and deliberate field replacement is explicit', async () => scratch(async dir => {
  const options = await bundle(dir);
  const real = path.join(dir, 'source-real.json'); fs.renameSync(path.join(dir, 'source.json'), real);
  // Directory junctions are supported without Windows symlink elevation.
  const linked = path.join(dir, 'linked'); fs.symlinkSync(dir, linked, 'junction');
  const m = JSON.parse(fs.readFileSync(options.manifest)); m.inventories.source.reference = 'linked/source-real.json'; fs.writeFileSync(options.manifest, JSON.stringify(m));
  const o = JSON.parse(fs.readFileSync(options.observations)); o.manifestSHA256 = contractDigest(m); fs.writeFileSync(options.observations, JSON.stringify(o));
  assert.equal((await runMigration(options)).report.exitCode, 2);
  fs.unlinkSync(linked);
  const d = sample(), hash = contractDigest('Reviewed rebuilt content');
  d.target.entities[0].fields.content = hash; d.mapping.rules[0].targets[0].fields.content = hash;
  assert.equal(outcome(evaluate(d)).exitCode, 1);
  d.mapping.rules[0].fieldLinks[0].mode = 'replace';
  assert.equal(outcome(evaluate(d)).exitCode, 0);
}));
