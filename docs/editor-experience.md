# Making the EmDash Admin Easy for Non-Technical Editors

This guide applies to the `emdash` profile (EmDash 1.5). It collects what a review of a live site's admin, done from the point of view of a non-technical editor working in French, taught us. The editor could publish news, but stalled on number fields, English option values, a crowded sidebar and lists that did not say what each entry was for. Each section says what to do and points to a template or helper where Baseline has one.

Start from the editor's real tasks, as [the editor handoff guide](editor-handoff.md) describes: walk through each task in the admin as that person, in their language, on a phone as well as a desktop, and write down every place where they would need to ask someone.

| Need | Baseline provides |
| --- | --- |
| Order derived from data | `src/lib/derived-order.ts` |
| Editorial order editors set by dragging | `src/plugins/editorial-order/` (template) |
| Select labels, list columns, "where this appears", help page, dashboard card | `src/plugins/editor-ui/` (template) |
| Reviewed admin metadata (widgets, labels, list columns, quick create) | `npm run cms:admin-metadata` |

The two plugins are templates: nothing in `src/plugins/` is active until `astro.config.mjs` imports it (see `src/plugins/README.md`). Copy or adapt them per site, set their `config.ts` and translate their text into the editors' language.

## 1. Avoid "display order" number fields

A number field such as `sort_order` asks the editor to keep a hidden numbering consistent across many entries and both languages. They do not know which numbers are taken, a new entry lands in a surprising place, and two translations can disagree. Before adding one, check whether the order already follows from the data:

- **Schedules:** weekday, then start time, then title. `compareByWeekdayAndTime()` reads weekday names in several languages and the first time in free text such as `16h30 – 18h00`.
- **People:** the order of their role in a taxonomy (the editor uses Move up / Move down under Taxonomies), then their name. `compareByTermRankThenName()` puts a parent term before its children and matches terms read in another locale by translation group.
- **Documents and similar lists:** category in the order the category select offers, then title with numbers read as numbers (U8 before U12). `compareByListThenTitle()`.

```ts
import { compareByWeekdayAndTime } from '../lib/derived-order';
const slots = (await getEmDashCollection('sessions', { locale })).entries.sort(compareByWeekdayAndTime({ locale }));
```

When you replace an existing number, first compare the derived order with the numbered order on every page that lists the entries, and render those pages before and after. Then relabel the old field (for example "Display order (no longer used: sorted by day and time)") instead of deleting it straight away; deleting a field drops its column and its data.

### When the order is truly editorial

Some orders are a choice, such as the order of partner logos. Give editors a page where they drag entries into place, not a number field. `src/plugins/editorial-order/` is a native plugin admin page that:

- drags with pointer events, so it works with a mouse, a pen and a touch screen. HTML5 drag-and-drop does not fire on touch screens. On touch, only the ⠿ handle drags (`touch-action: none`), so the page still scrolls;
- also moves rows with ↑/↓ buttons, and with the arrow keys on the focused handle;
- shows one row per translation group and writes positions 1…n only for rows whose number changes, then publishes each of them;
- refuses to save, writing nothing, when a published row has unpublished edits: publishing its new number would also publish someone's unfinished changes. The message names the rows to publish or discard first;
- reports a partial save (n of m) and asks the editor to save again.

The order field must be **not translatable** (`translatable: false`), so publishing one translation copies its number to the others. Keep the field in the schema; label it so editors know the page owns it (for example "Display order (change it under Partner order)"). Set `NAV_GROUP` to the collection's admin group so the page sits next to the collection.

## 2. Localised select labels without a data migration

Select options are stored values. When they are English codes (`public-funder`, `stored`) or the field mixes both languages' values (`Monday` and `Lundi`), editors see a confusing list. Renaming stored values needs a data migration and changes every query that filters on them. Instead, give the field a widget that only changes what the admin shows:

- `src/plugins/editor-ui/` exports a `choice` field widget. `CHOICES.labels` maps stored values to the editors' wording; `CHOICES.localeValues` lists values that belong to one locale, so an English entry is offered only English days.
- The entry's locale comes from its current value when that value belongs to one locale, else from the admin URL's `?locale=`, else the default locale. A current value missing from the options is still shown, so nothing is lost on save.
- Apply the widget per field with `widget: "<plugin id>:choice"` (section 7). The same labels feed list columns (`VALUE_COLUMNS`).

Option lists can only grow through the metadata script; it refuses a plan that would drop a stored option.

## 3. Columns, "where this appears" and help

- **List columns.** Set `listColumns` for each collection to the fields editors scan for (day and time for schedules, status and date for received forms). A plugin can add columns that show labels instead of stored values (`contentListColumns`).
- **"Where this appears."** Reusable snippets (hero images, call-to-action boxes, footer text) are hard to find by slug. The template's `PLACES` map adds a list column and an editor panel (`contentEditorPanels`) naming the page and the place, with a link to the page.
- **Help page.** A plugin admin page with the editor's common tasks, step by step, in their language. Write the steps as the editor sees the buttons, and give the English label in brackets where the admin catalog is not translated. Include "if something goes wrong": nothing changes until Publish, Revisions → Restore, the Trash.
- **Dashboard card.** A plugin dashboard widget linking each common task to its list or page.
- **Quick create.** Set `quickCreate: false` on collections the site fills itself (form submissions, messages) and on configuration singletons, so the dashboard does not invite editors to create them.

## 4. A shorter sidebar

Hide built-in admin areas the site never uses for every user with `admin.hiddenNavItems` in `astro.config.mjs`:

```js
emdash({
  admin: { hiddenNavItems: ["comments", "widgets", "sections", "bylines", "import"] },
})
```

EmDash 1.5 accepts `calendar`, `media`, `comments`, `menus`, `redirects`, `widgets`, `sections`, `bylines` and `import`; an unknown name fails the build. Hidden pages stay reachable by URL. Hide an area only when the site stores and renders nothing from it.

For the rest, each editor can simplify their own account once: their name → Settings → Personal → Language, and Settings → Sidebars (the Navigation and Editor sidebar tabs) to switch off entries and panels they do not use; Reset restores everything. Put these steps in the help page. The French admin catalog in EmDash 1.5 leaves "Sidebars", its tabs and several panel names in English, so name them as shown. These settings belong to the editor's account: set them with the editor, not for them.

## 5. Trap: `translationGroup`, not `translation_group`

Entries returned by `getEmDashCollection` and `getEmDashEntry` carry `data.translationGroup`. The database column is `translation_group`, but loaded entries do not have `data.translation_group`. Code that keys on the snake-case name silently falls back to the entry id, so the same person from two locales appears twice. Key on `entry.data.translationGroup ?? entry.id` when de-duplicating or matching across locales.

## 6. Relations are one link

The two sides of an EmDash relation (a team's coaches and a person's teams) are one stored link, shown on both entries. They cannot disagree, and changing one side changes the other. Do not add a second field that stores the same link in the other direction. Say this in the help page: editors otherwise update both sides and wonder which one wins.

## 7. Apply admin metadata with a reviewed script

Admin metadata (collection `admin.listColumns` and `admin.quickCreate`, field `widget`, `label` and select options) lives in the database, not in code. Change it through `PUT /_emdash/api/schema/collections/:slug` and `PUT /_emdash/api/schema/collections/:slug/fields/:field`, with a plan you can review:

```json
{
  "emdashVersion": "1.5.0",
  "fields": [
    { "collection": "sessions", "field": "day", "widget": "site-editor-ui:choice", "options": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
    { "collection": "partners", "field": "active", "label": "Show on the site (untick to remove the logo)" }
  ],
  "collections": [
    { "collection": "messages", "admin": { "listColumns": ["submitted_at"], "quickCreate": false } }
  ]
}
```

```bash
npm run cms:admin-metadata -- --base http://127.0.0.1:4321 --plan audit/editor-metadata.json
```

Without `--apply` the command prints each change as before → after and writes nothing. With `--apply` it writes each change and reads it back. It never adds or removes fields, collections or content, refuses a plan that would drop a stored select option, and with `emdashVersion` refuses an instance running another version. On a loopback dev server it signs in with the dev bypass; elsewhere it uses `EMDASH_TOKEN` or the EmDash CLI token for that origin. Rehearse on a copy of the database first, then run it against production with the owner's approval like any other production change, and record the plan with the deployment.

A changed seed does not change an existing site: put the same metadata in `seed/seed.json` for new installs, and use the plan for live sites.

## 8. Before discarding a draft, compare it with the live row

An entry can show "unpublished changes" left over from someone's earlier edits. Discarding the draft looks like the safe clean-up, but compare the draft with the live row first: a live revision can lack data that the row, and therefore the public page, still shows (in the case we met, the page's hero image). Discarding would restore the live revision and drop that data. When the draft holds the same content plus what the page already shows, publish it instead. When unsure, render the page before and after on a copy of the database.

## Acceptance

- Rehearse the editor's tasks again after the changes, in their language and on a phone.
- On a copy of the database: drag and save an order (check every locale's rows and the public pages), the blocked save, a widget save and reload, and the metadata plan with read-back.
- Record what changed, the rollback point and the checks in the site's deployment notes.
