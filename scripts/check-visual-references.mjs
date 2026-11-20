// Visual reference images (tests/visual/baselines/<platform>/) are rendered and compared only on
// a local Windows machine (`npm run test:visual`), so CI cannot tell whether they are current. It
// can tell whether they are recorded: every PNG must be listed in the folder's manifest.json with
// its SHA-256, and every listed file must exist. `npm run test:visual:update` writes both together.
//
//   node scripts/check-visual-references.mjs                       check every platform folder
//   node scripts/check-visual-references.mjs --notice-base <ref>   also print a CI notice when the
//                                                                  diff since <ref> changes styles,
//                                                                  components or layouts without
//                                                                  touching the references
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const REFERENCES = 'tests/visual/baselines';
export const RENDERED_SOURCE = [/^src\/styles\//, /^src\/components\//, /^src\/layouts\//];

export function checkReferenceFolder(directory) {
  const manifestPath = path.join(directory, 'manifest.json');
  if (!existsSync(manifestPath)) return { unrecorded: [], missing: [], changed: [], error: 'manifest.json is missing' };
  let recorded;
  try { recorded = JSON.parse(readFileSync(manifestPath, 'utf8')).files; }
  catch (error) { return { unrecorded: [], missing: [], changed: [], error: `manifest.json is not valid JSON (${error.message})` }; }
  if (!recorded || typeof recorded !== 'object') return { unrecorded: [], missing: [], changed: [], error: 'manifest.json has no "files" record' };
  const onDisk = readdirSync(directory, { recursive: true }).map(name => String(name).replaceAll('\\', '/')).filter(name => name.endsWith('.png')).sort();
  const unrecorded = [], changed = [];
  for (const name of onDisk) {
    if (!Object.hasOwn(recorded, name)) { unrecorded.push(name); continue; }
    const sha256 = createHash('sha256').update(readFileSync(path.join(directory, name))).digest('hex');
    if (sha256 !== recorded[name]) changed.push(name);
  }
  const missing = Object.keys(recorded).filter(name => !onDisk.includes(name)).sort();
  return { unrecorded, missing, changed };
}

export function referenceFolders(base = path.join(root, REFERENCES)) {
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => path.join(base, entry.name)).sort();
}

// Returns the notice text, or null when the change needs none.
export function referenceNotice(changedFiles) {
  const files = changedFiles.map(file => file.replaceAll('\\', '/'));
  const rendered = files.filter(file => RENDERED_SOURCE.some(pattern => pattern.test(file)));
  if (!rendered.length || files.some(file => file.startsWith(`${REFERENCES}/`))) return null;
  const shown = rendered.slice(0, 5).join(', ') + (rendered.length > 5 ? ` and ${rendered.length - 5} more` : '');
  return `This change touches rendered starter source (${shown}) but no visual reference image. CI cannot render the Windows references. Before merging, run npm run test:visual on Windows; if a difference is intended, review it, run npm run test:visual:update and commit the renewed images with manifest.json.`;
}

function changedSince(base) {
  const result = spawnSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git diff against ${base} failed: ${(result.stderr || result.error?.message || '').trim()}`);
  return result.stdout.split('\n').map(line => line.trim()).filter(Boolean);
}

function main(args) {
  let noticeBase;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--notice-base' && args[index + 1]) noticeBase = args[++index];
    else throw new Error('Usage: node scripts/check-visual-references.mjs [--notice-base <git ref>]');
  }
  const folders = referenceFolders();
  if (!folders.length) throw new Error(`No reference folders under ${REFERENCES}/`);
  let failed = false;
  for (const folder of folders) {
    const label = path.relative(root, folder).replaceAll('\\', '/');
    const { unrecorded, missing, changed, error } = checkReferenceFolder(folder);
    if (error) { console.error(`${label}: ${error}`); failed = true; continue; }
    const problems = [
      ...unrecorded.map(name => `  not in manifest.json: ${name}`),
      ...missing.map(name => `  listed but missing: ${name}`),
      ...changed.map(name => `  SHA-256 differs from manifest.json: ${name}`),
    ];
    if (problems.length) {
      failed = true;
      console.error(`${label}: reference images and manifest.json disagree\n${problems.join('\n')}`);
    } else console.log(`${label}: ${readdirSync(folder, { recursive: true }).filter(name => String(name).endsWith('.png')).length} reference images match manifest.json`);
  }
  if (failed) {
    console.error('Renew the references with npm run test:visual:update on Windows (it rewrites manifest.json), review the images, and commit both together.');
    process.exitCode = 1;
  }
  if (noticeBase) {
    // Advisory only: a notice never fails CI, and an unreachable base skips it.
    try {
      const notice = referenceNotice(changedSince(noticeBase));
      if (notice) console.log(`::notice title=Visual references not renewed::${notice}`);
    } catch (error) { console.log(`Visual reference notice skipped: ${error.message}`); }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(`Visual reference check failed: ${error.message}`); process.exitCode = 1; }
}
