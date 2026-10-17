import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { collectionColumnCounts, COLLECTION_COLUMN_BUDGET } from './schema-column-budget.mjs';
import { capabilityRules } from './audit-capabilities.mjs';
import { designSystemRules } from './audit-design-system.mjs';
import { skillFinding } from './audit-skills.mjs';
import { assertReport } from './audit-report.mjs';
import { runtimeEvidenceRules } from './audit-runtime-evidence.mjs';
import { readTarget, readJSON, within, canonicalOutput, sha256 as digest, gitRead } from './audit-evidence.mjs';

export const STANDARD = Object.freeze({ version: '0.1.1', commit: '28ccf82b3047eb615cd57ca55141751e0d29af11', sha256: 'a30dfde700dac0ead090ca19f743312d5bb4cd886aa51facd387c372db56b2c4' });
const starterRoot = fileURLToPath(new URL('../', import.meta.url));
function loadStandard(file) {
  const bytes = fs.readFileSync(file ?? path.join(starterRoot, 'standards/baselines/0.1.1.json'));
  if (digest(bytes) !== STANDARD.sha256) throw Error('Standards artifact digest mismatch; diagnosis refused');
  const manifest = JSON.parse(bytes.toString('utf8'));
  if (manifest.standardsVersion !== STANDARD.version || manifest.status !== 'certified-scoped') throw Error('Unsupported standards artifact');
  return manifest;
}
const version = value => typeof value === 'string' && /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(value) ? value : null;

import { splitSQL } from './d1-snapshot.mjs';

export function ingestSQLSchema(db, text) {
  db.exec('PRAGMA foreign_keys = OFF;');
  const statements = splitSQL(text);
  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (!trimmed) continue;
    if (/^CREATE\s+(?:TABLE|UNIQUE\s+INDEX|INDEX)\b/i.test(trimmed) || /^ALTER\s+TABLE\b/i.test(trimmed)) {
      try {
        db.exec(trimmed);
      } catch {
        // Skip statements that cannot be executed in embedded SQLite (e.g. unsupported virtual table modules)
      }
    }
  }
}

export function auditSite({ root, runtime = 'node-sqlite', standardsFile, dbSnapshot, evidence } = {}) {
  const target = fs.realpathSync(path.resolve(root ?? '.'));
  if (!fs.statSync(target).isDirectory()) throw Error('Target must be a directory');
  const manifest = loadStandard(standardsFile);
  if (!Object.hasOwn(manifest.runtimeProfiles, runtime)) throw Error('Unknown runtime profile');
  const rules = [];
  const add = (id, status, expected, observed, { required = true, evidence = [], confidence = 'high', remediation = 'docs/site-standards-audit.md', applicability = runtime } = {}) => rules.push({ id, ruleVersion: 1, status, severity: required ? 'required' : 'recommendation', expected, observed, evidence, confidence, applicability, remediation, verification: 'Static diagnosis only; no target scripts, network, CMS, installs or deployments' });
  const pkg = readJSON(target, 'package.json');
  const lock = readJSON(target, 'package-lock.json');
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const packagesObserved = record(pkg.data) && record(lock.data?.packages);
  add('package-evidence', packagesObserved ? 'pass' : 'unverified', 'Readable package object and npm package inventory', packagesObserved ? 'Observed; contents withheld' : 'Missing, invalid or refused evidence', { evidence: ['package.json', 'package-lock.json'] });
  add('runtime-profile', runtime === 'node-sqlite' ? 'pass' : 'unverified', 'A certified source standards profile', manifest.runtimeProfiles[runtime].status, { evidence: ['standards/baselines/0.1.1.json'] });
  for (const [name, expectedRange] of Object.entries(manifest.runtimeProfiles['node-sqlite'].dependencies)) {
    const expected = expectedRange.replace(/^\^/, '');
    const observed = version(lock.data?.packages?.[`node_modules/${name}`]?.version);
    add(`dependency:${name}`, !observed ? 'unverified' : observed === expected ? 'pass' : 'warning', `Certified comparison version ${expected}`, observed ?? 'No valid locked version', { required: false, evidence: ['package-lock.json'], applicability: 'Static lockfile comparison, not runtime compatibility or an upgrade ceiling' });
  }
  const engine = pkg.data?.engines?.node;
  const safeEngine = typeof engine === 'string' && /^[\d v^~<>=|.*x-]+$/.test(engine);
  const exactPolicy = safeEngine && engine.replaceAll(/\s/g, '') === manifest.runtimeProfiles['node-sqlite'].nodeEngineRange.replaceAll(/\s/g, '');
  add('node-policy', !safeEngine ? 'unverified' : exactPolicy ? 'pass' : 'warning', 'Minimum 22.22.2; recommend current Node 24 LTS patch', safeEngine ? `Declared ${engine}; executing audit on ${process.version}` : 'No safe declaration observed', { required: false, evidence: ['package.json'], applicability: 'Exact declared baseline policy comparison only; not deployment runtime or general semver evaluation' });
  const hashes = {};
  for (const relative of ['astro.config.mjs', 'src/live.config.ts', 'src/styles/global.css', 'package-lock.json']) {
    const result = readTarget(target, relative);
    hashes[relative] = result.bytes ? digest(result.bytes) : null;
  }
  capabilityRules(readTarget(target, 'astro.config.mjs').bytes?.toString('utf8'), runtime, add);
  designSystemRules(target, add);
  const scripts = pkg.data?.scripts;
  add('schema-prebuild', scripts?.['check:schema-budget'] === 'node scripts/check-schema-budget.mjs' && /^(?:npm run check:schema-budget)(?:$| && )/.test(scripts?.prebuild ?? '') ? 'pass' : scripts && typeof scripts === 'object' ? 'warning' : 'unverified', 'Schema preflight before the existing build hook', 'Command presence is static evidence; missing DB still needs measurement', { required: false, evidence: ['package.json'], remediation: 'schema-budget-prebuild@1' });
  for (const group of ['emdash', 'site']) {
    const finding = skillFinding(target, group);
    add(`skills:${group}`, finding.status, 'Complete managed membership and normalized hashes versus recorded snapshot', finding.observed, { evidence: [`.emdash/${group === 'emdash' ? 'upstream' : 'site'}-skills.json`], confidence: 'bounded-static' });
  }
  add('upstream-currency', 'unverified', 'Dated upstream version/source decisions', 'Offline inventory is not an upstream freshness check', { required: false, confidence: 'none' });
  if (!dbSnapshot) add('physical-schema', 'unverified', `Actual physical collection widths <= ${COLLECTION_COLUMN_BUDGET}`, 'No explicit offline SQLite snapshot supplied');
  else {
    const snapshot = path.resolve(dbSnapshot);
    // Inspect a private copy only. Never open a target's live DB or create its WAL/SHM files.
    let source;
    try { source = path.join(fs.realpathSync(path.dirname(snapshot)), path.basename(snapshot)); } catch { source = snapshot; }
    let refused = true;
    try { refused = fs.lstatSync(source).isSymbolicLink() || ['-wal', '-shm', '-journal'].some(suffix => fs.existsSync(source + suffix)) || !fs.statSync(source).isFile() || fs.statSync(source).size > 64 * 1024 * 1024; } catch { /* Missing/offline snapshots stay unverified. */ }
    if (refused) {
      add('physical-schema', 'unverified', 'Closed, consistent bounded offline snapshot without sidecars', 'Snapshot refused; snapshot contents and names withheld');
    } else {
      const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-schema-'));
      let db;
      try {
        const copy = path.join(scratch, 'snapshot.sqlite');
        const isSqlDump = source.endsWith('.sql') || (() => {
          try {
            const header = Buffer.alloc(16);
            const fd = fs.openSync(source, 'r');
            fs.readSync(fd, header, 0, 16, 0);
            fs.closeSync(fd);
            return header.toString('utf8', 0, 15) !== 'SQLite format 3';
          } catch { return false; }
        })();

        if (isSqlDump) {
          db = new DatabaseSync(copy);
          ingestSQLSchema(db, fs.readFileSync(source, 'utf8'));
          db.exec('PRAGMA query_only=ON');
        } else {
          fs.copyFileSync(source, copy);
          db = new DatabaseSync(copy, { readOnly: true });
          db.exec('PRAGMA query_only=ON');
        }
        const measured = collectionColumnCounts(db);
        const counts = measured.map(({ columns }) => columns);
        const generated = measured.reduce((sum, { table }) => sum + db.prepare(`PRAGMA table_xinfo("${table.replaceAll('"', '""')}")`).all().filter(column => column.hidden !== 0).length, 0);
        const definitionHash = digest(JSON.stringify(db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all()));
        add('physical-schema', !counts.length ? 'unverified' : counts.some(n => n > COLLECTION_COLUMN_BUDGET) ? 'fail' : 'pass', `Actual physical collection widths <= ${COLLECTION_COLUMN_BUDGET}`, { collections: counts.length, physicalWidths: counts, generatedOrHiddenColumns: generated, schemaSHA256: definitionHash, snapshotSHA256: digest(fs.readFileSync(copy)) }, { applicability: 'Explicit offline snapshot only; no seed inference, D1 or content row reads' });
      } catch { add('physical-schema', 'unverified', 'Readable supported SQLite schema', 'Snapshot could not be measured'); }
      finally { db?.close(); if (path.dirname(scratch) !== fs.realpathSync(os.tmpdir()) && path.dirname(scratch) !== path.resolve(os.tmpdir())) throw Error('Unsafe scratch cleanup'); fs.rmSync(scratch, { recursive: true, force: true }); }
    }
  }
  runtimeEvidenceRules(target, evidence, runtime, add);
  for (const id of ['visual-accessibility', 'forms-provider-delivery', 'cloudflare-d1-r2']) add(id, 'unverified', 'Explicit runtime/editor/visual or named remote evidence', 'Not executed by static diagnosis; captures cannot establish conformance', { required: false, confidence: 'none' });
  let git = { status: 'unverified' };
  try {
    const command = (...args) => gitRead(target, ...args);
    if (fs.realpathSync(command('rev-parse', '--show-toplevel')) !== target) throw Error('Target is not the Git root');
    const revision = command('rev-parse', '--verify', 'HEAD');
    git = { status: 'observed', revision: /^[a-f0-9]{40,64}$/.test(revision) ? revision : null, trackedDirty: Boolean(command('status', '--porcelain', '--untracked-files=no')), note: 'Untracked paths and repository remotes withheld' };
  } catch { /* An unavailable Git checkout is not a clean-tree assertion. */ }
  return assertReport({ schemaVersion: 2, generatedAt: new Date().toISOString(), stage: 'static-diagnosis', target: { label: 'audited-repository', git, configurationSHA256: hashes }, standards: { ...STANDARD, source: 'Digest-verified offline manifest; original private Git history not required' }, runtime, mutationPolicy: 'No target writes, target script/config execution or network; explicit reports outside target and isolated temporary snapshot copy only', rules, summary: Object.fromEntries(['pass', 'fail', 'warning', 'unverified', 'not-applicable'].map(status => [status, rules.filter(rule => rule.status === status).length])) });
}

export function strictFailure(report, { failsOnly = false } = {}) {
  if (failsOnly) return report.rules.some(rule => rule.status === 'fail');
  return report.rules.some(rule => rule.severity === 'required' && ['fail', 'unverified'].includes(rule.status));
}
export function followUpPlan(report) {
  assertReport(report);
  const byId = Object.fromEntries(report.rules.map(r => [r.id, r]));
  const items = [];

  // Track 1: Required blockers & skill provenance
  const skillFindings = ['skills:site', 'skills:emdash'].map(id => byId[id]).filter(r => r && r.status !== 'pass');
  if (skillFindings.length) {
    const hints = skillFindings.map(r => `${r.id} (${r.status}${r.observed?.missingSkillNames?.length ? `: missing ${r.observed.missingSkillNames.join(', ')}` : ''})`).join('; ');
    items.push(`1. **Synchronize skills & provenance manifests (${hints})**: Run \`npm run sync:site-skills\` and \`npm run sync:emdash-skills\` on a feature branch, review staged diffs, and apply.`);
  }
  const schemaRule = byId['physical-schema'];
  if (schemaRule && schemaRule.status !== 'pass') {
    items.push(`1. **Measure physical schema (${schemaRule.status})**: Supply \`--db-snapshot <file.sqlite>\` or \`--d1-dump <export.sql>\` (via \`npm run db:export-d1\`) to verify all collection tables stay within the 50-column budget.`);
  }

  // Track 2: Design-system primitives, Card accessibility & component quarantine
  const dsRules = ['design-system:tokens-and-rhythm', 'design-system:card-and-breakout', 'design-system:quarantine-hud']
    .map(id => byId[id])
    .filter(r => r && r.status !== 'pass');
  if (dsRules.length) {
    const details = dsRules.map(r => `${r.id} (${r.status})`).join(', ');
    items.push(`2. **Modernize design-system primitives & component quarantine (${details})**: Align \`src/styles/global.css\` (\`interpolate-size\`, single \`.flow\` with duplicate-margin guard, \`.content-grid\` subgrid, \`[data-surface]\`, tokenized \`clamp()\` in \`@theme\`), refactor whole-card \`<a>\` wrappers into semantic \`<article>\` + \`.clickable-parent\`, and add \`/_styleguide\` (\`src/pages/_styleguide.astro\` + \`src/components/dev/Styleguide.astro\`).`);
  }

  // Track 3: Template adoption & component calibration
  const cardObs = byId['design-system:card-and-breakout']?.observed;
  const hudObs = byId['design-system:quarantine-hud']?.observed;
  if (cardObs && typeof cardObs === 'object') {
    if ((cardObs.breakoutPageCount ?? 0) === 0 || (cardObs.surfaceUsageCount ?? 0) === 0 || (hudObs && !hudObs.calibrationRecord)) {
      items.push(`3. **Adopt breakout/surface primitives in route templates & calibrate on \`/_styleguide\`** (\`breakoutPageCount: ${cardObs.breakoutPageCount ?? 0}\`, \`surfaceUsageCount: ${cardObs.surfaceUsageCount ?? 0}\`, \`calibrationRecord: ${Boolean(hudObs?.calibrationRecord)}\`): Opt long-form editorial routes into \`<Container breakout>\` (\`.content-grid\`), apply \`data-surface="dark|muted|brand"\` to contrasting sections, and record browser verification in \`audit/component-calibration.md\`.`);
    }
  }

  // Track 4: Dependencies, Node policy & prebuild guard
  const depWarnings = report.rules.filter(r => (r.id.startsWith('dependency:') || r.id === 'node-policy' || r.id === 'schema-prebuild') && r.status !== 'pass');
  if (depWarnings.length) {
    const summary = depWarnings.map(r => `${r.id}=${typeof r.observed === 'string' ? r.observed : r.status}`).join(', ');
    items.push(`4. **Evaluate framework, Node policy & prebuild alignment (${summary})**: Review \`engines.node\` and lockfile versions against the certified baseline profile, and apply \`schema-budget-prebuild@1\` if missing.`);
  }

  // Track 5: Runtime, visual & editor verification
  const runtimeUnverified = ['route-capture-evidence', 'editor-save-reload', 'visual-accessibility'].map(id => byId[id]).filter(r => r && r.status !== 'pass');
  if (runtimeUnverified.length) {
    items.push(`5. **Execute live browser & EmDash editor verification**: Inspect \`/_styleguide\` and representative public/editor routes across mobile and wide viewports, verify inline/admin editing round-trips, and run the site test suite before merging the modernization branch.`);
  }

  return items.length ? `\n## Recommended follow-up plan\n\n${items.join('\n')}\n` : '';
}

export function markdownReport(report) {
  assertReport(report);
  const cell = value => String(typeof value === 'object' ? JSON.stringify(value) : value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  return `# Site standards diagnosis\n\nStandards ${report.standards.version}; manifest SHA-256 ${report.standards.sha256}.\n\nDiagnostic scaffold; static passes do not certify the site. Missing evidence remains unverified.\n\n| Rule | Status | Severity | Observation |\n| --- | --- | --- | --- |\n${report.rules.map(rule => `| ${cell(rule.id)} | ${rule.status} | ${rule.severity} | ${cell(rule.observed)} |`).join('\n')}\n${followUpPlan(report)}`;
}
export function writeReports(report, out, target) {
  assertReport(report);
  const output = canonicalOutput(out), root = fs.realpathSync(target);
  if (within(root, output)) throw Error('Report output must be outside the audited target');
  if (fs.existsSync(output)) throw Error('Report output already exists; choose a new directory');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  fs.writeFileSync(path.join(output, 'report.md'), markdownReport(report), { flag: 'wx' });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const values = {}; let strict = false, strictFails = false;
    const names = { '--root': 'root', '--runtime': 'runtime', '--standards-file': 'standardsFile', '--db-snapshot': 'dbSnapshot', '--d1-dump': 'dbSnapshot', '--evidence': 'evidence', '--out': 'out' };
    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (arg === '--strict' && !strict) { strict = true; continue; }
      if (arg === '--strict-fails' && !strictFails) { strictFails = true; continue; }
      if (!names[arg] || Object.hasOwn(values, names[arg]) || !process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw Error('Usage: audit:site -- --root <repo> [--runtime node-sqlite|cloudflare-d1-r2] [--standards-file <pinned-manifest>] [--db-snapshot <offline-snapshot>] [--d1-dump <sql-dump>] [--evidence <bundle.json>] [--out <new-directory-outside-target>] [--strict] [--strict-fails]');
      values[names[arg]] = process.argv[++i];
    }
    const report = auditSite(values);
    if (values.out) writeReports(report, values.out, path.resolve(values.root ?? '.'));
    else console.log(JSON.stringify(report, null, 2));
    if (strict && strictFailure(report)) process.exitCode = 1;
    else if (strictFails && strictFailure(report, { failsOnly: true })) process.exitCode = 1;
  } catch (error) { console.error(/^(?:Usage:|Standards artifact digest mismatch; diagnosis refused$|Unsupported standards artifact$|Unknown runtime profile$|Report output must be outside the audited target$|Report output already exists; choose a new directory$)/.test(error.message) ? error.message : 'Audit unavailable; no target scripts or remediation were executed.'); process.exitCode = 2; }
}
