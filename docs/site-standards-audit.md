# Downstream site diagnosis and remediation

Start with a read-only diagnosis, review the findings, then select a supported recipe on a disposable copy or feature branch. Diagnosis never installs dependencies, evaluates target configuration, synchronizes skills, opens the live database, writes CMS content or deploys. No network is used. Remediation is a separate explicit command.

## Diagnose

```sh
npm run audit:site -- --root ../my-site
npm run audit:site -- --root ../my-site --out ../private-reports/run-001
npm run audit:site -- --root ../my-site --db-snapshot ../private-backups/closed.sqlite --strict
npm run audit:site -- --root ../my-site --d1-dump ../private-backups/d1-export.sql --strict-fails
npm run audit:site -- --root ../my-site --evidence ../private-reports/capture/bundle.json --out ../private-reports/run-002 --strict
```

JSON goes to stdout unless `--out` names a **new directory outside the target**, including through symlinks. That directory receives JSON and Markdown. Keep real site reports private; never commit them to this template. No scheduler, network check or Actions job is installed.

For Cloudflare D1 databases, use the turnkey exporter:
```sh
npm run db:export-d1 -- --database <db-name> --out ../private-backups/d1-export.sql
```
Baseline accepts either a closed binary SQLite database or a raw D1 SQL export via `--db-snapshot <file>` or `--d1-dump <dump.sql>`. When a SQL dump is supplied, schema DDL is ingested into an isolated scratch SQLite database to measure physical collection widths without requiring manual conversion or loading row data.

The source is the exact standalone `standards/baselines/0.1.1.json` artifact. Its digest must be `a30dfde700dac0ead090ca19f743312d5bb4cd886aa51facd387c372db56b2c4`, corresponding to the original immutable commit recorded in it. `--standards-file` accepts only an identical offline artifact. Missing or changed bytes abort. Mutable main or an identical version label is insufficient; another standards version needs a reviewed resolver extension.

## Implemented coverage

| Scope | What is established | What is not established |
| --- | --- | --- |
| Package/Node | Bounded JSON objects; baseline lockfile versions and exact declared Node policy | Deployment runtime, general semver compatibility or a reason to downgrade newer packages |
| Astro configuration | TypeScript AST reads literal and dual-target ternary `defineConfig` output/adapter, aliased imports, React/EmDash calls and Node/Cloudflare wiring | Execution of arbitrary helpers, computed/spread/function configs, deployment or provider behavior |
| Locales/cache | Literal locale registration and unprefixed default; absent root cache config is inapplicable on the supported profile | Real translated rendering; cache hint completeness when caching is configured, which stays required/unverified |
| Managed skills | Version-2 receipt membership, required SKILL.md files, missing canonical skill names, manifest formatVersion, complete bounded managed-directory inventory, normalized hashes, missing/extra/changed files, and declared local overrides | Upstream currency or authenticity of a self-supplied receipt; unmanaged skills remain project-owned |
| Design system & quarantine | Static CSS token/rhythm primitives (`interpolate-size`, `.flow` duplicate-margin guard, `.content-grid` + `subgrid`, `.clickable-parent`/`.focus-parent`, `data-surface`, ad-hoc `clamp()` count), semantic `<article>` Card vs whole-card `<a>` wrappers, `Container` breakout, and `/_styleguide` (`src/pages/_styleguide.astro` + `src/components/dev/Styleguide.astro`) presence | Runtime computed styles, contrast ratios, or visual layout quality |
| SQLite / D1 schema | Explicit offline SQLite snapshot or D1 SQL dump, actual physical widths including hidden/generated columns, definition and snapshot digests | Width inferred from seed fields, collection registry/reference integrity or content correctness |
| Build preflight | A supported schema command at the beginning of the npm prebuild hook | Proof that a database exists or that a modified helper behaves correctly |
| Runtime/visual/providers | Explicit unverified findings | Successful editing/saving, accessibility conformance, form delivery, Worker/D1/R2 certification |

Dynamic/unsupported configuration is **unverified**, never a successful guess based on comments or matching text. The parser never imports a target module. Dual-runtime configurations using conditionals (e.g., `onCloudflare ? cloudflare() : node(...)` and `onCloudflare ? d1() : sqlite()`) are statically resolved against the audited `--runtime` profile. The pinned TypeScript parser is an explicit development dependency; install development tooling to use the audit commands.

Skill passes mean equality to the recorded managed snapshot, not equality to today's upstream. Legacy commit-only receipts and incomplete/malformed inventories stay unverified. Intentional site customizations can be documented under `overrides` in `.emdash/site-skills.json` or `.emdash/skill-overrides.json`, reporting declared overrides rather than unexpected drift. Drift without declared overrides is a required failure with counts; local file names/content are withheld and preserved for review.

Schema measurement accepts a caller-supplied **closed, consistent offline SQLite snapshot** or a **D1 SQL export dump** (`.sql`), without WAL/SHM/journal sidecars and at most 64 MiB. A temporary private copy is opened read-only/query-only and removed afterward. The engine reads metadata, not content rows; table/column names and raw SQL are withheld. Missing DB/tables/refused evidence stays unverified; 51 physical columns fails the 50-column budget.

## Stable report contract

Reports use **schemaVersion 2**, documented in [the JSON Schema](../standards/site-audit-report.schema.json). The generator and Markdown/output adapters validate it. Rule IDs are unique; summary totals must match rule statuses. Invalid versions, fields, evidence paths, statuses, non-JSON values and duplicate IDs are rejected. Version 1 scaffold reports remain historical receipts; regenerate them rather than relabeling them as v2.

Each rule carries version, required/recommendation severity, expected/observed facts, evidence, confidence, applicability, remediation and verification bounds. Sensitive configuration, env, content rows, private Git paths/remotes and arbitrary package names are withheld. A rule pass proves only its stated static observation.

Ordinary invocation exits 0 after producing findings. `--strict` exits 1 for implemented required fail/unverified rules, including unsupported configuration, managed skill inventories, physical schema and opted-in caching. `--strict-fails` exits 1 only if a rule evaluates to `fail` (ideal for CI pipelines targeting profiles with unverified platform status). Usage, standards or unsafe-output errors exit 2. Recommendations can remain unverified without failing strict mode.

Markdown reports (`report.md`) automatically append a prioritized **`## Recommended follow-up plan`** grouping open findings into 5 actionable tracks:
1. **Track 1 — Synchronize skills & physical schema** (`skills:site`, `skills:emdash`, `physical-schema`)
2. **Track 2 — Modernize design-system primitives & component quarantine** (`design-system:tokens-and-rhythm`, `design-system:card-and-breakout`, `design-system:quarantine-hud`)
3. **Track 3 — Adopt breakout/surface primitives in route templates & calibrate on `/_styleguide`** (`breakoutPageCount`, `surfaceUsageCount`, `calibrationRecord` in `audit/component-calibration.md`)
4. **Track 4 — Evaluate framework, Node policy & prebuild alignment** (`dependency:*`, `node-policy`, `schema-prebuild`)
5. **Track 5 — Execute live browser & EmDash editor verification** (`route-capture-evidence`, `editor-save-reload`, `visual-accessibility`)

When running an audit or completing a modernization pass, agents must follow the `new-site-workflow` brownfield loop (**Audit → Propose Follow-Up Plan → Execute Approved Track → Re-Audit & Propose Next Track**) rather than stopping after a static report or primitive drop-in.

## First recipe: schema-budget-prebuild@1

This deterministic code recipe adds the schema check before an existing simple prebuild hook. It changes **only package.json**. It never executes the hook, installs packages, commits, deploys or touches CMS data/media.

Example:

```json
"prebuild": "node scripts/prepare-assets.mjs"
```

becomes:

```json
"prebuild": "npm run check:schema-budget && node scripts/prepare-assets.mjs"
```

Supported source: locked Astro **7.4.0**, EmDash **1.3.0**, `build: astro build`, the supported `check:schema-budget` command and exact reviewed hashes of both schema helper files. The hook can be absent/empty, one simple `node scripts/name.mjs` command, or one `npm run name`. Complex shell chains, modified helpers, missing tools, other versions and uncertain scripts are refused for manual review. Existing metadata and hook behavior are preserved; package JSON may be reformatted using its existing indentation/newline style. The lockfile is unchanged.

Use a clean committed feature branch, preferably a disposable clone first:

```sh
# From the tooling checkout, prepare the target copy's review branch:
git -C ../my-site-copy switch -c chore/schema-budget-preflight

# Run these from Baseline's tooling checkout:
npm run audit:modernize -- --root ../my-site-copy --recipe schema-budget-prebuild@1 --plan ../private-plans/run-001
# Inspect plan.json: recipe, revision, helper hashes, before/after package hashes and hook change.
npm run audit:modernize -- --root ../my-site-copy --apply ../private-plans/run-001/plan.json
# Inspect git diff and run the site's authorized checks separately.
npm run audit:modernize -- --root ../my-site-copy --rollback ../private-plans/run-001/plan.json
```

Without `--apply` or `--rollback`, the command only plans. Without `--plan`, JSON goes to stdout. Plans/backups must be outside the target, never overwritten, and private: the byte-exact package backup may contain project-specific script values. The plan binds target identity, branch, Git revision, original and proposed bytes, supported helper hashes and recipe version. Staged/untracked changes or unrelated tracked changes cause refusal. Main/master and detached HEAD are refused. Do not change branch/revision after review; regenerate the plan when preconditions change.

Apply uses a private backup, outside-target lock/journal and atomic package replacement. Applying the same plan twice makes no second target change. An already-correct hook is a zero-write no-op. Rollback restores the exact original bytes and refuses post-apply edits or a changed backup/revision. After committing an applied change, use a reviewed Git revert instead of this uncommitted-change rollback.

A prepared journal can finalize safely after an interrupted package rename. If a dead process left `recipe.lock`, verify it is stopped and inspect the plan/journal/backup before removing that one outside-target lock and retrying. Never delete a live lock automatically. There is no automatic rollback of unrelated work.

## Verification and pilot exit

The tests use disposable repositories to apply twice, roll back twice, reject stale/tampered plans and recover prepared journals. A real npm lifecycle test uses the real schema helper with a **synthetic build executable**: 51 columns prevents both the preserved hook and build; a valid schema allows both. This proves ordering/gating, not a second Astro runtime certification. The normal starter production build is checked separately.

For a downstream pilot, record its brief, runtime, languages, source revision, snapshot provenance and outstanding integrations. Diagnose first, select a supported recipe, preserve the before report/captures, review the branch diff, run local visual and real public/editor checks, and rehearse rollback before rollout. Do not update visual goldens to hide a finding. Preserve the original design/content requirements.

The local synthetic pilot exercises this flow; individual client acceptance is still required before general rollout. Cloudflare Worker/D1/R2 and registry/media adapters remain planned for subsequent milestones; no production data or deployment follows from diagnosis or this recipe. Browser verification stays local, outside push/PR CI and build/deployment dependencies.

## Import route and editor observations

`--evidence` reads a caller-supplied **evidenceVersion 1** bundle and its relative artifacts. It never starts a browser, fetches URLs, executes target code or contacts a CMS. Report schema remains v2. The new `route-capture-evidence` and `editor-save-reload` rules are recommendations when evidence is absent and required when explicitly supplied. Missing, stale or refused evidence therefore fails opted-in strict verification. Captures never turn the separate accessibility/provider/Cloudflare findings into passes.

The bundle has exactly these fields:

| Field | Contract |
| --- | --- |
| `evidenceVersion` | `1` |
| `capturedAt` | ISO timestamp within 30 days, no more than five minutes in the future |
| `runtime` | Same explicit audit runtime profile |
| `binding` | `targetId`, Git `revision`, and `workingTreeSHA256` from `evidenceBinding(root)` in `scripts/audit-runtime-evidence.mjs` |
| `expected` | Nonempty array of declared `{route, state, locale, viewport: {width, height}}` scopes; state is `public` or `editor` |
| `captures` | One fact per expected scope, plus `httpStatus`, `ready`, `overflow`, `consoleErrors`, `annotationCount`, and `screenshot: {path, sha256}` |
| `editors` | Array of `{route, locale, field, surface, receipt: {path, sha256}}`; an empty array cannot verify saving |

Each artifact path is relative to the bundle directory. Absolute/traversing/linked paths, missing files, changed hashes and files over 8 MiB are refused. The bundle is limited to 1 MiB, each list to 200 items, and total artifact reads to 64 MiB. Screenshots are PNG viewport captures whose header dimensions match the declared viewport; ingestion checks bytes/hash/header, not image quality or perceptual differences. Preserve full-page captures and visual diffs separately when needed. Declared coverage is explicit evidence scope, not discovery or proof that every route/state/locale was tested. Report observations retain the declared matrix, capture facts and tested field scopes without editorial values. Ingestion trusts the supplied observations as attestations; file hashes establish integrity and binding, not independent truth or source authenticity.

The binding includes exact bytes of all tracked and unignored files (bounded to 10,000 files, 8 MiB each and 256 MiB total), and a hashed checkout identity. HEAD alone cannot conceal uncommitted changes. Ignored databases, media and environment settings are outside this source binding. Collect new evidence after applying the recipe; an old bundle becomes unverified even if HEAD is unchanged. Moving to another clone requires its own binding and reviewed capture run.

Editor receipt JSON has exactly `route`, `locale`, `field`, `surface`, `beforeSHA256`, `submittedSHA256`, `reloadedSHA256`, `publicSHA256`, `saveHTTPStatus` and `restored`. The changed value must differ from the original; submitted, editor-reloaded and anonymous-public value hashes must agree; save must return 2xx; the fixture must be restored. Use `emdash-inline` or `emdash-admin` only for an actual supported editor interaction. `cms-api` receipts are counted separately and never verify editor UI saving. The declared matrix must include public and editor captures for each tested route/locale. Markers and dictionary/unannotated text remain observations only. Registration, other fields/locales, permissions, Portable Text/media fidelity and provider delivery need their own acceptance evidence. Real editorial changes must be explicitly authorized; do not perform synthetic write/restore probes against production.

## Repeat the disposable fixture pilot

On the pinned local Windows renderer, run:

```sh
npm run audit:pilot -- --out audit/phase-4-2026-10-16/pilot-new-run
```

Choose a new output directory. This manual command refuses CI, creates and clones an older-workflow fixture on `codex/phase4-pilot`, seeds a fresh disposable EmDash database and never copies a working DB, uploads or environment credentials. Its framework profile is deliberately unchanged: Astro 7.4.0 / EmDash 1.3.0. The older behavior is the missing schema guard before an existing prebuild hook. Fixture skill receipts describe local inventory equality, not an upstream refresh.

The runner uses development setup only to seed/authenticate the isolated instance, then runs the normal built Node server for captures and real inline title save, publish, reload, anonymous read and restoration. It captures public home/about/post and editor about at 390, 768 and 1440 pixels before and after remediation. It supplies a closed offline seeded DB snapshot to the audit, inspects the plan, applies twice, runs measured preflight and the normal build, compares route screenshots, rolls back twice and checks exact package/source restoration and clean branch state. Both JSON and Markdown v2 reports are retained. Servers, dependency junction, disposable repositories and private DB are removed; failed server logs stay ignored locally.

Review the report findings, `reviewed-plan.json`, capture bundles/PNGs, field receipts and `verification.json`. Only synthetic/permission-cleared evidence belongs in this repository. A passed fixture rehearsal supports the bounded recipe and ingestion pipeline; it is not certification of a client site, arbitrary legacy frameworks or Cloudflare infrastructure.

Sources: [Astro cache configuration](https://docs.astro.build/en/reference/configuration-reference/#cache), [EmDash architecture/configuration](https://docs.emdashcms.com/concepts/architecture/), [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/).
