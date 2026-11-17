// Pure helpers for the editor-ui template (tested in tests/editor-ui-template.test.mjs).
// Labels change only what the admin shows; stored values stay as they are, so no data migration.

export type ChoiceConfig = {
  /** Stored value → wording editors see. Values without a label show as stored. */
  labels: Readonly<Record<string, string>>;
  /** Stored values that belong to one locale only, e.g. { fr: ['Lundi', …], en: ['Monday', …] }. */
  localeValues?: Readonly<Record<string, readonly string[]>>;
  /** Preferred order of values (for example weekdays); others keep their stored order after these. */
  order?: readonly string[];
};

export const choiceLabel = (config: ChoiceConfig, value: string) => config.labels[value] ?? value;

/**
 * The locale an entry is edited in. A current value that belongs to one locale wins (it is the
 * entry's own data); otherwise the admin URL's `?locale=`; otherwise the default locale.
 */
export function entryLocale(config: ChoiceConfig, search: string, current: unknown, defaultLocale: string): string {
  const value = String(current ?? '');
  for (const [locale, values] of Object.entries(config.localeValues ?? {})) if (value && values.includes(value)) return locale;
  return new URLSearchParams(search).get('locale') || defaultLocale;
}

/** The options to offer: values of other locales are hidden, then sorted by `order`, with labels. */
export function choiceOptions(config: ChoiceConfig, values: readonly string[], locale: string) {
  const hidden = new Set(Object.entries(config.localeValues ?? {}).filter(([other]) => other !== locale).flatMap(([, list]) => list));
  const own = new Set(config.localeValues?.[locale] ?? []);
  const order = config.order ?? [];
  const rank = (value: string) => { const index = order.indexOf(value); return index < 0 ? order.length : index; };
  return values
    .filter(value => own.has(value) || !hidden.has(value))
    .map((value, index) => ({ value, index }))
    .sort((a, b) => rank(a.value) - rank(b.value) || a.index - b.index)
    .map(({ value }) => ({ value, label: choiceLabel(config, value) }));
}
