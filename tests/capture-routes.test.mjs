import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, routeSlug, shotName, summarize, compareSummaries } from '../scripts/capture-routes.mjs';

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
