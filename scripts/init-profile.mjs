import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { BASELINE_REPOSITORY, profileManifest, profilePackages, validateProfileConfig } from '../profiles/contract.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const GENERATOR_VERSION = '0.3.1';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const gateHash = bytes => sha256(String(bytes).replaceAll('\r\n', '\n'));
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const inside = (parent, child) => child === parent || child.startsWith(parent + path.sep);

export function containedPath(root, relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || relative.includes(':') || relative.includes('\0') || path.isAbsolute(relative) || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe manifest path');
  const target = path.resolve(root, relative);
  if (!inside(path.resolve(root), target)) throw new Error('Manifest path escapes root');
  return target;
}

async function noLinks(target) {
  const resolved = path.resolve(target);
  let current = path.parse(resolved).root;
  for (const part of resolved.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('Symlinked source or destination: ' + current); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

async function validateDestination(out, root) {
  if (!out) throw new Error('--out requires a destination directory');
  const destination = path.resolve(out);
  const source = await fs.realpath(root);
  await noLinks(destination);
  const parent = await fs.realpath(path.dirname(destination));
  const actual = path.join(parent, path.basename(destination));
  if (inside(source, actual) || inside(actual, source)) throw new Error('Destination must not overlap the Baseline source');
  try {
    if (!(await fs.lstat(destination)).isDirectory() || (await fs.readdir(destination)).length) throw new Error('Destination must be a new or empty directory');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return destination;
}

/** Validate and snapshot every input before creating anything in the destination. */
export async function planProfile({ profile, out, sourceRoot = ROOT }) {
  const manifest = profileManifest(profile);
  if (!['static', 'static-sveltia'].includes(profile) || !manifest.generationReady) throw new Error(`Profile ${profile} is not available for generation`);
  const root = await fs.realpath(sourceRoot);
  const destination = await validateDestination(out, root);
  const canonical = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const exceptions = JSON.parse(await fs.readFile(path.join(root, 'audit/design-gate-exceptions.json'), 'utf8'));
  const mapping = new Map(manifest.files.map(file => [file, file]));
  for (const { source, target } of manifest.overrides) {
    containedPath(root, source); containedPath(destination, target);
    mapping.set(target, source);
  }
  for (const file of manifest.skillFiles) {
    if (!manifest.skills.some(skill => file.startsWith(`.agents/skills/${skill}/`))) throw new Error('Unselected skill in manifest');
    mapping.set(file, file);
  }
  const outputs = new Map(), records = {}, gateExceptions = [];
  for (const [target, source] of mapping) {
    const from = containedPath(root, source);
    containedPath(destination, target);
    await noLinks(from);
    if (!(await fs.stat(from)).isFile()) throw new Error('Manifest source is not a regular file: ' + source);
    const bytes = await fs.readFile(from);
    if (/^(src|public)\//.test(target)) {
      const entry = exceptions.find(item => item.path === source && !item.deleted);
      if (!entry?.reason || entry.sha256 !== gateHash(bytes)) throw new Error('Source lacks a current reviewed infrastructure exception: ' + source);
      gateExceptions.push({ ...entry, path: target });
    }
    outputs.set(target, bytes);
    records[target] = { source, sha256: sha256(bytes), ownership: target.startsWith('src/content/') || target.startsWith('src/config/') || target.startsWith('public/admin/') || /^src\/pages\/(?!_styleguide)/.test(target) || target === 'src/layouts/Base.astro' ? 'client' : target === 'src/styles/global.css' ? 'client-calibrated' : 'shared' };
  }
  const scripts = Object.fromEntries(manifest.scripts.map(name => {
    if (!canonical.scripts[name]) throw new Error('Unknown canonical script: ' + name);
    return [name, canonical.scripts[name]];
  }));
  Object.assign(scripts, manifest.scriptOverrides);
  const packages = profilePackages(profile, canonical);
  const projectPackage = { name: path.basename(destination).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'baseline-static', version: '0.0.0', private: true, type: 'module', engines: canonical.engines, scripts, ...packages, license: canonical.license };
  if (/emdash|schema-budget|dist\/server/.test(JSON.stringify(projectPackage.scripts))) throw new Error('CMS command leaked into static package');
  const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = git(['rev-parse', 'HEAD']);
  const sourceTreeDirty = Boolean(git(['status', '--porcelain']));
  const config = validateProfileConfig({ schemaVersion: 1, platformProfile: profile, foundation: manifest.foundation, runtime: 'static', source: { repository: BASELINE_REPOSITORY, commit, release: null }, generatorVersion: GENERATOR_VERSION, features: [], checks: manifest.checks, skills: manifest.skills });
  outputs.set('package.json', json(projectPackage));
  outputs.set('baseline.config.json', json(config));
  outputs.set('audit/design-gate-exceptions.json', json(gateExceptions));
  for (const target of ['package.json', 'baseline.config.json', 'audit/design-gate-exceptions.json']) records[target] = { source: null, sha256: sha256(outputs.get(target)), ownership: 'generated' };
  outputs.set('.baseline/managed-files.json', json({ schemaVersion: 1, sourceCommit: commit, sourceTreeDirty, generatorVersion: GENERATOR_VERSION, manifestSHA256: sha256(json(manifest)), files: records, note: 'Commit records the base revision. Exact file hashes identify assembled working-tree bytes, including uncommitted sources. No downstream certification or automatic update claim.' }));
  return { destination, manifest, outputs, config, sourceTreeDirty };
}

export async function initProfile(options) {
  const plan = await planProfile(options);
  const summary = { profile: plan.config.platformProfile, destination: plan.destination, files: plan.outputs.size, sourceCommit: plan.config.source.commit, sourceTreeDirty: plan.sourceTreeDirty, dryRun: Boolean(options.dryRun) };
  if (options.dryRun) return summary;
  // Recheck after planning. Never merge into a populated project or overwrite a file.
  await validateDestination(plan.destination, options.sourceRoot ?? ROOT);
  await fs.mkdir(plan.destination, { recursive: true });
  for (const [relative, bytes] of plan.outputs) {
    const target = containedPath(plan.destination, relative);
    await noLinks(path.dirname(target));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes, { flag: 'wx' });
  }
  return summary;
}

function parse(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') { if (options.dryRun) throw new Error('Duplicate --dry-run'); options.dryRun = true; }
    else if (arg === '--profile' || arg === '--out') {
      const key = arg.slice(2), value = args[++i];
      if (options[key] || !value || value.startsWith('--')) throw new Error('Missing or duplicate ' + arg);
      options[key] = value;
    } else throw new Error('Unknown argument: ' + arg);
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.slice(2).includes('--help')) console.log('npm run init:profile -- --profile static|static-sveltia --out <new-or-empty-directory> [--dry-run]');
    else {
      const result = await initProfile(parse(process.argv.slice(2)));
      console.log(JSON.stringify(result, null, 2));
      if (!result.dryRun) console.log('Next: run npm install in the generated directory to create its independent lockfile, then npm run verify && npm run build && npm run check:dev-tools.');
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
