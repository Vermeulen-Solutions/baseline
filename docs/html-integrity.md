# Production HTML integrity

Run `npm.cmd run build`, then `npm.cmd run audit:html` (use `npm` on Unix).
The audit always checks the release artifact for leaked fixtures. Emitted HTML
is audited offline. When no HTML is emitted and `dist/server/entry.mjs` exists,
it reserves an available port in 49152–65535, starts that production entrypoint
on loopback with that `PORT`, captures public
HTML, stops the server in `finally`, and audits the snapshots.

The SSR runner uses the existing local CMS and loads its ignored `.env` using
Node's built-in env-file support. It makes anonymous GET requests; it does not
seed content, create an admin, sign in or bypass setup. Populate the local CMS
with representative published content before expecting a passing content audit.
A stale navigation link to an unpublished `/about` page is a real failure.

Capture starts at `/`, follows internal anchors' destinations (including queries
and local redirects), and requests a unique nonexistent route to verify a rendered
404 response. At least one linked successful sample page/post must be present;
an empty homepage alone cannot pass. A post listing is a page, not evidence of
individual article coverage: publish and link a sample post to exercise it.
Links to the page's canonical origin are fetched through loopback; external
destinations are never fetched. External redirects and CMS setup/auth redirects
fail capture rather than substituting an unrelated page.

The default capture deadline is 3.5 seconds, with forced shutdown after a 250ms
grace period. Capture is bounded to 64 response URLs and 2 MB per HTML response.
Deadline/limit failures exit nonzero and keep partial diagnostics. This is a
representative public crawl, not authentication, browser, or whole-site coverage.

Local HTTP/browser harnesses share `scripts/loopback-port.mjs`. They bind only
127.0.0.1 and use the dynamic/private port range to avoid Fetch/browser-blocked
ports, including on Windows machines where `PORT=0` can return a lower number.
Occupied or excluded ports are retried a bounded number of times. A child
process must bind after reservation release, so a cross-process race remains
possible and must fail readiness clearly. Performance deadlines are unchanged.

The root `npm test` runs the exhaustive tier inventory: unit files with concurrency
2, then rehearsal files with concurrency 1. `verify:fast` and fast CI use the same
unit cap. This separates bounded HTML performance checks from framework builds,
installs and heavy Git subprocesses rather than increasing their time budgets.

Each run writes a unique ignored `.emdash/snapshots/capture-*` directory. HTML
and `.ssr-snapshot.json` preserve original URL paths, queries, HTTP status and
redirect mappings so missing pages cannot pass merely because their error HTML
was saved. Same-page fragments on the 404 response still receive anchor checks.

To capture separately, run `node scripts/snapshot-ssr.mjs [dist]`. To repeat the
offline audit, run `node scripts/audit-html-integrity.mjs <capture-directory>`.
Snapshots are retained for inspection and may be removed when no longer needed.
On Ctrl+C or capture errors the runner stops its child and removes its signal
listeners. No external package is used by the capture or HTML audit scripts.
