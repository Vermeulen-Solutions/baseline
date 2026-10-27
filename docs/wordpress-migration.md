# WordPress migration on every Baseline profile

Start with the WordPress dashboard. FTP, a hosting control panel and a local uploads-directory copy are not normal migration prerequisites. Use the first-party EmDash Exporter to capture content and media, then choose the output for the installed Baseline profile. The portable tools contain no EmDash runtime or database dependency.

## What the client does

1. Download the **EmDash Exporter plugin ZIP** from the [official releases](https://github.com/emdash-cms/wp-emdash/releases). In WordPress, open Plugins → Add New → Upload Plugin, select that ZIP, install and activate it. Follow the [official package instructions](https://github.com/emdash-cms/wp-emdash/tree/main/plugins/emdash-exporter) to identify the plugin asset; the GitHub repository source ZIP is not a substitute for the packaged plugin. Dashboard search may return no results. Someone with plugin-install permission must do this if the client's role cannot.
2. Open Tools → EmDash Migration and complete its site checks. Use exporter 1.2.0 or later.
3. Generate a migration key. Supply it privately to the migration operator through the agreed secret channel. The key includes credentials; do not paste it in chat, Git, a mapping file or a command argument.
4. Keep WordPress and its media URLs available until migration acceptance and cutover are complete. Revoke the key when access is no longer needed.

For Elementor sites, make a dashboard-exported Website Template kit part of the default discovery checklist, but leave the choice with the client. Ask whether they want the existing design retained as a rebuild reference. If yes, export the kit from Elementor → Editor → Home → Tools → Website Templates and select the relevant templates and Settings & Configurations; include Content only when a bundled content copy is useful. Save the ZIP in the same private migration archive. The EmDash Exporter remains the normal content/media capture path, so a kit is not required to import content. If the client does not want to retain or reuse the design, skip the kit and use the live site and agreed screenshots as visual evidence. Kit export availability and granular options can depend on the Elementor plan.

The kit is source evidence. `migration:wordpress assess --kit` now inspects its JSON and archives the original ZIP privately, without extracting or executing plugin/code assets. It reports page/template structure, widgets, candidate copy, image/link references, responsive overrides and global references alongside kit site settings. This does not automatically reproduce Elementor layouts or resolve dynamic tags/templates. Review the data alongside the live page and responsive screenshots to decide what to rebuild or intentionally retire. Keep the ZIP private because it can contain site content and design assets.

For an EmDash destination, the normal path is to paste the key into the native EmDash import wizard at `/_emdash/admin/import/wordpress`. Review its mappings, import the content, then complete its media-copy and URL-rewrite steps. The shared capture below is also available for inventory, recovery and static conversion.

If the exporter cannot be installed, use WordPress Tools → Export → All content and download the WXR XML. XML includes attachment URLs and metadata, not the files. Baseline can download those attachments while the source remains reachable. A source URL alone can probe the exporter; it cannot authorize access to private content.

## Capture once

Use npm.cmd in Windows PowerShell; use npm on Unix. Run these commands in the destination Baseline project. Every output directory must be new and inside its ignored backup root: `.baseline/backups/` for static profiles or `.emdash/backups/` for the root EmDash foundation.

```sh
# Detect an installed exporter and explain the connection step.
npm run migration:wordpress -- probe --url https://wordpress.example

# Set WORDPRESS_MIGRATION_KEY privately in the process environment first.
# Alternatively use WORDPRESS_USER and WORDPRESS_APP_PASSWORD with --url.
npm run migration:wordpress -- capture --url https://wordpress.example --out .baseline/backups/wp-capture-001

# WXR fallback needs no WordPress credentials.
npm run migration:wordpress -- capture --wxr ../private-export/site.xml --out .baseline/backups/wp-capture-002

# A separately hosted media origin must be declared explicitly.
npm run migration:wordpress -- capture --out .baseline/backups/wp-capture-003 --media-origin https://cdn.example

# An explicitly deferred external integration stays visible as a source-scope exclusion.
npm run migration:wordpress -- capture --url https://wordpress.example --exclude-type external_records --reason "The external integration is deferred by the site owner." --out .baseline/backups/wp-capture-004
```

The exporter path reads all analyzed public post types, including their available unpublished records, plus the paginated media catalog, taxonomy data, settings, menus and comments. It reconciles pagination and analysis counts, then downloads the media into the private capture. Requests send credentials only to the source API; media downloads carry no authorization or cookies. HTTPS, public DNS addresses pinned to each connection, explicit origin boundaries, redirect limits and byte/item/time bounds apply. Plain WordPress permalink installations use the exporter's `rest_route` form when its pretty route returns 404.

Repeated `--exclude-type <analyzed-name>` with a concrete `--reason` can deliberately reduce exporter capture scope. The source type, analyzed count and reason remain in the capture, assessment, handoff and acceptance checklist. Complete means complete for that declared scope; omitted records are not certified as migrated. This does not change the live source endpoint, and equivalent exclusions must be applied separately in native EmDash wizard mappings. WXR capture preserves its original scope and does not accept this flag. Never use exclusions to conceal an unexplained mismatch.

The capture is a versioned `manifest.json`, `snapshot.json` and `media/` archive with byte lengths and SHA-256 hashes; WXR capture also archives the exact `source.xml`. Private/draft content, author details and raw custom metadata can be present: keep the entire capture private. A changed file invalidates the bundle. A media failure or mismatch between analyzed and returned content counts retains a capture marked incomplete and exits 1; conversion refuses incomplete captures. Assess that partial capture to diagnose missing records. Review source query filters/exporter behavior, access or origin declarations and create a new capture when resolved. An API or structural refusal exits 2. Source response bodies and credentials are never printed in failure output.

Current bounds are 10,000 records/media per collection phase, 500 pages per endpoint, 16 MiB per API/XML/snapshot document, 32 MiB per media file and 1 GiB of captured media. Requests have a 20-second deadline and each request phase has a 15-minute budget. A source outside these limits needs a separately scoped batch/export workflow; do not relabel partial capture as complete.

For WXR, completeness means all listed items were parsed and all listed attachments downloaded. It does not prove the export covers the whole site. The parser preserves raw postmeta without executing serialized PHP and rejects DTDs/entities. Exporter count reconciliation is also not a transactional snapshot: freeze source edits for the final capture and reconcile changes before launch. This is a content-transfer archive, not a restorable WordPress database/plugin backup; retain the site's existing backup/recovery arrangements.

## Assess the source before conversion

```sh
npm run migration:wordpress -- assess --capture .baseline/backups/wp-capture-001 --kit ../private-export/elementor-kit.zip --out .baseline/backups/wp-assessment-001

# The existing design is intentionally being replaced; no kit is required.
npm run migration:wordpress -- assess --capture .baseline/backups/wp-capture-001 --kit-decision skipped --reason "The existing design will be replaced." --out .baseline/backups/wp-assessment-002
```

Review `report.md` and `assessment.json`: every record has a proposed disposition, body/field decisions, taxonomy/custom-field coverage and language signals. Nonpublished records remain private. Candidate and planned outcomes are not proof of successful import. Counts, media failures and source coverage remain explicit even for incomplete captures. With `--stage <static-plan-directory>`, the assessment also shows planned routes, assets and explicit exclusions. Plans include their own assessment even if this separate step was omitted; pass `--assessment <assessment-directory>` to bind a supplied kit/skip decision to that plan's capture.

The exporter includes post metadata by default; Elementor analysis reads `_elementor_data` when present. The analyzer recovers candidate text and image/link references from common heading, text, image, button, list and gallery widgets. Unknown add-on widgets, dynamic fields and template references remain explicit review work. Candidate HTML is an escaped content outline for reconstruction, not a publishable layout or complete rich-text conversion. Kit documents remain reference evidence and are not automatically matched to pages by potentially ambiguous template IDs. Static conversion blocks a record when saved HTML is missing substantial Elementor copy/assets or detected builder data is unavailable; recover/rebuild it or explicitly exclude it from generic conversion. Acknowledging a finding cannot waive that content loss. Native EmDash handoffs report the same recovery requirement for review before importing.

`elementor_library` records are classified as private reference evidence. Static planning retains those templates/settings for native reconstruction and declares their exclusion from ordinary public page routes. A template's WordPress `publish` status does not make it a standalone content page. Dynamic widget behavior, display conditions and the site shell still need deliberate replacements.

Kit input supports a Website Template ZIP or an individual template JSON. ZIP input is limited to 32 MiB; JSON entries to 8 MiB each and 16 MiB combined, with fewer than 10,000 entries and at most 20,000 layout nodes/40 levels per document. ZIP64, encryption, linked/traversing paths, corrupt checksums and unsupported compression are refused. Binary kit assets are not extracted or imported. Use a smaller selected export or a separately reviewed source-reference workflow when these limits do not fit.

## Static and Static + Sveltia output

```sh
# Reads the capture and writes a reviewable plan; leaves the site unchanged.
npm run migration:wordpress -- plan --capture .baseline/backups/wp-capture-001 --out .baseline/backups/wp-plan-001

# Apply after reviewing plan.json, proposed files, routes, media and findings.
npm run migration:wordpress -- apply --stage .baseline/backups/wp-plan-001
```

The plan converts selected published records to native Markdown under `src/content/wordpress/`, registers a typed `wordpress` Content Collection alongside existing collections, and adds a shared renderer and draft-filtered route. It retains source IDs, paths, dates, bylines, locale/translation identifiers and supported SEO values. New paths default to original directory permalinks; query/file-style permalinks need an explicit directory-path mapping and the appropriate redirect. The renderer uses the existing Base, Section, Container, RichText and ResponsiveImage primitives. Site art direction, calibration and rendered acceptance still apply.

Referenced raster images pass through the existing local Sharp preparation workflow before placement in `src/assets/wordpress/`; originals stay in the private capture. WordPress image attachment IDs can resolve a referenced crop to its captured primary image without guessing from filename suffixes. Contextual Markdown alt text and captions remain with the content. Referenced PDFs, MP4s and MP3s use explicit unchanged-URL download assets under `public/wordpress-downloads/`. Unsupported media needs a suitable export. Unused library items and media referenced only by unpublished content are not copied into public output.

Unpublished source records remain in the private capture, rather than being copied into the public repository. Recover them deliberately when needed. Imported published Markdown has a `draft` field; setting it later excludes that route during builds. Static + Sveltia gets a matching collection form while keeping its existing backend, repository and posts form. The imported collection edits existing records; creation stays with the site's established editorial model. Sveltia sign-in and actual save/publication acceptance remain site-specific.

The integration supports a normal exported `collections` object in `src/content.config.ts`, and the generated JSON-formatted `public/admin/config.yml`. Existing spread/computed collection configurations, YAML-formatted Sveltia customizations, existing dynamic route integrations and occupied routes require a deliberate merge. It never overwrites existing content, assets, components or routes. A source homepage commonly conflicts with the existing homepage: rebuild that route using the capture or give the record an explicit mapping. Re-running an import is not an incremental synchronization feature.

### Mapping and review

Use `--mapping ../private-export/mapping.json` with `plan` for intentional changes. Mapping version 1 supports per-record path/title/description or a concrete exclusion reason, and per-media preparation overrides:

```json
{
  "version": 1,
  "records": {
    "page:10": { "excludeReason": "The existing homepage will be rebuilt from the captured source." },
    "post:25": { "path": "/news/example/", "description": "Reviewed source description." }
  },
  "media": {
    "31": { "preset": "preserve", "reason": "Reviewed official SVG artwork; preserve its original vector bytes." }
  }
}
```

Use the actual keys in `snapshot.json`; IDs above are examples. SVG/animation preservation needs explicit review and does not sanitize SVG. Remapped paths are retained in `plan.json`; add and verify the required 301 redirects using the hosting platform's routing configuration. Capture/map files remain private.

Supported prose, headings, lists, links, code, images and captions become Markdown. Tables, shortcodes, dynamic blocks, embedded applications, custom field/model decisions and locale setup generate findings. Raw HTML scripts/forms are not published; their source stays in the capture for reconstruction. Missing images and invalid required content block apply. The converter does not recreate Elementor layouts, plugin behavior, forms, comments or navigation automatically.

Review each finding against the actual source. Required behavior must be implemented before marking it resolved; a review reason can also record an agreed retirement. Apply accepts `--review ../private-export/review.json` only when every reviewable finding has a concrete reason bound to the exact plan SHA-256 printed by `plan`:

```json
{
  "planSHA256": "THE_EXACT_PRINTED_PLAN_SHA256",
  "findings": [
    { "id": "THE_FINDING_ID_FROM_PLAN_JSON", "reason": "The old embedded form is replaced by the agreed contact workflow." }
  ]
}
```

No review can bypass a blocked missing-media finding. Exit 1 from planning means findings need review; a written plan is still available for inspection. A plan with only supported content exits 0. Application rechecks bundle hashes, target profile and all existing file hashes before any writes. It takes a local lock and retains originals in the private plan; caught failures roll back files that still match this operation's output. A process crash is not a filesystem-wide transaction: `apply-started.json` without `apply-complete.json` requires inspection and recovery from the retained before-bytes before another attempt. Stop other target-file writers during application.

## EmDash output

In the EmDash foundation use `.emdash/backups/`:

```sh
npm run migration:wordpress -- plan --capture .emdash/backups/wp-capture-001 --out .emdash/backups/wp-handoff-001
```

This writes `handoff.json` and `native-import.xml`. Prefer the native wizard's exporter connection for its full supported settings/menu/custom-field/SEO behavior. The generated WXR is a snapshot fallback for standard records, HTML, terms, statuses, attachment URLs and raw postmeta; it does not claim full exporter parity. The native importer still downloads media from the source URLs. Local captured files are retained for recovery and review rather than injected through internal database APIs.

Baseline's command performs no CMS writes, schema migration, publication or deployment. Use the native wizard for the EmDash destination; `apply` is for generated static targets only. Preserve the existing CMS migration skill's content-modeling, privacy, media and editor acceptance requirements.

## Generate and run migration acceptance

```sh
# Use the intended public origin separately from a preview/local origin.
npm run migration:wordpress -- acceptance --capture .baseline/backups/wp-capture-001 --stage .baseline/backups/wp-plan-001 --url https://preview.example.test --production-origin https://www.example.test --revision reviewed-target-revision --out .baseline/backups/wp-acceptance-001
npm run migration:verify -- --manifest .baseline/backups/wp-acceptance-001/acceptance.json --scope full
```

This creates a version-2 manifest for Baseline's existing migration verification engine, a per-record review checklist and observations of local planned file hashes when a static stage is supplied. It checks original/mapped routes and expected 301s, linked pages/anchors, media reachability, applicable descriptions/canonicals/indexability and unpublished URL absence. Changed or missing local files remain explicit; planned-file hashes do not certify rendered or deployed parity. Source exclusions remain declared exclusions, not successful page checks. The current HTTP schema allows 500 URL entries; use separately reviewed batches for larger sites.

On EmDash, omit `--stage` and supply reviewed post-import paths/metadata with `--mapping <acceptance-mapping.json>`. Static mappings can also refine expectations. This is a separate acceptance mapping, not the conversion mapping: version 1 accepts `records` keyed by source identity, with `path`, `excludeReason`, exact rendered `title`, `description`, `canonical`, literal `fragments` IDs or an `unpublishedPath`. An exclusion cannot also set page expectations. Declare a target CDN with repeated `--asset-origin <exact-origin>`; no external asset origins are inferred. Retired pages needing a 410 and complex redirect chains require a reviewed manifest refinement using the [acceptance contract](migration-acceptance.md).

Full scope keeps content reconciliation, editor save/publication and design/interaction acceptance **unverified** until their bound evidence is supplied; an HTTP pass alone cannot complete migration acceptance. `--scope url` checks only HTTP expectations. The [acceptance guide](migration-acceptance.md) describes evidence observations/replay and the [inventory guide](migration-content-inventories.md) describes version-3 automated inventory reconciliation when independently collected target inventories are available. The generated version-2 manifest deliberately does not fabricate target inventories from proposed files. Default results are retained under the profile's ignored state directory (`.baseline/backups/migration-acceptance/` or `.emdash/migration-acceptance/`). Keep source captures, kit decisions, mappings, reports and relevant rendered evidence through the eventual migration and cutover; use new named run directories rather than deleting the rehearsal archive.

## Verify and adopt

Before launch reconcile source records, explicit exclusions, original/mapped URLs and media references; finish navigation, redirects, custom fields, unsupported blocks and language behavior. Run the installed profile's verification/build commands, inspect actual imported routes and images, and verify unpublished routes remain absent. A successful conversion is not full-site migration acceptance.

New generated static projects ship the portable source/assessment/conversion tools and `migration:verify`, this guide and development-only parser dependencies. Existing sites need reviewed additive adoption of the complete `scripts/wordpress-*.mjs` set; `scripts/migration-{local,verify,http,html,report,content}.mjs`; both `standards/schemas/migration-*.mjs` contracts; image preparation helpers if missing; the two npm scripts; and `parse5`, `parse-srcset`, `jsonc-parser`, `saxes`, `typescript` and `sharp` as development dependencies using canonical Baseline versions and an updated site lockfile. Copy their corresponding acceptance/inventory docs and regression coverage as a reviewed set. Bounded `sync:baseline` cannot add scripts, dependencies or new file membership automatically. No EmDash package is needed in a static project.

Source contracts: [EmDash WordPress migration](https://docs.emdashcms.com/migration/from-wordpress/), [content import](https://docs.emdashcms.com/migration/content-import/), [first-party exporter](https://github.com/emdash-cms/wp-emdash/tree/main/plugins/emdash-exporter). Reviewed against exporter 1.2.0 and the installed EmDash 1.3.0 source on 27 October 2026. Live client WordPress access and external hosting acceptance require their own site-specific evidence.
