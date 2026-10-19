import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

// Deliberately bounded to the stable, fully specified ranges used by engines.node.
// Unknown syntax fails closed rather than silently accepting an unsupported Node.
export function supportsNode(version, range) {
  const actual = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (typeof range !== 'string' || !range.trim()) return null;
  const clauses = range.split('||').map(part => /^\s*(\^|>=|=)?(\d+)\.(\d+)\.(\d+)\s*$/.exec(part));
  if (clauses.some(part => !part)) return null;
  if (!actual) return false;
  const current = actual.slice(1).map(Number);
  const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  return clauses.some(([, operator = '=', ...numbers]) => {
    const floor = numbers.map(Number);
    if (operator === '=') return compare(current, floor) === 0;
    if (operator === '>=') return compare(current, floor) >= 0;
    const ceiling = floor[0] ? [floor[0] + 1, 0, 0] : floor[1] ? [0, floor[1] + 1, 0] : [0, 0, floor[2] + 1];
    return compare(current, floor) >= 0 && compare(current, ceiling) < 0;
  });
}

export function shellCheck(platform, env) {
  if (platform !== 'win32') return { id: 'shell', status: 'pass', message: `${platform}; no Windows PowerShell launcher policy applies.` };
  const launcher = env.npm_execpath || '';
  const shell = env.npm_config_script_shell || env.ComSpec || env.COMSPEC || '';
  if (/\.ps1$/i.test(launcher) || /(?:powershell|pwsh)(?:\.exe)?$/i.test(shell)) {
    return { id: 'shell', status: 'warn', message: 'Windows PowerShell/script launcher detected; npm.ps1 may be blocked by execution policy. Use npm.cmd (and npx.cmd), or node scripts/doctor.mjs.' };
  }
  if (/\.cmd$/i.test(launcher)) return { id: 'shell', status: 'pass', message: 'Windows npm.cmd launcher reported; it avoids npm.ps1 execution policy.' };
  // npm-cli.js and ComSpec describe the child, not the original PowerShell command.
  return { id: 'shell', status: 'warn', message: 'Windows; outer npm.cmd vs npm.ps1 launcher is not observable here. In PowerShell use npm.cmd (and npx.cmd); direct node scripts/doctor.mjs also works.' };
}

export async function diagnose({ cwd = process.cwd(), env = process.env, platform = process.platform, version = process.versions.node, loadSQLite = () => import('node:sqlite'), gitStatus = spawnSync } = {}) {
  const started = performance.now();
  const checks = [];
  const add = (id, status, message) => checks.push({ id, status, message });
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    add('package', 'pass', 'package.json is present and valid JSON.');
  } catch { add('package', 'fail', 'Missing or invalid package.json; run from the repository root.'); }
  const supported = supportsNode(version, manifest?.engines?.node);
  add('node', supported === true ? 'pass' : 'fail', supported === null
    ? `Node ${version}; cannot evaluate engines.node (expected stable ^, >= or exact version alternatives).`
    : `Node ${version}; required ${manifest.engines.node}.${supported ? '' : ' Install a supported Node release.'}`);

  let database;
  try {
    const { DatabaseSync } = await loadSQLite();
    database = new DatabaseSync(':memory:');
    if (database.prepare('SELECT 1 AS ok').get().ok !== 1) throw new Error('SQLite probe failed');
    add('sqlite', 'pass', 'node:sqlite DatabaseSync opened and queried an in-memory database.');
  } catch { add('sqlite', 'fail', 'node:sqlite DatabaseSync is unavailable; use a supported Node build with SQLite enabled.'); }
  finally {
    if (database) {
      try { database.close(); }
      catch { add('sqlite-close', 'fail', 'The in-memory SQLite probe could not close.'); }
    }
  }
  checks.push(shellCheck(platform, env));
  try {
    if (!fs.statSync(path.join(cwd, 'astro.config.mjs')).isFile()) throw new Error('Not a file');
    add('astro', 'pass', 'astro.config.mjs is present.');
  } catch { add('astro', 'fail', 'Missing astro.config.mjs; run from the repository root.'); }

  const directory = path.join(cwd, '.emdash');
  const probe = path.join(directory, `.doctor-${randomUUID()}`);
  let descriptor;
  try {
    fs.mkdirSync(directory, { recursive: true });
    descriptor = fs.openSync(probe, 'wx', 0o600);
    fs.writeFileSync(descriptor, 'doctor write probe\n');
    add('workspace', 'pass', '.emdash/ is writable.');
  } catch { add('workspace', 'fail', 'Cannot write to .emdash/; check workspace permissions and file locks.'); }
  finally {
    if (descriptor !== undefined) {
      try { fs.closeSync(descriptor); }
      catch { add('workspace-close', 'fail', 'The temporary .emdash/ write probe could not close.'); }
      try { fs.unlinkSync(probe); }
      catch { add('workspace-cleanup', 'fail', 'The temporary .emdash/ write probe could not be removed.'); }
    }
  }

  // Avoid optional index writes and bound Git's share of the 500ms preflight budget.
  const remaining = Math.min(200, Math.floor(400 - (performance.now() - started)));
  if (remaining <= 0) add('git', 'warn', 'Git status skipped because the preflight time budget was exhausted.');
  else {
    const git = gitStatus('git', ['--no-optional-locks', 'status', '--porcelain=v1', '--untracked-files=normal'], {
      cwd, env, encoding: 'utf8', timeout: remaining, maxBuffer: 1024 * 1024, windowsHide: true,
    });
    if (git.status !== 0 || git.error) add('git', 'warn', 'Git status unavailable or timed out; check Git installation and repository access.');
    else add('git', git.stdout.trim() ? 'warn' : 'pass', git.stdout.trim() ? 'Working tree is dirty (tracked or untracked changes).' : 'Working tree is clean.');
  }
  return {
    schemaVersion: 1,
    status: checks.some(check => check.status === 'fail') ? 'fail' : checks.some(check => check.status === 'warn') ? 'warn' : 'pass',
    checks,
    durationMs: Math.round((performance.now() - started) * 100) / 100,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const report = args.some(arg => arg !== '--json') || args.length > 1
    ? { schemaVersion: 1, status: 'fail', checks: [{ id: 'arguments', status: 'fail', message: 'Usage: node scripts/doctor.mjs [--json]' }], durationMs: 0 }
    : await diagnose();
  if (args.includes('--json')) console.log(JSON.stringify(report));
  else {
    const color = process.stdout.isTTY && !Object.hasOwn(process.env, 'NO_COLOR');
    const colors = { pass: '\x1b[32m', warn: '\x1b[33m', fail: '\x1b[31m' };
    for (const check of report.checks) console.log(`${color ? colors[check.status] : ''}[${check.status.toUpperCase()}]${color ? '\x1b[0m' : ''} ${check.id}: ${check.message}`);
    console.log(`Doctor: ${report.status} (${report.durationMs}ms)`);
  }
  process.exitCode = report.status === 'fail' ? 1 : 0;
}
