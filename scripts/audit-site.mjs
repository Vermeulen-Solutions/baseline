import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { collectionColumnCounts, COLLECTION_COLUMN_BUDGET } from './schema-column-budget.mjs';

export const STANDARD = Object.freeze({ version: '0.1.1', commit: '28ccf82b3047eb615cd57ca55141751e0d29af11', sha256: 'a30dfde700dac0ead090ca19f743312d5bb4cd886aa51facd387c372db56b2c4' });
const starterRoot = fileURLToPath(new URL('../', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const within = (parent, child) => { const relative = path.relative(parent, child); return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); };

// Never follow target-controlled links, execute its config/scripts, read env or return raw errors/content.
function readTarget(root, relative) {
  let current = root;
  for (const segment of relative.split('/')) {
    if (!segment || segment === '.' || segment === '..' || segment.includes('\\')) throw Error('Unsafe evidence path');
    current = path.join(current, segment);
    try { if (fs.lstatSync(current).isSymbolicLink()) return { status: 'unverified', reason: 'Symlinked evidence refused' }; }
    catch { return { status: 'unverified', reason: 'Evidence unavailable' }; }
  }
  const stat = fs.statSync(current);
  if (!stat.isFile() || stat.size > 8 * 1024 * 1024) return { status: 'unverified', reason: 'Evidence is not a bounded regular file' };
  return { status: 'observed', bytes: fs.readFileSync(current) };
}
function readJSON(root, relative) {
  const result = readTarget(root, relative);
  if (!result.bytes) return result;
  try { return { ...result, data: JSON.parse(result.bytes.toString('utf8')) }; }
  catch { return { status: 'unverified', reason: 'Invalid JSON evidence' }; }
}
function loadStandard(file) {
  const bytes = fs.readFileSync(file ?? path.join(starterRoot, 'standards/baselines/0.1.1.json'));
  if (digest(bytes) !== STANDARD.sha256) throw Error('Standards artifact digest mismatch; diagnosis refused');
  const manifest = JSON.parse(bytes.toString('utf8'));
  if (manifest.standardsVersion !== STANDARD.version || manifest.status !== 'certified-scoped') throw Error('Unsupported standards artifact');
  return manifest;
}
const version = value => typeof value === 'string' && /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(value) ? value : null;
const managed = { emdash: ['building-emdash-site', 'creating-plugins', 'emdash-cli'], site: ['new-site-workflow', 'site-art-direction', 'impeccable', 'astro-site-design', 'emdash-site-setup', 'emdash-content-modeling', 'wordpress-to-emdash-content', 'emdash-production-cutover'] };

export function auditSite({ root, runtime = 'node-sqlite', standardsFile, dbSnapshot } = {}) {
  const target = fs.realpathSync(path.resolve(root ?? '.'));
  if (!fs.statSync(target).isDirectory()) throw Error('Target must be a directory');
  const manifest = loadStandard(standardsFile);
  if (!Object.hasOwn(manifest.runtimeProfiles, runtime)) throw Error('Unknown runtime profile');
  const rules = [];
  const add = (id, status, expected, observed, { required = true, evidence = [], confidence = 'high', remediation = 'docs/site-standards-audit.md', applicability = runtime } = {}) => rules.push({ id, ruleVersion: 1, status, severity: required ? 'required' : 'recommendation', expected, observed, evidence, confidence, applicability, remediation, verification: 'Static diagnosis only; no target scripts, network, CMS, installs or deployments' });
  const pkg = readJSON(target, 'package.json');
  const lock = readJSON(target, 'package-lock.json');
  add('package-evidence', pkg.data && lock.data ? 'pass' : 'unverified', 'Readable package and npm lockfile', pkg.data && lock.data ? 'Observed; contents withheld' : 'Missing, invalid or refused evidence', { evidence: ['package.json', 'package-lock.json'] });
  add('runtime-profile', runtime === 'node-sqlite' ? 'pass' : 'unverified', 'A certified source standards profile', manifest.runtimeProfiles[runtime].status, { evidence: ['standards/baselines/0.1.1.json'] });
  for (const [name, expectedRange] of Object.entries(manifest.runtimeProfiles['node-sqlite'].dependencies)) {
    const expected = expectedRange.replace(/^\^/, '');
    const observed = version(lock.data?.packages?.[`node_modules/${name}`]?.version);
    add(`dependency:${name}`, !observed ? 'unverified' : observed === expected ? 'pass' : 'warning', `Certified comparison version ${expected}`, observed ?? 'No valid locked version', { required: false, evidence: ['package-lock.json'], applicability: 'Static lockfile comparison, not runtime compatibility or an upgrade ceiling' });
  }
  const engine = pkg.data?.engines?.node;
  add('node-policy', typeof engine === 'string' && /^[\d v^~<>=|.*x-]+$/.test(engine) ? 'warning' : 'unverified', 'Minimum 22.22.2; recommend current Node 24 LTS patch', typeof engine === 'string' && /^[\d v^~<>=|.*x-]+$/.test(engine) ? `Declared ${engine}; executing audit on ${process.version}` : 'No safe declaration observed', { required: false, evidence: ['package.json'], applicability: 'Declaration is not the deployment runtime; compatibility range evaluation deferred' });
  const hashes = {};
  for (const relative of ['astro.config.mjs', 'src/live.config.ts', 'src/styles/global.css', 'package-lock.json']) {
    const result = readTarget(target, relative);
    hashes[relative] = result.bytes ? digest(result.bytes) : null;
  }
  for (const [group, skills] of Object.entries(managed)) {
    const relative = `.emdash/${group === 'emdash' ? 'upstream' : 'site'}-skills.json`;
    const record = readJSON(target, relative);
    const expectedFiles = record.data?.files;
    let measured = 0, drift = 0, unavailable = 0;
    if (expectedFiles && typeof expectedFiles === 'object' && !Array.isArray(expectedFiles)) {
      for (const [file, expected] of Object.entries(expectedFiles)) {
        const parts = file.split('/');
        if (!skills.includes(parts[0]) || parts.some(part => !part || part === '.' || part === '..' || part.includes('\\')) || !/^[a-f0-9]{64}$/.test(expected)) { unavailable++; continue; }
        const actual = readTarget(target, `.agents/skills/${file}`);
        if (!actual.bytes) { unavailable++; continue; }
        measured++;
        if (digest(actual.bytes.includes(0) ? actual.bytes : actual.bytes.toString('utf8').replaceAll('\r\n', '\n')) !== expected) drift++;
      }
    }
    // Full membership/extra-file/upstream-currency verification is deliberately deferred.
    add(`skills:${group}`, drift ? 'warning' : 'unverified', 'Reviewed normalized hashes AND managed membership/overrides', `Measured files ${measured}; drift ${drift}; unavailable ${unavailable}; complete membership and source currency unverified`, { required: false, evidence: [relative], confidence: 'bounded-static' });
  }
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
        const counts = collectionColumnCounts(db).map(({ columns }) => columns);
        add('physical-schema', !counts.length ? 'unverified' : counts.some(n => n > COLLECTION_COLUMN_BUDGET) ? 'fail' : 'pass', `Actual physical collection widths <= ${COLLECTION_COLUMN_BUDGET}`, { collections: counts.length, physicalWidths: counts, snapshotSHA256: digest(fs.readFileSync(copy)) }, { applicability: 'Explicit offline snapshot only; no seed inference, D1 or row reads' });
      } catch { add('physical-schema', 'unverified', 'Readable supported SQLite schema', 'Snapshot could not be measured'); }
      finally { db?.close(); if (path.dirname(scratch) !== fs.realpathSync(os.tmpdir()) && path.dirname(scratch) !== path.resolve(os.tmpdir())) throw Error('Unsafe scratch cleanup'); fs.rmSync(scratch, { recursive: true, force: true }); }
    }
  }
  for (const id of ['public-editor-runtime', 'visual-accessibility', 'locales-cache-forms', 'cloudflare-d1-r2']) add(id, 'unverified', 'Explicit runtime/editor/visual or named remote evidence', 'Not executed by this scaffold', { required: false, confidence: 'none' });
  let git = { status: 'unverified' };
  try {
    const command = (...args) => execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', ...args], { cwd: target, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 }).trim();
    const revision = command('rev-parse', '--verify', 'HEAD');
    git = { status: 'observed', revision: /^[a-f0-9]{40,64}$/.test(revision) ? revision : null, trackedDirty: Boolean(command('status', '--porcelain', '--untracked-files=no')), note: 'Untracked paths and repository remotes withheld' };
  } catch { /* An unavailable Git checkout is not a clean-tree assertion. */ }
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), stage: 'diagnostic-scaffold', target: { label: 'audited-repository', git, configurationSHA256: hashes }, standards: { ...STANDARD, source: 'Digest-verified offline manifest; original private Git history not required' }, runtime, mutationPolicy: 'No target writes, target script/config execution or network; explicit reports outside target and isolated temporary snapshot copy only', rules, summary: Object.fromEntries(['pass', 'fail', 'warning', 'unverified', 'not-applicable'].map(status => [status, rules.filter(rule => rule.status === status).length])) };
}

export function strictFailure(report) { return report.rules.some(rule => rule.severity === 'required' && ['fail', 'unverified'].includes(rule.status)); }
export function markdownReport(report) {
  const cell = value => String(typeof value === 'object' ? JSON.stringify(value) : value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  return `# Site standards diagnosis\n\nStandards ${report.standards.version}; manifest SHA-256 ${report.standards.sha256}.\n\nDiagnostic scaffold; static passes do not certify the site. Missing evidence remains unverified.\n\n| Rule | Status | Severity | Observation |\n| --- | --- | --- | --- |\n${report.rules.map(rule => `| ${cell(rule.id)} | ${rule.status} | ${rule.severity} | ${cell(rule.observed)} |`).join('\n')}\n`;
}
function canonicalOutput(file) {
  const tail = []; let current = path.resolve(file);
  while (!fs.existsSync(current)) { tail.unshift(path.basename(current)); current = path.dirname(current); }
  return path.join(fs.realpathSync(current), ...tail);
}
export function writeReports(report, out, target) {
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
  } catch (error) { console.error(error.message.startsWith('Usage:') || /Standards|Unknown runtime|Report output/.test(error.message) ? error.message : 'Audit unavailable; no target scripts or remediation were executed.'); process.exitCode = 2; }
}
