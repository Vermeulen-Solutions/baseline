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
import { packageLockEvidence } from './package-lock-evidence.mjs';

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
import { ruleActionability } from './audit-actionability.mjs';

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
  const add = (id, status, expected, observed, { required = true, evidence = [], confidence = 'high', remediation = 'docs/site-standards-audit.md', applicability = runtime } = {}) => {
    const rule = { id, ruleVersion: 1, status, severity: required ? 'required' : 'recommendation', expected, observed, evidence, confidence, applicability, remediation, verification: 'Static diagnosis only; no target scripts, network, CMS, installs or deployments' };
    rules.push({ ...rule, actionability: ruleActionability(rule) });
  };
  const pkg = readJSON(target, 'package.json');
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const lock = packageLockEvidence(target, pkg.data?.packageManager);
  const packagesObserved = record(pkg.data) && lock.status === 'observed';
  const packageEvidence = ['package.json', ...(lock.lockfile ? [lock.lockfile, ...(lock.alternateLockfile ? [lock.lockfile === 'package-lock.json' ? 'pnpm-lock.yaml' : 'package-lock.json'] : [])] : ['package-lock.json', 'pnpm-lock.yaml'])];
  add('package-evidence', packagesObserved ? 'pass' : 'unverified', 'Readable package object and one supported npm or pnpm package inventory', packagesObserved ? `Observed ${lock.manager} inventory${lock.alternateLockfile ? ' selected by packageManager; alternate lockfile ignored' : ''}; contents withheld` : lock.reason ?? 'Missing, invalid, ambiguous or refused evidence', { evidence: packageEvidence });
  add('runtime-profile', runtime === 'node-sqlite' ? 'pass' : 'unverified', 'A certified source standards profile', manifest.runtimeProfiles[runtime].status, { evidence: ['standards/baselines/0.1.1.json'] });
  for (const [name, expectedRange] of Object.entries(manifest.runtimeProfiles['node-sqlite'].dependencies)) {
    const expected = expectedRange.replace(/^\^/, '');
    const entry = lock.entries?.get(name);
    const observed = entry?.version;
    const status = !entry || entry.source === 'local' || !observed ? 'unverified' : observed === expected ? 'pass' : 'warning';
    const observation = entry?.source === 'local' ? 'Resolved from a local package source; registry baseline comparison is not applicable' : observed ?? 'No valid direct lock entry';
    add(`dependency:${name}`, status, `Certified comparison version ${expected}`, observation, { required: false, evidence: [lock.lockfile ?? 'package-lock.json'], applicability: 'Static lockfile comparison, not runtime compatibility or an upgrade ceiling' });
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
  if (lock.lockfile === 'pnpm-lock.yaml' || lock.alternateLockfile) hashes['pnpm-lock.yaml'] = lock.lockfile === 'pnpm-lock.yaml' ? lock.sha256 ?? null : lock.alternateLockfileSHA256 ?? null;
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
  return assertReport({ schemaVersion: 3, generatedAt: new Date().toISOString(), stage: 'static-diagnosis', target: { label: 'audited-repository', git, configurationSHA256: hashes }, standards: { ...STANDARD, source: 'Digest-verified offline manifest; original private Git history not required' }, runtime, mutationPolicy: 'No target writes, target script/config execution or network; explicit reports outside target and isolated temporary snapshot copy only', rules, summary: Object.fromEntries(['pass', 'fail', 'warning', 'unverified', 'not-applicable'].map(status => [status, rules.filter(rule => rule.status === status).length])) });
}

export function strictFailure(report, { failsOnly = false } = {}) {
  if (failsOnly) return report.rules.some(rule => rule.status === 'fail');
  return report.rules.some(rule => rule.severity === 'required' && ['fail', 'unverified'].includes(rule.status));
}
export function followUpPlan(report) {
  assertReport(report);
  const byId = Object.fromEntries(report.rules.map(rule => [rule.id, rule]));
  const groups = { verification_required: [], bounded_recipe: [], design_judgment: [], review_required: [] };
  const add = (kind, text) => groups[kind].push(text);
  const pending = ids => ids.map(id => byId[id]).filter(rule => rule && !['pass', 'not-applicable'].includes(rule.status));
  const schema = byId['schema-prebuild'];
  if (schema && !['pass', 'not-applicable'].includes(schema.status)) add(ruleActionability(schema), '**Evaluate schema prebuild recipe:** inspect the missing hook and the reviewed schema-budget-prebuild@1 plan. Its exact source/lock/revision preconditions must pass; preserve existing hooks and the package manager. Recipe classification is not permission to apply it or proof of eligibility.');
  if (pending(['physical-schema']).length) {
    if (byId['physical-schema'].status === 'fail') add('review_required', '**Review the measured schema failure:** plan a content-model/migration repair against the actual collection and runtime. Do not drop fields, reseed or treat a local snapshot as D1 parity; preserve content and verify the approved repair.');
    else add('verification_required', '**Measure physical schema:** supply an explicitly scoped offline --db-snapshot or --d1-dump; local measurements do not establish D1 parity. Never create or reseed a database to clear this finding.');
  }
  if (pending(['route-capture-evidence', 'editor-save-reload', 'visual-accessibility']).length) add('verification_required', '**Collect runtime and rendered evidence:** inspect /_styleguide and representative public/editor routes at narrow/intermediate/wide widths, including 390×844 and 1440×900; verify relevant keyboard/focus, content and editing roundtrips before claiming acceptance.');
  if (pending(['skills:site', 'skills:emdash']).length) add('review_required', '**Review skill provenance:** inspect missing membership/source evidence and local drift first. Stage only an applicable intentional refresh, inspect exact conflicts/licenses and apply reviewed paths within the authorized scope; do not overwrite project-owned guidance to clear a diagnostic.');
  const design = pending(['design-system:tokens-and-rhythm', 'design-system:card-and-breakout', 'design-system:quarantine-hud']);
  if (design.length) add('design_judgment', '**Review design-system primitives & component quarantine:** compare installed capabilities and accepted calibration before selecting changes. Concrete candidates include --font-mono/--font-accent, --color-elevated/--surface-glass, .btn--secondary/.btn--ghost, semantic article cards with .clickable-parent and transitionName, .flow, .content-grid, and SiteShell data-sticky-header/data-vt-loading. Missing markers are inspection leads, not proof that every site needs every primitive; unsupported evidence needs investigation before editing.');
  const observed = byId['design-system:card-and-breakout']?.observed;
  if (observed && typeof observed === 'object' && ['breakoutPageCount', 'surfaceUsageCount', 'expressivePrimitiveUsageCount'].some(key => observed[key] === 0)) add('design_judgment', '**Assess route composition against the brief:** zero breakout/surface/expressive usage is not a design defect. Preserve a suitable restrained layout. Where a demonstrated hierarchy or pacing problem warrants it, consider <Container breakout>, .surface-elevated/.surface-glass, .eyebrow-telemetry/.tabular-nums, .bento-grid/.grid-hairline/.ui-specimen, and tactile actions using the 5-Point Visual Self-Critique Rubric. Compare rendered alternatives and record the selected change or a brief-led exception; do not force asymmetry, dark sections or motion to raise counts.');
  if (byId['design-system:quarantine-hud']?.observed?.calibrationRecord === false) add('verification_required', '**Calibrate applicable primitives:** inspect /_styleguide and record actual rendered observations in audit/component-calibration.md; an absent record alone does not establish a visual defect.');
  const dependencies = report.rules.filter(rule => (rule.id.startsWith('dependency:') || rule.id === 'node-policy') && !['pass', 'not-applicable'].includes(rule.status));
  if (dependencies.length) add('review_required', '**Review dependency/runtime evidence:** baseline version differences are not automatic upgrade instructions. Inspect installed APIs, compatibility and deployment requirements before selecting a change.');
  const covered = new Set(['schema-prebuild','physical-schema','route-capture-evidence','editor-save-reload','visual-accessibility','skills:site','skills:emdash','design-system:tokens-and-rhythm','design-system:card-and-breakout','design-system:quarantine-hud',...dependencies.map(rule => rule.id)]);
  for (const rule of report.rules) if (!covered.has(rule.id) && !['pass','not-applicable'].includes(rule.status)) add(ruleActionability(rule), '**Inspect ' + rule.id + ':** ' + rule.status + '; use its recorded evidence and remediation reference before deciding on a change.');
  const labels = { verification_required: 'Verification needed', bounded_recipe: 'Bounded remediation recipes', design_judgment: 'Design judgment', review_required: 'Manual review' };
  const sections = Object.entries(groups).filter(([,items]) => items.length).map(([kind, items]) => '### ' + labels[kind] + '\n\n' + items.map(item => '- ' + item).join('\n'));
  return sections.length ? '\n## Recommended follow-up plan\n\nClassification does not authorize changes. Reuse agreed implementation/release scope; resolve only consequential open decisions.\n\n' + sections.join('\n\n') + '\n' : '';
}

export function markdownReport(report) {
  assertReport(report);
  const cell = value => String(typeof value === 'object' ? JSON.stringify(value) : value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  return `# Site standards diagnosis\n\nStandards ${report.standards.version}; manifest SHA-256 ${report.standards.sha256}.\n\nDiagnostic scaffold; static passes do not certify the site. Missing evidence remains unverified.\n\n| Rule | Status | Severity | Actionability | Observation |\n| --- | --- | --- | --- | --- |\n${report.rules.map(rule => `| ${cell(rule.id)} | ${rule.status} | ${rule.severity} | ${rule.actionability ?? ruleActionability(rule)} | ${cell(rule.observed)} |`).join('\n')}\n${followUpPlan(report)}`;
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
