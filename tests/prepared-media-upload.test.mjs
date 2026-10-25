import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { prepareImages, verifyPreparedStage } from '../scripts/prepare-images.mjs';
import { uploadPreparedMedia, preparedMediaTarget } from '../scripts/upload-prepared-media.mjs';

async function fixture(run) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-prepared-upload-'));
  try {
    const source = path.join(projectRoot, 'photo.png'), stage = path.join(projectRoot, '.emdash/backups/prepared');
    fs.writeFileSync(source, await sharp({ create: { width: 10, height: 8, channels: 3, background: '#446688' } }).png().toBuffer());
    prepareImages({ source, out: stage }, { projectRoot });
    const entry = verifyPreparedStage(stage, { projectRoot }).manifest.entries[0], bytes = fs.readFileSync(path.join(stage, entry.output.path));
    let count = 0, failAfterUpload = false, wrongMetadata = false;
    const records = new Map();
    const cli = async args => {
      if (args[1] === 'list') return { items: [] };
      if (args[1] === 'upload') {
        const id = 'media-' + ++count;
        const item = { id, storageKey: 'actual/' + id + '.png', size: bytes.length, mimeType: 'image/png', width: 10, height: 8, alt: wrongMetadata ? 'Existing editorial identity' : '', caption: 'Known caption' };
        records.set(id, item); if (failAfterUpload) throw Error('Response lost after create'); return item;
      }
      if (args[1] === 'get') return records.get(args[2]);
      assert.fail('Unexpected CLI call');
    };
    const request = async (url, options) => { assert.equal(new URL(url).origin, 'http://127.0.0.1:43219'); assert.equal(options.redirect, 'error'); return new Response(bytes); };
    await run({ projectRoot, stage, cli, request, count: () => count, loseResponse: () => { failAfterUpload = true; }, mismatch: () => { wrongMetadata = true; }, records, options: { stage, url: 'http://127.0.0.1:43219', metadata: { 'photo.png': { alt: '', caption: 'Known caption', credit: 'Client source' } } } });
  } finally { assert.equal(path.dirname(projectRoot), path.resolve(os.tmpdir())); assert.ok(path.basename(projectRoot).startsWith('baseline-prepared-upload-')); fs.rmSync(projectRoot, { recursive: true, force: true }); }
}

test('prepared uploads retain source/output identities, verify bytes and avoid repeat creates', () => fixture(async ({ projectRoot, cli, request, options, count }) => {
  const deps = { projectRoot, cli, request };
  const first = await uploadPreparedMedia(options, deps); assert.equal(first.status, 'verified'); assert.equal(first.verified, 1);
  assert.equal(first.verifiedBytes, first.preparedBytes);
  const repeated = await uploadPreparedMedia(options, deps); assert.equal(repeated.verified, 1); assert.equal(count(), 1);
  const receipt = JSON.parse(fs.readFileSync(first.receipt));
  assert.equal(receipt.entries['photo.png'].metadata.credit, 'Client source'); assert.equal(receipt.entries['photo.png'].storageKey, 'actual/media-1.png');
  assert.ok(receipt.entries['photo.png'].sourceSHA256); assert.ok(receipt.entries['photo.png'].outputSHA256);
  await assert.rejects(uploadPreparedMedia({ ...options, metadata: { 'photo.png': { alt: 'changed' } } }, deps), /metadata changed/);
}));

test('lost POST response blocks automatic repeats until an explicit media ID is reconciled', () => fixture(async ({ projectRoot, cli, request, options, count, loseResponse }) => {
  loseResponse(); const deps = { projectRoot, cli, request };
  const ambiguous = await uploadPreparedMedia(options, deps); assert.equal(ambiguous.status, 'needs-reconciliation');
  assert.equal(ambiguous.verifiedBytes, 0); assert.ok(ambiguous.preparedBytes > 0);
  assert.equal((await uploadPreparedMedia(options, deps)).status, 'needs-reconciliation'); assert.equal(count(), 1);
  assert.equal((await uploadPreparedMedia({ ...options, adopt: { 'photo.png': 'media-1' } }, deps)).status, 'verified'); assert.equal(count(), 1);
}));

test('deduplicated metadata and changed stored bytes fail verification without overwriting records', () => fixture(async ({ projectRoot, cli, request, options, count, mismatch, records }) => {
  mismatch(); const deps = { projectRoot, cli, request };
  assert.equal((await uploadPreparedMedia(options, deps)).status, 'needs-reconciliation'); assert.equal(count(), 1);
  assert.equal(records.get('media-1').alt, 'Existing editorial identity');
  records.set('media-reconciled', { ...records.get('media-1'), id: 'media-reconciled', alt: '' });
  assert.equal((await uploadPreparedMedia({ ...options, adopt: { 'photo.png': 'media-reconciled' } }, deps)).status, 'verified');
  assert.equal((await uploadPreparedMedia(options, { ...deps, request: async () => new Response('wrong stored bytes') })).status, 'needs-reconciliation'); assert.equal(count(), 1);
}));

test('target validation and unresolved preparation fail before upload', () => fixture(async ({ projectRoot, cli, request, options, stage, count }) => {
  for (const url of ['http://public.example', 'http://localhost.evil.test', 'https://user:password@example.test', 'https://example.test/path', 'https://example.test/?token=secret']) assert.throws(() => preparedMediaTarget(url));
  assert.equal(preparedMediaTarget('https://example.test'), 'https://example.test');
  await assert.rejects(uploadPreparedMedia({ ...options, metadata: {} }, { projectRoot, cli, request }), /explicit alt/);
  const detail = path.join(projectRoot, 'detail.png');
  fs.writeFileSync(detail, await sharp({ create: { width: 80, height: 80, channels: 3, noise: { type: 'gaussian', mean: 120, sigma: 60 } } }).png().toBuffer());
  const reviewStage = path.join(projectRoot, '.emdash/backups/review'); prepareImages({ source: detail, out: reviewStage, maxBytes: 1024 }, { projectRoot });
  await assert.rejects(uploadPreparedMedia({ ...options, stage: reviewStage }, { projectRoot, cli, request }), /Resolve all rejected\/review/);
  const entry = verifyPreparedStage(stage, { projectRoot }).manifest.entries[0]; fs.appendFileSync(path.join(stage, entry.output.path), 'changed');
  await assert.rejects(uploadPreparedMedia(options, { projectRoot, cli, request }), /Prepared image changed/); assert.equal(count(), 0);
}));
