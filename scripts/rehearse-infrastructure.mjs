// Explicit synthetic local rehearsal; never a build/deployment/Actions dependency.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import sharp from 'sharp';
import { EmDashClient } from 'emdash/client';
import { startVisualSite } from '../tests/visual/site.mjs';
import { albumPhotos } from '../src/lib/photo-gallery.ts';
import { diffDatabase } from './db-diff.mjs';
import { inspectSQLite } from './sqlite-schema.mjs';
import { exportSeedCandidate } from './db-export-seed.mjs';
import { reconstructIsolated } from './d1-snapshot.mjs';
import { mediaPlan, prepareMedia } from './media-migrate-wp.mjs';
import { localEmdashAdapter, ingestPrepared, mapPreparedReferences, stageR2Objects } from './media-ingest.mjs';
import { syncR2 } from './sync-r2-media.mjs';
import { argumentsOf, newDirectory, requireFact, writeJSON, jsonOf, sha256, bytesOf } from './infrastructure-io.mjs';

requireFact(!process.env.CI && !process.env.GITHUB_ACTIONS, 'Run the synthetic runtime rehearsal locally only');
const root = fileURLToPath(new URL('../', import.meta.url));
const options = argumentsOf(process.argv.slice(2), ['--out']), out = newDirectory(options.out);
const scratch = fs.mkdtempSync(path.join(root, '.emdash/backups/phase5-rehearsal-'));
const run = args => execFileSync(process.execPath, [path.join(root, 'node_modules/emdash/dist/cli/index.mjs'), ...args], { cwd: scratch, timeout: 60000, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const receipt = { receiptVersion: 1, date: new Date().toISOString(), scope: 'Synthetic offline tooling, owned local Node CMS and mocked Cloudflare transports only', externalCloudflareRequests: 0, liveD1R2: 'unverified; no target configured or contacted', steps: [] };
let site;
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = new URL(input instanceof Request ? input.url : input);
  requireFact(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && (!site || url.origin === site.origin), 'Non-owned/external network request refused by rehearsal');
  return originalFetch(input, options);
};
try {
  const seed = { version: '1', collections: [{ slug: 'pages', label: 'Pages', fields: [{ slug: 'title', label: 'Title', type: 'string' }, { slug: 'private_note', label: 'Private note', type: 'string' }] }], content: { pages: [{ id: 'one', slug: 'one', status: 'published', data: { title: 'Synthetic offline seed', private_note: 'EXCLUDED-PRIVATE-FIXTURE' } }] } };
  const input = path.join(scratch, 'input.json'), database = path.join(scratch, 'source.sqlite'); writeJSON(input, seed);
  run(['seed', input, '--database', database, '--with-content']);
  const sourceHash = sha256(bytesOf(database));
  const capture = await diffDatabase({ local: database, capture: true, out: path.join(out, 'reference') }); assert.equal(capture.exitCode, 0);
  const equal = await diffDatabase({ local: database, snapshot: path.join(out, 'reference/schema.json'), out: path.join(out, 'equal') }); assert.equal(equal.exitCode, 0);
  const degraded = path.join(scratch, 'degraded.sqlite'); fs.copyFileSync(database, degraded);
  const db = new DatabaseSync(degraded); for (let i = 0; i < 40; i++) db.exec(`ALTER TABLE ec_pages ADD COLUMN legacy_${i} TEXT`); db.close();
  const drift = await diffDatabase({ local: degraded, snapshot: path.join(out, 'reference/schema.json'), out: path.join(out, 'drift') }); assert.equal(drift.exitCode, 1); assert.ok(drift.issues.some(issue => issue.physicalColumns > 50));
  const policy = path.join(scratch, 'policy.json'); writeJSON(policy, { policyVersion: 1, collections: { pages: { fields: ['title'], content: true } } });
  const candidate = path.join(scratch, 'candidate'), exported = exportSeedCandidate({ database, policy, out: candidate }); assert.equal(exported.exitCode, 0);
  assert.equal(fs.readFileSync(path.join(candidate, 'candidate.json'), 'utf8').includes('EXCLUDED-PRIVATE-FIXTURE'), false);
  const fresh = path.join(scratch, 'roundtrip.sqlite'); run(['seed', path.join(candidate, 'candidate.json'), '--database', fresh, '--with-content']);
  const roundtrip = JSON.parse(run(['export-seed', '--database', fresh, '--with-content', 'pages'])); assert.equal(roundtrip.content.pages[0].data.title, 'Synthetic offline seed');
  assert.equal(sha256(bytesOf(database)), sourceHash);
  const sql = path.join(scratch, 'export.sql'); fs.writeFileSync(sql, "CREATE TABLE example(id INTEGER PRIMARY KEY,value TEXT); INSERT INTO example VALUES(1,'synthetic');");
  const reconstruction = reconstructIsolated(sql, path.join(scratch, 'inspection.sqlite'));
  const absent = {};
  for (const script of ['db-diff.mjs', 'd1-snapshot.mjs', 'sync-r2-media.mjs']) {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts', script)], { cwd: root, encoding: 'utf8' }); assert.equal(result.status, 2); absent[script] = result.status;
  }
  receipt.database = { equalExit: equal.exitCode, budgetDriftExit: drift.exitCode, sourceUnchanged: true, sourcePhysicalWidths: inspectSQLite(database).schema.tables.filter(table => table.owner === 'cms-collection').map(table => table.columns.length), seedCLIProjectionRoundtrip: true, privateFieldExcluded: true, reconstruction, absentTargetExits: absent };
  receipt.steps.push('actual CLI seed, metadata parity, budget failure, privacy-aware seed round-trip, isolated SQL reconstruction and missing-target exits');
  console.log('Database rehearsal passed.');

  site = await startVisualSite(root, path.join(scratch, 'server'), { devOnly: true });
  const source = path.join(scratch, 'source-uploads'); fs.mkdirSync(source);
  const png = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#486a8c' } }).png().toBuffer(); fs.writeFileSync(path.join(source, 'swatch.png'), png);
  const metadata = { metadataVersion: 1, attachments: [{ id: 101, file: 'swatch.png', locale: 'en', alt: '', caption: 'English synthetic swatch', credit: 'Synthetic fixture' }, { id: 102, file: 'swatch.png', locale: 'fr', alt: 'French synthetic swatch', caption: 'French synthetic caption', credit: 'Synthetic fixture' }] };
  const plan = mediaPlan({ source, sourceId: 'phase5-synthetic-wordpress', metadata }), prepared = path.join(scratch, 'prepared');
  prepareMedia(plan, { source, out: prepared }); prepareMedia(plan, { source, out: prepared, resume: true });
  const adapter = localEmdashAdapter({ url: site.origin, devBypass: true });
  const ingestion = await ingestPrepared(prepared, adapter); assert.equal(ingestion.exitCode, 0, JSON.stringify(ingestion));
  const repeated = await ingestPrepared(prepared, adapter); assert.equal(repeated.exitCode, 0); assert.equal(repeated.verified, 2);
  const mapped = mapPreparedReferences(prepared, [plan.entries[1].entryId, plan.entries[0].entryId, plan.entries[1].entryId]);
  assert.equal(mapped[0].asset._ref, mapped[2].asset._ref); assert.notEqual(mapped[0].asset._ref, mapped[1].asset._ref);
  const client = new EmDashClient({ baseUrl: site.origin, devBypass: true });
  const pages = await client.list('pages'); const about = pages.items.find(item => item.slug === 'about'); assert.ok(about);
  const original = await client.get('pages', about.id, { raw: true }); assert.ok(original._rev);
  await client.update('pages', about.id, { data: { content: [...original.data.content, { _type: 'gallery', _key: 'phase5-gallery', images: mapped }] }, _rev: original._rev }); await client.publish('pages', about.id);
  const reloaded = await client.get('pages', about.id, { raw: true }), photos = albumPhotos(reloaded.data.content);
  assert.deepEqual(photos.map(photo => photo.asset._ref), mapped.map(photo => photo.asset._ref)); assert.deepEqual(photos.map(photo => photo.caption), mapped.map(photo => photo.caption)); assert.equal(photos[1].alt, '');
  const html = await (await fetch(site.origin + '/about')).text(); assert.equal((html.match(/data-caption="French synthetic caption"/g) ?? []).length, 2); assert.ok(html.includes('data-photo-gallery'));
  await client.update('pages', about.id, { data: { content: original.data.content }, _rev: reloaded._rev }); await client.publish('pages', about.id);
  assert.equal((await (await fetch(site.origin + '/about')).text()).includes('data-photo-gallery'), false);
  const staged = path.join(scratch, 'r2'); assert.equal(stageR2Objects(prepared, staged).objects, 2);
  const staging = jsonOf(path.join(staged, 'staging.json')), objects = new Map(), calls = []; let failing = null;
  const transport = async (method, key, bytes, headers) => {
    calls.push({ method, key });
    if (method === 'GET') { const object = objects.get(key); return object ? new Response(object.bytes, { headers: object.headers }) : new Response('', { status: 404 }); }
    assert.equal(headers['If-None-Match'], '*'); if (key === failing) return new Response('', { status: 500 });
    if (objects.has(key)) return new Response('', { status: 412 });
    objects.set(key, { bytes, headers: { 'content-type': headers['Content-Type'], 'cache-control': headers['Cache-Control'] } }); return new Response('', { status: 200 });
  };
  const sync = { source: path.join(staged, 'objects'), target: { kind: 'r2', account: '1'.repeat(32), environment: 'synthetic', bucket: 'synthetic-media', binding: 'MEDIA' }, manifest: staging, apply: true, journal: path.join(scratch, 'r2-journal.json'), transport };
  assert.equal((await syncR2(sync)).exitCode, 0); assert.equal((await syncR2(sync)).exitCode, 0); assert.equal(calls.filter(call => call.method === 'PUT').length, 2);
  failing = staging.mappings[0].storageKey; objects.delete(failing); assert.equal((await syncR2(sync)).exitCode, 1); failing = null; assert.equal((await syncR2(sync)).exitCode, 0);
  receipt.media = { realLocalMediaRecords: ingestion.verified, duplicateBytesDistinctMediaIDs: true, repeatedIngestionNoDuplicateRecords: true, storedBytesHashVerified: true, nativeDimensions: [16, 12], galleryAPIRevisionBoundSaveReload: true, galleryOrderAndDuplicateOccurrences: 3, captionsAndDecorativeAltPreserved: true, anonymousPublicGalleryRendered: true, originalContentRestored: true, sourceSHA256: sha256(png), originalSourceUnchanged: sha256(bytesOf(path.join(source, 'swatch.png'))) === sha256(png), actualStorageKeysStaged: staging.mappings.length, mockedR2: { verified: true, repeatedNoDuplicateWrites: true, deletedObjectDetected: true, uploadFailureExit: 1, resumeVerified: true }, creditLocaleProvenanceScope: 'Preserved in manifest/journal; not invented as CMS media fields' };
  receipt.steps.push('actual local EmDash upload/get/storage hash, deduplication disabled, repeat ingestion, revision-bound gallery save/reload/public read/restore, native key staging and mocked R2 failure/resume');
  receipt.status = 'passed'; console.log('Local CMS/media and mocked R2 rehearsal passed.');
} catch (error) { receipt.status = 'failed'; throw error; }
finally {
  globalThis.fetch = originalFetch; await site?.cleanup();
  assert.equal(path.dirname(scratch), path.join(root, '.emdash/backups')); assert.ok(path.basename(scratch).startsWith('phase5-rehearsal-'));
  fs.rmSync(scratch, { recursive: true, force: true });
  receipt.cleanup = { ownedServerStopped: true, dependencyJunctionRemoved: true, disposableDatabasesAndMediaRemoved: true, workingDatabaseCopied: false };
  writeJSON(path.join(out, 'verification.json'), receipt);
}
