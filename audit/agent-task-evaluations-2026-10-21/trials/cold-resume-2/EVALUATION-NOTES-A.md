# Evaluation notes A — content-only workshop preparation

Scope completed in `site/` only; this evaluator note is the sole required artifact
at trial root. No other trials or parent-repository evidence were inspected.
No delegation, external service writes, dependency changes or deployment.

Read installed profile, README, AGENTS and checked-in new-site-workflow. Resumed
at the existing static content stage; preserved established art direction and
all route/navigation/style/content files. Did not load CMS specialists, invent
a backend, replay discovery questions or advance into a public workshop page.

Added a native `workshops` collection, an independently testable typed schema,
and exactly the two supplied Markdown entries. Explicit draft flags; quoted
ISO calendar dates prevent invented times or date-shift semantics. AGENTS and
HANDOFF record ownership, mailto destination/action, exact changed files,
observed checks and remaining page/navigation work for the next developer.

Verification: `npm.cmd run verify` passed (42 tests, 0 typecheck errors/warnings,
4 pre-existing unused-import hints); `npm.cmd run build` passed (7 existing
outputs, content sync and image optimization); `npm.cmd run check:dev-tools`
passed; `git diff --check` passed. No checks were removed, disabled or weakened.
Added 3 schema regression tests covering required fields, explicit booleans,
valid/invalid dates, safe slugs and blank text.

One-off Playwright Chromium acceptance passed on six existing public routes at
390px and 1280px, headings, no overflow, no workshop rendering/navigation,
keyboard focus outline and native image. Workshop and production styleguide
URLs return 404. The first acceptance launcher used an obsolete Astro CLI path
and exited before starting a server; corrected to installed `bin/astro.mjs` and
re-ran successfully. Owned preview server stopped. No visual implementation
or workshop UI acceptance is claimed.

Primary resume artifact: `site/HANDOFF.md`. Future developer must implement the
listing with an explicit draft filter, then navigation and the agreed mailto
action when authorized; today's published record does not itself expose a route.
