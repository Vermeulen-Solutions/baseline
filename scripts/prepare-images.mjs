import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LIMITS = Object.freeze({ bytes: 32 * 1024 * 1024, pixels: 40000000, dimension: 20000, frames: 100, files: 1000, batchBytes: 1024 * 1024 * 1024 });
export const DEFAULT_POLICY = Object.freeze({ preset: 'photo', maxEdge: 2400, quality: 85, maxBytes: 1024 * 1024, reason: '' });
export const requireImageFact = (condition, message) => { if (!condition) throw new Error(message); };
export const imageHash = bytes => createHash('sha256').update(bytes).digest('hex');
export const insideImagePath = (parent, child) => child === parent || child.startsWith(parent + path.sep);
export const safeImageKey = key => typeof key === 'string' && key.length > 0 && Buffer.byteLength(key) <= 1024 && !/[\\:\u0000-\u001f\u007f]/.test(key) && !path.posix.isAbsolute(key) && key.split('/').every(part => part && part !== '.' && part !== '..');

export function imagePath(file) {
  const absolute = path.resolve(file), base = path.parse(absolute).root;
  let current = base;
  for (const part of absolute.slice(base.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { requireImageFact(!fs.lstatSync(current).isSymbolicLink(), 'Linked image paths are refused'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return absolute;
}
export function imageBytes(file, max = LIMITS.bytes) {
  const absolute = imagePath(file), stat = fs.statSync(absolute);
  requireImageFact(stat.isFile() && stat.size <= max, 'Image input exceeds the regular-file or byte limit');
  return fs.readFileSync(absolute);
}
export const imageJSON = file => JSON.parse(imageBytes(file, 4 * 1024 * 1024).toString('utf8'));
export function imageOptions(argv, flags, booleans = []) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const [flag, ...tail] = argv[i].split('=');
    requireImageFact(flags.includes(flag) || booleans.includes(flag), 'Unknown image option: ' + flag);
    const key = flag.slice(2);
    requireImageFact(!Object.hasOwn(options, key), 'Duplicate image option: ' + flag);
    if (booleans.includes(flag)) { requireImageFact(!tail.length, 'Boolean option cannot have a value'); options[key] = true; }
    else { const value = tail.length ? tail.join('=') : argv[++i]; requireImageFact(value && !value.startsWith('--'), 'Missing image option value: ' + flag); options[key] = value; }
  }
  return options;
}
export function imagePolicy(options = {}, defaults = DEFAULT_POLICY) {
  requireImageFact(options && typeof options === 'object' && !Array.isArray(options) && Object.keys(options).every(key => Object.hasOwn(DEFAULT_POLICY, key)), 'Unknown image policy field');
  const policy = { ...defaults, ...options };
  requireImageFact(['photo', 'artwork', 'preserve'].includes(policy.preset), 'Choose photo, artwork or preserve');
  for (const [name, min, max] of [['maxEdge', 64, 10000], ['quality', 1, 100], ['maxBytes', 1024, LIMITS.bytes]]) requireImageFact(Number.isInteger(policy[name]) && policy[name] >= min && policy[name] <= max, 'Invalid image policy: ' + name);
  requireImageFact(typeof policy.reason === 'string' && policy.reason.length <= 2000 && (policy.preset !== 'preserve' || policy.reason.trim()), 'Preserve requires a reason describing the reviewed original');
  return policy;
}
export function writeImageJSON(file, value) {
  imagePath(file);
  const temporary = file + '.pending';
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  for (let attempt = 0; ; attempt++) {
    try { fs.renameSync(temporary, file); break; }
    catch (error) { if (attempt >= 4 || !['EPERM', 'EBUSY', 'EEXIST'].includes(error.code)) throw error; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20); }
  }
}
function writeManifest(directory, manifest) {
  delete manifest.sha256;
  manifest.sha256 = imageHash(JSON.stringify(manifest));
  writeImageJSON(path.join(directory, 'manifest.json'), manifest);
}
export function imageBackupRoot(projectRoot = process.cwd()) {
  const config = path.join(projectRoot, 'baseline.config.json');
  const profile = fs.existsSync(config) ? imageJSON(config).platformProfile : 'emdash';
  requireImageFact(['static', 'static-sveltia', 'emdash'].includes(profile), 'Unknown installed profile');
  return imagePath(path.join(projectRoot, profile === 'emdash' ? '.emdash/backups' : '.baseline/backups'));
}
function stagePath(stage, projectRoot) {
  const directory = imagePath(stage), backup = imageBackupRoot(projectRoot);
  requireImageFact(insideImagePath(backup, directory) && directory !== backup, 'Image stage must be inside this profile\'s ignored backups directory');
  return directory;
}
function refusePreparedSource(source) {
  let parent = fs.statSync(source).isDirectory() ? source : path.dirname(source);
  while (true) {
    const manifest = path.join(parent, 'manifest.json');
    if (fs.existsSync(manifest)) requireImageFact(imageJSON(manifest).kind !== 'baseline-media-preparation', 'Use the original source, not an existing preparation stage');
    const next = path.dirname(parent); if (next === parent) break; parent = next;
  }
}
export function preparedImageName(entry, extension) {
  requireImageFact(/^(jpg|png|webp|avif|gif|tiff|svg)$/.test(extension), 'Unsupported prepared extension');
  const stem = path.posix.basename(entry.path, path.posix.extname(entry.path)).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'image';
  return `${stem}-${entry.id.slice(0, 16)}.${extension}`;
}
function inspectSources(source, defaults, overrides) {
  const directory = fs.statSync(source).isDirectory(), root = directory ? source : path.dirname(source), files = [];
  let visited = 0, total = 0;
  function add(file, key) {
    requireImageFact(files.length < LIMITS.files && safeImageKey(key), 'Source image count or path limit exceeded');
    const stat = fs.lstatSync(imagePath(file));
    requireImageFact(stat.isFile(), 'Source contains a non-file image path');
    total += stat.size; requireImageFact(total <= LIMITS.batchBytes, 'Source batch exceeds the byte limit');
    const policy = imagePolicy(Object.hasOwn(overrides, key) ? overrides[key] : {}, defaults);
    const source = { bytes: stat.size, sha256: stat.size <= LIMITS.bytes ? imageHash(imageBytes(file)) : null };
    const payload = { path: key, source, policy };
    files.push({ id: imageHash(JSON.stringify(payload)), ...payload });
  }
  function walk(relative = '') {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const key = relative ? relative + '/' + entry.name : entry.name;
      requireImageFact(++visited <= 10000 && safeImageKey(key) && !entry.isSymbolicLink(), 'Source image count, link or path limit exceeded');
      if (entry.isDirectory()) walk(key); else add(path.join(root, key), key);
    }
  }
  if (directory) walk(); else add(source, path.basename(source));
  requireImageFact(files.length > 0, 'Source contains no files');
  requireImageFact(Object.keys(overrides).every(key => files.some(file => file.path === key)), 'An image override does not match a source file');
  return { root, files };
}
export function verifyPreparedStage(stage, { projectRoot = process.cwd() } = {}) {
  const directory = stagePath(stage, projectRoot), manifest = imageJSON(path.join(directory, 'manifest.json'));
  const { sha256, ...payload } = manifest;
  requireImageFact(manifest.kind === 'baseline-media-preparation' && manifest.version === 1 && sha256 === imageHash(JSON.stringify(payload)), 'Preparation manifest changed or is unsupported');
  requireImageFact(manifest.planID === imageHash(JSON.stringify(manifest.plan)) && Array.isArray(manifest.entries) && manifest.entries.length === manifest.plan.files.length, 'Preparation plan mismatch');
  const seen = new Set();
  for (const entry of manifest.entries) {
    const original = manifest.plan.files.find(file => file.id === entry.id);
    requireImageFact(original && !seen.has(entry.id) && /^[a-f0-9]{64}$/.test(entry.id) && safeImageKey(entry.path) && ['id', 'path', 'source', 'policy'].every(key => JSON.stringify(entry[key]) === JSON.stringify(original[key])), 'Preparation entry mismatch');
    seen.add(entry.id); imagePolicy(entry.policy);
    if (entry.archivePath) {
      requireImageFact(entry.archivePath === 'originals/' + entry.source.sha256 && imageHash(imageBytes(path.join(directory, entry.archivePath))) === entry.source.sha256, 'Archived original changed');
    }
    if (entry.output) {
      const output = entry.output;
      requireImageFact(['ready', 'review'].includes(entry.status) && output.path === `${entry.status === 'ready' ? 'upload' : 'review'}/${preparedImageName(entry, output.extension)}`, 'Invalid prepared output path');
      const bytes = imageBytes(path.join(directory, output.path));
      requireImageFact(bytes.length === output.bytes && imageHash(bytes) === output.sha256, 'Prepared image changed');
      requireImageFact(entry.status !== 'ready' || entry.policy.reason.trim() || !(output.issues?.length), 'Unresolved image cannot be uploaded');
    } else requireImageFact(['pending', 'rejected'].includes(entry.status), 'Prepared image is missing');
  }
  return { directory, manifest };
}
export function prepareImages({ source, out, preset, maxEdge, quality, maxBytes, reason, overrides = {}, resume = false }, { projectRoot = process.cwd() } = {}) {
  requireImageFact(source && out, 'Explicit --source and --out are required');
  const input = imagePath(source), directory = stagePath(out, projectRoot);
  refusePreparedSource(input);
  requireImageFact(!insideImagePath(directory, input) && !(fs.statSync(input).isDirectory() && insideImagePath(input, directory)), 'Source and preparation stage must not overlap');
  requireImageFact(overrides && typeof overrides === 'object' && !Array.isArray(overrides) && Object.keys(overrides).every(safeImageKey), 'Overrides must map source-relative paths to image policy fields');
  const defaults = imagePolicy(Object.fromEntries(Object.entries({ preset, maxEdge, quality, maxBytes, reason }).filter(([, value]) => value !== undefined)));
  const inventory = inspectSources(input, defaults, overrides), plan = { defaults, files: inventory.files }, planID = imageHash(JSON.stringify(plan));
  if (!resume) {
    requireImageFact(!fs.existsSync(directory), 'Output stage already exists; use --resume with identical source/policy or choose a new stage');
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  const lockFile = path.join(directory, 'prepare.lock'), lock = fs.openSync(lockFile, 'wx');
  try {
    let manifest;
    if (resume) {
      manifest = verifyPreparedStage(directory, { projectRoot }).manifest;
      requireImageFact(manifest.planID === planID, 'Source or policy changed; resume requires the original selection and options');
    } else {
      manifest = { kind: 'baseline-media-preparation', version: 1, createdAt: new Date().toISOString(), planID, plan, entries: plan.files.map(file => ({ ...file, status: 'pending' })) };
      writeManifest(directory, manifest);
    }
    for (const folder of ['originals', 'upload', 'review', 'pending']) fs.mkdirSync(path.join(directory, folder), { recursive: true });
    for (const entry of manifest.entries) {
      if (entry.status !== 'pending') continue;
      if (!entry.source.sha256) { entry.status = 'rejected'; entry.reason = 'Source exceeds the 32 MiB input limit; provide a bounded source export'; writeManifest(directory, manifest); continue; }
      const sourceFile = path.join(inventory.root, entry.path), bytes = imageBytes(sourceFile);
      requireImageFact(imageHash(bytes) === entry.source.sha256, 'Source changed during preparation');
      entry.archivePath = 'originals/' + entry.source.sha256;
      const archive = path.join(directory, entry.archivePath);
      if (!fs.existsSync(archive)) fs.writeFileSync(archive, bytes, { flag: 'wx', mode: 0o600 });
      requireImageFact(imageHash(imageBytes(archive)) === entry.source.sha256, 'Original archive changed');
      writeManifest(directory, manifest);
      const candidate = path.join(directory, 'pending', entry.id);
      requireImageFact(!fs.existsSync(candidate), 'An interrupted candidate remains; inspect it and use a new stage');
      let result;
      try {
        result = JSON.parse(execFileSync(process.execPath, ['--max-old-space-size=128', fileURLToPath(new URL('./prepare-image.mjs', import.meta.url))], { input: JSON.stringify({ source: archive, output: candidate, policy: entry.policy }), encoding: 'utf8', timeout: 15000, maxBuffer: 65536, stdio: ['pipe', 'pipe', 'pipe'] }));
      } catch { result = { status: 'rejected', reason: 'Image decoding/encoding exceeded its limits or failed; original archived' }; }
      if (!result.output) { entry.status = 'rejected'; entry.reason = result.reason; }
      else {
        requireImageFact(['ready', 'review'].includes(result.status), 'Unexpected image worker status');
        const output = result.output, outputPath = `${result.status === 'ready' ? 'upload' : 'review'}/${preparedImageName(entry, output.extension)}`;
        const candidateBytes = imageBytes(candidate);
        requireImageFact(imageHash(candidateBytes) === output.sha256 && candidateBytes.length === output.bytes, 'Image worker output mismatch');
        requireImageFact(!fs.existsSync(path.join(directory, outputPath)), 'Prepared filename collision');
        fs.renameSync(candidate, path.join(directory, outputPath));
        entry.status = result.status; entry.output = { ...output, path: outputPath };
      }
      writeManifest(directory, manifest);
    }
    manifest.summary = { files: manifest.entries.length, ready: manifest.entries.filter(entry => entry.status === 'ready').length, review: manifest.entries.filter(entry => entry.status === 'review').length, rejected: manifest.entries.filter(entry => entry.status === 'rejected').length, sourceBytes: manifest.entries.reduce((sum, entry) => sum + entry.source.bytes, 0), preparedBytes: manifest.entries.reduce((sum, entry) => sum + (entry.output?.bytes ?? 0), 0) };
    writeManifest(directory, manifest);
    verifyPreparedStage(directory, { projectRoot });
    return { ...manifest.summary, status: manifest.entries.every(entry => entry.status === 'ready') ? 'ready' : 'needs-review', exitCode: manifest.entries.every(entry => entry.status === 'ready') ? 0 : 1, manifest: path.join(directory, 'manifest.json') };
  } finally { fs.closeSync(lock); fs.unlinkSync(lockFile); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = imageOptions(process.argv.slice(2), ['--source', '--out', '--preset', '--max-edge', '--quality', '--max-bytes', '--reason', '--overrides'], ['--resume']);
    const result = prepareImages({ source: options.source, out: options.out, preset: options.preset, reason: options.reason, resume: options.resume, ...(options['max-edge'] !== undefined && { maxEdge: Number(options['max-edge']) }), ...(options.quality !== undefined && { quality: Number(options.quality) }), ...(options['max-bytes'] !== undefined && { maxBytes: Number(options['max-bytes']) }), ...(options.overrides && { overrides: imageJSON(options.overrides) }) });
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.exitCode;
  } catch (error) { console.error(JSON.stringify({ status: 'refused', error: error.message })); process.exitCode = 2; }
}
