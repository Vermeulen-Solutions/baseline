import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, parseBoard, localizeBoard, frameMismatch } from '../scripts/canvas-board-check.mjs';

// Portable: parsing and comparison only; no browser is launched.
const id = 'a'.repeat(32), other = 'b'.repeat(32);
const board = `<!doctype html><html lang="en"><head><script src="./support.js"></script></head><body>
<x-dc>
<helmet>
<style>body{margin:0}</style>
</helmet>
<div style="width: 1950px; height: 3381px">
<img src="/_blob/${id}" alt="Page at 1440" style="width: 1440px; height: 2491px; display: block">
<img src="/_blob/${other}" alt="Page at 390" style="width: 390px; height: 3301px; display: block">
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1950,"height":3381}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script></body></html>`;

test('canvas check arguments need boards, and the asset folder and map together', () => {
  assert.throws(() => parseArgs([]), /at least one board/);
  assert.throws(() => parseArgs(['notes.html']), /not a \.dc\.html board/);
  assert.throws(() => parseArgs(['--assets', 'renders', 'Main.dc.html']), /--assets and --map go together/);
  assert.throws(() => parseArgs(['--nope', 'Main.dc.html']), /Unknown option/);
  const options = parseArgs(['--assets', 'renders', '--map', 'blob-map.json', '--canvas', 'canvas.json', 'Main.dc.html', 'A-home.dc.html']);
  assert.deepEqual(options.boards, ['Main.dc.html', 'A-home.dc.html']);
  assert.equal(options.canvas, 'canvas.json');
});

test('a board yields its frame, page styles, asset ids and declared image sizes', () => {
  const parsed = parseBoard(board);
  assert.deepEqual(parsed.preview, { width: 1950, height: 3381 });
  assert.match(parsed.helmet, /body\{margin:0\}/);
  assert.deepEqual(parsed.blobs, [id, other]);
  assert.deepEqual(parsed.images, [{ id, width: 1440, height: 2491 }, { id: other, width: 390, height: 3301 }]);
  assert.ok(!parsed.body.includes('<helmet>'));
  assert.throws(() => parseBoard('<html><body>plain page</body></html>'), /not a Design Component board/);
});

test('uploaded asset addresses become local files and missing ones are listed once', () => {
  const { body } = parseBoard(board);
  const { html, unmapped } = localizeBoard(body + `<img src="/_blob/${other}">`, { [id]: 'page-1440.jpg' }, name => `file:///renders/${name}`);
  assert.match(html, /src="file:\/\/\/renders\/page-1440\.jpg"/);
  assert.deepEqual(unmapped, [other]);
  assert.match(html, new RegExp(`/_blob/${other}`));
});

test('the canvas frame is compared with the frame the board declares', () => {
  const canvas = { boards: { 'Main.dc.html': { x: 0, y: 0, w: 1950, h: 3381 }, 'Short.dc.html': { x: 0, y: 0, w: 1950, h: 3000 } } };
  assert.equal(frameMismatch(canvas, 'Main.dc.html', { width: 1950, height: 3381 }), null);
  assert.match(frameMismatch(canvas, 'Short.dc.html', { width: 1950, height: 3381 }), /canvas\.json frame 1950x3000, board \$preview 1950x3381/);
  assert.match(frameMismatch(canvas, 'Absent.dc.html', { width: 10, height: 10 }), /no frame for Absent\.dc\.html/);
});
