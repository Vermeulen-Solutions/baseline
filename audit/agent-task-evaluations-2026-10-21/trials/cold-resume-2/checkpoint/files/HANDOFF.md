# Workshop content handoff

Prepared 2026-10-21. This delivery completes only the typed model and supplied
sample content. No workshop page, navigation, public rendering or registration
backend has been implemented. Existing design, routes and content are preserved.

## Settled decisions

- User requirements: native static Astro; developer-maintained Git files; English
  only; no CMS or registration backend.
- Required workshop fields: `title`, `slug`, `summary`, `date`, `venue`, `draft`.
  `draft` is an explicit boolean, with no default. Slugs use lowercase kebab case;
  keep them unique and align filenames with slugs. Astro's native glob loader
  uses the frontmatter slug as the entry ID.
- Implementation choice: dates remain quoted ISO calendar-date strings
  (`YYYY-MM-DD`), validated as actual dates. No event time or time zone is implied.
- `clear-project-briefs`: Clear project briefs; 2026-11-12; Northline Studio;
  `draft: false`; summary: Learn how to turn an initial conversation into a useful
  project brief.
- `winter-planning-clinic`: Winter planning clinic; 2026-12-03; Northline Studio;
  `draft: true`; summary: A working session for planning the next quarter.
- Future registration action: **Ask about a place**, linking only to
  `mailto:hello@northline.example.test`. No form, booking or payment integration.

## Exact changed files

- `src/content.config.ts` — registers `workshops` without changing `posts`.
- `src/lib/workshop-schema.ts` — reusable Zod schema, inferred by Astro's types.
- `src/content/workshops/clear-project-briefs.md` — supplied published entry.
- `src/content/workshops/winter-planning-clinic.md` — supplied draft entry.
- `tests/workshops.test.mjs` — valid calendar dates and explicit status; rejects
  missing/blank fields, impossible dates, invalid slugs and nonboolean flags.
- `AGENTS.md` — durable scope, content ownership and future action decisions.
- `HANDOFF.md` — this handoff.

## Validation

Observed with Node v24.21.0 and npm 10.5.0; existing dependencies were installed.

- `npm.cmd run verify` — PASS: script/template lint, CSS contracts, art-direction
  record, token/contrast audit, all 42 tests (including three new workshop schema
  tests), and Astro type checking. Typecheck: 0 errors, 0 warnings, 4 existing
  unused-import hints in unchanged `contact.astro` and `services.astro`.
- `npm.cmd run build` — PASS: native content sync validates both Markdown entries;
  7 existing output pages, including 404; native image optimization succeeds;
  postbuild release-artifact assertion passes. No workshop route is emitted.
- `npm.cmd run check:dev-tools` — PASS: no styleguide, fixture or server leakage.
- `git diff --check` — PASS. Existing posts, pages, navigation, layouts, components,
  styles, package definitions and lockfile have no changes.
- One-off Playwright Chromium check against local
  `node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 45872` —
  PASS: `/`, `/about/`, `/contact/`, `/services/`, `/posts/`, `/posts/welcome/` each
  respond 200 at 390px and 1280px, retain headings and fit the viewport; no workshop
  content or navigation appears. First keyboard target has a focus outline;
  native post image loads with alt text. `/workshops/` and `/_styleguide/` return
  404. Owned preview server stopped after acceptance.

These are local content/build and preservation checks, not acceptance of the
future workshop interface. No external writes, deployment or CMS operations.

## Remaining implementation (future request)

1. Build `/workshops/` using existing Base/layout primitives and established
   tokens. Read the typed collection with `getCollection('workshops',
   ({ data }) => !data.draft)`; stored published status alone does not create a
   route or guarantee draft exclusion. Do not expose draft content in public
   listings, feeds, search, or any future detail routes.
2. A reasonable proposed listing order is ascending `date`, with `slug` as a
   stable tie-breaker; ordering was not specified by the user. Format dates as
   calendar dates without a browser time-zone shift.
3. Add the agreed mailto action and navigation only when that public work is
   requested. No detail route is required by today's brief.
4. Re-run `npm.cmd run verify`, `npm.cmd run build` and
   `npm.cmd run check:dev-tools`; then test published-only rendering, the mailto
   destination, keyboard focus and responsive layout in the browser. Deployment
   remains outside the current authorization.
