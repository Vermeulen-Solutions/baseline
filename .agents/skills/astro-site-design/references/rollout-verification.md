# Multi-page rollout verification

Use this reference for an established-site redesign that spans several templates or locales. Scale evidence to the change; do not impose a full-site audit on a small local edit.

## Make completion inspectable

Maintain one execution register with task IDs, named routes/locales, evidence paths and checkpoints. Distinguish implemented, verified and deferred. Enumerate generated records from current content, not only source manifests or route files. Treat representative visual review and sibling coverage as separate checks. When a later batch resolves an earlier blocker, update the current status while retaining its historical failure evidence.

Separate public presentation, editorial accuracy, CMS editing, mail/integration operation and deployment. A source fact awaiting the owner is an explicit editorial follow-up; do not invent its replacement or label the whole site verified without naming the limit. User-approved concepts and existing scope remain authoritative when work resumes.

## Capture the rendered result

Before full-page capture, inspect actual font readiness and render a viewport frame. Scroll through lazy sections using supported browser actions, observe after each scroll, and return to the top. Check capture dimensions, claimed route/content, top and footer, loaded imagery and overflow. A screenshot filename is not evidence that its contents are valid.

Persist full accessibility snapshots when recording evidence; transient diff snapshots are useful during interaction but incomplete as standalone records. Keep capture batches within the tool timeout and save progress between batches. Recapture only evidence invalidated by changes or failures, rather than repeating the entire audit without cause.

Check intermediate and narrow widths, long translated content and unusual/missing images. Record actual browser zoom/text-spacing checks separately from narrow-viewport reflow; one does not prove the other.

## Verify live enhancements after tooling

A passing server response and SSR screenshot do not establish that JavaScript works. After a build or typecheck, exercise key hydrated interactions on the still-running dev server. If dependency optimization invalidates live imports, diagnose the module/runtime failure; separate dev and tool cache directories where the installed framework supports it rather than treating missing enhancement as a CSS issue.

For geometry driven by JavaScript, inspect computed layout after final fonts and styles settle. Changes in CSS gaps can require recalculation even when container width stays constant. Unit tests of the geometry algorithm complement, but do not replace, browser checks of its real inputs.

Test real keyboard paths, including moving focus into a disclosure, activation and Escape from its contents. Programmatically focusing a control can trigger focus handlers before the activation event; verify the visible expanded state and focus return rather than assuming a successful click means the task passed.

## Preserve contracts and label evidence honestly

Compare original and final meaningful text, images/order, local destinations, dates, form names/types/required states and handlers. Keep imported cleanup narrowly grounded in observed artifacts and preserve substantive editorial content. Local HTTP audits should distinguish redirects from trailing-slash normalization, expected 404 states from failures, and unsupported HEAD from a failed GET.

A feedback query is a presentation preview, not successful storage or mail delivery. Native invalid-form checks and early server validation can verify failure handling without creating records. Read-only CMS checks establish loading/field compatibility; they do not establish save round trips. Keep production tests within explicit authorization and avoid polluting content with visual fixtures.

Use explicit UTF-8 for source/evidence read and write operations, especially on Windows. Check diffs for unintended encoding changes before a checkpoint.

## Close with bounded review

Follow the selected design skill's existing review contract rather than adding another review loop. Give fresh reviewers valid captures, the accepted design authority, known exceptions and exact scope. Apply material findings in a batch, recapture the same views and score those fixes. Keep detector advisories distinct from failures and do not claim full accessibility conformance from automated checks alone.

Finish by reconciling the execution register, plan and evidence. Reports should say what changed, what was tested, what remains owner-dependent, and what was committed or deployed. Update reusable process guidance only where observed failures justify a useful decision rule; keep project facts and individual incidents in the project's audit records.

## Reusable audit acceptance lessons

Use docs/reusable-public-patterns.md where the starter provides image/card/partner/form primitives. Check practical density: compact filter/count groups, repeated contacts/roles, long preview dates, odd grid rows, footer hierarchy and membership prerequisites before forms. Verify both locale metadata and readable gallery alternatives. Inspect actual loaded lazy images; blank unscrolled full-page captures are not broken-image evidence. Check actual selected srcset/sizes against native dimensions; distinguish low-resolution source media from processing artifacts. Verify light/dark focus contrast and reduced-motion/logo hover without tile-edge movement. Forms must preserve permitted answers securely and show reason-specific errors with matching native/server date validation. No form delivery test is implied by a visual review.

Route checks must preserve full query URLs in results and retry image HEAD=405 with GET. Compare visible page identity with the accepted design rather than obsolete imported titles. Serialized admin translation strings do not prove a setup wizard is visible. A deployment is incomplete until code, required CMS edits and media references are verified independently; never assume local media IDs equal production storage keys.
