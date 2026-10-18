import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const skills = ['new-site-workflow', 'site-art-direction', 'astro-site-design', 'impeccable'];
// Keep this script self-contained: older generated sites cannot acquire new
// module paths through bounded sync. Both provenance URLs identify this one repo;
// downloads always use its canonical name, never a URL supplied by the site.
const repositories = ['https://github.com/Vermeulen-Solutions/baseline', 'https://github.com/Vermeulen-Solutions/emdash-baseline'];
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
function safe(relative) {
  if (typeof relative !== 'string' || /[\\:\0]/.test(relative) || relative.split('/').some(p => !p || p === '.' || p === '..') || path.isAbsolute(relative)) throw new Error('Unsafe update path');
  return relative;
}
async function file(root, relative) {
  const target = path.resolve(root, safe(relative));
  let current = path.parse(target).root;
  for (const part of target.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('Symlinked update path'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return target;
}
async function bytes(root, relative) {
  try { return await fs.readFile(await file(root, relative)); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
const readJSON = async (root, relative) => JSON.parse(await fs.readFile(await file(root, relative), 'utf8'));
function selected(target, record) {
  // Installed membership is the update ceiling: upstream cannot add dependencies,
  // new skills, routes, content, settings, admin configuration or package scripts.
  if (!['shared', 'client-calibrated'].includes(record.ownership) || !record.source) return false;
  if (target.startsWith('.agents/skills/')) return skills.some(s => target.startsWith(`.agents/skills/${s}/`)) && record.source === target;
  return /^(src\/(?:components|layouts|lib|dev|assets|styles)\/|scripts\/)/.test(target) && !/emdash|sqlite|schema-budget|live\.config/i.test(target);
}
async function context(root) {
  const config = await readJSON(root, 'baseline.config.json');
  if (config.schemaVersion !== 1 || !['static', 'static-sveltia'].includes(config.platformProfile) || config.foundation !== 'static' || config.runtime !== 'static' || !repositories.includes(config.source?.repository) || !/^[a-f0-9]{40}$/.test(config.source.commit ?? '') || !Array.isArray(config.skills) || config.skills.length !== skills.length || new Set(config.skills).size !== skills.length || config.skills.some(s => !skills.includes(s))) throw new Error('sync:baseline requires a generated static Platform Profile');
  const managed = await readJSON(root, '.baseline/managed-files.json');
  if (managed.schemaVersion !== 1 || !managed.files) throw new Error('Unsupported managed-file contract');
  for (const [target, record] of Object.entries(managed.files)) {
    safe(target); if (record.source) safe(record.source);
    if (!digest(record.sha256)) throw new Error('Invalid managed hash');
  }
  return { config, managed };
}

/** Read immutable upstream bytes as data. Never import or run upstream code. */
export async function stageBaseline({ root = process.cwd(), commit, readSource } = {}) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('--ref must be an immutable 40-character commit SHA');
  const { config, managed } = await context(root);
  const stagedFile = `.baseline/updates/${commit}/stage.json`;
  if (await bytes(root, stagedFile)) throw new Error('This revision is already staged; review or remove its update directory first');
  const fetchSource = readSource ?? (async source => {
    const response = await fetch(`https://raw.githubusercontent.com/Vermeulen-Solutions/baseline/${commit}/${source}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Upstream ${source}: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  });
  const entries = [], payloads = new Map();
  for (const [target, record] of Object.entries(managed.files)) {
    if (!selected(target, record)) continue;
    const incoming = Buffer.from(await fetchSource(record.source));
    const incomingHash = hash(incoming);
    if (incomingHash === record.sha256) continue;
    const current = await bytes(root, target);
    const currentHash = current === null ? null : hash(current);
    entries.push({ target, source: record.source, baseHash: record.sha256, currentHash, incomingHash, conflict: currentHash !== record.sha256 && currentHash !== incomingHash });
    payloads.set(`.baseline/updates/${commit}/files/${target}`, incoming);
  }
  const stage = { schemaVersion: 1, commit, platformProfile: config.platformProfile, managedHash: hash(await bytes(root, '.baseline/managed-files.json')), configHash: hash(await bytes(root, 'baseline.config.json')), exceptionsHash: hash(await bytes(root, 'audit/design-gate-exceptions.json')), entries };
  // All reads and validation finish before any staging writes.
  for (const [relative, incoming] of payloads) {
    const target = await file(root, relative); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, incoming, { flag: 'wx' });
  }
  await fs.mkdir(path.dirname(await file(root, stagedFile)), { recursive: true });
  await fs.writeFile(await file(root, stagedFile), json(stage), { flag: 'wx' });
  return stage;
}

export async function applyBaseline({ root = process.cwd(), commit } = {}) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('--apply requires an immutable commit SHA');
  const { config, managed } = await context(root);
  const stage = await readJSON(root, `.baseline/updates/${commit}/stage.json`);
  if (stage.schemaVersion !== 1 || stage.commit !== commit || stage.platformProfile !== config.platformProfile || !Array.isArray(stage.entries)) throw new Error('Invalid update stage');
  for (const [relative, expected] of [['.baseline/managed-files.json', stage.managedHash], ['baseline.config.json', stage.configHash], ['audit/design-gate-exceptions.json', stage.exceptionsHash]]) {
    if (!digest(expected) || hash(await bytes(root, relative)) !== expected) throw new Error('Project metadata changed after staging; restage the update');
  }
  const exceptions = await readJSON(root, 'audit/design-gate-exceptions.json');
  const writes = [], conflicts = [], seen = new Set();
  for (const entry of stage.entries) {
    safe(entry.target);
    const record = managed.files[entry.target];
    if (seen.has(entry.target) || !record || !selected(entry.target, record) || entry.source !== record.source || entry.baseHash !== record.sha256 || !digest(entry.incomingHash)) throw new Error('Stage exceeds installed profile membership');
    seen.add(entry.target);
    const current = await bytes(root, entry.target);
    const currentHash = current === null ? null : hash(current);
    if (entry.currentHash !== currentHash) throw new Error('Local file changed after staging: ' + entry.target);
    const incoming = await bytes(root, `.baseline/updates/${commit}/files/${entry.target}`);
    if (!incoming || hash(incoming) !== entry.incomingHash) throw new Error('Staged bytes changed: ' + entry.target);
    if (currentHash !== record.sha256 && currentHash !== entry.incomingHash) { conflicts.push(entry.target); continue; }
    writes.push([entry.target, incoming]);
    managed.files[entry.target] = { ...record, sha256: entry.incomingHash, lastUpdateCommit: commit };
    const gate = exceptions.find(e => e.path === entry.target);
    if (gate && current && gate.sha256 === hash(String(current).replaceAll('\r\n', '\n'))) {
      gate.sha256 = hash(String(incoming).replaceAll('\r\n', '\n'));
      gate.reason = `Shared infrastructure update from Baseline ${commit}; locally calibrated or modified files are excluded.`;
    }
  }
  // Preflight every path/hash before applying any update; no force overwrite option.
  for (const [relative, incoming] of writes) await fs.writeFile(await file(root, relative), incoming);
  managed.lastSync = { commit, applied: writes.map(([f]) => f), conflicts };
  const exceptionBytes = json(exceptions);
  if (managed.files['audit/design-gate-exceptions.json']) managed.files['audit/design-gate-exceptions.json'].sha256 = hash(exceptionBytes);
  await fs.writeFile(await file(root, 'audit/design-gate-exceptions.json'), exceptionBytes);
  await fs.writeFile(await file(root, '.baseline/managed-files.json'), json(managed));
  return managed.lastSync;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--help') console.log('sync:baseline -- --ref <40-char-SHA> (stage); --apply <SHA> (apply unchanged files, preserve conflicts). Review .baseline/updates/<SHA>/ first.');
    else {
      if (args.length !== 2 || !['--ref', '--apply'].includes(args[0])) throw new Error('Use --ref <SHA> to stage or --apply <SHA> after review');
      console.log(json(await (args[0] === '--ref' ? stageBaseline : applyBaseline)({ commit: args[1] })));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
