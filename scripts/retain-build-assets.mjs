import { readdir, readFile, mkdir, writeFile, lstat, realpath, open, unlink, rename, rm } from 'node:fs/promises';
import { hostname } from 'node:os';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const inside = (parent, child) => { const path = relative(parent, child); return !path.startsWith('..') && !isAbsolute(path); };
const LOCK = '.retention.lock';
const RECEIPT = '.baseline-retention.json';
const pendingName = /^\.pending-[0-9a-f-]{36}$/;

async function regularJson(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Archive metadata must be a regular file.');
  return JSON.parse(await readFile(path, 'utf8'));
}

/** Never expire an active lock just because a build is slow. */
export async function acquireAssetArchiveLock(archivePath) {
  const archive = await realpath(archivePath), path = join(archive, LOCK);
  const token = randomUUID();
  let handle;
  try { handle = await open(path, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Asset archive is locked. Wait for its owner; after a crash, inspect .retention.lock and use --recover-lock <token> only when that job has stopped.');
    throw error;
  }
  try {
    await handle.writeFile(JSON.stringify({ version: 1, token, pid: process.pid, host: hostname(), createdAt: Date.now() }));
    await handle.sync();
  } finally { await handle.close(); }
  return {
    token,
    async release() {
      const lock = await regularJson(path);
      if (lock.token !== token) throw new Error('Asset archive lock ownership changed; refusing to remove it.');
      await unlink(path);
    },
  };
}

/** Recovery is a serialized operator/agent action after the owning job stops.
 * Cross-host liveness cannot be inferred from age; the caller must establish it.
 */
export async function recoverAssetArchiveLock(archivePath, token) {
  const archive = await realpath(archivePath), path = join(archive, LOCK);
  const lock = await regularJson(path);
  if (lock.version !== 1 || typeof token !== 'string' || lock.token !== token || !Number.isInteger(lock.pid) || lock.pid <= 0 || typeof lock.host !== 'string') throw new Error('Invalid asset lock recovery token or owner.');
  if (lock.host === hostname()) {
    try { process.kill(lock.pid, 0); throw new Error('Asset archive owner is still running; refusing recovery.'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  await unlink(path);
  return { recovered: true };
}

async function files(root, prefix = '') {
  if (!prefix && (await lstat(root)).isSymbolicLink()) throw new Error('Asset trees must not contain symlinks.');
  const result = new Map();
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const key = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error('Asset trees must not contain symlinks.');
    if (entry.isDirectory()) for (const [nestedKey, value] of await files(root, key)) result.set(nestedKey, value);
    else if (entry.isFile()) result.set(key, await readFile(join(root, key)));
    else throw new Error('Asset trees must contain only regular files and directories.');
  }
  return result;
}

/** Archive the fresh build BEFORE merging old assets. No remote writes.
 * Archive belongs to ONE site/environment and must persist between deploy jobs.
 */
export async function retainBuildAssets(assetsPath, archivePath, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error('Invalid retention clock.');
  const assets = await realpath(assetsPath), archive = resolve(archivePath);
  if ((await lstat(assetsPath)).isSymbolicLink()) throw new Error('Asset root must not be a symlink.');
  await mkdir(archive, { recursive: true });
  const archiveRoot = await realpath(archive);
  if (inside(assets, archiveRoot) || inside(archiveRoot, assets)) throw new Error('Asset output and archive must be separate trees.');
  const lock = await acquireAssetArchiveLock(archiveRoot);
  try { return await retainLocked(assets, archiveRoot, now); }
  finally { await lock.release(); }
}

async function retainLocked(assets, archiveRoot, now) {
  // A retry must never re-archive inherited files with a new lifetime. A clean
  // build removes this marker. On failure it also tells the next job to rebuild.
  try {
    await lstat(join(assets, RECEIPT));
    throw new Error('Asset output was already processed or interrupted. Rebuild cleanly before retention; do not remove only the receipt.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const current = await files(assets), merged = new Map(current);
  if (!current.size) throw new Error('Fresh _astro output is empty.');
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;
  const interrupted = [];
  for (const entry of await readdir(archiveRoot, { withFileTypes: true })) {
    if (entry.name === LOCK) continue;
    // Only committed generations participate. SIGKILL/power-loss staging trees
    // are quarantined by name, never interpreted as a completed backup.
    if (pendingName.test(entry.name) && entry.isDirectory() && !entry.isSymbolicLink()) { interrupted.push(entry.name); continue; }
    if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error('Unexpected archive entry. Use a dedicated asset archive.');
    const release = join(archiveRoot, entry.name);
    const manifest = await regularJson(join(release, 'manifest.json'));
    if (manifest.version !== 1 || !Number.isFinite(manifest.createdAt) || manifest.createdAt > now) throw new Error('Invalid asset archive manifest.');
    if (manifest.createdAt < cutoff) continue;
    const archived = await files(join(release, '_astro'));
    const hashes = Object.fromEntries([...archived].map(([key, bytes]) => [key, digest(bytes)]));
    if (JSON.stringify(Object.entries(hashes).sort()) !== JSON.stringify(Object.entries(manifest.hashes).sort())) throw new Error('Archived asset integrity check failed.');
    for (const [key, bytes] of archived) {
      if (merged.has(key) && !merged.get(key).equals(bytes)) throw new Error(`Asset filename collision: ${key}`);
      merged.set(key, bytes);
    }
  }
  // Validate everything before changing the build output. Preserve the current
  // build separately so inherited assets do not get a new seven-day lifetime.
  const id = randomUUID(), stage = join(archiveRoot, `.pending-${id}`), release = join(archiveRoot, `${now}-${id}`);
  try {
    await mkdir(join(stage, '_astro'), { recursive: true });
    for (const [key, bytes] of current) {
      await mkdir(resolve(stage, '_astro', key, '..'), { recursive: true });
      await writeFile(join(stage, '_astro', key), bytes, { flag: 'wx' });
    }
    const handle = await open(join(stage, 'manifest.json'), 'wx', 0o600);
    try {
      await handle.writeFile(JSON.stringify({ version: 1, createdAt: now, hashes: Object.fromEntries([...current].map(([key, bytes]) => [key, digest(bytes)])) }));
      await handle.sync();
    } finally { await handle.close(); }
    await rename(stage, release);
  } catch (error) {
    // This exact generated scratch path was created by this invocation and is
    // within the resolved archive. Never delete committed generations here.
    if (!inside(archiveRoot, stage) || !pendingName.test(relative(archiveRoot, stage))) throw error;
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
  // No paths, credentials or archive contents are written into the public receipt.
  await writeFile(join(assets, RECEIPT), JSON.stringify({ version: 1, state: 'merging', createdAt: now }), { flag: 'wx' });
  for (const [key, bytes] of merged) if (!current.has(key)) {
    await mkdir(resolve(assets, key, '..'), { recursive: true });
    await writeFile(join(assets, key), bytes, { flag: 'wx' });
  }
  await writeFile(join(assets, RECEIPT), JSON.stringify({ version: 1, state: 'complete', createdAt: now }));
  return { current: current.size, retained: merged.size - current.size, retentionDays: 7, release, interrupted };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length === 6 && process.argv[2] === '--recover-lock' && process.argv[4] === '--archive') {
      console.log(JSON.stringify(await recoverAssetArchiveLock(process.argv[5], process.argv[3])));
      process.exitCode = 0;
    } else {
    if (process.argv.length !== 6 || process.argv[2] !== '--assets' || process.argv[4] !== '--archive') throw new Error('Use --assets dist/client/_astro --archive <persistent-private-directory>');
    console.log(JSON.stringify(await retainBuildAssets(process.argv[3], process.argv[5])));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
