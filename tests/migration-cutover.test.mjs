import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { reconcileDelta, validateIntegrations } from '../scripts/migration-cutover.mjs';

test('delta reconciliation detects new, modified, deleted, slug changes and conflicts', () => {
  const initialSource = [
    { id: '1', slug: 'about-us', modified: '2026-10-01T10:00:00Z', title: 'About Us' },
    { id: '2', slug: 'blog-post-1', modified: '2026-10-01T10:00:00Z', title: 'First Post' },
    { id: '3', slug: 'deprecated-page', modified: '2026-10-01T10:00:00Z', title: 'Deprecated' }
  ];

  const finalSource = [
    { id: '1', slug: 'about', modified: '2026-10-18T12:00:00Z', title: 'About Us Updated' }, // slug change + modified
    { id: '2', slug: 'blog-post-1', modified: '2026-10-18T14:00:00Z', title: 'First Post Source Edit' }, // modified + target conflict
    { id: '4', slug: 'new-announcement', modified: '2026-10-18T16:00:00Z', title: 'New Launch' } // added
    // id 3 deleted
  ];

  const currentTarget = [
    { sourceId: '1', slug: 'about-us', modifiedAfterImport: false, title: 'About Us' },
    { sourceId: '2', slug: 'blog-post-1', modifiedAfterImport: true, title: 'First Post Polished in EmDash' }, // target conflict!
    { sourceId: '3', slug: 'deprecated-page', modifiedAfterImport: false, title: 'Deprecated' }
  ];

  const result = reconcileDelta({ initialSource, finalSource, currentTarget });

  assert.equal(result.added.length, 1);
  assert.equal(result.added[0].id, '4');

  assert.equal(result.modified.length, 1);
  assert.equal(result.modified[0].id, '1');
  assert.equal(result.reconciled.find(r => r.item.id === '1').action, 'update');

  assert.equal(result.deleted.length, 1);
  assert.equal(result.deleted[0].id, '3');

  assert.equal(result.slugChanges.length, 1);
  assert.equal(result.slugChanges[0].oldSlug, 'about-us');
  assert.equal(result.slugChanges[0].newSlug, 'about');
  assert.equal(result.slugChanges[0].requiredRedirect.status, 301);

  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].id, '2');
  assert.equal(result.reconciled.find(r => r.item.sourceId === '2').action, 'preserve_target');
});

test('consistent SQLite backup acquisition via VACUUM INTO and integrity verification', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-backup-test-'));
  const dbPath = path.join(tmpDir, 'source.db');
  const backupPath = path.join(tmpDir, 'backup.db');

  try {
    const db = new DatabaseSync(dbPath);
    db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE pages (id TEXT PRIMARY KEY, title TEXT, slug TEXT);
      INSERT INTO pages VALUES ('1', 'Home', 'home'), ('2', 'Contact', 'contact');
    `);

    // Execute VACUUM INTO to acquire clean, non-torn snapshot
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}';`);
    db.close();

    // Verify the backup database in isolation
    const backupDb = new DatabaseSync(backupPath);
    const integrityRow = backupDb.prepare('PRAGMA integrity_check;').get();
    assert.equal(integrityRow.integrity_check, 'ok');

    const rows = backupDb.prepare('SELECT * FROM pages ORDER BY id ASC;').all();
    assert.equal(rows.length, 2);
    assert.equal(rows[0].title, 'Home');
    assert.equal(rows[1].title, 'Contact');
    backupDb.close();
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('peripheral integrations checklist rejects unresolved items and accepts canonical dispositions', () => {
  const validChecklist = [
    { feature: 'Forms', status: 'Replaced', rationale: 'Using native form plugin' },
    { feature: 'Search', status: 'Preserved', rationale: 'EmDash LiveSearch primitive' },
    { feature: 'Comments', status: 'Deliberately Excluded', rationale: 'Replaced with external forum' },
    { feature: 'RSS', status: 'Preserved / Replaced', rationale: 'Native Astro RSS 2.0 static endpoint' }
  ];

  assert.ok(validateIntegrations(validChecklist));

  const invalidChecklist = [
    { feature: 'Newsletter', status: 'Unresolved', rationale: '' }
  ];

  assert.throws(() => validateIntegrations(invalidChecklist), /invalid status: Unresolved/);

  const missingRationaleChecklist = [
    { feature: 'Analytics', status: 'Replaced', rationale: '   ' }
  ];

  assert.throws(() => validateIntegrations(missingRationaleChecklist), /requires a non-empty rationale/);
});
