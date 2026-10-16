import fs from 'node:fs';
import path from 'node:path';
import { AwsClient } from 'aws4fetch';
import { within } from './audit-evidence.mjs';
import { inventoryFiles, safeKey, mimeForKey } from './media-files.mjs';
import { argumentsOf, resolveCloudflare, requireFact, bytesOf, jsonOf, noLinks, atomicJSON, sha256, boundedBody, isMain, failure } from './infrastructure-io.mjs';

export function r2Transport(target, { accessKeyId = process.env.R2_ACCESS_KEY_ID, secretAccessKey = process.env.R2_SECRET_ACCESS_KEY, request = fetch } = {}) {
  requireFact(accessKeyId && secretAccessKey, 'Explicit R2 S3 credentials unavailable');
  const signer = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto', retries: 0 });
  return async (method, key, body, headers = {}) => {
    requireFact(safeKey(key), 'Unsafe storage key');
    const url = `https://${target.account}.r2.cloudflarestorage.com/${target.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const signed = await signer.sign(url, { method, headers, ...(body ? { body } : {}), redirect: 'error', signal: AbortSignal.timeout(30000), aws: { allHeaders: true } });
      const response = await request(signed);
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) return response;
      await response.body?.cancel(); await new Promise(resolve => setTimeout(resolve, 200 * 2 ** attempt));
    }
  };
}
export async function syncR2({ source, target, apply = false, journal, transport, manifest, cacheControl = 'public, max-age=31536000, immutable' }) {
  requireFact(target?.kind === 'r2' && /^[a-f0-9]{32}$/.test(target.account) && target.bucket && target.environment, 'Explicit R2 target required');
  requireFact(typeof cacheControl === 'string' && cacheControl.length < 200 && !/[\r\n]/.test(cacheControl), 'Invalid cache profile');
  const files = inventoryFiles(source).map(file => ({ ...file, mimeType: mimeForKey(file.key) }));
  if (manifest) {
    requireFact(manifest.stagingVersion === 1 && Array.isArray(manifest.mappings), 'Unsupported staging manifest');
    requireFact(manifest.mappings.every(mapping => files.some(file => file.key === mapping.storageKey && file.sha256 === mapping.sha256)), 'Manifest has missing/different staged objects');
    for (const file of files) {
      const mappings = manifest.mappings.filter(mapping => mapping.storageKey === file.key);
      requireFact(mappings.length > 0 && mappings.every(mapping => mapping.sha256 === file.sha256 && mapping.mimeType === mappings[0].mimeType) && /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(mappings[0].mimeType), 'Staged key/hash/MIME mismatch'); file.mimeType = mappings[0].mimeType;
    }
  }
  const report = { reportVersion: 1, target, profile: { cacheControl }, status: apply ? 'verified' : 'planned', exitCode: 0, files: [], note: 'Actual relative storage keys; no CMS registration or deployment; cache never substitutes for a fresh remote hash/metadata read' };
  if (!apply) { report.files = files.map(file => ({ ...file, status: 'planned' })); return report; }
  requireFact(files.length > 0, 'No staged objects; remote verification was not performed');
  requireFact(journal && transport, 'Apply requires explicit private journal and transport');
  const file = noLinks(journal), parent = path.resolve('.emdash/backups');
  requireFact(within(parent, file) && file !== parent && !path.basename(file).includes('data.db'), 'R2 journal must be inside ignored .emdash/backups');
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const lock = fs.openSync(file + '.lock', 'wx');
  try {
    const cache = fs.existsSync(file) ? jsonOf(file) : { journalVersion: 1, entries: {} };
    requireFact(cache.journalVersion === 1 && cache.entries && typeof cache.entries === 'object' && !Array.isArray(cache.entries), 'Invalid journal; preserve it for review');
    const identity = sha256(JSON.stringify({ account: target.account, environment: target.environment, bucket: target.bucket }));
    async function inspect(key, expected) {
      const response = await transport('GET', key);
      if (response.status === 404) { await response.body?.cancel(); return 'missing'; }
      const bytes = await boundedBody(response);
      return sha256(bytes) === expected.sha256 && response.headers.get('content-type')?.split(';')[0] === expected.mimeType && response.headers.get('cache-control') === cacheControl ? 'verified' : 'conflict';
    }
    for (const entry of files) {
      const cacheKey = sha256(JSON.stringify([identity, entry.key, entry.sha256, entry.mimeType, cacheControl]));
      let created = false;
      try {
        const bytes = bytesOf(path.join(source, entry.key)); requireFact(sha256(bytes) === entry.sha256, 'Source changed after inventory');
        let state = await inspect(entry.key, entry);
        requireFact(state !== 'conflict', 'Existing object differs; overwrite refused');
        if (state === 'missing') {
          cache.entries[cacheKey] = { targetSHA256: identity, key: entry.key, sha256: entry.sha256, status: 'prepared' }; atomicJSON(file, cache);
          const response = await transport('PUT', entry.key, bytes, { 'If-None-Match': '*', 'Content-Type': entry.mimeType, 'Cache-Control': cacheControl, 'x-amz-meta-sha256': entry.sha256 });
          requireFact(response.ok || response.status === 412, 'Required upload failed'); created = response.ok; await response.body?.cancel();
          state = await inspect(entry.key, entry); requireFact(state === 'verified', 'Remote hash/metadata verification failed after upload');
        }
        cache.entries[cacheKey] = { targetSHA256: identity, key: entry.key, sha256: entry.sha256, status: 'verified', createdThisRun: created }; atomicJSON(file, cache);
        report.files.push({ ...entry, status: 'verified', createdThisRun: created });
      } catch {
        cache.entries[cacheKey] = { targetSHA256: identity, key: entry.key, sha256: entry.sha256, status: 'failed-or-unverified' }; atomicJSON(file, cache);
        report.files.push({ ...entry, status: 'failed-or-unverified' }); report.status = 'failed'; report.exitCode = 1;
      }
    }
    return report;
  } finally { fs.closeSync(lock); fs.unlinkSync(file + '.lock'); }
}
if (isMain(import.meta.url)) {
  try {
    const options = argumentsOf(process.argv.slice(2), ['--config', '--env', '--account', '--bucket', '--uploads', '--journal', '--manifest'], ['--apply', '--dry-run']);
    requireFact(!(options.apply && options['dry-run']), 'Choose plan or apply');
    const target = resolveCloudflare(options, 'r2');
    console.error(JSON.stringify({ operation: options.apply ? 'create-only R2 apply' : 'offline R2 plan', target }));
    requireFact(options.uploads, 'Explicit uploads/staging source required');
    const report = await syncR2({ source: options.uploads, target, apply: options.apply, journal: options.journal, ...(options.manifest ? { manifest: jsonOf(options.manifest) } : {}), ...(options.apply ? { transport: r2Transport(target) } : {}) });
    console.log(JSON.stringify(report, null, 2)); process.exitCode = report.exitCode;
  } catch (error) { failure(error); }
}
