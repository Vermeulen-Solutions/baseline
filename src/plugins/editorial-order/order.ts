// Pure helpers for the editorial order page (tested in tests/editorial-order.test.mjs).

export type OrderItem = {
  id: string;
  locale: string;
  translationGroup?: string | null;
  status: string;
  draftRevisionId?: string | null;
  data: Record<string, any>;
};
export type OrderRow = { group: string; entry: OrderItem };
export type OrderChange = { row: OrderRow; position: number };

const position = (entry: OrderItem, field: string) => {
  const value = entry.data?.[field];
  return value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? Number.POSITIVE_INFINITY : Number(value);
};

/**
 * One row per translation group. The order field is not translatable, so all translations share it;
 * the entry in `preferredLocale` stands for its group and a group without that locale still gets a row.
 * Rows without a number sort last, then by title.
 */
export function orderRows(items: readonly OrderItem[], { field, preferredLocale, titleField = 'title' }: { field: string; preferredLocale: string; titleField?: string }): OrderRow[] {
  const groups = new Map<string, OrderItem>();
  for (const item of items) {
    const group = item.translationGroup || item.id;
    const current = groups.get(group);
    if (!current || (item.locale === preferredLocale && current.locale !== preferredLocale)) groups.set(group, item);
  }
  const collator = new Intl.Collator(preferredLocale, { numeric: true, sensitivity: 'base' });
  return [...groups].map(([group, entry]) => ({ group, entry }))
    .sort((a, b) => position(a.entry, field) - position(b.entry, field)
      || collator.compare(String(a.entry.data?.[titleField] ?? ''), String(b.entry.data?.[titleField] ?? '')));
}

/** Move one item; out-of-range or no-op moves return the same list. */
export function move<T>(list: readonly T[], from: number, to: number): readonly T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * The writes a new order needs: positions 1…n, only for rows whose number changes.
 * `blocked` lists published rows with unpublished edits: publishing their new number would also
 * publish those edits, so the page refuses to save until they are published or discarded.
 */
export function orderChanges(rows: readonly OrderRow[], field: string): { changes: OrderChange[]; blocked: OrderChange[] } {
  const changes = rows.map((row, index) => ({ row, position: index + 1 }))
    .filter(({ row, position: next }) => position(row.entry, field) !== next);
  const blocked = changes.filter(({ row }) => row.entry.status === 'published' && Boolean(row.entry.draftRevisionId));
  return { changes, blocked };
}

/** Index of the row a pointer at `clientY` points to, from the rows' vertical boxes (top, height). */
export function dropIndex(boxes: ReadonlyArray<{ top: number; height: number }>, clientY: number): number {
  const index = boxes.findIndex(box => clientY < box.top + box.height / 2);
  return index < 0 ? boxes.length - 1 : index;
}
