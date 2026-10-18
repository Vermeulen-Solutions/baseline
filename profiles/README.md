# Platform Profiles

Baseline has two technical foundations and three user-facing Platform Profiles:

| Profile ID | Foundation | Runtime | Editorial ownership |
| --- | --- | --- | --- |
| `static` | `static` | `static` | Developer/agent edits Astro Content Collection files |
| `static-sveltia` | `static` | `static` | Same files through Sveltia; OAuth proxy or PAT |
| `emdash` | `emdash` | `node-sqlite` or `cloudflare-d1-r2` | Relational CMS, live editing and MCP |

These are independent of Standard/Express workflow tracks. The existing root
EmDash application is still the runnable baseline. Cloudflare retains its
unverified status. **Static and static-sveltia generation are available.** EmDash
generation stays disabled; the existing full EmDash root/template is its entry point.
Sveltia adds admin assets, its authentication/media guide and a paired-form test,
with no additional npm dependencies.

```sh
npm run init:profile -- --profile static --out C:/dev/my-static-site --dry-run
npm run init:profile -- --profile static --out C:/dev/my-static-site
# Or: --profile static-sveltia
```

Use a new or empty destination with an existing parent directory. The generator
refuses overlapping source/destination paths, populated directories and symlinks.
It performs no installation or Git mutation. In the generated project run
`npm install` to create its own lockfile, then `npm run verify`, `npm run build`
and `npm run check:dev-tools`. Commit the new lockfile and use `npm ci` afterward.
No EmDash lockfile, database, credentials or server adapter is copied.

## Contract and inventories

- `baseline.config.schema.json` describes the generated
  `baseline.config.json`: schema version, selected profile/foundation/runtime,
  immutable source repository/commit and optional release, generator version,
  features, required checks and selected skills. It contains no credentials.
- `contract.mjs` validates that contract, including exact profile check/skill
  membership, and resolves profile manifests without writing, installing or
  contacting an external service.
- `manifests/shared.json` is the canonical shared file/package allowlist.
  `static.json` and `emdash.json` extend it; `static-sveltia.json` extends static.
- `file-inventory.json` classifies the current source, script, unit-test and
  configuration surface. `dependency-inventory.json` accounts for every direct
  root dependency. Versions are resolved from root `package.json`, not duplicated.
- `overrides` are exact source-to-target mappings for the static project overlay.
  `pending` entries describe unimplemented assembly work, not shipped
  capabilities. A pending file is **not** authorized for copying into a static site.

Assembly copies only the resolved manifest's explicit `files`, `skillFiles` and
`overrides`. Package definitions, profile instructions, provenance and exact
design-gate exceptions are generated from the selected profile.
Everything unlisted is omitted. Never copy `.git`, `node_modules`, `.env*` (apart
from a generated example), `.mcp.json`, `data.db*`, `uploads`, `.emdash` local state,
build output, old audit evidence or visual baselines.

Static excludes seeds, live collections, EmDash declarations, database/media
migration tooling, schema-budget npm hooks, server start commands, CMS skills,
CMS endpoints, React and server adapters. Shared scripts that still assume these
are classified `adapt-before-static`, not silently treated as portable.

## Presentation boundary

`src/layouts/SiteShell.astro` owns the document, metadata, skip link, main landmark
and global CSS. Named `head`, `body-start`, `header`, `footer`, `body-end` slots
accept platform contributions. The existing `Base.astro` remains the EmDash
wrapper: queries, cache hints, menus, widgets, search and page contribution context
stay there. The static overlay supplies file-owned site configuration and native
Content Collections without replacing the EmDash root routes.

`Card.astro` takes Astro HTML attribute bags for the existing `titleEdit`,
`descriptionEdit` and `actionEdit` props; EmDash annotations still pass through,
but the shared component imports no CMS type. Its `image` convenience prop accepts
native Astro ImageMetadata or a URL with `imageWidth`/`imageHeight`. For CMS storage
references, resolve the source in a platform component or put `EmDashImage` in
the Card's `media` slot.

`ResponsiveImage.astro` accepts native Astro ImageMetadata or a resolved URL and
dimensions. It uses `getImage()` with bounded responsive widths, preserves small
images, and keeps original-source recovery. It does not read Astro request URLs,
locals, databases or CMS storage. `EmDashImage.astro` owns storage/public URL
resolution through the existing `image-source.ts`; editorial images and galleries
use that adapter. Public legacy image URLs keep their original fallback URL.

`Styleguide.astro` and its neutral fixtures own the common specimens.
`EmDashStyleguide.astro` supplies Portable Text and gallery extensions. Development
injects the route; static fixture builds prerender it. Normal builds omit the
route entirely for both foundations. Fixture artifacts remain nondeployable.

Only one shared CSS/token/component source is maintained. Downstream
`sync:baseline` stages immutable source updates within installed membership;
client content/routes/settings/admin config stay excluded and changed token
calibration is preserved as a conflict. See [update behavior](../docs/baseline-updates.md).
Generated workflows perform clean static verification and upload reviewed update
proposals without direct pushes. The generated `.baseline/managed-files.json` records
exact source/output hashes and a dirty-source flag, so a working-tree assembly
does not pretend its files exactly match the base Git commit.

## Verification

`npm test` includes contract, inventory and presentation-boundary regressions.
`npm run test:profiles` independently generates, installs, clean-installs, verifies,
builds and HTTP-checks both static profiles. Root CI runs that as a profile matrix.
`npm run verify` continues to validate the existing EmDash root. After independently
installing and building a generated project and running `fixtures:build`, use
`node tests/static-pilot.integration.mjs --root <generated-directory> --browser`
from Baseline for optional local HTTP/browser verification. This checks production
404 isolation, native Markdown, image loading, keyboard focus and narrow reflow;
it does not certify static hosting providers or replace local visual baselines.
