# Phase 8 release and adoption acceptance

This slice packages Phases 1–6 as generator 0.4.0, documents the explicit upgrade
sequence and rehearses adoption without widening bounded synchronization.
The [upgrade guide](../architecture-hardening-upgrade.md) and
[static example patch](../upgrades/architecture-hardening-static.patch) are the
reviewable downstream deliverables. Standards certification is unchanged.

## Existing-project rehearsal

```powershell
node tests/architecture-adoption.integration.mjs --from <40-character-pre-hardening-commit> --to <40-character-feature-commit> --out .emdash/release/<new-rehearsal-directory>
```

The explicit local Windows harness clones trusted local Git history into an
owned temporary source, invokes the historical generator, then calls the existing
production stage/apply API with immutable `git show` bytes. It does not fetch or
execute remote code, change sync policy, or claim that unpublished local commits
are available from GitHub. Default unit tests and CI do not invoke this browser,
installation or integration rehearsal.

Two independently installed fixtures start from `2d7e88b` and adopt the feature
set at `84613f3`: a near-default static site, and Sveltia with an explicit synthetic
editorial-paper calibration record, custom Base marker and edited navigation.
The record/calibration are established before wrapper changes. No real client
brief or credentials are invented.

Stage/apply must preserve packages, provenance, receipt membership, client-owned
templates/config/content and Sveltia configuration. The custom CSS conflict and
its incoming payload remain reviewable. The explicit second step adds selected
files and development packages/scripts, merges template/CSS deltas outside sync,
and regenerates each project's lockfile. All 31 calibrated theme values survive.
No new managed membership or fabricated generation history is introduced.

Each final fixture undergoes independent install and clean install, verify,
production build, separate fixture build, HTTP metadata/image/404 checks and
public JS/no-JS keyboard/reflow journeys. Sveltia additionally loads the pinned
admin runtime and offers token sign-in; credentialed publishing is not tested.
The near-default patch excludes lockfiles, managed receipts and art-gate exceptions.
Exact starter exceptions are retained only for matching synthetic source bytes;
client adaptations use their fixture record, not copied client exemptions.

## Native focus timing investigation

The first rendered adoption run exposed an intermittent failure after instant
Enter/Tab events: the disclosure body link held focus below the 320px viewport.
Diagnostic repeats reproduced it and retained the geometry; no threshold was
weakened. A proposed document repaint callback stalled with JavaScript disabled
and was discarded; its owned probe was stopped. The final journey paces the two
native key events at 50ms, with unchanged focus/viewport/occlusion assertions and
no synthetic focus/scroll repair. Five consecutive complete public-browser repeats
passed before the full adoption rerun. Final release acceptance uses these same
journeys. This evidence does not establish behavior for every possible rapid-key
sequence, browser engine or assistive technology.

## Root and new-project acceptance

```sh
npm run verify
npm run build
npm run test:profiles -- --public-browser --keep
npm run test:visual
node tests/metadata.integration.mjs --out .emdash/release/cms-metadata.json
```

The fresh-profile command independently installs/clean-installs both profiles;
root dependencies are not linked into generated projects. The full local Windows
CMS suite checks normal production-hidden fixture routes, the separate fixture
artifact, strict reference comparisons and foundational journeys. Golden files,
comparison thresholds and calibrated CSS remain unchanged.

The CMS metadata rehearsal checks supported synthetic SEO API writes and real
fixture plugin precedence. It also uploads a generated image through public
LocalStorage into the owned temporary app, requests its real media endpoint,
renders EmDashImage in a built Node route and decodes native WebP candidates.
The upload contract is verified against the installed adapter and
[EmDash storage documentation](https://docs.emdashcms.com/deployment/storage/).
That checks storage-backed presentation, not Media Library registration or an
authenticated editor's media workflow. No working database/uploads/env/credentials
are copied. Source edit-proxy checks remain in verify; real editor save/reload
remains manual acceptance.

## Evidence and remaining work

The [Phase 8 receipt](../../audit/verification/architecture-hardening-phase-8-checks.json)
records current commands, fixtures, source hashes, superseded probes, preserved
invariants and the available acceptance scope. Synthetic projects are deliberately
retained for patch/review reproduction; owned CMS servers/junctions/temp apps are
cleaned by their harnesses.

Manual text-only resizing, toolbar Find, screen-reader announcements/navigation,
other engines and writing modes, physical devices, authenticated editor save/reload,
credentialed Sveltia publishing, mail delivery and provider deployment/cache behavior
are not converted into automated passes. No WCAG or Cloudflare certification is
claimed. Optional Phase 7 remains deferred. Publication/push/tagging/deployment
were not requested; the Git checkpoint is the local review artifact.
