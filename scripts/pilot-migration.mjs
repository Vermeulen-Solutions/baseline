// Integrated Migration Pilot: runs full lifecycle rehearsal from verification to cutover and restore.
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { newDirectory, writeJSON, isMain } from './infrastructure-io.mjs';
import { rehearseImporter } from './rehearse-importer.mjs';
import { reconcileDelta } from './migration-cutover.mjs';
import { runMigration, parseMigrationArgs } from './migration-verify.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function runMigrationPilot({ out, signal } = {}) {
  const runId = 'pilot-' + Date.now();
  out = newDirectory(out ?? path.join(root, '.emdash/migration-acceptance', runId));

  const gitRevision = (() => {
    try {
      return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    } catch {
      return 'unversioned';
    }
  })();

  const receipt = {
    pilotVersion: 1,
    gitRevision,
    timestamp: new Date().toISOString(),
    nodeVersion: process.versions.node,
    status: 'running',
    stages: {}
  };

  // Stage 1: Defect Detection in Migration Verifier
  // Provide manifest with known failure to verify it fails exit 1 or 2
  const defectManifest = path.join(root, 'tests/fixtures/migration-content/manifest.json');
  // Full scope without observations should return exit 2 (unknowns)
  const defectResult = await runMigration({
    manifest: defectManifest,
    scope: 'full',
    format: 'json',
    out: path.join(out, 'defect-run')
  });
  assert.equal(defectResult.report.exitCode, 2, 'Missing required evidence must yield exit code 2');
  receipt.stages.defectVerification = {
    exitCode: defectResult.report.exitCode,
    outcome: 'properly_rejected_with_exit_2'
  };

  // Stage 2: Importer Fidelity Rehearsal & Deliberate Damage Verification
  const importerOut = path.join(out, 'importer-rehearsal');
  const { receipt: importerReceipt } = await rehearseImporter({ out: importerOut, signal });
  assert.equal(importerReceipt.status, 'passed');
  receipt.stages.importerFidelity = {
    status: importerReceipt.status,
    externalNetworkRequests: importerReceipt.externalNetworkRequests,
    cleanup: importerReceipt.cleanup,
    observations: importerReceipt.observations
  };

  // Stage 3: Cutover Delta Reconciliation
  const initialSource = [
    { id: '101', slug: 'company-overview', modified: '2026-10-01T10:00:00Z', title: 'Company Overview' },
    { id: '102', slug: 'contact-page', modified: '2026-10-01T10:00:00Z', title: 'Contact Us' }
  ];
  const finalSource = [
    { id: '101', slug: 'about-company', modified: '2026-10-18T10:00:00Z', title: 'Company Overview Edited' }, // slug shift + edit
    { id: '102', slug: 'contact-page', modified: '2026-10-18T11:00:00Z', title: 'Contact Us' }, // modified
    { id: '103', slug: 'press-release', modified: '2026-10-18T12:00:00Z', title: 'Late Press Release' } // added
  ];
  const currentTarget = [
    { sourceId: '101', slug: 'company-overview', modifiedAfterImport: false, title: 'Company Overview' },
    { sourceId: '102', slug: 'contact-page', modifiedAfterImport: true, title: 'Contact Us Custom Polish' } // target conflict
  ];

  const delta = reconcileDelta({ initialSource, finalSource, currentTarget });
  assert.equal(delta.added.length, 1);
  assert.equal(delta.slugChanges.length, 1);
  assert.equal(delta.conflicts.length, 1);
  receipt.stages.deltaReconciliation = {
    added: delta.added.length,
    slugChanges: delta.slugChanges.length,
    conflicts: delta.conflicts.length,
    reconciledActions: delta.reconciled.map(r => r.action)
  };

  // Stage 4: SQLite Disaster Recovery Rehearsal
  const dbPath = path.join(out, 'pilot-source.sqlite');
  const backupPath = path.join(out, 'pilot-backup.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE pilot_records (id TEXT PRIMARY KEY, title TEXT);
    INSERT INTO pilot_records VALUES ('1', 'Pilot Verification Record');
  `);
  db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}';`);
  db.close();

  const restoredDb = new DatabaseSync(backupPath);
  const check = restoredDb.prepare('PRAGMA integrity_check;').get();
  assert.equal(check.integrity_check, 'ok');
  const rows = restoredDb.prepare('SELECT * FROM pilot_records;').all();
  assert.equal(rows.length, 1);
  restoredDb.close();

  receipt.stages.recoveryRehearsal = {
    integrityCheck: check.integrity_check,
    restoredRows: rows.length
  };

  receipt.status = 'passed';
  writeJSON(path.join(out, 'receipt.json'), receipt);

  return { receipt, out };
}

if (isMain(import.meta.url)) {
  runMigrationPilot().then(({ receipt, out }) => {
    console.log(`Integrated migration pilot passed: ${receipt.status}`);
    console.log(`Receipt saved to: ${out}`);
  }).catch(err => {
    console.error('Migration pilot failed:', err.message);
    process.exitCode = 1;
  });
}
