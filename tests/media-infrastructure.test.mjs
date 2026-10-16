import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { mediaPlan, prepareMedia } from '../scripts/media-migrate-wp.mjs';
import { probeMedia, isolatedProbe } from '../scripts/media-probe.mjs';
import { ingestPrepared, stageR2Objects, localEmdashAdapter, mapPreparedReferences } from '../scripts/media-ingest.mjs';
import { syncR2, r2Transport } from '../scripts/sync-r2-media.mjs';
import { sha256 } from '../scripts/infrastructure-io.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
async function sandbox(run) {
  const source = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-media-')), stageRoot = path.join(root, '.emdash/backups', path.basename(source)); fs.mkdirSync(stageRoot, { recursive: true });
  const put = (key, bytes) => { const file = path.join(source, key); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); };
  const png = await sharp({ create: { width: 8, height: 6, channels: 3, background: '#336699' } }).png().toBuffer();
  try { return await run({ source, stageRoot, put, png }); }
  finally { assert.equal(path.dirname(source), path.resolve(os.tmpdir())); assert.match(path.basename(source), /^baseline-media-/); fs.rmSync(source, { recursive: true, force: true }); assert.equal(path.dirname(stageRoot), path.join(root, '.emdash/backups')); fs.rmSync(stageRoot, { recursive: true, force: true }); }
}
const target = bucket => ({ kind: 'r2', account: '1'.repeat(32), environment: 'preview', binding: 'MEDIA', bucket, configSHA256: 'a'.repeat(64) });
function fakeR2() {
  const objects = new Map(), calls = []; let fail = '';
  return { objects, calls, setFailure: key => fail = key, transport: async (method, key, bytes, headers) => {
    calls.push({ method, key, headers });
    if (method === 'GET') { const item = objects.get(key); return item ? new Response(item.bytes, { headers: item.headers }) : new Response('', { status: 404 }); }
    assert.equal(headers['If-None-Match'], '*');
    if (key === fail) return new Response('', { status: 500 });
    if (objects.has(key)) return new Response('', { status: 412 });
    objects.set(key, { bytes: Buffer.from(bytes), headers: { 'content-type': headers['Content-Type'], 'cache-control': headers['Cache-Control'], etag: 'not-a-content-hash' } }); return new Response('', { status: 200 });
  } };
}
test('read-only media plan preserves identities, missing originals, nested Unicode, aliases and crop-like originals deterministically', () => sandbox(async ({ source, put, png }) => {
  put('année/family-scaled.png', png); put('family-300x200.png', png); put('crops/known.png', png);
  const metadata = { metadataVersion: 1, attachments: [{ id: 12, file: 'année/family-scaled.png', originalFile: 'année/missing.png', locale: 'fr', alt: '', caption: 'Légende', credit: 'Source credit', aliases: ['https://example.invalid/original.png'], uses: ['gallery:one'], variants: [{ file: 'crops/known.png', kind: 'crop', referenced: true }] }, { id: 13, file: 'année/family-scaled.png', locale: 'en', alt: 'Verified context', caption: 'Different caption' }] };
  const before = sha256(fs.readFileSync(path.join(source, 'année/family-scaled.png'))), a = mediaPlan({ source, sourceId: 'synthetic-wordpress', metadata }), b = mediaPlan({ source, sourceId: 'synthetic-wordpress', metadata });
  assert.deepEqual(a, b); assert.equal(a.entries.length, 4);
  const pair = a.entries.filter(entry => entry.source.path === 'année/family-scaled.png'); assert.equal(pair.length, 2); assert.notEqual(pair[0].entryId, pair[1].entryId); assert.notEqual(pair[0].proposedStorageKey, pair[1].proposedStorageKey); assert.equal(pair[0].relationships.originalPresent, false); assert.equal(pair[0].metadata.alt, '');
  const unknown = a.entries.find(entry => entry.source.path === 'family-300x200.png'); assert.equal(unknown.relationships.role, 'unknown'); assert.equal(unknown.operation, 'quarantine');
  assert.equal(sha256(fs.readFileSync(path.join(source, 'année/family-scaled.png'))), before); assert.equal(fs.readdirSync(source).includes('manifest.json'), false);
}));
test('Sharp profiles preserve small originals and animated frames; opt-in resize orients EXIF without upscaling/format conversion; SVG/PDF/corruption quarantine', () => sandbox(async ({ source, put, png }) => {
  put('small.png', png); const small = await probeMedia(path.join(source, 'small.png'), { maxWidth: 64 }); assert.equal(small.sha256, sha256(png));
  const jpeg = await sharp({ create: { width: 80, height: 160, channels: 3, background: '#123456' } }).withMetadata({ orientation: 6 }).jpeg().toBuffer(); put('oriented.jpg', jpeg);
  const output = path.join(source, 'prepared.jpg'), resized = await probeMedia(path.join(source, 'oriented.jpg'), { maxWidth: 64, output }); assert.equal(resized.width, 64); assert.equal(resized.height, 32); assert.equal(resized.mimeType, 'image/jpeg'); assert.equal(sha256(fs.readFileSync(path.join(source, 'oriented.jpg'))), sha256(jpeg));
  const animated = Buffer.from('47494638396101000100800000000000ffffff21ff0b4e45545343415045322e300301000000' + '21f904000a0000002c0000000001000100000202440100'.repeat(2) + '3b', 'hex'); put('animated.gif', animated);
  const gif = await probeMedia(path.join(source, 'animated.gif')); assert.equal(gif.frames, 2); assert.equal(gif.treatment, 'animation-preserve'); assert.equal(gif.sha256, sha256(animated));
  put('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><rect width="5" height="5"/></svg>'); put('document.pdf', '%PDF-1.4\nSynthetic document'); put('broken.jpg', 'corrupt');
  assert.equal((await probeMedia(path.join(source, 'logo.svg'))).treatment, 'vector-review'); assert.equal((await probeMedia(path.join(source, 'document.pdf'))).treatment, 'document-review'); assert.equal(isolatedProbe(path.join(source, 'broken.jpg')).treatment, 'quarantine');
}));
test('preparation archives originals, resumes verified files safely and refuses changed sources/links', () => sandbox(async ({ source, stageRoot, put, png }) => {
  put('photo.png', png); const metadata = { metadataVersion: 1, attachments: [{ id: 1, file: 'photo.png', alt: 'Known', caption: 'Caption' }] }, plan = mediaPlan({ source, sourceId: 'fixture', metadata });
  const out = path.join(stageRoot, 'prepared'), a = prepareMedia(plan, { source, out }), b = prepareMedia(plan, { source, out, resume: true }); assert.deepEqual(a, b);
  assert.equal(fs.readFileSync(path.join(out, a.entries[0].archivePath)).equals(png), true);
  fs.appendFileSync(path.join(source, 'photo.png'), 'changed'); assert.throws(() => prepareMedia(plan, { source, out, resume: true }));
  fs.symlinkSync(stageRoot, path.join(source, 'linked'), process.platform === 'win32' ? 'junction' : 'dir'); assert.throws(() => mediaPlan({ source, sourceId: 'fixture', metadata }));
}));
function fakeCMS() {
  const records = new Map(), objects = new Map(); let uploads = 0, ambiguous = false;
  return { records, objects, count: () => uploads, ambiguous: value => ambiguous = value, identity: { adapter: 'emdash-1.3.0/rest-media-v1', origin: 'http://127.0.0.1:12345' }, get: async id => records.get(id), bytes: async key => objects.get(key), upload: async (bytes, entry) => {
    const id = 'synthetic-' + ++uploads, storageKey = 'native/nested/' + id + '.png';
    const item = { id, storageKey, filename: id + '.png', mimeType: entry.output.mimeType, width: entry.output.width, height: entry.output.height, alt: entry.metadata.alt, caption: entry.metadata.caption };
    records.set(id, item); objects.set(storageKey, bytes); if (ambiguous) throw Error('Connection lost after create'); return item;
  } };
}
test('supported ingestion preserves duplicate metadata identities, verifies bytes/native keys, repeats safely and stages actual keys', () => sandbox(async ({ source, stageRoot, put, png }) => {
  put('same.png', png); const metadata = { metadataVersion: 1, attachments: [{ id: 1, locale: 'en', file: 'same.png', alt: '', caption: 'First', credit: 'A' }, { id: 2, locale: 'fr', file: 'same.png', alt: 'Deux', caption: 'Deuxième', credit: 'B' }] };
  const plan = mediaPlan({ source, sourceId: 'fixture', metadata }), out = path.join(stageRoot, 'prepared'); prepareMedia(plan, { source, out });
  const adapter = fakeCMS(); assert.equal((await ingestPrepared(out, adapter)).exitCode, 0); assert.equal((await ingestPrepared(out, adapter)).exitCode, 0); assert.equal(adapter.count(), 2);
  assert.equal(stageR2Objects(out, path.join(stageRoot, 'r2')).objects, 2);
  const mapped = mapPreparedReferences(out, [plan.entries[1].entryId, plan.entries[0].entryId, plan.entries[1].entryId]);
  assert.deepEqual(mapped.map(value => value.caption), ['Deuxième', 'First', 'Deuxième']); assert.equal(mapped[0].asset._ref, mapped[2].asset._ref); assert.notEqual(mapped[0]._key, mapped[2]._key); assert.equal(mapped[1].alt, '');
  assert.ok(fs.existsSync(path.join(stageRoot, 'r2/objects/native/nested/synthetic-1.png'))); assert.equal(adapter.records.get('synthetic-1').alt, ''); assert.notEqual(adapter.records.get('synthetic-1').caption, adapter.records.get('synthetic-2').caption);
}));
test('reviewed vectors remain exact passthroughs while unreviewed SVG/PDF and header-only rasters stay quarantined', () => sandbox(async ({ source, stageRoot, put, png }) => {
  const vector = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h2v2z"/></svg>'); put('logo.svg', vector); put('header.png', png.subarray(0, 24));
  const metadata = { metadataVersion: 1, attachments: [{ id: 1, file: 'logo.svg', alt: 'Official logo', caption: '', passthroughSHA256: sha256(vector) }, { id: 2, file: 'header.png', alt: '', caption: '' }] };
  const plan = mediaPlan({ source, sourceId: 'fixture', metadata }); assert.equal(plan.entries.find(entry => entry.source.path === 'logo.svg').operation, 'ingest'); assert.equal(plan.entries.find(entry => entry.source.path === 'header.png').operation, 'quarantine');
  const prepared = prepareMedia(plan, { source, out: path.join(stageRoot, 'prepared') }), logo = prepared.entries.find(entry => entry.source.path === 'logo.svg'); assert.equal(logo.output.sha256, sha256(vector)); assert.equal(fs.readFileSync(path.join(stageRoot, 'prepared', logo.outputPath)).equals(vector), true);
}));
test('ambiguous CMS writes require explicit verified adoption and never automatically duplicate or delete', () => sandbox(async ({ source, stageRoot, put, png }) => {
  put('one.png', png); const metadata = { metadataVersion: 1, attachments: [{ id: 1, file: 'one.png', alt: '', caption: 'One' }] }, plan = mediaPlan({ source, sourceId: 'fixture', metadata }), out = path.join(stageRoot, 'prepared'); prepareMedia(plan, { source, out });
  const adapter = fakeCMS(); adapter.ambiguous(true);
  assert.equal((await ingestPrepared(out, adapter)).exitCode, 1); assert.equal((await ingestPrepared(out, adapter)).exitCode, 1); assert.equal(adapter.count(), 1);
  assert.equal((await ingestPrepared(out, adapter, { adopt: { [plan.entries[0].entryId]: 'synthetic-1' } })).exitCode, 0); assert.equal(adapter.count(), 1);
  const stateFile = path.join(out, 'prepared.json'), state = JSON.parse(fs.readFileSync(stateFile)); state.entries[0].outputPath = '../outside'; fs.writeFileSync(stateFile, JSON.stringify(state));
  await assert.rejects(ingestPrepared(out, adapter)); assert.equal(adapter.count(), 1);
}));
test('R2 nested keys, changed bytes, bucket switch and deleted remote objects cannot trust stale caches', () => sandbox(async ({ source, stageRoot, put, png }) => {
  put('nested/été & shell;name.png', png); const remote = fakeR2(), options = { source, target: target('fixture-media'), apply: true, journal: path.join(stageRoot, 'r2.json'), transport: remote.transport };
  const planned = await syncR2({ source, target: options.target }); assert.equal(planned.status, 'planned'); assert.equal(remote.calls.length, 0);
  assert.equal((await syncR2(options)).exitCode, 0); assert.equal(remote.calls.filter(call => call.method === 'PUT').length, 1);
  assert.equal((await syncR2(options)).exitCode, 0); assert.equal(remote.calls.filter(call => call.method === 'PUT').length, 1);
  remote.objects.clear(); assert.equal((await syncR2(options)).exitCode, 0); assert.equal(remote.calls.filter(call => call.method === 'PUT').length, 2);
  const second = fakeR2(); assert.equal((await syncR2({ ...options, target: target('fixture-other'), transport: second.transport })).exitCode, 0); assert.equal(second.calls.filter(call => call.method === 'PUT').length, 1);
  put('nested/été & shell;name.png', Buffer.from(png).fill(1, png.length - 4)); const failed = await syncR2(options); assert.equal(failed.exitCode, 1); assert.equal(remote.calls.filter(call => call.method === 'PUT').length, 2);
}));
test('R2 partial failure records verified work and returns nonzero; signed transport encodes keys without shell interpolation or credential redirects', () => sandbox(async ({ source, stageRoot, put, png }) => {
  put('a.png', png); put('b.png', png); const remote = fakeR2(); remote.setFailure('b.png');
  const result = await syncR2({ source, target: target('fixture-media'), apply: true, journal: path.join(stageRoot, 'r2.json'), transport: remote.transport }); assert.equal(result.exitCode, 1); assert.equal(result.files[0].status, 'verified'); assert.equal(result.files[1].status, 'failed-or-unverified');
  const signed = [], transport = r2Transport(target('fixture-media'), { accessKeyId: 'synthetic', secretAccessKey: 'synthetic-secret', request: async request => { signed.push(request); return new Response('ok'); } });
  await transport('PUT', 'nested/été & shell;name.png', png, { 'If-None-Match': '*' }); assert.ok(signed[0].headers.get('Authorization').startsWith('AWS4-HMAC-SHA256')); assert.equal(signed[0].headers.get('If-None-Match'), '*'); assert.equal(signed[0].redirect, 'error'); assert.ok(signed[0].url.includes('%C3%A9t%C3%A9'));
}));
test('R2 staging manifest supplies MIME for extensionless native keys and refuses altered hashes, metadata and occupied locks', () => sandbox(async ({ source, stageRoot, put, png }) => {
  put('native/no-extension', png); const manifest = { stagingVersion: 1, mappings: [{ storageKey: 'native/no-extension', sha256: sha256(png), mimeType: 'image/png' }] }, remote = fakeR2(), journal = path.join(stageRoot, 'r2.json');
  const options = { source, target: target('fixture-media'), manifest, apply: true, journal, transport: remote.transport };
  assert.equal((await syncR2(options)).exitCode, 0); assert.equal(remote.objects.get('native/no-extension').headers['content-type'], 'image/png');
  manifest.mappings[0].mimeType = 'image/jpeg'; assert.equal((await syncR2(options)).exitCode, 1); assert.equal(remote.calls.filter(call => call.method === 'PUT').length, 1);
  manifest.mappings[0].sha256 = '0'.repeat(64); await assert.rejects(syncR2(options)); manifest.mappings[0].sha256 = sha256(png);
  fs.writeFileSync(journal + '.lock', 'occupied'); await assert.rejects(syncR2(options)); assert.equal(fs.readFileSync(journal + '.lock', 'utf8'), 'occupied');
}));
test('real R2 CLI sets exit 1 on upload failures using injected offline fetch; absent targets and remote CMS origins fail closed', () => sandbox(async ({ source, stageRoot, put, png }) => {
  put('one.png', png); const config = path.join(source, 'wrangler.jsonc');
  // Put config outside the upload directory so it cannot become a staged object.
  const selected = path.join(stageRoot, 'wrangler.jsonc'); fs.writeFileSync(selected, JSON.stringify({ account_id: target('fixture-media').account, env: { preview: { r2_buckets: [{ binding: 'MEDIA', bucket_name: 'fixture-media' }] } } }));
  const hook = path.join(stageRoot, 'offline-fetch.mjs'); fs.writeFileSync(hook, 'globalThis.fetch=async request=>new Response("",{status:request.method==="GET"?404:500});\n');
  const result = spawnSync(process.execPath, ['--import', pathToFileURL(hook).href, path.join(root, 'scripts/sync-r2-media.mjs'), '--config', selected, '--env', 'preview', '--account', target('fixture-media').account, '--bucket', 'fixture-media', '--uploads', source, '--apply', '--journal', path.join(stageRoot, 'cli.json')], { cwd: root, encoding: 'utf8', env: { ...process.env, R2_ACCESS_KEY_ID: 'synthetic', R2_SECRET_ACCESS_KEY: 'synthetic-secret' }, timeout: 15000 });
  assert.equal(result.status, 1, result.stderr); assert.match(result.stdout, /failed-or-unverified/);
  const missing = spawnSync(process.execPath, [path.join(root, 'scripts/sync-r2-media.mjs')], { cwd: root, encoding: 'utf8' }); assert.equal(missing.status, 2);
  assert.throws(() => localEmdashAdapter({ url: 'https://example.invalid', token: 'synthetic' })); assert.equal(fs.existsSync(config), false);
  const retired = spawnSync(process.execPath, [path.join(root, 'scripts/organize-media.mjs'), '--db=never-create.db', '--hydrate'], { cwd: source, encoding: 'utf8' }); assert.equal(retired.status, 2); assert.equal(fs.existsSync(path.join(source, 'never-create.db')), false);
}));
