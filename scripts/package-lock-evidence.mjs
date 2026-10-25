import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseDocument } from 'yaml';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const localSource = value => typeof value === 'string' && /^(?:file|link|workspace):/i.test(value);
const versionOf = value => {
  if (typeof value !== 'string') return null;
  if (localSource(value)) return value;
  const match = value.match(/^(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
  return match?.[1] ?? null;
};

function readFile(root, name) {
  const file = path.join(root, name);
  try {
    if (fs.lstatSync(file).isSymbolicLink()) return { status: 'unverified', reason: 'Linked lockfile refused' };
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > 8 * 1024 * 1024) return { status: 'unverified', reason: 'Lockfile is not a bounded regular file' };
    return { status: 'observed', bytes: fs.readFileSync(file) };
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'missing' };
    return { status: 'unverified', reason: 'Lockfile unavailable' };
  }
}

function parsePnpm(bytes) {
  let data;
  try {
    const document = parseDocument(bytes.toString('utf8'), { uniqueKeys: true, maxAliasCount: 0 });
    if (document.errors.length) return { status: 'unverified', reason: 'Invalid pnpm lockfile' };
    data = document.toJS();
  } catch { return { status: 'unverified', reason: 'Invalid pnpm lockfile' }; }
  if (!object(data) || !/^\d+(?:\.\d+)?$/.test(String(data.lockfileVersion ?? ''))) return { status: 'unverified', reason: 'Unsupported pnpm lockfile format' };
  const importer = object(data.importers?.['.']) ? data.importers['.'] : object(data.dependencies) ? data : null;
  if (!importer) return { status: 'unverified', reason: 'Root pnpm importer unavailable' };
  const entries = new Map();
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    if (!object(importer[section])) continue;
    for (const [name, item] of Object.entries(importer[section])) {
      const raw = typeof item === 'string' ? item : item?.version;
      entries.set(name, { raw: typeof raw === 'string' ? raw : null, version: versionOf(raw), source: localSource(raw) || localSource(item?.specifier) ? 'local' : 'registry' });
    }
  }
  return { status: 'observed', manager: 'pnpm', lockfile: 'pnpm-lock.yaml', entries, formatVersion: String(data.lockfileVersion) };
}

function parseNpm(bytes) {
  let data;
  try { data = JSON.parse(bytes.toString('utf8')); } catch { return { status: 'unverified', reason: 'Invalid npm lockfile' }; }
  if (!object(data) || !object(data.packages) || !object(data.packages[''])) return { status: 'unverified', reason: 'Unsupported npm lockfile format' };
  const entries = new Map();
  for (const name of new Set(['dependencies', 'devDependencies', 'optionalDependencies'].flatMap(section => Object.keys(data.packages[''][section] ?? {})))) {
    const item = data.packages[`node_modules/${name}`];
    const raw = item?.version;
    entries.set(name, { raw: typeof raw === 'string' ? raw : null, version: versionOf(raw), source: item?.link === true || localSource(item?.resolved) ? 'local' : 'registry' });
  }
  return { status: 'observed', manager: 'npm', lockfile: 'package-lock.json', entries, formatVersion: data.lockfileVersion ?? null };
}

/** Read-only, bounded package inventory for npm and pnpm roots. */
export function packageLockEvidence(root, declaredManager) {
  const npm = readFile(root, 'package-lock.json');
  const pnpm = readFile(root, 'pnpm-lock.yaml');
  const hasDeclaration = declaredManager !== undefined && declaredManager !== null;
  const declared = typeof declaredManager === 'string' ? declaredManager.match(/^(npm|pnpm)@/)?.[1] : null;
  if (hasDeclaration && !declared) return { status: 'unverified', reason: 'Unsupported packageManager declaration; this inventory supports npm and pnpm', manager: null, lockfile: null, entries: new Map() };
  let selected;
  if (npm.status !== 'missing' && pnpm.status !== 'missing') {
    if (!declared) return { status: 'unverified', reason: 'Multiple lockfiles need a packageManager declaration', manager: null, lockfile: null, entries: new Map() };
    selected = declared === 'npm' ? npm : pnpm;
  } else selected = npm.status !== 'missing' ? npm : pnpm;
  if (selected.status === 'observed') {
    if (declared && declared !== (selected === npm ? 'npm' : 'pnpm')) return { status: 'unverified', reason: 'packageManager declaration conflicts with the lockfile', manager: null, lockfile: null, entries: new Map() };
    const parsed = selected === npm ? parseNpm(selected.bytes) : parsePnpm(selected.bytes);
    const alternate = selected === npm ? pnpm : npm;
    return { ...parsed, sha256: createHash('sha256').update(selected.bytes).digest('hex'), alternateLockfile: npm.status !== 'missing' && pnpm.status !== 'missing', alternateLockfileSHA256: alternate.status === 'observed' ? createHash('sha256').update(alternate.bytes).digest('hex') : null };
  }
  const error = [selected, npm, pnpm].find(value => value.status === 'unverified');
  return { status: 'unverified', reason: error?.reason ?? 'No supported package lockfile found', manager: null, lockfile: null, entries: new Map() };
}
