export const COLLECTION_COLUMN_BUDGET = 50;

/** Counts actual EmDash collection table columns, including generated/hidden columns. */
export function collectionColumnCounts(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name GLOB 'ec_*' ORDER BY name").all();
  return tables.map(({ name }) => ({
    table: name,
    columns: db.prepare(`PRAGMA table_xinfo("${String(name).replaceAll('"', '""')}")`).all().length,
  }));
}

export function assertCollectionColumnBudget(counts, budget = COLLECTION_COLUMN_BUDGET) {
  const oversized = counts.filter(({ columns }) => columns > budget);
  if (oversized.length) {
    throw new Error(`Collection column budget exceeded: ${oversized.map(({ table, columns }) => `${table}=${columns}`).join(", ")} (maximum ${budget})`);
  }
  return counts;
}
