# Workshops content handoff

Prepared 2026-10-21. This task ends at the typed model and sample content.

## Settled decisions and completed work

- Keep Astro's `static` profile, English-only Markdown maintained by developers in Git. There is no CMS or registration backend.
- `workshops` is registered in `src/content.config.ts` with a native glob loader for `src/content/workshops/**/*.md`.
- Fields: nonempty trimmed `title`, lowercase hyphenated `slug`, nonempty trimmed `summary`, coerced Date `date`, nonempty trimmed `venue`, boolean `draft` (defaults to false). Both samples set draft explicitly. File IDs and explicit slugs currently match; future public URLs should use `data.slug`.
- Dates represent calendar days, authored as `YYYY-MM-DD`. No event time or timezone was supplied. Avoid local-time formatting that could shift the displayed day; use UTC or an equivalent calendar-date-safe formatter.
- Supplied entries: **Clear project briefs**, `clear-project-briefs`, 2026-11-12, Northline Studio, `draft: false`; **Winter planning clinic**, `winter-planning-clinic`, 2026-12-03, Northline Studio, `draft: true`. Their summaries match the request verbatim.
- Future action: **Ask about a place**, linking to `mailto:hello@northline.example.test`. This is a plain email enquiry, with no booking, payment or registration service.
- Existing design, content, routes and navigation were preserved. No workshop page or navigation item has been implemented. Collection registration does not itself create routes or enforce public draft visibility.

## Exact files changed

- `src/content.config.ts` — added and exported the typed collection; existing posts schema retained.
- `src/content/workshops/clear-project-briefs.md` — published sample.
- `src/content/workshops/winter-planning-clinic.md` — draft sample.
- `AGENTS.md` — recorded workshop scope and settled decisions.
- `HANDOFF.md` — this handoff.

## Validation

- `npm.cmd run verify` — passed: script/template lint, CSS contracts, art-direction gate, token audit, 39/39 tests and Astro typecheck. Content sync accepted both real workshop files. Typecheck reported 0 errors, 0 warnings and four pre-existing unused-import hints (`Card`/`Grid` in unchanged contact/services pages).
- `npm.cmd run build` — passed, including `postbuild` release-artifact check. Exactly seven existing public pages were generated: `/`, `/about/`, `/contact/`, `/services/`, `/posts/`, `/posts/welcome/`, and `/404.html`.
- `npm.cmd run check:dev-tools` — passed; no styleguide, fixture specimens or server entrypoint leaked into production output.
- PowerShell output assertions — passed: seven HTML files, no `dist/workshops`, and no workshop slug or `/workshops/` reference in emitted public HTML.
- `git diff --check` — passed. No existing regression checks were changed or removed. No browser acceptance was performed because this scope adds no public UI; browser acceptance remains pending for future page implementation. No servers were started and no deployment/external write was performed.

## Remaining implementation

1. When authorized, build `/workshops/` using the existing Base/layout primitives and visual system. Query `getCollection('workshops', ({ data }) => !data.draft)` so the winter draft stays private. Do not infer that a date controls publication. Suggested ordering is ascending workshop date; this is a recommendation, not a settled user requirement.
2. Add the navigation item only with that page. No detail routes have been requested; confirm a need before adding them. If later adding detail routes, exclude drafts from their `getStaticPaths()` as well and use the explicit slug.
3. Render the supplied date, venue, summary and email action accessibly; preserve calendar dates across timezones. Add focused acceptance/regression coverage for published versus draft behavior when public rendering exists.
4. Run the installed verification/build/isolation gates and inspect the new page at narrow, intermediate and wide widths with keyboard focus. No workshop visual/browser acceptance is claimed at this content-only stage. No deployment is authorized.
