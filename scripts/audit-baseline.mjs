import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function json(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

/** Read-only observations, not compatibility, database or upstream certification. */
export function collectBaseline(root, now = new Date()) {
  const pkg = json(path.join(root, 'package.json'));
  if (!pkg) throw new Error('package.json is required.');
  const lock = json(path.join(root, 'package-lock.json'));
  const dependencies = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).sort(([a], [b]) => a.localeCompare(b));
  const packages = dependencies.map(([name, declared]) => {
    const installed = json(path.join(root, 'node_modules', name, 'package.json'));
    const locked = lock?.packages?.[`node_modules/${name}`]?.version ?? null;
    return { name, declared, locked, installed: installed?.version ?? null,
      peerDependencies: installed?.peerDependencies ?? null, engines: installed?.engines ?? null,
      status: !locked || !installed ? 'unverified' : locked === installed.version ? 'observed-match' : 'drift' };
  });
  let git;
  try {
    const run = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    git = { revision: run('rev-parse', 'HEAD'), workingTree: run('status', '--short'), status: 'observed' };
  } catch { git = { status: 'unverified', reason: 'Git checkout unavailable.' }; }
  const skills = ['building-emdash-site', 'creating-plugins', 'emdash-cli', 'new-site-workflow', 'site-art-direction', 'astro-site-design', 'emdash-content-modeling', 'impeccable', 'emdash-site-setup', 'wordpress-to-emdash-content', 'emdash-production-cutover'].map(name => {
    try {
      const source = readFileSync(path.join(root, '.agents', 'skills', name, 'SKILL.md'), 'utf8').replaceAll('\r\n', '\n');
      return { name, status: 'observed', sha256: createHash('sha256').update(source).digest('hex') };
    } catch (error) { if (error.code !== 'ENOENT') throw error; return { name, status: 'unverified', reason: 'Skill missing.' }; }
  });
  return { formatVersion: 1, capturedAt: now.toISOString(), git,
    node: { running: process.version, declared: pkg.engines?.node ?? null }, packages, skills,
    skillSources: { emdash: json(path.join(root, '.emdash', 'upstream-skills.json')), site: json(path.join(root, '.emdash', 'site-skills.json')) },
    verification: { compatibility: 'unverified', upstreamCurrency: 'unverified', databaseParity: 'unverified', editorSaveReload: 'unverified', cloudflare: 'unverified' },
    note: 'Local read-only inventory. No secrets, database rows, synchronization, package updates or network requests. Matching versions/hashes do not prove upstream currency or runtime compatibility.' };
}

export function baselineSummary(report) {
  const drifts = report.packages.filter(p => p.status === 'drift');
  const unverified = report.packages.filter(p => p.status === 'unverified');
  const skillDrifts = report.skills.filter(s => s.status !== 'observed');
  const actions = [];
  if (skillDrifts.length) {
    actions.push(`1. **Synchronize skills (${skillDrifts.length} unverified/drifted):** Run \`npm run sync:site-skills\` or \`npm run sync:emdash-skills\`.`);
  }
  if (drifts.length) {
    actions.push(`2. **Review package lockfile drift (${drifts.map(p => p.name).join(', ')}):** Run \`npm run check:upstream\` to compare against certified baselines.`);
  }
  actions.push(`3. **Proceed to Next Workflow Stage:** If starting a new site, proceed to Stage 1 in \`new-site-workflow\`. If auditing a live site, run \`npm run audit:site\`.`);
  return `\n## Baseline Inventory Summary\n- Node: running ${report.node.running} (declared: ${report.node.declared ?? 'none'})\n- Packages: ${report.packages.length} total (${drifts.length} drifted, ${unverified.length} unverified)\n- Skills: ${report.skills.filter(s => s.status === 'observed').length}/${report.skills.length} observed\n\n### Recommended Next Steps\n${actions.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = collectBaseline(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
    console.log(JSON.stringify(report, null, 2));
    console.log(baselineSummary(report));
  }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
