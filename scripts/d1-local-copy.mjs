// Production content on the local dev server: loads a `db:export-d1` copy of a Workers site's D1
// database into a SQLite file that `astro dev` can serve, with the site's media and the code of its
// sandboxed plugins beside it. Nothing here writes to Cloudflare or to the site's own data.db.
//
//   npm run db:local-copy -- --from <export.sql> --to <empty dir Git ignores, e.g. .emdash/backups/local-<date>>
//        [--origin <https://live-site>] [--bucket <name>] [--no-media] [--no-plugin-bundles]
//
// 1. Loads the export into <to>/data.db with node:sqlite (foreign keys checked after loading, as in
//    `db:rehearse`), and refuses a copy that fails the integrity or foreign-key check.
// 2. Copies every media file into <to>/uploads: over HTTP from the live site's public media route
//    when --origin is given (seconds for a library of a few hundred files), otherwise from R2 one
//    object at a time (seconds per object).
// 3. Copies the code of every active registry and marketplace plugin from R2 into <to>/uploads.
// 4. Prints the command that serves the copy: the dev server reads EMDASH_SQLITE_URL and
//    EMDASH_LOCAL_MEDIA_DIR (astro.config.mjs); without them it keeps using ./data.db and ./uploads.
// The copy holds users, sessions and content, so it is written only where Git ignores it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { execNpmSync } from './process-runner.mjs';
import { argumentsOf, isMain } from './infrastructure-io.mjs';
import { DEFAULT_BACKUP_DIR, gitIgnoreStatus } from './d1-export.mjs';
import { loadExport, pluginBundlePrefixes, pluginStates, wranglerBindings } from './d1-rehearse.mjs';

export const RECORD_FILE = 'local-copy.json';

export function assertLocalCopyTarget(to, run) {
  if (gitIgnoreStatus(path.join(path.resolve(to), RECORD_FILE), run) === 'tracked') {
    throw new Error(`${to} is not ignored by Git, and the copy holds users, sessions and content. Use a folder under ${DEFAULT_BACKUP_DIR}/ (for example ${DEFAULT_BACKUP_DIR}/local-<date>) or outside the repository.`);
  }
}

export function mediaKeys(file) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'media'").get()) return [];
    return db.prepare('SELECT storage_key FROM media WHERE storage_key IS NOT NULL ORDER BY created_at DESC').all().map(row => row.storage_key);
  } finally { db.close(); }
}

// A storage key becomes a path under the media folder; a key that would leave it is refused.
export function keyPath(uploads, key) {
  const full = path.resolve(uploads, key);
  const root = path.resolve(uploads);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error(`Storage key leaves the media folder: ${key}`);
  return full;
}

export function mediaURL(origin, key) {
  const base = new URL(origin);
  if (!['https:', 'http:'].includes(base.protocol)) throw new Error('--origin must be an http(s) URL');
  return new URL(`/_emdash/api/media/file/${key.split('/').map(encodeURIComponent).join('/')}`, base).href;
}

export function serveCommands(to) {
  const relative = path.relative(process.cwd(), path.resolve(to)).split(path.sep).join('/') || '.';
  const where = relative.startsWith('..') ? path.resolve(to).split(path.sep).join('/') : `./${relative}`;
  return {
    powershell: `$env:EMDASH_SQLITE_URL = 'file:${where}/data.db'; $env:EMDASH_LOCAL_MEDIA_DIR = '${where}/uploads'; npm.cmd run dev`,
    posix: `EMDASH_SQLITE_URL=file:${where}/data.db EMDASH_LOCAL_MEDIA_DIR=${where}/uploads npm run dev`,
  };
}

const wrangler = ['exec', '--', 'wrangler'];
function getR2Object(bucket, key, destination, runNpm, { optional = false } = {}) {
  const temporary = path.join(os.tmpdir(), `d1-local-copy-${randomUUID()}`);
  try {
    runNpm([...wrangler, 'r2', 'object', 'get', `${bucket}/${key}`, '--remote', '--file', temporary], { stdio: 'pipe' });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(temporary, destination);
    return true;
  } catch (error) {
    if (optional) return false;
    throw new Error(`Could not read ${bucket}/${key} from R2: ${String(error.stderr ?? error.message).trim().split('\n').at(-1)}`);
  } finally { fs.rmSync(temporary, { force: true }); }
}

async function fetchMedia(origin, keys, uploads, fetcher, concurrency = 8) {
  const failed = [];
  let copied = 0;
  for (let i = 0; i < keys.length; i += concurrency) {
    await Promise.all(keys.slice(i, i + concurrency).map(async key => {
      try {
        const response = await fetcher(mediaURL(origin, key));
        if (!response.ok) { failed.push(`${key} (${response.status})`); return; }
        const destination = keyPath(uploads, key);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
        copied++;
      } catch (error) { failed.push(`${key} (${error.message})`); }
    }));
  }
  return { copied, failed };
}

export async function prepareLocalCopy({ from, to, origin, bucket, media = true, pluginBundles = true }, { runNpm = execNpmSync, fetcher = fetch, run } = {}) {
  if (!from || !to) throw new Error('Specify --from <export.sql> and --to <empty directory>.');
  const target = path.resolve(to);
  assertLocalCopyTarget(target, run);
  if (fs.existsSync(target) && fs.readdirSync(target).length) throw new Error(`${target} is not empty. Use a fresh directory for each copy.`);
  const uploads = path.join(target, 'uploads');
  fs.mkdirSync(uploads, { recursive: true });
  const file = path.join(target, 'data.db');

  const loaded = loadExport(file, fs.readFileSync(path.resolve(from), 'utf8'));
  if (loaded.integrity !== 'ok' || loaded.foreignKeyViolations) throw new Error(`The loaded copy is not sound: integrity ${loaded.integrity}, ${loaded.foreignKeyViolations} foreign-key violations.`);
  console.log(`[db:local-copy] Loaded ${Object.keys(loaded.counts).length} tables (${Object.values(loaded.counts).reduce((a, n) => a + n, 0)} rows) into ${file}.`);

  const bucketName = bucket || wranglerBindings().bucket;
  let mediaResult = { copied: 0, failed: [], from: 'skipped' };
  if (media) {
    const keys = mediaKeys(file);
    if (origin) mediaResult = { ...(await fetchMedia(origin, keys, uploads, fetcher)), from: new URL(origin).origin };
    else if (bucketName) {
      const failed = [];
      let copied = 0;
      for (const key of keys) (getR2Object(bucketName, key, keyPath(uploads, key), runNpm, { optional: true }) ? copied++ : failed.push(key));
      mediaResult = { copied, failed, from: `r2:${bucketName}` };
    } else throw new Error('Media needs a source: pass --origin <https://live-site> (fastest) or --bucket <name>, or --no-media.');
    console.log(`[db:local-copy] Copied ${mediaResult.copied} of ${keys.length} media files from ${mediaResult.from}.${mediaResult.failed.length ? ` Not copied: ${mediaResult.failed.slice(0, 5).join(', ')}${mediaResult.failed.length > 5 ? ', …' : ''}` : ''}`);
  }

  const bundles = pluginBundles ? pluginBundlePrefixes(pluginStates(file)) : [];
  if (bundles.length && !bucketName) throw new Error('Active registry or marketplace plugins need their code from R2: specify --bucket <name>, or --no-plugin-bundles.');
  const copiedBundles = [];
  for (const bundle of bundles) {
    for (const name of ['manifest.json', 'backend.js']) { getR2Object(bucketName, `${bundle.prefix}/${name}`, keyPath(uploads, `${bundle.prefix}/${name}`), runNpm); copiedBundles.push(`${bundle.prefix}/${name}`); }
    if (getR2Object(bucketName, `${bundle.prefix}/admin.js`, keyPath(uploads, `${bundle.prefix}/admin.js`), runNpm, { optional: true })) copiedBundles.push(`${bundle.prefix}/admin.js`);
  }
  if (bundles.length) console.log(`[db:local-copy] Copied the code of ${bundles.length} sandboxed plugin(s): ${bundles.map(item => `${item.pluginId}@${item.version}`).join(', ')}.`);

  const record = { formatVersion: 1, preparedAt: new Date().toISOString(), export: path.resolve(from), ...loaded, media: { copied: mediaResult.copied, failed: mediaResult.failed, from: mediaResult.from }, pluginBundles: copiedBundles };
  fs.writeFileSync(path.join(target, RECORD_FILE), JSON.stringify(record, null, 2) + '\n', 'utf8');
  const commands = serveCommands(target);
  console.log(`[db:local-copy] Serve the copy (Astro runs one dev server per project: stop the running one first, or add --force to replace it; your ./data.db is not touched):
  PowerShell: ${commands.powershell}
  Bash:       ${commands.posix}
The copy keeps the live site's address in its settings, so \`emdash login\` against the local server prints the live site's device page: sign in through /_emdash/api/setup/dev-bypass and enter the code at the local /_emdash/admin/device (emdash-site-setup).`);
  return { file, uploads, record, commands };
}

if (isMain(import.meta.url)) {
  try {
    const args = argumentsOf(process.argv.slice(2), ['--from', '--to', '--origin', '--bucket'], ['--no-media', '--no-plugin-bundles']);
    await prepareLocalCopy({ from: args.from, to: args.to, origin: args.origin, bucket: args.bucket, media: !args['no-media'], pluginBundles: !args['no-plugin-bundles'] });
  } catch (err) {
    console.error(`[db:local-copy] Error: ${err.message}`);
    process.exitCode = 1;
  }
}
