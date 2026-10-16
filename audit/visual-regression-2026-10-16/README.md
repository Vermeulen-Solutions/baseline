# Issue #7: local Windows capture harness

Implemented the native Playwright Test suite against an isolated, seeded, actual Node standalone server. The maintainer's 16 October policy supersedes the original Linux/container/browser-CI proposal: Windows goldens are authoritative and screenshots run only locally. Source changes remain uncommitted; no deployment or standards release was made.

## Verification

[Three comparison repetitions](repeat-verification.json) passed: **153 passed, 54 intentional skips, zero failures/flaky results**, in 269.369 seconds including isolated bootstrap. All [51 baseline hashes](baseline-hash-verification.json) match the explicit update manifest; verification changed no goldens. The explicit final baseline update passed 44 tests with 25 intentional skips. Negative sensitivity cases never run while updating, and reflow/actual zoom each have one designated placement. There are 51 reviewed PNG baselines across 390/768/1440 projects, plus narrow text-spacing and actual zoom captures.

- [Fast CI rehearsal](ci-fast-node22.json): Node 22.22.0, art-direction, syntax lint, schema budget, 33 unit tests, normal build and release guard passed in **14.701 seconds**. This is a local command rehearsal, excluding checkout, setup, npm ci, queue and network; actual Actions runtime is not claimed. [Command output](ci-fast-node22.log).
- Typecheck: 37 Astro files, zero errors/warnings/hints on Node 24.21.0. Schema budget: pages 17 and posts 19 physical columns.
- Failure and cancellation cleanup probes passed, with server stopped, dependency junction unlinked and owned temporary tree removed. The Windows cancellation IPC relay has its own unit test and does not change Playwright worker IPC.
- [Pre-existing skill files](pre-existing-work-preserved.json) remain byte-for-byte unchanged. Exact source exceptions were reviewed and the art-direction gate passes; no client Art Direction Record was fabricated.

## What the harness found

The first unchanged repetitions exposed 12,272-pixel differences from Chromium skipping offscreen gallery paint after text-spacing changes. Re-scrolling alone did not stabilize it. Screenshot-only `capture.css` now forces gallery content visibility; no masks, layout patches or increased screenshot allowances were added.

Fully painted captures then revealed a real gallery bug: fixed item heights clipped captions and let expanded text overlap the next image. The source now fixes image-link height while captions contribute to normal row height. Browser geometry checks require captions to fit their own items at text spacing and actual zoom. [Before/after findings](capture-findings.json), [corrected caption capture](captures/caption-after-fix.png).

Capture review also caught a blank animated RTL ticker despite a passing adjacent-track seam check. The RTL animation-name selector lost to a more specific checked-state shorthand. The source now selects direction through an inherited custom property. Tests require both viewport edges to be covered and actual logo content to remain visible at start/mid/end; [original geometry](rtl-before-fix.json) records the fault. Width calculations allow less than 0.01 CSS pixels for transformed DOMRect float error (observed 0.000122px); the screenshot allowance stays **zero changed pixels**, with pixelmatch color threshold 0.1 and no area ratio allowance.

## Sensitivity and retained receipts

The shared-token defect produced **35,237 different pixels** and the small targeted control defect **1,126**; each failed the native matcher and passed after reverting with unchanged baseline hashes. See [failure messages](sensitivity.json), [small defect diff](captures/small-target-diff.png) and [shared-token diff](captures/shared-token-diff.png). Missing goldens/routes/fonts/images and HTTP-200 setup pages were rejected for the intended reasons in all three repetitions. The seven negative probes run once per repetition; duplicate viewport placements are intentionally skipped.

[Coverage register](coverage.json), [browser seam/zoom measurements](browser-states.json), [renderer environment](environment.json), [bootstrap](bootstrap.json), [normal cleanup](cleanup.json), [failure cleanup](cleanup-failure.json), [abort cleanup](cleanup-cancellation.json), [typecheck](typecheck.json), [source hashes](source-hashes.json) and [explicit baseline update](baseline-update.json) retain the evidence. Native HTML/JSON reports and traces remain under ignored `.emdash/visual/` until the next run.

## Coverage and boundaries

Eight real routes cover public pages, collection/post, category/tag, intentional 404 and the styleguide. Captures prove route/content identity, local font loading, image decoding and runtime/network health. Native keyboard behavior, gallery open/next/Escape/focus return, active ticker pause/stop/resume, reduced-motion/print, no-JS document-script positive/negative controls, 320px text spacing and actual Chrome 200%/400% zoom are separate assertions. The owned zoom extension never touches a user's browser profile.

Each bootstrap verifies the clean normal artifact serves seeded public content and returns styleguide GET/HEAD 404 even with runtime/query/cookie attempts. Separate `dist-fixtures` serves version 2 specimens without HUD/write identities and is rejected by the release guard. No working database, uploads, env files or cloud credentials are copied. The browser date and server seed/render dates are fixed; animation timers remain live.

The automated workflow has one Node 22.22.0 job for fast checks and normal build, no browser job/download/matrix/container/artifact upload, and a five-minute failure cap. Visual configuration rejects CI execution. Builds/deployments cannot fail on screenshot diffs. Typecheck/heavier HTTP/browser checks stay local. [Runbook](../../docs/visual-regression.md), [baseline manifest](../../tests/visual/baselines/win32/manifest.json).

This is Chromium/Windows fixture evidence, with pinned Noto Sans rather than OS fallback fonts. Client sites must select their actual licensed fonts. Firefox/WebKit, screen-reader conformance, real CMS/editor save cycles, Worker/D1/R2 behavior and provider delivery remain outside this certification. Forced OS process-tree termination can bypass JS cleanup; only verified owned temporary paths may be removed afterward. Candidate standards remain unreleased.

## Roadmap status

[#5](https://github.com/Vermeulen-Solutions/emdash-site-starter/issues/5), [#7](https://github.com/Vermeulen-Solutions/emdash-site-starter/issues/7) and [#10](https://github.com/Vermeulen-Solutions/emdash-site-starter/issues/10) are updated and closed as completed on the supported local Node/Windows surface. [Read-back states](issue-completion.json) and verified issue JSON retain the final body/state receipts and local/uncommitted scope. The next scheduled implementation package is #6 screenshot overlay/proxy inspector; #3 stable release certification and later phases remain pending.
