# Delivery workflow rehearsal, 4 November 2026

The follow-up adds source structure inspection, actual owner-task rehearsal, optional public-page/font evidence and a compact feedback-to-verified-result loop. These extend the existing discovery/content-planning work without adding a mandatory planning document, review stop, analytics service or runtime dependency. The [implementation plan](../docs/workflow-delivery-followup-plan.md) records scope and release endpoint.

## Shipped behavior

`baseline:inspect -- --structure --json` optionally follows route imports into local native components and reports rendered component tags, markup-producing loops, literal content queries and field-access hints. Default inspection output is unchanged. Dynamic expressions and external modules remain unresolved explicitly; no configuration executes and no database or private environment is read. Source observations support a route → component → content owner → editor → observed-result map; they do not prove live binding.

The new `audit:page` is opt-in local browser evidence, excluded from CI and production builds. It records bounded loading/layout-shift observations, received bytes, actual rendered glyph families, resource failures and conditions. Public loopback targets, fresh anonymous contexts and bounded same-origin read requests keep its scope explicit. Regression probes caught and closed redirect, popup and WebSocket interception gaps before release. There is no universal score or implicit performance approval.

Workflow guidance now connects representative implementation to actual owner editing tasks, shared-component/loop verification, font/media readback and a bounded feedback → target → change → inspected result → status record. Existing notes remain the home for evidence; static file edits, Git-backed editing and relational CMS publication retain their different acceptance paths.

## Loops and components

Inspection confirmed collection loops already exist in the native CMS routes and static post routes. Static posts already use the shared Card component. Home, category and tag repeated the same CMS preview markup, so that item now lives in `PostListItem.astro`; the home-only date is an explicit variant. Queries, ordering, destinations, empty states and CSS are unchanged. The component stays CMS-only; the inspection helper, page audit and guidance ship to both static profiles.

A fresh build of unchanged `e08c7eea13b1620940407b128628b259b28d2a40` and the changed source produced identical main-content pixels, text, links and dates on `/`, `/category/general` and `/tag/starter` at 390, 768 and 1440 pixels. All nine comparisons passed with zero browser runtime exceptions. Both control and changed home initially emitted the same resource-404 console message. Exact-path design-gate exceptions describe the neutral extraction and bind current LF-normalized source hashes.

## Disposable fictional pilot

The repair-workshop fixture used the existing Section, Grid, Card and native image/editor APIs. Its overview and service index query `workshop_services`, order by title and render `services.map(service => <WorkflowServiceCard ... />)`. The detail route reads the entry and registered edit fields. Structure inspection observed 11 routes and 42 related sources, including both collection loops, their shared item component and detail-field access. External renderer internals remain unresolved rather than inferred.

| Owner task | Actual owner/interface | Observed result |
| --- | --- | --- |
| Change the displayed chair price | `workshop_services` → `chair-joints` → `price_label`; inline editor | Typed £85 → £95, saved, reloaded, published and read back anonymously |
| Add another service | Native collection admin | Saved/reloaded/published Bench joint repair; list changed from two to three in the expected alphabetical order without changing template/component source; followed `/workshop-services/bench-joint-repair` and verified its title, price and description |
| Replace the service image | Native media upload/details and content image picker | Prepared two synthetic assets, uploaded and edited alternatives/captions, saved/published the initial reference, then replaced/saved/reloaded/published; anonymous image URL changed and decoded successfully |
| Correct shared card spacing | One fixture-only component source | Replaced the deliberately cramped 8px control with the existing content token; all three cards on both routes changed consistently at 390/768/1440px, preserving copy and avoiding horizontal overflow |

Native primitive calibration was captured on `/_styleguide` at narrow/wide widths before the pilot build. The successful owner/shared-component run recorded zero runtime errors. Root seed bytes and unrelated pages/posts API content hashes remained unchanged. Synthetic schema, content, assets and routes existed only in the owned temporary instance; its database was not copied from the working project. Dependencies were reused through an owned junction, so this rehearsal is not an independent-install claim. Temporary server/tree cleanup is recorded separately.

The agent operated the real editing interfaces. This proves the tested technical round trips, not that a human owner has accepted the interface or completed training. A media caption stored in the library is not automatically a visible caption on a route.

## Public-page observations and limits

Three fresh anonymous loads per route/viewport used the production fixture build, Chromium, device scale 1, reduced motion, browser cache disabled, CPU slowdown 1, unthrottled loopback and a 1500ms post-load observation window. Server cache state was uncontrolled. The selected heading, paragraph and body samples used the system stack and reported actual Segoe UI glyphs. This neutral rehearsal does not select typography for a client.

| Route | Viewport width | Median observed LCP | Maximum observed CLS window | Completed received bytes |
| --- | --- | --- | --- | --- |
| Service index | 390 | 108ms | 0 | 127,175 |
| Service index | 1440 | 108ms | 0 | 127,175 |
| Chair service detail | 390 | 132ms | 0 | 123,904–123,905 |
| Chair service detail | 1440 | 132ms | 0 | 123,904 |

All twelve loads remain **incomplete**: the automatically requested `/favicon.ico` transfer was canceled without a completed response. An ordinary local request also followed its redirect to a 404. The receipt retains that failure; byte totals cover completed transfers only. No page runtime error or blocked request was recorded. These small synthetic pages, loopback timings and bounded no-interaction loads establish neither deployed performance nor a commercial-site budget. Real content, deliberate site icons, lazy media, interactions, field evidence and human acceptance belong to the real site's existing release review.

## Verification and release

Doctor, fast verification, skill validation, focused source-inspection tests and all nine page-audit tests with browser fixtures explicitly enabled passed. The latter includes three actual browser fixtures. Both generated static profiles independently installed/clean-installed, verified, built, checked production/fixture output and passed their applicable HTTP checks.

Full root verification initially failed only the existing 250-page HTML-auditor timing assertion: 1010.9ms against a 1000ms limit while concurrent builds ran. The serial release run passed all 313 unit and 156 lifecycle-rehearsal tests; the timing test completed in 272.4ms. Typechecking passed with zero errors/warnings and the existing clipboard deprecation hint. The fresh root production build, release-artifact gate and HTML audit passed; the latter checked nine HTML files and captured ten public SSR responses. Root and generated builds do not include the fictional fixture routes.

The full local visual suite was attempted but stopped on three existing reference differences: active ticker height 168 → 169px, reduced/print ticker height 236 → 237px, and the no-JavaScript styleguide image. An archive of unchanged main reproduced the same three failures, including the same reported pixel counts; no goldens were updated. Therefore broad visual-regression acceptance remains limited. The nine targeted before/after route comparisons above passed independently.

Raw receipts, traces, browser screenshots, synthetic save payloads and command logs remain in ignored local evidence directories. Selected screenshots and sanitized task/source excerpts were copied to the chat's artifact directory. No credentials, real client claims, generated fixture routes, production writes or deployment are included. Release endpoint: reviewed feature commit pushed to origin; merge remains a separate request.
