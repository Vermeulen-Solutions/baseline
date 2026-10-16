import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parse as jsonc, parseTree } from 'jsonc-parser';
import { parse as toml } from 'smol-toml';
import { sha256, within } from './audit-evidence.mjs';
export { sha256 };
export class ToolError extends Error {}
export const requireFact = (condition, message) => { if (!condition) throw new ToolError(message); };
export function argumentsOf(values, flags = [], booleans = []) {
  const result = {};
  for (let i = 0; i < values.length; i++) {
    const [flag, ...tail] = values[i].split('=');
    requireFact(flags.includes(flag) || booleans.includes(flag), 'Unknown argument');
    requireFact(!Object.hasOwn(result, flag.slice(2)), 'Duplicate argument');
    if (booleans.includes(flag)) { requireFact(!tail.length, 'Boolean flag has a value'); result[flag.slice(2)] = true; }
    else { const value = tail.length ? tail.join('=') : values[++i]; requireFact(value && !value.startsWith('--'), 'Missing argument value'); result[flag.slice(2)] = value; }
  }
  return result;
}
export function noLinks(file) {
  const absolute = path.resolve(file), parsed = path.parse(absolute); let current = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (fs.existsSync(current)) requireFact(!fs.lstatSync(current).isSymbolicLink(), 'Linked paths are refused');
    else { try { fs.lstatSync(current); throw new ToolError('Dangling link refused'); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  }
  return absolute;
}
export function bytesOf(file, max = 64 * 1024 * 1024) {
  const absolute = noLinks(file), stat = fs.statSync(absolute);
  requireFact(stat.isFile() && stat.size <= max, 'Input is not a bounded regular file');
  return fs.readFileSync(absolute);
}
export const jsonOf = file => JSON.parse(bytesOf(file, 8 * 1024 * 1024).toString('utf8'));
export function newDirectory(directory, { ignoredRoot } = {}) {
  requireFact(directory, 'An explicit new output directory is required');
  const out = noLinks(directory);
  requireFact(!fs.existsSync(out), 'Output already exists; choose a new destination');
  if (ignoredRoot) requireFact(within(noLinks(ignoredRoot), out) && out !== path.resolve(ignoredRoot), 'Snapshot/staging output must be inside the designated ignored directory');
  fs.mkdirSync(out, { recursive: true, mode: 0o700 }); return out;
}
export function writeJSON(file, value, exclusive = true) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: exclusive ? 'wx' : 'w', mode: 0o600 }); }
export function atomicJSON(file, value) {
  noLinks(file); const temp = file + '.' + randomUUID();
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  try { fs.renameSync(temp, file); } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
export function resolveCloudflare({ config, env, account, database, bucket }, kind) {
  requireFact(config && env && account && (kind === 'd1' ? database : bucket), 'Explicit config, environment, account and database/bucket required');
  requireFact(/^[a-f0-9]{32}$/.test(account), 'Invalid explicit account');
  const bytes = bytesOf(config, 1024 * 1024), extension = path.extname(config).toLowerCase(); let parsed;
  if (extension === '.toml') parsed = toml(bytes.toString('utf8'));
  else {
    requireFact(['.json', '.jsonc'].includes(extension), 'Use JSONC, JSON or TOML config'); const errors = [], source = bytes.toString('utf8');
    parsed = jsonc(source, errors, { allowTrailingComma: true }); requireFact(!errors.length, 'Malformed Cloudflare config');
    function unique(node) { if (!node) return; if (node.type === 'object') { const keys = node.children.map(property => property.children[0].value); requireFact(new Set(keys).size === keys.length, 'Duplicate config keys are ambiguous'); } for (const child of node.children ?? []) unique(child); }
    unique(parseTree(source));
  }
  const selected = env === 'top-level' ? parsed : parsed.env?.[env];
  requireFact(selected && (selected.account_id ?? parsed.account_id) === account, 'Environment/account mismatch');
  const bindings = selected[kind === 'd1' ? 'd1_databases' : 'r2_buckets'];
  requireFact(Array.isArray(bindings), 'No bindings in the explicit environment; no inheritance or first-binding fallback');
  const matches = bindings.filter(binding => kind === 'd1' ? binding.database_id === database : binding.bucket_name === bucket);
  requireFact(matches.length === 1 && matches[0].binding && !matches[0].preview_database_id && !matches[0].preview_bucket_name, 'Missing, ambiguous or preview binding');
  if (kind === 'r2') requireFact(!matches[0].jurisdiction || matches[0].jurisdiction === 'default', 'R2 jurisdiction requires a separately reviewed endpoint adapter');
  if (kind === 'd1') requireFact(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(database), 'Invalid explicit database UUID');
  else requireFact(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket), 'Invalid explicit bucket');
  return { kind, account, environment: env, binding: matches[0].binding, ...(kind === 'd1' ? { database } : { bucket }), configSHA256: sha256(bytes) };
}
export async function boundedBody(response, limit = 64 * 1024 * 1024) {
  requireFact(response.ok, 'Remote request unavailable or unauthorized');
  let size = 0; const chunks = [];
  for await (const chunk of response.body) { size += chunk.length; requireFact(size <= limit, 'Remote payload exceeds bound'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
export function isMain(meta) { return process.argv[1] && meta === pathToFileURL(process.argv[1]).href; }
export function failure(error) { console.error(JSON.stringify({ status: 'unverified', error: error instanceof ToolError ? error.message : 'Required evidence unavailable, invalid or unsupported; private details withheld' })); process.exitCode = 2; }
