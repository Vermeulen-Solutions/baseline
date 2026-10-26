# Maintaining Baseline

This is the entry point for people and agents improving Baseline as a reusable
starter. Ordinary website work follows [AGENTS.md](AGENTS.md) and the installed
profile's site instructions. A local component change for one client does not
automatically become a Baseline contribution.

## Establish the task

Read AGENTS.md, the user's request, existing decisions and the relevant source
before editing. Use the purpose of the task to choose this guidance; Git remotes,
branches and package names are not reliable indicators. The same checkout can
serve either purpose, without a saved mode flag or swapped instruction files.

A request such as “improve Baseline's generator” or “we are maintaining Baseline
itself” establishes maintainer intent. Carry that context through related work.
For mixed tasks, apply site delivery guidance to the client-specific design and
these requirements to changes intended for reuse. Ask only when unresolved intent
would materially change the implementation.

Client-site briefing, track selection, launch discovery and client Art Direction
Records are not prerequisites for tooling or infrastructure maintenance. Shared
CSS, content ownership, security and design-gate contracts still apply. Inspect
[the detailed site contracts](docs/site-working-rules.md) for affected behavior.
The neutral starter has no invented client art direction. Maintainer intent is
not a blanket gate exemption: source exceptions remain exact, reviewed and hash-bound.

Keep changes focused and explain the concrete problem, supported runtime and
reproduction. Open an issue before proposing broad architecture changes.

## Understand the foundations

The root application is the EmDash Node.js + SQLite foundation. Static and
static-sveltia sites are assembled separately from allowlisted inputs; they do
not come from deleting CMS code from the root application.

| Area | Source and required considerations |
| --- | --- |
| Shared design and presentation | src/styles/global.css, src/layouts/SiteShell.astro and shared components; assess both foundations and the common styleguide specimens |
| Platform integration | Root astro.config.mjs, src/layouts/Base.astro, src/live.config.ts and seed/seed.json; static replacements live under profiles/static/project/ |
| Static generation | scripts/init-profile.mjs, profiles/contract.mjs and profiles/manifests/; inspect the resolved files, overrides, dependencies, scripts and skills for both static profiles |
| Distribution inventory | profiles/file-inventory.json classifies sources; it does not authorize copying everything. New files ship only through the resolved manifest |
| Reviewed downstream updates | scripts/sync-baseline.mjs and [update policy](docs/baseline-updates.md); preserve ownership, local edits, calibration, conflicts and tracked provenance |
| Skills | .agents/skills/ and the ownership rules below; changes to workflows may affect more than one profile |
| Checks and runtime guarantees | scripts/, tests/, tests/test-tiers.json and .github/workflows/; keep command discovery, generated scripts and applicable checks aligned |

Read [platform profiles](docs/platform-profiles.md), [generation manifests](profiles/README.md)
and [architecture hardening](docs/architecture-hardening-upgrade.md) when changing
generation or cross-foundation behavior. A platform profile describes editing and
runtime, not whether the current task is site work or Baseline maintenance.

Before changing shared behavior, identify which installed sites can receive it and
how. Shared SiteShell defaults retain installed-site compatibility; site-owned
Base wrappers choose the newer spacing policy explicitly. Do not silently change
old defaults or spread client-specific choices into the starter.

For generator or distributed-source changes, check file mappings, generated
commands, dependencies, skills and source hashes. For update changes, retain
conflict reporting and client ownership: routes, content, settings, calibrated
tokens and other local decisions must not be overwritten merely because an
upstream version exists. Explain existing-site adoption separately from new-site
generation. Read actual configuration rather than inferring support from a README.

## Local workflow and verification

Use npm and the checked-in lockfile. Current tooling requires Node ^22.22.3,
^24.16.0 or >=26.3.0; Node 24 LTS is recommended. In Windows PowerShell use npm.cmd
and npx.cmd. These launchers avoid execution-policy friction.

1. Run `npm run doctor` before `npm ci`. Doctor needs no installed dependencies;
   warnings exit 0 and critical failures exit 1. Use
   `node scripts/doctor.mjs --json` if npm cannot start, or NO_COLOR for plain logs.
2. Use `npm run verify:fast` during edits. Classify new top-level tests with a
   reason in tests/test-tiers.json; unit and rehearsal tiers partition the full
   suite. Add regression coverage for meaningful behavior changes, including
   preservation or refusal behavior where relevant.
3. Before handoff, run `npm run verify`, `npm run build`, then
   `npm run audit:html` against that fresh build. Keep source files fixed during
   full verification; generated-project snapshots bind source bytes.
4. For changes to generation logic, manifests, distributed code or update behavior,
   also run the applicable independent
   generated-profile checks described in [profile verification](docs/verification/platform-profiles.md)
   and the installed `test:profiles` command. Do not treat a root build as proof
   that both static profiles work.
5. For visual/component changes, use the relevant styleguide and local Windows
   harness in [visual regression](docs/visual-regression.md), plus applicable
   editor/HTTP checks. Updating reference images requires explicit --update,
   reviewed PNG/manifest differences and an explanation. Never update goldens to
   hide an unexplained failure.
6. Author Markdown documentation in `docs/` with unwrapped paragraphs (soft-wrapped /
   one line per paragraph) or semantic line breaks rather than hard wrapping at
   80 columns. `npm run check:docs` verifies documentation formatting.

Set up the supplemental local Git hook once with `npm run setup:hooks`; it runs
doctor and verify:fast, preserves existing hook managers and does not replace the
final checks. [HTML integrity](docs/html-integrity.md) documents SSR capture and
content prerequisites. Do not install CMS tooling into generated static projects
to satisfy checks that do not apply.

CI uses Node 24.16.0 with separate fast/build, lifecycle rehearsal and generated-profile
jobs. Fast checks enforce a 60-second budget (checkout/setup/install excluded) and
publish timing receipts; typecheck follows the measured segment. Browser tests
stay local and independent of push/PR CI and production/deploy commands.

## Skills and instruction ownership

building-emdash-site, creating-plugins and emdash-cli are upstream EmDash mirrors.
Submit upstream API guidance upstream; keep Baseline policy in maintained
instructions, references and local skills. Do not edit mirrors to add starter policy.

sync:emdash-skills stages an immutable candidate, not permission to overwrite local
drift. Review source commit, licenses, normalized hashes and the staged diff, then
explicitly apply under [skill synchronization](docs/skill-synchronization.md).
Preserve dirty mirrors and backups.

Vermeulen-maintained skills include new-site-workflow, site-art-direction,
penpot-site-design, astro-site-design, emdash-content-modeling and migration/setup guidance.
sync:site-skills distributes reviewed snapshots; it does not own client content
or AGENTS.md. Impeccable is a separately licensed upstream snapshot: preserve its
LICENSE/PROVENANCE and update deliberately. Checked-in mirror drift is pending
review, not evidence of synchronization.

Preserve the concrete selectors, CSS values, composition recipes, named tools and explicit decision checkpoints that encode a maintained skill's intent. These instructions must remain usable by faster or less capable models, without assuming expert inference. Resolve an overbroad rule with a scoped exception or a clearer default before removing its examples; explain any intentional removal. Structural validators and application tests do not establish equivalent model behavior. When evaluating a substantial rewrite, use representative tasks with the intended model/runtime when available and label untested behavioral claims honestly.

Keep root AGENTS.md site-first, with a short route here for maintainer tasks.
Generated static sites use profiles/static/project/AGENTS.md; their instructions
must remain usable with only installed files. Do not add mandatory references to
maintainer-only documents that the generator does not ship. Keep deep site rules
in task-linked references and keep the Art Direction Record in the site's AGENTS.md,
where the existing tools read it. Optional project records must stay optional.

## Data, runtime and evidence

Preserve canonical EmDash field values, edit attributes, editor metadata, locale
ownership and query cache hints where caching is enabled. An ownership annotation
does not prove successful editing. Use native Astro image processing and
instance-specific media identities. Keep collections within the 50-physical-column
preflight budget; never infer target width from seed fields alone.

Use synthetic fixtures and neutral examples. Keep credentials, CMS databases,
uploads, client copy, private registrations and identifiable client audit reports
out of changes. Database/media writes, deployments and client modernization are
separately scoped operations. Do not post sensitive incident details publicly.

Bind verification claims to actual source, versions and environment. Historical
certification is not proof that today's tooling runs at an older runtime floor.
Consult standards/manifest.json and [support boundaries](docs/support-boundaries.md).
Cloudflare/D1/R2 integration remains a separately accepted scope, not a reason to
provision resources for an ordinary contribution. Record checks actually run,
failures and limitations; do not relabel historical receipts as fresh verification.

Contributions use the root [MIT license](LICENSE), with bundled materials'
[third-party notices](THIRD_PARTY_NOTICES.md) retained. Participation follows the
[Code of Conduct](CODE_OF_CONDUCT.md).
