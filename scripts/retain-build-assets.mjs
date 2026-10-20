import { readdir, readFile, mkdir, writeFile, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const inside = (parent, child) => { const path = relative(parent, child); return !path.startsWith('..') && !isAbsolute(path); };

async function files(root, prefix = '') {
  const result = new Map();
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const key = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error('Asset trees must not contain symlinks.');
    if (entry.isDirectory()) for (const [key, value] of await files(root, key)) result.set(key, value);
    else if (entry.isFile()) result.set(key, await readFile(join(root, key)));
    else throw new Error('Asset trees must contain only regular files and directories.');
  }
  return result;
}

/** Archive the fresh build BEFORE merging old assets. No remote writes or deletes.
 * Archive belongs to ONE site/environment and must persist between deploy jobs.
 */
export async function retainBuildAssets(assetsPath, archivePath, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error('Invalid retention clock.');
  const assets = await realpath(assetsPath), archive = resolve(archivePath);
  if ((await lstat(assetsPath)).isSymbolicLink()) throw new Error('Asset root must not be a symlink.');
  await mkdir(archive, { recursive: true });
  const archiveRoot = await realpath(archive);
  if (inside(assets, archiveRoot) || inside(archiveRoot, assets)) throw new Error('Asset output and archive must be separate trees.');
  const current = await files(assets), merged = new Map(current);
  if (!current.size) throw new Error('Fresh _astro output is empty.');
  const cutoff = now - 7 * 24 * 60 * 60 * 1000;
  for (const entry of await readdir(archiveRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error('Unexpected archive entry. Use a dedicated asset archive.');
    const release = join(archiveRoot, entry.name);
    const manifest = JSON.parse(await readFile(join(release, 'manifest.json'), 'utf8'));
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
  const release = join(archiveRoot, `${now}-${randomUUID()}`);
  await mkdir(join(release, '_astro'), { recursive: true });
  for (const [key, bytes] of current) {
    await mkdir(resolve(release, '_astro', key, '..'), { recursive: true });
    await writeFile(join(release, '_astro', key), bytes, { flag: 'wx' });
  }
  await writeFile(join(release, 'manifest.json'), JSON.stringify({ version: 1, createdAt: now, hashes: Object.fromEntries([...current].map(([key, bytes]) => [key, digest(bytes)])) }));
  for (const [key, bytes] of merged) if (!current.has(key)) {
    await mkdir(resolve(assets, key, '..'), { recursive: true });
    await writeFile(join(assets, key), bytes, { flag: 'wx' });
  }
  return { current: current.size, retained: merged.size - current.size, retentionDays: 7, release };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 6 || process.argv[2] !== '--assets' || process.argv[4] !== '--archive') throw new Error('Use --assets dist/client/_astro --archive <persistent-private-directory>');
    console.log(JSON.stringify(await retainBuildAssets(process.argv[3], process.argv[5])));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
