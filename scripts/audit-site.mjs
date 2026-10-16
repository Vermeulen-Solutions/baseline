import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { collectionColumnCounts, COLLECTION_COLUMN_BUDGET } from './schema-column-budget.mjs';
import { capabilityRules } from './audit-capabilities.mjs';
import { skillFinding } from './audit-skills.mjs';
import { assertReport } from './audit-report.mjs';
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

export function auditSite({ root, runtime = 'node-sqlite', standardsFile, dbSnapshot } = {}) {
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
        const copy = path.join(scratch, 'snapshot.sqlite'); fs.copyFileSync(source, copy);
        db = new DatabaseSync(copy, { readOnly: true }); db.exec('PRAGMA query_only=ON');
        const measured = collectionColumnCounts(db);
        const counts = measured.map(({ columns }) => columns);
        const generated = measured.reduce((sum, { table }) => sum + db.prepare(`PRAGMA table_xinfo("${table.replaceAll('"', '""')}")`).all().filter(column => column.hidden !== 0).length, 0);
        const definitionHash = digest(JSON.stringify(db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all()));
        add('physical-schema', !counts.length ? 'unverified' : counts.some(n => n > COLLECTION_COLUMN_BUDGET) ? 'fail' : 'pass', `Actual physical collection widths <= ${COLLECTION_COLUMN_BUDGET}`, { collections: counts.length, physicalWidths: counts, generatedOrHiddenColumns: generated, schemaSHA256: definitionHash, snapshotSHA256: digest(fs.readFileSync(copy)) }, { applicability: 'Explicit offline snapshot only; no seed inference, D1 or content row reads' });
      } catch { add('physical-schema', 'unverified', 'Readable supported SQLite schema', 'Snapshot could not be measured'); }
      finally { db?.close(); if (path.dirname(scratch) !== fs.realpathSync(os.tmpdir()) && path.dirname(scratch) !== path.resolve(os.tmpdir())) throw Error('Unsafe scratch cleanup'); fs.rmSync(scratch, { recursive: true, force: true }); }
    }
  }
  for (const id of ['public-editor-runtime', 'visual-accessibility', 'forms-provider-delivery', 'cloudflare-d1-r2']) add(id, 'unverified', 'Explicit runtime/editor/visual or named remote evidence', 'Not executed by static diagnosis', { required: false, confidence: 'none' });
  let git = { status: 'unverified' };
  try {
    const command = (...args) => gitRead(target, ...args);
    if (fs.realpathSync(command('rev-parse', '--show-toplevel')) !== target) throw Error('Target is not the Git root');
    const revision = command('rev-parse', '--verify', 'HEAD');
    git = { status: 'observed', revision: /^[a-f0-9]{40,64}$/.test(revision) ? revision : null, trackedDirty: Boolean(command('status', '--porcelain', '--untracked-files=no')), note: 'Untracked paths and repository remotes withheld' };
  } catch { /* An unavailable Git checkout is not a clean-tree assertion. */ }
  return assertReport({ schemaVersion: 2, generatedAt: new Date().toISOString(), stage: 'static-diagnosis', target: { label: 'audited-repository', git, configurationSHA256: hashes }, standards: { ...STANDARD, source: 'Digest-verified offline manifest; original private Git history not required' }, runtime, mutationPolicy: 'No target writes, target script/config execution or network; explicit reports outside target and isolated temporary snapshot copy only', rules, summary: Object.fromEntries(['pass', 'fail', 'warning', 'unverified', 'not-applicable'].map(status => [status, rules.filter(rule => rule.status === status).length])) });
}

export function strictFailure(report) { return report.rules.some(rule => rule.severity === 'required' && ['fail', 'unverified'].includes(rule.status)); }
export function markdownReport(report) {
  assertReport(report);
  const cell = value => String(typeof value === 'object' ? JSON.stringify(value) : value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  return `# Site standards diagnosis\n\nStandards ${report.standards.version}; manifest SHA-256 ${report.standards.sha256}.\n\nDiagnostic scaffold; static passes do not certify the site. Missing evidence remains unverified.\n\n| Rule | Status | Severity | Observation |\n| --- | --- | --- | --- |\n${report.rules.map(rule => `| ${cell(rule.id)} | ${rule.status} | ${rule.severity} | ${cell(rule.observed)} |`).join('\n')}\n`;
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
    const values = {}; let strict = false;
    const names = { '--root': 'root', '--runtime': 'runtime', '--standards-file': 'standardsFile', '--db-snapshot': 'dbSnapshot', '--out': 'out' };
    for (let i = 2; i < process.argv.length; i++) { const arg = process.argv[i]; if (arg === '--strict') { strict = true; continue; } if (!names[arg] || !process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw Error('Usage: audit:site -- --root <repo> [--runtime node-sqlite|cloudflare-d1-r2] [--standards-file <pinned-manifest>] [--db-snapshot <offline-snapshot>] [--out <new-directory-outside-target>] [--strict]'); values[names[arg]] = process.argv[++i]; }
    const report = auditSite(values);
    if (values.out) writeReports(report, values.out, path.resolve(values.root ?? '.'));
    else console.log(JSON.stringify(report, null, 2));
    if (strict && strictFailure(report)) process.exitCode = 1;
  } catch (error) { console.error(/^(?:Usage:|Standards artifact digest mismatch; diagnosis refused$|Unsupported standards artifact$|Unknown runtime profile$|Report output must be outside the audited target$|Report output already exists; choose a new directory$)/.test(error.message) ? error.message : 'Audit unavailable; no target scripts or remediation were executed.'); process.exitCode = 2; }
}
