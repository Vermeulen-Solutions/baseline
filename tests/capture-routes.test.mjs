import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, routeSlug, shotName, summarize, compareSummaries, msysToNative, diffBox } from '../scripts/capture-routes.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Portable: pure argument, naming and comparison logic; no browser is launched.
test('capture:routes arguments reject Git Bash path conversion and incomplete runs', () => {
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'C:/Program Files/Git/', '--out', 'x']), /MSYS_NO_PATHCONV=1/);
  assert.throws(() => parseArgs(['--base', '127.0.0.1:4321', '--routes', '/', '--out', 'x']), /http\(s\) origin/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/']), /--out/);
  const options = parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/,/contact', '--out', 'x', '--frames', '0,900']);
  assert.deepEqual(options.widths, [390, 768, 1440]);
  assert.deepEqual(options.frames, [0, 900]);
  assert.equal(options.repeat, 2);
  assert.deepEqual(parseArgs(['--compare', 'a', 'b']).compare, ['a', 'b']);
});

test('shot names are stable and filesystem-safe', () => {
  assert.equal(routeSlug('/'), 'home');
  assert.equal(routeSlug('/teams/first-team/'), 'teams_first-team');
  assert.equal(shotName('/news/season-opener', 390, 'frame-900'), 'news_season-opener-390-frame-900.png');
});

test('repeated captures flag non-deterministic routes, and comparison keeps them apart from real changes', () => {
  const run = (route, kind, shas) => shas.map(sha => ({ route, width: 1440, kind, sha }));
  const before = summarize([...run('/', 'full', ['a', 'a']), ...run('/about/', 'full', ['x', 'y']), ...run('/contact', 'full', ['c', 'c'])]);
  const after = summarize([...run('/', 'full', ['a', 'a']), ...run('/about/', 'full', ['z', 'z']), ...run('/contact', 'full', ['d', 'd'])]);
  assert.equal(before.find(r => r.route === '/about/').deterministic, false);
  const result = compareSummaries(before, after);
  assert.deepEqual(result.identical, ['/|1440|full']);
  assert.deepEqual(result.nondeterministic, ['/about/|1440|full']);
  assert.deepEqual(result.changed, ['/contact|1440|full']);
  assert.deepEqual(result.missing, []);
});

test('MSYS drive paths are translated on Windows only, and overlay options parse', () => {
  assert.equal(msysToNative('/c/Users/me/evidence', 'win32'), 'C:/Users/me/evidence');
  assert.equal(msysToNative('/d', 'win32'), 'D:/');
  assert.equal(msysToNative('/c/Users/me', 'linux'), '/c/Users/me');
  assert.equal(msysToNative('C:/already', 'win32'), 'C:/already');
  assert.equal(msysToNative('/home/me', 'win32'), '/home/me', 'only single-letter drive segments are translated');
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/', '--out', 'x', '--css', 'missing-overlay.css']), /--css file not found/);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const css = path.join(dir, 'overlay.css'); writeFileSync(css, 'body{}');
    const options = parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/', '--out', 'x', '--css', css, '--click', '[data-pause],.consent button']);
    assert.deepEqual(options.css, [css]);
    assert.deepEqual(options.click, ['[data-pause]', '.consent button']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('diffBox reports the bounding box of differing pixels, including size changes', async () => {
  const { default: sharp } = await import('sharp');
  const dir = mkdtempSync(path.join(os.tmpdir(), 'capture-test-'));
  try {
    const raw = (w, h, mark) => { const data = Buffer.alloc(w * h * 4, 255); if (mark) for (let y = mark.y; y < mark.y + mark.h; y++) for (let x = mark.x; x < mark.x + mark.w; x++) data.fill(0, (y * w + x) * 4, (y * w + x) * 4 + 3); return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer(); };
    const a = path.join(dir, 'a.png'), b = path.join(dir, 'b.png'), c = path.join(dir, 'c.png');
    writeFileSync(a, await raw(20, 10)); writeFileSync(b, await raw(20, 10, { x: 3, y: 2, w: 4, h: 5 })); writeFileSync(c, await raw(20, 12));
    assert.equal(await diffBox(a, a), null);
    assert.deepEqual(await diffBox(a, b), { x: 3, y: 2, width: 4, height: 5, sizes: ['20x10', '20x10'] });
    const grown = await diffBox(a, c);
    assert.equal(grown.y, 10); assert.equal(grown.height, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
