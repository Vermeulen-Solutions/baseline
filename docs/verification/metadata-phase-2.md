# Phase 2: static metadata and structured data

The static and static-sveltia profiles now resolve metadata at build time through one model. `SiteShell` owns the document, charset, viewport and title; static `Base` selects `metadataOwner="platform"` and supplies `StaticMetadata` through the existing head slot. EmDash keeps its supported `EmDashHead` pipeline.

## Configuration and behavior

- Set `SITE_URL` to the deployed HTTP(S) origin. Configure deployment `base`, `trailingSlash` and `build.format` once in `src/config/routing.ts`; Astro config and metadata use that same object. The default is directory output with trailing slashes. If `SITE_URL` includes a path, it must match the configured base.
- Edit `src/config/site.ts` for site identity, language, navigation, and optional default social image or real default author. Page metadata overrides those defaults. An identical page/site title is emitted once.
- Default canonicals preserve pathname case and deployment base and omit tracking queries and fragments. An explicit canonical can retain another HTTP(S) origin and a meaningful query; its fragment is removed. Relative explicit canonicals resolve against the configured public site root. Use `canonical={null}` to omit canonical and structured data.
- Without `SITE_URL`, canonical, URL-dependent graphs and relative social images are omitted. The build/preview origin never becomes a public fallback. Explicit absolute canonical/image URLs remain usable.
- Posts emit article social metadata and a `BlogPosting` with the existing publication date. Their native hero supplies the same absolute image URL to OpenGraph, Twitter and JSON-LD. Dimensions and MIME type come from Astro's imported image metadata. An optional site image supplies the fallback; `image={null}` disables it. Unknown dimensions/type remain omitted.
- Optional real author/update facts can be supplied by a custom route. The shipped Markdown schema has no author/update fields, so the starter does not fabricate them or require a content migration. Sveltia's paired form is unchanged.
- Ordinary website routes emit the site's `WebSite` identity. No breadcrumbs, organization/publisher identity, alternate languages, or generated OG image service is inferred. The 404 emits `noindex, nofollow` without canonical/schema.

HTML/schema language remains the configured language tag. OpenGraph locale is emitted only for a known language-region pair, such as `en-GB` → `en_GB`; the language-only starter value does not invent a territory. A plain author name is used in schema, without treating it as an OpenGraph profile URL. These follow the [Open Graph locale and article property types](https://ogp.me/).

`src/lib/json-ld.ts` escapes HTML delimiters and Unicode line separators before the renderer uses `set:html` in a nonexecutable `application/ld+json` script. An HTML-parser test proves that hostile editorial text round-trips inside one inert script without creating an image or another script node.

## Verification

```powershell
node --test tests/static-metadata.test.mjs
npm run verify
npm run build
npm run test:profiles
```

The root test imports the same ten tests installed as `tests/metadata.test.mjs` in each generated static project. `parse5` is an explicit development dependency in those profiles, sourced from the root version inventory; it adds no public runtime. The ordinary generated `verify` command already discovers these tests.

The completed independent run passed 12 tests in `static` and 13 in `static-sveltia`; each checked 30 Astro files with zero errors, warnings or hints. Both passed clean installation, normal and fixture builds, release isolation and HTTP acceptance. [Rendered synthetic receipts](../../audit/verification/metadata-phase-2-profiles.json) retain the observed canonical/type/image/schema values, including error policy.

The profile rehearsal independently installs and clean-installs each generated project, runs verify/build/release checks and creates the separate fixture build. Its dev request uses `/_styleguide/` to match the configured trailing-slash policy; Astro rejects the other form during development. Release checks retain both forms. It sets a synthetic public `SITE_URL`, then parses actual production HTML for home, listing, Post and missing routes, including tracking-query requests. It fetches the emitted social image and compares its real dimensions. A synthetic draft, created only inside each disposable project, must be absent from routes and listings. The owned fixture gets its own exact art-gate hash exception.

For the optional pilot against an already built generated project, provide the same public URL used for its build:

```powershell
node tests/static-pilot.integration.mjs --root C:/dev/my-site --site-url https://my-site.example
```

Omit `--site-url` only for a build that omitted `SITE_URL`. The pilot exercises the starter's default routes/output. The pure model additionally covers base, file/preserve pathname and slash policies. Neither test configures redirects or certifies a hosting provider. Missing paths still require real HTTP 404 handling. Browser/assistive-technology checks and credentialed Sveltia publishing are outside this phase; browser tests remain optional and local.

The [additional local build receipt](../../audit/verification/metadata-phase-2-variants.json) records directory output under `/studio/`, file output with `.html` links, and an unconfigured public URL. Each case was built from a fresh current static assembly, reusing a separately installed static dependency tree through a temporary junction. Checks parsed the emitted Post canonical/schema, checked home links and the real image asset on disk, and rejected preview-host leakage. Each sampled Post retained only the existing 365-byte inline image-recovery module; metadata adds inert JSON, not an executable module. The dependency junction and owned variant tree were removed.

To repeat those build cases, generate a disposable static project, install its dependencies, edit `src/config/routing.ts` with each receipt's base/slash/format values, and build with the listed canonical's public origin (`/studio/` may also be included in `SITE_URL`). For the unconfigured case unset `SITE_URL`. Inspect `dist/posts/welcome/index.html` for directory output or `dist/posts/welcome.html` for file output, and `dist/index.html` for links.

## Existing generated-site adoption

This is an additive template change, not an automatic downstream upgrade. `sync:baseline` retains the installed site's bounded membership and dependencies. Do not hand-edit its receipt to expand that trust boundary.

1. Stage/review the backward-compatible shared `SiteShell` update through the installed sync process if the ownership prop is absent.
2. Explicitly copy/review the new `src/config/routing.ts`, `src/lib/metadata.ts`, `src/lib/json-ld.ts`, `src/components/StaticMetadata.astro` and `tests/metadata.test.mjs` from a newly generated project at the chosen Baseline revision.
3. Add `parse5` as a dev dependency at that revision's root package version, update the site's own lockfile, and run `npm ci`. Do not copy EmDash's lockfile.
4. Merge the `astro.config.mjs` routing import/spread with the site's actual configuration. Adapt its client-owned `site.ts` and `Base.astro` to resolve one metadata object and render one owner. Preserve local navigation, head contributions, content ownership and calibrated CSS.
5. Adapt Post image/date inputs and error indexing policy to the local schema; retain its publication filter. Review base-aware route links separately. No schema or Sveltia form change is necessary for the shipped schema.
6. Run local verify/build, inspect rendered metadata at the real deployment base, and check the configured host's 404 and redirect behavior. Existing sites have their own art-direction record; infrastructure exception hashes from this starter are not permission to exempt client page implementation.

Revert these wrapper/config/model additions together to roll back. No database, content migration or theme recalibration is involved. Current results and hashes are recorded in the [progress ledger](../../audit/architecture-implementation-progress.md) and [Phase 2 receipt](../../audit/verification/metadata-phase-2-checks.json).
