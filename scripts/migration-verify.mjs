import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseTree } from 'jsonc-parser';
import { argumentsOf, bytesOf, newDirectory, isMain } from './migration-local.mjs';
import { backupRoot } from './wordpress-io.mjs';
import { sha256, validateManifest, validateObservations } from '../standards/schemas/migration-acceptance.mjs';
import { isArtifact } from '../standards/schemas/migration-acceptance.mjs';
import { readContentInventory, reconcileContent, contentEvidence } from './migration-content.mjs';
import { migrationReport, migrationMarkdown } from './migration-report.mjs';
import { collectMigrationHTTP } from './migration-http.mjs';

export const HELP = `Usage: npm run migration:verify -- --manifest <file> [options]

  --manifest <file>       Required version-1, version-2 or version-3 manifest (strict JSON)
  --observations <file>   Replay local evidence offline; omit to collect live HTTP
  --scope url|full       Default: full. URL-only never certifies content/editor parity
  --format json|markdown|both  Default: both. Files in --out; stdout JSON unless markdown
  --out <new-directory>  Default: .emdash/migration-acceptance/<unique-run-id>/
                        Static profiles use .baseline/backups/migration-acceptance/.
  --help                 Show usage; cannot be combined with other flags

HTTP collection is anonymous, bounded and limited to manifest-declared origins.
Version 3 reconciles hash-bound offline inventories in full scope.
No credentialed CMS reads or editor actions. Missing required evidence returns 2.
Exits: 0 required checks pass; 1 required failures;
2 invalid input or required unknowns (takes precedence over failures).
No --target override or --strict switch: origins and requirements live in the manifest.
`;

export function parseMigrationArgs(argv) {
  if (argv.length === 1 && argv[0] === '--help') return { help: true };
  const options = argumentsOf(argv, ['--manifest', '--observations', '--scope', '--format', '--out']);
  if (!options.manifest || !['url', 'full'].includes(options.scope ?? 'full') || !['json', 'markdown', 'both'].includes(options.format ?? 'both')) throw Error('Use --help for the required manifest, scope and output options');
  return { ...options, scope: options.scope ?? 'full', format: options.format ?? 'both' };
}

export function readContractJSON(file) {
  return parseContractBytes(bytesOf(file, 4 * 1024 * 1024));
}

function parseContractBytes(bytes) {
  const source = bytes.toString('utf8');
  if (!Buffer.from(source, 'utf8').equals(bytes)) throw Error('Invalid UTF-8 input');
  const errors = [], tree = parseTree(source, errors, { disallowComments: true, allowTrailingComma: false });
  if (errors.length || !tree) throw Error('Strict JSON required');
  function visit(node, depth = 0) {
    if (depth > 30) throw Error('JSON exceeds depth bound');
    if (node.type === 'object') {
      const keys = node.children.map(property => property.children[0].value);
      if (new Set(keys).size !== keys.length) throw Error('Duplicate JSON object keys');
    }
    for (const child of node.children ?? []) visit(child, depth + 1);
  }
  visit(tree);
  return JSON.parse(source);
}

export function localEvidenceVerifier(directory) {
  const cache = new Map(); let total = 0;
  return artifact => {
    const key = JSON.stringify(artifact);
    if (cache.has(key)) return cache.get(key);
    const file = path.resolve(directory, artifact.path), relative = path.relative(path.resolve(directory), file);
    let valid = false;
    try {
      if (!relative || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw Error();
      const remaining = 64 * 1024 * 1024 - total;
      if (remaining <= 0) throw Error();
      const bytes = bytesOf(file, Math.min(8 * 1024 * 1024, remaining)); total += bytes.length;
      valid = sha256(bytes) === artifact.sha256;
    } catch { valid = false; }
    cache.set(key, valid); return valid;
  };
}

export async function runMigration(options, { signal } = {}) {
  const manifest = readContractJSON(options.manifest);
  const errors = validateManifest(manifest);
  if (errors.length) throw Error('Manifest invalid: ' + errors.join('; '));
  let observations = options.observations ? readContractJSON(options.observations) : null;
  if (observations && validateObservations(observations, manifest).length) throw Error('Observations invalid or not bound to this manifest/capture/revision');
  const generatedAt = new Date().toISOString(), runId = 'run-' + randomUUID();
  // Reserve a new output before making any request; an existing --out never crawls.
  const backups = backupRoot(process.cwd()), state = path.dirname(backups);
  const resultRoot = path.basename(state) === '.baseline' ? backups : state;
  const out = newDirectory(options.out ?? path.join(resultRoot, 'migration-acceptance', runId));
  if (!observations) observations = await collectMigrationHTTP(manifest, { directory: out, signal });
  let verifyArtifact = localEvidenceVerifier(options.observations ? path.dirname(path.resolve(options.observations)) : out);
  if (manifest.manifestVersion === 3 && options.scope === 'full') {
    // Replay proofs are staged locally so the combined observations remain replayable.
    if (options.observations) {
      const staged = new Set();
      for (const check of observations.checks) for (const ref of check.evidence) {
        if (verifyArtifact(ref) && !staged.has(ref.path)) {
          const destination = path.join(out, 'replay', ref.path);
          fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
          fs.writeFileSync(destination, bytesOf(path.resolve(path.dirname(options.observations), ref.path), 8 * 1024 * 1024), { flag: 'wx', mode: 0o600 }); staged.add(ref.path);
        }
      }
      observations = structuredClone(observations);
      for (const check of observations.checks) check.evidence = check.evidence.map(ref => ({ ...ref, path: 'replay/' + ref.path }));
    }
    const inputs = {}; let unavailable = signal?.aborted ?? false;
    for (const key of ['source', 'target', 'mapping']) {
      try {
        const ref = manifest.inventories[key];
        if (!isArtifact({ path: ref.reference, sha256: ref.sha256 })) throw Error();
        const file = path.resolve(path.dirname(options.manifest), ref.reference);
        const bytes = bytesOf(file, 4 * 1024 * 1024);
        if (sha256(bytes) !== ref.sha256) throw Error();
        const value = parseContractBytes(bytes);
        inputs[key] = key === 'mapping' ? value : readContentInventory(value, key);
      } catch { unavailable = true; }
    }
    const result = reconcileContent(inputs.source, inputs.target, inputs.mapping, manifest, { unavailable });
    const artifact = contentEvidence(result), ref = { path: 'content-evidence/reconciliation.json', sha256: artifact.sha256 };
    fs.mkdirSync(path.join(out, 'content-evidence'), { mode: 0o700 });
    fs.writeFileSync(path.join(out, ref.path), artifact.bytes, { flag: 'wx', mode: 0o600 });
    const contentIds = new Set(result.checks.map(c => c.id));
    observations = { ...observations, content: result.summary, checks: [...observations.checks.filter(c => !contentIds.has(c.id)), ...result.checks.map(c => ({ ...c, evidence: [ref] }))] };
    if (validateObservations(observations, manifest).length) throw Error('Generated content observations violate the contract');
    const combined = JSON.stringify(observations) + '\n';
    if (Buffer.byteLength(combined) > 4 * 1024 * 1024) throw Error('Combined observations exceed the replay byte bound; no acceptance established');
    fs.writeFileSync(path.join(out, 'observations.json'), combined, { flag: options.observations ? 'wx' : 'w', mode: 0o600 });
    verifyArtifact = localEvidenceVerifier(out);
  }
  const report = migrationReport(manifest, observations, {
    scope: options.scope, runId, generatedAt,
    collected: !options.observations,
    verifyArtifact,
  });
  const json = JSON.stringify(report, null, 2) + '\n', markdown = migrationMarkdown(report);
  if (options.format !== 'markdown') fs.writeFileSync(path.join(out, 'report.json'), json, { flag: 'wx', mode: 0o600 });
  if (options.format !== 'json') fs.writeFileSync(path.join(out, 'report.md'), markdown, { flag: 'wx', mode: 0o600 });
  return { report, out, stdout: options.format === 'markdown' ? markdown : json };
}

if (isMain(import.meta.url)) {
  const controller = new AbortController(), interrupt = () => controller.abort();
  process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
  try {
    const options = parseMigrationArgs(process.argv.slice(2));
    if (options.help) process.stdout.write(HELP);
    else {
      const { report, out, stdout } = await runMigration(options, { signal: controller.signal });
      process.stdout.write(stdout); console.error(`Report directory: ${out}`); process.exitCode = report.exitCode;
    }
  } catch (error) {
    // Filesystem/API errors may contain private paths; don't print those diagnostics.
    console.error(error.code ? 'Migration input/output unavailable; no acceptance established.' : error.message);
    process.exitCode = 2;
  } finally { process.off('SIGINT', interrupt); process.off('SIGTERM', interrupt); }
}
