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
---

# One-line title

What changed and why.

## For sites

What a site does to take it.
```

- **bump.** `major`: a site must migrate, or something breaks without action. `minor`: new capability, or a change to how pages look. `patch`: a fix that needs nothing beyond the normal update. `none`: nothing reaches sites (a refactor of a shipped file, wording); such a note needs only a title.
- **adoption.** `sync`: the site's skill sync (`sync:site-skills`, `sync:emdash-skills`) or a static site's `sync:baseline` delivers it. `copy`: copy the listed files whole. `manual`: review and merge by hand, usually because the site owns the file (`global.css`, `Base.astro`). `none`: nothing to do.
- **visible** and **database** put the note in its own group in the release notes, because they need a decision or a rehearsal per site.

`npm run standards:check` (part of `npm run lint`) validates every note. In CI it also runs with `--base`, and fails when a change touches files sites receive (skills, `src/`, `scripts/`, `profiles/`, docs outside `docs/plans/`, the package files) without adding a note. The weekly upstream job writes its own note (`standards/changes/upstream-update.md`). `npm run standards:check -- --list` shows what is pending and the largest bump so far.

## Cutting a release

1. **Certify.** Follow the [certification sequence](phase-3-certification.md) on the candidate commit and record the evidence. Update `standards/manifest.json` by hand for what certification decides: runtime profile versions, checks, pending items, certification scope, receipts and evidence paths.
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

## How sites use a release

`npm run fleet:status` compares every site in the private fleet list with the release this checkout pins: certified dependencies and Workers rules, every distributed skill folder (current, differs or missing; design-surface skills are optional), the pinned helpers the site has installed, and the Impeccable version. The `changes` digest in the release says, per change, which platforms it touches and how a site takes it; an update follows the release notes from the site's last adopted release to the new one. See [Keeping an existing site up to date](baseline-updates.md).
