---
name: new-site-workflow
description: Coordinate new sites, full rebuilds, and maintenance spanning content models, templates or shared design in this Astro and EmDash starter, plus requested visitor-research plans and synthesis for a website. Use profile-aware stages and existing decisions; route implementation to the relevant specialist skills. Isolated component or content edits can use their specialist directly.
---

# New site workflow

Turn the neutral starter into a coherent, content-backed site by sequencing the specialist skills. This skill owns the order, decisions, and handoffs. It does not duplicate their implementation guidance.

This file is the router. It decides the track and the stage, then names the one reference to read for that stage. Read a stage reference when that stage begins, not up front: each one keeps the full instructions, handoff prompts and **Gate** for its stages.

## Profile routing applies to every stage

Read `baseline.config.json` before loading specialists. In the Baseline root, no generated receipt means the existing `emdash` application. Profile and Standard/Express track are independent decisions. Use established user decisions and approvals; ask only for missing choices. A scoped authorized maintenance task does not require replaying site handoff prompts.

- **static:** native typed Content Collections, Markdown `render()`, `getStaticPaths()`, `src/assets` and static hosting. Skip `building-emdash-site`, `emdash-content-modeling`, `emdash-site-setup`, `emdash-cli`, plugin and CMS cutover skills at every stage. No SQL budget, editor proxies, CMS registry or database backups apply.
- **static-sveltia:** same static branch, plus paired `public/admin/config.yml` and pinned admin SPA. Configure the site's GitHub repository, branch, build trigger and OAuth proxy or PAT. CMS form changes must match the Astro schema. Never add EmDash packages or specialists for browser editing.
- **emdash:** use the CMS specialists and runtime-specific instructions in the stage references. SQL, cache hints, Portable Text, `entry.edit.*`, registry and database operations in this workflow apply only here.

Shared on all profiles: `site-art-direction`, `astro-site-design`, `impeccable`, tokens, Art Direction Record, component quarantine and browser acceptance. Consult `docs/platform-profiles.md` and `docs/baseline-updates.md`. Generated static updates use `sync:baseline`; do not invoke unavailable CMS sync commands.

## Start here

1. Read `README.md`, `AGENTS.md`, an adopted `PROJECT.md` and current handoff if present, the installed tooling, and the current repository state. Missing optional records do not block work; consult the selected `DESIGN.md` only when visual decisions are open.
   Read the profile receipt and package scripts directly before dependencies are installed. Optional `baseline:inspect` requires the installed dependencies; run it after installation when it helps discovery. Use the project's existing lockfile with `npm ci`, or the first `npm install` in a newly generated static project to create its independent lockfile.
   **Commands named in these skills are Baseline's names; check that the site has each one before running it.** Older or receipt-free sites often lack `verify`, `verify:fast`, `doctor`, `audit:html`, `check:art-direction`, `design:tokens`, `test:design`, `sync:baseline` or `audit:page`. Look up the name in `package.json` `scripts` (or the `commands` list from `baseline:inspect --json`, where each entry reports `available`). When a command is missing, use the site's own equivalent from its `AGENTS.md` and scripts. For example, an older EmDash site may cover `verify` with `typecheck`, `test`, its lint scripts and `build`. Where no equivalent exists, do the check manually (source review, rendered browser inspection) and report it as manual. Do not install Baseline-root tooling or CMS packages just to satisfy a skill's command name. Adding a missing capability is a separate reviewed adoption (`docs/baseline-updates.md`). The same applies to linked `docs/` pages: a missing page is guidance the site does not have installed, not a step to skip silently.
2. Choose the track with the decision below.
3. On `emdash`, only run `sync:emdash-skills` or `sync:site-skills -- --check` when explicitly checking for upstream skill updates or refreshing an older repository checkout (see `docs/skill-synchronization.md`). On a fresh clone, use the checked-in skills directly without a blocking sync detour.
4. Identify the earliest unfinished stage in the stage map. On resume, compare saved progress with actual source and acceptance records: a successful starter sanity build does not mean the requested site is implemented. Preserve valid decisions and completed work from earlier stages rather than restarting automatically.
5. Load each specialist skill when its stage begins. Do not load every skill up front, because unrelated instructions crowd out the ones the current stage needs.

## Choose the track

Take the first branch that matches:

1. **The request is one stage, one surface or a scoped change** (a field, a component, spacing, a route) → no track. Start at the earliest affected stage and use [Working with partial requests](#working-with-partial-requests-and-ongoing-evolution) below.
2. **The user named a track** → use it, and say once if the scope argues for the other one.
3. **Any of these is true** → **Standard** (7 stages): a migration from an existing site; more than one locale; more than 6 route archetypes or more than 3 collections; editor roles or review workflow; relationships across collections; integrations, authentication or payments. These multiply decisions that later stages depend on, so each stage gets its own handoff.
4. **Otherwise** (greenfield, `<= 6` routes, `<= 3` collections, one locale) → **Express**: read [references/express-track.md](references/express-track.md).
5. **Unsure** → Standard, and say why. Moving from Standard to Express later loses nothing; discovering mid-Express that a schema needed locales does.

Count route archetypes, not repeated entries: twelve class pages from one template are one archetype. Express consolidates decisions into up to three checkpoints; it does not waive modeling, any CLI gate (`check:art-direction`, `design:tokens`, `audit/component-calibration.md`, `verify`), quality or editor acceptance. Standard reports each stage handoff and pauses only for a missing consequential decision or a required external-action approval.

## Stage map

| Stage | Read when it begins | Load | Leave the stage only when |
| --- | --- | --- | --- |
| 1 Brief and evidence | [brief-platform-content.md](references/brief-platform-content.md), [discovery-and-content.md](references/discovery-and-content.md) | — (`wordpress-to-emdash-content` for an EmDash migration) | brief, strategic synthesis and evidence inventory exist; migrations have a content-candidate register |
| 2 Platform and hosting | [brief-platform-content.md](references/brief-platform-content.md) | `emdash-site-setup` (EmDash only) | runtime, localization model and plugin sandbox decision are known or explicitly deferred |
| 3 Content and routes | [brief-platform-content.md](references/brief-platform-content.md) | `emdash-content-modeling`, `building-emdash-site` (EmDash only) | every page archetype and content candidate has a source, target, migration method, placement, container/breakout model, owner and chosen wayfinding primitives (including the search decision) |
| 4 Art direction | [art-direction-and-calibration.md](references/art-direction-and-calibration.md) | `site-art-direction` and the chosen surface skill | `AGENTS.md` holds the complete Art Direction Record and `npm run check:art-direction -- --require-record` passes |
| 4.5 Calibration | [art-direction-and-calibration.md](references/art-direction-and-calibration.md) | `astro-site-design` | `audit/component-calibration.md` names the patterns ready for pages and why |
| 5 Representative pages | [build-verify-launch.md](references/build-verify-launch.md), [delivery-evidence.md](references/delivery-evidence.md) | `astro-site-design`, `impeccable` (+ `building-emdash-site` on EmDash) | representative pages work with real content at mobile, intermediate and wide viewports; Impeccable findings resolved or recorded |
| 6 Complete and verify | [build-verify-launch.md](references/build-verify-launch.md) | `astro-site-design`, `impeccable` | every route and state is accounted for; findings resolved or documented; checks actually run are reported |
| 7 Cutover | [build-verify-launch.md](references/build-verify-launch.md) | `emdash-site-setup`, `emdash-production-cutover` (EmDash) | only the TLS, login, mail/form and recovery checks actually observed are reported as done |

The right-hand column summarises each **Gate**; the stage reference holds its full wording, which governs. Express Checkpoint A covers Stages 1–3, B covers 4–4.5 and C covers 5–6.

> [!CAUTION]
> **ART DIRECTION GATE:** Before Stage 5 site-specific visual implementation, save the complete record and pass `npm run check:art-direction -- --require-record`. Follow the scope and exceptions in `AGENTS.md`; route planning is permitted earlier, visual template implementation is not. Saving to disk does not require a Git commit. CLI/CI check outcomes, not pre-write prevention.

## Decisions, questions and handoffs

The full policy, discovery questions and release rules are in [references/decisions-and-release.md](references/decisions-and-release.md). Read it before the first owner question and before any handoff. The rules that apply at every step:

- A decision is *consequential* (the stage references also say *material*) when its plausible answers lead to different routes, content models, profiles, visual directions or external actions. Anything else gets a labelled working assumption instead of a question, because each extra question delays the owner without changing the work.
- Use supplied evidence and prior answers before asking. Ask only unresolved questions whose answers change the work, one to three related questions at a time, in plain language, with a recommendation. Do not make users choose implementation details the agent can derive.
- Ask the question in chat when it becomes relevant. A question written only into a report, checklist or handoff has not been asked, because the owner reads the chat, not every file.
- When work is authorized, report the outcome and continue. Do not end with “shall I continue?” or ask “ready to build?” at each stage; reuse existing authorization.
- Each handoff states completed scope, observed evidence, unresolved decisions and the next authorized action. Label assumptions; a saved record or passing check does not establish user approval.
- Deployment, content transfer, DNS changes and external submissions need authorization that covers those actions. A Git push does not transfer CMS data, and a reachable setup page does not prove working sign-in.

### Audit requests and release completion

An unqualified audit request asks for evidence and an actionable follow-up plan: lead with the recommended next actions and the user's decisions. It does not authorize applying the findings. Include release completion in the plan (commit, push, deploy target, live acceptance) and settle who authorizes each step during planning; once release is authorized, carry it through without separate prompts. Respect explicit report-only or local-only scope. The full rules, the content-model audit and the brownfield modernization tracks are in [references/decisions-and-release.md](references/decisions-and-release.md).

## Conditional references

Read only the one that matches the request:

| When | Read |
| --- | --- |
| Writing, rewriting or editing site copy (copywriting or copyediting) | [references/copywriting.md](references/copywriting.md), which routes to the brief, claims, conversion-copy and microcopy guidance |
| Requested participant studies, uncertain findability or supplied research to synthesize | [references/visitor-research.md](references/visitor-research.md). Reuse settled discovery; a straightforward site does not need a new study. Distinguish actual participant evidence from owner review, agent critique and synthetic rehearsal |
| Motion, illustration, charts, editable vectors, 3D or video | [capability routing](../site-art-direction/references/capability-routing.md). Reuse the chosen surface and runtime, load installed guidance first, discover a skill only for a real gap, and test a representative result in its destination. A capability request is not a reason to switch tools or replay discovery |
| Delegation is authorized and work is independent | [references/parallel-delivery.md](references/parallel-delivery.md); one writer per shared file, instance or canvas |
| Reuse, repeated content, owner editing or page-loading evidence | [references/delivery-evidence.md](references/delivery-evidence.md) |
| Spacing, fields, shared components or routes on an existing site; completion register before handoff | [references/site-maintenance.md](references/site-maintenance.md) |
| Any new image, greenfield or day-2, with or without a WordPress migration | `docs/media-preparation.md`: prepare stored copies with `media:prepare`, inspect results, then add them to static `src/assets/` or upload eligible copies to the selected EmDash Media Library with verified readback. Keep source archives outside the library and Git. Older sites need explicit tooling adoption before these commands exist |

Keep business context in its established home: `AGENTS.md` by default, or an explicitly adopted optional `PROJECT.md` linked there. The brief covers purpose, audiences, scope, ownership and decision rationale; link actual models, routes and configuration instead of copying their current values. Working rules and the compact Art Direction Record stay in `AGENTS.md`; selected `DESIGN.md` references support that record while CSS owns shipped values. Put current progress and next actions in the existing tracker or a short handoff. Use one home per fact and resolve conflicts by subject and evidence, not a blanket filename hierarchy. Do not relocate established facts or create missing records merely to complete a template. When installed, `docs/project-context.md` expands this guidance and `PROJECT.example.md` offers an optional starting point; older installed profiles can use this scope summary without adding those files.

## Working with partial requests and ongoing evolution

If the user requests only one stage, perform that stage without forcing a complete site build. Check its upstream inputs, state any consequential assumptions, and revisit downstream stages only when the change invalidates them. A later-stage request does not authorize inventing missing brand, content, or deployment decisions.

For "bring this site up to date with Baseline" or a full starter catch-up, follow the existing-site update workflow in `docs/baseline-updates.md` from the selected current published Baseline reference. It compares packages, skills/instructions and starter capabilities; neither a skill refresh nor an audit alone completes the request. Older sites may need the guide from a separate Baseline checkout. Continue compatible authorized local updates, preserve client decisions and provenance, and record adopted/deferred capabilities and actual acceptance.

For a change spanning several files or disciplines, use this compact loop:

1. Recover the installed profile, current implementation and requested outcome. Identify what must stay unchanged: for example other grid gaps, existing entries, navigation or edit ownership.
2. Trace the affected surfaces before editing: a content field can involve schema, stored entries, editor form, queries and templates; a shared component can affect several routes. Choose the smallest change that fulfills the request and load only the specialists for the affected surfaces.
3. Apply within the existing authorization, keeping client-owned content/design and compatible omitted-field behavior. Use the established art-direction gate for visual changes; distinguish live CMS changes from seed defaults.
4. Verify the requested outcome and preservation with the installed commands and the rendered/editor checks for the affected surfaces. A passing build does not prove an editor save, and an earlier check does not cover later edits.
5. When work remains or will resume later, update the existing tracker or handoff with changed surfaces, checks actually completed, unresolved acceptance and the next concrete action. Link authoritative decisions rather than copying them into a new required record.

When installed, [references/site-maintenance.md](references/site-maintenance.md) expands this loop for spacing, fields, shared components and routes. Older installations can use the summary above without adding that optional reference, changing profile or restarting discovery.

When modifying, normalizing, or pruning content models on a site that already has content, do not restart from Stage 1 or wipe existing databases. Static profiles evolve file schemas and content together, validate real Markdown and Sveltia output, and keep published URLs stable. On EmDash use `emdash-content-modeling` in brownfield evolution mode: schema audits, zero-downtime data migration scripts, dual-read template fallbacks, 3-way parity (local SQLite, remote D1, seed) and menu synchronization. For an EmDash site audit against newer starter standards, follow the brownfield modernization tracks in [references/decisions-and-release.md](references/decisions-and-release.md); a diagnostic report or a single primitive-backport pass is never the end of that workflow.

## Engineering verification loop

For the EmDash foundation, preflight with `npm.cmd run doctor`, use `npm.cmd run verify:fast` during edits, then run `npm.cmd run verify`, `npm.cmd run build`, and `npm.cmd run audit:html` against that fresh build before handoff. On Unix use `npm` in place of `npm.cmd`. Set up the local Git pre-commit hook once with `npm.cmd run setup:hooks`; it runs doctor and verify:fast and preserves existing hook managers. It supplements the final gate and CI; Git hooks are local and can be bypassed. The HTML audit checks emitted HTML or automatically captures linked public SSR responses from the local production CMS. Missing published content or broken navigation fails the audit; see `docs/html-integrity.md` for capture limits and snapshot inspection. For generated static profiles, inspect the installed package scripts and use their verification commands; do not add CMS tooling to satisfy an unavailable command.
