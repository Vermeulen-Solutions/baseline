---
bump: minor
platforms: [emdash]
areas: [components, tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [src/lib/content-security-policy.ts, src/middleware.ts, src/env.d.ts, scripts/check-quality.mjs]
---

# A Content-Security-Policy computed from each page, report-only first

With `CSP_MODE=report` or `enforce` in the build environment, the middleware adds a Content-Security-Policy to every public HTML response. The policy hashes each inline script and style the page actually carries, so scripts need no `'unsafe-inline'`. `style=""` attributes stay allowed, because Baseline uses them for layout values and they cannot run code. `CSP_SOURCES` adds third-party origins; it is checked when the server starts, so a malformed value fails then.

Mode `report` blocks nothing. The policy skips:

- `/_emdash/*`, where EmDash sets the admin's own policy;
- signed-in and editing requests;
- responses that already carry a policy;
- non-HTML responses.

`npm run check:quality` now reports `csp-violation` for anything the policy blocks or, in report-only mode, would block.

Astro's built-in `security.csp` was tried and not used. On Baseline's pages it blocked the inline shell script, two inline styles, EmDash's own inline style and the speculation rules, and it would have needed per-route exceptions for the admin. A policy computed from the final HTML covers all of these.

## For sites

Copy `src/lib/content-security-policy.ts`, take the new `src/middleware.ts` (or add the `withContentSecurityPolicy` call before `withSecurityHeaders` in your own), add the two `ImportMetaEnv` entries to `src/env.d.ts`, and update `scripts/check-quality.mjs`. At the next deploy:

1. Build with `CSP_MODE=report` (plus `CSP_SOURCES` for analytics, embeds or fonts from elsewhere).
2. Run `npm run check:quality` and fix or allow each `csp-violation`.
3. After a week of clean checks, switch to `CSP_MODE=enforce`.

Sites with `<ClientRouter />` stay on `report` or `off`.
