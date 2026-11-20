import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkReferenceFolder, referenceFolders, referenceNotice } from '../scripts/check-visual-references.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('every committed visual reference image is recorded in its manifest with a matching hash', () => {
  const folders = referenceFolders();
  assert.ok(folders.length, 'expected at least one reference folder');
  for (const folder of folders) assert.deepEqual(checkReferenceFolder(folder), { unrecorded: [], missing: [], changed: [] }, folder);
});

test('the reference check reports unrecorded, missing and changed images', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-visual-references-'));
  try {
    mkdirSync(path.join(directory, 'chromium-390'));
    writeFileSync(path.join(directory, 'chromium-390', 'home.png'), 'home');
    writeFileSync(path.join(directory, 'chromium-390', 'post.png'), 'post, renewed');
    writeFileSync(path.join(directory, 'chromium-390', 'gallery.png'), 'gallery');
    writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ files: {
      'chromium-390/home.png': sha256('home'),
      'chromium-390/post.png': sha256('post'),
      'chromium-390/page.png': sha256('page'),
    } }));
    assert.deepEqual(checkReferenceFolder(directory), { unrecorded: ['chromium-390/gallery.png'], missing: ['chromium-390/page.png'], changed: ['chromium-390/post.png'] });
    writeFileSync(path.join(directory, 'manifest.json'), '{}');
    assert.match(checkReferenceFolder(directory).error, /no "files" record/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('changing rendered source without the references asks for a visual run, as a notice only', () => {
  assert.match(referenceNotice(['src/styles/global.css']), /npm run test:visual/);
  assert.match(referenceNotice(['src/components/Card.astro', 'src/layouts/Base.astro']), /Card\.astro, src\/layouts\/Base\.astro/);
  assert.equal(referenceNotice(['src/styles/global.css', 'tests/visual/baselines/win32/manifest.json']), null);
  assert.equal(referenceNotice(['src/pages/index.astro', 'docs/standards-releases.md']), null);
  assert.equal(referenceNotice([]), null);
});
