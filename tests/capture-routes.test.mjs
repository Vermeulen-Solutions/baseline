import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, routeSlug, shotName, summarize, compareSummaries, msysToNative, diffBox, DECLINE, isBotWall } from '../scripts/capture-routes.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Portable: pure argument, naming and comparison logic; no browser is launched.
test('capture:routes arguments undo Git Bash path conversion and reject incomplete runs', () => {
  assert.deepEqual(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'C:/Program Files/Git/,C:/Program Files/Git/contact', '--out', 'x']).routes, ['/', '/contact'], 'Git Bash rewrites are undone');
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'D:/sites/page', '--out', 'x']), /MSYS_NO_PATHCONV=1/);
  assert.throws(() => parseArgs(['--base', '127.0.0.1:4321', '--routes', '/', '--out', 'x']), /http\(s\) origin/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/']), /--out/);
  const options = parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/,/contact', '--out', 'x', '--frames', '0,900']);
  assert.deepEqual(options.widths, [390, 768, 1440]);
  assert.deepEqual(options.frames, [0, 900]);
  assert.equal(options.motion, undefined, 'captures use reduced motion unless asked');
  assert.equal(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/', '--out', 'x', '--motion']).motion, true, '--motion captures with full motion and a load frame');
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

test('reference captures decline consent banners and skip bot walls', () => {
  for (const label of ['Tout refuser', 'Refuser', 'Continuer sans accepter', 'Reject all', 'Only necessary', 'Alle ablehnen', 'Nur notwendige Cookies', 'Rifiuta tutto']) assert.match(label, DECLINE, label);
  for (const label of ['Accepter', 'Accept all', 'Paramètres', 'Refuser les conditions de vente du magasin']) assert.doesNotMatch(label, DECLINE, label);
  assert.equal(isBotWall('Just a moment...', 'Checking your browser before accessing'), true);
  assert.equal(isBotWall('Atelier du bois', 'Sculptures en bois de chêne. Accès au parking derrière l\'atelier.'), false);
  assert.equal(parseArgs(['--base', 'https://example.org', '--routes', '/', '--out', 'x', '--decline-consent']).declineConsent, true);
});

test('--wait lets a preloader settle before the capture', () => {
  const base = ['--base', 'http://127.0.0.1:4321', '--routes', '/', '--out', 'x'];
  assert.equal(parseArgs([...base, '--wait', '8000']).wait, 8000);
  assert.throws(() => parseArgs([...base, '--wait', '60000']), /--wait must be milliseconds/);
});

test('--route-timeout bounds each route (seconds), 180 by default', () => {
  const base = ['--base', 'http://127.0.0.1:4321', '--routes', '/', '--out', 'x'];
  assert.equal(parseArgs(base).routeTimeout, 180000);
  assert.equal(parseArgs([...base, '--route-timeout', '60']).routeTimeout, 60000);
  assert.throws(() => parseArgs([...base, '--route-timeout', '5']), /--route-timeout must be/);
});

test('a loopback origin that does not answer falls back to the name that does', async () => {
  const { reachableBase } = await import('../scripts/capture-routes.mjs');
  const said = [];
  const log = (line) => said.push(line);
  const up = (...origins) => async (origin) => origins.includes(origin);
  // The origin as given answers: it is used unchanged and nothing is said.
  assert.equal(await reachableBase('http://127.0.0.1:4321', { probe: up('http://127.0.0.1:4321'), log }), 'http://127.0.0.1:4321');
  assert.deepEqual(said, []);
  // A dev server that listens on localhost only: 127.0.0.1 refuses, localhost is used and the tool says so.
  assert.equal(await reachableBase('http://127.0.0.1:4321', { probe: up('http://localhost:4321'), log }), 'http://localhost:4321');
  assert.match(said[0], /Nothing answers at http:\/\/127\.0\.0\.1:4321; the site answers at http:\/\/localhost:4321/);
  // The other way round, and the IPv6 name.
  assert.equal(await reachableBase('http://localhost:4321', { probe: up('http://127.0.0.1:4321'), log }), 'http://127.0.0.1:4321');
  assert.equal(await reachableBase('http://127.0.0.1:4321', { probe: up('http://[::1]:4321'), log }), 'http://[::1]:4321');
  // Nothing is up: the origin is returned as given, with what to start.
  said.length = 0;
  assert.equal(await reachableBase('http://127.0.0.1:4599', { probe: up(), log }), 'http://127.0.0.1:4599');
  assert.match(said[0], /Start the site first, for example `npm run serve:static -- --dir dist --port 4599`/);
  // A public origin is never probed or changed.
  assert.equal(await reachableBase('https://example.org', { probe: async () => { throw Error('probed'); }, log }), 'https://example.org');
});
