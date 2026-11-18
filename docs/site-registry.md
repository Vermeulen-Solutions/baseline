# Downstream site registration

At new-site workflow completion, create or update a reviewed entry in an authorized private starter registry, or retain an explicit pending artifact when central access is unavailable. This public template contains no real client registry. Registration never contacts a client or modifies their site.

Prepare private JSON with `siteId` and `ownerTeam` as stable lowercase identifier strings; `repository` as an authorized GitHub HTTPS repository reference; exact `starterCommit`; nullable `starterRelease`, `lastAudit` (YYYY-MM-DD) and `standardsVersion`; `runtimeProfile` (`node-sqlite` or `cloudflare-d1-r2`); and lifecycle `status` (`active`, `paused`, `archived`). Do not include contact details, domains, credentials or arbitrary metadata. An unreleased starter uses null release/standards values, never an invented stable tag.

Run `npm run site:register -- --input <private-json> --registry <authorized-private-file>`. The output is a local proposal to review and land through the central private repository's normal process. A registry inside this checkout is restricted to ignored `.emdash/site-registry.private.json`; the helper verifies Git exclusion before writing. A central file outside this checkout must already be in storage appropriate for private metadata. No automatic GitHub commit/PR occurs.

The registry is identity and lifecycle metadata only. It intentionally excludes domains, Worker IDs, database names, bookmarks, deployment commands and other fleet operations data; keep those in separately authorized private deployment records. Store the registry itself in a private, backed-up repository or equivalent controlled store rather than a single local working directory. A proposal written to a local private path is useful review material, but it is not yet central registration.

Without `--registry`, the command records `.emdash/pending-registration/<siteId>.json`, with an explicit pending reason. Use that path when access/configuration is absent; it is not completed central registration. Keep it out of Git and hand it to the authorized maintainer. Repeated identical registrations preserve the file. Repository renames retain `previousRepositories` under the same site ID; archive rather than deleting history. Reopening an archived site requires `--reactivate`. Writes use an exclusive lock and atomic file rename; stale locks after a process failure require verified local recovery.

## Fleet status

The registry records identity and lifecycle; it does not say whether a site is up to date. `npm run fleet:status -- --config <private fleet.json> [--out <STATUS.md>] [--json]` reads that from the local checkouts instead of from hand-kept notes. The config lists each site's identifier and folder, relative to the config file:

```json
{ "sites": [ { "id": "example-site", "path": "../sites/example-site" } ] }
```

Each site can also carry hand-kept facts a checkout cannot show: `status` (`live`, `preview`, `candidate` or `archived`), `origins` (public URLs), `adopted` (`{ "standards": "0.3.0", "date": "2026-11-18" }`, the release the site was last brought to) and `deploy` (`date`, `version`, `rollback`, `log`). The report lists them in a **Deployments** table, and a site whose `adopted` release is older than the one this checkout pins is not current until its record is updated, so the record names the release notes an update starts from.

For every site the command reports the Git state (branch, commit, uncommitted files, ahead or behind as of the last fetch), whether it is a generated Baseline project, an earlier Baseline copy or another project, its hosting from config files, its Astro and EmDash versions as locked, and, for Baseline sites, every certified dependency and the Node range that differ from the standards this checkout pins. When the release pins its distribution, it also compares every distributed skill folder (current, differs or missing; the design-surface skills are optional), the sync and audit helpers the site has installed, and the Impeccable version. See [standards releases](standards-releases.md). It is read-only and uses no network. Keep the config and the report with the registry in private storage; sites that were not built from Baseline can be listed too, as port candidates.

`npm run fleet:drift -- --config <private fleet.json> --out <private folder> [--site <id>]` reads the same list the other way round: which Baseline-owned skills and pinned helpers a site changed (`changed`) or wrote for itself (`added`), as opposed to versions Baseline has had (`known`). It writes a patch per file against the site's adopted release and a `DRIFT.md` summary to a folder outside Baseline. It never writes into Baseline or a site and never opens a pull request: the patches carry site content, so a person decides what belongs in Baseline and rewrites it without client names.
