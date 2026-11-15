import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, parseCheck, refsFromHtml, pageText, databaseHolds, isImageField } from '../scripts/cms-roundtrip.mjs';

// Portable: guards and parsing only; no server, browser or database is touched.
const project = path.join(os.tmpdir(), 'cms-roundtrip-project');
const copy = path.join(os.tmpdir(), 'cms-roundtrip-copy', 'data.db');

test('the round trip refuses anything but a loopback origin and a copy outside the project', () => {
  const check = ['--check', 'pages/home/title@/'];
  assert.throws(() => parseArgs(['--db', copy, ...check], project), /--base/);
  assert.throws(() => parseArgs(['--base', 'https://example.org', '--db', copy, ...check], project), /loopback/);
  assert.throws(() => parseArgs(['--base', 'http://192.168.1.20:4321', '--db', copy, ...check], project), /loopback/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4428', ...check], project), /--db/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4428', '--db', 'data.db', ...check], project), /working database/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4428', '--db', 'backups/copy.db', ...check], project), /inside this project/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4428', '--db', copy], project), /--check/);
  const options = parseArgs(['--base', 'http://localhost:4428/', '--db', copy, '--locale', 'fr', '--no-image-proxies', ...check], project);
  assert.equal(options.base, 'http://localhost:4428');
  assert.equal(options.workingDb, path.join(project, 'data.db'));
  assert.equal(options.imageProxies, false);
  assert.deepEqual(options.checks, [{ collection: 'pages', slug: 'home', field: 'title', route: '/' }]);
});

test('a check names a collection, slug, field and public route', () => {
  assert.deepEqual(parseCheck('teams/first-team/description@/teams/first-team/'), { collection: 'teams', slug: 'first-team', field: 'description', route: '/teams/first-team/' });
  assert.throws(() => parseCheck('pages/home/title'), /<collection>\/<slug>\/<field>@<route>/);
  assert.throws(() => parseCheck('pages/home/title@contact'), /@<route>/);
  assert.throws(() => parseCheck('pages/home/title@/C:/Program Files/Git/'), /MSYS_NO_PATHCONV=1/);
});

test('edit targets, visible text and media field names are read from rendered HTML', () => {
  const html = '<h1 data-emdash-ref="{&quot;collection&quot;:&quot;pages&quot;,&quot;id&quot;:&quot;01A&quot;,&quot;field&quot;:&quot;title&quot;}">Hello</h1><p data-emdash-ref="broken">x</p><script>var a = 1;</script><style>h1{}</style>';
  assert.deepEqual(refsFromHtml(html), [{ collection: 'pages', id: '01A', field: 'title' }]);
  assert.equal(pageText('<main><h1>Hello</h1>\n  <p>World <b>now</b></p><!-- note --><script>x</script></main>'), 'Hello World now');
  assert.equal(isImageField('hero_image'), true);
  assert.equal(isImageField('photo'), true);
  assert.equal(isImageField('discover_title'), false);
  assert.equal(isImageField(undefined), false);
});

test('the isolation proof finds a marker in a database file or its write-ahead log', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'cms-roundtrip-'));
  try {
    const db = path.join(dir, 'data.db');
    writeFileSync(db, 'SQLite format 3\0 some rows');
    assert.equal(databaseHolds(db, 'QA123456789'), false);
    writeFileSync(db + '-wal', 'pending write: Title QA123456789');
    assert.equal(databaseHolds(db, 'QA123456789'), true);
    assert.equal(databaseHolds(path.join(dir, 'absent.db'), 'QA123456789'), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
