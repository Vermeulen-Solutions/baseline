import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { auditSite, strictFailure, writeReports, markdownReport, STANDARD } from '../scripts/audit-site.mjs';
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

test('D1 SQL dump ingestion measures physical schema directly without requiring binary SQLite snapshot', () => fixture((root) => {
  current(root);
  const sqlDump = path.join(root, 'd1-export.sql');
  fs.writeFileSync(sqlDump, [
    'PRAGMA foreign_keys = OFF;',
    'CREATE TABLE "ec_pages" (id TEXT PRIMARY KEY, title TEXT, generated TEXT AS (title) VIRTUAL);',
    'CREATE TABLE "ec_events" (id TEXT PRIMARY KEY, name TEXT);',
    'CREATE VIRTUAL TABLE "_emdash_fts_pages" USING fts5(title);',
    "INSERT INTO \"ec_pages\" VALUES ('1', 'Test', 'Test');",
    'CREATE TRIGGER trg_test AFTER INSERT ON ec_pages BEGIN SELECT 1; END;'
  ].join('\n'));

  // Test passing .sql via dbSnapshot
  const report1 = auditSite({ root, dbSnapshot: sqlDump });
  assert.equal(rule(report1, 'physical-schema').status, 'pass');
  assert.deepEqual(rule(report1, 'physical-schema').observed.physicalWidths.sort(), [2, 3]);

  // Test via CLI with --d1-dump
  const cliResult = spawnSync(process.execPath, [fileURLToPath(script), '--root', root, '--d1-dump', sqlDump], { encoding: 'utf8' });
  assert.equal(cliResult.status, 0, cliResult.stderr);
  const parsed = JSON.parse(cliResult.stdout);
  assert.equal(rule(parsed, 'physical-schema').status, 'pass');

  // Test --strict-fails exits 0 when no rules fail (even if required unknowns exist)
  const strictFailsResult = spawnSync(process.execPath, [fileURLToPath(script), '--root', root, '--d1-dump', sqlDump, '--strict-fails'], { encoding: 'utf8' });
  assert.equal(strictFailsResult.status, 0, strictFailsResult.stderr);
}));

test('AST analyzer supports dual-runtime ternaries for adapter and database/storage', () => fixture((root) => {
  current(root);
  const dualConfig = [
    'import { defineConfig } from "astro/config";',
    'import node from "@astrojs/node";',
    'import cloudflare from "@astrojs/cloudflare";',
    'import react from "@astrojs/react";',
    'import emdash, { local } from "emdash/astro";',
    'import { sqlite } from "emdash/db";',
    'import { d1, r2 } from "@emdash-cms/cloudflare";',
    'const onCloudflare = process.env.EMDASH_TARGET === "cloudflare";',
    'export default defineConfig({',
    '  output: "server",',
    '  adapter: onCloudflare ? cloudflare() : node({ mode: "standalone" }),',
    '  integrations: [',
    '    react(),',
    '    emdash({',
    '      database: onCloudflare ? d1({ binding: "DB" }) : sqlite({ url: "file:./data.db" }),',
    '      storage: onCloudflare ? r2({ binding: "MEDIA" }) : local({ directory: "./uploads" })',
    '    })',
    '  ]',
    '});'
  ].join('\n');
  fs.writeFileSync(path.join(root, 'astro.config.mjs'), dualConfig);

  // Auditing for node-sqlite profile
  const nodeReport = auditSite({ root, runtime: 'node-sqlite' });
  assert.equal(rule(nodeReport, 'capability:adapter').status, 'pass');
  assert.equal(rule(nodeReport, 'capability:adapter').observed, 'node');
  assert.equal(rule(nodeReport, 'capability:storage').status, 'pass');

  // Auditing for cloudflare-d1-r2 profile
  const cfReport = auditSite({ root, runtime: 'cloudflare-d1-r2' });
  assert.equal(rule(cfReport, 'capability:adapter').status, 'pass');
  assert.equal(rule(cfReport, 'capability:adapter').observed, 'cloudflare');
  assert.equal(rule(cfReport, 'capability:storage').status, 'pass');
}));

test('declared skill overrides are documented rather than reporting unexpected drift', () => fixture((root) => {
  current(root);
  fs.mkdirSync(path.join(root, '.agents/skills/new-site-workflow'), { recursive: true });
  fs.mkdirSync(path.join(root, '.emdash'));
  fs.writeFileSync(path.join(root, '.agents/skills/new-site-workflow/SKILL.md'), '# Local Customized\n');
  const manifest = {
    formatVersion: 2,
    commitSha: 'a'.repeat(40),
    skills: [
      'new-site-workflow',
      'site-art-direction',
      'impeccable',
      'emdash-site-setup',
      'wordpress-to-emdash-content',
      'astro-site-design',
      'emdash-content-modeling',
      'emdash-production-cutover'
    ],
    files: {
      'new-site-workflow/SKILL.md': 'b'.repeat(64),
      'site-art-direction/SKILL.md': 'c'.repeat(64),
      'impeccable/SKILL.md': 'd'.repeat(64),
      'emdash-site-setup/SKILL.md': 'e'.repeat(64),
      'wordpress-to-emdash-content/SKILL.md': 'f'.repeat(64),
      'astro-site-design/SKILL.md': '0'.repeat(64),
      'emdash-content-modeling/SKILL.md': '1'.repeat(64),
      'emdash-production-cutover/SKILL.md': '2'.repeat(64)
    },
    overrides: {
      'new-site-workflow/SKILL.md': 'Site-specific workflow adjustments'
    }
  };
  fs.writeFileSync(path.join(root, '.emdash/site-skills.json'), JSON.stringify(manifest));

  // Without the required skills present, missingSkills is reported
  const finding = rule(auditSite({ root }), 'skills:site');
  assert.equal(finding.observed.declaredOverrides, 1);
  assert.match(finding.observed.localOverrides, /1 declared local override\(s\) documented/);
  assert.ok(Array.isArray(finding.observed.missingSkillNames));
  assert.ok(finding.observed.missingSkillNames.includes('emdash-production-cutover'));
  assert.equal(finding.observed.manifestFormatVersion, 2);
}));

test('design-system drift rules detect brownfield CSS/Card gaps and pass on baseline primitives', () => fixture((root) => {
  current(root);
  fs.mkdirSync(path.join(root, 'src/styles'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/components'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/pages'), { recursive: true });

  // Simulate brownfield CSS and whole-card anchor anti-pattern
  fs.writeFileSync(path.join(root, 'src/styles/global.css'), [
    ':root { --color-ink: #111; }',
    '.flow > * + * { margin-top: 1rem; }',
    '.flow > * + * { margin-top: 1rem; }',
    '.hero { padding: clamp(1rem, 3vw, 2rem); }'
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'src/components/Container.astro'), '<div class="container-shell"><slot /></div>\n');
  fs.writeFileSync(path.join(root, 'src/components/EditorialCard.astro'), '<a class="editorial-card" href={href}><h3>{title}</h3></a>\n');

  const brownfield = auditSite({ root });
  const tokensRule = rule(brownfield, 'design-system:tokens-and-rhythm');
  assert.equal(tokensRule.status, 'warning');
  assert.equal(tokensRule.observed.interpolateSize, false);
  assert.equal(tokensRule.observed.flowRuleCount, 2);
  assert.equal(tokensRule.observed.adHocClampCount, 1);

  const cardRule = rule(brownfield, 'design-system:card-and-breakout');
  assert.equal(cardRule.status, 'warning');
  assert.equal(cardRule.observed.containerBreakout, false);
  assert.equal(cardRule.observed.wholeCardAnchorCount, 1);

  const hudRule = rule(brownfield, 'design-system:quarantine-hud');
  assert.equal(hudRule.status, 'warning');
  assert.equal(hudRule.observed.styleguideRoute, false);
  assert.equal(hudRule.observed.styleguideComponent, false);

  const md = markdownReport(brownfield);
  assert.match(md, /## Recommended follow-up plan/);
  assert.match(md, /Modernize design-system primitives & component quarantine/);

  // Verify baseline itself passes all three design-system rules
  const starterRoot = fileURLToPath(new URL('../', import.meta.url));
  const baselineReport = auditSite({ root: starterRoot });
  assert.equal(rule(baselineReport, 'design-system:tokens-and-rhythm').status, 'pass');
  assert.equal(rule(baselineReport, 'design-system:card-and-breakout').status, 'pass');
  assert.equal(rule(baselineReport, 'design-system:quarantine-hud').status, 'pass');
}));


