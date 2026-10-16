import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { auditSite, strictFailure, markdownReport } from '../scripts/audit-site.mjs';
import { configCapabilities } from '../scripts/audit-capabilities.mjs';
import { validateReport } from '../scripts/audit-report.mjs';
import { sources } from '../scripts/skill-sync.mjs';
import { normalizedHash } from '../scripts/audit-evidence.mjs';

const config = `import {defineConfig} from 'astro/config'; import host from '@astrojs/node'; import renderer from '@astrojs/react'; import cms, {local as disk} from 'emdash/astro'; import {sqlite as database} from 'emdash/db';
export default defineConfig({ output:'server', adapter:host({mode:'standalone'}), integrations:[renderer(),cms({database:database({url:'file:./data.db'}),storage:disk({directory:'./uploads'})})] });`;
const finding = (r, id) => r.rules.find(rule => rule.id === id);
function fixture(fn) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-coverage-')), root = path.join(parent, 'site'); fs.mkdirSync(root);
  const put = (file, bytes) => { const full = path.join(root, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, bytes); };
  put('astro.config.mjs', config); put('package.json', JSON.stringify({ engines: { node: '>=22.22.2' } }));
  const manifest = JSON.parse(fs.readFileSync(new URL('../standards/baselines/0.1.1.json', import.meta.url)));
  put('package-lock.json', JSON.stringify({ packages: Object.fromEntries(Object.entries(manifest.runtimeProfiles['node-sqlite'].dependencies).map(([name, v]) => ['node_modules/' + name, { version: v.replace('^', '') }])) }));
  for (const [group, source] of Object.entries(sources)) {
    const files = {};
    for (const skill of source.skills) { const file = skill + '/SKILL.md'; const bytes = Buffer.from('# Synthetic guidance\n'); put('.agents/skills/' + file, bytes); files[file] = normalizedHash(bytes); }
    put('.emdash/' + source.manifest, JSON.stringify({ formatVersion: 2, commitSha: 'a'.repeat(40), skills: source.skills, files }));
  }
  const snapshot = path.join(parent, 'offline.sqlite'); const db = new DatabaseSync(snapshot); db.exec('CREATE TABLE ec_example(id TEXT, title TEXT, derived TEXT AS (title) VIRTUAL)'); db.close();
  try { return fn({ root, parent, put, snapshot }); }
  finally { assert.equal(path.dirname(parent), path.resolve(os.tmpdir())); assert.match(path.basename(parent), /^baseline-coverage-/); fs.rmSync(parent, { recursive: true, force: true }); }
}

test('complete offline fixture passes implemented required scopes, with explicit runtime/upstream unknowns', () => fixture(({ root, snapshot }) => {
  const report = auditSite({ root, dbSnapshot: snapshot });
  assert.equal(report.schemaVersion, 2); assert.deepEqual(validateReport(report), []); assert.equal(strictFailure(report), false);
  for (const id of ['capability:server', 'capability:adapter', 'capability:cms', 'capability:storage', 'skills:site', 'skills:emdash', 'physical-schema']) assert.equal(finding(report, id).status, 'pass', id);
  assert.equal(finding(report, 'capability:i18n').status, 'not-applicable');
  assert.equal(finding(report, 'capability:cache-hints').status, 'not-applicable');
  assert.equal(finding(report, 'upstream-currency').status, 'unverified');
  assert.equal(finding(report, 'physical-schema').observed.generatedOrHiddenColumns, 1);
  assert.match(markdownReport(report), /capability:cms/);
}));
test('config AST ignores comments, accepts import aliases, never evaluates code, and refuses computed/spread/function configs', () => {
  assert.equal(configCapabilities(config).react, true);
  assert.equal(configCapabilities('// export default defineConfig({output:"server"})\nthrow new Error("never execute")').status, 'unverified');
  for (const source of [config.replace("output:'server'", "...unknown, output:'server'"), config.replace("output:'server'", "[key]:'server'"), config.replace('defineConfig({', 'defineConfig(() => ({').replace(' });', ' }));'), 'export default ???']) assert.equal(configCapabilities(source).status, 'unverified');
});
test('static defects fail; unknowns cannot pass; cache and locale opt-ins require appropriate evidence', () => fixture(({ root, put }) => {
  put('astro.config.mjs', config.replace("output:'server'", "output:'static'")); assert.equal(finding(auditSite({ root }), 'capability:server').status, 'fail');
  put('astro.config.mjs', config.replace('renderer(),', '')); assert.equal(finding(auditSite({ root }), 'capability:cms').status, 'fail');
  put('astro.config.mjs', config.replace("output:'server'", "cache:{provider:memoryCache()}, output:'server'")); const cached = auditSite({ root }); assert.equal(finding(cached, 'capability:cache-hints').status, 'unverified'); assert.equal(finding(cached, 'capability:cache-hints').severity, 'required');
  const locale = "i18n:{defaultLocale:'fr',locales:['fr','en'],routing:{prefixDefaultLocale:false}}, output:'server'";
  put('astro.config.mjs', config.replace("output:'server'", locale)); assert.equal(finding(auditSite({ root }), 'capability:i18n').status, 'pass');
  put('astro.config.mjs', config.replace("output:'server'", locale.replace('false', 'true'))); assert.equal(finding(auditSite({ root }), 'capability:i18n').status, 'fail');
  put('package.json', '[]'); assert.equal(finding(auditSite({ root }), 'package-evidence').status, 'unverified');
}));
test('managed inventory detects missing/extra/edited files and membership changes without exposing local paths', () => fixture(({ root, put }) => {
  put('.agents/skills/new-site-workflow/SKILL.md', '# Synthetic guidance\r\n'); assert.equal(finding(auditSite({ root }), 'skills:site').status, 'pass');
  put('.agents/skills/new-site-workflow/private-local-note.md', 'Project-specific override'); let result = finding(auditSite({ root }), 'skills:site'); assert.equal(result.status, 'fail'); assert.equal(result.observed.extraFiles, 1); assert.equal(JSON.stringify(result).includes('private-local-note'), false);
  fs.unlinkSync(path.join(root, '.agents/skills/new-site-workflow/private-local-note.md')); put('.agents/skills/new-site-workflow/SKILL.md', 'Edited'); result = finding(auditSite({ root }), 'skills:site'); assert.equal(result.observed.changedFiles, 1);
  fs.unlinkSync(path.join(root, '.agents/skills/new-site-workflow/SKILL.md')); result = finding(auditSite({ root }), 'skills:site'); assert.equal(result.observed.missingSkills, 1); assert.equal(result.status, 'fail');
  const file = '.emdash/site-skills.json', receipt = JSON.parse(fs.readFileSync(path.join(root, file))); receipt.skills.pop(); put(file, JSON.stringify(receipt)); assert.equal(finding(auditSite({ root }), 'skills:site').observed.manifestMembership, 'mismatch');
}));
test('traversal, linked managed roots, incomplete manifests and unsupported inventories stay unverified', () => fixture(({ root, parent, put }) => {
  const receipt = JSON.parse(fs.readFileSync(path.join(root, '.emdash/site-skills.json'))); receipt.files['../outside.md'] = 'a'.repeat(64); put('.emdash/site-skills.json', JSON.stringify(receipt)); assert.equal(finding(auditSite({ root }), 'skills:site').status, 'unverified');
  const external = path.join(parent, 'external'); fs.mkdirSync(external); fs.symlinkSync(external, path.join(root, '.agents/skills/new-site-workflow/linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(finding(auditSite({ root }), 'skills:site').status, 'unverified');
}));
test('report v2 rejects incompatible versions, unknown fields, invalid statuses, duplicates and incorrect totals', () => fixture(({ root }) => {
  const original = auditSite({ root });
  const edits = [r => r.schemaVersion = 1, r => r.privateRoot = '/private/example', r => r.constructor = 'unexpected', r => r.rules[0].status = 'ok', r => r.rules[0].ruleVersion = 0, r => r.rules[0].evidence = ['/private/example'], r => r.rules.push(r.rules[0]), r => r.summary.pass++, r => r.rules[0].observed = { invalid: NaN }];
  for (const edit of edits) { const report = structuredClone(original); edit(report); assert.ok(validateReport(report).length); assert.throws(() => markdownReport(report), /schema v2/); }
}));
