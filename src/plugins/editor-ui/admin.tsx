import React from 'react';
import { CHOICES, DEFAULT_LOCALE, HELP, PLACES, PLACES_COLLECTION, TASKS, TEXT, VALUE_COLUMNS } from './config';
import { choiceLabel, choiceOptions, entryLocale } from './labels';
import './styles.css';

type Option = { value: string; label: string };
type FieldProps = { value: unknown; onChange: (value: unknown) => void; label: string; id: string; required?: boolean; options?: unknown };

// A select field widget: editors see labels and only the values of the entry's locale. Stored values
// are unchanged. Apply it per field with `widget: '<plugin id>:choice'` (docs/editor-experience.md).
function ChoiceField({ value, onChange, label, id, required, options }: FieldProps) {
  const values = Array.isArray(options) ? (options as Option[]).map(option => String(option.value)) : [];
  const locale = entryLocale(CHOICES, typeof window === 'undefined' ? '' : window.location.search, value, DEFAULT_LOCALE);
  const current = value === null || value === undefined ? '' : String(value);
  const choices = choiceOptions(CHOICES, values, locale);
  if (current && !choices.some(choice => choice.value === current)) choices.unshift({ value: current, label: choiceLabel(CHOICES, current) });
  return <div className="site-field">
    <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
    <select id={id} value={current} onChange={event => onChange(event.target.value || null)}>
      {(!required || !current) && <option value="">{TEXT.choose}</option>}
      {choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
    </select>
  </div>;
}

type CellProps = { item: { slug: string | null; data: Record<string, unknown> } };
const valueCell = (field: string) => function ValueCell({ item }: CellProps) {
  const value = item.data?.[field];
  return <span>{value === null || value === undefined || value === '' ? '—' : choiceLabel(CHOICES, String(value))}</span>;
};
function PlaceCell({ item }: CellProps) {
  return <span>{PLACES[item.slug || '']?.place ?? '—'}</span>;
}
function PlacePanel({ entry }: { entry: { slug?: string | null } }) {
  const place = PLACES[entry.slug || ''];
  if (!place) return <p className="site-panel-text">{TEXT.notUsed}</p>;
  return <p className="site-panel-text">{place.place}. <a href={place.path} target="_blank" rel="noopener noreferrer">{TEXT.viewPage}</a></p>;
}

function StartWidget() {
  return <ul className="site-start">
    {TASKS.map(task => {
      const external = !task.href.startsWith('/_emdash/');
      return <li key={task.title}><a href={task.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><strong>{task.title}</strong><span>{task.text}</span></a></li>;
    })}
  </ul>;
}

function HelpPage() {
  return <article className="site-help">
    <h1>{TEXT.helpHeading}</h1>
    <p className="site-help-lead">{TEXT.helpLead}</p>
    <nav aria-label={TEXT.contents}><ol className="site-help-toc">
      {HELP.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}
    </ol></nav>
    {HELP.map(section => <section key={section.id} id={section.id}>
      <h2>{section.title}</h2>
      <ol>{section.steps.map(step => <li key={step}>{step}</li>)}</ol>
      {section.note && <p>{section.note}</p>}
    </section>)}
  </article>;
}

export const fields = { choice: ChoiceField };
export const contentListColumns = [
  ...VALUE_COLUMNS.map(([collection, field, label]) => ({ id: `${collection}-${field}`, label, cell: valueCell(field), collections: [collection], order: 10 })),
  ...(PLACES_COLLECTION ? [{ id: 'place', label: TEXT.placesColumn, cell: PlaceCell, collections: [PLACES_COLLECTION], order: 10 }] : []),
];
export const contentEditorPanels = PLACES_COLLECTION ? [{ id: 'place', title: TEXT.placesPanel, component: PlacePanel, collections: [PLACES_COLLECTION], order: 5 }] : [];
export const pages = { '/': HelpPage };
export const widgets = { start: StartWidget };
