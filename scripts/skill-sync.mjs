import * as fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const sources = {
  emdash: { repository: 'emdash-cms/emdash', prefix: 'skills/', manifest: 'upstream-skills.json', skills: ['building-emdash-site', 'creating-plugins', 'emdash-cli'] },
  site: { repository: 'Vermeulen-Solutions/baseline', prefix: '.agents/skills/', manifest: 'site-skills.json', skills: ['new-site-workflow', 'site-art-direction', 'penpot-site-design', 'openpencil-site-design', 'opendesign-site-design', 'impeccable', 'astro-site-design', 'emdash-site-setup', 'emdash-content-modeling', 'wordpress-to-emdash-content', 'emdash-production-cutover'] },
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
  if (relative.includes('\\') || relative.includes(':') || relative.split('/').some(p => !p || p === '.' || p === '..') || path.isAbsolute(relative)) throw Error('Unsafe relative path: ' + relative);
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw Error('Path escapes root');
  return target;
}
export async function inventory(root, skills) {
  const result = {};
  if (await exists(root) && (await fs.lstat(root)).isSymbolicLink()) throw Error('Symlinked managed root');
  let entries = 0;
  async function walk(relative) {
    if (++entries > 10000) throw Error('Managed inventory exceeds file limit');
    const file = contained(root, relative), stat = await fs.lstat(file);
    if (stat.isSymbolicLink()) throw Error('Symlinks are not managed: ' + relative);
    if (stat.isDirectory()) { for (const name of (await fs.readdir(file)).sort()) await walk(relative + '/' + name); }
    else if (stat.isFile()) {
      if (stat.size > 8 * 1024 * 1024) throw Error('Managed file exceeds size limit: ' + relative);
      result[relative] = hash(normalized(await fs.readFile(file)));
    }
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
    const commit = url.match(/^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\/commits\/([^/?]+)$/);
    if (commit && [404, 422].includes(response.status)) throw Error(`Commit ${decodeURIComponent(commit[2])} not found in ${commit[1]} (check the SHA or ref)`);
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
  // Top-level skill folders upstream, so a site can see skills its installed list never stages.
  const available = tree.tree.filter(item => item.type === 'tree' && item.path.startsWith(config.prefix) && !item.path.slice(config.prefix.length).includes('/')).map(item => item.path.slice(config.prefix.length)).sort();
  const helper = tree.tree.find(item => item.type === 'blob' && item.path === 'scripts/skill-sync.mjs');
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
  return { commitSha: commit.sha, files, available, helperBlobSha: helper?.sha ?? null };
}
export async function review(root, config, candidate, request = fetch) {
  await safeParents(root, '.agents/skills');
  await safeParents(root, '.emdash/' + config.manifest);
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
const SKILL_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
// Skills a site added with --add-skill stay managed after a helper update: membership is the
// helper's list plus valid names already recorded in the site's manifest.
export async function memberSkills(root, kind) {
  const recorded = (await json(path.join(root, '.emdash', sources[kind].manifest)))?.skills;
  const extra = Array.isArray(recorded) ? recorded.filter(name => typeof name === 'string' && SKILL_NAME.test(name) && !sources[kind].skills.includes(name)) : [];
  return [...sources[kind].skills, ...new Set(extra)];
}
function validMembership(kind, skills) {
  return Array.isArray(skills) && sources[kind].skills.every(name => skills.includes(name)) && skills.every(name => typeof name === 'string' && SKILL_NAME.test(name)) && new Set(skills).size === skills.length;
}
// Compares the installed helper with the upstream one at the staged commit (Git blob hash of
// LF-normalized bytes), so a site learns its own sync tooling is behind (found in a real-site rehearsal).
export async function helperDrift(root, upstreamBlobSha) {
  if (!upstreamBlobSha) return { status: 'not-in-upstream' };
  const bytes = await fs.readFile(path.join(root, 'scripts', 'skill-sync.mjs')).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
  if (!bytes) return { status: 'missing-locally' };
  const text = Buffer.from(normalized(bytes));
  const sha = createHash('sha1').update(`blob ${text.length}\0`).update(text).digest('hex');
  return sha === upstreamBlobSha ? { status: 'current' } : { status: 'differs', note: 'scripts/skill-sync.mjs differs from the upstream helper at this commit. Review and adopt the upstream helper (docs/baseline-updates.md); fixes to the helper itself never arrive through skill sync.' };
}
// A text file that was CRLF in the site stays CRLF after apply: hashes normalize line endings,
// so this only avoids a status full of line-ending-only changes on autocrlf checkouts.
export async function matchLineEndings(incomingSkill, targetSkill) {
  if (!await exists(targetSkill)) return 0;
  let changed = 0;
  async function walk(relative) {
    const from = path.join(incomingSkill, relative), stat = await fs.lstat(from);
    if (stat.isDirectory()) { for (const name of await fs.readdir(from)) await walk(path.join(relative, name)); return; }
    const old = await fs.readFile(path.join(targetSkill, relative)).catch(() => null);
    if (!old || old.includes(0) || !old.includes('\r\n')) return;
    const bytes = await fs.readFile(from);
    if (bytes.includes(0) || bytes.includes('\r\n')) return;
    const text = normalized(bytes);
    if (typeof text !== 'string') return;
    await fs.writeFile(from, text.replaceAll('\n', '\r\n')); changed++;
  }
  await walk('');
  return changed;
}
// A template-derived site may still carry Baseline's profile manifests and their tests, which
// require every shipped skill file to be listed. After an apply, list new files of skills that
// manifest already ships, so a clean sync does not fail the site's own verify.
export async function updateProfileManifest(root, skills, incomingFiles) {
  const file = path.join(root, 'profiles', 'manifests', 'shared.json');
  if (!await exists(file)) return [];
  const raw = await fs.readFile(file, 'utf8'), manifest = JSON.parse(raw);
  if (!Array.isArray(manifest.skillFiles)) return [];
  const listed = new Set(manifest.skillFiles), added = [];
  for (const relative of Object.keys(incomingFiles).sort()) {
    const skill = relative.split('/')[0], full = '.agents/skills/' + relative;
    if (!skills.includes(skill) || listed.has(full)) continue;
    if (!manifest.skillFiles.some(item => item.startsWith('.agents/skills/' + skill + '/'))) continue;
    manifest.skillFiles.push(full); listed.add(full); added.push(full);
  }
  if (added.length) {
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    await fs.writeFile(file, (JSON.stringify(manifest, null, 2) + '\n').replaceAll('\n', eol));
  }
  return added;
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
  const directory = stagePath(root, id);
  await safeParents(root, `.emdash/skill-sync/${id}/review.json`);
  await safeParents(root, '.emdash/' + sources[kind].manifest);
  const receipt = await json(path.join(directory, 'review.json'));
  if (!receipt || receipt.root !== path.resolve(root) || receipt.kind !== kind || !validMembership(kind, receipt.skills) || !/^[a-f0-9]{40}$/.test(receipt.commitSha)) throw Error('Invalid stage receipt');
  // Reject symlinks in staging and target roots, including the managed parent.
  for (const relative of ['.agents', '.agents/skills', '.emdash', '.emdash/skill-sync', `.emdash/skill-sync/${id}`, `.emdash/skill-sync/${id}/incoming`]) if ((await fs.lstat(path.join(root, relative))).isSymbolicLink()) throw Error('Symlinked managed root');
  return { directory, receipt };
}
// Windows reports EPERM/EBUSY/EACCES while another process (dev server watcher, editor,
// indexer, antivirus) holds a file in the directory open. Short locks clear within a second.
const LOCKED = new Set(['EPERM', 'EBUSY', 'EACCES']);
async function move(from, to, rename = fs.rename) {
  for (let attempt = 0; ; attempt++) {
    try { return await rename(from, to); }
    catch (error) { if (!LOCKED.has(error.code) || attempt >= 4) throw error; await new Promise(resolve => setTimeout(resolve, 100 * 2 ** attempt)); }
  }
}
function explainLocked(error, id) {
  if (!LOCKED.has(error?.code)) return error;
  return Object.assign(Error(`Could not move a skill directory (${error.code}): another process has files under .agents/skills open. On Windows this is usually a running dev server (astro dev, wrangler dev), an editor or a file indexer. Stop it, then run --apply ${id} again; every change was rolled back.`, { cause: error }), { code: error.code });
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
    const { directory, receipt } = await receiptAt(root, kind, id), config = { ...sources[kind], skills: receipt.skills };
    const previous = await json(path.join(directory, 'journal.json'));
    if (previous && previous.state !== 'rolled-back') throw Error('Stage already applied or interrupted; inspect/recover it first');
    const targetRoot = path.join(root, '.agents', 'skills');
    if (!equal(await inventory(targetRoot, config.skills), receipt.local)) throw Error('Local files changed since review');
    const manifest = path.join(root, '.emdash', config.manifest), before = await fs.readFile(manifest).catch(e => { if (e.code === 'ENOENT') return Buffer.alloc(0); throw e; });
    if (hash(before) !== receipt.previousManifestHash) throw Error('Manifest changed since review');
    if (!equal(await inventory(path.join(directory, 'incoming'), config.skills), receipt.incoming)) throw Error('Staged bytes changed since review');
    if (receipt.conflicts.length && (resolution?.reviewSha256 !== hash(await fs.readFile(path.join(directory, 'review.json'))) || JSON.stringify([...(resolution.replacePaths ?? [])].sort()) !== JSON.stringify(receipt.conflicts))) throw Error('Local drift requires a reviewed exact-path resolution; originals will be retained in backup');
    // A cleanly rolled-back stage can be applied again once the checks above pass: rollback
    // leaves its backup directory empty (rmdir refuses a non-empty one).
    if (previous) {
      await fs.rmdir(path.join(directory, 'backup'));
      await fs.rm(path.join(directory, 'next-manifest'), { force: true });
    }
    await fs.mkdir(path.join(directory, 'backup'));
    await fs.writeFile(path.join(directory, 'previous-manifest'), before);
    const journal = { state: 'applying', moved: [], manifestWritten: false };
    await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
    try {
      for (const skill of config.skills) {
        const target = contained(targetRoot, skill), backup = contained(path.join(directory, 'backup'), skill);
        journal.moved.push({ skill, existed: await exists(target) });
        await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
        await matchLineEndings(contained(path.join(directory, 'incoming'), skill), target);
        if (await exists(target)) await move(target, backup, hooks.rename);
        await hooks.afterBackup?.(skill);
        await move(contained(path.join(directory, 'incoming'), skill), target, hooks.rename);
      }
      const next = { formatVersion: 2, source: `https://github.com/${receipt.repository}/tree/${receipt.commitSha}/${config.prefix}`, ref: receipt.commitSha, commitSha: receipt.commitSha, skills: config.skills, files: receipt.incoming, syncedAt: new Date().toISOString() };
      const nextBytes = JSON.stringify(next, null, 2) + '\n';
      await fs.writeFile(path.join(directory, 'next-manifest'), nextBytes, { flag: 'wx' });
      journal.nextManifestHash = hash(nextBytes);
      await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
      await fs.rename(path.join(directory, 'next-manifest'), manifest);
      journal.manifestWritten = true; journal.state = 'complete';
      await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
    } catch (error) { await rollback(root, kind, directory, receipt, journal); throw explainLocked(error, id); }
    const profileManifest = kind === 'site' ? await updateProfileManifest(root, config.skills, receipt.incoming) : [];
    return { status: 'applied', backup: directory, commitSha: receipt.commitSha, ...(profileManifest.length ? { profileManifestAdded: profileManifest } : {}), next: 'Review the change with git add -A .agents && git diff --cached --stat (line-ending-only changes are not content changes).' };
  });
}
async function rollback(root, kind, directory, receipt, journal) {
  const targetRoot = path.join(root, '.agents', 'skills');
  await safeParents(root, path.relative(root, path.join(directory, 'backup')).split(path.sep).join('/'));
  const previousManifest = await fs.readFile(path.join(directory, 'previous-manifest'));
  if (hash(previousManifest) !== receipt.previousManifestHash) throw Error('Recovery backup manifest changed; manual review required');
  const currentManifest = await fs.readFile(path.join(root, '.emdash', sources[kind].manifest)).catch(e => { if (e.code === 'ENOENT') return Buffer.alloc(0); throw e; });
  if (![receipt.previousManifestHash, journal.nextManifestHash].includes(hash(currentManifest))) throw Error('Recovery found later manifest changes; manual review required');
  // Check every affected directory before moving any: recovery must preserve later edits,
  // even when the changed skill is last in rollback order.
  for (const { skill, existed } of journal.moved) {
    if (!receipt.skills.includes(skill)) throw Error('Invalid recovery journal');
    const before = Object.fromEntries(Object.entries(receipt.local).filter(([p]) => p.startsWith(skill + '/')));
    const incoming = Object.fromEntries(Object.entries(receipt.incoming).filter(([p]) => p.startsWith(skill + '/')));
    const backup = contained(path.join(directory, 'backup'), skill);
    if (existed && !await exists(backup) && !await exists(contained(targetRoot, skill))) throw Error('Recovery original is missing; manual review required: ' + skill);
    if (await exists(backup) && !equal(await inventory(path.join(directory, 'backup'), [skill]), before)) throw Error('Recovery backup changed; manual review required: ' + skill);
    if (await exists(contained(targetRoot, skill))) {
      const now = await inventory(targetRoot, [skill]);
      if (!equal(now, incoming) && !(equal(now, before) && !await exists(backup))) throw Error('Recovery found later local changes; preserved backup needs manual review: ' + skill);
    }
  }
  for (const { skill, existed } of [...journal.moved].reverse()) {
    const target = contained(targetRoot, skill), backup = contained(path.join(directory, 'backup'), skill);
    if (await exists(target)) {
      const now = await inventory(targetRoot, [skill]);
      const before = Object.fromEntries(Object.entries(receipt.local).filter(([p]) => p.startsWith(skill + '/')));
      const incoming = Object.fromEntries(Object.entries(receipt.incoming).filter(([p]) => p.startsWith(skill + '/')));
      if (!await exists(backup) && existed && equal(now, before)) continue;
      if (!equal(now, incoming)) throw Error('Recovery found later local changes; preserved backup needs manual review: ' + skill);
      await move(target, path.join(directory, 'incoming', skill));
    }
    if (existed && await exists(backup)) await move(backup, target);
  }
  const previous = await fs.readFile(path.join(directory, 'previous-manifest'));
  const manifest = path.join(root, '.emdash', sources[kind].manifest);
  if (previous.length) await fs.writeFile(manifest, previous); else if (await exists(manifest)) await fs.unlink(manifest);
  journal.state = 'rolled-back'; await fs.writeFile(path.join(directory, 'journal.json'), JSON.stringify(journal));
}
export async function recoverSync(root, kind, id) {
  return withLock(root, async () => { const { directory, receipt } = await receiptAt(root, kind, id), journal = await json(path.join(directory, 'journal.json')); if (journal?.state !== 'applying') throw Error('No interrupted apply'); await rollback(root, kind, directory, receipt, journal); return { status: 'rolled-back' }; });
}
export async function runSync(root, kind, args = process.argv.slice(2), request = fetch) {
  if (!args.length) args = ['--stage'];
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const name = args[i];
    if (!['--check', '--stage', '--apply', '--recover', '--ref', '--resolution', '--add-skill', '--root'].includes(name) || seen.has(name)) throw Error('Unknown or repeated option: ' + name);
    seen.add(name);
    if (['--apply', '--recover', '--ref', '--resolution', '--add-skill', '--root'].includes(name) && (!args[++i] || args[i].startsWith('--'))) throw Error('Missing ' + name);
  }
  if (seen.has('--root') && !seen.has('--check')) throw Error('--root is only valid with --check (read-only); stage and apply with the site\'s own helper');
  if (seen.has('--resolution') && !seen.has('--apply')) throw Error('--resolution requires --apply');
  if ((seen.has('--ref') || seen.has('--add-skill')) && (seen.has('--apply') || seen.has('--recover'))) throw Error('--ref and --add-skill are only valid with --stage or --check');
  const option = name => { const i = args.indexOf(name); if (i < 0) return null; if (!args[i + 1] || args[i + 1].startsWith('--')) throw Error('Missing ' + name); return args[i + 1]; };
  const actions = ['--check', '--stage', '--apply', '--recover'].filter(a => args.includes(a));
  if (actions.length !== 1) throw Error('Choose exactly one: --check, --stage, --apply <stage-id>, --recover <stage-id>');
  if (args.includes('--apply')) return applySync(root, kind, option('--apply'), option('--resolution') ? await json(path.resolve(option('--resolution'))) : null);
  if (args.includes('--recover')) return recoverSync(root, kind, option('--recover'));
  if (args.includes('--root')) root = path.resolve(option('--root'));
  const config = { ...sources[kind], skills: await memberSkills(root, kind) }, ref = option('--ref') ?? process.env[kind === 'site' ? 'SITE_SKILLS_REF' : 'EMDASH_SKILLS_REF'] ?? 'main';
  if (kind === 'site' && process.env.SITE_SKILLS_REPOSITORY) config.repository = process.env.SITE_SKILLS_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository)) throw Error('Invalid source repository');
  const added = option('--add-skill')?.split(',').map(name => name.trim()).filter(Boolean) ?? [];
  for (const name of added) if (!SKILL_NAME.test(name)) throw Error('Invalid skill name: ' + name);
  config.skills = [...new Set([...config.skills, ...added])];
  const candidate = await download(config, ref, request), report = await review(root, config, candidate, request);
  // Mirrored EmDash skills live in the site repository too but belong to the other source.
  const foreign = kind === 'site' ? sources.emdash.skills : [];
  const notInstalled = (candidate.available ?? []).filter(name => !config.skills.includes(name) && !foreign.includes(name));
  const helper = kind === 'site' ? await helperDrift(root, candidate.helperBlobSha) : undefined;
  const extras = { notInstalled, ...(notInstalled.length ? { addHint: `Upstream skills not in this site's list: ${notInstalled.join(', ')}. Stage one with --add-skill <name> after deciding it is relevant.` } : {}), ...(helper ? { helper } : {}) };
  if (args.includes('--check')) return { ...report, commitSha: candidate.commitSha, mutation: false, ...extras };
  const id = await stageSync(root, kind, config, candidate, report);
  return { status: report.status, stageId: id, commitSha: candidate.commitSha, conflicts: report.conflicts, ...(added.length ? { added } : {}), ...extras, next: `Review .emdash/skill-sync/${id}/review.json and incoming diff; then --apply ${id}. Drift needs --resolution with reviewSha256 and exact replacePaths. Backups are retained.` };
}
