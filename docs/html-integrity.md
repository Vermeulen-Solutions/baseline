# Production HTML integrity

Run `npm.cmd run build`, then `npm.cmd run audit:html` (use `npm` on Unix). The audit always checks the release artifact for leaked fixtures. Emitted HTML is audited offline. When no HTML is emitted and `dist/server/entry.mjs` exists, it reserves an available port in 49152–65535, starts that production entrypoint on loopback with that `PORT`, captures public HTML, stops the server in `finally`, and audits the snapshots.

The SSR runner uses the existing local CMS and loads its ignored `.env` using Node's built-in env-file support. It makes anonymous GET requests; it does not seed content, create an admin, sign in or bypass setup. Populate the local CMS with representative published content before expecting a passing content audit. A stale navigation link to an unpublished `/about` page is a real failure.

Capture starts at `/`, follows internal anchors' destinations (including queries and local redirects), and requests a unique nonexistent route to verify a rendered 404 response. At least one linked successful sample page/post must be present; an empty homepage alone cannot pass. A post listing is a page, not evidence of individual article coverage: publish and link a sample post to exercise it. Links to the page's canonical origin are fetched through loopback; external destinations are never fetched. External redirects and CMS setup/auth redirects fail capture rather than substituting an unrelated page.

For a query-driven page, seed representative public URLs explicitly instead of relying on discovery. `--query-link-mode status-only` checks discovered query destinations' HTTP statuses without crawling each query response's links; explicitly seeded routes are still rendered and audited. The default `crawl` mode retains recursive query-link capture.

```powershell
npm.cmd run audit:html -- --route / --route "/agenda/?view=cards" --route "/agenda/?view=timeline" --query-link-mode status-only --timeout-ms 10000
```

The default deadline is 3.5 seconds, capped at 10 seconds with `--timeout-ms`; forced shutdown follows after 250ms. Capture defaults to 64 response URLs and 2 MB per HTML response. For a reviewed media-rich crawl use `npm run audit:html -- --max-resources 160 --timeout-ms 10000`: only integers from 2 through 512 are accepted. The same flag works on `snapshot-ssr.mjs`. Raising it does not extend deadlines or waive missing-route/linked-page, redirect, byte or origin checks. Failures exit nonzero and keep partial diagnostics. This is a representative public crawl, not authentication, browser or whole-site coverage.

The image audit requires an `alt` attribute. Informative images need meaningful text; decorative images may use the valid empty form `alt=""`. Whitespace-only text is rejected.

The SSR audit's origin is temporary and its owned process is stopped before the command returns. It is not an owner review link. After final source checks/build, start the reviewed built artifact in a separately owned loopback process for browser acceptance, record the printed origin/runtime and artifact/revision in the existing evidence home, then stop only that process. Keep a client's mutable dev server separate; never reuse an old captured origin or terminate unrelated Node processes to clear a port. The existing visual harness follows this built-artifact pattern in an isolated fresh app and records source revision/dirty state, origin, runtime and entry/CSS/seed hashes.

Local HTTP/browser harnesses share `scripts/loopback-port.mjs`. They bind only 127.0.0.1 and use the dynamic/private port range to avoid Fetch/browser-blocked ports, including on Windows machines where `PORT=0` can return a lower number. Occupied or excluded ports are retried a bounded number of times. A child process must bind after reservation release, so a cross-process race remains possible and must fail readiness clearly. Performance deadlines are unchanged.

The root `npm test` runs the exhaustive tier inventory: unit files with concurrency 2, then rehearsal files with concurrency 1. `verify:fast` and fast CI use the same unit cap. This separates bounded HTML performance checks from framework builds, installs and heavy Git subprocesses rather than increasing their time budgets.

Each run writes a unique ignored `.emdash/snapshots/capture-*` directory. HTML and `.ssr-snapshot.json` preserve original URL paths, queries, HTTP status and redirect mappings so missing pages cannot pass merely because their error HTML was saved. Same-page fragments on the 404 response still receive anchor checks.

To capture separately, run `node scripts/snapshot-ssr.mjs [dist] [--route <path>] [--query-link-mode crawl|status-only] [--timeout-ms <1-10000>]`. Repeat `--route` for representative sample URLs. To repeat the offline audit, run `node scripts/audit-html-integrity.mjs <capture-directory>`. Snapshots are retained for inspection and may be removed when no longer needed. On Ctrl+C or capture errors the runner stops its child and removes its signal listeners. No external package is used by the capture or HTML audit scripts.
