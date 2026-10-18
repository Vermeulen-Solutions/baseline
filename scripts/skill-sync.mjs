import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const sources = {
  emdash: { repository: 'emdash-cms/emdash', prefix: 'skills/', manifest: 'upstream-skills.json', skills: ['building-emdash-site', 'creating-plugins', 'emdash-cli'] },
  site: { repository: 'Vermeulen-Solutions/baseline', prefix: '.agents/skills/', manifest: 'site-skills.json', skills: ['new-site-workflow', 'site-art-direction', 'impeccable', 'astro-site-design', 'emdash-site-setup', 'emdash-content-modeling', 'wordpress-to-emdash-content', 'emdash-production-cutover'] },
};
export const hash = value => createHash('sha256').update(value).digest('hex');
const normalized = bytes => {
  if (bytes.includes(0)) return bytes;
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes).replaceAll('\r\n', '\n'); }
  catch { return bytes; }
};
async function json(file) { try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
async function exists(file) { try { await fs.lstat(file); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } }
async function safeParents(root, relative) {
  let current = path.resolve(root);
  for (const segment of relative.split('/')) { current = path.join(current, segment); if (await exists(current) && (await fs.lstat(current)).isSymbolicLink()) throw Error('Symlinked managed parent: ' + current); }
}
function contained(root, relative) {
  if (relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..') || path.isAbsolute(relative)) throw Error('Unsafe relative path: ' + relative);
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw Error('Path escapes root');
  return target;
}
export async function inventory(root, skills) {
  const result = {};
  async function walk(relative) {
    const file = contained(root, relative), stat = await fs.lstat(file);
    if (stat.isSymbolicLink()) throw Error('Symlinks are not managed: ' + relative);
    if (stat.isDirectory()) { for (const name of (await fs.readdir(file)).sort()) await walk(relative + '/' + name); }
    else if (stat.isFile()) result[relative] = hash(normalized(await fs.readFile(file)));
    else throw Error('Unsupported file: ' + relative);
  }
  for (const skill of skills) if (await exists(contained(root, skill))) await walk(skill);
  return result;
}
function equal(a, b) { return JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort()); }
async function fetchJson(url, request) {
  const response = await request(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'emdash-reviewed-skill-sync' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) {
    if (request === fetch && [401, 403, 404].includes(response.status) && url.startsWith('https://api.github.com/')) return JSON.parse(execFileSync('gh', ['api', url.slice('https://api.github.com/'.length)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
    throw Error(`Upstream unavailable (${response.status}): ${url}`);
  }
  return response.json();
}
export async function download(config, ref, request = fetch) {
  const commit = await fetchJson(`https://api.github.com/repos/${config.repository}/commits/${encodeURIComponent(ref)}`, request);
  if (!/^[a-f0-9]{40}$/.test(commit.sha)) throw Error('Invalid resolved commit');
  const tree = await fetchJson(`https://api.github.com/repos/${config.repository}/git/trees/${commit.sha}?recursive=1`, request);
  if (tree.truncated) throw Error('Truncated upstream tree');
  const files = {};
  for (const item of tree.tree) {
    if (!config.skills.some(name => item.path.startsWith(config.prefix + name + '/'))) continue;
    if (item.type === 'tree') continue;
    if (item.type !== 'blob' || !['100644', '100755'].includes(item.mode)) throw Error('Unsupported upstream file: ' + item.path);
    const relative = item.path.slice(config.prefix.length); contained('/validated', relative);
    const response = await request(`https://raw.githubusercontent.com/${config.repository}/${commit.sha}/${item.path}`, { signal: AbortSignal.timeout(20000) });
    let bytes;
    if (!response.ok && request === fetch && [401, 403, 404].includes(response.status)) {
      const blob = JSON.parse(execFileSync('gh', ['api', `repos/${config.repository}/git/blobs/${item.sha}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 40 * 1024 * 1024 }));
      if (blob.encoding !== 'base64') throw Error('Unsupported Git blob encoding');
      bytes = Buffer.from(blob.content, 'base64');
    }
    else { if (!response.ok) throw Error('Download failed: ' + item.path); bytes = Buffer.from(await response.arrayBuffer()); }
    const sha1 = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (sha1 !== item.sha) throw Error('Blob integrity mismatch: ' + item.path);
    files[relative] = { bytes, mode: item.mode };
  }
  for (const name of config.skills) if (!files[name + '/SKILL.md']) throw Error('Missing upstream skill: ' + name);
  return { commitSha: commit.sha, files };
}
export async function review(root, config, candidate, request = fetch) {
  const previous = await json(path.join(root, '.emdash', config.manifest));
  const local = await inventory(path.join(root, '.agents', 'skills'), config.skills);
  let baseline = previous?.files;
  // Legacy commit-only receipts need actual source bytes; the commit alone never proves cleanliness.
  if (!baseline && previous?.commitSha) {
    const oldConfig = { ...config, skills: previous.skills.filter(name => config.skills.includes(name)) };
    const old = await download(oldConfig, previous.commitSha, request);
    baseline = Object.fromEntries(Object.entries(old.files).map(([file, data]) => [file, hash(normalized(data.bytes))]));
  }
  baseline ??= {};
  const incoming = Object.fromEntries(Object.entries(candidate.files).map(([file, data]) => [file, hash(normalized(data.bytes))]));
  const conflicts = [...new Set([...Object.keys(local), ...Object.keys(baseline)])].filter(file => local[file] !== baseline[file]).sort();
  return { local, incoming, conflicts, previousManifestHash: hash(await fs.readFile(path.join(root, '.emdash', config.manifest)).catch(e => { if (e.code === 'ENOENT') return Buffer.alloc(0); throw e; })), status: conflicts.length ? 'local-drift' : equal(local, incoming) ? 'current' : 'update-available' };
}
async function save(file, value) { await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }); }
export async function stageSync(root, kind, config, candidate, report) {
  await safeParents(root, '.emdash/skill-sync');
  const id = randomUUID(), directory = path.join(root, '.emdash', 'skill-sync', id);
  await fs.mkdir(path.join(directory, 'incoming'), { recursive: true });
  for (const [relative, data] of Object.entries(candidate.files)) {
    const target = contained(path.join(directory, 'incoming'), relative); await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data.bytes); await fs.chmod(target, data.mode === '100755' ? 0o755 : 0o644);
  }
  const receipt = { formatVersion: 1, root: path.resolve(root), kind, repository: config.repository, commitSha: candidate.commitSha, skills: config.skills, ...report };
  await save(path.join(directory, 'review.json'), receipt);
  return id;
}
function stagePath(root, id) { if (!/^[a-f0-9-]{36}$/.test(id)) throw Error('Invalid stage ID'); return path.join(root, '.emdash', 'skill-sync', id); }
async function receiptAt(root, kind, id) {
  const directory = stagePath(root, id), receipt = await json(path.join(directory, 'review.json'));
  if (!receipt || receipt.root !== path.resolve(root) || receipt.kind !== kind || JSON.stringify(receipt.skills) !== JSON.stringify(sources[kind].skills) || !/^[a-f0-9]{40}$/.test(receipt.commitSha)) throw Error('Invalid stage receipt');
  // Reject symlinks in staging and target roots, including the managed parent.
  for (const relative of ['.agents', '.agents/skills', '.emdash', '.emdash/skill-sync', `.emdash/skill-sync/${id}`, `.emdash/skill-sync/${id}/incoming`]) if ((await fs.lstat(path.join(root, relative))).isSymbolicLink()) throw Error('Symlinked managed root');
  return { directory, receipt };
}
async function withLock(root, action) {
  await safeParents(root, '.emdash');
  await fs.mkdir(path.join(root, '.emdash'), { recursive: true });
  const lockPath = path.join(root, '.emdash', 'skill-sync.lock'), lock = await fs.open(lockPath, 'wx');
  await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  try { return await action(); } finally { await lock.close(); await fs.unlink(lockPath); }
}
export async function applySync(root, kind, id, resolution, hooks = {}) {
  return withLock(root, async () => {
    const { directory, receipt } = await receiptAt(root, kind, id), config = sources[kind];
    if (await exists(path.join(directory, 'journal.json'))) throw Error('Stage already applied or interrupted; inspect/recover it first');
    const targetRoot = path.join(root, '.agents', 'skills');
    if (!equal(await inventory(targetRoot, config.skills), receipt.local)) throw Error('Local files changed since review');
    const manifest = path.join(root, '.emdash', config.manifest), before = await fs.readFile(manifest).catch(e => { if (e.code === 'ENOENT') return Buffer.alloc(0); throw e; });
    if (hash(before) !== receipt.previousManifestHash) throw Error('Manifest changed since review');
    if (!equal(await inventory(path.join(directory, 'incoming'), config.skills), receipt.incoming)) throw Error('Staged bytes changed since review');
    if (receipt.conflicts.length && (resolution?.reviewSha256 !== hash(await fs.readFile(path.join(directory, 'review.json'))) || JSON.stringify([...(resolution.replacePaths ?? [])].sort()) !== JSON.stringify(receipt.conflicts))) throw Error('Local drift requires a reviewed exact-path resolution; originals will be retained in backup');
    await fs.mkdir(path.join(directory, 'backup'));
    await fs.writeFile(path.join(directory, 'previous-manifest'), before);
    const journal = { state: 'applying', moved: [], manifestWritten: false };
    await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
    try {
      for (const skill of config.skills) {
        const target = contained(targetRoot, skill), backup = contained(path.join(directory, 'backup'), skill);
        journal.moved.push({ skill, existed: await exists(target) });
        await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
        if (await exists(target)) await fs.rename(target, backup);
        await hooks.afterBackup?.(skill);
        await fs.rename(contained(path.join(directory, 'incoming'), skill), target);
      }
      const next = { formatVersion: 2, source: `https://github.com/${receipt.repository}/tree/${receipt.commitSha}/${config.prefix}`, ref: receipt.commitSha, commitSha: receipt.commitSha, skills: config.skills, files: receipt.incoming, syncedAt: new Date().toISOString() };
      await fs.writeFile(manifest + '.next', JSON.stringify(next, null, 2) + '\n'); await fs.rename(manifest + '.next', manifest);
      journal.manifestWritten = true; journal.state = 'complete';
      await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
    } catch (error) { await rollback(root, kind, directory, receipt, journal); throw error; }
    return { status: 'applied', backup: directory, commitSha: receipt.commitSha };
  });
}
async function rollback(root, kind, directory, receipt, journal) {
  const targetRoot = path.join(root, '.agents', 'skills');
  for (const { skill, existed } of [...journal.moved].reverse()) {
    const target = contained(targetRoot, skill), backup = contained(path.join(directory, 'backup'), skill);
    if (await exists(target)) {
      const now = await inventory(targetRoot, [skill]);
      const before = Object.fromEntries(Object.entries(receipt.local).filter(([p]) => p.startsWith(skill + '/')));
      const incoming = Object.fromEntries(Object.entries(receipt.incoming).filter(([p]) => p.startsWith(skill + '/')));
      if (!await exists(backup) && existed && equal(now, before)) continue;
      if (!equal(now, incoming)) throw Error('Recovery found later local changes; preserved backup needs manual review: ' + skill);
      await fs.rename(target, path.join(directory, 'incoming', skill));
    }
    if (existed && await exists(backup)) await fs.rename(backup, target);
  }
  const previous = await fs.readFile(path.join(directory, 'previous-manifest'));
  const manifest = path.join(root, '.emdash', sources[kind].manifest);
  if (previous.length) await fs.writeFile(manifest, previous); else if (await exists(manifest)) await fs.unlink(manifest);
  journal.state = 'rolled-back'; await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
}
export async function recoverSync(root, kind, id) {
  return withLock(root, async () => { const { directory, receipt } = await receiptAt(root, kind, id), journal = await json(path.join(directory, 'journal.json')); if (journal?.state !== 'applying') throw Error('No interrupted apply'); await rollback(root, kind, directory, receipt, journal); return { status: 'rolled-back' }; });
}
export async function runSync(root, kind, args = process.argv.slice(2)) {
  if (!args.length) args = ['--stage'];
  const option = name => { const i = args.indexOf(name); if (i < 0) return null; if (!args[i + 1] || args[i + 1].startsWith('--')) throw Error('Missing ' + name); return args[i + 1]; };
  const actions = ['--check', '--stage', '--apply', '--recover'].filter(a => args.includes(a));
  if (actions.length !== 1) throw Error('Choose exactly one: --check, --stage, --apply <stage-id>, --recover <stage-id>');
  if (args.includes('--apply')) return applySync(root, kind, option('--apply'), option('--resolution') ? await json(path.resolve(option('--resolution'))) : null);
  if (args.includes('--recover')) return recoverSync(root, kind, option('--recover'));
  const config = { ...sources[kind] }, ref = option('--ref') ?? process.env[kind === 'site' ? 'SITE_SKILLS_REF' : 'EMDASH_SKILLS_REF'] ?? 'main';
  if (kind === 'site' && process.env.SITE_SKILLS_REPOSITORY) config.repository = process.env.SITE_SKILLS_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository)) throw Error('Invalid source repository');
  const candidate = await download(config, ref), report = await review(root, config, candidate);
  if (args.includes('--check')) return { ...report, commitSha: candidate.commitSha, mutation: false };
  const id = await stageSync(root, kind, config, candidate, report);
  return { status: report.status, stageId: id, commitSha: candidate.commitSha, conflicts: report.conflicts, next: `Review .emdash/skill-sync/${id}/review.json and incoming diff; then --apply ${id}. Drift needs --resolution with reviewSha256 and exact replacePaths. Backups are retained.` };
}
