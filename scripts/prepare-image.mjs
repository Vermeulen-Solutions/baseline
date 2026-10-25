import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { LIMITS, imageBytes, imageFrameCount, imageHash, imagePath, imagePolicy, requireImageFact } from './prepare-images.mjs';

const formats = { jpeg: ['jpg', 'image/jpeg'], png: ['png', 'image/png'], webp: ['webp', 'image/webp'], avif: ['avif', 'image/avif'], heif: ['avif', 'image/avif'], gif: ['gif', 'image/gif'], tiff: ['tiff', 'image/tiff'] };
export async function prepareImage({ source, output, policy }) {
  policy = imagePolicy(policy);
  const bytes = imageBytes(source);
  requireImageFact(bytes.length > 0, 'Empty image source');
  sharp.cache({ memory: 16, files: 0, items: 0 }); sharp.concurrency(1);
  const svg = /^(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(bytes.subarray(0, 4096).toString('utf8').replace(/^\uFEFF/, '').trimStart());
  let width, height, frames = 1, extension, mimeType, treatment, result = bytes;
  if (svg) {
    requireImageFact(policy.preset === 'preserve', 'SVG requires a reviewed preserve preset; no automatic rasterization or sanitation');
    extension = 'svg'; mimeType = 'image/svg+xml'; width = null; height = null; treatment = 'reviewed-original';
  } else {
    const input = sharp(bytes, { animated: true, limitInputPixels: LIMITS.pixels, sequentialRead: true, failOn: 'warning' }), meta = await input.metadata();
    requireImageFact(formats[meta.format] && (meta.format !== 'heif' || meta.compression === 'av1'), 'Unsupported image type; provide a supported image export');
    frames = imageFrameCount(bytes, meta);
    const nativeHeight = meta.pageHeight ?? meta.height;
    width = meta.orientation >= 5 ? nativeHeight : meta.width; height = meta.orientation >= 5 ? meta.width : nativeHeight;
    requireImageFact(width > 0 && height > 0 && width <= LIMITS.dimension && height <= LIMITS.dimension && Math.max(meta.width * meta.height, width * height * frames) <= LIMITS.pixels, 'Image dimensions, combined pixels or frames exceed the preparation limit');
    await input.clone().stats();
    requireImageFact(policy.preset !== 'artwork' || !meta.depth || meta.depth === 'uchar', 'High-bit-depth artwork requires a reviewed preserve preset; WebP lossless encodes 8-bit pixels');
    [extension, mimeType] = formats[meta.format];
    requireImageFact(frames === 1 || policy.preset === 'preserve', 'Animation/multiple pages require a reviewed preserve preset; no automatic flattening');
    const needsOrientation = meta.orientation && meta.orientation !== 1;
    if (policy.preset === 'preserve') treatment = 'reviewed-original';
    else if (!needsOrientation && Math.max(width, height) <= policy.maxEdge && bytes.length <= policy.maxBytes) treatment = 'already-within-policy';
    else {
      const candidate = await sharp(bytes, { limitInputPixels: LIMITS.pixels, failOn: 'warning' }).autoOrient().resize({ width: policy.maxEdge, height: policy.maxEdge, fit: 'inside', withoutEnlargement: true }).withIccProfile('srgb').webp({ quality: policy.quality, lossless: policy.preset === 'artwork', alphaQuality: 100, effort: 5 }).toBuffer();
      requireImageFact(candidate.length <= LIMITS.bytes, 'Prepared image exceeds the output byte limit');
      const decoded = sharp(candidate, { limitInputPixels: LIMITS.pixels, failOn: 'warning' }), info = await decoded.metadata();
      await decoded.stats();
      requireImageFact(info.format === 'webp' && (info.pages ?? 1) === 1 && info.width <= policy.maxEdge && info.height <= policy.maxEdge, 'Prepared image failed format/dimension verification');
      if (!needsOrientation && candidate.length >= bytes.length && Math.max(width, height) <= policy.maxEdge) treatment = 'smaller-original-retained';
      else { result = candidate; width = info.width; height = info.height; extension = 'webp'; mimeType = 'image/webp'; treatment = policy.preset === 'artwork' ? 'lossless-webp-srgb-oriented' : 'photo-webp-srgb-oriented'; }
    }
  }
  const issues = result.length > policy.maxBytes ? ['Stored image exceeds the byte review threshold'] : [];
  const status = issues.length && !policy.reason.trim() ? 'review' : 'ready';
  requireImageFact(imagePath(source) !== imagePath(output), 'Image output must differ from source');
  fs.writeFileSync(output, result, { flag: 'wx', mode: 0o600 });
  return { status, output: { sha256: imageHash(result), bytes: result.length, width, height, frames, extension, mimeType, treatment, issues } };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { const input = fs.readFileSync(0, 'utf8'); requireImageFact(Buffer.byteLength(input) <= 16384, 'Image worker request is too large'); console.log(JSON.stringify(await prepareImage(JSON.parse(input)))); }
  catch (error) { console.log(JSON.stringify({ status: 'rejected', reason: error.message })); }
}
