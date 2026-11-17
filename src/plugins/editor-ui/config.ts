// Site content for the editor-ui template. Replace every value with the site's own wording, in the
// editors' language. See docs/editor-experience.md.
import type { ChoiceConfig } from './labels';

export const PLUGIN_ID = 'site-editor-ui';
export const DEFAULT_LOCALE = 'en';

/** Select labels, used by the `${PLUGIN_ID}:choice` field widget and the list columns below. */
export const CHOICES: ChoiceConfig = {
  labels: { draft: 'Draft — to check', done: 'Done' },
  localeValues: {},
  order: [],
};

/** List columns that show a stored select value with its label: [collection, field, column label]. */
export const VALUE_COLUMNS: ReadonlyArray<readonly [collection: string, field: string, label: string]> = [];

/** Where each entry of a collection of reusable snippets appears on the site, keyed by slug. */
export const PLACES_COLLECTION: string | null = null;
export const PLACES: Readonly<Record<string, { place: string; path: string }>> = {};

/** The editor's common tasks, shown as a dashboard card. Admin links start with /_emdash/admin. */
export const TASKS: ReadonlyArray<{ title: string; href: string; text: string }> = [
  { title: 'Change text on the site', href: '/', text: 'Open the page, switch on “Edit” at the bottom of the screen and select the text.' },
  { title: 'Publish a post', href: '/_emdash/admin/content/posts', text: 'Posts → Add New, then Publish.' },
  { title: 'Full guide', href: `/_emdash/admin/plugins/${PLUGIN_ID}/`, text: 'Every task, step by step.' },
];

export const TEXT = {
  helpNav: 'Help',
  helpHeading: 'Help — how to',
  helpLead: 'The most common tasks, step by step.',
  contents: 'Contents',
  startWidget: 'Getting started',
  choose: '— Choose —',
  placesColumn: 'Where it appears',
  placesPanel: 'Where this appears',
  notUsed: 'This text is not used on the site yet.',
  viewPage: 'View the page',
};

/** Help page sections. Write steps as the editor sees the buttons; name untranslated admin labels as shown. */
export const HELP: ReadonlyArray<{ id: string; title: string; steps: readonly string[]; note?: string }> = [
  { id: 'text', title: 'Change text on the site', steps: ['Open the page while signed in to the admin.', 'Switch on “Edit” at the bottom of the screen; editable text gets a thin outline.', 'Select the text, change it, then save and publish.'] },
  { id: 'mistake', title: 'If something goes wrong', steps: ['Nothing changes on the site until you select Publish.', 'To go back to an earlier version: open Revisions in the entry, choose the version, Restore, then Publish.', 'A deleted entry goes to the Trash of its list and can be restored.'] },
  { id: 'menu', title: 'Simplify my menu (once)', steps: ['Select your name at the top right → Settings. Under Personal, choose your Language.', 'On the same page, open Sidebars.', 'Navigation tab: switch off what you do not use. Editor sidebar tab: switch off panels you never need.'], note: 'These settings apply to your account only. Reset on the same page restores everything.' },
];
