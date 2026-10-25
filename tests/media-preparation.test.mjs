import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { prepareImages, verifyPreparedStage, imageHash } from '../scripts/prepare-images.mjs';

sharp.cache({ files: 0 });

async function fixture(run) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-image-preparation-'));
  const source = path.join(projectRoot, 'incoming'); fs.mkdirSync(source);
  let next = 0;
  const out = () => path.join(projectRoot, '.emdash/backups', 'images-' + ++next);
  const put = (name, bytes) => fs.writeFileSync(path.join(source, name), bytes);
  try { await run({ projectRoot, source, out, put, prepare: options => prepareImages({ source, out: out(), ...options }, { projectRoot }) }); }
  finally { assert.equal(path.dirname(projectRoot), path.resolve(os.tmpdir())); assert.ok(path.basename(projectRoot).startsWith('baseline-image-preparation-')); fs.rmSync(projectRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }); }
}

test('large photographic PNG becomes a bounded WebP stored master while the original stays intact', () => fixture(async ({ source, projectRoot, out, put }) => {
  const width = 3840, height = 2160, raw = Buffer.alloc(width * height * 3); let seed = 17;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const noise = seed >>> 27, offset = (y * width + x) * 3;
    raw[offset] = 30 + Math.floor(x / width * 140) + noise; raw[offset + 1] = 45 + Math.floor(y / height * 120) + noise; raw[offset + 2] = 90 + noise;
  }
  const original = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
  assert.ok(original.length > 5 * 1024 * 1024, 'Fixture represents a multi-megabyte client PNG'); put('client-photo.png', original);
  const stage = out(), result = prepareImages({ source, out: stage }, { projectRoot });
  assert.equal(result.status, 'ready');
  const { manifest } = verifyPreparedStage(stage, { projectRoot }), entry = manifest.entries[0];
  assert.equal(entry.output.extension, 'webp'); assert.equal(entry.output.mimeType, 'image/webp');
  assert.equal(Math.max(entry.output.width, entry.output.height), 2400); assert.ok(entry.output.bytes < 1024 * 1024);
  assert.equal(imageHash(fs.readFileSync(path.join(source, 'client-photo.png'))), imageHash(original));
  assert.equal(imageHash(fs.readFileSync(path.join(stage, entry.archivePath))), imageHash(original));
  const reference = await sharp(original).resize({ width: entry.output.width, height: entry.output.height }).removeAlpha().raw().toBuffer();
  const decoded = await sharp(path.join(stage, entry.output.path)).removeAlpha().raw().toBuffer();
  let error = 0; for (let i = 0; i < decoded.length; i++) error += Math.abs(decoded[i] - reference[i]);
  assert.ok(error / decoded.length < 5, 'Synthetic smooth photographic detail survives preparation');
}));

test('portrait, EXIF orientation and lossless artwork preserve dimensions, alpha and source bytes', () => fixture(async ({ source, projectRoot, out, put }) => {
  const portrait = await sharp({ create: { width: 90, height: 180, channels: 3, background: '#557799' } }).jpeg().toBuffer();
  const rotated = await sharp({ create: { width: 90, height: 180, channels: 3, background: '#557799' } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  put('portrait.jpg', portrait); put('rotated.jpg', rotated);
  const stage = out(); prepareImages({ source, out: stage, maxEdge: 64 }, { projectRoot });
  const entries = verifyPreparedStage(stage, { projectRoot }).manifest.entries;
  assert.deepEqual(entries.map(entry => [entry.output.width, entry.output.height]), [[32, 64], [64, 32]]);
  const orientedStage = out(); prepareImages({ source: path.join(source, 'rotated.jpg'), out: orientedStage }, { projectRoot });
  const oriented = verifyPreparedStage(orientedStage, { projectRoot }).manifest.entries[0];
  assert.equal(oriented.output.treatment, 'photo-webp-srgb-oriented'); assert.deepEqual([oriented.output.width, oriented.output.height], [180, 90]);
  assert.equal((await sharp(path.join(orientedStage, oriented.output.path)).metadata()).orientation, undefined);
  const pixels = Buffer.from([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 255, 255, 0, 64]);
  const artwork = await sharp(pixels, { raw: { width: 2, height: 2, channels: 4 } }).png().toBuffer(); put('logo.png', artwork);
  const artStage = out(); prepareImages({ source: path.join(source, 'logo.png'), out: artStage, preset: 'artwork' }, { projectRoot });
  const art = verifyPreparedStage(artStage, { projectRoot }).manifest.entries[0];
  assert.equal(art.output.treatment, 'already-within-policy'); assert.equal(art.output.sha256, imageHash(artwork));
  assert.deepEqual(await sharp(path.join(artStage, art.output.path)).raw().toBuffer(), pixels);
  const largeArtwork = await sharp({ create: { width: 128, height: 64, channels: 4, background: { r: 40, g: 80, b: 120, alpha: 0.5 } } }).png().toBuffer(); put('transparent.png', largeArtwork);
  const transparentStage = out(); prepareImages({ source: path.join(source, 'transparent.png'), out: transparentStage, preset: 'artwork', maxEdge: 64 }, { projectRoot });
  const transparent = verifyPreparedStage(transparentStage, { projectRoot }).manifest.entries[0];
  assert.equal(transparent.output.treatment, 'lossless-webp-srgb-oriented');
  assert.deepEqual(await sharp(path.join(transparentStage, transparent.output.path)).raw().toBuffer(), await sharp(largeArtwork).resize({ width: 64, height: 64, fit: 'inside', withoutEnlargement: true }).raw().toBuffer());
}));

test('mixed policies keep reviewed vectors/animations and isolate unsupported files and byte exceptions', () => fixture(async ({ source, projectRoot, out, put }) => {
  const animated = Buffer.from('47494638396101000100800000000000ffffff21ff0b4e45545343415045322e300301000000' + '21f904000a0000002c0000000001000100000202440100'.repeat(2) + '3b', 'hex');
  put('animated.gif', animated); put('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'); put('broken.png', 'broken');
  const stage = out(), rejected = prepareImages({ source, out: stage }, { projectRoot });
  assert.equal(rejected.rejected, 3); assert.equal(fs.readdirSync(path.join(stage, 'upload')).length, 0);
  const reviewedStage = out();
  prepareImages({ source: path.join(source, 'animated.gif'), out: reviewedStage, preset: 'preserve', reason: 'Animation is required for this content' }, { projectRoot });
  const gif = verifyPreparedStage(reviewedStage, { projectRoot }).manifest.entries[0]; assert.equal(gif.output.frames, 2); assert.equal(gif.output.sha256, imageHash(animated));
  const vectorStage = out(); prepareImages({ source: path.join(source, 'logo.svg'), out: vectorStage, overrides: { 'logo.svg': { preset: 'preserve', reason: 'Reviewed source brand vector' } } }, { projectRoot });
  assert.equal(verifyPreparedStage(vectorStage, { projectRoot }).manifest.entries[0].output.mimeType, 'image/svg+xml');
  const noise = await sharp({ create: { width: 80, height: 80, channels: 3, noise: { type: 'gaussian', mean: 120, sigma: 60 } } }).png().toBuffer(); put('detail.png', noise);
  const detailStage = out(), detail = prepareImages({ source: path.join(source, 'detail.png'), out: detailStage, maxBytes: 1024 }, { projectRoot });
  assert.equal(detail.review, 1); assert.equal(fs.readdirSync(path.join(detailStage, 'upload')).length, 0);
  assert.ok(verifyPreparedStage(detailStage, { projectRoot }).manifest.entries[0].output.path.startsWith('review/'));
  const exceptionStage = out(); prepareImages({ source: path.join(source, 'detail.png'), out: exceptionStage, maxBytes: 1024, reason: 'Reviewed fine detail requires this byte size' }, { projectRoot });
  assert.equal(verifyPreparedStage(exceptionStage, { projectRoot }).manifest.entries[0].status, 'ready');
}));

test('resume binds source, policy, archive and outputs, and refuses linked or generated inputs', () => fixture(async ({ source, projectRoot, out, put }) => {
  const png = await sharp({ create: { width: 8, height: 6, channels: 3, background: '#336699' } }).png().toBuffer(); put('small.png', png);
  const stage = out(); prepareImages({ source, out: stage }, { projectRoot });
  const before = fs.readFileSync(path.join(stage, 'manifest.json'));
  assert.equal(prepareImages({ source, out: stage, resume: true }, { projectRoot }).status, 'ready');
  assert.deepEqual(fs.readFileSync(path.join(stage, 'manifest.json')), before);
  assert.throws(() => prepareImages({ source, out: stage, resume: true, quality: 75 }, { projectRoot }), /policy changed/);
  assert.throws(() => prepareImages({ source: path.join(stage, 'upload'), out: out() }, { projectRoot }), /original source/);
  assert.throws(() => prepareImages({ source, out: path.join(source, 'output') }, { projectRoot }), /ignored backups/);
  assert.throws(() => prepareImages({ source, out: path.join(os.tmpdir(), 'unowned-output') }, { projectRoot }), /ignored backups/);
  const output = verifyPreparedStage(stage, { projectRoot }).manifest.entries[0].output;
  fs.appendFileSync(path.join(stage, output.path), 'changed');
  assert.throws(() => verifyPreparedStage(stage, { projectRoot }), /Prepared image changed/);
  fs.symlinkSync(source, path.join(projectRoot, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => prepareImages({ source: path.join(projectRoot, 'linked'), out: out() }, { projectRoot }), /Linked image/);
  fs.unlinkSync(path.join(projectRoot, 'linked'));
  const fresh = out(); prepareImages({ source, out: fresh }, { projectRoot }); fs.appendFileSync(path.join(source, 'small.png'), 'changed');
  assert.throws(() => prepareImages({ source, out: fresh, resume: true }, { projectRoot }), /Source or policy changed/);
}));

test('static profiles use their own ignored staging and require no CMS package', () => fixture(async ({ source, projectRoot, out, put }) => {
  put('small.png', await sharp({ create: { width: 8, height: 6, channels: 3, background: '#336699' } }).png().toBuffer());
  for (const profile of ['static', 'static-sveltia']) {
    fs.writeFileSync(path.join(projectRoot, 'baseline.config.json'), JSON.stringify({ platformProfile: profile }));
    assert.throws(() => prepareImages({ source, out: out() }, { projectRoot }), /ignored backups/);
    const stage = path.join(projectRoot, '.baseline/backups', profile);
    assert.equal(prepareImages({ source, out: stage }, { projectRoot }).status, 'ready');
    assert.equal(verifyPreparedStage(stage, { projectRoot }).manifest.entries[0].output.treatment, 'already-within-policy');
  }
}));

test('excessive inputs and larger conversion candidates never silently become upload files', () => fixture(async ({ source, projectRoot, out, put }) => {
  const huge = path.join(source, 'too-large.png'); fs.writeFileSync(huge, ''); fs.truncateSync(huge, 32 * 1024 * 1024 + 1);
  put('too-wide.png', await sharp({ create: { width: 20001, height: 1, channels: 3, background: '#667788' } }).png().toBuffer());
  const refusedStage = out(), refused = prepareImages({ source, out: refusedStage }, { projectRoot });
  assert.equal(refused.rejected, 2); assert.equal(fs.readdirSync(path.join(refusedStage, 'upload')).length, 0);
  const avif = await sharp({ create: { width: 512, height: 512, channels: 3, noise: { type: 'gaussian', mean: 120, sigma: 60 } } }).avif({ quality: 20, effort: 1 }).toBuffer();
  assert.ok(avif.length > 1024); put('compressed.avif', avif);
  const stage = out(); prepareImages({ source: path.join(source, 'compressed.avif'), out: stage, maxBytes: 1024 }, { projectRoot });
  const entry = verifyPreparedStage(stage, { projectRoot }).manifest.entries[0];
  assert.equal(entry.output.treatment, 'smaller-original-retained'); assert.equal(entry.output.sha256, imageHash(avif));
  assert.equal(entry.status, 'review'); assert.equal(fs.readdirSync(path.join(stage, 'upload')).length, 0);
}));
