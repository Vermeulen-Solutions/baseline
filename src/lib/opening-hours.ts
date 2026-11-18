/**
 * Opening hours: one list, read by the Organization structured data and by the Hours component, so
 * the page and search engines never disagree.
 */
export const WEEKDAYS = Object.freeze(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const);
export type Weekday = typeof WEEKDAYS[number];

/** One run of days with the same hours, on the 24-hour clock: `{ days: ['Friday', 'Saturday'], opens: '17:30', closes: '23:00' }`. */
export interface OpeningHours {
  days: Weekday[];
  opens: string;
  closes: string;
}

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** The valid entries only: known days, and times as HH:MM. */
export function validOpeningHours(hours: OpeningHours[] = []): OpeningHours[] {
  return hours
    .map(entry => ({ days: (entry?.days ?? []).filter((day): day is Weekday => (WEEKDAYS as readonly string[]).includes(day)), opens: entry?.opens, closes: entry?.closes }))
    .filter((entry): entry is OpeningHours => entry.days.length > 0 && TIME.test(entry.opens ?? '') && TIME.test(entry.closes ?? ''));
}

/** schema.org OpeningHoursSpecification nodes for the valid entries. */
export function openingHoursSpecification(hours: OpeningHours[] = []) {
  return validOpeningHours(hours).map(entry => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: entry.days, opens: entry.opens, closes: entry.closes }));
}

/** One row per weekday in WEEKDAYS order: the locale's day name and its formatted time ranges (empty when closed). */
export function openingHoursRows(hours: OpeningHours[] = [], locale = 'en') {
  // 2024-01-01 was a Monday, so day index 0..6 gives the locale's names in WEEKDAYS order.
  const dayName = (index: number) => new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + index)));
  const time = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1, h, m)));
  };
  const valid = validOpeningHours(hours);
  return WEEKDAYS.map((day, index) => ({
    day: dayName(index),
    times: valid.filter(entry => entry.days.includes(day)).map(entry => `${time(entry.opens)} – ${time(entry.closes)}`),
  }));
}
