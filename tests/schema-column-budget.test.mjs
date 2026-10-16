import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { assertCollectionColumnBudget, collectionColumnCounts } from '../scripts/schema-column-budget.mjs';

test('measures physical collection columns including generated columns', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE ec_pages (id TEXT, title TEXT, generated TEXT AS (title) VIRTUAL)');
    assert.deepEqual(collectionColumnCounts(db), [{ table: 'ec_pages', columns: 3 }]);
  } finally { db.close(); }
});

test('accepts exactly 50 columns and rejects a collection above budget', () => {
  assert.doesNotThrow(() => assertCollectionColumnBudget([{ table: 'ec_pages', columns: 50 }]));
  assert.throws(
    () => assertCollectionColumnBudget([{ table: 'ec_pages', columns: 51 }]),
    /ec_pages=51.*maximum 50/
  );
});
