import fs from 'node:fs';
import path from 'node:path';
import { within } from './audit-evidence.mjs';
import { safeKey } from './media-files.mjs';
import { requireFact, bytesOf, noLinks, jsonOf, newDirectory, writeJSON, atomicJSON, sha256, boundedBody } from './infrastructure-io.mjs';

export function localEmdashAdapter({ url, token, devBypass = false, request = fetch }) {
  const base = new URL(url);
  requireFact(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) && base.pathname === '/' && !base.search && !base.hash && !base.username && !base.password, 'Apply-local requires an explicit loopback HTTP origin');
  requireFact(token || devBypass, 'Explicit EmDash token or local test bypass required');
  let cookie, authentication;
  async function auth() {
    if (!devBypass || token) return;
    if (!authentication) authentication = (async () => {
      const response = await request(base.origin + '/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin', { redirect: 'manual', signal: AbortSignal.timeout(10000) });
      requireFact([200, 302, 303].includes(response.status), 'Local dev authentication unavailable');
      cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
      requireFact(cookie, 'Local authentication did not return a session cookie'); await response.body?.cancel();
    })();
    await authentication;
  }
  async function call(route, options = {}) {
    await auth();
    return request(base.origin + route, { ...options, redirect: 'error', signal: AbortSignal.timeout(30000), headers: { 'X-EmDash-Request': '1', Origin: base.origin, ...(token ? { Authorization: 'Bearer ' + token } : { Cookie: cookie }), ...options.headers } });
  }
  async function item(response) { const value = JSON.parse((await boundedBody(response, 1024 * 1024)).toString('utf8')); requireFact(value.success === true && value.data?.item, 'Unsupported EmDash media response'); return value.data.item; }
  return {
    identity: { adapter: 'emdash-1.3.0/rest-media-v1', origin: base.origin },
    get: async id => item(await call('/_emdash/api/media/' + encodeURIComponent(id))),
    bytes: async key => { requireFact(safeKey(key), 'Unsafe returned CMS storage key'); return boundedBody(await call('/_emdash/api/media/file/' + key.split('/').map(encodeURIComponent).join('/')), 32 * 1024 * 1024); },
    upload: async (bytes, entry) => {
      const form = new FormData();
      form.append('file', new Blob([bytes], { type: entry.output.mimeType }), entry.entryId + '.' + entry.probe.extension);
      form.append('deduplicate', 'false'); form.append('ensureUniqueFilename', 'true');
      form.append('alt', entry.metadata.alt); form.append('caption', entry.metadata.caption);
      if (entry.output.width && entry.output.height) { form.append('width', String(entry.output.width)); form.append('height', String(entry.output.height)); }
      return item(await call('/_emdash/api/media', { method: 'POST', body: form }));
    },
  };
}
function loadPrepared(stage) {
  const directory = noLinks(stage);
  requireFact(within(path.resolve('.emdash/backups'), directory) && directory !== path.resolve('.emdash/backups'), 'Prepared stage must be in ignored .emdash/backups');
  const plan = jsonOf(path.join(directory, 'plan.json')), state = jsonOf(path.join(directory, 'prepared.json'));
  const { planId, ...payload } = plan;
  requireFact(plan.manifestVersion === 1 && planId === sha256(JSON.stringify(payload)) && state.preparedVersion === 1 && state.planId === planId && Array.isArray(state.entries) && state.entries.length === plan.entries.length && new Set(state.entries.map(entry => entry.entryId)).size === state.entries.length, 'Plan/prepared journal mismatch');
  for (const entry of state.entries) {
    const original = plan.entries.find(value => value.entryId === entry.entryId);
    requireFact(original && /^[a-f0-9]{64}$/.test(entry.entryId) && JSON.stringify(entry.metadata) === JSON.stringify(original.metadata) && entry.operation === original.operation && entry.source.sha256 === original.source.sha256 && /^[a-f0-9]{64}$/.test(entry.output.sha256) && entry.outputPath === `prepared/${entry.entryId}.${original.probe.extension ?? 'bin'}` && entry.archivePath === `originals/${original.source.sha256}` && safeKey(entry.outputPath) && safeKey(entry.archivePath), 'Unsafe or altered prepared entry');
    requireFact(sha256(bytesOf(path.join(directory, entry.outputPath), 32 * 1024 * 1024)) === entry.output.sha256 && sha256(bytesOf(path.join(directory, entry.archivePath), 32 * 1024 * 1024)) === entry.source.sha256, 'Prepared/original bytes changed');
  }
  return { directory, state };
}
async function verifyItem(adapter, entry, id) {
  const item = await adapter.get(id);
  requireFact(item.id === id && typeof item.storageKey === 'string' && safeKey(item.storageKey) && item.mimeType === entry.output.mimeType && (item.alt ?? '') === entry.metadata.alt && (item.caption ?? '') === entry.metadata.caption, 'Media identity/metadata mismatch; no inferred storage key');
  if (entry.output.width) requireFact(item.width === entry.output.width && item.height === entry.output.height, 'CMS native/oriented dimensions mismatch');
  const bytes = await adapter.bytes(item.storageKey);
  requireFact(sha256(bytes) === entry.output.sha256, 'Stored original differs from prepared upload');
  return { id, storageKey: item.storageKey, filename: item.filename, mimeType: item.mimeType, width: item.width ?? null, height: item.height ?? null, sha256: sha256(bytes) };
}
export async function ingestPrepared(stage, adapter, { adopt = {} } = {}) {
  const { directory, state } = loadPrepared(stage), file = path.join(directory, 'ingestion.json');
  requireFact(adapter?.identity?.adapter === 'emdash-1.3.0/rest-media-v1', 'Supported explicit EmDash target required');
  const lock = fs.openSync(path.join(directory, 'ingest.lock'), 'wx');
  try {
    const ledger = fs.existsSync(file) ? jsonOf(file) : { ingestionVersion: 1, planId: state.planId, target: adapter.identity, entries: {} };
    requireFact(ledger.ingestionVersion === 1 && ledger.planId === state.planId && JSON.stringify(ledger.target) === JSON.stringify(adapter.identity), 'Ingestion target/plan mismatch');
    let failed = 0;
    for (const entry of state.entries) {
      if (entry.operation === 'archive-only') continue;
      if (entry.operation !== 'ingest') { failed++; continue; }
      try {
        const before = ledger.entries[entry.entryId];
        if (before?.status === 'verified') { const value = await verifyItem(adapter, entry, before.media.id); requireFact(JSON.stringify(value) === JSON.stringify(before.media), 'Previously verified media changed'); continue; }
        if (before && before.status !== 'verified' && !Object.hasOwn(adopt, entry.entryId)) { failed++; continue; }
        let id = adopt[entry.entryId];
        if (id) requireFact(typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id), 'Invalid explicitly adopted media ID');
        else {
          ledger.entries[entry.entryId] = { status: 'uploading', sourceSHA256: entry.source.sha256, outputSHA256: entry.output.sha256 }; atomicJSON(file, ledger);
          const item = await adapter.upload(bytesOf(path.join(directory, entry.outputPath)), entry);
          requireFact(typeof item.id === 'string', 'Upload response lacks identity'); id = item.id;
          ledger.entries[entry.entryId] = { status: 'uploaded-needs-verification', id }; atomicJSON(file, ledger);
        }
        const media = await verifyItem(adapter, entry, id);
        ledger.entries[entry.entryId] = { status: 'verified', media, source: entry.source, attachmentId: entry.attachmentId, locale: entry.locale, metadata: entry.metadata }; atomicJSON(file, ledger);
      } catch {
        // A timeout may follow a successful POST. Never retry that POST automatically or delete a possible created/shared object.
        ledger.entries[entry.entryId] = { ...ledger.entries[entry.entryId], status: 'needs-reconciliation' }; atomicJSON(file, ledger); failed++;
      }
    }
    return { status: failed ? 'partial-or-unverified' : 'verified', exitCode: failed ? 1 : 0, planId: state.planId, target: adapter.identity, verified: Object.values(ledger.entries).filter(entry => entry.status === 'verified').length, failed, note: 'New Media Library entries only; credit/provenance/locale and aliases preserved in journal; content reference writes require a separate reviewed revision-bound operation' };
  } finally { fs.closeSync(lock); fs.unlinkSync(path.join(directory, 'ingest.lock')); }
}
export function stageR2Objects(stage, out) {
  const { directory, state } = loadPrepared(stage), ledger = jsonOf(path.join(directory, 'ingestion.json'));
  requireFact(ledger.ingestionVersion === 1 && ledger.planId === state.planId && state.entries.filter(entry => entry.operation === 'ingest').every(entry => ledger.entries[entry.entryId]?.status === 'verified') && !state.entries.some(entry => entry.operation === 'quarantine'), 'Complete verified ingestion required before R2 staging');
  const destination = newDirectory(out, { ignoredRoot: path.resolve('.emdash/backups') }), mappings = [], represented = new Map();
  for (const entry of state.entries.filter(entry => entry.operation === 'ingest')) {
    const record = ledger.entries[entry.entryId].media; requireFact(safeKey(record.storageKey) && record.sha256 === entry.output.sha256, 'Stored key/hash mismatch');
    const localKey = process.platform === 'win32' ? record.storageKey.toLowerCase() : record.storageKey;
    requireFact(!represented.has(localKey) || represented.get(localKey) === record.storageKey, 'Case-distinct storage keys cannot share this filesystem'); represented.set(localKey, record.storageKey);
    const bytes = bytesOf(path.join(directory, entry.outputPath)); const file = path.join(destination, 'objects', record.storageKey);
    requireFact(sha256(bytes) === record.sha256, 'Prepared bytes changed since ingestion');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file)) requireFact(sha256(bytesOf(file)) === record.sha256, 'Shared key has conflicting bytes');
    else fs.writeFileSync(file, bytes, { flag: 'wx', mode: 0o600 });
    mappings.push({ entryId: entry.entryId, mediaId: record.id, storageKey: record.storageKey, sha256: record.sha256, mimeType: record.mimeType, metadata: entry.metadata });
  }
  const receipt = { stagingVersion: 1, planId: state.planId, sourceTarget: ledger.target, mappings, note: 'Storage objects staged under actual returned CMS keys, never display filenames or proposed keys; no remote write, data transfer or reference rewrite' };
  writeJSON(path.join(destination, 'staging.json'), receipt); return { status: 'staged', objects: mappings.length, planId: state.planId };
}
/** Produce canonical native gallery occurrences; applying a content change still needs its explicit field/locale and fresh _rev. */
export function mapPreparedReferences(stage, entryIds) {
  const { directory, state } = loadPrepared(stage), ledger = jsonOf(path.join(directory, 'ingestion.json'));
  requireFact(ledger.planId === state.planId && Array.isArray(entryIds) && entryIds.length <= 10000, 'Explicit ordered reference selection required');
  return entryIds.map((id, index) => {
    const entry = state.entries.find(entry => entry.entryId === id), record = ledger.entries[id];
    requireFact(entry && record?.status === 'verified' && safeKey(record.media.storageKey), 'Reference lacks verified media mapping');
    requireFact(record.media.mimeType.startsWith('image/'), 'Only verified images can be mapped into a gallery');
    return { _type: 'image', _key: 'mapped-' + sha256(id + ':' + index).slice(0, 16), asset: { _ref: record.media.id, provider: 'local', url: '/_emdash/api/media/file/' + record.media.storageKey.split('/').map(encodeURIComponent).join('/') }, width: record.media.width, height: record.media.height, alt: entry.metadata.alt, caption: entry.metadata.caption };
  });
}
