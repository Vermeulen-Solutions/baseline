import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { testFiles } from '../scripts/run-tests.mjs';

test('test tiers are a disjoint exhaustive partition and stale inventories fail closed', () => {
  const unit = testFiles('unit'), rehearsal = testFiles('rehearsal');
  assert.equal(unit.some(file => rehearsal.includes(file)), false);
  assert.deepEqual([...unit, ...rehearsal].sort(), readdirSync('tests').filter(file => file.endsWith('.test.mjs')).map(file => `tests/${file}`).sort());
  assert.throws(() => testFiles('unknown'), /Use --tier/);
  const directory = mkdtempSync(path.join(os.tmpdir(), 'baseline-tier-'));
  try {
    writeFileSync(path.join(directory, 'test-tiers.json'), '{}');
    writeFileSync(path.join(directory, 'new.test.mjs'), '');
    assert.throws(() => testFiles('unit', directory), /inventory is stale/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
