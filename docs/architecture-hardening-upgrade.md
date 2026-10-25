# Architecture hardening upgrade

Generator **0.4.0** assembles the metadata, interaction verification, Astro accessibility lint, native composition and fluid-token diagnostics implemented in Phases 1–6. This is a starter capability update. It does not change the historical `standards-v0.1.1` certification, install optional dialogs/navigation/OG generation, publish a package/tag, or certify a downstream client site.

## New projects

Use an inspected checkout and npm on Node `^22.22.3 || ^24.16.0 || >=26.3.0`. The pinned local Windows screenshot renderer is Node 24.21.0; automated checks use Node 24.16.0. Installed development tooling has a higher floor than the historical standards record. Astro 7.4.0 and EmDash 1.3.0 remain the scoped framework versions; this update does not recertify their admitted runtime range.

| Profile | Assembly and metadata owner | Applicable acceptance |
| --- | --- | --- |
| `emdash` | Existing repository; SiteShell owns the document/title, Base selects EmDashHead for metadata | Node/SQLite build, public routes/media, supported SEO API/plugin precedence and local browser journeys |
| `static` | `npm run init:profile -- --profile static --out <new-directory>`; native collections and StaticMetadata | Independent npm install/ci, verify/build, native Markdown/images, production/fixture separation and local public browser journeys |
| `static-sveltia` | Same generation with `--profile static-sveltia`; same static metadata/schema | Static checks plus paired admin configuration and local sign-in smoke; credentialed publishing is separate |

In a generated project run `npm install`, commit its own lockfile, then use `npm ci`, `npm run verify`, `npm run build` and `npm run check:dev-tools`. Configure `SITE_URL` for public URLs. Set real identity/navigation and replace starter content. Save the site's real Art Direction Record and calibrate its tokens/primitives before public page work. Generation receipts retain exact file hashes and a dirty-source indicator; they are provenance, not conformance proof.

## Existing sites: review before applying

Work on a disposable checkout/branch with a clean checkpoint and recovery path. Select a reviewed, available **40-character upstream commit**. Do not assume an unpublished local commit is downloadable from GitHub. Keep CMS database/media backups separate from code; no content migration is required by this release.

| Change | `emdash` | Existing static/Sveltia |
| --- | --- | --- |
| Existing shared shell/components/scripts | Review source diff and client adaptations | Stage bounded sync, inspect whole-file conflicts, apply eligible files |
| Calibrated CSS | Merge relevant semantic rules; preserve brand values | Conflict remains visible; manually reconcile rules and semantic aliases |
| New helpers/components/tests/docs | Add reviewed local files | Explicit local additions; ordinary sync cannot grow installed membership |
| Lint packages/config/scripts | Explicit package and lockfile review | Same; no CMS or server packages needed |
| Base, routes and navigation | Adapt CMS-owned settings/menu/edit bindings and cache hints | Adapt local Base/routes; retain site settings, navigation, content and admin config |
| Schema/editor form | No schema change in this release | No schema/Sveltia form change; retain their pairing |

For generated sites:

```sh
npm run sync:baseline -- --ref <reviewed-40-character-SHA>
# Review .baseline/updates/<SHA>/stage.json and files/.
npm run sync:baseline -- --apply <same-SHA>
```

Inspect `lastSync.conflicts` even if apply exits successfully. Sync preflights paths/hashes and retains changed client files. It does not install packages, add scripts, replace client Base/routes/config, expand managed-file membership or auto-merge CSS. Docs and test paths are also outside its selected update paths, even when an old inventory contains them. Follow [bounded updates](baseline-updates.md).

**Finish the explicit additions before judging a partial sync as deployable.** An updated shared styleguide imports the new composition specimen/components; an updated shared `posts.ts` imports the new metadata/routing helpers. An old installation lacking those paths needs the additions below before verify/build can succeed. Preserve and report the actually adopted subset.

## Static/Sveltia additive patch and order

The [reviewable static patch](upgrades/architecture-hardening-static.patch) was derived from the near-default rehearsal **after bounded sync**, starting from `2d7e88b` and adopting the feature set at `84613f3`. It is an example for that source shape, not a general migration tool. It includes package edits and new paths, and excludes lockfiles, managed receipts and gate exceptions. Read it; use `git apply --check <patch>` only against a matching disposable checkout. Adapt client-owned hunks manually. Do not force it onto a different site.

1. Add `src/components/StaticMetadata.astro`, `src/lib/metadata.ts`, `src/lib/json-ld.ts` and `src/config/routing.ts` from the static overlay at the selected revision. Adapt `astro.config.mjs` to use that one routing policy. Keep public base/slash/output-format settings coherent.
2. Adapt Base to resolve one metadata model, select `metadataOwner="platform"` on SiteShell and render StaticMetadata in its head slot. Remove the old independent description/canonical path. Retain local header/footer, navigation and CMS/editor ownership. Set article facts on real content routes; errors opt out of canonical/schema and declare noindex. Do not invent authors/dates.
3. Add `Disclosure`, `Cluster`, `Sidebar`, the shared `dev/CompositionSpecimens.astro` and `src/dev/disclosure-prose.md` together. Preserve their open slots. Merge the associated CSS relationships and semantic link aliases into the calibrated stylesheet. Keep the existing `@theme` values, and verify default, dark and restored-light link contrast. See [native composition](native-composition.md).
4. Add `eslint.config.mjs`, `tests/template-lint.test.mjs`, `tests/metadata.test.mjs` from the static overlay, and `tests/fluid-tokens.test.mjs`. The older static foundation tests remain. Install the explicitly reviewed development dependencies and regenerate this site's lockfile:

   ```sh
   npm install --save-dev eslint@10.13.0 eslint-plugin-astro@3.2.1 eslint-plugin-jsx-a11y-x@0.2.0 @typescript-eslint/parser@8.71.2 parse5@7.3.0
   ```

5. Retain existing package scripts/tests. Add `lint:scripts` as `node scripts/check-script-syntax.mjs`, `lint:templates` as `eslint src --max-warnings 0`, and make `lint` run both. Include the new portable mathematical suite in `test:design`; `npm test` already discovers `tests/*.test.mjs`. Keep `verify` running lint, art direction, tokens, tests and Astro check. Review the engine floor alongside package/CI changes.
6. Treat newly copied paths as locally owned unless a separately reviewed generator migration establishes management. Leave the installed receipt's original generation version, source commit and bounded membership intact. Commit an adoption note describing additions and remaining sync conflicts. Copy/update the relevant framework/composition/update guidance explicitly.
7. Use the client's real Art Direction Record for adapted visual source. Never copy starter exception hashes over client code. The synthetic near-default rehearsal retains exact reviewed upstream exceptions only where bytes match; that is not a client exemption procedure.

The customized rehearsal used reviewed Git three-way template patches. Its CSS three-way attempt conflicted, so the token-only synthetic fixture received an explicit reviewed reconciliation that preserves its calibrated values and rejects additional local rule edits. Those operations are outside `sync:baseline`; they do not change its no-merge/no-force contract. Real client CSS requires review of its complete local changes, not reuse of a fixture reconciliation procedure.

## EmDash adaptation

Review `src/utils/page-metadata.ts`, Base, Posts/Pages and 404 changes against the site's existing settings, menu, route and plugin logic. Preserve EmDashHead's editor/plugin precedence and supply actual hydrated article facts. Keep public routes server-rendered; register settings/menu/content cache hints for queries. Retain `entry.edit.*` annotations and Portable Text ownership. EmDashImage alone resolves CMS storage; shared ResponsiveImage remains native Astro presentation. Use the installed-version EmDash APIs and the repository's metadata rehearsal. Do not copy CMS helpers/dependencies or form handlers into static profiles.

The structural additions, lint configuration and fluid diagnostics apply to both foundations. Form recovery handlers remain CMS-specific; static error markup does not imply a working submission backend. No working database, uploads, credentials or editor content is copied by the disposable acceptance harnesses.

## Verification, rollback and release scope

Run `npm run verify` and `npm run build` on the actually adopted source and npm lockfile. Check public/error routes and metadata, image delivery, preserved editor fields, production styleguide 404s, separate nondeployable fixtures and the applicable sign-in/form workflows. Run local rendered acceptance; mathematical fluid-token success does not certify text resizing. Browser/screenshot suites remain outside CI and production builds.

Review and commit source, the site's regenerated lockfile, adopted script/config changes, receipt changes for eligible synced files and the local adoption note. Keep original calibration/provenance and unresolved conflicts visible. Roll back the entire checkpoint as a coherent source/lock/receipt set; do not restore only the package manifest or manufacture receipt hashes to silence conflicts.

The root progress ledger and Phase 8 receipt record executed results. Manual text-only resizing, screen readers, other engines/devices, real authenticated editor save/reload, credentialed Sveltia publishing and provider deployment/cache behavior remain separate acceptance. Core automated acceptance does not claim WCAG conformance. Phase 7 capabilities remain deferred pending requirements.
