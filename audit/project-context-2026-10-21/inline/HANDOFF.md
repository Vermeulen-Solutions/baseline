# Workshop feature handoff — 2026-10-21

This is a source-review handoff for a fictional evaluation site. Only this handoff and the evaluation result were updated; implementation, tests, browser checks and deployment were not performed.

## Established need and decisions

Continue from the [existing site brief](AGENTS.md#existing-site-brief) and [2026-10-19 decision note](audit/brief-decision.md), which own the durable client context. Local team leads at small organizations need to find practical workshops and register by email. The agreed launch scope is one English locale, developer-owned static editing, a workshop index and detail pages, with registration at `mailto:workshops@northline.example.test`. Preserve that endpoint and the supplied workshop copy. The Studio editor supplies content; the site maintainer owns code, builds and deployment. Browser CMS and payments are outside scope. No launch date is approved; quarterly publication is an assumption only.

The earlier handoff's pending-platform choice, EmDash installation and repeated audience/registration discovery are superseded by the decision note and installed source. No customer question is needed for this handoff or the next local planning step. Hosting and launch acceptance remain unestablished and do not prevent route planning.

## Current implementation and evidence

- [baseline.config.json](baseline.config.json) selects `static`; [astro.config.mjs](astro.config.mjs) sets static output. Continue with native Astro files, without CMS setup or dependencies.
- [src/content.config.ts](src/content.config.ts) registers the `workshops` collection with a Markdown glob loader and typed `title`, coerced `date` and `draft` fields. `draft` defaults to false. Draft exclusion is still route work, not proven behavior.
- [clear-briefs.md](src/content/workshops/clear-briefs.md) supplies “Clear project briefs”, dated `2026-11-12`, with `draft: false`, and “Leave with a clear brief and manageable next steps.” Keep these facts and copy intact; no additional content approval is evidenced.
- [src/pages/index.astro](src/pages/index.astro) contains only the “Northline workshops” heading. There is no workshop listing, detail route, Markdown body rendering or registration link yet. No workshop URL inventory is established.
- The saved [Art Direction Record](AGENTS.md#art-direction-record) specifies Editorial Paper, a practical workshop notebook, system serif headings/system sans body, warm paper, forest accent, thin borders and balanced density. Its presence does not prove client approval, gate execution or rendered calibration.
- [global.css](src/styles/global.css) owns implemented spacing: `--spacing-grid: clamp(1rem, 0.5rem + 2vi, 2.25rem)` and `--layout-grid-gap: var(--spacing-grid)`. Preserve that fluid relationship. [DESIGN.md](DESIGN.md) explicitly labels its fixed 32px gap and EmDash note as an unselected earlier concept; it does not override current CSS or the static decision.

The brief remains in AGENTS.md. No PROJECT.md is adopted or required; PROJECT.example.md is only an optional template. No context migration or new discovery is needed.

## Remaining work

1. Finish the local route plan: index and reusable workshop detail archetypes, stable paths, navigation, date ordering and draft exclusion. Preserve the supplied entry and email registration journey. Route planning may proceed before the visual gate.
2. Before visual implementation, use the established art direction and check the static tooling actually available. This fixture contains no package manifest, lockfile, reusable primitives, styleguide route or calibration evidence. Do not report their scripts or APIs as available or verified, and do not install EmDash to fill those gaps. Once the complete static implementation environment is available, run its art-direction gate and calibrate relevant shared components before page assembly. Use shared responsive spacing with the recorded balanced density; an old fixed-gap export is not a new requirement.
3. Build native Astro listing/detail templates with draft-filtered collection queries, detail `getStaticPaths()` and Markdown `render()`, using the established shell/primitives and RichText when available. Add the preserved mailto registration link, useful navigation and route metadata. Do not invent venue, times, prices, capacity or payment behavior absent from supplied content.
4. In a subsequent implementation task, perform the static project's available verification/build/dev-tool checks, then inspect representative routes, draft behavior, links, focus, reflow and 404 behavior. Record actual results and visual critique/calibration evidence. None of those checks has occurred in this task.
5. Keep hosting configuration, deployment and client acceptance pending. Deployment requires authorization covering the concrete external action; no deployment is requested here.

## Next concrete local action

In the next implementation task, prepare a route map from `src/content.config.ts`, `src/content/workshops/clear-briefs.md` and the current root page. Propose `/workshops/` and `/workshops/clear-briefs/` as local route candidates, explicitly pending implementation rather than approved or existing URLs; record the root-page link and draft/date rules. This is useful local preparation with sufficient existing evidence and needs no repeat discovery or permission checkpoint. Before writing visual templates, inspect the complete static tooling and satisfy the art-direction and component-calibration gates described above.

This request ends at the handoff. The workshop feature remains unimplemented and unverified.
