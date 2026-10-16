# Issue #6 completion — 16 October 2026

The preceding Phase 3 milestone was committed locally as `6c1c412` (`Complete Phase 3 fixtures and local visual verification`). It includes #5/#7/#10 and their reviewed runtime/tooling prerequisites. The new HUD implementation is **uncommitted**. No push, tag, release or deployment occurred. The four pre-existing skill edits remain byte-for-byte unchanged; unrelated editorial documentation/drafts and the existing AGENTS editorial section remain in the working tree.

## Delivered behavior

- **O:** local PNG/JPEG/WebP picker/drop; header/type/size/dimension checks before decode; 10 MiB/32 MP bounds; opacity, CSS-pixel X/Y, explicit DPR/scale, reset and keyboard nudge pad; document-scrolling/fixed modes and mismatch reporting without stretching. URLs are revoked on replacement, clearing, drawer close, reset, stale loads and teardown. No uploads, arbitrary URL fetching or persistent storage.
- **P:** strict version-aware EmDash 1.3.0 `data-emdash-ref` decoding. Green field/blue entry-context outlines, amber unknown UI text and magenta unsupported markers have a textual legend. Public absence is unknown, not a missing-field verdict. Locale is explicitly unavailable in the installed annotation format. Real disposable editor annotations were inspected without content changes or save-verification claims.
- **Lifecycle:** independent G/O/P state; most-recent-tool Escape dismissal; preserved T/B/export/reset; input/composition/modal/editor exclusions; abort/navigation/pagehide cleanup and single initialization on page-load/persisted pageshow. Narrow layouts keep the HUD footer above the native EmDash toolbar.
- **Production:** compile-time DEV boundaries remove functional HUD client JS/CSS and controls. Normal styleguide GET/HEAD, including query-string attempts, return 404. Separate fixture output serves specimens, has no HUD and fails the normal release guard.

## Verification receipts

| Check | Result |
| --- | --- |
| Local Windows HUD browser suite | 15 passed; zero skips/failures/flaky cases; 390/768/1440 plus 320px resize |
| Local reference privacy probes | Each width: zero HTTP requests/storage writes after readiness; both created URLs revoked |
| Existing unit suites, Node 22.22.0 | 35 passed, including installed EmDash proxy/no-op and raster header fixtures |
| Astro typecheck | 41 files; zero errors/warnings/hints |
| Normal build + release profile | Passed on Node 22.22.0 |
| Fast CI command rehearsal | 20.152s; lint/schema/unit/normal build; no browser tests; excludes setup/install/network/queue |
| Local visual regression | 51 passed; 18 intentional suite-mode skips; zero failures/flaky cases; all 51 baseline hashes unchanged |
| Dev/fixture/normal HTTP isolation | Passed; public content healthy; production client JS/CSS contains no functional G/O/P payload |

`verification.json` records source hashes, renderer versions, actual test statistics and privacy probes. `ci-fast.json`/`.log`, `typecheck.log`, `dev-tools.json`, `hud-cleanup.json` and `visual-cleanup.json` retain underlying receipts. `captures/` contains native browser screenshots reviewed for reference alignment, public unknown ownership and real editor annotations. No baseline update was requested or performed. The build's existing large-chunk advisory remains; typecheck reports no diagnostics.

Browser tests stay strictly local on Windows with Node 24.21.0 / Playwright 1.64.1 / Chromium revision 1248. There is no added Actions browser job, git hook, production build dependency or Linux/Docker baseline requirement. Synthetic malformed-marker/entry-wrapper probes modify only disposable page DOM; the real field marker is emitted by EmDash after its supported development login and edit-mode toggle. They do not certify registration/save/publish behavior. The installed upstream proxy implementation is also executed in the unit fixture; its Node TypeScript stripping warning is expected.

## Completion and remaining boundary

Issue #6 is updated and closed against these criteria; see `issue-completion.json` for the GitHub readback. Issue #3 remains open and `stableReleaseRef` remains null. Follow [the final certification checklist](../../docs/phase-3-certification.md): review/commit this package, refresh upstream decisions, rehearse clean-checkout/runtime/editor coverage, finalize supported scope and publish a reviewed immutable standards reference before downstream rollout. Cloudflare/D1/R2, real notification providers and the remaining full CMS matrix are not certified by HUD diagnostics or screenshots.
