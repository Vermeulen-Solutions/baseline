// The one EmDash release that Baseline's version-bound adapters were reviewed against.
// Bumping it is a review, not a rename: add standards/emdash-<version>-database-tables.json
// from the installed src/database/types.ts, re-read every importer of this module against
// the installed routes/CLI it depends on, then change REVIEWED_EMDASH.
import fs from 'node:fs';

export const REVIEWED_EMDASH = '1.5.0';

/** Identity string recorded in snapshots, ledgers and receipts produced by a reviewed adapter. */
export const adapterId = name => 'emdash-' + REVIEWED_EMDASH + '/' + name;

/** Reviewed core table catalog for REVIEWED_EMDASH. */
export function reviewedCatalog() {
  const catalog = JSON.parse(fs.readFileSync(new URL('../standards/emdash-' + REVIEWED_EMDASH + '-database-tables.json', import.meta.url), 'utf8'));
  if (catalog.emdash !== REVIEWED_EMDASH) throw new Error('Reviewed table catalog does not match REVIEWED_EMDASH');
  return catalog;
}

/** Installed core version, read from the package rather than assumed. */
export function installedEmdash() {
  return JSON.parse(fs.readFileSync(new URL('../node_modules/emdash/package.json', import.meta.url), 'utf8')).version;
}
