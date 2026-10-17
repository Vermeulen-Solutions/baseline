# Pattern adoption — implementation plan

> **For the executing agent:** REQUIRED SUB-SKILL: use `subagent-driven-development` to execute this plan
> task-by-task with spec review and code-quality review between tasks.

**Goal:** Turn the ranked findings in `audit/settings-to-output-patterns-2026-10-17/README.md` into tracked
work, and land the first one — a guard that keeps the token catalogue, `global.css` and the styleguide
specimens from drifting apart — without disturbing the in-flight Design Tweaks work.

**Architecture:** Borrow the strongest structural idea from the reference study (P1: the declared catalogue
must be verifiable against real output, and must fail open), expressed against our inverted dependency — here
`src/styles/global.css` is the source of truth and there is no settings store. The concrete form is a
`node:test` guard that cross-checks `src/utils/design-tweaks.mjs` (declared catalogue) against the authored
tokens in `src/styles/global.css` (real output) and the palette roles exercised on `/_styleguide`, with every
gap requiring an explicit, reasoned entry rather than silent tolerance.

**Tech Stack:** Node 24 (`node:test`, `node:assert/strict`), plain ESM, no new dependencies. No browser, no
Astro build, no persistence.

**Location note:** the `writing-plans` skill defaults to `docs/plans/`; this repository already uses
`audit/<topic>-<date>/implementation-plan.md` (e.g. `audit/roadmap-review-2026-10-15/implementation-plan.md`),
so the plan lives beside its evidence instead.

---

## Writing constraints (apply to every artefact in this plan)

1. **Do not name the studied third-party implementation** in commit messages, in source code, in tests, or in
   any committed document. Describe patterns generically. The name and its internal paths belong only in
   `reference-notes.local.md`, which must never be committed.
2. **Do not cite paths inside that implementation** in committed documents. No reader can resolve them, and
   the directory is not part of the repository.
3. Committed documents may cite **our** files freely, with line numbers.
4. **The local reference directory must never be committed under any circumstance.** It is session-scoped
   local reference material only: not committed, not staged, not added to the index, not copied into a commit
   by a broad pathspec. Always stage commit-facing files by explicit path — never `git add -A`, `git add .`,
   or `git add audit/`.

## Scope decision

- **In:** T1. Static, node-only, entirely outside the art-direction gate.
- **Out for now:** everything that edits `src/**` — patterns P2/P3/P7 and workflow items W-A/W-B/W-C touch
  files that currently carry uncommitted Design Tweaks changes and hash-bound gate exceptions (see H1).
- **Deliberately rejected:** P8 (in-browser stylesheet compiler) — see README §3.

## Status tracker

| ID | Item | Target | Effort | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| T0 | **Land the in-flight Design Tweaks refactor** (record only — no new implementation) | the seven explicit paths listed in Task 0 | S | outside the gate; refreshes its own exception | **Done 2026-10-17** — commit `a134205`; recorded tree verified green on its own (91/91) |
| T1 | Catalogue ↔ `global.css` ↔ specimen coverage guard | `tests/token-coverage.test.mjs` | S | none (outside `src/`/`public/`) | **Done, then superseded the same day** — recorded as `d39cb31`, then rewritten by P2 as a derivation + staleness guard |
| T2 | Derive the catalogue from the stylesheet | `scripts/generate-token-catalog.mjs`, `scripts/token-catalog-overrides.mjs`, `src/utils/token-catalog.generated.mjs` | M | refreshed exceptions for both `src/` files | **Done 2026-10-17** — 37 tokens derived; labels/roles/flag seeded; see Task 2 |
| P1 | Output-derived availability, fail open | generalise T1 later to built CSS if a build-time catalogue appears | S–M | none | Partial (T1 is the v0) |
| P4 | Calibration I/O + staleness check | `scripts/check-token-calibration.mjs` + npm scripts | M | none | **Mostly done with W-B** — export and the staleness verdict are covered; import/reset were not built |
| W-A | `## Token Calibration` section in the Stage 4.5 record | `audit/component-calibration.md` + an `AGENTS.md` line | S | docs only | Backlog — needs `audit/component-calibration.md` to exist first |
| W-B | Deterministic calibration receipt (tokens + `globalCssSha256`) plus the checker that reads it | `src/utils/design-tweaks.mjs`, `src/components/TweaksBar.astro`, `scripts/check-token-calibration.mjs` | M | refreshed exceptions for both `src/` files | **Done 2026-10-17** — see Task 3 |
| W-C | Coverage-driven calibration surfaced in the panel | `TweaksBar.astro`, `styleguide-fixtures.ts` | M | **blocked by H1** | Backlog — extends T1's exemption lists |
| W-C2 | Extend coverage beyond `--color-*` | decide authority: fixtures vs `Styleguide.astro` sections | S–M | **blocked by H1** | Backlog — needs a decision, not code |
| P2 | One declarative source for UI + docs + search | generated catalogue module | M | none | **Done 2026-10-17 as T2** — see Task 2 |
| P3 | Base value + ratio families with derived steps | `src/utils/design-tweaks.mjs` family scaling | M | **blocked by H1** | Backlog |
| P5 | Conditional availability of output blocks | route/feature-scoped token sets | M | unknown | Backlog |
| P6 | Critical token CSS inlined | `src/layouts/Base.astro` head | M | `src/` → gate | Backlog |
| P7 | Group headings that follow a name field | `TweaksBar.astro` | S | **blocked by H1** | Backlog |
| P8 | In-browser stylesheet compiler | — | L | — | **Rejected** |

## Hazards and gates

| ID | Hazard | Handling |
| --- | --- | --- |
| H1 | **Uncommitted Design Tweaks work.** The working tree carried modified `src/components/TweaksBar.astro`, `src/utils/design-tweaks.mjs`, `tests/dev-hud.test.mjs`, `tests/dev-tools/hud.spec.mjs`, `docs/dev-hud.md`, `audit/design-gate-exceptions.json`, plus untracked `docs/images/design-tweaks.png`. `audit/design-gate-exceptions.json` binds the **current bytes** of eight `src/` files, so editing any of them invalidates its exception and makes the gate fail on changed visual source until the hash is deliberately refreshed. | **Resolved 2026-10-17 by T0 (commit `a134205`)**: the `src/` edits and the refreshed exceptions were recorded together, so the change is self-consistent. Any future edit to those files must refresh the exception in the same change. |
| H2 | **Gate scope.** `scripts/check-art-direction.mjs` treats only `^(src|public)/` as visual source. | Anything touching `tests/`, `scripts/`, `audit/` or `package.json` needs no Art Direction Record. |
| H3 | **`--require-record` fails on this starter by design** — `AGENTS.md:52` states that no client Art Direction Record is invented here. | Never add `check:art-direction -- --require-record` to this repository's CI until a real client record exists. |
| H4 | **Parallel implementers corrupt a shared tree.** | Run implementer subagents **sequentially**, one task at a time, with review gates. Parallel subagents are for read-only exploration only. |
| H5 | **The untracked local reference directory must never be committed, under any circumstance.** It exists only for local reference in the study session. | Read-only study. Never stage or commit it; stage commit-facing files by explicit path only (see Writing constraint 4). See the Writing constraints above. |
| H6 | **T1 is logically stacked on the in-flight token-list refactor.** The guard reads the catalogue (`baselineTokens`) and depends on the refactored 42-token catalogue existing. Verified on 2026-10-17 by extracting the T1 snapshot into a clean directory: with the catalogue absent the test fails, and with the import removed it fails on `Authored token has no catalogue entry and no recorded exemption: --font-body`. | T1 must be recorded **after** the in-flight token-list refactor is recorded — ideally in the same change, or immediately after it. Do not record T1 alone. |
| H7 | **`docs/dev-hud.md:21` named the studied implementation** in an in-flight change. | **Resolved 2026-10-17**: rephrased to describe the organisation as coming from research into how dashboard-style settings interfaces are structured. Any in-flight copy of that file must not reintroduce the name. |
| H8 | **A local-only evidence file sits inside `audit/`.** `reference-notes.local.md` is not git-ignored, so an unqualified `git add audit/` would commit it with the implementation's name and paths — and the same broad pathspec would also sweep in the local reference directory, violating constraint 4. | Either add ignore rules, or always stage the committed files by explicit path. Recommended (not applied): a `*.local.md` rule plus a rule for the local reference directory in `.gitignore` would make both mistakes impossible rather than merely unlikely. |

| H9 | **The dev server must not be running while the full node suite runs.** With `npm run dev` active, a media-infrastructure test fails intermittently with `EPERM ... rename .emdash/backups/...` because the server holds a file handle. | Stop the dev server before running `node --test tests/*.test.mjs`. A real failure and this one look identical in the summary line, so check for a listening port first. |

**No Art Direction Record is required for this plan's tasks, and none should be invented for them.**

---

## Task 0: Land the in-flight Design Tweaks refactor

**Owner:** the orchestrator directly. There is no implementation to delegate — the work is authored, and the
task is verification, staging and recording. Dispatching an implementer for a commit-only task would add a
round trip without adding review value, so the orchestrator performs it and reports the evidence.

**Purpose:** resolve H1 and unblock H6. Everything else in this plan edits `src/**`, so nothing else can start
until this lands.

**Record exactly these seven paths — by explicit path, never by a broad pathspec:**

```
src/utils/design-tweaks.mjs            (catalogue: tokenGroups, tokenDefinitions, derived helpers)
src/components/TweaksBar.astro         (categories, search, per-token source values, per-token reset)
tests/dev-hud.test.mjs                 (catalogue coverage + family precedence assertions)
tests/dev-tools/hud.spec.mjs           (browser coverage for the reworked panel)
docs/dev-hud.md                        (dashboard section; provenance stated without the implementation's name)
docs/images/design-tweaks.png          (screenshot referenced from docs/dev-hud.md:9)
audit/design-gate-exceptions.json      (refreshed hashes for the edited `src/` files — same change, per H1)
```

**Must NOT be staged, for any reason** (Writing constraints 4 and H5, H8):

```
automatic-css/                                  the local reference directory — never committed
audit/settings-to-output-patterns-2026-10-17/   this study's documents — recorded separately, after T1
tests/token-coverage.test.mjs                   T1's guard — recorded as the next change, not this one
```

**Pre-commit verification (all observed green on 2026-10-17):**

| Check | Result |
| --- | --- |
| `npm run lint` | Syntax checked 77 JavaScript modules |
| `npm run test:design` | 10 tests, 10 pass, 0 fail |
| `node --test tests/*.test.mjs` | 92 tests, 92 pass, 0 fail |
| `npm run check:art-direction` | `exact infrastructure exceptions cover these changes` |

Note what the gate result means: the refreshed `audit/design-gate-exceptions.json` matches the new bytes of the
edited `src/` files, so the change is self-consistent. Committing the `src/` edits **without** the refreshed
exceptions would fail the gate; the two must travel together.

**Commit message** (must not name the studied implementation — Writing constraint 1):

```
feat(dev-hud): group the token catalog and add search, categories and source values

Expand the inspected token set from eight palette roles to the full catalog of
37 tokens in four groups, and surface each token's authored source value with an
individual reset. Add category filtering and search over labels, CSS variable
names and tool descriptions. Refresh the art-direction gate exceptions for the
edited files and document the panel in docs/dev-hud.md.
```

**Post-commit acceptance:**

1. `git show --name-only HEAD` lists exactly the seven paths above.
2. `git ls-files automatic-css | Measure-Object` is 0, and `git status --porcelain` shows no `src/**` or
   `docs/**` modification remaining (the tree is clean apart from the deliberately unrecorded T1 guard and the
   study documents).
3. The recorded tree is green on its own: the guard is *not* in this commit, so the suite at this commit is the
   pre-guard 92-test suite, which passes.
4. Confirm the working tree afterwards holds only the intentionally unrecorded items: the study documents,
   the T1 guard, and the local reference directory.

**Recorded 2026-10-17 — commit `a134205`.** Staged set confirmed as exactly the seven paths above;
`automatic-css/` remained untracked (0 tracked files) and the guard and study documents were not included; the
commit message contains no product name. Post-commit checks: `git show --name-only` lists only those seven
paths, and the recorded tree passes 91/91 node tests with the guard held aside (proving the commit is green
without it), with `check:art-direction` reporting no visual source change at HEAD.

---

## Task 1 (as built): token catalogue ↔ authored CSS ↔ specimen coverage guard

**File:** `tests/token-coverage.test.mjs` (untracked, implemented, reviewed; **not** recorded — see H6).
**Evidence:** `audit/settings-to-output-patterns-2026-10-17/token-coverage-baseline.json`
**Baseline facts:** authored tokens 37; catalogue 42; authored palette roles 9; styleguide specimens 8.

**What it enforces.** Four families of checks, all reported in a single failure rather than one-at-a-time:

1. Every custom property authored in the `@theme {` / `:root {` blocks of `src/styles/global.css` must be in
   `baselineTokens`, with **no** escape hatch (an authored-but-uncatalogued token is drift, never an
   exemption). Blocks are bounded by the next line-start `}`, so component-scoped properties such as
   `--flow-space` inside `.flow` do not leak into the authored set.
2. Every catalogue entry must either be authored or be recorded in `OPTIONAL_WRITE` — meaning exactly "a token
   the catalogue can write that deliberately has no authored value".
3. `OPTIONAL_WRITE` entries are checked in both directions: a key that becomes authored, or that leaves the
   catalogue, fails so the stale entry is removed.
4. Palette coverage is a two-way set comparison: every specimen names an authored `--color-*` role; every
   authored role is either specimen'd or recorded in `COLOR_SPECIMEN_EXEMPT`; and every exempted role must be
   authored and **not** specimen'd, so an exemption cannot outlive its gap and become a permanent blindfold.

Plus: exemption reasons must be at least 40 characters and free of placeholder words; the specimen array is
parsed leniently (either quote style, comments irrelevant) and an unparseable fixture reports a *fixture
format* problem rather than blaming a missing specimen.

**Exemptions in force (five + one), each citing a verified consumer in `src/`:**

- `OPTIONAL_WRITE`: `--font-weight-display`, `--letter-spacing-display`, `--hero-filter`, `--page-pattern`,
  `--page-pattern-size`.
- `COLOR_SPECIMEN_EXEMPT`: `focus-on-dark`.

**Verification performed and recorded:** `node --test tests/token-coverage.test.mjs` passes;
`node --test tests/*.test.mjs` passes 92/92; `npm run check:art-direction` is unchanged by the addition (the
gate filters to `^(src|public)/`); and each new check was proved able to fail by mutation, using copies
outside the repository — emptied exemption list, a stale exemption after a specimen is added, a removed
`OPTIONAL_WRITE` key, a double-quoted/commented fixture (must still pass), a reason below the bar, an
unparseable fixture, and a multi-problem run.

**Remaining action:** record T1 after the in-flight token-list refactor is recorded (H6). At that point
re-run the two commands above and refresh the evidence JSON if the counts changed.

**Original specification:** superseded by this hardened version after code-quality review. The review replaced
a hard-coded specimen count with a two-way set comparison, added the stale-exemption and bidirectional
allow-list checks, removed a dead import, and made parsing tolerant and its failure honest.

---

## Task 2 (P2): derive the catalogue from the stylesheet

**Decision it implements:** the catalogue must not be maintained by hand. Adding a token to
`src/styles/global.css` is the only step needed for it to appear in the panel.

**Files:**

- Create `scripts/generate-token-catalog.mjs` — reads the `@theme`/`:root` blocks, applies prefix rules for
  group and CSS role, applies optional annotations, renders the generated module. Exports `buildCatalog` and
  `renderCatalog` so the guard can rebuild and compare.
- Create `scripts/token-catalog-overrides.mjs` — the only file carrying annotations, every entry optional.
- Create `src/utils/token-catalog.generated.mjs` — committed generated output; never edit by hand.
- Modify `src/utils/design-tweaks.mjs` — imports the generated catalogue and re-exports the same names, so
  `TweaksBar.astro` needed no change and its exception stayed valid. Calibration maths untouched.
- Modify `tests/token-coverage.test.mjs` — rewritten as staleness, addressability, write-only documentation and
  palette coverage checks.
- Modify `package.json` — adds `tokens:generate`.
- Modify `audit/design-gate-exceptions.json` — refreshed hash for the modified `src/` file, new entry for the
  generated one.

**Derived versus authored:**

| Concern | Source |
| --- | --- |
| Membership, order, grouping, CSS role | Derived from `global.css` by the generator |
| Group labels and help text | Constants in the generator, written once |
| Friendly labels | `labels` in the overrides file, seeded from the previous hand-written catalogue; a derived fallback applies when an entry is absent |
| `readonly` (value composed from other tokens) | `deltas` in the overrides file — one entry today |
| Write-only tokens and their reasons | `writeOnly` in the overrides file — five entries |

**Evidence:**

- Equivalence against the catalogue recorded in `a134205`: 37 before, 37 after, none missing, none added,
  **no field differences**; six tokens changed position within their group.
- Derivation alone is demonstrably insufficient: without the label seed all 37 labels would change, and
  `--text-step--1` and `--text-step-1` both derive "Text Step 1" — a real collision. The seed is load-bearing,
  not cosmetic.
- Guard mutations proven: a hand-edited generated file is rejected; a write-only entry that becomes authored is
  rejected. Control run passes after restore.
- `check:art-direction` accepts the refreshed exceptions (the gate is the oracle for those hashes), `lint`
  passes, `typecheck` reports 0 errors/warnings/hints, and the full node suite passes.

**Open judgement for review:** the label seed preserves the panel's current wording. Deleting any entry falls
back to a derived name, so nothing must be hand-written — decide per token whether that is wanted.

---

## Task 3 (W-B): calibration receipt and checker

**Decision it implements:** a calibration must leave an artefact a reviewer can check, not a clipboard string.

**Files:**

- Modify `src/utils/design-tweaks.mjs` — adds `stylesheetDigest()` (WebCrypto, LF-normalised, so it works in
  the browser, in Node and in Astro frontmatter) and `buildReceipt()` (sorted keys, so two identical
  calibrations produce byte-identical receipts).
- Modify `src/components/TweaksBar.astro` — computes the stylesheet digest at build time, exposes it as
  `data-source-hash` on the panel, and adds **Copy Receipt (JSON)** beside **Copy Tokens (CSS)**.
- Create `scripts/check-token-calibration.mjs` — reports `applied`, `pending-merge`, `stale` or `invalid`,
  naming the tokens that are missing; `--require-applied` turns an unmerged calibration into a failure.
- Create `tests/token-calibration.test.mjs` — receipt determinism and content, digest stability across line
  endings, and all four checker outcomes.
- Modify `package.json` — adds `check:token-calibration`. Modify `docs/dev-hud.md` — corrects the catalogue
  description for both T2 and this task, and documents the generation step and the receipt.

**Evidence:**

- The panel's computed digest is `c1ddf3f3…`, byte-identical to the gate's entry for `src/styles/global.css` in
  `audit/design-gate-exceptions.json`, so a receipt binds to the same LF-normalised SHA-256 primitive the
  repository already uses.
- End-to-end against the running dev server: with no overrides the button refuses ("No overrides to record.");
  after calibrating `--color-action` it produced a receipt whose `from` is the authored source value and whose
  `to` is the calibration, with the digest matching the panel.
- That receipt then checked as `pending-merge` against the real stylesheet, `applied` against a stylesheet with
  the value merged, and passed with `--require-applied`.
- `check:art-direction`, `lint`, `typecheck` and the full node suite (97 tests) pass.

---

## Backlog (specified to resume later, not executable yet)

**P2 — one declarative source.** Replace the hand-maintained `tokenGroups` in `src/utils/design-tweaks.mjs:3-31`
with a generated module carrying `label`, `property`, `readonly`, help text and provider/consumer evidence per
token. Deliverable: one generated file, a regeneration script, and T1 updated to read it. Gate: H1.

**P3 — base value + ratio families.** Today `headingTokens` (`src/utils/design-tweaks.mjs:34`) and the family
scaling at `:49-52` scale a fixed list by one factor. The reference models a base value plus a ratio and
derives every step. Deliverable: a ratio-style control that derives step values, plus an explicit statement of
which tokens remain source-owned. Gate: H1.

**P4 — calibration I/O and staleness.** After W-B exists: a reader that validates a receipt against the current
`global.css` hash and reports stale or missing calibrations. Deliverable:
`scripts/check-token-calibration.mjs`.

**W-A — Stage 4.5 record.** Add a `## Token Calibration` section to the record the workflow already expects
(`audit/component-calibration.md`, currently absent; `scripts/audit-design-system.mjs:177-212` already reports
`calibrationRecord: false`). Requires deciding whether new fields are mandatory (`AGENTS.md:63`); treat as a
docs change with the same review weight as code.

**W-B — calibration receipt.** Deterministic JSON (`{tokens, sourceValues, exportedAt, globalCssSha256}`)
derived from the same inputs as `exportTokens`, exposed as a second panel action beside `Copy Tokens (CSS)`
(`src/components/TweaksBar.astro:156-158, 613-620`). Reuse the LF-normalised SHA-256 convention from
`scripts/check-art-direction.mjs`. Must not write to `global.css`.

**W-C — coverage in the panel.** Surface T1's exemption lists and any uncovered token inside the panel, so
calibration is driven by what is unverified. Extends T1; needs H1 resolved.

**W-C2 — coverage beyond colour.** Requires a decision first: is the authority `styleguide-fixtures.ts` or the
rendered sections in `src/components/dev/Styleguide.astro:16`? Do not implement before that decision is
recorded.

**P5/P6/P7** — see README §3 for value and effort. P6 is the only one that touches `src/**` for a
non-cosmetic reason; it will need the Art Direction Record once the repository hosts a real client direction
(`AGENTS.md:49-52`).

---

## Execution protocol

1. Extract the task's steps into a todo list.
2. Dispatch one implementer subagent with the full task text and context. Answer its questions before it starts.
3. Dispatch a spec-compliance reviewer (does the diff match the task and nothing more?).
4. Only after spec ✅, dispatch a code-quality reviewer.
5. Fix, re-review, then mark the task complete and update the tracker in this file.
6. Do not start any backlog item while H1 is open, and do not record anything while H6 is unresolved.
