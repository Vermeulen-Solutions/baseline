import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GATE_EXCEPTIONS, SVELTIA_ADMIN_HTML, SVELTIA_GUIDE, applySveltiaPin, checkSveltiaPin, compareVersions, gateHash,
  mirrorUrl, parseSveltiaPin, rewriteGateException, rewriteGuideVersion, rewriteSveltiaPin, scriptUrl, sri, sveltiaPinStatus,
} from '../scripts/sveltia-pin.mjs';
import { collectUpdates, upstreamSummary } from '../scripts/check-upstream-updates.mjs';

// Portable: a checked-in fixture page, throwaway folders and injected lookups; no network.
// LF, so the CRLF variant the gate test builds is a real CRLF file in a CRLF checkout too.
const fixture = readFileSync(fileURLToPath(new URL('./fixtures/sveltia-pin/index.html', import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
const FIXTURE_BYTES = Buffer.from('fixture 1.2.3');
const NEXT_BYTES = Buffer.from('fixture 1.10.0');
const guide = 'Intro.\n\nThe admin HTML pins Sveltia **1.2.3** with SHA-384 SRI; review the version and integrity together.\n';
const metadata = (latest, extra = {}) => ({ 'dist-tags': { latest }, versions: Object.fromEntries(['1.2.3', '1.9.0', latest].map(v => [v, { ...extra[v] }])), time: { [latest]: '2026-11-17T00:00:00.000Z' } });

function checkout(html = fixture) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'baseline-sveltia-pin-'));
  const put = (file, text) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text); };
  put(SVELTIA_ADMIN_HTML, html);
  put(SVELTIA_GUIDE, guide);
  put(GATE_EXCEPTIONS, JSON.stringify([
    { path: 'src/other.astro', reason: 'Unrelated.', sha256: 'f'.repeat(64) },
    { path: SVELTIA_ADMIN_HTML, reason: 'Static Sveltia admin infrastructure.', sha256: gateHash(html) },
  ], null, 2) + '\n');
  return { root, read: file => readFileSync(path.join(root, file), 'utf8'), cleanup: () => { assert.ok(path.basename(root).startsWith('baseline-sveltia-pin-')); rmSync(root, { recursive: true, force: true }); } };
}

test('the pin parses from the admin page and its integrity matches the bytes it names', () => {
  const pin = parseSveltiaPin(fixture);
  assert.equal(pin.version, '1.2.3');
  assert.equal(pin.url, 'https://unpkg.com/@sveltia/cms@1.2.3/dist/sveltia-cms.js');
  assert.equal(pin.integrity, sri(FIXTURE_BYTES));
  assert.match(sri(FIXTURE_BYTES), /^sha384-[A-Za-z0-9+/]{64}$/);
  assert.throws(() => parseSveltiaPin(fixture.replace('@1.2.3', '@latest')), /exact x\.y\.z/);
  assert.throws(() => parseSveltiaPin(fixture.replace('@1.2.3', '@1.2.3-beta.1')), /exact x\.y\.z/);
  assert.throws(() => parseSveltiaPin(fixture.replace(/ integrity="[^"]+"/, '')), /integrity/);
  assert.throws(() => parseSveltiaPin(fixture.replace(' crossorigin="anonymous"', '')), /crossorigin/);
  assert.throws(() => parseSveltiaPin('<html></html>'), /found 0/);
  assert.throws(() => parseSveltiaPin(fixture + pin.tag), /found 2/);
});

test('versions compare numerically and the report says when the pin is behind', () => {
  assert.ok(compareVersions('1.10.0', '1.9.0') > 0);
  assert.ok(compareVersions('0.248.0', '0.269.0') < 0);
  assert.equal(compareVersions('2.0.0', '2.0.0'), 0);
  assert.throws(() => compareVersions('1.0', '1.0.0'), /Cannot compare/);
  const pin = parseSveltiaPin(fixture);
  const behind = sveltiaPinStatus(pin, metadata('1.10.0'));
  assert.deepEqual([behind.upstreamStatus, behind.pinned, behind.availableStable, behind.file], ['update-available', '1.2.3', '1.10.0', SVELTIA_ADMIN_HTML]);
  assert.equal(sveltiaPinStatus(pin, metadata('1.2.3')).upstreamStatus, 'current');
  assert.throws(() => sveltiaPinStatus(pin, { 'dist-tags': { latest: 'next' } }), /unavailable/);
});

test('rewriting the pin changes only the URL version and the integrity value', () => {
  const integrity = sri(NEXT_BYTES);
  const next = rewriteSveltiaPin(fixture, { version: '1.10.0', integrity });
  assert.deepEqual(parseSveltiaPin(next), { ...parseSveltiaPin(next), version: '1.10.0', integrity, url: scriptUrl('1.10.0') });
  assert.equal(next.replace('@1.10.0', '@1.2.3').replace(integrity, sri(FIXTURE_BYTES)), fixture);
  assert.throws(() => rewriteSveltiaPin(fixture, { version: 'latest', integrity }), /Refusing/);
  assert.throws(() => rewriteSveltiaPin(fixture, { version: '1.10.0', integrity: 'sha256-abc' }), /malformed/);
  assert.equal(rewriteGuideVersion(guide, '1.10.0'), guide.replace('**1.2.3**', '**1.10.0**'));
  assert.throws(() => rewriteGuideVersion('No version here.', '1.10.0'), /found 0/);
});

test('the gate exception follows the page only while it still matches the reviewed bytes', () => {
  const next = rewriteSveltiaPin(fixture, { version: '1.10.0', integrity: sri(NEXT_BYTES) });
  const text = JSON.stringify([{ path: SVELTIA_ADMIN_HTML, reason: 'r', sha256: gateHash(fixture) }], null, 2) + '\n';
  const moved = JSON.parse(rewriteGateException(text, SVELTIA_ADMIN_HTML, fixture, next));
  assert.equal(moved[0].sha256, gateHash(next));
  assert.equal(gateHash(fixture.replaceAll('\n', '\r\n')), gateHash(fixture));
  const stale = JSON.stringify([{ path: SVELTIA_ADMIN_HTML, reason: 'r', sha256: 'e'.repeat(64) }]);
  assert.throws(() => rewriteGateException(stale, SVELTIA_ADMIN_HTML, fixture, next), /review it by hand/);
  assert.throws(() => rewriteGateException('[]', SVELTIA_ADMIN_HTML, fixture, next), /found 0/);
});

test('applying the update downloads, cross-checks and writes the version, SRI, guide and gate hash together', async () => {
  const { root, read, cleanup } = checkout();
  try {
    const fetched = [];
    const fetchBytes = async url => { fetched.push(url); return NEXT_BYTES; };
    const result = await applySveltiaPin(root, { packageLookup: async () => metadata('1.10.0'), fetchBytes });
    assert.deepEqual(fetched, [scriptUrl('1.10.0'), mirrorUrl('1.10.0')]);
    assert.deepEqual([result.status, result.from, result.to, result.integrity], ['applied', '1.2.3', '1.10.0', sri(NEXT_BYTES)]);
    const html = read(SVELTIA_ADMIN_HTML);
    assert.deepEqual([parseSveltiaPin(html).version, parseSveltiaPin(html).integrity], ['1.10.0', sri(NEXT_BYTES)]);
    assert.match(read(SVELTIA_GUIDE), /Sveltia \*\*1\.10\.0\*\*/);
    const exceptions = JSON.parse(read(GATE_EXCEPTIONS));
    assert.equal(exceptions.find(e => e.path === SVELTIA_ADMIN_HTML).sha256, gateHash(html));
    assert.equal(exceptions.find(e => e.path === 'src/other.astro').sha256, 'f'.repeat(64));
    const again = await applySveltiaPin(root, { packageLookup: async () => metadata('1.10.0'), fetchBytes: async () => { throw Error('must not download when current'); } });
    assert.equal(again.status, 'current');
  } finally { cleanup(); }
});

test('a failed or inconsistent download leaves every file untouched', async () => {
  const { root, read, cleanup } = checkout();
  const snapshot = () => [SVELTIA_ADMIN_HTML, SVELTIA_GUIDE, GATE_EXCEPTIONS].map(read);
  const before = snapshot();
  try {
    const lookup = async () => metadata('1.10.0');
    await assert.rejects(applySveltiaPin(root, { packageLookup: lookup, fetchBytes: async url => url.includes('jsdelivr') ? Buffer.from('tampered') : NEXT_BYTES }), /differs between/);
    await assert.rejects(applySveltiaPin(root, { packageLookup: lookup, fetchBytes: async () => Buffer.alloc(0) }), /Empty/);
    await assert.rejects(applySveltiaPin(root, { packageLookup: lookup, fetchBytes: async () => { throw Error('HTTP 503'); } }), /503/);
    await assert.rejects(applySveltiaPin(root, { packageLookup: lookup, version: '9.9.9', fetchBytes: async () => NEXT_BYTES }), /not published/);
    await assert.rejects(applySveltiaPin(root, { packageLookup: async () => metadata('1.10.0', { '1.10.0': { deprecated: 'broken' } }), fetchBytes: async () => NEXT_BYTES }), /deprecated/);
    writeFileSync(path.join(root, GATE_EXCEPTIONS), JSON.stringify([{ path: SVELTIA_ADMIN_HTML, reason: 'r', sha256: 'e'.repeat(64) }]));
    const staleGate = read(GATE_EXCEPTIONS);
    await assert.rejects(applySveltiaPin(root, { packageLookup: lookup, fetchBytes: async () => NEXT_BYTES }), /review it by hand/);
    assert.deepEqual(snapshot(), [before[0], before[1], staleGate]);
  } finally { cleanup(); }
});

test('the upstream report includes the pin, and checkouts without the profile report none', async () => {
  const { root, cleanup } = checkout();
  const empty = mkdtempSync(path.join(os.tmpdir(), 'baseline-sveltia-pin-'));
  try {
    const offline = async () => { throw Error('offline'); };
    for (const dir of [root, empty]) {
      writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ dependencies: {} }));
      writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: { '': { dependencies: {} } } }));
    }
    const packageLookup = async name => { assert.equal(name, '@sveltia/cms'); return metadata('1.10.0'); };
    const report = await collectUpdates(root, { package: packageLookup, skill: offline, node: offline });
    assert.equal(report.mutation, false);
    assert.deepEqual(report.pins.map(p => [p.name, p.pinned, p.availableStable, p.upstreamStatus]), [['@sveltia/cms', '1.2.3', '1.10.0', 'update-available']]);
    assert.match(upstreamSummary({ ...report, node: { running: 'v24.0.0' } }), /Pinned CDN scripts: 1 checked \(1 updates available\)[\s\S]*@sveltia\/cms 1\.2\.3 -> 1\.10\.0/);
    assert.equal((await checkSveltiaPin(root, { packageLookup: offline })).upstreamStatus, 'unverified');
    assert.equal(await checkSveltiaPin(empty, { packageLookup }), null);
    assert.deepEqual((await collectUpdates(empty, { package: packageLookup, skill: offline, node: offline })).pins, []);
    assert.deepEqual(readdirSync(empty).sort(), ['package-lock.json', 'package.json']);
  } finally { cleanup(); assert.ok(path.basename(empty).startsWith('baseline-sveltia-pin-')); rmSync(empty, { recursive: true, force: true }); }
});
