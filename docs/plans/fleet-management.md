# Fleet management: from a status report to an update tool

Status: direction, November 2026. The pieces that exist are `fleet:status`, the private fleet record (`fleet.json`, one page per site, the site registry) and standards releases with change notes. This plan describes where they lead: one tool that tells the owner what each site needs and walks an agent through bringing it there.

## What works today

- **One generated status page.** `fleet:status` reads every checkout and compares it with the pinned release: certified dependencies, Workers rules, skills, helpers and Impeccable. It needs no network and holds no site data.
- **Structured release changes.** Each release carries a digest of its change notes (`changes` in `standards/baselines/<v>.json`): platforms, areas, adoption mode, whether a change is visible or needs a database step, and the files involved.
- **A hand-kept record per site.** Status, origins, the adopted release and the last deploy live in `fleet.json`; narrative and open items live in the site's page.

## What gets in the way

1. **Three records of one site.** `fleet.json` (folder and deploy facts), the site registry (identity and lifecycle contract) and the site page (prose) overlap, and the registry's `standardsVersion` and `lastAudit` go stale because nothing reads them back. Direction: make `fleet.json` the single source for operations facts and derive the registry entry from it with `site:register`, keeping the registry's narrow contract.
2. **No plan per site.** The status says what differs, not what to do. Direction: `fleet:plan <site>` reads the site's adopted release and the `changes` digests of every release since, filters by the site's platform, and prints the ordered steps: syncs to run, files to copy, visible changes to decide, database rehearsals to schedule. The release notes already group changes this way; the plan is the same data scoped to one site.
3. **Updates are hand-driven.** Every site update repeats the same sequence: branch, record checks before, adopt helpers, stage and apply skill syncs, copy files, verify, write the adoption note, commit, record. Direction: `fleet:update <site> --to <version>` runs the mechanical steps on a maintenance branch, stops at every decision (staged skill conflicts, visible changes, database steps, deploys) and writes the adoption note from what it did. Deploys stay explicit.
4. **The record is updated by memory.** After a deploy the owner or agent edits `fleet.json` and the site page by hand. Direction: `fleet:record <site> --deploy` captures the Worker version, rollback target and D1 bookmark from Wrangler output and writes them, and `--adopted <version>` closes an update.
5. **Improvements stay in the site that made them.** A fix made to a skill or helper while working on a site reaches Baseline only if someone remembers it. `fleet:drift` (available) lists every Baseline-owned file a site changed or added and writes a patch for each against the site's adopted release; the owner or an agent decides what belongs in Baseline and rewrites it without client names. Direction: run it at the end of each site session and fold its candidates into the findings log.
6. **Only local checkouts.** The status reads whatever is checked out locally and as fresh as the last fetch. Direction: a `--fetch` mode, and later a scheduled private job that runs the status against fresh clones and opens an issue per site that falls behind a new release.

## Order

1. `fleet:plan` (read-only; needs only the `changes` digests that releases now carry).
2. Registry derived from `fleet.json`.
3. `fleet:record` for deploys and adoption.
4. `fleet:update` for the mechanical steps, with the stops above.
5. Scheduled status in the private fleet repository.

Each step is useful on its own, and none needs a server: the tool stays a set of Baseline commands run against a private record.
