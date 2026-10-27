import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkMigrationLocale } from '../scripts/check-migration-locale.mjs';

test('native locale metadata is authoritative even when French prose or custom fields look correct', () => {
  const entry = { id: 'sample', locale: 'en', data: { title: 'Bonjour', locale: 'fr', language: 'fr' } };
  assert.equal(checkMigrationLocale(entry, 'fr').mismatchedLocale, 1);
  assert.equal(checkMigrationLocale({ ...entry, locale: null }, 'fr').missingLocale, 1);
  assert.equal(checkMigrationLocale({ ...entry, locale: undefined }, 'fr').status, 'failed');
  assert.equal(checkMigrationLocale({ success: false, data: { item: { ...entry, locale: 'fr' } } }, 'fr').status, 'failed');
  assert.equal(checkMigrationLocale({ success: false, id: 'sample', locale: 'fr' }, 'fr').status, 'failed');
});

test('CLI and REST readbacks pass explicitly selected locales; empty, malformed and mixed samples fail', () => {
  const entry = { id: 'sample', locale: 'fr', data: {} };
  for (const sample of [entry, { item: entry }, { success: true, data: { item: entry } }]) assert.equal(checkMigrationLocale(sample, 'fr').status, 'passed');
  assert.equal(checkMigrationLocale({ ...entry, locale: 'en-gb' }, 'en-GB').status, 'passed');
  assert.equal(checkMigrationLocale({ ...entry, locale: 'fr-CH' }, 'fr').status, 'failed');
  assert.equal(checkMigrationLocale([entry, { ...entry, id: 'other', locale: 'en' }], 'fr').mismatchedLocale, 1);
  for (const sample of [null, {}, { item: {} }, { id: '', locale: 'fr' }]) assert.equal(checkMigrationLocale(sample, 'fr').status, 'failed');
  assert.throws(() => checkMigrationLocale([], 'fr'));
  assert.throws(() => checkMigrationLocale(Array(101).fill(entry), 'fr'));
  assert.throws(() => checkMigrationLocale(entry, 'not_a_locale'));
});

test('CLI is read-only, emits counts only, and fails closed on invalid or oversized inputs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'baseline-locale-'));
  const file = join(directory, 'sample.json');
  const run = () => spawnSync(process.execPath, ['scripts/check-migration-locale.mjs', '--input', file, '--expected-locale', 'fr'], { encoding: 'utf8' });
  try {
    const source = JSON.stringify({ id: 'private-id', locale: 'en', data: { title: 'PRIVATE COPY', credential: 'DO-NOT-PRINT' } });
    writeFileSync(file, source);
    let result = run();
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).mismatchedLocale, 1);
    assert.doesNotMatch(result.stdout + result.stderr, /PRIVATE COPY|DO-NOT-PRINT|private-id/);
    assert.equal(readFileSync(file, 'utf8'), source);
    writeFileSync(file, '\uFEFF' + JSON.stringify({ id: 'sample', locale: 'fr' }));
    result = run(); assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).checked, 1);
    for (const invalid of ['{"title":"DO-NOT-PRINT', ' '.repeat(2 * 1024 * 1024 + 1)]) {
      writeFileSync(file, invalid); result = run();
      assert.equal(result.status, 1); assert.equal(JSON.parse(result.stderr).status, 'error');
      assert.doesNotMatch(result.stdout + result.stderr, /DO-NOT-PRINT/);
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
