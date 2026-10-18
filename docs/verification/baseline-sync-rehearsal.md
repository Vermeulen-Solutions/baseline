# Real downstream Baseline update rehearsal

Verified 2026-10-18 on Windows with Node 24.21.0, independent npm installations,
LF source checkouts and the real `npm run sync:baseline` CLI. Four disposable Git
repositories exercised both static profiles and both exact provenance URLs.
No injected `readSource`, local download replacement or mutable branch reference
was used by synchronization.

## Immutable sources and scope

| Source | Immutable commit | Purpose |
| --- | --- | --- |
| Original profile release | [`2fc9774`](https://github.com/Vermeulen-Solutions/baseline/commit/2fc9774ba30a4d38defbf2ce92270628993d2750) | Generate genuine legacy provenance and the original sync helper |
| Released Baseline | [`24ea16f`](https://github.com/Vermeulen-Solutions/baseline/commit/24ea16fa2144c8691605082aec0c36f18fd282e5) | Generate canonical provenance; update legacy helpers through their original download path |
| Controlled design candidate | [`19aed5d`](https://github.com/Vermeulen-Solutions/baseline/commit/19aed5db4a5119f488f41f0d571dbcbb50f81f47) | Exercise actual incoming design changes, conflicts and a clean update |

The released history after profile introduction contains the rename fix but no
shared token/component changes. Consequently, the final source is an explicitly
controlled candidate published on `codex/baseline-sync-rehearsal-20261018`, a
disposable upstream branch. It is a real immutable commit fetched from the trusted
GitHub repository, **not an adopted release or a proposed production design**.
`main` was not changed by publishing this candidate.

The candidate changes the card radius to `0.625rem`, adds an optional Container
`id`, and adds optional Section `spacing="none"`. Its exact infrastructure
exception hashes accompany those isolated rehearsal changes.

Each downstream has its own saved Art Direction Record, checked before local
visual edits. Local changes set action blue to `oklch(41% 0.12 260)`, card radius
to `0.875rem`, and add a brand instrumentation attribute to `Container.astro`.
The unchanged Section supplies the clean update case.

## Results

| Downstream | Generation source | Rename bridge | Design candidate | Full verification |
| --- | --- | --- | --- | --- |
| `legacy-static` | `2fc9774`, historical URL | Helper applied, no conflicts | 1 applied / 2 preserved conflicts | Passed |
| `legacy-static-sveltia` | `2fc9774`, historical URL | Helper applied, no conflicts | 1 applied / 2 preserved conflicts | Passed |
| `canonical-static` | `24ea16f`, canonical URL | Already current | 1 applied / 2 preserved conflicts | Passed |
| `canonical-static-sveltia` | `24ea16f`, canonical URL | Already current | 1 applied / 2 preserved conflicts | Passed |

For each design update, staging reported exactly these files:

- `src/components/Section.astro`: original local hash equals base; incoming update
  applied exactly, managed hash/per-file commit and matching infrastructure gate
  exception advanced.
- `src/styles/global.css`: base, local and incoming hashes differ; local brand
  tokens remained byte-for-byte unchanged and incoming CSS remained a proposal.
- `src/components/Container.astro`: base, local and incoming hashes differ; local
  instrumentation remained byte-for-byte unchanged and incoming component remained
  a proposal. Even non-overlapping edits to the same file require manual review.

Conflict base hashes and exception hashes stayed unchanged. The update did not
exempt either local edit from the design gate. Installed file membership remained
identical, and package definitions, routes, content, settings, site-owned Base
layout, provenance and Sveltia admin configuration were preserved.

Both historical and canonical raw GitHub URLs returned HTTP 200 and the same helper
SHA-256. No HTTP redirect was observed: GitHub served the historical alias directly.
Legacy helpers bootstrapped successfully, then the updated helper used the fixed
canonical URL. Historical provenance was preserved; the trusted repository list
was not broadened. Availability of the old alias is an observed result, not a
guarantee for future GitHub behavior.

After full verification, each first proposal directory was preserved in the
bounded external rehearsal history and the same SHA was staged/applied again
through the network CLI. The clean Section was correctly omitted; both conflicts
were reported again, with zero applied source files. Package/lockfile hashes,
all three source files, provenance and exception bytes remained unchanged.

## Verification receipts

All four downstreams passed:

1. Independent `npm install`, followed by clean `npm ci`.
2. `npm run verify`: script syntax, Art Direction Record, token audit with all ten
   contrast pairs, tests, and Astro typecheck (26 files; zero errors/warnings/hints).
   Static projects passed 2/2 tests; Sveltia projects passed 3/3.
3. Production build, release artifact assertion and `check:dev-tools`.
4. Fixture build and HTTP integration: native public routes/images, development
   and fixture styleguides, production `/_styleguide` 404 for GET/HEAD, slash,
   query and cookie attempts; fixture artifacts rejected as releases.
5. Local Chromium at 390/768/1440px on home, post and fixture routes: 36 total
   route/viewport observations, no overflow, broken images or page errors;
   keyboard focus checks passed. Both Sveltia admin bundles/forms loaded with no
   runtime errors and offered token authentication.
6. Independent lockfile audit: zero EmDash, SQLite/libSQL or React packages; no
   database/seed, server entry, schema budget or EmDash skill synchronization
   scripts; exactly the four selected static skills.
7. Repeated real-network staging/apply with installed lockfile preservation and
   persistent, reviewable conflicts.

Baseline's existing root tests passed **117/117**. The candidate's separate
[GitHub Actions run](https://github.com/Vermeulen-Solutions/baseline/actions/runs/39142437250)
passed all three jobs: root verification and independent generation/verification
of both static profiles. That CI run verifies the candidate source; the local
receipts separately verify modified downstream update behavior.

See [machine-readable results](../../audit/baseline-sync-2026-10-18/verification.json),
[artifact inventory](../../audit/baseline-sync-2026-10-18/manifest.json), and
[receipt guide](../../audit/baseline-sync-2026-10-18/README.md). Receipts include
base/local/incoming bytes and hashes, stages, proposal diffs, apply logs, integrity
assertions, build/test/browser output, network probes and CI job records. All
content is synthetic; no client data or credentials are included.

## Reproduction and operational findings

Use separate clean source checkouts at the generation SHAs above, generate each
profile into an external empty destination, and initialize/commit its generated
inventory. Keep LF checkout bytes consistent with the recorded hashes. Save and
check a real rehearsal Art Direction Record before applying the local edits.

Legacy sites first run:

```sh
npm run sync:baseline -- --ref 24ea16fa2144c8691605082aec0c36f18fd282e5
# Review the helper-only proposal before applying.
npm run sync:baseline -- --apply 24ea16fa2144c8691605082aec0c36f18fd282e5
```

Both provenance forms then run:

```sh
npm run sync:baseline -- --ref 19aed5db4a5119f488f41f0d571dbcbb50f81f47
# Inspect stage.json and the three incoming files before applying.
npm run sync:baseline -- --apply 19aed5db4a5119f488f41f0d571dbcbb50f81f47
npm install --no-audit --no-fund
npm ci --no-audit --no-fund
npm run verify
npm run build
npm run check:dev-tools
npm run fixtures:build
```

Run Baseline's `tests/static-pilot.integration.mjs --root <downstream> --browser`
from the independently installed Baseline checkout for the local browser checks.
Preserve the proposal directory before retrying the same SHA, following the update
guide; stages deliberately cannot silently replace an existing proposal.

**Successful apply/build does not mean a fully adopted update.** Apply returns
success after preserving conflicts, and `lastSync` describes the most recent
operation. After the repeat test it correctly has no new applied files, while
Section's per-file receipt still records the adopted commit. Keep original stage
reports with the review and reconcile pending files explicitly.

A useful subsequent refinement would be an opt-in `--require-clean` status check
for release/CI handoff, while retaining today's safe partial-apply behavior. No
sync implementation fix was needed in this rehearsal. Cross-platform checkout
line-ending conversion was not certified; hashes remain byte-based. This phase
did not repeat authenticated publishing or deploy a production site.

## Finalization and cleanup

The Phase 4 records were committed to `main` as
[`a67af20`](https://github.com/Vermeulen-Solutions/baseline/commit/a67af20f20ef0f6f767e5fa1c964dfb214fb8c4f),
with all three [CI jobs passing](https://github.com/Vermeulen-Solutions/baseline/actions/runs/39143751696).
The disposable candidate branch and local runtime fixtures were then removed.
Its commit and changed objects remain in the verified candidate Git bundle in
the receipt directory. The earlier live Sveltia Pages pilot was also retired;
its private GitHub repository was archived after deletion was denied with HTTP
403. See the [cleanup receipt](../../audit/rehearsal-cleanup-2026-10-18/README.md)
for retained evidence and the remaining repository-deletion limitation.
