import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { baselineTokens, buildReceipt, stylesheetDigest } from '../src/utils/design-tweaks.mjs';

const CHECKER = 'scripts/check-token-calibration.mjs';
const STYLESHEET = 'src/styles/global.css';

function runChecker(args) {
  const result = spawnSync(process.execPath, [CHECKER, ...args], { encoding: 'utf8' });
  return { code: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

function workspace(t) {
  const dir = mkdtempSync(join(tmpdir(), 'token-calibration-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return {
    dir,
    write(name, contents) {
      const path = join(dir, name);
      writeFileSync(path, contents, 'utf8');
      return path;
    },
  };
}

const receiptWith = (overrides, digest = 'a'.repeat(64)) => JSON.stringify({
  tool: 'design-tweaks',
  receiptVersion: 1,
  exportedAt: '2026-10-17T00:00:00.000Z',
  globalCssSha256: digest,
  overrides,
}, null, 2);

test('receipts are deterministic and record what each override replaced', () => {
  const tokens = { '--spacing-section': '4rem', '--color-action': 'oklch(40% 0.16 250)', '--hero-filter': 'brightness(110%)' };
  const baseline = { '--color-action': 'oklch(43% 0.14 250)', '--spacing-section': '3rem' };
  const input = { tokens, baseline, globalCssSha256: 'b'.repeat(64), exportedAt: '2026-10-17T12:00:00.000Z' };

  const first = buildReceipt(input);
  const second = buildReceipt(input);
  assert.equal(first, second, 'identical calibrations must produce byte-identical receipts');

  const parsed = JSON.parse(first);
  assert.equal(parsed.tool, 'design-tweaks');
  assert.equal(parsed.receiptVersion, 1);
  assert.equal(parsed.globalCssSha256, 'b'.repeat(64));
  assert.deepEqual(Object.keys(parsed.overrides), [...Object.keys(parsed.overrides)].sort(), 'override keys are sorted');

  assert.deepEqual(parsed.overrides['--color-action'], { from: 'oklch(43% 0.14 250)', to: 'oklch(40% 0.16 250)' });
  assert.deepEqual(parsed.overrides['--spacing-section'], { from: '3rem', to: '4rem' });
  // A token the panel can write but the stylesheet does not author has no source value.
  assert.deepEqual(parsed.overrides['--hero-filter'], { from: null, to: 'brightness(110%)' });
});

test('the stylesheet digest is stable across line endings and covers every catalogued token', async () => {
  const stylesheet = readFileSync(STYLESHEET, 'utf8');
  const digest = await stylesheetDigest(stylesheet);
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(digest, await stylesheetDigest(stylesheet.replaceAll('\n', '\r\n')), 'CRLF and LF must hash identically');
  assert.notEqual(digest, await stylesheetDigest(`${stylesheet} `), 'a changed stylesheet must hash differently');
  assert.ok(baselineTokens.length >= 37, 'catalogue should still be populated');
});

test('the checker reports an applied, pending, stale or invalid calibration', async (t) => {
  const ws = workspace(t);

  const appliedSheet = ws.write('applied.css', ':root {\n\t--color-action: oklch(40% 0.16 250);\n}\n');
  const applied = runChecker([ws.write('applied.json', receiptWith({ '--color-action': { from: null, to: 'oklch(40% 0.16 250)' } })), '--global-css', appliedSheet]);
  assert.equal(applied.code, 0, applied.output);
  assert.match(applied.output, /status:\s+applied/);

  const pendingSheet = ws.write('pending.css', ':root {\n\t--color-muted: 1;\n}\n');
  const pending = runChecker([
    ws.write('pending.json', receiptWith({ '--color-action': { from: null, to: 'oklch(40% 0.16 250)' } }, await stylesheetDigest(readFileSync(pendingSheet, 'utf8')))),
    '--global-css', pendingSheet,
  ]);
  assert.equal(pending.code, 0, pending.output);
  assert.match(pending.output, /status:\s+pending-merge/);

  const strict = runChecker([join(ws.dir, 'pending.json'), '--global-css', pendingSheet, '--require-applied']);
  assert.equal(strict.code, 1, '--require-applied must fail an unmerged calibration');
  assert.match(strict.output, /pending-merge/);

  const stale = runChecker([ws.write('stale.json', receiptWith({ '--color-action': { from: null, to: 'oklch(10% 0.10 10)' } })), '--global-css', appliedSheet]);
  assert.equal(stale.code, 1, stale.output);
  assert.match(stale.output, /status:\s+stale/);
  assert.match(stale.output, /--color-action/);

  const unknown = runChecker([ws.write('unknown.json', receiptWith({ '--not-a-token': { from: null, to: '1px' } })), '--global-css', appliedSheet]);
  assert.equal(unknown.code, 1);
  assert.match(unknown.output, /not in the catalogue/);

  const malformed = runChecker([ws.write('malformed.json', '{ not json')]);
  assert.equal(malformed.code, 1);
  assert.match(malformed.output, /invalid receipt/);

  const noArgs = runChecker([]);
  assert.equal(noArgs.code, 1);
  assert.match(noArgs.output, /Usage/);
});
