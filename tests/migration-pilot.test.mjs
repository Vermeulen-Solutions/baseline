import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runMigrationPilot } from '../scripts/pilot-migration.mjs';

test('integrated migration pilot runs full lifecycle rehearsal and passes', { timeout: 180000 }, async t => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-pilot-test-'));
  try {
    const { receipt, out } = await runMigrationPilot({ out: path.join(tmpDir, 'evidence'), signal: t.signal });
    assert.equal(receipt.status, 'passed');
    assert.equal(receipt.stages.defectVerification.exitCode, 2);
    assert.equal(receipt.stages.importerFidelity.status, 'passed');
    assert.equal(receipt.stages.deltaReconciliation.slugChanges, 1);
    assert.equal(receipt.stages.recoveryRehearsal.integrityCheck, 'ok');
    assert.ok(fs.existsSync(path.join(out, 'receipt.json')));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
