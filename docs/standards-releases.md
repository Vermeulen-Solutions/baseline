# Standards releases and change notes

A standards release is the version of Baseline that sites update to. It pins three things: the runtime it certifies (framework and CMS versions, tested on the stated profile), the skills and helper scripts it distributes (by content hash), and the changes since the previous release (as structured notes). Sites never update to `main`; they update to a tagged release.

## Change notes

Every change that reaches sites gets a short note in `standards/changes/<slug>.md`, written in the same pull request by whoever made the change. Create one with:

```sh
npm run standards:change -- --slug impeccable-4-9 --bump patch --title "Impeccable 4.9.2"
```

The front matter is what update tooling reads; the body is what a person or agent updating a site reads.

```markdown
---
bump: minor                 # major | minor | patch | none
platforms: [emdash, static] # which kinds of site it affects
areas: [skills, tooling]    # dependencies, skills, tooling, components, styles, content-model, delivery, docs
adoption: sync              # sync | copy | manual | none
visible: no                 # does it change how pages look?
database: no                # does it need a database step?
files: [scripts/audit-ui.mjs] # optional; required with adoption: copy
packages: [astro@7.4.13]    # optional; exact versions this change pins (Renovate notes write it)
---

# One-line title

What changed and why.

## For sites

What a site does to take it.
```

- **bump.** `major`: a site must migrate, or something breaks without action. `minor`: new capability, or a change to how pages look. `patch`: a fix that needs nothing beyond the normal update. `none`: nothing reaches sites (a refactor of a shipped file, wording); such a note needs only a title.
- **adoption.** `sync`: the site's skill sync (`sync:site-skills`, `sync:emdash-skills`) or a static site's `sync:baseline` delivers it. `copy`: copy the listed files whole. `manual`: review and merge by hand, usually because the site owns the file (`global.css`, `Base.astro`). `none`: nothing to do.
- **visible** and **database** put the note in its own group in the release notes, because they need a decision or a rehearsal per site.

`npm run standards:check` (part of `npm run lint`) validates every note. In CI it also runs with `--base`, and fails when a change touches files sites receive (skills, `src/`, `scripts/`, `profiles/`, docs outside `docs/plans/`, the package files) without adding a note. The weekly upstream job writes its own note (`standards/changes/upstream-update.md`), and each Renovate pull request writes one per branch (`standards/changes/deps-<branch>.md`, with `packages:`). `npm run standards:check -- --list` shows what is pending and the largest bump so far; `--json` adds each note's fields, including `packages`.

## Runtime versions between releases

The runtime a release certifies is the exact versions in `standards/manifest.json` (`runtimeProfiles.node-sqlite.dependencies`: Astro, its Node and React adapters, React, React DOM and EmDash, plus the Tailwind range). Sites are audited against the release they took, so these only change for sites at a release. Baseline itself may run ahead in between:

1. **Between releases.** Renovate opens pull requests for patch and minor versions; its notes name each exact version in `packages:`. Merge them when CI is green. `tests/site-standards-audit.test.mjs` accepts Baseline being ahead of its last release only for versions a pending note names, so a hand-made pin bump needs its own note with the same line. EmDash and major versions wait for a tick on the Dependency Dashboard and follow their upgrade guide ([automated upstream updates](automated-upstream-updates.md#renovate-pilot-pinned-packages-and-github-actions)).
2. **At the release.** Run `npm run standards:check -- --list --json` to see which notes moved which packages. Certify the candidate with the pinned versions, then set the manifest's runtime versions to the pins in `package.json`; leave a range such as Tailwind's as it is unless certification decides otherwise. `standards:release` refuses a manifest whose exact runtime versions differ from the pins. The importer rehearsal needs no edit: it checks the installed Astro against the pin.
3. **For sites.** The release notes' **Changes for sites** carry each dependency note, with the `npm install --save-exact` commands for EmDash and static sites. After taking the release, the site audit expects the new versions.

## Cutting a release

1. **Certify.** First run the Windows visual suite on the candidate and renew what it asks for (below). Then follow the [certification sequence](phase-3-certification.md) on the candidate commit and record the evidence. Update `standards/manifest.json` by hand for what certification decides: runtime profile versions, checks, pending items, certification scope, receipts and evidence paths. The runtime profile's exact versions must equal the pins in `package.json`, which may have moved ahead since the last release ([runtime versions between releases](#runtime-versions-between-releases)); `standards:release` refuses a manifest that still names older versions.

**Visual references before certifying.** Run `npm run test:visual` on the candidate. CI runs on Linux and only checks that every reference image is recorded in `tests/visual/baselines/win32/manifest.json` with its SHA-256; it cannot tell whether a starter change made the references outdated. When a comparison fails, open the diff in the Playwright report. If the change is intended, run `npm run test:visual:update`, review every renewed image, and commit the images with `manifest.json` before certifying; if it is not, fix the source. Certify only on a run with no failures and no reference left to renew. To catch this earlier, CI adds a notice to a pull request that changes `src/styles/`, `src/components/` or `src/layouts/` without touching `tests/visual/baselines/`; the author runs the suite on Windows before merging.

Two tests are known to time out when the whole suite runs on a loaded machine: the gallery root typecheck (`a built gallery survives root typecheck`) and the sensitivity self-test (`tests/visual/sensitivity.spec.mjs`). Both pass when run alone. Rerun only those before treating a timeout as a failure:

   ```sh
   node node_modules/@playwright/test/cli.js test --config=playwright.config.mjs --grep "root typecheck"
   npm run test:visual:sensitivity
   ```

2. **Prepare.** With the certified commit checked out (or with no later change to skills or pinned helpers), run:

   ```sh
   npm run standards:release -- --version 0.3.0 --source-commit <certified SHA> --title "Short title" --dry-run
   npm run standards:release -- --version 0.3.0 --source-commit <certified SHA> --title "Short title"
   ```

The version must be at least the bump the notes ask for (below 1.0 a `major` note raises the minor number). The script sets the release fields in the manifest, pins the distribution (`distribution`: a hash per skill folder, a hash per pinned helper, the Impeccable version) and the note digest (`changes`), copies the manifest to `standards/baselines/<version>.json`, pins that file's SHA-256 in `STANDARD` (`scripts/audit-site.mjs`), admits the release in the audit report schemas, writes the **Changes for sites** section of `standards/releases/<version>.md` and deletes the notes. Text outside the generated section is kept, so write the release summary, evidence and known gaps around it.
3. **Review and tag.** Run `npm run verify`, commit, and tag the release commit: `git tag -a standards-v<version> -m "Standards <version>"`. Push the commit and the tag.
4. **Publish.** Create the GitHub release from the pushed tag, so the releases page lists it and marks it Latest:

   ```sh
   gh release create standards-v<version> --verify-tag --latest --title "Standards <version>" --notes-file <notes>
   ```

The notes file is `standards/releases/<version>.md` without its title line, with relative links rewritten to `https://github.com/Vermeulen-Solutions/baseline/blob/standards-v<version>/…` so they resolve from the releases page. A tag without a release is not finished: `gh release list` must show the new version as Latest.

## Lessons from past releases

- **Name the version from the notes.** Run `npm run standards:check -- --list` before choosing the version: one `minor` note turns a planned patch into a minor release.
- **Runtime pins no longer wait for a release.** Until 2026-11-27 a runtime pin bump had to ship inside a release pull request, so no routine update could pass CI on its own. Pins now run ahead by name and the release certifies them ([runtime versions between releases](#runtime-versions-between-releases)).
- **Pass the full commit.** `--source-commit` takes the full 40-character SHA.
- **A fix found during certification goes before the release commit.** Force-push is blocked, so `git revert` the release commit, commit the fix with its note, and cut the release again. Save the hand-written parts of `standards/releases/<version>.md` first: the script regenerates the file.
- **Certify on clean clones with Windows line endings.** With `core.autocrlf=true`, a test that looks for multi-line source with `\n` fails; normalise the source with `.replaceAll('\r\n', '\n')` first.
- **Raising the reviewed CMS version.** Bumping `REVIEWED_EMDASH` means diffing setup, admin and verify, the media REST routes and export-seed against the previous release (`npm pack` both into a scratch folder), and keeping the old version in `HOSTED_AUTH_VERSIONS`.
- **Keep certification scripts somewhere durable.** A runner script left in a session's temporary folder is lost with it; keep it in the repository or another kept folder.

## How sites use a release

`npm run fleet:status` compares every site in the private fleet list with the release this checkout pins: certified dependencies and Workers rules, every distributed skill folder (current, differs or missing; design-surface skills are optional), the pinned helpers the site has installed, and the Impeccable version. The `changes` digest in the release says, per change, which platforms it touches and how a site takes it; an update follows the release notes from the site's last adopted release to the new one. Skills come through the site's skill sync (or `sync:baseline` on static sites), Baseline-owned components, libraries, scripts and tests through `npm run site:files -- --site <path> --apply`, and site-owned files by hand. `npm run fleet:drift` goes the other way and lists the Baseline-owned skills and helpers sites have changed. See [Taking a standards release](baseline-updates.md#taking-a-standards-release).
