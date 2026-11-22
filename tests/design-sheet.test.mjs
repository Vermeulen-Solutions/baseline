import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { makeSheet, parseArgs, sheetLayout } from '../scripts/design-sheet.mjs';

test('every image is cut at the same number of screens and scaled to one column', () => {
  const layout = sheetLayout([{ width: 1440, height: 6000 }, { width: 1440, height: 1200 }, { width: 2880, height: 9000 }], { column: 720, screens: 2.5 });
  assert.deepEqual(layout.columns.map((c) => c.cut), [2250, 1200, 4500]);
  assert.deepEqual(layout.columns.map((c) => c.scaledHeight), [1125, 600, 1125]);
  assert.deepEqual(layout.columns.map((c) => c.left), [0, 736, 1472]);
  assert.equal(layout.width, 2192);
  assert.equal(layout.height, 28 + 1125);
});

test('arguments need the page, a reference and an output', () => {
  // One page on its own is a sheet too: Stage 5 asks for a page-only sheet beside the comparison.
  // A single image passes the count check and is then looked for on disk like any other.
  assert.throws(() => parseArgs(['--images', 'one.png', '--out', 'x.jpg']), /Image not found: one.png/);
  assert.throws(() => parseArgs(['--images', ',', '--out', 'x.jpg']), /at least one image/);
  assert.throws(() => parseArgs(['--images', 'a.png,b.png']), /--out/);
  assert.throws(() => parseArgs(['--images', 'missing-a.png,missing-b.png', '--out', 'x.jpg']), /Image not found/);
});

test('a sheet is written with the page and its references side by side', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'design-sheet-'));
  try {
    const page = path.join(dir, 'page.png');
    const reference = path.join(dir, 'ref.png');
    await sharp({ create: { width: 1440, height: 3000, channels: 3, background: '#d9c6a5' } }).png().toFile(page);
    await sharp({ create: { width: 1440, height: 5000, channels: 3, background: '#203040' } }).png().toFile(reference);
    const out = path.join(dir, 'sheet.png');
    const result = await makeSheet({ images: [page, reference], labels: ['This page', 'Reference a'], column: 360, height: 2, out });
    const meta = await sharp(out).metadata();
    assert.equal(result.columns, 2);
    assert.deepEqual([meta.width, meta.height], [736, 28 + 450]);
    const { data } = await sharp(out).extract({ left: 380, top: 200, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([...data].slice(0, 3), [0x20, 0x30, 0x40]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
