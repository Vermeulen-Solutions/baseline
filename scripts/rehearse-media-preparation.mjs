// Explicit local rehearsal with an owned fresh CMS; never a production operation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { startVisualSite } from '../tests/visual/site.mjs';
import { imageOptions, imagePath, imageBytes, imageHash, prepareImages, verifyPreparedStage } from './prepare-images.mjs';

assert.ok(!process.env.CI && !process.env.GITHUB_ACTIONS, 'Run this owned CMS rehearsal locally');
sharp.cache({ files: 0 });
const root = fileURLToPath(new URL('../', import.meta.url));
const options = imageOptions(process.argv.slice(2), ['--out']);
assert.ok(options.out, 'Explicit --out required');
const out = imagePath(options.out); assert.ok(!fs.existsSync(out), 'Output must be new'); fs.mkdirSync(out, { recursive: true });
const scratch = fs.mkdtempSync(path.join(root, '.emdash/backups/media-preparation-rehearsal-'));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(key)));
const cli = path.join(root, 'node_modules/emdash/dist/cli/index.mjs');
const run = async (script, args) => { const { stdout } = await promisify(execFile)(process.execPath, [script, ...args], { cwd: root, env, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024, windowsHide: true }); return JSON.parse(stdout); };
const receipt = { version: 1, status: 'running', scope: 'Fresh owned local EmDash and synthetic sources; no production or working DB/media/env copied', steps: [] };
let site;
try {
  const source = path.join(scratch, 'client-images'); fs.mkdirSync(source);
  const width = 3840, height = 2160, raw = Buffer.alloc(width * height * 3); let seed = 71;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const grain = seed >>> 27, i = (y * width + x) * 3;
    raw[i] = 30 + Math.floor(x / width * 140) + grain; raw[i + 1] = 45 + Math.floor(y / height * 120) + grain; raw[i + 2] = 90 + grain;
  }
  const original = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
  const input = path.join(source, 'hero.png'); fs.writeFileSync(input, original);
  const stage = path.join(scratch, 'greenfield'), prepared = prepareImages({ source, out: stage }, { projectRoot: root });
  assert.equal(prepared.status, 'ready'); assert.ok(original.length > 5 * 1024 * 1024);
  const entry = verifyPreparedStage(stage, { projectRoot: root }).manifest.entries[0];
  receipt.source = { bytes: original.length, width, height, sha256: imageHash(original) }; receipt.prepared = entry.output;
  console.log('Synthetic photographic source prepared: ' + original.length + ' → ' + entry.output.bytes + ' bytes.');
  await sharp(original).resize({ width: 1200 }).png().toFile(path.join(out, 'source-preview.png'));
  await sharp(path.join(stage, entry.output.path)).resize({ width: 1200 }).png().toFile(path.join(out, 'prepared-preview.png'));
  site = await startVisualSite(root, path.join(out, 'server'), { devOnly: true, prepareStage: ({ stage: owned }) => {
    fs.writeFileSync(path.join(owned, 'src/pages/prepared-media-check.astro'), '---\nimport EmDashImage from "../components/EmDashImage.astro";\nconst src = Astro.url.searchParams.get("src") ?? "";\n---\n<main><EmDashImage src={src} alt="Synthetic prepared photograph" sizes="600px" /></main>\n');
  } });
  const list = () => run(cli, ['media', 'list', '--url', site.origin, '--json', '--limit', '100']);
  const before = (await list()).items.map(item => item.id).sort();
  const metadata = path.join(scratch, 'metadata.json'); fs.writeFileSync(metadata, JSON.stringify({ 'hero.png': { alt: '', caption: 'Prepared greenfield source', credit: 'Synthetic fixture' } }));
  const uploadArgs = ['--stage', stage, '--url', site.origin, '--metadata', metadata];
  const first = await run(path.join(root, 'scripts/upload-prepared-media.mjs'), uploadArgs);
  assert.equal(first.status, 'verified');
  const repeated = await run(path.join(root, 'scripts/upload-prepared-media.mjs'), uploadArgs); assert.equal(repeated.status, 'verified');
  const afterInitial = (await list()).items.map(item => item.id).sort(); assert.equal(afterInitial.length, before.length + 1);
  receipt.steps.push('actual CLI greenfield upload/get/stored-byte verification; repeat created no duplicate');
  console.log('Greenfield upload and repeat verification passed.');
  const uploadReceipt = JSON.parse(fs.readFileSync(first.receipt)), media = uploadReceipt.entries['hero.png'];
  const duplicateStage = path.join(scratch, 'duplicate-identity'); prepareImages({ source, out: duplicateStage }, { projectRoot: root });
  const duplicateMetadata = path.join(scratch, 'duplicate-metadata.json'); fs.writeFileSync(duplicateMetadata, JSON.stringify({ 'hero.png': { alt: 'A different editorial identity', caption: 'Different caption' } }));
  let duplicate;
  try { duplicate = await run(path.join(root, 'scripts/upload-prepared-media.mjs'), ['--stage', duplicateStage, '--url', site.origin, '--metadata', duplicateMetadata]); }
  catch (error) { assert.equal(error.code, 1); duplicate = JSON.parse(error.stdout); }
  assert.equal(duplicate.status, 'needs-reconciliation');
  const originalMedia = await run(cli, ['media', 'get', media.id, '--url', site.origin, '--json']);
  assert.equal(originalMedia.alt ?? '', ''); assert.equal(originalMedia.caption, 'Prepared greenfield source');
  assert.equal((await list()).items.length, afterInitial.length);
  console.log('Actual deduplicated metadata mismatch preserved the existing editorial identity.');
  const storedURL = '/_emdash/api/media/file/' + media.storageKey.split('/').map(encodeURIComponent).join('/');
  const stored = await fetch(site.origin + storedURL); assert.equal(stored.status, 200);
  assert.equal(imageHash(Buffer.from(await stored.arrayBuffer())), entry.output.sha256);
  const html = await (await fetch(site.origin + '/prepared-media-check?src=' + encodeURIComponent(storedURL))).text();
  fs.writeFileSync(path.join(out, 'rendered-image.html'), html);
  const candidate = html.match(/srcset="([^"]+)"/)?.[1].split(',')[0].trim().split(/\s+/)[0].replaceAll('&amp;', '&');
  assert.ok(candidate, 'Native responsive image candidates render');
  const responsive = await fetch(new URL(candidate, site.origin)); assert.equal(responsive.status, 200); assert.match(responsive.headers.get('content-type'), /image\/webp/);
  const responsiveInfo = await sharp(Buffer.from(await responsive.arrayBuffer())).metadata(); assert.ok(responsiveInfo.width <= entry.output.width);
  const secondSource = path.join(scratch, 'maintenance.png');
  await sharp({ create: { width: 90, height: 180, channels: 3, background: '#4a7959' } }).png().toFile(secondSource);
  const secondStage = path.join(scratch, 'day-2'); assert.equal(prepareImages({ source: secondSource, out: secondStage, maxEdge: 64 }, { projectRoot: root }).status, 'ready');
  const secondMetadata = path.join(scratch, 'day-2-metadata.json'); fs.writeFileSync(secondMetadata, JSON.stringify({ 'maintenance.png': { alt: 'New maintenance illustration', caption: 'Day 2' } }));
  assert.equal((await run(path.join(root, 'scripts/upload-prepared-media.mjs'), ['--stage', secondStage, '--url', site.origin, '--metadata', secondMetadata])).status, 'verified');
  const afterMaintenance = (await list()).items.map(item => item.id).sort(); assert.equal(afterMaintenance.length, before.length + 2);
  for (const id of afterInitial) assert.ok(afterMaintenance.includes(id));
  assert.equal(imageHash(imageBytes(input)), imageHash(original));
  receipt.status = 'passed'; receipt.source = { bytes: original.length, width, height, sha256: imageHash(original) }; receipt.prepared = entry.output;
  receipt.steps = ['greenfield preparation and actual CLI upload/get/stored-byte verification', 'repeat operation reverified without creating another item', 'actual deduplicated metadata mismatch required reconciliation and left the original unchanged', 'native EmDashImage rendered and served a WebP responsive candidate', 'new maintenance upload on the same site retained existing media IDs', 'source hash unchanged'];
  receipt.media = { initialRecords: before.length, afterGreenfield: afterInitial.length, afterMaintenance: afterMaintenance.length, greenfieldID: media.id, storedBytesVerified: true, responsiveWidth: responsiveInfo.width };
} catch (error) { receipt.status = 'failed'; receipt.failure = error.message; throw error; }
finally {
  await site?.cleanup();
  assert.equal(path.dirname(scratch), path.join(root, '.emdash/backups')); assert.ok(path.basename(scratch).startsWith('media-preparation-rehearsal-'));
  fs.rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  receipt.cleanup = { ownedServerStopped: true, originalSourcesAndStagesRemoved: true, workingDatabaseCopied: false };
  fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(receipt, null, 2) + '\n');
}
