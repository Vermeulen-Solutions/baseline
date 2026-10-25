import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { imageBytes, imageHash, imageJSON, imageOptions, imagePath, requireImageFact, safeImageKey, verifyPreparedStage, writeImageJSON, LIMITS } from './prepare-images.mjs';

export function preparedMediaTarget(url) {
  const target = new URL(url);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname);
  requireImageFact((target.protocol === 'https:' || target.protocol === 'http:' && loopback) && target.pathname === '/' && !target.username && !target.password && !target.search && !target.hash, 'Provide an explicit HTTPS site origin or loopback HTTP origin');
  return target.origin;
}
function installedCLI(origin, projectRoot) {
  const cli = fileURLToPath(import.meta.resolve('emdash')).replace(/index\.mjs$/, 'cli/index.mjs');
  return async args => {
    try { const { stdout } = await promisify(execFile)(process.execPath, [cli, ...args, '--url', origin, '--json'], { cwd: projectRoot, timeout: 60000, maxBuffer: 1024 * 1024, encoding: 'utf8', windowsHide: true }); return JSON.parse(stdout); }
    catch { throw new Error('Installed EmDash CLI request failed; check this target\'s login, scope and proxy configuration before reconciling'); }
  };
}
function downloadHeaders() {
  const headers = {};
  for (const line of (process.env.EMDASH_HEADERS ?? '').split(/\r?\n/).filter(Boolean)) {
    const colon = line.indexOf(':'); requireImageFact(colon > 0, 'Invalid EMDASH_HEADERS entry');
    headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  if (process.env.EMDASH_TOKEN) headers.Authorization = 'Bearer ' + process.env.EMDASH_TOKEN;
  return headers;
}
async function storedBytes(origin, key, request) {
  requireImageFact(safeImageKey(key), 'Unsupported returned CMS storage key');
  const response = await request(origin + '/_emdash/api/media/file/' + key.split('/').map(encodeURIComponent).join('/'), { redirect: 'error', signal: AbortSignal.timeout(30000), headers: downloadHeaders() });
  requireImageFact(response.ok, 'Stored bytes could not be verified; provide required EMDASH_HEADERS for a protected site');
  let length = 0; const chunks = [];
  for await (const chunk of response.body) { length += chunk.length; requireImageFact(length <= LIMITS.bytes, 'Stored media exceeds the byte verification limit'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
export async function uploadPreparedMedia({ stage, url, metadata, adopt = {} }, { projectRoot = process.cwd(), cli, request = fetch } = {}) {
  const origin = preparedMediaTarget(url), { directory, manifest } = verifyPreparedStage(stage, { projectRoot });
  requireImageFact(manifest.entries.every(entry => entry.status === 'ready'), 'Resolve all rejected/review images before uploading this batch');
  requireImageFact(metadata && typeof metadata === 'object' && !Array.isArray(metadata) && Object.keys(metadata).every(key => manifest.entries.some(entry => entry.path === key)), 'Metadata must map prepared source paths to editorial metadata');
  for (const entry of manifest.entries) {
    const value = metadata[entry.path];
    requireImageFact(value && Object.hasOwn(value, 'alt') && typeof value.alt === 'string' && ['alt', 'caption', 'credit', 'provenance'].every(key => value[key] === undefined || typeof value[key] === 'string' && value[key].length <= 4096) && Object.keys(value).every(key => ['alt', 'caption', 'credit', 'provenance'].includes(key)), 'Every image needs explicit alt (including intentional empty alt); caption, credit and provenance are optional');
  }
  requireImageFact(adopt && typeof adopt === 'object' && !Array.isArray(adopt) && Object.entries(adopt).every(([key, id]) => manifest.entries.some(entry => entry.path === key) && typeof id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(id)), 'Adoption must map source paths to known media IDs');
  const run = cli ?? installedCLI(origin, projectRoot), identity = imageHash(origin).slice(0, 16);
  const receiptFile = path.join(directory, 'upload-' + identity + '.json'), lockFile = path.join(directory, 'upload.lock');
  const lock = fs.openSync(imagePath(lockFile), 'wx');
  try {
    const metadataSHA256 = imageHash(JSON.stringify(metadata));
    const receipt = fs.existsSync(receiptFile) ? imageJSON(receiptFile) : { version: 1, target: origin, planID: manifest.planID, manifestSHA256: manifest.sha256, metadataSHA256, entries: {} };
    requireImageFact(receipt.version === 1 && receipt.target === origin && receipt.planID === manifest.planID && receipt.manifestSHA256 === manifest.sha256 && receipt.metadataSHA256 === metadataSHA256, 'Upload receipt target, preparation or metadata changed; reconcile the original operation first');
    requireImageFact(receipt.entries && typeof receipt.entries === 'object' && !Array.isArray(receipt.entries), 'Invalid upload receipt entries');
    receipt.entries = Object.assign(Object.create(null), receipt.entries);
    requireImageFact(Array.isArray((await run(['media', 'list', '--limit', '1'])).items), 'Selected instance returned an unsupported media list');
    let failed = 0;
    for (const entry of manifest.entries) {
      const previous = receipt.entries[entry.path], values = metadata[entry.path];
      try {
        const adoptedID = Object.hasOwn(adopt, entry.path) ? adopt[entry.path] : undefined;
        let id = adoptedID ?? previous?.id;
        if (previous && !id) { failed++; continue; }
        if (!previous && !id) {
          requireImageFact(imageHash(imageBytes(path.join(directory, entry.output.path))) === entry.output.sha256, 'Prepared file changed before upload');
          // The POST may succeed even if its response is lost. Persist before sending.
          receipt.entries[entry.path] = { status: 'uploading', sourceSHA256: entry.source.sha256, outputSHA256: entry.output.sha256, metadata: values };
          writeImageJSON(receiptFile, receipt);
          const args = ['media', 'upload', path.join(directory, entry.output.path), '--alt=' + values.alt];
          if (values.caption !== undefined) args.push('--caption=' + values.caption);
          const uploaded = await run(args);
          requireImageFact(typeof uploaded.id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(uploaded.id), 'Upload response lacks a supported media ID');
          id = uploaded.id;
          receipt.entries[entry.path] = { ...receipt.entries[entry.path], id, status: 'needs-verification' }; writeImageJSON(receiptFile, receipt);
        }
        requireImageFact(typeof id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(id), 'Invalid stored media ID');
        const item = await run(['media', 'get', id]), key = item.storageKey ?? item.key;
        requireImageFact(item.id === id && item.mimeType === entry.output.mimeType && item.size === entry.output.bytes && (item.alt ?? '') === values.alt && (values.caption === undefined || (item.caption ?? '') === values.caption), 'Returned/deduplicated media metadata differs; reconcile without overwriting another record');
        const bytes = await storedBytes(origin, key, request);
        requireImageFact(imageHash(bytes) === entry.output.sha256, 'Stored bytes differ from the prepared image');
        if (entry.output.width) {
          // Verify decoded dimensions as well; not every EmDash version fills the DB fields on CLI upload.
          const { default: sharp } = await import('sharp');
          const info = await sharp(bytes, { animated: true, limitInputPixels: LIMITS.pixels }).metadata();
          const nativeHeight = info.pageHeight ?? info.height;
          const width = info.orientation >= 5 ? nativeHeight : info.width, height = info.orientation >= 5 ? info.width : nativeHeight;
          requireImageFact(width === entry.output.width && height === entry.output.height && (info.pages ?? 1) === entry.output.frames, 'Stored image dimensions/frames differ');
          requireImageFact((item.width == null || item.width === width) && (item.height == null || item.height === height), 'CMS dimension metadata differs from stored image');
        }
        receipt.entries[entry.path] = { status: 'verified', id, storageKey: key, sourceSHA256: entry.source.sha256, outputSHA256: entry.output.sha256, bytes: entry.output.bytes, width: entry.output.width, height: entry.output.height, metadata: values };
      } catch (error) {
        failed++;
        receipt.entries[entry.path] = { ...receipt.entries[entry.path], ...(Object.hasOwn(adopt, entry.path) && { id: adopt[entry.path] }), status: 'needs-reconciliation', reason: error.message };
      }
      writeImageJSON(receiptFile, receipt);
    }
    const verifiedEntries = Object.values(receipt.entries).filter(entry => entry.status === 'verified');
    return { status: failed ? 'needs-reconciliation' : 'verified', exitCode: failed ? 1 : 0, target: origin, verified: verifiedEntries.length, failed, sourceBytes: manifest.summary.sourceBytes, preparedBytes: manifest.summary.preparedBytes, verifiedBytes: verifiedEntries.reduce((sum, entry) => sum + entry.bytes, 0), receipt: receiptFile };
  } finally { fs.closeSync(lock); fs.unlinkSync(lockFile); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = imageOptions(process.argv.slice(2), ['--stage', '--url', '--metadata', '--adopt']);
    requireImageFact(options.stage && options.url && options.metadata, 'Explicit --stage, --url and --metadata are required');
    const result = await uploadPreparedMedia({ stage: options.stage, url: options.url, metadata: imageJSON(options.metadata), ...(options.adopt && { adopt: imageJSON(options.adopt) }) });
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.exitCode;
  } catch (error) { console.error(JSON.stringify({ status: 'refused', error: error.message })); process.exitCode = 2; }
}
