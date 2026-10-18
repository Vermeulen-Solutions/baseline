// Migration Cutover and Delta Reconciliation Utilities
import { isMain } from './infrastructure-io.mjs';

/**
 * Reconciles deltas between initial source export (T0) and final source snapshot (T_freeze),
 * detecting new entries, modified entries, deletions, slug shifts, and target conflicts.
 */
export function reconcileDelta({ initialSource, finalSource, currentTarget }) {
  const initialMap = new Map(initialSource.map(item => [item.id, item]));
  const finalMap = new Map(finalSource.map(item => [item.id, item]));
  const targetMap = new Map(currentTarget.map(item => [item.sourceId, item]));

  const delta = {
    added: [],
    modified: [],
    deleted: [],
    slugChanges: [],
    conflicts: [],
    reconciled: []
  };

  for (const [id, finalItem] of finalMap.entries()) {
    const initialItem = initialMap.get(id);
    const targetItem = targetMap.get(id);

    if (!initialItem) {
      delta.added.push(finalItem);
      delta.reconciled.push({ action: 'create', item: finalItem });
    } else {
      const sourceModified = finalItem.modified !== initialItem.modified;
      const slugChanged = finalItem.slug !== initialItem.slug;

      if (slugChanged) {
        delta.slugChanges.push({
          id,
          oldSlug: initialItem.slug,
          newSlug: finalItem.slug,
          requiredRedirect: { from: `/${initialItem.slug}`, to: `/${finalItem.slug}`, status: 301 }
        });
      }

      if (sourceModified) {
        const targetModified = targetItem && targetItem.modifiedAfterImport;
        if (targetModified) {
          delta.conflicts.push({
            id,
            source: finalItem,
            target: targetItem,
            reason: 'Target edited in CMS while source was modified in WordPress'
          });
          // Explicit resolution: preserve target edits by default
          delta.reconciled.push({ action: 'preserve_target', item: targetItem });
        } else {
          delta.modified.push(finalItem);
          delta.reconciled.push({ action: 'update', item: finalItem });
        }
      }
    }
  }

  for (const [id, initialItem] of initialMap.entries()) {
    if (!finalMap.has(id)) {
      delta.deleted.push(initialItem);
      delta.reconciled.push({ action: 'delete_or_410', item: initialItem });
    }
  }

  return delta;
}

const CANONICAL_STATUSES = new Set([
  'Preserved',
  'Replaced',
  'Deliberately Excluded',
  'Excluded',
  'Preserved / Replaced',
  'Excluded / Replaced'
]);

/**
 * Validates a peripheral integrations checklist, ensuring every item has an explicit,
 * supported disposition and mandatory non-empty rationale.
 */
export function validateIntegrations(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    throw new Error('Checklist must be a non-empty array of integration items');
  }

  for (const item of checklist) {
    if (!item.feature || typeof item.feature !== 'string') {
      throw new Error('Integration item missing required feature name');
    }
    const normalizedStatus = item.status?.trim();
    if (!normalizedStatus || !CANONICAL_STATUSES.has(normalizedStatus)) {
      throw new Error(`Feature ${item.feature} has invalid status: ${item.status}. Must be one of: ${[...CANONICAL_STATUSES].join(', ')}`);
    }
    if (!item.rationale || typeof item.rationale !== 'string' || item.rationale.trim().length === 0) {
      throw new Error(`Feature ${item.feature} requires a non-empty rationale`);
    }
  }
  return true;
}
