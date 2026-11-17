// Site settings for the editorial order page. Copy this folder per ordered collection (give each copy
// its own PLUGIN_ID), set these values and translate TEXT into the editors' language.
// The order field must be a non-translatable number field, so translations share one order.
export const PLUGIN_ID = 'site-editorial-order';
export const COLLECTION = 'partners';
export const ORDER_FIELD = 'sort_order';
export const TITLE_FIELD = 'title';
/** Optional image field shown as a thumbnail (a media value with `url`), or null. */
export const IMAGE_FIELD: string | null = 'logo';
/** Every locale the collection has rows in; the first is the one shown in the list. */
export const LOCALES = ['en'];
/** Admin sidebar group: use the same group as the collection so the page sits beside it. */
export const NAV_GROUP: string | undefined = undefined;

export const TEXT = {
  navLabel: 'Partner order',
  heading: 'Partner order',
  intro: 'Drag the partners into the order the site should show them, then select “Save order”. The first in the list is shown first.',
  keyboardHint: 'With the keyboard: select the ⠿ handle, then use the up and down arrows.',
  listLabel: 'Partners in site order',
  loading: 'Loading…',
  loadFailed: 'Could not load the list:',
  handle: (title: string, position: number, total: number) => `Move ${title}, position ${position} of ${total}`,
  up: (title: string) => `Move ${title} up`,
  down: (title: string) => `Move ${title} down`,
  notPublished: 'not published yet',
  save: 'Save order',
  saving: 'Saving…',
  restore: 'Undo changes',
  unsaved: 'Order changed, not saved yet.',
  saved: 'Order saved. The site shows it within a few moments.',
  unchanged: 'The order was already saved.',
  blocked: (titles: string) => `${titles}: unpublished changes. Publish or discard them in the entry, then save the order again. Nothing was changed.`,
  partial: (done: number, total: number, error: string) => `The order was saved for only ${done} of ${total}: ${error}. Select “Save order” again.`,
};
