const reported = new Set<string>();
const MAX_REPORTED = 64;

/** A printable, bounded name for an unhandled Portable Text `_type`. */
export function unknownPortableTextLabel(type: unknown): string {
  if (typeof type !== 'string') return 'unnamed';
  const clean = type.replace(/[^\w.:-]/g, '').slice(0, 64);
  return clean || 'unnamed';
}

/**
 * Logs one server warning per unhandled block type for the life of the process. Returns true when
 * this call logged. The set is bounded so hostile or generated type names cannot grow memory.
 */
export function noteUnknownPortableTextType(label: string, log: (message: string) => void = console.warn): boolean {
  if (reported.has(label) || reported.size >= MAX_REPORTED) return false;
  reported.add(label);
  log(`[baseline] Portable Text block type "${label}" has no renderer; it is omitted from public HTML. Register a component in src/components/RichText.astro.`);
  return true;
}

/** Test seam: forget which types were reported. */
export function resetUnknownPortableTextReports(): void {
  reported.clear();
}
