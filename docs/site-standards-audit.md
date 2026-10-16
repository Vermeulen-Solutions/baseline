# Downstream site diagnosis and remediation

Start with a read-only diagnosis, review the findings, then select a supported recipe on a disposable copy or feature branch. Diagnosis never installs dependencies, evaluates target configuration, synchronizes skills, opens the live database, writes CMS content or deploys. No network is used. Remediation is a separate explicit command.

## Diagnose

```sh
npm run audit:site -- --root ../my-site
npm run audit:site -- --root ../my-site --out ../private-reports/run-001
npm run audit:site -- --root ../my-site --db-snapshot ../private-backups/closed.sqlite --strict
```

JSON goes to stdout unless `--out` names a **new directory outside the target**, including through symlinks. That directory receives JSON and Markdown. Keep real site reports private; never commit them to this template. No scheduler, network check or Actions job is installed.

The source is the exact standalone `standards/baselines/0.1.1.json` artifact. Its digest must be `a30dfde700dac0ead090ca19f743312d5bb4cd886aa51facd387c372db56b2c4`, corresponding to the original immutable commit recorded in it. `--standards-file` accepts only an identical offline artifact. Missing or changed bytes abort. Mutable main or an identical version label is insufficient; another standards version needs a reviewed resolver extension.

## Implemented coverage

| Scope | What is established | What is not established |
| --- | --- | --- |
| Package/Node | Bounded JSON objects; baseline lockfile versions and exact declared Node policy | Deployment runtime, general semver compatibility or a reason to downgrade newer packages |
| Astro configuration | TypeScript AST reads literal `defineConfig` output/adapter, aliased imports, React/EmDash calls and explicit Node SQLite/local-storage wiring | Execution of arbitrary helpers, computed/spread/function configs, deployment or provider behavior |
| Locales/cache | Literal locale registration and unprefixed default; absent root cache config is inapplicable on the supported profile | Real translated rendering; cache hint completeness when caching is configured, which stays required/unverified |
| Managed skills | Version-2 receipt membership, required SKILL.md files, complete bounded managed-directory inventory, normalized hashes, missing/extra/changed files | Upstream currency or authenticity of a self-supplied receipt; unmanaged skills remain project-owned |
| SQLite schema | Explicit offline snapshot, actual physical widths including hidden/generated columns, definition and snapshot digests | Width inferred from seed fields, D1 parity, collection registry/reference integrity or content correctness |
| Build preflight | A supported schema command at the beginning of the npm prebuild hook | Proof that a database exists or that a modified helper behaves correctly |
| Runtime/visual/providers | Explicit unverified findings | Successful editing/saving, accessibility conformance, form delivery, Worker/D1/R2 certification |

Dynamic/unsupported configuration is **unverified**, never a successful guess based on comments or matching text. The parser never imports a target module. The pinned TypeScript parser is an explicit development dependency; install development tooling to use the audit commands.

Skill passes mean equality to the recorded managed snapshot, not equality to today's upstream. Legacy commit-only receipts and incomplete/malformed inventories stay unverified. Drift is a required failure with counts; local file names/content and overrides are withheld and preserved for review. Do not resolve a finding by overwriting dirty skills. Current Baseline itself still has a legacy upstream receipt and no reviewed site-skill hash receipt; its strict self-audit therefore remains incomplete.

Schema measurement accepts only a caller-supplied **closed, consistent offline SQLite snapshot**, without WAL/SHM/journal sidecars and at most 64 MiB. A temporary private copy is opened read-only/query-only and removed afterward. The engine reads metadata, not content rows; table/column names and raw SQL are withheld. Missing DB/tables/refused evidence stays unverified; 51 physical columns fails the 50-column budget. Acquire snapshots using supported backup/export procedures; copying a live DB file alone does not establish consistency. Target-specific Cloudflare D1 and registry parity tooling are planned for future roadmap milestones.

## Stable report contract

Reports use **schemaVersion 2**, documented in [the JSON Schema](../standards/site-audit-report.schema.json). The generator and Markdown/output adapters validate it. Rule IDs are unique; summary totals must match rule statuses. Invalid versions, fields, evidence paths, statuses, non-JSON values and duplicate IDs are rejected. Version 1 scaffold reports remain historical receipts; regenerate them rather than relabeling them as v2.

Each rule carries version, required/recommendation severity, expected/observed facts, evidence, confidence, applicability, remediation and verification bounds. Sensitive configuration, env, content rows, private Git paths/remotes and arbitrary package names are withheld. A rule pass proves only its stated static observation.

Ordinary invocation exits 0 after producing findings. `--strict` exits 1 for implemented required fail/unverified rules, including unsupported configuration, managed skill inventories, physical schema and opted-in caching. Usage, standards or unsafe-output errors exit 2. Recommendations can remain unverified without failing strict mode. This is a bounded diagnostic policy, not full site acceptance.

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

Next: import route/state capture evidence and actual editor acceptance, then choose one explicitly authorized downstream pilot. Record its brief, runtime, languages, source revision, snapshot provenance and outstanding integrations. Diagnose first, select a supported recipe, preserve the before report/captures, review the branch diff, run local visual and real public/editor checks, and rehearse rollback before rollout. Do not update visual goldens to hide a finding. Preserve the original design/content requirements.

Downstream pilot validation and editor evidence remain ongoing before general rollout. Cloudflare Worker/D1/R2 and registry/media adapters remain planned for subsequent milestones; no production data or deployment follows from diagnosis or this recipe. Browser verification stays local, outside push/PR CI and build/deployment dependencies.

Sources: [Astro cache configuration](https://docs.astro.build/en/reference/configuration-reference/#cache), [EmDash architecture/configuration](https://docs.emdashcms.com/concepts/architecture/), [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/).
