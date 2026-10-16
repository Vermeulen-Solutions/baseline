import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const normalizedHash = bytes => {
  if (bytes.includes(0)) return sha256(bytes);
  try { return sha256(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes).replaceAll('\r\n', '\n')); }
  catch { return sha256(bytes); }
};
export const within = (parent, child) => { const relative = path.relative(parent, child); return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); };
export function safeRelative(relative) { return typeof relative === 'string' && !path.isAbsolute(relative) && !relative.includes('\\') && !relative.includes(':') && relative.split('/').every(part => part && part !== '.' && part !== '..'); }
export function readTarget(root, relative) {
  if (!safeRelative(relative)) return { status: 'unverified', reason: 'Unsafe evidence path' };
  let current = root;
  try {
    for (const segment of relative.split('/')) { current = path.join(current, segment); if (fs.lstatSync(current).isSymbolicLink()) return { status: 'unverified', reason: 'Symlinked evidence refused' }; }
    const stat = fs.statSync(current);
    if (!stat.isFile() || stat.size > 8 * 1024 * 1024) return { status: 'unverified', reason: 'Not a bounded regular file' };
    return { status: 'observed', bytes: fs.readFileSync(current) };
  } catch { return { status: 'unverified', reason: 'Evidence unavailable' }; }
}
export function readJSON(root, relative) {
  const result = readTarget(root, relative);
  if (!result.bytes) return result;
  try { return { ...result, data: JSON.parse(result.bytes.toString('utf8')) }; }
  catch { return { status: 'unverified', reason: 'Invalid JSON evidence' }; }
}
export function gitRead(root, ...args) {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
  for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES']) delete env[name];
  return execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', ...args], { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000, maxBuffer: 4 * 1024 * 1024 }).trim();
}
export function canonicalOutput(file) {
  const tail = []; let current = path.resolve(file);
  while (!fs.existsSync(current)) { tail.unshift(path.basename(current)); current = path.dirname(current); }
  return path.join(fs.realpathSync(current), ...tail);
}
