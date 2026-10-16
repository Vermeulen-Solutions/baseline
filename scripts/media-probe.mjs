import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { argumentsOf, bytesOf, requireFact, sha256, isMain, failure } from './infrastructure-io.mjs';

const formats = { jpeg: ['image/jpeg', 'jpg'], png: ['image/png', 'png'], webp: ['image/webp', 'webp'], avif: ['image/avif', 'avif'], heif: ['image/avif', 'avif'], gif: ['image/gif', 'gif'], tiff: ['image/tiff', 'tiff'] };
export async function probeMedia(file, { maxWidth, output } = {}) {
  const bytes = bytesOf(file, 32 * 1024 * 1024);
  requireFact(bytes.length > 0, 'Empty media source');
  const prefix = bytes.subarray(0, 512).toString('utf8').trim();
  if (path.extname(file).toLowerCase() === '.svg' || /<svg[\s>]/i.test(prefix)) return { mimeType: 'image/svg+xml', extension: 'svg', width: null, height: null, frames: 1, treatment: 'vector-review', sha256: sha256(bytes), bytes: bytes.length };
  if (bytes.subarray(0, 5).toString() === '%PDF-') return { mimeType: 'application/pdf', extension: 'pdf', width: null, height: null, frames: 1, treatment: 'document-review', sha256: sha256(bytes), bytes: bytes.length };
  if (path.extname(file).toLowerCase() === '.mp4' && bytes.subarray(4, 8).toString() === 'ftyp') return { mimeType: 'video/mp4', extension: 'mp4', width: null, height: null, frames: null, treatment: 'video-review', sha256: sha256(bytes), bytes: bytes.length };
  sharp.cache({ memory: 16, files: 0, items: 0 }); sharp.concurrency(1);
  const input = sharp(bytes, { animated: true, limitInputPixels: 40000000, sequentialRead: true, failOn: 'warning' });
  const meta = await input.metadata(); requireFact(formats[meta.format], 'Unsupported media format; quarantine without conversion');
  requireFact(meta.format !== 'heif' || meta.compression === 'av1', 'HEIC is not assumed to be AVIF');
  const nativeHeight = meta.pageHeight ?? meta.height;
  const width = meta.orientation >= 5 ? nativeHeight : meta.width, height = meta.orientation >= 5 ? meta.width : nativeHeight, frames = meta.pages ?? 1;
  requireFact(width > 0 && height > 0 && width <= 20000 && height <= 20000 && frames <= 100 && meta.width * meta.height <= 40000000, 'Decoded dimensions/frames exceed bounds');
  await input.clone().stats(); // A readable header alone cannot certify decodable pixels.
  let result = bytes, treatment = frames > 1 ? 'animation-preserve' : 'original-preserve', info;
  if (maxWidth !== undefined) requireFact(Number.isInteger(maxWidth) && maxWidth >= 64 && maxWidth <= 10000, 'Resize profile width outside bounds');
  if (maxWidth && width > maxWidth && frames === 1) {
    requireFact(['jpeg', 'png', 'webp', 'avif'].includes(meta.format), 'Format requires a separately reviewed resize profile');
    const pipeline = sharp(bytes, { limitInputPixels: 40000000, sequentialRead: true }).autoOrient().resize({ width: maxWidth, withoutEnlargement: true }).withIccProfile('srgb');
    const prepared = await pipeline.toFormat(meta.format, meta.format === 'png' ? { compressionLevel: 9 } : { quality: 95 }).toBuffer({ resolveWithObject: true });
    result = prepared.data; info = prepared.info; treatment = 'explicit-resize-srgb-oriented';
  }
  requireFact(result.length <= 32 * 1024 * 1024, 'Prepared bytes exceed bound');
  if (output) fs.writeFileSync(output, result, { flag: 'wx', mode: 0o600 });
  return { mimeType: formats[meta.format][0], extension: formats[meta.format][1], width: info?.width ?? width, height: info?.height ?? height, rawWidth: meta.width, rawHeight: meta.height, orientation: meta.orientation ?? 1, frames, treatment, sha256: sha256(result), bytes: result.length };
}
export function isolatedProbe(file, options = {}) {
  const args = [fileURLToPath(import.meta.url), '--input', file, ...(options.output ? ['--output', options.output] : []), ...(options.maxWidth ? ['--max-width', String(options.maxWidth)] : [])];
  try { return JSON.parse(execFileSync(process.execPath, ['--max-old-space-size=128', ...args], { timeout: 15000, maxBuffer: 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })); }
  catch { return { treatment: 'quarantine', reason: 'Corrupt, unsupported, excessive or timed-out input; source preserved' }; }
}
if (isMain(import.meta.url)) {
  try { const options = argumentsOf(process.argv.slice(2), ['--input', '--output', '--max-width']); requireFact(options.input, 'Explicit input required'); console.log(JSON.stringify(await probeMedia(options.input, { output: options.output, ...(options['max-width'] ? { maxWidth: Number(options['max-width']) } : {}) }))); }
  catch (error) { failure(error); }
}
