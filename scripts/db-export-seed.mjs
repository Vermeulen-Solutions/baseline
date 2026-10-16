import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { validateSeed } from 'emdash';
import { argumentsOf, bytesOf, jsonOf, requireFact, newDirectory, writeJSON, sha256, isMain, failure } from './infrastructure-io.mjs';
const cli = fileURLToPath(new URL('../node_modules/emdash/dist/cli/index.mjs', import.meta.url));
export function projectSeed(seed, policy) {
  requireFact(policy?.policyVersion === 1 && policy.collections && typeof policy.collections === 'object' && !Array.isArray(policy.collections) && Object.keys(policy.collections).length > 0, 'Explicit collection/field allowlist required');
  const result = { $schema: 'https://emdashcms.com/seed.schema.json', version: '1', meta: { name: 'Reviewed bootstrap candidate' }, ...(seed.defaultLocale ? { defaultLocale: seed.defaultLocale } : {}), collections: [], content: {} };
  for (const [slug, selection] of Object.entries(policy.collections)) {
    requireFact(/^[a-z][a-z0-9_]{0,62}$/.test(slug) && selection && Array.isArray(selection.fields) && selection.fields.every(field => typeof field === 'string') && new Set(selection.fields).size === selection.fields.length && (selection.content === undefined || typeof selection.content === 'boolean'), 'Malformed export allowlist');
    const collection = seed.collections?.find(collection => collection.slug === slug); requireFact(collection, 'Allowlisted collection unavailable');
    const fields = selection.fields.map(name => { const field = collection.fields.find(field => field.slug === name); requireFact(field && !['blocks', 'block'].includes(field.type), 'Allowlisted field absent or requires a block-type adapter'); return structuredClone(field); });
    result.collections.push({ slug, label: collection.label, ...(collection.labelSingular ? { labelSingular: collection.labelSingular } : {}), ...(collection.supports ? { supports: collection.supports } : {}), ...(collection.routable !== undefined ? { routable: collection.routable } : {}), ...(collection.urlPattern ? { urlPattern: collection.urlPattern } : {}), fields });
    if (selection.content === true) result.content[slug] = (seed.content?.[slug] ?? []).map(entry => ({ id: entry.id, ...(Object.hasOwn(entry, 'slug') ? { slug: entry.slug } : {}), ...(entry.status ? { status: entry.status } : {}), ...(entry.locale ? { locale: entry.locale } : {}), ...(entry.translationOf ? { translationOf: entry.translationOf } : {}), data: Object.fromEntries(selection.fields.filter(field => Object.hasOwn(entry.data, field)).map(field => [field, structuredClone(entry.data[field])])) }));
  }
  // Relations need full schema ownership review; never silently strip their binding or include an unselected collection.
  requireFact(!result.collections.some(collection => collection.fields.some(field => field.type === 'reference' && field.validation?.relation)), 'Relation-backed fields require a reviewed portable relation adapter');
  const ids = new Set(Object.values(result.content).flat().map(entry => entry.id)), warnings = new Set();
  function inspect(value, depth = 0) {
    requireFact(depth <= 50, 'Export nesting bound exceeded');
    if (typeof value === 'string' && value.startsWith('$ref:')) requireFact(ids.has(value.slice(5)), 'Selected content references excluded/unavailable content');
    if (!value || typeof value !== 'object') return;
    if (value.$media) warnings.add('media-url-and-bytes-portability-unverified');
    if ((value._type === 'image' || value.provider) && (value.id || value.asset)) warnings.add('opaque-media-or-portable-text-identity-needs-reviewed-mapping');
    for (const child of Object.values(value)) inspect(child, depth + 1);
  }
  inspect(result.content);
  requireFact(validateSeed(result).valid, 'Projected candidate fails installed EmDash seed validation');
  return { seed: result, warnings: [...warnings].sort(), excludedScopes: ['settings', 'menus', 'bylines', 'taxonomies', 'widgets', 'sections', 'redirects', 'unselected collections/fields', 'users/sessions/credentials'] };
}
export function exportSeedCandidate(options) {
  requireFact(JSON.parse(fs.readFileSync(new URL('../node_modules/emdash/package.json', import.meta.url))).version === '1.3.0', 'Installed exporter differs from reviewed adapter');
  requireFact(options.database && options.policy && options.out, 'Explicit closed database, allowlist policy and new staging output required');
  const source = bytesOf(options.database); requireFact(!['-wal', '-shm', '-journal'].some(suffix => fs.existsSync(options.database + suffix)), 'Use a closed consistent offline database');
  const policy = jsonOf(options.policy);
  const selected = Object.entries(policy.collections ?? {}).filter(([, selection]) => selection.content === true).map(([slug]) => slug);
  requireFact(selected.every(slug => /^[a-z][a-z0-9_]{0,62}$/.test(slug)), 'Invalid collection allowlist');
  const stage = newDirectory(options.out, { ignoredRoot: path.resolve('.emdash/backups') });
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-seed-export-'));
  try {
    const database = path.join(scratch, 'source.sqlite'); fs.writeFileSync(database, source, { mode: 0o600 });
    const help = execFileSync(process.execPath, [cli, 'export-seed', '--help'], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }); requireFact(help.includes('--database') && help.includes('--with-content'), 'Installed exporter contract unavailable');
    const args = [cli, 'export-seed', '--database', database, '--cwd', scratch, ...(selected.length ? ['--with-content', selected.join(',')] : []), ...(options['media-base-url'] ? ['--media-base-url', options['media-base-url']] : [])];
    const raw = execFileSync(process.execPath, args, { cwd: scratch, encoding: 'utf8', timeout: 60000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    const projected = projectSeed(JSON.parse(raw), policy);
    writeJSON(path.join(stage, 'candidate.json'), projected.seed);
    const receipt = { receiptVersion: 1, status: projected.warnings.length ? 'candidate-with-portability-warnings' : 'candidate-created', exitCode: projected.warnings.length ? 2 : 0, emdash: '1.3.0', sourceSHA256: sha256(source), policySHA256: sha256(bytesOf(options.policy)), candidateSHA256: sha256(bytesOf(path.join(stage, 'candidate.json'))), warnings: projected.warnings, excludedScopes: projected.excludedScopes, note: 'Bootstrap candidate, not a backup, production migration or content/media parity certificate; seed/seed.json never overwritten' };
    requireFact(sha256(bytesOf(options.database)) === sha256(source), 'Source changed during export; candidate not verified');
    writeJSON(path.join(stage, 'receipt.json'), receipt); return receipt;
  } finally { requireFact(path.dirname(scratch) === path.resolve(os.tmpdir()) && path.basename(scratch).startsWith('baseline-seed-export-'), 'Unsafe cleanup'); fs.rmSync(scratch, { recursive: true, force: true }); }
}
if (isMain(import.meta.url)) {
  try { const result = exportSeedCandidate(argumentsOf(process.argv.slice(2), ['--database', '--policy', '--out', '--media-base-url'])); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.exitCode; }
  catch (error) { failure(error); }
}
