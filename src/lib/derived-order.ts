// Comparators that derive a display order from the data itself, so editors never maintain a
// "display order" number. See docs/editor-experience.md. Tested in tests/derived-order.test.mjs.

type Entry = { data?: Record<string, any> | null };

/** Weekday names in several languages, Monday = 1. Extend for the site's locales. */
export const WEEKDAY_INDEX: Readonly<Record<string, number>> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
  lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7,
  montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6, sonntag: 7,
  maandag: 1, dinsdag: 2, woensdag: 3, donderdag: 4, vrijdag: 5, zaterdag: 6, zondag: 7,
};

/** 1–7 for a weekday name in any listed language; 99 for an unknown or empty value, so it sorts last. */
export function weekdayIndex(day: unknown, names: Readonly<Record<string, number>> = WEEKDAY_INDEX): number {
  return names[String(day ?? '').trim().toLowerCase()] ?? 99;
}

/** Minutes after midnight of the first time in free text such as "16h30 – 18h00", "9:15-10" or "16h". */
export function startMinutes(time: unknown): number {
  const match = String(time ?? '').match(/(\d{1,2})\s*[h:.]\s*(\d{2})?/i);
  return match ? Number(match[1]) * 60 + Number(match[2] ?? 0) : Number.POSITIVE_INFINITY;
}

/** Week order: weekday, then start time, then title. Field names are configurable. */
export function compareByWeekdayAndTime({ day = 'day', time = 'time', title = 'title', locale }: { day?: string; time?: string; title?: string; locale?: string } = {}) {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  return (a: Entry, b: Entry) => weekdayIndex(a.data?.[day]) - weekdayIndex(b.data?.[day])
    || startMinutes(a.data?.[time]) - startMinutes(b.data?.[time])
    || collator.compare(String(a.data?.[title] ?? ''), String(b.data?.[title] ?? ''));
}

/**
 * Category order, then title with numbers read as numbers (U8 before U10). `order` is the list in the
 * order editors see it (for example the select field's options); unknown values sort after it.
 */
export function compareByListThenTitle(field: string, order: readonly string[], { title = 'title', locale }: { title?: string; locale?: string } = {}) {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  const rank = (value: unknown) => { const index = order.indexOf(String(value ?? '')); return index < 0 ? order.length : index; };
  return (a: Entry, b: Entry) => rank(a.data?.[field]) - rank(b.data?.[field])
    || collator.compare(String(a.data?.[title] ?? ''), String(b.data?.[title] ?? ''));
}

/** A taxonomy term as EmDash returns it in a tree: children follow their parent. */
export type TermNode = { id: string; slug?: string | null; translationGroup?: string | null; label?: string; children?: TermNode[] };

/** Terms in the order editors set under Taxonomies (Move up / Move down): each parent, then its children. */
export function termsInOrder(roots: readonly TermNode[]): TermNode[] {
  return roots.flatMap(term => [term, ...termsInOrder(term.children ?? [])]);
}

const keys = (term: TermNode) => [term.id, term.translationGroup, term.slug].filter((key): key is string => Boolean(key));

/**
 * Rank of a term in the taxonomy order. Terms match on id, translation group or slug, so a term read
 * in another locale still finds its place. Unknown terms rank after all known ones.
 */
export function termRanker(roots: readonly TermNode[]) {
  const ordered = termsInOrder(roots);
  const rank = new Map<string, number>();
  ordered.forEach((term, index) => { for (const key of keys(term)) if (!rank.has(key)) rank.set(key, index); });
  return (term: TermNode) => Math.min(...keys(term).map(key => rank.get(key) ?? ordered.length), ordered.length);
}

/**
 * People (or other entries) by their highest-ranked term, then by name. `termsOf` returns an entry's
 * terms, for example `entry => entry.data?.terms?.roles ?? []`.
 */
export function compareByTermRankThenName(roots: readonly TermNode[], termsOf: (entry: Entry) => readonly TermNode[], { title = 'title', locale }: { title?: string; locale?: string } = {}) {
  const rank = termRanker(roots);
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const best = (entry: Entry) => Math.min(...termsOf(entry).map(rank), Number.POSITIVE_INFINITY);
  return (a: Entry, b: Entry) => best(a) - best(b)
    || collator.compare(String(a.data?.[title] ?? ''), String(b.data?.[title] ?? ''));
}
