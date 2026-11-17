// Read-only status of every site in a fleet, compared with this checkout's pinned standards.
//
//   npm run fleet:status -- --config <private fleet.json> [--out <STATUS.md>] [--json]
//
// fleet.json: { "sites": [ { "id": "example-site", "path": "../sites/example-site" } ] }
// Paths are relative to the config file. The config and the report belong in private storage;
// this script holds no site data. For each site it reads, without network or writes:
// - Git: remote, branch, HEAD, last commit date, uncommitted files, ahead/behind its upstream as of
//   the last fetch;
// - kind: a generated Baseline project (baseline.config.json), an earlier Baseline copy (Baseline's
//   art-direction gate is present), or another project;
// - hosting from its config files (Wrangler, Netlify, Vercel, Firebase);
// - Astro, EmDash and adapter versions as locked (package-lock.json) or declared, and engines.node;
// - for Baseline sites: each certified dependency and the Node range against standards/baselines/<STANDARD>.json,
//   plus two Workers delivery rules learned on live EmDash 1.5 updates (WORKERS_RULES).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { argumentsOf, isMain } from './infrastructure-io.mjs';
import { STANDARD, satisfiesCertified } from './audit-site.mjs';
import { WORKERS_RULES, htmlCacheKeyedPerBuild, versionAtLeast } from './workers-rules.mjs';

export { WORKERS_RULES, htmlCacheKeyedPerBuild, versionAtLeast };

const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };

export function loadFleet(configFile) {
  const config = readJSON(configFile);
  if (!config || !Array.isArray(config.sites) || !config.sites.length) throw new Error('fleet config needs a non-empty "sites" array');
  const seen = new Set();
  return config.sites.map(site => {
    if (typeof site?.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(site.id)) throw new Error(`site id must be lowercase letters, digits and hyphens: ${JSON.stringify(site?.id)}`);
    if (seen.has(site.id)) throw new Error(`duplicate site id: ${site.id}`);
    if (typeof site.path !== 'string' || !site.path.trim()) throw new Error(`site ${site.id} needs a path`);
    seen.add(site.id);
    return { id: site.id, path: path.resolve(path.dirname(configFile), site.path) };
  });
}

function git(dir, args) { try { return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } }

export function repositoryName(url) {
  if (!url) return null;
  const match = /github\.com[:/](.+?)(?:\.git)?\/?$/.exec(url);
  return match ? match[1] : url.replace(/^.*@/, '');
}

function gitState(dir) {
  if (git(dir, ['rev-parse', '--is-inside-work-tree']) !== 'true') return null;
  const counts = git(dir, ['rev-list', '--left-right', '--count', '@{u}...HEAD']);
  const [behind, ahead] = counts ? counts.split(/\s+/).map(Number) : [null, null];
  return {
    repository: repositoryName(git(dir, ['remote', 'get-url', 'origin'])),
    branch: git(dir, ['branch', '--show-current']) || null,
    head: git(dir, ['rev-parse', '--short', 'HEAD']),
    lastCommit: git(dir, ['log', '-1', '--format=%cs']),
    uncommitted: (git(dir, ['status', '--porcelain']) ?? '').split('\n').filter(Boolean).length,
    ahead, behind,
  };
}

export function hostingOf(dir) {
  const has = name => fs.existsSync(path.join(dir, name));
  if (['wrangler.jsonc', 'wrangler.json', 'wrangler.toml'].some(has)) return 'cloudflare';
  if (has('netlify.toml')) return 'netlify';
  if (has('vercel.json')) return 'vercel';
  if (has('firebase.json')) return 'firebase';
  return null;
}

export function kindOf(dir) {
  const config = readJSON(path.join(dir, 'baseline.config.json'));
  if (config) return { kind: 'baseline', profile: config.platformProfile ?? null, baselineCommit: config.source?.commit ?? null };
  if (fs.existsSync(path.join(dir, 'scripts/check-art-direction.mjs'))) return { kind: 'baseline-copy', profile: fs.existsSync(path.join(dir, 'node_modules/emdash')) || readJSON(path.join(dir, 'package.json'))?.dependencies?.emdash ? 'emdash' : null, baselineCommit: null };
  return { kind: 'other', profile: null, baselineCommit: null };
}

// The locked version when package-lock.json has it, otherwise the declared range without its prefix.
export function versionsOf(dir, names) {
  const pkg = readJSON(path.join(dir, 'package.json')) ?? {};
  const lock = readJSON(path.join(dir, 'package-lock.json'));
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };
  const out = {};
  for (const name of names) {
    if (!declared[name]) continue;
    out[name] = lock?.packages?.[`node_modules/${name}`]?.version ?? String(declared[name]).replace(/^[\^~=]/, '');
  }
  return { versions: out, engines: pkg.engines?.node ?? null };
}

export function compareWithStandard(site, manifest) {
  const profile = manifest.runtimeProfiles['node-sqlite'];
  const behind = [];
  for (const [name, range] of Object.entries(profile.dependencies)) {
    const observed = site.versions[name];
    if (observed && !satisfiesCertified(observed, range)) behind.push(`${name} ${observed} (certified ${range})`);
  }
  // A Workers site pins the EmDash adapter to exactly the core version.
  const adapter = site.versions['@emdash-cms/cloudflare'];
  if (adapter && adapter !== profile.dependencies.emdash) behind.push(`@emdash-cms/cloudflare ${adapter} (needs ${profile.dependencies.emdash})`);
  const astroAdapter = site.versions['@astrojs/cloudflare'];
  if (astroAdapter && site.versions.emdash && versionAtLeast(site.versions.emdash, WORKERS_RULES.emdashFrom) && !versionAtLeast(astroAdapter, WORKERS_RULES.adapterMinimum)) behind.push(`@astrojs/cloudflare ${astroAdapter} (EmDash ${WORKERS_RULES.emdashFrom}+ on Workers needs ${WORKERS_RULES.adapterMinimum} or newer)`);
  if (site.htmlCacheKeyedPerBuild === false) behind.push('HTML edge cache keyed by URL only (key it per build before the next deploy)');
  const compact = value => String(value).replaceAll(/\s/g, '');
  if (site.engines && compact(site.engines) !== compact(profile.nodeEngineRange)) behind.push(`Node range ${site.engines} (certified ${profile.nodeEngineRange})`);
  return { standard: manifest.standardsVersion, current: behind.length === 0, behind };
}

export function siteStatus({ id, path: dir }, manifest) {
  if (!fs.existsSync(dir)) return { id, path: dir, missing: true };
  const kind = kindOf(dir);
  const names = ['astro', 'emdash', '@emdash-cms/cloudflare', '@astrojs/cloudflare', '@astrojs/node', '@astrojs/netlify', 'wrangler', ...Object.keys(manifest.runtimeProfiles['node-sqlite'].dependencies)];
  const { versions, engines } = versionsOf(dir, [...new Set(names)]);
  const hosting = hostingOf(dir);
  const status = { id, path: dir, ...kind, hosting, versions, engines, git: gitState(dir), htmlCacheKeyedPerBuild: hosting === 'cloudflare' ? htmlCacheKeyedPerBuild(dir) : null };
  status.standards = kind.kind === 'other' ? null : compareWithStandard(status, manifest);
  return status;
}

export function fleetStatus(configFile, { baselineRoot = root } = {}) {
  const manifest = readJSON(path.join(baselineRoot, `standards/baselines/${STANDARD.version}.json`));
  if (!manifest) throw new Error(`standards baseline ${STANDARD.version} not found in this checkout`);
  return { generatedAt: new Date().toISOString(), standard: STANDARD.version, sites: loadFleet(configFile).map(site => siteStatus(site, manifest)) };
}

export function markdownStatus(report) {
  const cell = value => value === null || value === undefined || value === '' ? '-' : String(value).replaceAll('|', '\\|');
  const lines = [
    `# Fleet status`,
    '',
    `Generated ${report.generatedAt.slice(0, 16).replace('T', ' ')} UTC against Baseline standards ${report.standard}. Read from local checkouts; Git ahead/behind is as of each checkout's last fetch.`,
    '',
    '| Site | Kind | Hosting | Astro | EmDash | Standards | Git |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const site of report.sites) {
    if (site.missing) { lines.push(`| ${cell(site.id)} | missing | - | - | - | - | folder not found |`); continue; }
    const kind = site.kind === 'baseline' ? `Baseline ${site.profile ?? ''}`.trim() : site.kind === 'baseline-copy' ? `Baseline copy${site.profile ? ` (${site.profile})` : ''}` : 'other';
    const standards = !site.standards ? 'n/a' : site.standards.current ? `current (${site.standards.standard})` : `behind: ${site.standards.behind.length}`;
    const g = site.git;
    const gitCell = !g ? 'not a Git repository' : `${g.branch ?? 'detached'} ${g.head} (${g.lastCommit})${g.uncommitted ? `, ${g.uncommitted} uncommitted` : ''}${g.ahead ? `, ${g.ahead} unpushed` : ''}${g.behind ? `, ${g.behind} to pull` : ''}`;
    lines.push(`| ${cell(site.id)} | ${cell(kind)} | ${cell(site.hosting)} | ${cell(site.versions.astro)} | ${cell(site.versions.emdash)} | ${cell(standards)} | ${cell(gitCell)} |`);
  }
  const behind = report.sites.filter(site => site.standards && !site.standards.current);
  if (behind.length) {
    lines.push('', '## Behind the standards', '');
    for (const site of behind) lines.push(`- **${site.id}:** ${site.standards.behind.join('; ')}`);
  }
  return lines.join('\n') + '\n';
}

if (isMain(import.meta.url)) {
  try {
    const args = argumentsOf(process.argv.slice(2), ['--config', '--out'], ['--json']);
    if (!args.config) throw new Error('Usage: npm run fleet:status -- --config <fleet.json> [--out <STATUS.md>] [--json]');
    const report = fleetStatus(path.resolve(args.config));
    if (args.json) console.log(JSON.stringify(report, null, 2));
    const markdown = markdownStatus(report);
    if (args.out) fs.writeFileSync(path.resolve(args.out), markdown);
    if (!args.json) process.stdout.write(markdown);
  } catch (error) {
    console.error(`[fleet-status] ${error.message}`);
    process.exitCode = 1;
  }
}
